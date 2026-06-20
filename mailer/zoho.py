import smtplib, logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from mailer.templates import render_template, select_template
from db.client import DatabaseClient

ZOHO_SMTP_HOST = 'smtp.zoho.in'
ZOHO_SMTP_PORT = 465

def plain_to_html(plain_text: str) -> str:
    """
    Convert plain text email to minimal clean HTML.
    If the text already contains HTML tags like <p>, it preserves them.
    """
    logo_html = '''
    <br><br>
    <a href="https://cadlink.in" style="text-decoration:none;">
        <img src="https://cad-link.web.app/logo.png" alt="CAD LINK" width="140" style="display:block; margin-top:10px;">
    </a>
    '''
    
    # If the body is already HTML (from Supabase V1.2 templates)
    if '<p>' in plain_text or '<br>' in plain_text:
        html_content = plain_text
    else:
        lines = plain_text.strip().split('\n')
        html_lines = []
        for line in lines:
            line = line.strip()
            if not line:
                html_lines.append('<br>')
            elif line.startswith('•'):
                html_lines.append(f'<p style="margin:2px 0 2px 16px;">{line}</p>')
            else:
                html_lines.append(f'<p style="margin:4px 0;">{line}</p>')
        html_content = ''.join(html_lines)

    return f"""
    <html><body style="font-family:Arial,sans-serif;font-size:14px;
    color:#1C2833;max-width:560px;margin:0 auto;padding:20px;">
    {html_content}
    {logo_html}
    </body></html>
    """

def send_campaign(phase: int = 1, limit: int = 20,
                  dry_run: bool = False):
    """
    Main outreach function.
    dry_run=True prints emails to terminal without sending.
    """
    import os
    ZOHO_EMAIL    = os.environ.get('ZOHO_EMAIL') or 'somesh.nammina@cadlink.in'
    ZOHO_PASSWORD = os.environ.get('ZOHO_APP_PASSWORD') or 'bFZp0iNjXYk7'

    db = DatabaseClient()
    leads = db.get_leads_for_campaign(phase, limit)

    if not leads:
        logging.warning("No leads found for this phase. "
                        "Run scrapers first.")
        return

    logging.info(f"Sending to {len(leads)} leads "
                 f"(Phase {phase}, dry_run={dry_run})")

    sent = 0
    for lead in leads:
        lead = dict(lead)

        # Get recipient
        recipient = (lead.get('contact_email') or
                     lead.get('email_1') or lead.get('email') or '')
        if not recipient or '@' not in recipient:
            logging.warning(
                f"No valid email for {lead.get('name')} — skip"
            )
            continue

        # Validate — never send to self, never send to test
        if recipient == ZOHO_EMAIL:
            logging.error(
                f"Recipient = sender for {lead.get('name')} — "
                f"SKIPPING. Fix the lead data."
            )
            continue
        if 'test' in lead.get('name','').lower():
            logging.warning(
                f"Test company detected: {lead.get('name')} — skip"
            )
            continue

        # Select and render template
        try:
            subject, body_template, t_name = select_template(lead)
            body = render_template(body_template, lead)
            subject_rendered = render_template(subject, lead)
        except ValueError as e:
            logging.error(f"Template error for {lead.get('name')}: {e}")
            continue

        if dry_run:
            print(f"\n{'='*60}")
            print(f"TO:      {recipient}")
            print(f"SUBJECT: {subject_rendered}")
            print(f"BODY:\n{body}")
            print(f"{'='*60}")
            sent += 1
            continue

        # Build MIME message
        msg = MIMEMultipart('alternative')
        msg['From']    = f"Somesh Nammina <{ZOHO_EMAIL}>"
        msg['To']      = recipient
        msg['Subject'] = subject_rendered
        msg['Reply-To'] = ZOHO_EMAIL

        # Plain text version (always include — spam filters prefer it)
        msg.attach(MIMEText(body, 'plain'))

        # HTML version without tracking pixel
        html_body = plain_to_html(body)
        msg.attach(MIMEText(html_body, 'html'))

        # Send
        try:
            with smtplib.SMTP_SSL(
                ZOHO_SMTP_HOST, ZOHO_SMTP_PORT
            ) as smtp:
                smtp.login(ZOHO_EMAIL, ZOHO_PASSWORD)
                smtp.sendmail(ZOHO_EMAIL, recipient,
                              msg.as_string())

            # Log to email_tracking
            db.log_email_sent(lead['id'], recipient, lead.get('contact_name', ''), subject_rendered, phase, template_name=t_name)

            sent += 1
            logging.info(
                f"✅ Sent to {lead.get('name')} "
                f"<{recipient}>"
            )

        except smtplib.SMTPException as e:
            logging.error(
                f"SMTP error for {lead.get('name')}: {e}"
            )

    logging.info(f"Campaign complete. Sent: {sent}/{len(leads)}")

def send_follow_ups(dry_run: bool = False):
    """
    Send follow-up emails to leads that:
    - Were sent an email 7+ days ago
    - Have not replied (replied = 0)
    - Have not been followed up yet (follow_up_sent = 0)
    - Optionally: opened the email (prioritize openers first)
    """
    import os
    db = DatabaseClient()
    
    ZOHO_EMAIL    = os.environ.get('ZOHO_EMAIL') or 'somesh.nammina@cadlink.in'
    ZOHO_PASSWORD = os.environ.get('ZOHO_APP_PASSWORD') or 'bFZp0iNjXYk7'

    due = db.get_due_follow_ups(limit=20)

    logging.info(f"Follow-ups due: {len(due)}")

    for row in due:
        lead = dict(row)
        lead['id'] = lead['company_id']

        recipient = (lead.get('contact_email') or
                     lead.get('email_1') or lead.get('email') or '')
        if not recipient:
            continue

        subject, body_template, _ = select_template(
            lead, is_followup=True
        )
        body = render_template(body_template, lead)

        if dry_run:
            print(f"FOLLOW-UP → {lead.get('name', 'Unknown')} <{recipient}>")
            print(body)
            continue

        # Build MIME message
        msg = MIMEMultipart('alternative')
        msg['From']    = f"Somesh Nammina <{ZOHO_EMAIL}>"
        msg['To']      = recipient
        msg['Subject'] = subject
        msg['Reply-To'] = ZOHO_EMAIL

        msg.attach(MIMEText(body, 'plain'))
        
        html_body = plain_to_html(body)
        msg.attach(MIMEText(html_body, 'html'))

        # Send
        try:
            with smtplib.SMTP_SSL(ZOHO_SMTP_HOST, ZOHO_SMTP_PORT) as smtp:
                smtp.login(ZOHO_EMAIL, ZOHO_PASSWORD)
                smtp.sendmail(ZOHO_EMAIL, recipient, msg.as_string())

            db.mark_follow_up_sent(row['id'])
            logging.info(f"✅ Follow-up sent: {lead.get('name', 'Unknown')}")
        except smtplib.SMTPException as e:
            logging.error(f"SMTP error for {lead.get('name', 'Unknown')}: {e}")

