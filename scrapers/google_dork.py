import time
from urllib.parse import urlparse
from duckduckgo_search import DDGS
from scrapers.base_scraper import BaseScraper
from scrapers.company_website import extract_from_website

DORK_QUERIES = [
    # Tier 2/3 UAE/Middle East EPC
    '"EPC contractor" UAE "structural engineering"',
    '"civil engineering" "oil and gas" Abu Dhabi',
    '"piping" "structural" EPC Dubai CAD',
    
    # Tier 2/3 India EPC
    '"EPC company" Hyderabad "structural"',
    '"civil engineering" EPC India "CAD drawings"',
    '"fabrication" "structural steel" AutoCAD India',

    # Australia O&G/Mining EPC
    'EPC structural Perth engineering',
    '"mining engineering" civil Australia CAD drafting',

    # Canada Energy EPC  
    'EPC "oil sands" Calgary',
    'engineering piping structural Alberta CAD'
]

class GoogleDorkScraper(BaseScraper):
    def __init__(self):
        # Even though we use DDG, we keep the name for DB consistency
        super().__init__(name="google_dork")
        
    def scrape(self) -> list:
        new_records = []
        try:
            print("    [GoogleDork] Using robust duckduckgo_search module to safely pull domains...")
            ddgs = DDGS()
            
            for query in DORK_QUERIES:
                print(f"    [DuckDuckGo] Searching: {query}")
                self.rate_limiter.wait()
                
                try:
                    # Fetch top 10 results
                    results = list(ddgs.text(query, max_results=10))
                    
                    for r in results:
                        url = r.get('href', '')
                        if url.startswith('http'):
                            parsed_url = urlparse(url)
                            domain = parsed_url.netloc.replace('www.', '')
                            
                            # Filter out social media and generic directories
                            ignore_domains = ['linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com', 'pinterest.com', 'justdial.com', 'indiamart.com', 'yellowpages.com', 'glassdoor.com', 'indeed.com', 'naukri.com', 'zoominfo.com', 'bloomberg.com', 'duckduckgo.com']
                            if any(d in domain for d in ignore_domains):
                                continue
                            
                            print(f"      [DuckDuckGo] Extracting from domain: {domain}")
                            contact_data = extract_from_website(domain)
                            
                            # We only care if we found an email or phone number
                            if contact_data['email_1'] or contact_data['phone']:
                                record = {
                                    'name': domain.split('.')[0].capitalize(),
                                    'domain': domain,
                                    'sector': 'epc',
                                    'source_method': 'google_dork'
                                }
                                record.update(contact_data)
                                new_records.append(record)
                                
                                if len(new_records) >= 3:
                                    self.save_records(new_records)
                                    new_records = []
                                    
                except Exception as e:
                    print(f"      [DuckDuckGo] Failed search query: {e}")
                    time.sleep(10)
                    
            if new_records:
                self.save_records(new_records)
            self.log_run("ok")
            return new_records
            
        except Exception as e:
            self.log_run("failed", str(e))
            print(f"    [DuckDuckGo] Critical Error: {e}")
            return []
