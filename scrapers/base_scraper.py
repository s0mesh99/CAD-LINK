import sqlite3, logging, time
from datetime import datetime
from utils.rate_limiter import RateLimiter
from utils.user_agents import get_headers
from db.schema import DB_PATH

class BaseScraper:
    """
    All scrapers inherit from this.
    Provides: DB connection, rate limiting, dedup check,
    lead insertion, run logging.
    """

    def __init__(self, name: str, min_delay=2.0, max_delay=6.0):
        self.name        = name
        self.limiter     = RateLimiter(min_delay, max_delay)
        self.conn        = sqlite3.connect(DB_PATH)
        self.conn.row_factory = sqlite3.Row
        self.inserted    = 0
        self.skipped     = 0
        self.errors      = 0
        self.run_start   = datetime.now()
        logging.basicConfig(level=logging.INFO,
            format='%(asctime)s [%(name)s] %(levelname)s: %(message)s')
        self.log = logging.getLogger(self.name)

    def domain_exists(self, domain: str) -> bool:
        """Check if domain already in database."""
        if not domain:
            return False
        domain = domain.lower().replace('www.', '').strip('/')
        row = self.conn.execute(
            'SELECT id FROM companies WHERE domain = ?', (domain,)
        ).fetchone()
        return row is not None

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
        Insert or ignore company. Returns new row ID or 0 if skipped.
        data keys: name, domain, email, phone, country, region,
                   sector, sub_sector, contact_name, contact_title,
                   contact_email, contact_confidence, contact_linkedin_url,
                   has_active_tender, tender_description, tender_source,
                   tender_value, source_method, source_url, notes
        """
        domain = self.clean_domain(data.get('domain', ''))
        if not domain or self.domain_exists(domain):
            self.skipped += 1
            return 0

        # Calculate quality score
        from db.schema import calculate_quality_score
        data['domain']        = domain
        data['quality_score'] = calculate_quality_score(data)

        cols   = [k for k in data if data[k] is not None]
        placeholders = ', '.join(['?' for _ in cols])
        col_names    = ', '.join(cols)
        values       = [data[k] for k in cols]

        try:
            cur = self.conn.execute(
                f'INSERT INTO companies ({col_names}) VALUES ({placeholders})',
                values
            )
            self.conn.commit()
            self.inserted += 1
            self.log.info(f"✅ Inserted: {data.get('name')} ({domain})")
            return cur.lastrowid
        except sqlite3.IntegrityError:
            self.skipped += 1
            return 0
        except Exception as e:
            self.errors += 1
            self.log.error(f"Insert error for {domain}: {e}")
            return 0

    def update_company(self, domain: str, updates: dict):
        """Update fields on existing company record."""
        domain = self.clean_domain(domain)
        if not updates:
            return
        set_clause = ', '.join([f'{k} = ?' for k in updates])
        values     = list(updates.values()) + [domain]
        self.conn.execute(
            f'UPDATE companies SET {set_clause} WHERE domain = ?', values
        )
        self.conn.commit()

    def log_run(self, status: str = 'completed', notes: str = ''):
        """Write run stats to scraper_runs table."""
        duration = (datetime.now() - self.run_start).seconds
        self.conn.execute('''
            INSERT INTO scraper_runs
            (scraper_name, run_at, leads_inserted,
             leads_skipped, errors, duration_seconds, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (self.name, self.run_start, self.inserted,
              self.skipped, self.errors, duration, status, notes))
        self.conn.commit()
        self.log.info(
            f"Run complete — inserted: {self.inserted}, "
            f"skipped: {self.skipped}, errors: {self.errors}, "
            f"duration: {duration}s"
        )

    def run(self):
        raise NotImplementedError("Each scraper must implement run()")

    def __del__(self):
        if hasattr(self, 'conn'):
            self.conn.close()
