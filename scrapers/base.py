import time
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from config import SCRAPER_CONFIG, REGIONS


class BaseScraper:
    """Abstract base class for all sector scrapers."""

    def __init__(self, name: str, base_url: str, sector: str):
        self.name = name
        self.base_url = base_url
        self.sector = sector
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": SCRAPER_CONFIG["user_agent"],
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive"
        })

    def get(self, url: str, params: dict = None) -> BeautifulSoup | None:
        """Fetch a URL with retry logic and rate limiting. Returns parsed HTML or None."""
        time.sleep(SCRAPER_CONFIG["request_delay"])
        retries = SCRAPER_CONFIG["max_retries"]
        delays = SCRAPER_CONFIG["retry_delay"]

        for attempt in range(retries):
            try:
                timestamp = datetime.now().strftime("%H:%M:%S")
                response = self.session.get(
                    url, params=params, timeout=SCRAPER_CONFIG["timeout"]
                )
                print(f"  [{timestamp}] [{self.name}] GET {url[:80]} -> {response.status_code}")

                if response.status_code == 200:
                    return BeautifulSoup(response.text, "lxml")
                elif response.status_code == 429:
                    print(f"  [{self.name}] Rate limited (429). Sleeping 30s...")
                    time.sleep(30)
                    continue
                elif response.status_code == 403:
                    print(f"  [{self.name}] Access denied (403). Skipping.")
                    return None
                elif response.status_code == 404:
                    print(f"  [{self.name}] Page not found (404). Skipping.")
                    return None
                else:
                    print(f"  [{self.name}] Unexpected status {response.status_code}. Retrying...")
            except requests.exceptions.ConnectionError:
                delay = delays[min(attempt, len(delays) - 1)]
                print(f"  [{self.name}] Connection error. Retrying in {delay}s...")
                time.sleep(delay)
            except requests.exceptions.Timeout:
                delay = delays[min(attempt, len(delays) - 1)]
                print(f"  [{self.name}] Timeout. Retrying in {delay}s...")
                time.sleep(delay)
            except Exception as e:
                print(f"  [{self.name}] Error: {e}")
                return None

        print(f"  [{self.name}] All {retries} retries failed for {url[:80]}")
        return None

    def scrape(self) -> list:
        """Abstract method — child classes must implement. Returns list of company dicts."""
        raise NotImplementedError(f"{self.name} scraper must implement scrape()")

    def run(self, db_client) -> dict:
        """Orchestrate: scrape -> upsert to DB -> report stats."""
        records = self.scrape()
        result = db_client.batch_upsert(records)
        print(f"  > [{self.name}] scraped {len(records)}, inserted {result['inserted']}, failed {result['failed']}")
        return {"scraped": len(records), **result}

    def clean_text(self, text: str) -> str:
        """Strip and normalize whitespace. Returns empty string for None."""
        if not text:
            return ""
        import re
        text = text.strip()
        text = re.sub(r'\s+', ' ', text)
        text = ''.join(c for c in text if c.isprintable())
        return text

    def extract_domain(self, url: str) -> str | None:
        """Extract bare domain from a URL (e.g. 'example.com' from 'https://www.example.com/about')."""
        if not url:
            return None
        import re
        match = re.search(r'https?://(?:www\.)?([^/]+)', url)
        return match.group(1).lower() if match else None

    def infer_region(self, country: str) -> str | None:
        """Look up country in REGIONS dict and return region name or None."""
        if not country:
            return None
        for region, countries in REGIONS.items():
            if country in countries:
                return region
        return None

    def paginate(self, url_template: str, start: int = 1, step: int = 1, max_pages: int = 20) -> list:
        """Generate a list of paginated URLs from a template string."""
        return [url_template.format(page=start + i * step) for i in range(max_pages)]
