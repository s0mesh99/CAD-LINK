import os
import re
import json
import time
from playwright.sync_api import sync_playwright
import google.generativeai as genai
from db.client import DatabaseClient
from dotenv import load_dotenv

class DeepEnrichmentScraper:
    def __init__(self):
        self.db = DatabaseClient()
        load_dotenv()
        
        from utils.gemini_rotator import rotator
        self.rotator = rotator
        
        # We have 4 Free Tier keys pooled together: 60 RPM combined limit.
        self.rpm_limit = 50 
        self.sleep_time = 60 / self.rpm_limit

    def fetch_website_text(self, domain):
        """Uses Playwright to fetch the innerText of the homepage."""
        if not domain.startswith('http'):
            url = f"https://{domain}"
        else:
            url = domain
            
        text_content = ""
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_default_timeout(15000)
                
                try:
                    page.goto(url)
                    time.sleep(2) # Wait for dynamic content
                    text_content += page.evaluate("document.body.innerText")
                    
                    # Try to find an 'About' or 'Contact' page
                    links = page.eval_on_selector_all("a", "elements => elements.map(e => e.href)")
                    about_links = [l for l in links if 'about' in l.lower()][:1]
                    if about_links:
                        page.goto(about_links[0])
                        time.sleep(2)
                        text_content += "\n\n" + page.evaluate("document.body.innerText")
                except Exception as e:
                    print(f"   [!] Failed to load {url}: {e}", flush=True)
                
                browser.close()
        except Exception as e:
            print(f"   [!] Playwright error: {e}", flush=True)
            
        return text_content[:15000] # Limit tokens sent to Gemini

    def extract_with_ai(self, text_content):
        """Passes the website text to Gemini to extract structured JSON."""
        if len(text_content.strip()) < 100:
            return None
            
        prompt = """You are an expert firmographics data extractor and business analyst.
Analyze the following text scraped from a company's website.
Extract the following information and return ONLY a valid JSON object.
Do not use markdown blocks.

CRITICAL OUTSOURCING FILTER:
Determine if this company is a good prospect for outsourcing/freelance CAD, drafting, or engineering work.
- Set "is_outsourcing_target": true IF they are an engineering, architectural, manufacturing, or construction firm that likely needs CAD drafting, 3D modeling, or design support.
- Set "is_outsourcing_target": false IF they are a generic software company, consumer brand, retail store, pure IT consulting, or explicitly state they do everything 100% in-house.

JSON Schema:
{
    "is_outsourcing_target": true,
    "city": "HQ City (or null if not found)",
    "country": "HQ Country (or null if not found)",
    "employee_size": "Estimated employee count like '50-200' (or null)",
    "notes": "A concise 1-2 sentence description of what the company does and their specific engineering niche.",
    "contact_name": "Full name of the CEO, Founder, or key executive (or null)",
    "contact_title": "Title of that executive (or null)"
}

Website Text:
""" + text_content

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.rotator.generate_content(
                    prompt, 
                    model_name='gemini-flash-latest', 
                    generation_config={"response_mime_type": "application/json"}
                )
                clean_text = response.text.strip()
                if clean_text.startswith("```json"):
                    clean_text = clean_text[7:]
                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]
                    
                result = json.loads(clean_text)
                return result
            except Exception as e:
                print(f"   [!] AI extraction error (Attempt {attempt+1}): {e}", flush=True)
                if attempt < max_retries - 1:
                    time.sleep(5)
                
        return None

    def run(self, limit=20):
        print("=== STARTING DEEP AI ENRICHMENT ===", flush=True)
        # Fetch leads that haven't been deep enriched yet (status is 'New Lead' or null)
        try:
            # First priority: Data Centers and Renewable Energy
            res = self.db.supabase.table('companies').select('*')\
                .eq('status', 'New Lead')\
                .not_.is_('domain', 'null')\
                .not_.is_('email_1', 'null')\
                .in_('sector', ['Data Center Construction', 'Renewable Energy'])\
                .limit(limit).execute()
            
            leads = res.data
            
            if len(leads) < limit:
                # Fallback to other sectors
                res2 = self.db.supabase.table('companies').select('*')\
                    .eq('status', 'New Lead')\
                    .not_.is_('domain', 'null')\
                    .not_.is_('email_1', 'null')\
                    .limit(limit - len(leads)).execute()
                leads.extend([l for l in res2.data if l['id'] not in [x['id'] for x in leads]])
                
        except Exception as e:
            print(f"Error fetching leads: {e}", flush=True)
            return
            
        if not leads:
            print("No leads need deep enrichment.", flush=True)
            return
            
        print(f"Found {len(leads)} leads to deep enrich.", flush=True)
        
        success_count = 0
        for idx, lead in enumerate(leads, 1):
            domain = lead.get('domain')
            print(f"\n[{idx}/{len(leads)}] Deep enriching {domain}...", flush=True)
            
            text_content = self.fetch_website_text(domain)
            if not text_content:
                print("   -> No text extracted. Skipping.", flush=True)
                continue
                
            print("   -> Text extracted. Querying Gemini...", flush=True)
            ai_data = self.extract_with_ai(text_content)
            
            if ai_data:
                is_target = ai_data.get('is_outsourcing_target', True) # Default to True if missing
                if is_target:
                    updates = {'status': 'Enriched'} # Update tracking status
                    if ai_data.get('city'): updates['city'] = ai_data['city']
                    if ai_data.get('country'): updates['country'] = ai_data['country']
                    if ai_data.get('employee_size'): updates['employee_size'] = ai_data['employee_size']
                    if ai_data.get('notes'): updates['notes'] = ai_data['notes']
                    if ai_data.get('contact_name'): updates['contact_name'] = ai_data['contact_name']
                    if ai_data.get('contact_title'): updates['contact_title'] = ai_data['contact_title']
                    
                    # Update DB
                    self.db.supabase.table('companies').update(updates).eq('id', lead['id']).execute()
                    print(f"   -> Success! Found & Enriched: {updates}", flush=True)
                    success_count += 1
                else:
                    # AI determined they are not an outsourcing target
                    updates = {'status': 'Rejected', 'notes': 'AI Filter: Not a CAD/Outsourcing target.'}
                    self.db.supabase.table('companies').update(updates).eq('id', lead['id']).execute()
                    print(f"   -> AI Filter Rejected: Not an outsourcing target.", flush=True)
            else:
                print("   -> AI extraction failed. Marking as failed.", flush=True)
                self.db.supabase.table('companies').update({'status': 'Failed'}).eq('id', lead['id']).execute()
                
            time.sleep(self.sleep_time) # Respect rate limits
            
        print(f"\n=== DEEP ENRICHMENT COMPLETE ===", flush=True)
        print(f"Successfully enriched {success_count}/{len(leads)} leads.", flush=True)
