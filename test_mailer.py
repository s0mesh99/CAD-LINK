import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from mailer.templates import select_template, render_template
from mailer.zoho import plain_to_html

def send_test_emails():
    ZOHO_EMAIL = os.environ.get('ZOHO_EMAIL') or 'somesh.nammina@cadlink.in'
    ZOHO_PASSWORD = os.environ.get('ZOHO_APP_PASSWORD') or 'bFZp0iNjXYk7'
    ZOHO_SMTP_HOST = 'smtp.zoho.in'
    ZOHO_SMTP_PORT = 465
    
    # 4 Mock Leads to trigger the 4 templates
    mock_leads = [
        {
            'name': 'Demo UAE EPC',
            'contact_name': 'Ahmed',
            'country': 'UAE',
            'has_active_tender': 0,
            '_type': 'UAE Template'
        },
        {
            'name': 'Demo India EPC',
            'contact_name': 'Rahul',
            'country': 'India',
            'has_active_tender': 0,
            '_type': 'India Template'
        },
        {
            'name': 'Demo Tender EPC',
            'contact_name': 'Michael',
            'country': 'UK',
            'has_active_tender': 1,
            'tender_description': 'the upcoming 500MW solar farm expansion',
            '_type': 'Tender Template'
        },
        {
            'name': 'Demo Follow-Up EPC',
            'contact_name': 'Sarah',
            'country': 'UAE',
            'has_active_tender': 0,
            '_type': 'Follow-Up Template',
            '_is_followup': True
        }
    ]

    recipient = ZOHO_EMAIL # Send to self for testing

    try:
        with smtplib.SMTP_SSL(ZOHO_SMTP_HOST, ZOHO_SMTP_PORT) as smtp:
            smtp.login(ZOHO_EMAIL, ZOHO_PASSWORD)
            
            for lead in mock_leads:
                is_followup = lead.get('_is_followup', False)
                subject_template, body_template, template_name = select_template(lead, is_followup=is_followup)
                
                subject = render_template(subject_template, lead)
                body = render_template(body_template, lead)
                
                # Prepend the template type to subject so the user knows which is which
                subject = f"[{lead['_type']}] {subject}"
                
                msg = MIMEMultipart('alternative')
                msg['From'] = f"Somesh Nammina (Test) <{ZOHO_EMAIL}>"
                msg['To'] = recipient
                msg['Subject'] = subject
                
                msg.attach(MIMEText(body, 'plain'))
                
                html_body = plain_to_html(body)
                msg.attach(MIMEText(html_body, 'html'))
                
                smtp.sendmail(ZOHO_EMAIL, recipient, msg.as_string())
                print(f"Sent {lead['_type']} to {recipient}")
                
    except Exception as e:
        print(f"Error sending emails: {e}")

if __name__ == '__main__':
    send_test_emails()
