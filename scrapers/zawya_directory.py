import time
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper
from urllib.parse import quote_plus
from playwright.sync_api import sync_playwright

TARGET_SEARCHES = [
    'EPC contractor UAE',
    'structural engineering Abu Dhabi',
    'civil engineering Dubai',
    'oil gas engineering Saudi Arabia',
    'engineering consultancy Qatar'
]

class ZawyaDirectoryScraper(BaseScraper):
    def __init__(self):
        super().__init__(name="zawya_directory")
        
    def scrape(self) -> list:
        new_records = []
        try:
            print("    [ZawyaDirectory] Starting headless stealth browser for Zawya...")
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    viewport={'width': 1920, 'height': 1080}
                )
                page = context.new_page()
                
                for term in TARGET_SEARCHES:
                    print(f"    [ZawyaDirectory] Searching for: {term}")
                    self.rate_limiter.wait()
                    
                    url = f"https://www.zawya.com/en/companies/search?q={quote_plus(term)}"
                    
                    try:
                        page.goto(url, timeout=30000)
                        page.wait_for_timeout(3000) # wait for dynamic load
                        
                        html = page.content()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        for item in soup.find_all('div', class_='company-card'):
                            name_elem = item.find('h3')
                            if name_elem:
                                company_name = name_elem.text.strip()
                                domain = company_name.lower().replace(' ', '').replace(',', '') + '.com'
                                
                                record = {
                                    'name': company_name,
                                    'domain': domain,
                                    'sector': 'epc',
                                    'region': 'Middle East',
                                    'source_method': 'zawya_directory'
                                }
                                new_records.append(record)
                                
                    except Exception as e:
                        print(f"      [ZawyaDirectory] Failed search query: {e}")
                        
                browser.close()
                
            if new_records:
                self.save_records(new_records)
            self.log_run("ok")
            return new_records
            
        except Exception as e:
            self.log_run("failed", str(e))
            print(f"    [ZawyaDirectory] Critical Error: {e}")
            return []
