import os
import smtplib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
from supabase import create_client, Client

from mailer.templates import select_template, render_template
from mailer.zoho import plain_to_html

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
ZOHO_EMAIL = os.environ.get("ZOHO_EMAIL")
ZOHO_PASSWORD = os.environ.get("ZOHO_APP_PASSWORD")

DAILY_LIMIT = 50

def run_campaign():
    print("[Campaign Blaster] Starting Automated Campaign Blaster...")
    
    if not all([SUPABASE_URL, SUPABASE_KEY, ZOHO_EMAIL, ZOHO_PASSWORD]):
        print("[X] Missing environment variables for Campaign Blaster. Exiting.")
        return

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 1. Fetch previously contacted company IDs
    print("[DB] Fetching tracking data to prevent duplicates...")
    tracking_res = supabase.table('email_tracking').select('company_id').execute()
    contacted_ids = set()
    if tracking_res.data:
        contacted_ids = {row['company_id'] for row in tracking_res.data}
    
    # 2. Fetch Premium Leads
    print("[DB] Fetching Premium Leads (Score >= 3)...")
    leads_res = supabase.table('companies').select('*').gte('quality_score', 3).order('quality_score', desc=True).execute()
    
    if not leads_res.data:
        print("[-] No Premium Leads found in the database.")
        return
        
    leads = leads_res.data
    
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
        
        if len(target_leads) >= DAILY_LIMIT:
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
                    # Select and Render Template
                    subject_template, body_template, template_name = select_template(lead)
                    subject = render_template(subject_template, lead)
                    body = render_template(body_template, lead)
                    recipient = lead['_target_email']
                    
                    # Build Email
                    from email.utils import formataddr
                    msg = MIMEMultipart('alternative')
                    msg['From'] = f"Somesh Nammina <{ZOHO_EMAIL}>"
                    
                    contact_name = lead.get('contact_name', '').strip()
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
                    
                    # Log to Supabase
                    supabase.table('email_tracking').insert({
                        'company_id': lead['id'],
                        'recipient_email': recipient,
                        'recipient_name': lead.get('contact_name', lead.get('name')),
                        'subject': subject,
                        'campaign_phase': 1,
                        'open_count': 0,
                        'replied': 0,
                        'bounced': 0
                    }).execute()
                    
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
