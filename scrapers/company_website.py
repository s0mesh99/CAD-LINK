import requests
import re
from urllib.parse import urljoin
import urllib3
from bs4 import BeautifulSoup
from utils.rate_limiter import RateLimiter
from utils.proxy_rotator import get_random_user_agent

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

PAGES_TO_CHECK = [
    '', '/contact', '/contact-us', '/contacts', '/about', '/about-us',
    '/team', '/our-team', '/people', '/leadership', '/management',
    '/engineering', '/services', '/reach-us', '/get-in-touch',
]

def extract_from_website(domain: str) -> dict:
    """
    Intelligently extracts emails, phone numbers, and potential contacts from a company's website.
    Visits typical contact pages and extracts info using regex.
    """
    rate_limiter = RateLimiter(1, 3)
    if not domain.startswith('http'):
        base_url = f"https://{domain}"
    else:
        base_url = domain
        
    extracted_data = {
        'email_1': None,
        'email_2': None,
        'phone': None,
        'contact_name': None,
        'contact_title': None
    }
    
    emails_found = set()
    phones_found = set()
    
    for path in PAGES_TO_CHECK:
        url = urljoin(base_url, path)
        try:
            rate_limiter.wait()
            headers = {'User-Agent': get_random_user_agent()}
            resp = requests.get(url, headers=headers, timeout=8, verify=False)
            if resp.status_code == 200:
                html = resp.text
                
                # Regex for emails
                emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html)
                for email in emails:
                    if not email.endswith(('.png', '.jpg', '.jpeg', '.gif', '.css', '.js')):
                        emails_found.add(email.lower())
                
                # Basic regex for international phones
                phones = re.findall(r'\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}', html)
                for phone in phones:
                    if len(re.sub(r'\D', '', phone)) >= 8:
                        phones_found.add(phone.strip())
                
                # Stop checking pages if we found enough info
                if len(emails_found) >= 2:
                    break
        except:
            continue
            
    if emails_found:
        emails_list = list(emails_found)
        extracted_data['email_1'] = emails_list[0]
        if len(emails_list) > 1:
            extracted_data['email_2'] = emails_list[1]
            
    if phones_found:
        extracted_data['phone'] = list(phones_found)[0]
        
    return extracted_data
