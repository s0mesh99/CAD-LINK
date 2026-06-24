import argparse
import sys
from scrapers.duckduckgo_search import DuckDuckGoScraper
from scrapers.pdf_miner import PDFMinerScraper
from scrapers.industry_rss import IndustryRSSScraper
from scrapers.gem_opendata import GeMOpenDataScraper
from scrapers.github_api import GithubApiScraper
from scrapers.domain_cluster import DomainClusterScraper
from scrapers.wikipedia_targeted import WikipediaTargetedScraper
from db.client import DatabaseClient

def run_scrapers():
    print("=== STARTING V1.3 SCRAPING PIPELINE ===")
    
    # Priority order based on expected yield and API limits
    scrapers = [
        GithubApiScraper(),
        WikipediaTargetedScraper(),
        DuckDuckGoScraper(),
        PDFMinerScraper(),
        IndustryRSSScraper(),
        GeMOpenDataScraper(),
        DomainClusterScraper(),
    ]
    
    for i, scraper in enumerate(scrapers, 1):
        print(f"\n[Stage {i}/{len(scrapers)}] Running {scraper.name}...")
        try:
            scraper.run()
        except Exception as e:
            print(f"Error running {scraper.name}: {e}")
    
    print("\n=== SCRAPING PIPELINE COMPLETE ===")

def pre_send_safety_check(db, phase: int) -> bool:
    """
    Run before every --send-emails call.
    Fails loud if anything looks wrong.
    Returns True only if safe to proceed.
    """
    import os
    ZOHO_EMAIL = os.environ.get('ZOHO_EMAIL', '')

    errors = []

    # Check 1: leads exist for this phase
    leads = db.get_leads_for_campaign(phase, limit=1)
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

def enrich_leads(limit=100):
    print(f"=== STARTING DUAL-ENGINE ENRICHMENT PIPELINE ===")
    from db.client import DatabaseClient
    from scrapers.company_website import extract_from_website
    from scrapers.dork_enrichment import DorkEnrichmentScraper
    
    db = DatabaseClient()
    if not db.supabase:
        print("No Supabase client.")
        return

    # Query leads with no email
    try:
        res = db.supabase.table('companies').select('*').is_('email_1', 'null').is_('contact_email', 'null').not_.is_('domain', 'null').limit(limit).execute()
        leads_to_enrich = res.data
    except Exception as e:
        print(f"Error fetching leads to enrich: {e}")
        return

    print(f"Found {len(leads_to_enrich)} leads missing emails. Enriching...")
    
    dorker = DorkEnrichmentScraper()
    enriched_count = 0
    dork_success = 0
    playwright_success = 0
    
    for idx, lead in enumerate(leads_to_enrich, 1):
        domain = lead.get('domain')
        print(f"\n[{idx}/{len(leads_to_enrich)}] Enriching {domain}...")
        try:
            # TIER 1: Dorking
            print("   -> Running Tier 1 (DuckDuckGo Dorking)...")
            extracted = dorker.find_email(domain)
            
            # TIER 2: Playwright (if Dorking fails)
            if not extracted.get('email_1'):
                print(f"   -> Tier 1 failed. Running Tier 2 (Playwright Headless Chrome)...")
                extracted = extract_from_website(domain)
            
            if extracted.get('email_1') or extracted.get('phone'):
                lead['email_1'] = extracted.get('email_1')
                lead['email_2'] = extracted.get('email_2')
                lead['phone'] = extracted.get('phone')
                lead['contact_name'] = extracted.get('contact_name')
                lead['contact_title'] = extracted.get('contact_title')
                
                db.upsert_company(lead)
                enriched_count += 1
                method = extracted.get('method', 'unknown')
                if method == 'dorking': dork_success += 1
                elif method == 'playwright': playwright_success += 1
                
                print(f"   -> [SUCCESS] Found via {method}! Email: {lead['email_1']} | Phone: {lead['phone']}")
            else:
                print("   -> [FAILED] No contact info found via either method.")
        except Exception as e:
            print(f"   -> Error enriching {domain}: {e}")
            
    print(f"\n=== ENRICHMENT COMPLETE ===")
    print(f"Total Leads Processed: {len(leads_to_enrich)}")
    print(f"Total Enriched: {enriched_count}")
    print(f"Tier 1 (Dorking) Wins: {dork_success}")
    print(f"Tier 2 (Playwright) Wins: {playwright_success}")

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
    parser.add_argument('--run-enrichment', action='store_true', help="Enrich leads missing emails")
    parser.add_argument('--run-deep-enrichment', action='store_true', help="Deeply enrich leads with firmographics via AI")
    parser.add_argument('--send-emails', action='store_true', help="Send automated cold emails")
    parser.add_argument('--email-limit', type=int, default=20, help="Max number of emails to send")
    parser.add_argument('--phase', type=int, default=1, choices=[1,2,3], help="Campaign phase (1=ME, 2=India, 3=All)")
    parser.add_argument('--dry-run', action='store_true', help="Print emails to console instead of sending")
    parser.add_argument('--status', action='store_true', help="Show database statistics")
    
    parser.add_argument('--run-blaster', action='store_true', help="Run the V1.5 automated campaign blaster (50 emails/day)")
    
    args = parser.parse_args()
    
    if args.run_scrapers:
        run_scrapers()
        
    if args.run_enrichment:
        enrich_leads(limit=10000)
        
    if args.run_deep_enrichment:
        from scrapers.deep_enrichment import DeepEnrichmentScraper
        scraper = DeepEnrichmentScraper()
        scraper.run(limit=10000)
    if args.run_blaster:
        from mailer.campaign_blaster import run_campaign
        run_campaign()
        
    if args.send_emails:
        from db.client import DatabaseClient
        db = DatabaseClient()
        if pre_send_safety_check(db, args.phase):
            from mailer.zoho import send_campaign
            send_campaign(
                phase=args.phase,
                limit=args.email_limit,
                dry_run=args.dry_run
            )
        
    if args.status:
        show_stats()
        
    if not any(vars(args).values()):
        parser.print_help()

