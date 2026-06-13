import sqlite3
import os

DB_PATH = 'cadlink.db'

def init_db():
    print(f"Initializing SQLite database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Core Companies Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        domain TEXT UNIQUE,
        sector TEXT,
        sub_sector TEXT,
        country TEXT,
        region TEXT,
        city TEXT,
        source TEXT,
        email_1 TEXT,
        email_2 TEXT,
        phone TEXT,
        employee_count TEXT,
        revenue_range TEXT,
        quality_score INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- V1.2 Additions
        contact_name TEXT,
        contact_title TEXT,
        contact_linkedin_url TEXT,
        contact_email TEXT,
        contact_confidence INTEGER DEFAULT 0,
        has_active_tender INTEGER DEFAULT 0,
        tender_description TEXT,
        tender_source TEXT,
        source_method TEXT
    )
    ''')

    # 2. Outreach Activity (Call & Email Queue)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS outreach_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        follow_up_at TIMESTAMP,
        done INTEGER DEFAULT 0,
        FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
    ''')

    # 3. Pipeline Health Per Run (Scraper Logs)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS scraper_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scraper_name TEXT NOT NULL,
        status TEXT NOT NULL,
        records_found INTEGER DEFAULT 0,
        new_leads_added INTEGER DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
    )
    ''')

    # 4. V1.2 Email Tracking Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS email_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER,
        recipient_email TEXT,
        recipient_name TEXT,
        subject TEXT,
        sent_at TIMESTAMP,
        opened_at TIMESTAMP,
        open_count INTEGER DEFAULT 0,
        replied INTEGER DEFAULT 0,
        bounced INTEGER DEFAULT 0,
        follow_up_due TIMESTAMP,
        follow_up_sent INTEGER DEFAULT 0,
        campaign_phase INTEGER,
        FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
    ''')

    conn.commit()
    conn.close()
    print("Database initialized successfully with V1.2 schema.")

if __name__ == '__main__':
    init_db()
