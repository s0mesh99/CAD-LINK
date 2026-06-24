import requests
import re
import os
import time
from scrapers.base_scraper import BaseScraper

GITHUB_SEARCH_API = "https://api.github.com/search/code"

EMAIL_RE = re.compile(r'\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b')
DOMAIN_RE = re.compile(r'(?:https?://)?(?:www\.)?([a-zA-Z0-9\-]+\.[a-zA-Z]{2,})')

# We build dynamic queries by combining regions and services
REGIONS = [
    'Houston', 'Calgary', 'Denver', 'Louisiana', 'New York', 'Toronto',
    'Dubai', 'Abu Dhabi', 'Dhahran', 'Doha', 'Johannesburg',
    'Aberdeen', 'London', 'Stavanger', 'Rotterdam',
    'Singapore', 'Perth', 'Kuala Lumpur', 'Mumbai', 'Tokyo'
]

SERVICES = [
    'EPC', 'EPC contractor', 'engineering consultancy', 'civil engineering', 'structural engineering',
    'data center construction', 'renewable energy contractor', 'solar farm', 'wind farm', 
    'power plant', 'oil and gas', 'LNG', 'pipeline', 'process plant', 'offshore', 
    'marine engineering', 'fabrication', 'structural steel'
]

class GithubApiScraper(BaseScraper):
    def __init__(self):
        super().__init__('github_api', min_delay=5.0, max_delay=10.0)
        
    def _search_github_page(self, query, page):
        self.limiter.wait(context="github_api")
        try:
            token = os.environ.get('GITHUB_TOKEN')
            if not token:
                return None
                
            headers = {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': f'token {token}'
            }
            r = requests.get(
                GITHUB_SEARCH_API, 
                params={'q': query, 'per_page': 100, 'page': page}, 
                headers=headers,
                timeout=15
            )
            
            if r.status_code == 403:
                self.log.warning("GitHub API rate limit hit (403).")
                # Secondary rate limit or primary limit hit
                if 'Retry-After' in r.headers:
                    sleep_time = int(r.headers['Retry-After'])
                    self.log.warning(f"Sleeping for {sleep_time} seconds as requested by GitHub.")
                    time.sleep(sleep_time + 1)
                else:
                    # Generic rate limit sleep
                    time.sleep(60)
                return 'rate_limited'
                
            if r.status_code == 422:
                # Validation failed (usually means we hit the 1000 result limit for GitHub Search API)
                return 'end_of_results'
                
            if r.status_code != 200:
                self.log.warning(f"GitHub returned {r.status_code}")
                return None
                
            return r.json()
        except Exception as e:
            self.log.error(f"GitHub API error: {e}")
            return None

    def _fetch_file_content(self, raw_url):
        self.limiter.wait(context="github_raw")
        try:
            r = requests.get(raw_url, timeout=15)
            if r.status_code == 200:
                return r.text
        except Exception as e:
            pass
        return ""

    def process_file_content(self, text, url, query=""):
        emails = list(set(EMAIL_RE.findall(text)))
        domains = list(set(DOMAIN_RE.findall(text)))
        
        # Filter out generic or invalid domains
        bad_domains = ['github.com', 'google.com', 'yahoo.com', 'gmail.com', 'hotmail.com', 'outlook.com', 'example.com']
        
        # Determine sector from query
        sector = 'EPC'
        query_lower = query.lower()
        if 'data center' in query_lower:
            sector = 'Data Center Construction'
        elif 'solar' in query_lower or 'wind' in query_lower or 'renewable' in query_lower:
            sector = 'Renewable Energy'
        elif 'oil' in query_lower or 'gas' in query_lower or 'lng' in query_lower or 'pipeline' in query_lower:
            sector = 'Oil and Gas'
        elif 'civil' in query_lower or 'structural' in query_lower:
            sector = 'Civil Engineering'
            
        extracted = 0
        for email in emails:
            if any(email.lower().endswith(bd) for bd in bad_domains):
                continue
                
            domain = email.split('@')[1].lower()
            
            if not self.domain_exists(domain):
                if self.insert_company({
                    'name': domain.split('.')[0].capitalize() + ' (OSINT)',
                    'domain': domain,
                    'email_1': email,
                    'sector': sector,
                    'source_method': 'github_osint',
                    'source_url': url,
                    'notes': f"Extracted from public GitHub dataset"
                }):
                    extracted += 1
                
        return extracted

    def run(self):
        token = os.environ.get('GITHUB_TOKEN')
        if not token:
            self.log.error("GITHUB_TOKEN not found in environment. Cannot run GitHub OSINT.")
            return

        self.log.info("Starting Deep GitHub API OSINT Scraper...")
        
        # Generate queries
        queries = []
        for service in SERVICES:
            for region in REGIONS:
                # Search for CSVs and JSONs containing the keywords
                queries.append(f'extension:csv "{service}" "{region}"')
                queries.append(f'extension:json "{service}" "{region}"')
                
        # Also add some generic high-yield queries
        queries.extend([
            'extension:csv "EPC" "company"',
            'extension:csv "engineering" "consultants"',
            'extension:json "contractors" "structural"',
        ])
        
        self.log.info(f"Generated {len(queries)} deep search queries.")
        
        total_leads_found = 0
        
        for idx, query in enumerate(queries, 1):
            self.log.info(f"[{idx}/{len(queries)}] Searching GitHub for: {query}")
            
            # Deep pagination (up to page 10 = 1000 results max)
            for page in range(1, 11):
                data = self._search_github_page(query, page)
                
                if data == 'end_of_results':
                    break # No more pages
                elif data == 'rate_limited':
                    # We slept, try same page again next iteration or just break and move on?
                    # Let's break to avoid getting permanently banned, moving to next query
                    break
                elif not data or not data.get('items'):
                    break # No items, end of results
                    
                items = data.get('items', [])
                self.log.info(f"   -> Page {page}: Found {len(items)} repositories/files")
                
                for item in items:
                    html_url = item.get('html_url', '')
                    raw_url = html_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
                    
                    if raw_url:
                        text = self._fetch_file_content(raw_url)
                        if text:
                            found = self.process_file_content(text, html_url, query)
                            if found > 0:
                                total_leads_found += found
                                self.log.info(f"      + Found {found} OSINT leads in {item.get('name')}")
                
                # Pace ourselves to respect the 30 req/min API limit safely
                # We do 1 search request + up to 100 raw fetches. Raw fetches don't count towards the search API limit.
                time.sleep(2.5)

        self.log.info(f"Deep OSINT Scrape Complete. Total new leads found: {total_leads_found}")
        self.log_run("ok", records_found=total_leads_found, new_leads_added=total_leads_found)
