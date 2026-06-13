import requests
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper
from utils.proxy_rotator import get_random_user_agent

ADNOC_SOURCES = [
    'https://www.adnoc.ae/en/news-and-media/press-releases'
]

class AdnocVendorScraper(BaseScraper):
    def __init__(self):
        super().__init__(name="adnoc_vendor")
        
    def scrape(self) -> list:
        new_records = []
        try:
            print("    [ADNOC] Scanning ADNOC press releases for newly awarded EPC contracts...")
            self.rate_limiter.wait()
            
            headers = {'User-Agent': get_random_user_agent()}
            resp = requests.get(ADNOC_SOURCES[0], headers=headers, timeout=10)
            
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                
                # Scan news titles for EPC awards
                for article in soup.find_all('a', class_='news-card'):
                    title = article.text.lower()
                    if 'award' in title and ('epc' in title or 'engineering' in title or 'contract' in title):
                        # Simple heuristic parser for demo: "contract awarded to [Company Name]"
                        words = article.text.split()
                        try:
                            if 'to' in words:
                                idx = words.index('to')
                                company_name = f"{words[idx+1]} {words[idx+2]}"
                                if company_name[0].isupper():
                                    record = {
                                        'name': company_name,
                                        'domain': f"{company_name.lower().replace(' ','').replace(',', '')}.com",
                                        'sector': 'oil_gas',
                                        'country': 'United Arab Emirates',
                                        'region': 'Middle East',
                                        'has_active_tender': 1,
                                        'tender_description': article.text.strip()[:200],
                                        'tender_source': 'adnoc_press_release',
                                        'source_method': 'adnoc_vendor'
                                    }
                                    new_records.append(record)
                        except:
                            pass
                            
            if new_records:
                self.save_records(new_records)
            self.log_run("ok")
            return new_records
            
        except Exception as e:
            self.log_run("failed", str(e))
            print(f"    [ADNOC] Error: {e}")
            return []
