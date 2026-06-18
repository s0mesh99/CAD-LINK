import re
from scrapers.duckduckgo_search import DuckDuckGoScraper

class DorkEnrichmentScraper:
    def __init__(self):
        self.ddg = DuckDuckGoScraper()
        
    def find_email(self, domain: str) -> dict:
        """
        Dorks DuckDuckGo for emails on a specific domain without hitting their server.
        """
        extracted = {
            'email_1': None,
            'email_2': None,
            'phone': None,
            'contact_name': None,
            'contact_title': None,
            'method': 'dorking'
        }
        
        # Strip protocols for the query
        clean_domain = domain.replace('https://', '').replace('http://', '').replace('www.', '').strip().strip('/')
        
        queries = [
            f'"{clean_domain}" email OR contact "*@{clean_domain}"',
            f'contact info "*@{clean_domain}"',
            f'site:{clean_domain} email'
        ]
        
        emails_found = set()
        phones_found = set()
        
        for q in queries:
            results = self.ddg.search(q, max_results=10, retries=1)
            for res in results:
                snippet = res.get('body', '') + " " + res.get('title', '')
                
                # Regex for emails
                found_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', snippet)
                for email in found_emails:
                    email = email.lower()
                    # Only accept if it actually matches their domain to prevent junk
                    if clean_domain in email and not email.endswith(('.png', '.jpg', '.gif', '.js', '.css', '.webp')):
                        emails_found.add(email)
                
                # Extremely basic phone regex
                found_phones = re.findall(r'\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}', snippet)
                for phone in found_phones:
                    if len(re.sub(r'\D', '', phone)) >= 8:
                        phones_found.add(phone.strip())
                        
            if len(emails_found) >= 2:
                break
                
        if emails_found:
            emails_list = list(emails_found)
            # Prioritize standard info@ or contact@ emails
            emails_list.sort(key=lambda e: 0 if any(x in e for x in ['info@', 'contact@', 'sales@', 'hello@', 'admin@']) else 1)
            
            extracted['email_1'] = emails_list[0]
            if len(emails_list) > 1:
                extracted['email_2'] = emails_list[1]
                
        if phones_found:
            extracted['phone'] = list(phones_found)[0]
                
        return extracted
