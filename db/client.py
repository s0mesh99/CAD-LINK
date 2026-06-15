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

    def domain_exists(self, domain: str) -> bool:
        if not self.supabase: return False
        domain = domain.lower().replace('www.', '').strip('/')
        try:
            res = self.supabase.table('companies').select('id').eq('domain', domain).execute()
            return len(res.data) > 0
        except Exception:
            return False

    def update_company(self, domain: str, updates: dict):
        if not self.supabase or not updates: return
        domain = domain.lower().replace('www.', '').strip('/')
        try:
            self.supabase.table('companies').update(updates).eq('domain', domain).execute()
        except Exception as e:
            print(f"[DB] Update error for {domain}: {e}")

    def get_leads_for_campaign(self, phase: int, limit: int) -> list:
        if not self.supabase: return []
        try:
            # We want leads not in email_tracking, so we fetch tracking data first
            tracking = self.supabase.table('email_tracking').select('company_id').execute()
            tracked_ids = [t['company_id'] for t in tracking.data]

            query = self.supabase.table('companies').select('*')
            
            # Simple Python filtering since Supabase complex OR/AND can be tricky
            res = query.order('quality_score', desc=True).limit(limit * 5).execute()
            leads = res.data
            
            valid_leads = []
            for c in leads:
                if c['id'] in tracked_ids: continue
                if not c.get('contact_email') and not c.get('email_1'): continue
                name = c.get('name', '').lower()
                if 'test' in name or 'example' in name: continue
                
                # Phase filters
                qs = c.get('quality_score') or 0
                country = c.get('country') or ''
                region = c.get('region') or ''
                
                if phase == 1:
                    high_value = ['United Arab Emirates', 'UAE', 'Saudi Arabia', 'Qatar', 'Oman', 'Kuwait', 'Bahrain']
                    if country in high_value or qs >= 8:
                        valid_leads.append(c)
                elif phase == 2:
                    if (region == 'India' or country == 'India') and qs >= 6:
                        valid_leads.append(c)
                else: # phase 3
                    if qs >= 5:
                        valid_leads.append(c)
                        
                if len(valid_leads) >= limit:
                    break
            return valid_leads
        except Exception as e:
            print(f"[DB] get_leads_for_campaign error: {e}")
            return []

    def get_due_follow_ups(self, limit: int = 20) -> list:
        if not self.supabase: return []
        try:
            from datetime import datetime
            now = datetime.now().isoformat()
            
            # Get tracking rows that need follow-up
            tracking_res = self.supabase.table('email_tracking').select('*').eq('replied', 0).eq('follow_up_sent', 0).eq('bounced', 0).lte('follow_up_due', now).order('open_count', desc=True).limit(limit).execute()
            
            if not tracking_res.data:
                return []
                
            # Fetch company details for these
            company_ids = [t['company_id'] for t in tracking_res.data]
            companies_res = self.supabase.table('companies').select('*').in_('id', company_ids).execute()
            company_map = {c['id']: c for c in companies_res.data}
            
            results = []
            for t in tracking_res.data:
                comp = company_map.get(t['company_id'])
                if comp:
                    t.update(comp) # merge company details into tracking dict
                    results.append(t)
            return results
        except Exception as e:
            print(f"[DB] get_due_follow_ups error: {e}")
            return []

    def log_email_sent(self, company_id, recipient_email, recipient_name, subject, phase):
        if not self.supabase: return
        from datetime import datetime, timedelta
        follow_up_due = (datetime.now() + timedelta(days=7)).isoformat()
        data = {
            'company_id': company_id,
            'recipient_email': recipient_email,
            'recipient_name': recipient_name,
            'subject': subject,
            'sent_at': datetime.now().isoformat(),
            'follow_up_due': follow_up_due,
            'campaign_phase': phase,
            'open_count': 0,
            'replied': 0,
            'follow_up_sent': 0,
            'bounced': 0
        }
        try:
            self.supabase.table('email_tracking').insert(data).execute()
        except Exception as e:
            print(f"[DB] log_email_sent error: {e}")

    def mark_follow_up_sent(self, tracking_id):
        if not self.supabase: return
        try:
            self.supabase.table('email_tracking').update({'follow_up_sent': 1}).eq('id', tracking_id).execute()
        except Exception as e:
            print(f"[DB] mark_follow_up_sent error: {e}")

    def track_email_open(self, company_id):
        if not self.supabase: return
        from datetime import datetime
        try:
            # fetch current
            res = self.supabase.table('email_tracking').select('opened_at', 'open_count').eq('company_id', company_id).execute()
            if res.data:
                row = res.data[0]
                updates = {
                    'open_count': (row.get('open_count') or 0) + 1,
                    'opened_at': row.get('opened_at') or datetime.now().isoformat()
                }
                self.supabase.table('email_tracking').update(updates).eq('company_id', company_id).execute()
        except Exception as e:
            print(f"[DB] track_email_open error: {e}")

    def track_email_click(self, company_id):
        if not self.supabase: return
        try:
            self.supabase.table('email_tracking').update({'replied': 1}).eq('company_id', company_id).execute()
        except Exception as e:
            print(f"[DB] track_email_click error: {e}")

    def get_tracking_stats(self) -> dict:
        if not self.supabase: return {"error": "No DB"}
        try:
            res = self.supabase.table('email_tracking').select('*').execute()
            data = res.data
            total_sent = len(data)
            total_opened = sum(1 for row in data if row.get('opened_at'))
            total_opens = sum(row.get('open_count') or 0 for row in data)
            total_replies = sum(1 for row in data if row.get('replied'))
            open_rate = round(total_opened * 100.0 / max(total_sent, 1), 1)
            
            return {
                'total_sent': total_sent,
                'unique_opens': total_opened,
                'total_opens': total_opens,
                'total_clicks': total_replies,
                'open_rate': f"{open_rate}%"
            }
        except Exception as e:
            return {"error": str(e)}

