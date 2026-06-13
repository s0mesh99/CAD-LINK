import requests
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper
from utils.proxy_rotator import get_random_user_agent
from playwright.sync_api import sync_playwright

TENDER_SOURCES = {
    'gem_india': 'https://bidplus.gem.gov.in/advance-search',
    'merx_canada': 'https://www.merx.com/public/search',
    'aus_tenders': 'https://www.tenders.gov.au/Search/List',
    'ted_europe': 'https://ted.europa.eu/TED/search/search.do',
    'ungm': 'https://www.ungm.org/Public/Notice',
}

class TenderPortalScraper(BaseScraper):
    def __init__(self):
        super().__init__(name="tender_portal")
        
    def scrape(self) -> list:
        new_records = []
        print("    [TenderPortal] Starting search across public tender portals...")
        
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                
                # Scrape Australian Tenders (Playwright handles JS rendering)
                print(f"      [TenderPortal] Searching {TENDER_SOURCES['aus_tenders']} for EPC drafting needs...")
                self.rate_limiter.wait()
                try:
                    page.goto(TENDER_SOURCES['aus_tenders'], timeout=30000)
                    # Simplified logic assuming we search for "structural drafting EPC"
                    # A robust implementation would interact with the specific DOM of AusTenders
                    
                    html = page.content()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Example parser for tender rows
                    for row in soup.find_all('div', class_='list-item'):
                        title_div = row.find('div', class_='title')
                        agency_div = row.find('div', class_='agency')
                        
                        if title_div and agency_div:
                            title = title_div.text.strip()
                            agency = agency_div.text.strip()
                            
                            if 'engineering' in title.lower() or 'drafting' in title.lower():
                                record = {
                                    'name': agency,
                                    'domain': f"{agency.lower().replace(' ', '')}.com.au",
                                    'sector': 'epc',
                                    'country': 'Australia',
                                    'has_active_tender': 1,
                                    'tender_description': title,
                                    'tender_source': 'aus_tenders',
                                    'source_method': 'tender_portal'
                                }
                                new_records.append(record)
                except Exception as e:
                    print(f"      [TenderPortal] Failed to parse AusTenders: {e}")
                    
                browser.close()
                
            if new_records:
                self.save_records(new_records)
            self.log_run("ok")
            return new_records
            
        except Exception as e:
            self.log_run("failed", str(e))
            print(f"    [TenderPortal] Critical Error: {e}")
            return []
