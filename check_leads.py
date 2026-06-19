import os
from supabase import create_client

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_KEY")

if not url or not key:
    print("No Supabase credentials found in env.")
    exit(1)

supabase = create_client(url, key)

res = supabase.table("companies").select("*").order("created_at", desc=True).limit(100).execute()
leads = res.data

print(f"Total leads fetched: {len(leads)}")

if not leads:
    print("No leads found in database.")
    exit()

with_email = sum(1 for l in leads if l.get("email_1") or l.get("email_2") or l.get("contact_email") or l.get("email"))
with_domain = sum(1 for l in leads if l.get("domain"))
sectors = {}
for l in leads:
    sec = l.get("sector") or "None"
    sectors[sec] = sectors.get(sec, 0) + 1

avg_score = sum(l.get("quality_score") or 0 for l in leads) / len(leads)

print(f"Leads with Email: {with_email}/{len(leads)} ({with_email/len(leads)*100:.1f}%)")
print(f"Leads with Domain: {with_domain}/{len(leads)} ({with_domain/len(leads)*100:.1f}%)")
print(f"Average Quality Score: {avg_score:.2f}/5.0")
print("Top Sectors:")
for k, v in sorted(sectors.items(), key=lambda x: x[1], reverse=True):
    print(f" - {k}: {v}")
    
print("\nSample Leads:")
for l in leads[:5]:
    print(f"[{l.get('quality_score')}/5] {l.get('name')} | {l.get('domain')} | {l.get('email_1') or l.get('contact_email') or l.get('email')} | {l.get('sector')}")
