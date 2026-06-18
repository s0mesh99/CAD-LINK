import os
from supabase import create_client

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_KEY")

if not url or not key:
    print("No Supabase credentials found in env.")
    exit(1)

supabase = create_client(url, key)

configs = [
    {
        "name": "Wikipedia Global Contractors",
        "target_url": "en.wikipedia.org",
        "schedule_cron": "0 0 1 * *",
        "is_active": True,
        "status": "idle",
        "items_scraped": 0
    },
    {
        "name": "DuckDuckGo Regional EPCs",
        "target_url": "html.duckduckgo.com",
        "schedule_cron": "0 2 * * *",
        "is_active": True,
        "status": "idle",
        "items_scraped": 0
    }
]

for config in configs:
    res = supabase.table("scraper_configs").insert(config).execute()
    print(f"Inserted: {config['name']}")
