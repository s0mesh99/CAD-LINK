import re

def extract_name_and_title_from_linkedin_title(page_title: str) -> tuple:
    """
    LinkedIn profile page titles follow this pattern:
    'Ahmed Al Rashid - Head of Engineering at Petrofac | LinkedIn'
    'Sarah Connor – CAD Manager at Dodsal Group'

    Returns (full_name, job_title, company_name)
    """
    # Remove LinkedIn suffix
    text = re.sub(r'\s*[\|]\s*LinkedIn.*$', '', page_title).strip()

    # Split on ' - ' or ' – ' or ' | '
    parts = re.split(r'\s+[-–]\s+', text, maxsplit=1)
    if len(parts) < 2:
        return ('', '', '')

    full_name  = parts[0].strip()
    rest       = parts[1].strip()

    # rest = "Head of Engineering at Petrofac"
    at_split   = re.split(r'\s+at\s+', rest, maxsplit=1)
    job_title  = at_split[0].strip() if at_split else rest
    company    = at_split[1].strip() if len(at_split) > 1 else ''

    return (full_name, job_title, company)

def extract_name_from_snippet(snippet: str) -> str:
    """
    DDG/Bing snippets sometimes contain the name in context.
    'John Smith is the Head of Engineering at...'
    Extracts 'John Smith'
    """
    # Look for Title Case words at start of snippet
    match = re.match(r'^([A-Z][a-z]+ (?:[A-Z][a-z]+ )?[A-Z][a-z]+)', snippet)
    return match.group(1) if match else ''

def is_valid_person_name(name: str) -> bool:
    """
    Filters out company names, generic terms masquerading as names.
    A valid name: 2-4 words, each capitalized, no digits, no Inc/Ltd.
    """
    reject = ['engineering', 'group', 'limited', 'inc', 'llc',
              'company', 'services', 'technologies', 'solutions',
              'construction', 'international', 'global', 'corp']
    if not name or len(name) < 4:
        return False
    words = name.split()
    if len(words) < 2 or len(words) > 5:
        return False
    if any(w.lower() in reject for w in words):
        return False
    if any(c.isdigit() for c in name):
        return False
    return all(w[0].isupper() for w in words if w)
