import requests, os
from scrapers.base_scraper import BaseScraper
from utils.name_parser import extract_name_and_title_from_linkedin_title, is_valid_person_name

BING_ENDPOINT = "https://api.bing.microsoft.com/v7.0/search"
BING_API_KEY = os.environ.get("BING_API_KEY", "")  # User must set this in env

PEOPLE_QUERIES = [
    'site:linkedin.com/in "Head of Engineering" "Petrofac" UAE',
    'site:linkedin.com/in "CAD Manager" "Dodsal" Dubai',
    'site:linkedin.com/in "Structural Lead" "NPCC" "Abu Dhabi"',
    'site:linkedin.com/in "Engineering Manager" "Lamprell"',
    'site:linkedin.com/in "Design Manager" "Eversendai" "Dubai"',
    'site:linkedin.com/in "Civil Engineering Manager" "Archirodon"',
    'site:linkedin.com/in "Drawing Office Manager" "ILF Consulting"',
    'site:linkedin.com/in "Head of Engineering" "Bilfinger" "Middle East"',
    'site:linkedin.com/in "Structural Lead" "Altrad"',
    'site:linkedin.com/in "Engineering Manager" "CCC" "Consolidated Contractors"',
]

class BingSearchScraper(BaseScraper):
    def __init__(self):
        super().__init__('bing_search', min_delay=1.0, max_delay=2.0)

    def bing_search(self, query: str) -> list:
        if not BING_API_KEY:
            self.log.warning("BING_API_KEY not set. Skipping Bing Search.")
            return []
            
        headers = {'Ocp-Apim-Subscription-Key': BING_API_KEY}
        params  = {'q': query, 'count': 10, 'mkt': 'en-US'}
        
        try:
            self.limiter.wait(context=f"Bing API: {query[:30]}")
            r = requests.get(BING_ENDPOINT, headers=headers, params=params, timeout=10)
            if r.status_code != 200:
                self.log.error(f"Bing API error: {r.status_code} - {r.text}")
                return []
                
            results = r.json().get('webPages', {}).get('value', [])
            return [{'title': res.get('name', ''), 'url': res.get('url', ''), 'snippet': res.get('snippet', '')} for res in results]
        except Exception as e:
            self.log.error(f"Bing API request failed: {e}")
            self.errors += 1
            return []

    def run(self):
        self.log.info("Starting Bing Search API queries...")
        for query in PEOPLE_QUERIES:
            results = self.bing_search(query)
            for r in results:
                title = r['title']
                url = r['url']
                snippet = r['snippet']
                
                if 'linkedin.com/in/' not in url:
                    continue
                    
                name, job_title, company = extract_name_and_title_from_linkedin_title(title)
                if is_valid_person_name(name) and company:
                    record = {
                        'name': company,
                        'domain': '',
                        'contact_name': name,
                        'contact_title': job_title,
                        'contact_linkedin_url': url,
                        'source_method': 'bing_search',
                        'notes': snippet[:200]
                    }
                    # We create stub companies, then base scraper or email guesser enriches them
                    self.insert_company(record)
                    
        self.log_run("ok")
