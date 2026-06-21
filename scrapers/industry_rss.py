import feedparser, re, logging
from scrapers.base_scraper import BaseScraper

RSS_FEEDS = {
    # O&G and EPC news — contract awards name the companies
    'offshore_energy':    'https://www.offshore-energy.biz/feed/',
    'oil_gas_journal':    'https://www.ogj.com/rss/all.rss',
    'aramco_news':        'https://www.saudiaramco.com/en/news-media/rss',
    'meed_projects':      'https://www.meed.com/feed/',
    'construction_week':  'https://www.constructionweekonline.com/feed',
    'ipe_india':          'https://www.india-pipelineengineer.com/feed/',
    'engineering_news':   'https://www.engineeringnews.co.za/rss/rss.php',
    'processing_mag':     'https://www.processingmagazine.com/feed/',
    'hydrocarbons_tech':  'https://www.hydrocarbons-technology.com/feed/',
    'upstreamonline':     'https://www.upstreamonline.com/rss',
    
    # Australia resources/mining/EPC
    'mining_australia':   'https://www.miningaustralia.com.au/feed/',
    'lng_industry':       'https://www.lngindustry.com/rss/',
    
    # India EPC/infrastructure
    'construction_world': 'https://www.constructionworld.in/feed/',
    'projects_today':     'https://www.projectstoday.com/rss.xml',
}

TRIGGER_KEYWORDS = [
    'awarded contract', 'EPC contract', 'FEED contract',
    'engineering contract', 'construction contract',
    'structural', 'civil engineering', 'pipeline',
    'ADNOC', 'Aramco', 'QatarEnergy', 'ONGC', 'IOCL',
]

class IndustryRSSScraper(BaseScraper):
    def __init__(self):
        super().__init__('industry_rss', min_delay=1.0, max_delay=3.0)

    def _load_seen(self):
        import json, os
        self.seen_file = 'rss_seen.json'
        if not os.path.exists(self.seen_file):
            return set()
        with open(self.seen_file, 'r') as f:
            try:
                return set(json.load(f))
            except:
                return set()

    def _save_seen(self, seen_set):
        import json
        with open(self.seen_file, 'w') as f:
            json.dump(list(seen_set), f)

    def is_seen(self, entry_id: str) -> bool:
        if not hasattr(self, '_seen_cache'):
            self._seen_cache = self._load_seen()
        return entry_id in self._seen_cache

    def mark_seen(self, feed_url: str, entry_id: str):
        if not hasattr(self, '_seen_cache'):
            self._seen_cache = self._load_seen()
        self._seen_cache.add(entry_id)
        self._save_seen(self._seen_cache)

    def parse_rss_for_leads(self, feed_url: str):
        try:
            self.limiter.wait(context=f"Fetching RSS {feed_url}")
            feed = feedparser.parse(feed_url)
            
            for entry in feed.entries:
                entry_id = getattr(entry, 'id', entry.link)
                if self.is_seen(entry_id):
                    continue
                    
                text = (entry.get('title', '') + " " + entry.get('summary', '')).replace('\n', ' ')
                
                # Check for trigger keywords
                if any(kw.lower() in text.lower() for kw in TRIGGER_KEYWORDS):
                    # Basic NER for capitalized words
                    companies = []
                    patterns = [r'\b([A-Z][a-zA-Z&\s]+(?:EPC|Engineering|Construction|Contractors|Group|Energy|Services|Ltd|LLC|Inc))\b']
                    for pat in patterns:
                        for match in re.finditer(pat, text):
                            name = match.group(1).strip()
                            if len(name) > 5 and name not in companies:
                                companies.append(name)
                    
                    for company in companies:
                        record = {
                            'name': company,
                            'domain': '',
                            'source_method': 'industry_rss',
                            'source_url': entry.link,
                            'sector': 'epc',
                            'has_active_tender': 1,
                            'tender_description': text[:200],
                            'notes': f"Found in RSS feed: {feed_url}"
                        }
                        self.insert_company(record)
                
                self.mark_seen(feed_url, entry_id)
        except Exception as e:
            self.log.error(f"Error parsing RSS {feed_url}: {e}")

    def run(self):
        self.log.info("Starting RSS feed scraping...")
        for name, url in RSS_FEEDS.items():
            self.parse_rss_for_leads(url)
        self.log_run("ok")
