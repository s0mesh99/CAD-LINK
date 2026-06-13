import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
from scrapers.base_scraper import BaseScraper
from utils.proxy_rotator import get_random_user_agent
from utils.email_guesser import guess_email_pattern, verify_email_smtp

TITLE_TARGETS = [
    'Head of Engineering',
    'Lead Structural Engineer', 
    'CAD Manager',
    'Design Manager',
    'Project Manager',
    'Engineering Manager',
    'Director of Engineering',
    'Structural Engineering Lead',
    'Civil Engineering Manager',
    'Procurement Manager'
]

class LinkedinPeopleScraper(BaseScraper):
    def __init__(self):
        super().__init__(name="linkedin_people")
        
    def find_decision_makers(self, company_name: str, company_domain: str) -> dict:
        """Finds contacts via Google dork and attempts to guess/verify their email."""
        best_contact = None
        
        for title in TITLE_TARGETS:
            query = f'site:linkedin.com/in "{title}" "{company_name}"'
            encoded_query = quote_plus(query)
            url = f"https://www.google.com/search?q={encoded_query}&num=3"
            
            self.rate_limiter.wait()
            headers = {'User-Agent': get_random_user_agent(), 'Accept-Language': 'en-US,en;q=0.9'}
            
            try:
                resp = requests.get(url, headers=headers, timeout=10)
                
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    
                    for h3 in soup.find_all('h3'):
                        result_title = h3.text
                        if '-' in result_title and company_name.lower() in result_title.lower():
                            parts = result_title.split('-')
                            if len(parts) >= 2:
                                name = parts[0].strip()
                                found_title = parts[1].strip()
                                
                                if 'LinkedIn' in name or '...' in name:
                                    continue
                                    
                                a_tag = h3.find_parent('a')
                                best_contact = {
                                    'contact_name': name,
                                    'contact_title': found_title,
                                    'contact_linkedin_url': a_tag['href'] if a_tag else None
                                }
                                break
            except Exception as e:
                print(f"      [LinkedInPeople] Google search error: {e}")
                
            if best_contact:
                break
                
        if not best_contact or not company_domain:
            return best_contact
            
        print(f"      [LinkedInPeople] Found decision maker: {best_contact['contact_name']} at {company_name}")
        
        # Guess and verify email
        candidates = guess_email_pattern(company_domain, best_contact['contact_name'])
        best_email = None
        
        for email in candidates:
            print(f"        [SMTP Ping] Testing {email}...")
            is_valid = verify_email_smtp(email)
            if is_valid is True:
                best_email = email
                best_contact['contact_confidence'] = 5
                break
        
        if best_email:
            best_contact['contact_email'] = best_email
            print(f"      [LinkedInPeople] SUCCESS! Verified email via SMTP: {best_email}")
        else:
            if candidates:
                best_contact['contact_email'] = candidates[1] if len(candidates) > 1 else candidates[0]
                best_contact['contact_confidence'] = 2
                print(f"      [LinkedInPeople] Could not verify via SMTP. Falling back to guess: {best_contact['contact_email']}")
                
        return best_contact
