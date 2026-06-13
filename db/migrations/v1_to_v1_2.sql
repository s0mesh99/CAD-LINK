-- db/migrations/v1_to_v1_2.sql
-- Run once on existing database

ALTER TABLE companies ADD COLUMN contact_name TEXT;
ALTER TABLE companies ADD COLUMN contact_title TEXT;
ALTER TABLE companies ADD COLUMN contact_linkedin_url TEXT;
ALTER TABLE companies ADD COLUMN contact_email TEXT;
ALTER TABLE companies ADD COLUMN contact_confidence INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN has_active_tender INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN tender_description TEXT;
ALTER TABLE companies ADD COLUMN tender_source TEXT;
ALTER TABLE companies ADD COLUMN region TEXT;
ALTER TABLE companies ADD COLUMN source_method TEXT;

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
    FOREIGN KEY(company_id) REFERENCES companies(id)
);
