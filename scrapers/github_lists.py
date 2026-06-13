import requests
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper
from utils.user_agents import get_headers

# These are publicly maintained directory pages
LIST_SOURCES = [
    # 1. ECIA (Engineering Construction Industry Association)
    'https://www.ecia.net.au/members/',
    
    # 2. CECA (Canadian ECA) member list  
    'https://www.ceca.org/members/',
]

class GithubListsScraper(BaseScraper):
    def __init__(self):
        super().__init__('github_lists', min_delay=2.0, max_delay=5.0)

    def scrape_ecia(self):
        """Scrape ECIA member list"""
        url = 'https://www.ecia.net.au/members/'
        try:
            self.limiter.wait(context="ECIA Members")
            r = requests.get(url, headers=get_headers(), timeout=15)
            soup = BeautifulSoup(r.text, 'html.parser')
            
            # This is a generic extraction approach based on typical list structures
            # We look for links inside main content areas
            for link in soup.select('a[href^="http"]'):
                domain = self.clean_domain(link['href'])
                name = link.text.strip()
                
                if len(name) > 3 and 'ecia' not in domain and 'linkedin' not in domain:
                    self.insert_company({
                        'name': name,
                        'domain': domain,
                        'source_method': 'directory_list',
                        'source_url': url,
                        'sector': 'epc',
                        'region': 'Australia'
                    })
        except Exception as e:
            self.log.error(f"Error scraping ECIA: {e}")

    def scrape_ceca(self):
        """Scrape CECA member list"""
        url = 'https://www.ceca.org/members/'
        try:
            self.limiter.wait(context="CECA Members")
            r = requests.get(url, headers=get_headers(), timeout=15)
            soup = BeautifulSoup(r.text, 'html.parser')
            
            for link in soup.select('a[href^="http"]'):
                domain = self.clean_domain(link['href'])
                name = link.text.strip()
                
                if len(name) > 3 and 'ceca' not in domain and 'linkedin' not in domain:
                    self.insert_company({
                        'name': name,
                        'domain': domain,
                        'source_method': 'directory_list',
                        'source_url': url,
                        'sector': 'epc',
                        'region': 'Canada'
                    })
        except Exception as e:
            self.log.error(f"Error scraping CECA: {e}")

    def run(self):
        self.log.info("Starting public directory list scraping...")
        self.scrape_ecia()
        self.scrape_ceca()
        self.log_run("ok")
