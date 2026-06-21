import logging, time
from datetime import datetime
from utils.rate_limiter import RateLimiter
from utils.user_agents import get_headers
from db.client import DatabaseClient

class BaseScraper:
    """
    All scrapers inherit from this.
    Provides: DB connection via Supabase, rate limiting, dedup check,
    lead insertion, run logging.
    """

    def __init__(self, name: str, min_delay=2.0, max_delay=6.0):
        self.name        = name
        self.limiter     = RateLimiter(min_delay, max_delay)
        self.db          = DatabaseClient()
        self.inserted    = 0
        self.skipped     = 0
        self.errors      = 0
        self.run_start   = datetime.now()
        logging.basicConfig(level=logging.INFO,
            format='%(asctime)s [%(name)s] %(levelname)s: %(message)s')
        self.log = logging.getLogger(self.name)

    def domain_exists(self, domain: str) -> bool:
        """Check if domain already in database."""
        return self.db.domain_exists(domain)

    def clean_domain(self, url: str) -> str:
        """Extract bare domain from any URL."""
        import re
        url = url.lower().strip()
        url = re.sub(r'^https?://', '', url)
        url = re.sub(r'^www\.', '', url)
        url = url.split('/')[0].split('?')[0]
        return url

    def insert_company(self, data: dict) -> int:
        """
        Insert or ignore company. Returns 1 if inserted, 0 if skipped.
        """
        domain = self.clean_domain(data.get('domain', ''))
        
        if not domain:
            # Generate a pseudo-domain for OSINT leads so it doesn't fail the DB constraint
            import re
            name_slug = re.sub(r'[^a-z0-9]', '', data.get('name', '').lower())
            if not name_slug:
                self.skipped += 1
                return 0
            domain = f"{name_slug}.osint"

        if self.domain_exists(domain):
            self.skipped += 1
            return 0

        data['domain'] = domain
        success = self.db.upsert_company(data)
        if success:
            self.inserted += 1
            self.log.info(f"✅ Inserted: {data.get('name')} ({domain})")
            return 1
        else:
            self.errors += 1
            self.log.error(f"Insert error for {domain}")
            return 0

    def update_company(self, domain: str, updates: dict):
        """Update fields on existing company record."""
        self.db.update_company(domain, updates)

    def log_run(self, status: str = 'completed', notes: str = ''):
        """Write run stats to scraper_runs table."""
        self.db.log_scraper_run(
            scraper_name=self.name,
            status=status,
            records_found=self.inserted + self.skipped + self.errors,
            new_leads_added=self.inserted,
            error_message=notes
        )
        duration = (datetime.now() - self.run_start).seconds
        self.log.info(
            f"Run complete — inserted: {self.inserted}, "
            f"skipped: {self.skipped}, errors: {self.errors}, "
            f"duration: {duration}s"
        )

    def run(self):
        raise NotImplementedError("Each scraper must implement run()")
