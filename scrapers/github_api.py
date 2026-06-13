import requests
import re
import base64
from scrapers.base_scraper import BaseScraper
from utils.user_agents import get_headers

GITHUB_SEARCH_API = "https://api.github.com/search/code"

QUERIES = [
    'extension:csv "EPC" "company"',
    'extension:csv "structural engineering" "email"',
    'extension:csv "civil engineering" "contact"',
    'extension:json "construction companies"',
    'extension:md "EPC companies" "email"',
    'extension:csv "oil and gas" "vendor list"',
]

EMAIL_RE = re.compile(r'\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b')
DOMAIN_RE = re.compile(r'(?:https?://)?(?:www\.)?([a-zA-Z0-9\-]+\.[a-zA-Z]{2,})')

class GithubApiScraper(BaseScraper):
    def __init__(self):
        super().__init__('github_api', min_delay=5.0, max_delay=10.0)
        
    def _search_github(self, query):
        self.limiter.wait(context="github_api")
        try:
            import os
            token = os.environ.get('GITHUB_TOKEN')
            if not token:
                self.log.warning("GITHUB_TOKEN not found. Skipping GitHub Code Search.")
                return []
                
            headers = {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': f'token {token}'
            }
            r = requests.get(
                GITHUB_SEARCH_API, 
                params={'q': query, 'per_page': 10}, 
                headers=headers,
                timeout=15
            )
            
            if r.status_code == 403:
                self.log.warning("GitHub API rate limit hit (403).")
                return []
                
            if r.status_code != 200:
                self.log.warning(f"GitHub returned {r.status_code}")
                return []
                
            data = r.json()
            return data.get('items', [])
        except Exception as e:
            self.log.error(f"GitHub API error: {e}")
            return []

    def _fetch_file_content(self, raw_url):
        self.limiter.wait(context="github_raw")
        try:
            r = requests.get(raw_url, timeout=15)
            if r.status_code == 200:
                return r.text
        except Exception as e:
            self.log.error(f"Error fetching raw file: {e}")
        return ""

    def process_file_content(self, text, url):
        emails = list(set(EMAIL_RE.findall(text)))
        domains = list(set(DOMAIN_RE.findall(text)))
        
        # Filter out generic or invalid domains
        bad_domains = ['github.com', 'google.com', 'yahoo.com', 'gmail.com', 'hotmail.com', 'outlook.com', 'example.com']
        
        extracted = 0
        for email in emails:
            if any(email.lower().endswith(bd) for bd in bad_domains):
                continue
                
            domain = email.split('@')[1].lower()
            
            if not self.domain_exists(domain):
                # We found a business email in an OSINT dataset!
                self.insert_company({
                    'name': domain.split('.')[0].capitalize() + ' (OSINT)',
                    'domain': domain,
                    'email': email,
                    'sector': 'epc',
                    'source_method': 'github_osint',
                    'source_url': url,
                    'notes': f"Extracted from public GitHub dataset"
                })
                extracted += 1
                
        return extracted

    def run(self):
        self.log.info("Starting GitHub API OSINT Scraper...")
        for query in QUERIES:
            self.log.info(f"Searching GitHub for: {query}")
            items = self._search_github(query)
            
            for item in items:
                # To get the raw content, we convert the html_url to raw.githubusercontent.com
                # Format: https://github.com/user/repo/blob/master/file.csv
                # To: https://raw.githubusercontent.com/user/repo/master/file.csv
                html_url = item.get('html_url', '')
                raw_url = html_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
                
                if raw_url:
                    text = self._fetch_file_content(raw_url)
                    if text:
                        found = self.process_file_content(text, html_url)
                        if found > 0:
                            self.log.info(f"Found {found} OSINT leads in {item.get('name')}")
                            
        self.log_run("ok")
