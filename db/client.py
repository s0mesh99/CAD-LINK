import sqlite3
import os
from datetime import datetime, timezone

from db.schema import calculate_quality_score

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cadlink.db')

class DatabaseClient:
    """SQLite database client for company lead management (V1.2)."""

    def __init__(self):
        self.db_path = DB_PATH
        # Ensure db exists and has tables
        if not os.path.exists(self.db_path):
            print(f"[DB] WARNING: Database {self.db_path} not found. Run db/init_sqlite.py first.")

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def upsert_company(self, data: dict) -> bool:
        """Upsert a single company record using domain as conflict key."""
        try:
            with self._get_conn() as conn:
                # Recalculate V1.2 quality score
                data['quality_score'] = calculate_quality_score(data)
                
                columns = list(data.keys())
                placeholders = ', '.join(['?'] * len(columns))
                updates = ', '.join([f"{col}=excluded.{col}" for col in columns])
                
                sql = f'''
                    INSERT INTO companies ({', '.join(columns)})
                    VALUES ({placeholders})
                    ON CONFLICT(domain) DO UPDATE SET
                    {updates}, updated_at=CURRENT_TIMESTAMP
                '''
                conn.execute(sql, tuple(data.values()))
            return True
        except Exception as e:
            print(f"[DB] upsert FAILED for {data.get('name', '?')}: {e}")
            return False

    def batch_upsert(self, records: list) -> dict:
        """Upsert a list of company records."""
        inserted, failed = 0, 0
        try:
            with self._get_conn() as conn:
                for data in records:
                    try:
                        data['quality_score'] = calculate_quality_score(data)
                        columns = list(data.keys())
                        placeholders = ', '.join(['?'] * len(columns))
                        updates = ', '.join([f"{col}=excluded.{col}" for col in columns if col != 'domain'])
                        
                        sql = f'''
                            INSERT INTO companies ({', '.join(columns)})
                            VALUES ({placeholders})
                            ON CONFLICT(domain) DO UPDATE SET
                            {updates}, updated_at=CURRENT_TIMESTAMP
                        '''
                        conn.execute(sql, tuple(data.values()))
                        inserted += 1
                    except Exception as e:
                        print(f"[DB] Row upsert FAILED: {e}")
                        failed += 1
            return {"inserted": inserted, "failed": failed}
        except Exception as e:
            print(f"[DB] batch upsert FAILED: {e}")
            return {"inserted": inserted, "failed": failed}

    def get_companies(self, filters: dict = None, limit: int = 5000) -> list:
        """Query companies with optional filters. Returns list of dicts."""
        try:
            with self._get_conn() as conn:
                query = "SELECT * FROM companies"
                params = []
                
                if filters:
                    conditions = []
                    for k, v in filters.items():
                        conditions.append(f"{k} = ?")
                        params.append(v)
                    if conditions:
                        query += " WHERE " + " AND ".join(conditions)
                        
                query += f" ORDER BY created_at DESC LIMIT {limit}"
                
                cursor = conn.execute(query, params)
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"[DB] query FAILED: {e}")
            return []

    def get_uncontacted_premium_leads(self, limit: int = 50) -> list:
        """Get highly rated leads (score >= 4) with emails that haven't been emailed yet."""
        try:
            with self._get_conn() as conn:
                query = '''
                    SELECT id, name, email_1, quality_score, contact_name 
                    FROM companies 
                    WHERE quality_score >= 4 
                    AND (email_1 IS NOT NULL OR contact_email IS NOT NULL)
                    AND id NOT IN (
                        SELECT company_id FROM outreach_activity WHERE type = 'email'
                    )
                    ORDER BY quality_score DESC, created_at DESC
                    LIMIT ?
                '''
                cursor = conn.execute(query, (limit,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"[DB] fetching uncontacted leads FAILED: {e}")
            return []

    def log_outreach(self, company_id: str, outreach_type: str, status: str, notes: str = "", follow_up_at: str = None) -> bool:
        """Log a new call or email attempt into the outreach_activity table."""
        try:
            with self._get_conn() as conn:
                conn.execute('''
                    INSERT INTO outreach_activity (company_id, type, status, notes, follow_up_at)
                    VALUES (?, ?, ?, ?, ?)
                ''', (company_id, outreach_type, status, notes, follow_up_at))
            return True
        except Exception as e:
            print(f"[DB] outreach log FAILED for {company_id}: {e}")
            return False
            
    def log_scraper_run(self, scraper_name: str, status: str, records_found: int, new_leads_added: int = 0, error_message: str = None) -> bool:
        """Log the result of a scraper run."""
        try:
            with self._get_conn() as conn:
                conn.execute('''
                    INSERT INTO scraper_runs (scraper_name, status, records_found, new_leads_added, error_message, completed_at)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ''', (scraper_name, status, records_found, new_leads_added, error_message))
            return True
        except Exception as e:
            print(f"[DB] scraper run log FAILED for {scraper_name}: {e}")
            return False

    def get_stats(self) -> dict:
        """Return summary stats: total count, counts by sector, and today's additions."""
        try:
            with self._get_conn() as conn:
                total = conn.execute("SELECT COUNT(*) FROM companies").fetchone()[0]
                
                cursor = conn.execute("SELECT sector, COUNT(*) FROM companies GROUP BY sector")
                by_sector = {row[0]: row[1] for row in cursor.fetchall() if row[0]}
                
                cursor = conn.execute("SELECT region, COUNT(*) FROM companies GROUP BY region")
                by_region = {row[0]: row[1] for row in cursor.fetchall() if row[0]}
                
                added_today = conn.execute("SELECT COUNT(*) FROM companies WHERE date(created_at) = date('now')").fetchone()[0]
                
                return {
                    "total": total,
                    "by_sector": by_sector,
                    "by_region": by_region,
                    "added_today": added_today
                }
        except Exception as e:
            print(f"[DB] stats FAILED: {e}")
            return {"total": "N/A", "added_today": "N/A"}
