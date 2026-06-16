-- Run this script in your Supabase SQL Editor to update your existing tables

-- 1. Add the missing columns to the existing 'companies' table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_title TEXT,
ADD COLUMN IF NOT EXISTS contact_linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_confidence INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_active_tender INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tender_description TEXT,
ADD COLUMN IF NOT EXISTS tender_source TEXT,
ADD COLUMN IF NOT EXISTS tender_value TEXT,
ADD COLUMN IF NOT EXISTS source_method TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Create the missing 'email_tracking' table
CREATE TABLE IF NOT EXISTS email_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    
    -- Track events
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    open_count INTEGER DEFAULT 0,
    replied INTEGER DEFAULT 0,
    
    -- Follow-up logic
    follow_up_due TIMESTAMPTZ,
    follow_up_sent INTEGER DEFAULT 0,
    campaign_phase INTEGER DEFAULT 1,
    bounced INTEGER DEFAULT 0
);
