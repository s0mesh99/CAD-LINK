import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'cadlink.db')

def migrate():
    print(f"Migrating database at {os.path.abspath(DB_PATH)} to V1.3...")
    conn = sqlite3.connect(DB_PATH)
    
    queries = [
        "ALTER TABLE companies ADD COLUMN source_url TEXT;",
        "ALTER TABLE companies ADD COLUMN tender_value TEXT;",
        "ALTER TABLE companies ADD COLUMN last_enriched TIMESTAMP;",
        "ALTER TABLE companies ADD COLUMN enrichment_attempts INT DEFAULT 0;",
        "ALTER TABLE companies ADD COLUMN linkedin_url TEXT;",
        "ALTER TABLE companies ADD COLUMN raw_text_snippet TEXT;",
        """
        CREATE TABLE IF NOT EXISTS rss_seen (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feed_url TEXT,
            entry_id TEXT UNIQUE,
            seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS pdf_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pdf_url TEXT UNIQUE,
            downloaded_at TIMESTAMP,
            parsed INTEGER DEFAULT 0,
            leads_found INTEGER DEFAULT 0
        );
        """
    ]
    
    for query in queries:
        try:
            conn.execute(query)
            print(f"Success: {query[:50]}...")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"Column already exists, skipping: {query[:50]}...")
            else:
                print(f"Error on query {query[:50]}... -> {e}")
                
    conn.commit()
    conn.close()
    print("V1.3 Migration Complete.")

if __name__ == "__main__":
    migrate()
