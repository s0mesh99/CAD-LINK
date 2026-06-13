# CAD LINK — EPC Lead Scraper

Free, zero-cost B2B lead generation system for EPC, Oil & Gas, Energy, and Data Center companies worldwide. Built with Python, BeautifulSoup, and Supabase.

## Architecture

```
run.py                   ← CLI entry point (argparse)
├── scrapers/
│   ├── base.py          ← Abstract base class (retry, rate-limit)
│   ├── wikipedia.py     ← Wikipedia industry list scraper
│   ├── dcd.py           ← Data Center Dynamics scraper + seed list
│   └── regional_epc.py  ← Curated UAE/India O&G EPC seed list
├── db/
│   ├── client.py        ← Supabase database client
│   ├── deduplicator.py  ← Cross-scraper deduplication engine
│   └── schema.sql       ← PostgreSQL table definition
├── enrichers/
│   └── email_finder.py  ← Free web-crawling email discovery
├── filters/
│   └── segment.py       ← Quality scoring + segmentation
├── exporters/
│   └── csv_export.py    ← CSV + Excel export with column ordering
├── exports/             ← Generated output files
├── config.py            ← Configuration constants
└── .env                 ← Supabase credentials (not committed)
```

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set up environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# 3. Run the SQL schema in Supabase SQL Editor
# (copy contents of db/schema.sql)

# 4. Run the full pipeline
python run.py --all --export
```

## CLI Commands

```bash
# Run specific scrapers
python run.py --wiki              # Wikipedia industry lists
python run.py --dcd               # Data Center companies
python run.py --regional          # UAE/India O&G EPCs
python run.py --all               # Run everything

# Export options
python run.py --export-only                        # Export all from DB
python run.py --export-only --sector oil_gas        # Filter by sector
python run.py --export-only --region MENA           # Filter by region
python run.py --export-only --min-quality 3         # Only high-quality leads
python run.py --export-only --excel                 # Export as Excel
python run.py --export-only --segment-export        # One file per segment
```

## Data Flow

```
Scrapers → Deduplicator → Email Enricher → Supabase DB → CSV/Excel Export
```

## Quality Scoring (0-6)

Each company gets a score based on data completeness:
- +1 for domain, +1 for email, +1 for phone
- +1 for country, +1 for sector, +1 for employee_size

Use `--min-quality 3` to export only leads with 3+ fields filled.

## Tech Stack

| Component | Tool | Cost |
|-----------|------|------|
| Scraping | requests + BeautifulSoup4 | Free |
| Database | Supabase (PostgreSQL) | Free tier |
| Email Discovery | Custom web crawler | Free |
| Export | pandas + openpyxl | Free |
