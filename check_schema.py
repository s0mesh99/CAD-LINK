import os
from supabase import create_client

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_KEY")
supabase = create_client(url, key)

res = supabase.table('companies').select('*').limit(1).execute()
if res.data:
    print(list(res.data[0].keys()))
else:
    print("No data.")
