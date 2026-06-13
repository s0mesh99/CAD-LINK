import re
import time
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class EmailEnricher:
    def __init__(self, max_workers=10):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        self.email_regex = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
        self.max_workers = max_workers

    def enrich(self, records):
        """Enrich a list of company records with email addresses."""
        print(f"\n> Starting Email Enrichment on {len(records)} records...")
        
        enriched_records = []
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_record = {executor.submit(self.process_record, record): record for record in records}
            
            completed = 0
            for future in as_completed(future_to_record):
                completed += 1
                try:
                    enriched_record = future.result()
                    enriched_records.append(enriched_record)
                    if completed % 20 == 0:
                        print(f"  [Enrichment Progress] {completed}/{len(records)} domains checked...")
                except Exception as e:
                    record = future_to_record[future]
                    print(f"  [Error] Failed to enrich {record['name']}: {e}")
                    enriched_records.append(record)

        return enriched_records

    def process_record(self, record):
        """Scrape the domain for emails. Fallback to smart guesses if failed."""
        if record.get("email"):
            return record # Already has email
            
        domain = record.get("domain")
        if not domain:
            return record
            
        found_emails = self.scrape_domain_for_emails(domain)
        
        if found_emails:
            # Prefer info, contact, hr, careers
            prioritized = self.prioritize_emails(list(found_emails), domain)
            record["email"] = prioritized[0] if prioritized else list(found_emails)[0]
        else:
            # Smart fallback guesses
            record["email"] = f"info@{domain}"
            record["notes"] = f"{record.get('notes', '')} | Email guessed"
            
        return record

    def scrape_domain_for_emails(self, domain):
        """Visits homepage and /contact, /careers looking for emails."""
        emails = set()
        urls_to_check = [
            f"https://www.{domain}",
            f"http://www.{domain}",
            f"https://www.{domain}/contact",
            f"https://www.{domain}/contact-us",
            f"https://www.{domain}/careers"
        ]
        
        for url in urls_to_check:
            try:
                response = requests.get(url, headers=self.headers, timeout=5, verify=False)
                if response.status_code == 200:
                    # 1. Parse mailto links
                    soup = BeautifulSoup(response.text, 'html.parser')
                    for a in soup.find_all('a', href=True):
                        if a['href'].startswith('mailto:'):
                            email = a['href'].replace('mailto:', '').split('?')[0].strip()
                            if self.is_valid_email(email, domain):
                                emails.add(email)
                                
                    # 2. Parse raw text
                    raw_emails = self.email_regex.findall(response.text)
                    for email in raw_emails:
                        if self.is_valid_email(email, domain):
                            emails.add(email)
                            
                    if emails:
                        break # Stop checking subpages if we found something
            except Exception:
                continue # Skip timeout/ssl errors
                
        return emails
        
    def is_valid_email(self, email, domain):
        email = email.lower()
        if email.endswith(('.png', '.jpg', '.jpeg', '.gif', '.css', '.js')):
            return False
        if "sentry" in email or "example" in email or "test" in email:
            return False
        return True

    def prioritize_emails(self, emails, domain):
        """Sorts emails placing contact, info, hr, careers first."""
        priorities = ['career', 'hr', 'contact', 'info', 'hello', 'enquir', 'sales']
        sorted_emails = []
        for p in priorities:
            for e in emails:
                if p in e.lower() and e not in sorted_emails:
                    sorted_emails.append(e)
        for e in emails:
            if e not in sorted_emails:
                sorted_emails.append(e)
        return sorted_emails
