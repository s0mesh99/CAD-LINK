import os
from supabase import create_client, Client
from db.schema import calculate_quality_score

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

class DatabaseClient:
    """Supabase API client for company lead management (V1.3)."""

    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("[DB] WARNING: SUPABASE_URL or SUPABASE_KEY environment variables not set.")
            self.supabase = None
        else:
            self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    def upsert_company(self, data: dict) -> bool:
        """Upsert a single company record using domain as conflict key."""
        if not self.supabase:
            return False
            
        try:
            data['quality_score'] = calculate_quality_score(data)
            self.supabase.table('companies').upsert(
                data, on_conflict='domain'
            ).execute()
            return True
        except Exception as e:
            print(f"[DB] upsert FAILED for {data.get('name', '?')}: {e}")
            return False

    def batch_upsert(self, records: list) -> dict:
        """Upsert a list of company records."""
        if not self.supabase:
            return {"inserted": 0, "failed": len(records)}
            
        inserted, failed = 0, 0
        
        for data in records:
            try:
                data['quality_score'] = calculate_quality_score(data)
                self.supabase.table('companies').upsert(
                    data, on_conflict='domain'
                ).execute()
                inserted += 1
            except Exception as e:
                print(f"[DB] Batch insert error: {e}")
                failed += 1
                
        return {"inserted": inserted, "failed": failed}

    def get_companies(self, filters: dict = None, limit: int = 5000) -> list:
        """Query companies with optional filters. Returns list of dicts."""
        if not self.supabase: return []
        try:
            query = self.supabase.table('companies').select('*').order('created_at', desc=True).limit(limit)
            if filters:
                for k, v in filters.items():
                    query = query.eq(k, v)
            return query.execute().data
        except Exception as e:
            print(f"[DB] query FAILED: {e}")
            return []

    def get_uncontacted_premium_leads(self, limit: int = 50) -> list:
        """Get highly rated leads (score >= 4) with emails that haven't been emailed yet."""
        if not self.supabase: return []
        try:
            # We fetch leads >= 4 score
            leads = self.supabase.table('companies').select('id, name, email_1, quality_score, contact_name, contact_email').gte('quality_score', 4).order('quality_score', desc=True).limit(limit * 2).execute().data
            
            # Filter those with emails
            leads_with_email = [l for l in leads if l.get('email_1') or l.get('contact_email')]
            
            # Fetch already contacted
            contacted = self.supabase.table('outreach_activity').select('company_id').eq('type', 'email').execute().data
            contacted_ids = {c['company_id'] for c in contacted}
            
            # Filter uncontacted
            final_leads = [l for l in leads_with_email if l['id'] not in contacted_ids]
            return final_leads[:limit]
        except Exception as e:
            print(f"[DB] fetching uncontacted leads FAILED: {e}")
            return []

    def log_outreach(self, company_id: str, outreach_type: str, status: str, notes: str = "", follow_up_at: str = None) -> bool:
        """Log a new call or email attempt into the outreach_activity table."""
        if not self.supabase: return False
        try:
            data = {
                'company_id': company_id,
                'type': outreach_type,
                'status': status,
                'notes': notes
            }
            if follow_up_at:
                data['follow_up_at'] = follow_up_at
                
            self.supabase.table('outreach_activity').insert(data).execute()
            return True
        except Exception as e:
            print(f"[DB] outreach log FAILED for {company_id}: {e}")
            return False
            
    def log_scraper_run(self, scraper_name: str, status: str, records_found: int, new_leads_added: int = 0, error_message: str = None) -> bool:
        """Log the result of a scraper run."""
        if not self.supabase: return False
        try:
            self.supabase.table('scraper_runs').insert({
                'scraper_name': scraper_name,
                'status': status,
                'records_found': records_found,
                'new_leads_added': new_leads_added,
                'error_message': error_message
            }).execute()
            return True
        except Exception as e:
            print(f"[DB] scraper run log FAILED for {scraper_name}: {e}")
            return False

    def get_stats(self) -> dict:
        if not self.supabase: return {"total": "N/A", "added_today": "N/A"}
        try:
            total = self.supabase.table('companies').select('id', count='exact').execute().count
            return {
                "total": total,
                "by_sector": {},
                "by_region": {},
                "added_today": "N/A"
            }
        except Exception as e:
            print(f"[DB] stats FAILED: {e}")
            return {"total": "N/A", "added_today": "N/A"}
