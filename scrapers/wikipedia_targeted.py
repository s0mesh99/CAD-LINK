import time
import re
import requests
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper

class WikipediaTargetedScraper(BaseScraper):
    def __init__(self):
        super().__init__("wikipedia_targeted", min_delay=5.0, max_delay=10.0)
        self.headers = {
            "User-Agent": "CADLinkLeadBot/1.0 (https://github.com/cadlink; cadlink.leads@gmail.com)"
        }
        # Targeted lists with 100% relevant companies
        self.wiki_lists = [
            ("https://en.wikipedia.org/wiki/List_of_oilfield_service_companies", "epc"),
            ("https://en.wikipedia.org/wiki/List_of_largest_oil_and_gas_companies_by_revenue", "epc")
        ]

    def clean_text(self, text):
        if not text:
            return ""
        # Remove wikipedia citation brackets like [1], [2]
        return re.sub(r'\[\d+\]', '', text).strip()

    def resolve_domain(self, name):
        # Remove legal entities for domain guess
        clean_name = re.sub(r'(?i)\b(inc|ltd|llc|corp|plc|sa|nv|gmbh|ag|ab)\b\.?', '', name).strip()
        clean = ''.join(e for e in clean_name if e.isalnum()).lower()
        if not clean: return ''
        return f"{clean}.com"

    def scrape(self):
        all_companies = []
        for url, sector in self.wiki_lists:
            self.limiter.wait(context="Wikipedia")
            try:
                r = requests.get(url, headers=self.headers, timeout=15)
                if r.status_code != 200:
                    continue
                soup = BeautifulSoup(r.text, 'html.parser')
                
                # 1. Parse Wikitables
                for table in soup.select("table.wikitable"):
                    rows = table.select("tr")
                    for row in rows[1:]: # skip header
                        cols = row.select("th, td")
                        if not cols: continue
                        name_elem = cols[0].find("a")
                        name = self.clean_text(name_elem.text) if name_elem else self.clean_text(cols[0].text)
                        if name and len(name) > 2 and len(name) < 60:
                            all_companies.append({
                                "name": name,
                                "domain": self.resolve_domain(name),
                                "source_method": "wikipedia_targeted",
                                "source_url": url,
                                "sector": sector
                            })
                
                # 2. Parse Bulleted Lists (under headers)
                for header in soup.select("h2, h3"):
                    next_node = header.find_next_sibling()
                    while next_node and next_node.name not in ["h2", "h3"]:
                        if next_node.name == "ul":
                            for li in next_node.select("li"):
                                a_tag = li.find("a")
                                if a_tag and a_tag.get("href", "").startswith("/wiki/"):
                                    name = self.clean_text(a_tag.text)
                                    if len(name) > 2 and len(name) < 60 and not any(x in name.lower() for x in ['list', 'timeline', 'history', 'category']):
                                        all_companies.append({
                                            "name": name,
                                            "domain": self.resolve_domain(name),
                                            "source_method": "wikipedia_targeted",
                                            "source_url": url,
                                            "sector": sector
                                        })
                        next_node = next_node.find_next_sibling()
                
            except Exception as e:
                self.log.error(f"Error scraping {url}: {e}")
            
        deduped = {c["domain"] if c.get("domain") else c["name"]: c for c in all_companies}
        return list(deduped.values())

    def run(self):
        self.log.info("Starting Wikipedia targeted scraping...")
        companies = self.scrape()
        for company in companies:
            self.insert_company(company)
        self.log_run("ok")
