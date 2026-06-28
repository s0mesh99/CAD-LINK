import os
import smtplib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
from supabase import create_client, Client

from mailer.templates import select_template, render_template
from mailer.zoho import plain_to_html
from db.client import DatabaseClient
import google.generativeai as genai

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
ZOHO_EMAIL = os.environ.get("ZOHO_EMAIL")
ZOHO_PASSWORD = os.environ.get("ZOHO_APP_PASSWORD")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Protect the main domain: Send very small batches to avoid spam filters
# Since the Action runs 6 times a day, 4 per batch = 24 emails per day.
BATCH_LIMIT = 4

def run_campaign():
    print("[Campaign Blaster] Starting Automated Campaign Blaster...")
    
    if not all([SUPABASE_URL, SUPABASE_KEY, ZOHO_EMAIL, ZOHO_PASSWORD]):
        print("[X] Missing environment variables for Campaign Blaster. Exiting.")
        return

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    db = DatabaseClient()

    try:
        # 1. Fetch previously contacted company IDs
        print("[DB] Fetching tracking data to prevent duplicates...")
        tracking_res = supabase.table('email_tracking').select('company_id').execute()
        contacted_ids = set()
        if tracking_res.data:
            contacted_ids = {row['company_id'] for row in tracking_res.data}
        
        # 2. Fetch Enriched Leads
        print("[DB] Fetching Enriched Leads...")
        leads_res = supabase.table('companies').select('*').eq('status', 'Enriched').order('quality_score', desc=True).execute()
        
        if not leads_res.data:
            print("[-] No Enriched Leads found in the database. Run Deep Enrichment first.")
            return
            
        leads = leads_res.data
    except Exception as e:
        print(f"[X] Database error while fetching leads: {e}")
        return
    
    # 3. Filter Leads
    target_leads = []
    for lead in leads:
        # Check if already contacted
        if lead['id'] in contacted_ids:
            continue
            
        # Check if they have an email
        best_email = lead.get('contact_email') or lead.get('email_1') or lead.get('email_2') or lead.get('email')
        if not best_email:
            continue
            
        # Sanitize the email to prevent bounces (e.g. %20equinix@...)
        import urllib.parse
        best_email = urllib.parse.unquote(best_email).replace(" ", "").replace("mailto:", "").strip().lower()
        
        if not best_email or "@" not in best_email:
            continue
            
        # We removed the strict contact_name requirement.
        # Now, clean generic emails (that pass the STRICT FILTERING below) will also be emailed.
            
        # STRICT FILTERING: Reject generic info@/support@ emails and dummy placeholders
        GENERIC_PREFIXES = ['info@', 'support@', 'privacy@', 'media', 'investor', 'careers@', 'hr@', 'sales@', 'marketing@', 'ops@', 'admin@', 'admissions@', 'press@', 'contact@', 'hello@', 'reply', 'mail@']
        DUMMY_DOMAINS = ['example.com', 'example.org', 'test.com']
        
        is_generic = any(best_email.startswith(p) for p in GENERIC_PREFIXES)
        is_dummy = any(d in best_email for d in DUMMY_DOMAINS)
        
        if is_generic or is_dummy:
            print(f"[-] Skipping {lead.get('name')} because email is generic/junk: {best_email}")
            continue
            
        lead['_target_email'] = best_email
        target_leads.append(lead)
        
        if len(target_leads) >= BATCH_LIMIT:
            break
            
    print(f"[*] Found {len(target_leads)} new Premium Leads ready for outreach.")
    
    if not target_leads:
        print("[OK] Campaign complete. All premium leads have already been contacted.")
        return

    # 4. Connect to Zoho SMTP
    print("[SMTP] Connecting to Zoho SMTP...")
    sent_count = 0
    
    try:
        with smtplib.SMTP_SSL('smtp.zoho.in', 465) as smtp:
            smtp.login(ZOHO_EMAIL, ZOHO_PASSWORD)
            
            for lead in target_leads:
                try:
                    # AI Custom Icebreaker Generation
                    if lead.get('notes') and GEMINI_API_KEY:
                        try:
                            prompt = f"""You are sending a cold email to a prospective client.
Company Notes: "{lead['notes']}"
Write a single, friendly, casual 10-15 word sentence saying you visited their website and noticed the kind of work they do, complimenting them briefly or acknowledging their specific niche.
Start the sentence exactly with "I have visited your website and...". Do not use quotes or markdown. Keep it very natural and professional."""
                            model = genai.GenerativeModel('gemini-flash-latest')
                            response = model.generate_content(prompt)
                            if response.text:
                                lead['icebreaker'] = response.text.strip().strip('"')
                        except Exception as e:
                            print(f"  [!] AI Icebreaker failed for {lead.get('name')}: {e}")
                    
                    # Select and Render Template
                    subject_template, body_template, template_name = select_template(lead)
                    subject = render_template(subject_template, lead)
                    body = render_template(body_template, lead)
                    recipient = lead['_target_email']
                    
                    # Build Email
                    from email.utils import formataddr
                    msg = MIMEMultipart('alternative')
                    msg['From'] = f"Somesh Nammina <{ZOHO_EMAIL}>"
                    
                    contact_name = lead.get('contact_name')
                    contact_name = str(contact_name).strip() if contact_name else ''
                    if contact_name:
                        msg['To'] = formataddr((contact_name, recipient))
                    else:
                        msg['To'] = recipient
                        
                    msg['Subject'] = subject
                    
                    msg.attach(MIMEText(body, 'plain'))
                    html_body = plain_to_html(body)
                    msg.attach(MIMEText(html_body, 'html'))
                    
                    # Send
                    print(f"  -> [{sent_count+1}/{len(target_leads)}] Sending '{template_name}' to {lead.get('name')} ({recipient})...")
                    smtp.sendmail(ZOHO_EMAIL, recipient, msg.as_string())
                    
                    # Log to Supabase using db client to auto-calculate follow_up_due
                    db.log_email_sent(
                        company_id=lead['id'],
                        recipient_email=recipient,
                        recipient_name=lead.get('contact_name', lead.get('name')),
                        subject=subject,
                        phase=1,
                        template_name=template_name
                    )
                    
                    # Update company status to Contacted
                    supabase.table('companies').update({'status': 'Contacted'}).eq('id', lead['id']).execute()
                    
                    sent_count += 1
                    
                    # Sleep to prevent spam rate limiting (10 seconds between emails)
                    if sent_count < len(target_leads):
                        time.sleep(10)
                        
                except Exception as e:
                    print(f"[X] Failed to send to {lead.get('name')}: {str(e)}")
                    continue
                    
    except Exception as e:
        print(f"[!] SMTP Connection Error: {str(e)}")
        
    print(f"[OK] Campaign run complete. Sent {sent_count} emails.")

if __name__ == "__main__":
    run_campaign()
