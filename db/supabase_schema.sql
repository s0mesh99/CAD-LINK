-- ──────────────────────────────────────────────
-- CAD LINK — Supabase Schema (PostgreSQL)
-- Run this in the Supabase SQL Editor
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contact Person
    contact_name TEXT,
    contact_title TEXT,
    contact_linkedin_url TEXT,
    contact_email TEXT,
    contact_confidence INTEGER DEFAULT 0,
    
    -- Project/Tender Signals
    has_active_tender INTEGER DEFAULT 0,
    tender_description TEXT,
    tender_source TEXT,
    tender_value TEXT,
    
    -- Scraper Meta
    source_method TEXT,
    source_url TEXT,
    notes TEXT
);

-- Auto-update updated_at timestamp
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
