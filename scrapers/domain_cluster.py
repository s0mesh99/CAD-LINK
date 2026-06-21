import requests
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper
from utils.user_agents import get_headers

class DomainClusterScraper(BaseScraper):
    def __init__(self):
        super().__init__('domain_cluster', min_delay=5.0, max_delay=10.0)

    def find_related_companies(self, domain: str) -> list:
        """
        Uses ViewDNS to find other domains hosted on the same IP.
        Many EPC groups host their regional subsidiaries on the same server.
        """
        url = f"https://viewdns.info/reverseip/?host={domain}&t=1"
        try:
            self.limiter.wait(context=f"Reverse IP for {domain}")
            r = requests.get(url, headers=get_headers(), timeout=15)
            
            if "Cloudflare" in r.text or "CloudFront" in r.text or r.status_code != 200:
                # If they use a generic CDN, this method yields thousands of unrelated sites.
                return []
                
            soup = BeautifulSoup(r.text, 'html.parser')
            domains = []
            
            # The domains are usually in a table
            for table in soup.find_all('table', border="1"):
                for row in table.find_all('tr')[1:]:  # skip header
                    cols = row.find_all('td')
                    if cols:
                        related_domain = cols[0].text.strip()
                        if related_domain and related_domain != domain:
                            domains.append(related_domain)
                            
            # Filter out obvious non-company or huge host domains
            domains = [d for d in domains if not any(x in d for x in ['google', 'aws', 'azure', 'wordpress'])]
            return domains[:20] # Limit to avoid adding 100s of spam domains
            
        except Exception as e:
            self.log.error(f"Error checking domain cluster for {domain}: {e}")
            return []

    def run(self):
        self.log.info("Starting domain clustering...")
        
        # Get 10 recent domains to cluster
        rows = []
        if hasattr(self, 'db') and getattr(self.db, 'supabase', None):
            try:
                res = self.db.supabase.table('companies').select('id, domain').neq('domain', '').order('id', desc=True).limit(10).execute()
                rows = res.data
            except Exception as e:
                self.log.error(f"Error fetching domains from DB: {e}")
        
        for row in rows:
            domain = row['domain']
            related_domains = self.find_related_companies(domain)
            
            for rel in related_domains:
                if not self.domain_exists(rel):
                    self.insert_company({
                        'name': rel.split('.')[0].capitalize(),
                        'domain': rel,
                        'source_method': 'domain_cluster',
                        'notes': f"Clustered from {domain}",
                        'sector': 'epc'
                    })
                    
        self.log_run("ok")
