"""
DuckDuckGo HTML scraper.
No API key. No CAPTCHA. No rate limiting enforcement.
The single most important new scraper in V1.3.

Finds:
1. Company websites (contact pages with emails)
2. LinkedIn profile URLs (name + title extraction)
3. PDF documents (capability statements, company profiles)
4. Job postings (signals active companies hiring CAD staff)
5. Contract award press releases (signals live projects)
"""

import requests, re
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urlparse
from scrapers.base_scraper import BaseScraper
from utils.user_agents import get_headers
from utils.name_parser import (extract_name_and_title_from_linkedin_title,
                                is_valid_person_name)
from duckduckgo_search import DDGS

DDG_URL = "https://html.duckduckgo.com/html/"

# ── Query bank ──────────────────────────────────────────────────────────────

REGIONS = [
    # North America
    '"Houston"', '"Calgary"', '"Denver"', '"Louisiana"', '"New York"', '"Toronto"',
    # Middle East & Africa
    '"Dubai"', '"Abu Dhabi"', '"Dhahran"', '"Doha"', '"Johannesburg"',
    # Europe
    '"Aberdeen"', '"London"', '"Stavanger"', '"Rotterdam"',
    # APAC
    '"Singapore"', '"Perth"', '"Kuala Lumpur"', '"Mumbai"', '"Tokyo"'
]

SERVICES = [
    # General EPC / Consulting
    '"EPC"', '"EPC contractor"', '"engineering consultancy"', '"civil engineering"', '"structural engineering"',
    # Data Centers & Tech Infra (High demand for civil/structural)
    '"data center construction"', '"data center engineering"', '"mission critical facilities"',
    # Energy (Renewable & Non-renewable)
    '"renewable energy contractor"', '"solar farm construction"', '"wind farm engineering"', 
    '"substation design"', '"power plant construction"', '"oil and gas"', '"LNG"', '"pipeline"',
    # Heavy Industrial & Marine
    '"process plant"', '"offshore"', '"marine engineering"', '"fabrication"', '"structural steel"'
]

COMPANY_QUERIES = [f'{service} {region} "contact us" OR "email"' for service in SERVICES for region in REGIONS]

PDF_QUERIES = [
    f'{service} {region} "capability statement" OR "company profile" filetype:pdf'
    for service in ['"EPC"', '"structural engineering"', '"data center construction"', '"renewable energy contractor"']
    for region in REGIONS[:20]  # First 20 regions to limit PDF volume
] + [
    '"approved vendor list" "engineering" "structural" filetype:pdf',
    '"contractor list" "EPC" "oil and gas" OR "data center" OR "renewable" filetype:pdf',
    '"prequalified contractors" "civil structural" filetype:pdf',
]

PEOPLE_QUERIES = [
    f'site:linkedin.com/in "Head of Engineering" OR "CAD Manager" OR "Structural Lead" {region} {sector}'
    for region in REGIONS
    for sector in ['"EPC"', '"Data Center"', '"Renewable Energy"', '"Oil and Gas"']
]

JOB_QUERIES = [
    f'"CAD drafter" OR "structural engineer" {region} {sector} job OR vacancy'
    for region in REGIONS
    for sector in ['"EPC"', '"Data Center"', '"Renewable"', '"Energy"']
]

CONTRACT_AWARD_QUERIES = [
    f'"awarded contract" OR "contract award" {service} {region} 2024 OR 2025'
    for service in ['"EPC"', '"data center"', '"solar farm"', '"wind farm"', '"substation"']
    for region in ['"UAE"', '"Saudi Arabia"', '"Qatar"', '"India"', '"Australia"', '"UK"']
]

class DuckDuckGoScraper(BaseScraper):

    def __init__(self):
        super().__init__('duckduckgo_search', min_delay=1.0, max_delay=3.0)

    def search(self, query: str, max_results: int = 10, retries: int = 3) -> list:
        """
        Uses the official duckduckgo-search package (DDGS) to bypass HTML limits.
        """
        self.limiter.wait(context=query[:40])
        
        for attempt in range(retries):
            try:
                with DDGS() as ddgs:
                    results = list(ddgs.text(query, max_results=max_results))
                    
                formatted_results = []
                for res in results:
                    formatted_results.append({
                        'title': res.get('title', ''),
                        'url': res.get('href', ''),
                        'snippet': res.get('body', '')
                    })
                return formatted_results
                
            except Exception as e:
                self.log.warning(f"DDG search error: {e}. Waiting 5s...")
                import time
                time.sleep(5)
                
        self.log.error(f"Failed to fetch DDG results for '{query}' after {retries} retries.")
        self.errors += 1
        return []

    def process_company_result(self, result: dict) -> dict:
        """
        Given a search result for a company contact page,
        extract domain, visit the page, pull email + info.
        """
        from scrapers.company_website import extract_from_website

        url    = result['url']
        domain = self.clean_domain(url)
        name   = result['title'].split(' - ')[0].split(' | ')[0].strip()

        if self.domain_exists(domain):
            return {}

        contact_data = extract_from_website(domain)

        return {
            'name':          name,
            'domain':        domain,
            'email':         contact_data.get('email', ''),
            'phone':         contact_data.get('phone', ''),
            'sector':        'epc',
            'source_method': 'ddg_company',
            'source_url':    url,
            'notes':         result.get('snippet', '')[:200],
        }

    def process_linkedin_result(self, result: dict) -> dict:
        """
        Extract person name + title from LinkedIn result title tag.
        Do NOT visit LinkedIn — just parse the Google/DDG title.
        """
        title   = result.get('title', '')
        url     = result.get('url', '')
        snippet = result.get('snippet', '')

        name, job_title, company = \
            extract_name_and_title_from_linkedin_title(title)

        if not is_valid_person_name(name):
            return {}

        return {
            'contact_name':        name,
            'contact_title':       job_title,
            'company_name':        company,
            'contact_linkedin_url': url,
            'snippet':             snippet,
        }

    def _load_cache(self):
        import json, os
        if not os.path.exists('pdf_cache.json'):
            return {}
        with open('pdf_cache.json', 'r') as f:
            try:
                return json.load(f)
            except:
                return {}

    def _save_cache(self, cache):
        import json
        with open('pdf_cache.json', 'w') as f:
            json.dump(cache, f)

    def process_pdf_result(self, result: dict) -> dict:
        """
        Queue PDF URL for the PDF miner to process.
        Store in pdf_cache.json.
        """
        url = result['url']
        if not url.lower().endswith('.pdf'):
            return {}
        
        cache = self._load_cache()
        if url not in cache:
            import datetime
            cache[url] = {
                'pdf_url': url,
                'downloaded_at': datetime.datetime.now().isoformat(),
                'parsed': False,
                'leads_found': 0
            }
            self._save_cache(cache)
            
        return {'queued_pdf': url}

    def run_company_queries(self):
        self.log.info("Running company search queries...")
        for query in self.company_queries:
            results = self.search(query)
            for r in results:
                if 'linkedin.com' in r['url']:
                    continue  # Company queries shouldn't hit LinkedIn
                data = self.process_company_result(r)
                if data.get('domain'):
                    self.infer_sector_from_snippet(data, r.get('snippet',''))
                    self.insert_company(data)

    def run_pdf_queries(self):
        self.log.info("Running PDF search queries...")
        for query in self.pdf_queries:
            results = self.search(query)
            for r in results:
                self.process_pdf_result(r)
        self.log.info(f"Queued PDFs for mining.")

    def run_people_queries(self):
        self.log.info("Running people/LinkedIn queries...")
        people_found = []
        for query in self.people_queries:
            results = self.search(query)
            for r in results:
                if 'linkedin.com/in/' not in r['url']:
                    continue
                person = self.process_linkedin_result(r)
                if person.get('contact_name'):
                    people_found.append(person)
                    self.log.info(
                        f"Found: {person['contact_name']} "
                        f"— {person['contact_title']} "
                        f"@ {person['company_name']}"
                    )

        # Now match people to existing companies or create new records
        self._attach_people_to_companies(people_found)

    def run_contract_award_queries(self):
        self.log.info("Running contract award queries...")
        for query in self.contract_queries:
            results = self.search(query)
            for r in results:
                # Extract company names from snippets
                # Award news = has active project = high priority
                companies = self._extract_companies_from_award(r)
                for c in companies:
                    c['has_active_tender'] = 1
                    c['tender_description'] = r.get('snippet','')[:200]
                    c['tender_source']      = r.get('url','')
                    c['source_method']      = 'contract_award_news'
                    self.insert_company(c)

    def _attach_people_to_companies(self, people: list):
        """
        For each found person, check if their company is in DB.
        If yes: update contact fields.
        If no: create a stub company record.
        """
        for p in people:
            company_name = p.get('company_name', '')
            if not company_name:
                continue

            # Fuzzy match company name in DB (using ilike for case-insensitive match)
            if hasattr(self, 'db') and getattr(self.db, 'supabase', None):
                res = self.db.supabase.table('companies').select('id, domain').ilike('name', f'%{company_name}%').limit(1).execute()
                rows = res.data
                
                if rows:
                    # Update existing company with contact info
                    self.db.update_company(rows[0]['domain'], {
                        'contact_name': p['contact_name'],
                        'contact_title': p['contact_title'],
                        'contact_linkedin_url': p['contact_linkedin_url']
                    })
                else:
                    # Create stub — enrich later
                    self.insert_company({
                        'name':                p['company_name'],
                        'domain':              '',
                        'contact_name':        p['contact_name'],
                        'contact_title':       p['contact_title'],
                        'contact_linkedin_url': p['contact_linkedin_url'],
                        'source_method':       'linkedin_person_dork',
                    })

    def _extract_companies_from_award(self, result: dict) -> list:
        """
        Parse contract award news snippet for company names.
        Returns list of partial company dicts.
        """
        from utils.name_parser import extract_name_from_snippet
        snippet = result.get('snippet', '')
        title   = result.get('title', '')
        text    = title + ' ' + snippet

        companies = []
        # Known EPC company name patterns in award news
        patterns = [
            r'\b([A-Z][a-zA-Z&\s]+(?:EPC|Engineering|Construction|'
            r'Contractors|Group|Energy|Services))\b',
        ]
        for pat in patterns:
            for match in re.finditer(pat, text):
                name = match.group(1).strip()
                if len(name) > 5:
                    companies.append({
                        'name':   name,
                        'domain': '',
                        'notes':  f"Contract award mention: {snippet[:100]}",
                    })
        return companies

    def infer_sector_from_snippet(self, data: dict, snippet: str):
        """Fill sector/sub_sector from keywords in snippet."""
        s = snippet.lower()
        if any(w in s for w in ['oil', 'gas', 'petroleum', 'refinery',
                                  'downstream', 'upstream', 'lng']):
            data.setdefault('sector', 'oil_gas')
        if any(w in s for w in ['epc', 'engineering procurement']):
            data.setdefault('sector', 'epc')
        if 'mining' in s:
            data.setdefault('sector', 'mining')
        if any(w in s for w in ['structural', 'civil', 'fabricat']):
            data.setdefault('sub_sector', 'engineering_consultancy')

    def run(self):
        # 1. Fetch Dynamic Configuration from Supabase
        regions = REGIONS
        services = SERVICES
        
        if hasattr(self, 'db') and getattr(self.db, 'supabase', None):
            try:
                res = self.db.supabase.table('scraper_config').select('*').execute()
                if res.data:
                    for row in res.data:
                        if row['config_type'] == 'regions' and row['config_data']:
                            regions = row['config_data']
                        elif row['config_type'] == 'services' and row['config_data']:
                            services = row['config_data']
                self.log.info(f"Loaded config from DB: {len(regions)} regions, {len(services)} services.")
            except Exception as e:
                self.log.warning(f"Could not load dynamic config from Supabase, using defaults. Error: {e}")

        # 2. Generate Queries
        self.company_queries = [f'{service} {region} "contact us" OR "email"' for service in services for region in regions]
        
        self.pdf_queries = [
            f'{service} {region} "capability statement" OR "company profile" filetype:pdf'
            for service in services[:4]
            for region in regions[:10]
        ] + [
            '"approved vendor list" "engineering" "structural" filetype:pdf',
            '"contractor list" "EPC" "oil and gas" OR "data center" OR "renewable" filetype:pdf',
            '"prequalified contractors" "civil structural" filetype:pdf',
        ]
        
        self.people_queries = [
            f'site:linkedin.com/in "Head of Engineering" OR "CAD Manager" OR "Structural Lead" {region} {sector}'
            for region in regions[:15]
            for sector in services[:5]
        ]
        
        self.contract_queries = [
            f'"awarded contract" OR "contract award" {service} {region} 2024 OR 2025'
            for service in services[:5]
            for region in regions[:10]
        ]

        # 3. Execute Scrapes
        self.run_company_queries()
        self.run_pdf_queries()
        self.run_people_queries()
        self.run_contract_award_queries()
