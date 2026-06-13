import re, socket, smtplib, dns.resolver, logging
from itertools import product

def parse_name(full_name: str) -> tuple:
    """
    'Ahmed Al Rashid' -> ('ahmed', 'alrashid', 'al', 'rashid')
    Returns (first, last, last_part1, last_part2)
    Handles hyphenated, Arabic, Indian multi-part names.
    """
    parts = full_name.lower().strip().split()
    if not parts:
        return ('', '', '', '')
    first = parts[0]
    last  = ''.join(parts[1:]) if len(parts) > 1 else ''
    last_p1 = parts[1] if len(parts) > 1 else ''
    last_p2 = parts[-1] if len(parts) > 2 else ''
    return first, last, last_p1, last_p2

def generate_email_candidates(full_name: str, domain: str) -> list:
    """
    Given a name and domain, generate all plausible email patterns.
    Returns list of (email, confidence_weight) tuples.
    Most common patterns first (by global frequency).
    """
    f, l, lp1, lp2 = parse_name(full_name)
    if not f or not domain:
        return []

    fi = f[0]   # first initial
    li = l[0] if l else ''  # last initial

    # Ordered by frequency in corporate email usage
    patterns = [
        (f"{f}.{l}@{domain}",     5),  # john.smith
        (f"{f}@{domain}",         4),  # john
        (f"{f}{l}@{domain}",      4),  # johnsmith
        (f"{fi}{l}@{domain}",     4),  # jsmith
        (f"{f}_{l}@{domain}",     3),  # john_smith
        (f"{f}.{lp2}@{domain}",   3),  # john.smith (last part)
        (f"{fi}.{l}@{domain}",    3),  # j.smith
        (f"{l}.{f}@{domain}",     2),  # smith.john
        (f"{l}@{domain}",         2),  # smith
        (f"{f}{li}@{domain}",     2),  # johns
        (f"{f}-{l}@{domain}",     1),  # john-smith
        (f"info@{domain}",        1),  # fallback generic
    ]

    # Filter out patterns with empty segments
    return [(em, w) for em, w in patterns
            if '@' in em and '.@' not in em
            and em[0] != '@' and '--' not in em
            and '__' not in em and len(em) > 5]

def detect_email_pattern(domain: str) -> str:
    """
    Visit company website and find any real email on the page.
    Extract the pattern from it.
    Returns pattern string like 'firstname.lastname' or 'f.lastname'
    """
    import requests
    from utils.user_agents import get_headers

    pages = [f"https://{domain}/contact",
             f"https://{domain}/about",
             f"https://{domain}/team",
             f"https://www.{domain}/contact"]

    email_re = re.compile(
        r'\b([a-zA-Z0-9._%+-]+)@' + re.escape(domain) + r'\b'
    )

    for url in pages:
        try:
            r = requests.get(url, headers=get_headers(), timeout=8)
            matches = email_re.findall(r.text)
            # Filter out generic ones
            generic = ['info', 'contact', 'admin', 'hello',
                       'support', 'sales', 'hr', 'careers']
            personal = [m for m in matches if m.lower() not in generic]
            if personal:
                return personal[0]  # Return the local part
        except:
            continue
    return ''

def smtp_ping(email: str, timeout: int = 5) -> bool:
    """
    Verify email existence via SMTP handshake.
    Does NOT send any email. Just checks if mailbox exists.
    Returns True if likely valid, False if definitely invalid.
    """
    domain = email.split('@')[1]
    try:
        records = dns.resolver.resolve(domain, 'MX')
        mx = str(sorted(records, key=lambda r: r.preference)[0].exchange)

        with smtplib.SMTP(mx, 25, timeout=timeout) as smtp:
            smtp.ehlo('verify.local')
            smtp.mail('verify@verify.local')
            code, _ = smtp.rcpt(email)
            return code == 250
    except Exception:
        return False  # Can't verify — don't penalise

def assign_contact_confidence(company: dict, email: str,
                               smtp_result: bool,
                               pattern_confirmed: bool) -> int:
    """
    5 = named person + smtp confirmed valid
    4 = named person + pattern confirmed from same domain
    3 = named person + common pattern, domain active
    2 = named person + generic info@ email
    1 = company only, no named contact
    """
    if not company.get('contact_name'):
        return 1
    if smtp_result:
        return 5
    if pattern_confirmed:
        return 4
    if email and '@' in email and 'info' not in email:
        return 3
    if email:
        return 2
    return 1
