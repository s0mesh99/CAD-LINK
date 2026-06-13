import argparse
import sys
from scrapers.duckduckgo_search import DuckDuckGoScraper
from scrapers.pdf_miner import PDFMinerScraper
from scrapers.industry_rss import IndustryRSSScraper
from scrapers.gem_opendata import GeMOpenDataScraper
from scrapers.bing_search import BingSearchScraper
from scrapers.github_lists import GithubListsScraper
from scrapers.github_api import GithubApiScraper
from scrapers.domain_cluster import DomainClusterScraper
from db.client import DatabaseClient

def run_scrapers():
    print("=== STARTING V1.3 SCRAPING PIPELINE ===")
    
    # Priority order based on expected yield and API limits
    scrapers = [
        GithubApiScraper(),
        DuckDuckGoScraper(),
        PDFMinerScraper(),
        IndustryRSSScraper(),
        GeMOpenDataScraper(),
        BingSearchScraper(),
        GithubListsScraper(),
        DomainClusterScraper(),
    ]
    
    for i, scraper in enumerate(scrapers, 1):
        print(f"\n[Stage {i}/{len(scrapers)}] Running {scraper.name}...")
        try:
            scraper.run()
        except Exception as e:
            print(f"Error running {scraper.name}: {e}")
    
    print("\n=== SCRAPING PIPELINE COMPLETE ===")

def pre_send_safety_check(conn, phase: int) -> bool:
    """
    Run before every --send-emails call.
    Fails loud if anything looks wrong.
    Returns True only if safe to proceed.
    """
    import os
    from mailer.zoho import get_leads_for_campaign
    ZOHO_EMAIL = os.environ.get('ZOHO_EMAIL', '')

    errors = []

    # Check 1: leads exist for this phase
    leads = get_leads_for_campaign(conn, phase, limit=1)
    if not leads:
        errors.append(
            "NO LEADS FOUND for this phase. "
            "Run scrapers first: python run.py --run-scrapers"
        )

    # Check 2: first lead is not sending to self
    if leads:
        lead = dict(leads[0])
        recipient = (lead.get('contact_email') or
                     lead.get('email') or '')
        if recipient == ZOHO_EMAIL and ZOHO_EMAIL != '':
            errors.append(
                f"FIRST LEAD WOULD SEND TO SELF ({ZOHO_EMAIL}). "
                f"Fix lead data or query."
            )
        if 'test' in lead.get('name','').lower():
            errors.append(
                f"FIRST LEAD IS A TEST COMPANY: {lead.get('name')}. "
                f"Clean your database."
            )

    if errors:
        print("\n[!] PRE-SEND SAFETY CHECK FAILED:")
        for e in errors:
            print(f"   [X] {e}")
        print("\nFix these before sending any emails.\n")
        return False

    print("[OK] Pre-send safety check passed. Proceeding...\n")
    return True

def show_stats():
    from db.client import DatabaseClient
    db = DatabaseClient()
    try:
        stats = db.get_stats()
        print("\n=== CAD LINK V1.3 DB STATS ===")
        print(f"Total Companies: {stats.get('total', 0)}")
        print(f"Added Today:     {stats.get('added_today', 0)}")
        print("\nBy Sector:")
        for k, v in stats.get('by_sector', {}).items():
            print(f"  - {k}: {v}")
        print("\nBy Region:")
        for k, v in stats.get('by_region', {}).items():
            print(f"  - {k}: {v}")
    except Exception as e:
        print(f"Error fetching stats: {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="CAD LINK Freelance Bot V1.3")
    parser.add_argument('--run-scrapers', action='store_true', help="Run all data scrapers")
    parser.add_argument('--send-emails', action='store_true', help="Send automated cold emails")
    parser.add_argument('--email-limit', type=int, default=20, help="Max number of emails to send")
    parser.add_argument('--phase', type=int, default=1, choices=[1,2,3], help="Campaign phase (1=ME, 2=India, 3=All)")
    parser.add_argument('--dry-run', action='store_true', help="Print emails to console instead of sending")
    parser.add_argument('--status', action='store_true', help="Show database statistics")
    
    args = parser.parse_args()
    
    if args.run_scrapers:
        run_scrapers()
        
    if args.send_emails:
        import sqlite3
        from db.schema import DB_PATH
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        if pre_send_safety_check(conn, args.phase):
            from mailer.zoho import send_campaign
            send_campaign(
                phase=args.phase,
                limit=args.email_limit,
                dry_run=args.dry_run
            )
        conn.close()
        
    if args.status:
        show_stats()
        
    if not any(vars(args).values()):
        parser.print_help()

