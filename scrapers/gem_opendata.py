import requests, json
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper
from utils.user_agents import get_headers

KEYWORDS = [
    'civil engineering drawings',
    'structural drawings',
    'AutoCAD drafting',
    'engineering design',
    'structural steel fabrication drawing',
    'piping drawings',
    'as-built drawings',
]

class GeMOpenDataScraper(BaseScraper):
    def __init__(self):
        super().__init__('gem_opendata', min_delay=2.0, max_delay=5.0)

    def search_gem_tenders(self, keyword: str) -> list:
        """
        GeM advance search accepts POST with form data.
        No login required for public tender listing.
        """
        url = "https://bidplus.gem.gov.in/advance-search"
        payload = {
            'searchedText': keyword,
            'startDate': '',
            'endDate': '',
            'ministry': '',
            'state': '',
        }
        
        headers = get_headers(referer='https://bidplus.gem.gov.in/')
        headers['X-Requested-With'] = 'XMLHttpRequest'
        
        try:
            self.limiter.wait(context=f"GeM API: {keyword}")
            r = requests.post(url, data=payload, headers=headers, timeout=15)
            if r.status_code != 200:
                self.log.warning(f"GeM returned {r.status_code}")
                return []
                
            soup = BeautifulSoup(r.text, 'html.parser')
            results = []
            
            # The exact HTML structure depends on GeM's current table format.
            # Assuming standard div blocks based on historical GeM DOM.
            for row in soup.select('.border.block'):
                try:
                    bid_no = row.select_one('.bid_no a').text.strip() if row.select_one('.bid_no a') else ''
                    org_name = row.select_one('.add-height').text.strip() if row.select_one('.add-height') else ''
                    desc = row.select_one('.items_ds').text.strip() if row.select_one('.items_ds') else ''
                    
                    if org_name and len(org_name) > 5:
                        results.append({
                            'name': org_name,
                            'domain': '',
                            'source_method': 'gem_opendata',
                            'source_url': f"https://bidplus.gem.gov.in/showbidDocument/{bid_no}" if bid_no else url,
                            'has_active_tender': 1,
                            'tender_description': desc,
                            'sector': 'epc',
                            'region': 'India'
                        })
                except Exception as ex:
                    self.log.debug(f"Error parsing GeM row: {ex}")
            return results
        except Exception as e:
            self.log.error(f"GeM search error: {e}")
            self.errors += 1
            return []

    def run(self):
        self.log.info("Starting GeM OpenData scraping...")
        for kw in KEYWORDS:
            leads = self.search_gem_tenders(kw)
            for lead in leads:
                self.insert_company(lead)
        self.log_run("ok")
