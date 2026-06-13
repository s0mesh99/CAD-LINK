import sys
from mailer.zoho import ZohoMailer

def test_zoho_connection():
    try:
        mailer = ZohoMailer()
        print(f"[OK] Credentials loaded for: {mailer.email}")
    except ValueError as e:
        print(f"[ERROR] {e}")
        print("Please check your .env file!")
        sys.exit(1)

    print("\nAttempting to send a test email to yourself...")
    success, error = mailer.send_email(to_email=mailer.email, company_name="Test Company LLC")

    if success:
        print("\n[SUCCESS] The test email was sent via Zoho.")
        print("Go check your Zoho inbox to see how the template looks!")
    else:
        print(f"\n[FAILED] to send email. Error: {error}")
        print("\nCommon fixes:")
        print("1. Did you use your main password instead of an 'App Password'? You must generate an App Password in Zoho Security settings.")
        print("2. Is SMTP Access enabled in your Zoho Mail settings? (Settings -> Mail Accounts -> IMAP/POP/SMTP)")

if __name__ == "__main__":
    test_zoho_connection()
