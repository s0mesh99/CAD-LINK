import os, sys
sys.path.append(os.getcwd())
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
db = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
res = db.table('scraper_runs').select('*').order('started_at', desc=True).limit(5).execute()
print('Recent Runs:')
for r in res.data:
    print(f"{r['scraper_name']} at {r['started_at']} - {r['status']}")
