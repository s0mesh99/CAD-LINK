import re
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

PAGES_TO_CHECK = [
    '', '/contact', '/contact-us', '/about', '/about-us'
]

EMAIL_REGEX = r'[a-zA-Z0-9._%+-]+(?:\s*\[at\]\s*|\s*@\s*)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'

def extract_emails_from_html(html: str) -> set:
    emails_found = set()
    emails = re.findall(EMAIL_REGEX, html, re.IGNORECASE)
    for email in emails:
        # Clean up obfuscated emails like info [at] domain.com
        clean_email = re.sub(r'\s*\[at\]\s*', '@', email).replace(' ', '').lower()
        if not clean_email.endswith(('.png', '.jpg', '.jpeg', '.gif', '.css', '.js', '.webp', '.svg')):
            emails_found.add(clean_email)
    return emails_found

def extract_phones_from_html(html: str) -> set:
    phones_found = set()
    phones = re.findall(r'\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}', html)
    for phone in phones:
        clean_phone = re.sub(r'\D', '', phone)
        if len(clean_phone) >= 8 and len(clean_phone) <= 15:
            phones_found.add(phone.strip())
    return phones_found

def extract_from_website(domain: str) -> dict:
    """
    Intelligently extracts emails, phone numbers using a hybrid architecture.
    Attempts fast `requests` first. If blocked by Cloudflare (403), falls back to Playwright.
    """
    if not domain.startswith('http'):
        base_url = f"https://{domain}"
    else:
        base_url = domain
        
    extracted_data = {
        'email_1': None,
        'email_2': None,
        'phone': None,
        'contact_name': None,
        'contact_title': None,
        'method': 'requests'
    }
    
    emails_found = set()
    phones_found = set()
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    use_playwright = False

    # FAST PATH: Using Requests
    for path in PAGES_TO_CHECK:
        url = urljoin(base_url, path)
        try:
            r = requests.get(url, headers=headers, timeout=5, verify=False)
            # Detect Cloudflare or similar blocks
            if r.status_code in [403, 503] or 'cloudflare' in r.text.lower() or 'just a moment' in r.text.lower():
                use_playwright = True
                break
            
            if r.status_code == 200:
                html = r.text
                emails_found.update(extract_emails_from_html(html))
                phones_found.update(extract_phones_from_html(html))
                
                # Check mailto: links in ahref
                soup = BeautifulSoup(html, 'html.parser')
                for a in soup.find_all('a', href=True):
                    href = a['href']
                    if href.startswith('mailto:'):
                        email = href.replace('mailto:', '').split('?')[0].strip().lower()
                        if '@' in email:
                            emails_found.add(email)

            if len(emails_found) >= 2:
                break
        except Exception as e:
            continue

    # FALLBACK PATH: Using Playwright if Requests was blocked
    if use_playwright and not emails_found:
        extracted_data['method'] = 'playwright'
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    ignore_https_errors=True
                )
                page = context.new_page()
                page.set_default_timeout(10000)
                
                for path in PAGES_TO_CHECK:
                    url = urljoin(base_url, path)
                    try:
                        page.goto(url, wait_until="domcontentloaded")
                        # Only wait if it looks like a challenge page
                        if 'cloudflare' in page.content().lower() or 'just a moment' in page.content().lower():
                            page.wait_for_timeout(3000)
                            
                        html = page.content()
                        emails_found.update(extract_emails_from_html(html))
                        phones_found.update(extract_phones_from_html(html))
                        
                        try:
                            mailto_links = page.locator("a[href^='mailto:']").all()
                            for link in mailto_links:
                                href = link.get_attribute("href")
                                if href:
                                    email = href.replace('mailto:', '').split('?')[0].strip().lower()
                                    if '@' in email:
                                        emails_found.add(email)
                        except:
                            pass
                        
                        if len(emails_found) >= 2:
                            break
                    except Exception as e:
                        continue
                browser.close()
        except Exception:
            pass
            
    if emails_found:
        emails_list = list(emails_found)
        emails_list.sort(key=lambda e: 0 if any(x in e for x in ['info@', 'contact@', 'sales@', 'hello@', 'admin@']) else 1)
        extracted_data['email_1'] = emails_list[0]
        if len(emails_list) > 1:
            extracted_data['email_2'] = emails_list[1]
            
    if phones_found:
        extracted_data['phone'] = list(phones_found)[0]
        
    return extracted_data
