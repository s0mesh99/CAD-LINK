# ──────────────────────────────────────────────
# CAD LINK — EPC Lead Scraper Configuration
# ──────────────────────────────────────────────

# Target industry sectors and their sub-sectors
SECTORS = {
    "epc":         ["civil", "structural", "MEP", "process_plant", "piping", "instrumentation"],
    "oil_gas":     ["upstream", "downstream", "midstream", "offshore", "refinery", "LNG", "pipeline"],
    "energy":      ["power_generation", "solar", "wind", "hydro", "transmission", "nuclear", "storage"],
    "data_center": ["hyperscale", "colocation", "edge", "cloud_infrastructure", "design_build"],
    "engineering": ["engineering_consultancy", "design", "PMC"]
}

# Geographic regions and their member countries
REGIONS = {
    "MENA":     ["Saudi Arabia", "UAE", "United Arab Emirates", "Qatar", "Kuwait", "Oman", "Bahrain", "Iraq", "Egypt", "Libya"],
    "APAC":     ["India", "Australia", "Singapore", "Malaysia", "Indonesia", "Thailand", "Japan", "South Korea", "China"],
    "Americas": ["USA", "United States", "Canada", "Brazil", "Mexico", "Colombia", "Chile", "Argentina", "Peru"],
    "EMEA":     ["UK", "United Kingdom", "Germany", "France", "Netherlands", "Italy", "Spain", "Norway", "Denmark", "Belgium", "Poland"]
}

# HTTP scraper configuration — controls request behavior
SCRAPER_CONFIG = {
    "request_delay":    2.5,                # seconds between HTTP requests (be polite)
    "retry_delay":      [2, 5, 10],         # backoff seconds for retries 1/2/3
    "max_retries":      3,                  # max retry attempts per request
    "timeout":          15,                 # HTTP request timeout in seconds
    "batch_size":       50,                 # DB upsert batch size
    "user_agent":       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# Export settings
EXPORT_CONFIG = {
    "output_dir":        "exports/",        # directory for CSV/Excel output files
    "date_format":       "%Y-%m-%d",        # date format for filenames
    "max_rows_per_file": 5000               # max rows per export file
}
