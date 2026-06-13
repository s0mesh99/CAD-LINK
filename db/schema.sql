-- ──────────────────────────────────────────────
-- CAD LINK — EPC Lead Scraper — Database Schema
-- Run this SQL in Supabase SQL Editor once
-- ──────────────────────────────────────────────

-- 1. Core Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name             TEXT NOT NULL,
    domain           TEXT UNIQUE,
    sector           TEXT NOT NULL CHECK (sector IN ('epc','oil_gas','energy','data_center','engineering')),
    sub_sector       TEXT,
    country          TEXT,
    region           TEXT,
    city             TEXT,
    source           TEXT NOT NULL,
    email_1          TEXT,
    email_2          TEXT,
    phone            TEXT,
    employee_count   TEXT,
    revenue_range    TEXT,
    quality_score    INT DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade existing table with new columns if they don't exist
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_1 TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_2 TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee_count TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS revenue_range TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS quality_score INT DEFAULT 0;

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_companies_sector       ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_region       ON companies(region);
CREATE INDEX IF NOT EXISTS idx_companies_country      ON companies(country);
CREATE INDEX IF NOT EXISTS idx_companies_created_at   ON companies(created_at);
CREATE INDEX IF NOT EXISTS idx_companies_source       ON companies(source);
CREATE INDEX IF NOT EXISTS idx_companies_quality      ON companies(quality_score);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_updated_at ON companies;
CREATE TRIGGER trigger_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate quality score (0-5)
CREATE OR REPLACE FUNCTION calculate_quality_score()
RETURNS TRIGGER AS $$
DECLARE
    score INT := 0;
BEGIN
    IF NEW.name IS NOT NULL THEN score := score + 1; END IF;
    IF NEW.domain IS NOT NULL THEN score := score + 1; END IF;
    IF NEW.email_1 IS NOT NULL OR NEW.email_2 IS NOT NULL THEN score := score + 1; END IF;
    IF NEW.phone IS NOT NULL THEN score := score + 1; END IF;
    IF NEW.country IS NOT NULL THEN score := score + 1; END IF;
    NEW.quality_score := score;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quality_score ON companies;
CREATE TRIGGER trigger_quality_score
    BEFORE INSERT OR UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION calculate_quality_score();

-- 2. Outreach Activity (Call & Email Queue)
CREATE TABLE IF NOT EXISTS outreach_activity (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN ('email', 'phone', 'linkedin')),
    status          TEXT NOT NULL CHECK (status IN ('voicemail', 'connected', 'not_interested', 'callback', 'email_sent', 'replied')),
    notes           TEXT,
    attempted_at    TIMESTAMPTZ DEFAULT NOW(),
    follow_up_at    TIMESTAMPTZ,
    done            BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_outreach_company ON outreach_activity(company_id);
CREATE INDEX IF NOT EXISTS idx_outreach_queue ON outreach_activity(follow_up_at) WHERE done = FALSE;

-- 3. Pipeline Health Per Run (Scraper Logs)
CREATE TABLE IF NOT EXISTS scraper_runs (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scraper_name    TEXT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('ok', 'partial', 'failed')),
    records_found   INT DEFAULT 0,
    new_leads_added INT DEFAULT 0,
    error_message   TEXT,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scraper_runs_time ON scraper_runs(started_at);
