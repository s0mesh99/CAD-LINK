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

DDG_URL = "https://html.duckduckgo.com/html/"

# ── Query bank ──────────────────────────────────────────────────────────────

REGIONS = [
    '"UAE"', '"Abu Dhabi"', '"Dubai"', '"Sharjah"', '"Qatar"', '"Oman"', '"Kuwait"', '"Saudi Arabia"', 
    '"Bahrain"', '"Egypt"', '"Nigeria"', '"South Africa"',
    '"India"', '"Mumbai"', '"Chennai"', '"Hyderabad"', '"Pune"', '"Bengaluru"', '"Gujarat"',
    '"Australia"', '"Perth"', '"Brisbane"', '"Melbourne"', '"Sydney"',
    '"Canada"', '"Calgary"', '"Alberta"', '"Edmonton"', '"Vancouver"',
    '"UK"', '"Aberdeen"', '"London"', '"Scotland"', '"North Sea"',
    '"USA"', '"Texas"', '"Houston"', '"Louisiana"', '"Denver"', '"California"',
    '"Singapore"', '"Malaysia"', '"Kuala Lumpur"', '"Indonesia"', '"Jakarta"',
    '"Brazil"', '"Rio de Janeiro"', '"Mexico"'
]

SERVICES = [
    '"EPC"', '"EPC contractor"', '"engineering consultancy"', '"civil engineering"', 
    '"structural engineering"', '"fabrication"', '"structural steel"', '"pipeline"', 
    '"process plant"', '"offshore"', '"marine engineering"', '"LNG"'
]

COMPANY_QUERIES = [f'{service} {region} "contact us" OR "email"' for service in SERVICES for region in REGIONS]

PDF_QUERIES = [
    f'{service} {region} "capability statement" OR "company profile" filetype:pdf'
    for service in ['"EPC"', '"structural engineering"', '"civil contractor"', '"fabrication"']
    for region in REGIONS[:20]  # First 20 regions to limit PDF volume
] + [
    '"approved vendor list" "engineering" "structural" filetype:pdf',
    '"contractor list" "EPC" "oil and gas" filetype:pdf',
    '"prequalified contractors" "civil structural" filetype:pdf',
]

PEOPLE_QUERIES = [
    f'site:linkedin.com/in "Head of Engineering" OR "CAD Manager" OR "Structural Lead" {region} "EPC"'
    for region in REGIONS
]

JOB_QUERIES = [
    f'"CAD drafter" OR "structural engineer" {region} "EPC" job OR vacancy'
    for region in REGIONS
]

CONTRACT_AWARD_QUERIES = [
    f'"awarded contract" OR "contract award" {service} {region} 2024 OR 2025'
    for service in ['"EPC"', '"engineering"', '"structural"']
    for region in ['"UAE"', '"Saudi Arabia"', '"Qatar"', '"India"', '"Australia"', '"UK"']
]

class DuckDuckGoScraper(BaseScraper):

    def __init__(self):
        super().__init__('duckduckgo_search', min_delay=3.0, max_delay=8.0)
        self.session = requests.Session()
        self.current_proxy = None
        self._refresh_proxy()

    def _refresh_proxy(self):
        from fp.fp import FreeProxy
        try:
            self.log.info("Fetching new free proxy...")
            # We need an elite/anonymous HTTPS proxy that works
            proxy_url = FreeProxy(https=True, anonym=True, timeout=10).get()
            self.current_proxy = {'http': proxy_url, 'https': proxy_url}
            self.log.info(f"Switched to proxy: {proxy_url}")
            self.session.proxies.update(self.current_proxy)
        except Exception as e:
            self.log.warning(f"Failed to get proxy: {e}. Trying any proxy...")
            try:
                proxy_url = FreeProxy(timeout=10).get()
                self.current_proxy = {'http': proxy_url, 'https': proxy_url}
                self.log.info(f"Switched to fallback proxy: {proxy_url}")
                self.session.proxies.update(self.current_proxy)
            except Exception as e2:
                self.log.error(f"Fallback proxy failed: {e2}. Using direct connection.")
                self.current_proxy = None
                self.session.proxies.clear()

    def search(self, query: str, max_results: int = 10, retries: int = 3) -> list:
        """
        POST to DDG HTML endpoint using rotating proxies.
        """
        self.limiter.wait(context=query[:40])
        
        for attempt in range(retries):
            try:
                resp = self.session.post(
                    DDG_URL,
                    data={'q': query, 'b': '', 'kl': 'us-en'},
                    headers=get_headers('https://duckduckgo.com'),
                    timeout=15
                )
                if resp.status_code == 202 or resp.status_code == 403:
                    self.log.warning(f"DDG returned {resp.status_code}. Rate limit hit. Refreshing proxy...")
                    self._refresh_proxy()
                    continue
                    
                if resp.status_code != 200:
                    self.log.warning(f"DDG returned {resp.status_code}")
                    return []

                soup  = BeautifulSoup(resp.text, 'lxml')
                items = soup.select('div.result')
                results = []
                for item in items[:max_results]:
                    title_tag   = item.select_one('a.result__a')
                    snippet_tag = item.select_one('a.result__snippet')
                    if not title_tag:
                        continue
                    url = title_tag.get('href', '')
                    results.append({
                        'title':   title_tag.get_text(strip=True),
                        'url':     url,
                        'snippet': snippet_tag.get_text(strip=True)
                                  if snippet_tag else '',
                    })
                return results

            except requests.exceptions.Timeout:
                self.log.error(f"DDG search timeout on proxy {self.current_proxy}. Refreshing proxy...")
                self._refresh_proxy()
            except Exception as e:
                self.log.error(f"DDG search error: {e}. Refreshing proxy...")
                self._refresh_proxy()
                
        self.errors += 1
        return []

    def process_company_result(self, result: dict) -> dict:
        """
        Given a search result for a company contact page,
        extract domain, visit the page, pull email + info.
        """
        from scrapers.company_website import WebsiteContactScraper
        ws = WebsiteContactScraper()

        url    = result['url']
        domain = self.clean_domain(url)
        name   = result['title'].split(' - ')[0].split(' | ')[0].strip()

        if self.domain_exists(domain):
            return {}

        contact_data = ws.extract_contact(domain)

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

    def process_pdf_result(self, result: dict) -> dict:
        """
        Queue PDF URL for the PDF miner to process.
        Store in pdf_cache table.
        """
        url = result['url']
        if not url.lower().endswith('.pdf'):
            return {}
        self.conn.execute(
            'INSERT OR IGNORE INTO pdf_cache (pdf_url, downloaded_at) '
            'VALUES (?, CURRENT_TIMESTAMP)', (url,)
        )
        self.conn.commit()
        return {'queued_pdf': url}

    def run_company_queries(self):
        self.log.info("Running company search queries...")
        for query in COMPANY_QUERIES:
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
        for query in PDF_QUERIES:
            results = self.search(query)
            for r in results:
                self.process_pdf_result(r)
        self.log.info(f"Queued PDFs for mining.")

    def run_people_queries(self):
        self.log.info("Running people/LinkedIn queries...")
        people_found = []
        for query in PEOPLE_QUERIES:
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
        for query in CONTRACT_AWARD_QUERIES:
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

            # Fuzzy match company name in DB
            rows = self.conn.execute(
                'SELECT id, domain FROM companies '
                'WHERE name LIKE ? LIMIT 1',
                (f'%{company_name}%',)
            ).fetchall()

            if rows:
                # Update existing company with contact info
                self.conn.execute('''
                    UPDATE companies SET
                        contact_name = COALESCE(contact_name, ?),
                        contact_title = COALESCE(contact_title, ?),
                        contact_linkedin_url = COALESCE(contact_linkedin_url, ?)
                    WHERE id = ?
                ''', (p['contact_name'], p['contact_title'],
                      p['contact_linkedin_url'], rows[0]['id']))
                self.conn.commit()
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
        self.run_company_queries()
        self.run_pdf_queries()
        self.run_people_queries()
        self.run_contract_award_queries()
