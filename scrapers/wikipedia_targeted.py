import time
import re
from scrapers.base import BaseScraper

class WikipediaTargetedScraper(BaseScraper):
    def __init__(self):
        super().__init__("wikipedia_targeted", "https://en.wikipedia.org", "oil_gas")
        # Wikipedia requires a proper User-Agent with contact info
        self.session.headers.update({
            "User-Agent": "CADLinkLeadBot/1.0 (https://github.com/cadlink; cadlink.leads@gmail.com)"
        })
        # Targeted lists with 100% relevant companies
        self.wiki_lists = [
            ("https://en.wikipedia.org/wiki/List_of_oilfield_service_companies", "oil_gas", "upstream"),
            ("https://en.wikipedia.org/wiki/List_of_largest_oil_and_gas_companies_by_revenue", "oil_gas", "upstream")
        ]

    def scrape(self):
        all_companies = []
        for url, sector, sub_sector in self.wiki_lists:
            time.sleep(5)  # Extra delay between Wikipedia pages to avoid 429
            soup = self.get(url)
            if not soup:
                time.sleep(10)
                continue
                
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
                            "sector": sector,
                            "sub_sector": sub_sector,
                            "domain": self.resolve_domain(name),
                            "email_1": None,
                            "email_2": None,
                            "phone": None,
                            "country": self.clean_text(cols[1].text) if len(cols) > 1 else None,
                            "city": None,
                            "region": "Unknown",
                            "employee_count": None,
                            "revenue_range": None,
                            "source": self.name,
                            "source_url": url,
                            "quality_score": 0
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
                                        "sector": sector,
                                        "sub_sector": sub_sector,
                                        "domain": self.resolve_domain(name),
                                        "email_1": None,
                                        "email_2": None,
                                        "phone": None,
                                        "country": None,
                                        "city": None,
                                        "region": "Unknown",
                                        "employee_count": None,
                                        "revenue_range": None,
                                        "source": self.name,
                                        "source_url": url,
                                        "quality_score": 0
                                    })
                    next_node = next_node.find_next_sibling()
            
            time.sleep(5)  # Be polite to Wikipedia
            
        deduped = {c["domain"] if c.get("domain") else c["name"]: c for c in all_companies}
        return list(deduped.values())

    def resolve_domain(self, name):
        # Remove legal entities for domain guess
        clean_name = re.sub(r'(?i)\b(inc|ltd|llc|corp|plc|sa|nv|gmbh|ag|ab)\b\.?', '', name).strip()
        clean = ''.join(e for e in clean_name if e.isalnum()).lower()
        if not clean: return None
        return f"{clean}.com"
