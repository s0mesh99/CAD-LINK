import time
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper
from playwright.sync_api import sync_playwright

TARGET_COMPANY_SLUGS = [
    'petrofac', 'dodsal-group', 'npcc-national-petroleum-construction-company',
    'penspen', 'kent-plc', 'descon-engineering', 'lamprell-energy',
    'eversendai-offshore', 'archirodon', 'ilfconsulting',
    'bilfinger', 'altrad', 'consolidated-contractors-company',
    'galfar-engineering', 'target-engineering-uae',
    'lt-hydrocarbon-engineering', 'engineers-india-limited',
    'tata-projects', 'afcons-infrastructure', 'nuberg-epc',
    'isgec-heavy-engineering', 'kavin-engineering',
    'worley', 'clough-limited', 'monadelphous', 'ausenco',
    'pcl-construction', 'stantec', 'hatch', 'burns-mcdonnell',
]

class LinkedinCompanyScraper(BaseScraper):
    def __init__(self):
        super().__init__(name="linkedin_company")
        
    def scrape(self) -> list:
        new_records = []
        print("    [LinkedInCompany] Starting headless stealth browser to scrape company pages...")
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                # Stealth-like context
                context = browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    viewport={'width': 1920, 'height': 1080}
                )
                
                for slug in TARGET_COMPANY_SLUGS:
                    print(f"      [LinkedInCompany] Scraping {slug}...")
                    self.rate_limiter.wait()
                    page = context.new_page()
                    
                    try:
                        # Public company pages are usually accessible without login at /about/
                        url = f"https://www.linkedin.com/company/{slug}/about/"
                        page.goto(url, timeout=20000)
                        page.wait_for_timeout(3000) # Let dynamic content load
                        
                        html = page.content()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # LinkedIn aggressively blocks headless without login and DOM changes constantly,
                        # so we implement a defensive parser.
                        
                        name_elem = soup.find('h1')
                        name = name_elem.text.strip() if name_elem else slug.replace('-', ' ').title()
                        
                        # Employee count
                        emp_count = None
                        for dt in soup.find_all('dt'):
                            if 'Company size' in dt.text:
                                dd = dt.find_next_sibling('dd')
                                if dd:
                                    emp_count = dd.text.strip()
                                    break
                                    
                        # Domain Fallback guess
                        domain = f"{slug}.com"
                        for a in soup.find_all('a', href=True):
                            if 'linkedin' not in a['href'] and 'http' in a['href']:
                                domain = a['href'].split('//')[-1].split('/')[0].replace('www.', '')
                                break

                        record = {
                            'name': name,
                            'domain': domain,
                            'sector': 'epc',
                            'employee_count': emp_count,
                            'source_method': 'linkedin_company'
                        }
                        
                        new_records.append(record)
                        
                        if len(new_records) >= 5:
                            self.save_records(new_records)
                            new_records = []
                            
                    except Exception as e:
                        print(f"      [LinkedInCompany] Failed on {slug}: {e}")
                    finally:
                        page.close()
                        
                browser.close()
                
            if new_records:
                self.save_records(new_records)
            self.log_run("ok")
            return new_records
            
        except Exception as e:
            self.log_run("failed", str(e))
            print(f"    [LinkedInCompany] Critical Error: {e}")
            return []
