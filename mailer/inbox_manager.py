import os
import imaplib
import email
from email.header import decode_header
import json
import logging
from dotenv import load_dotenv

# Try to import Gemini API
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

# Import our database client
from db.client import DatabaseClient

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("InboxManager")

class InboxManager:
    def __init__(self):
        load_dotenv()
        self.email_user = os.getenv("ZOHO_EMAIL")
        self.email_pass = os.getenv("ZOHO_APP_PASSWORD")
        self.imap_url = "imap.zoho.in"
        self.db = DatabaseClient()
        
        # Initialize Gemini if key is available
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        if HAS_GEMINI and self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.use_ai = True
            logger.info("Gemini AI initialized for Inbox Management.")
        else:
            self.use_ai = False
            logger.warning("Gemini API key not found or package missing. Falling back to keyword matching.")

    def connect(self):
        try:
            self.mail = imaplib.IMAP4_SSL(self.imap_url)
            self.mail.login(self.email_user, self.email_pass)
            logger.info("Connected to Zoho IMAP successfully.")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to IMAP: {e}")
            return False

    def process_unread_emails(self):
        if not self.connect(): return
        
        self.mail.select("INBOX")
        status, messages = self.mail.search(None, "UNSEEN")
        
        if status != "OK":
            logger.error("Failed to search for unread emails.")
            return

        email_ids = messages[0].split()
        if not email_ids:
            logger.info("No new unread emails.")
            return

        logger.info(f"Found {len(email_ids)} unread emails.")

        for e_id in email_ids:
            try:
                status, msg_data = self.mail.fetch(e_id, "(RFC822)")
                if status != "OK":
                    continue

                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        
                        # Extract sender
                        sender = msg.get("From", "")
                        if "<" in sender:
                            sender_email = sender.split("<")[1].strip(">").lower()
                        else:
                            sender_email = sender.lower()
                            
                        # Extract subject
                        subject, encoding = decode_header(msg.get("Subject", ""))[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding or "utf-8", errors="ignore")
                        
                        # Extract body
                        body = ""
                        if msg.is_multipart():
                            for part in msg.walk():
                                if part.get_content_type() == "text/plain":
                                    body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                                    break
                        else:
                            body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
                        
                        logger.info(f"Processing email from: {sender_email}")
                        self.handle_email_reply(sender_email, subject, body)
                
                # Mark as read (implicitly happens when fetched, but to be sure)
                self.mail.store(e_id, '+FLAGS', '\\Seen')
            except Exception as e:
                logger.error(f"Error processing email {e_id}: {e}")

        self.mail.close()
        self.mail.logout()

    def handle_email_reply(self, sender_email: str, subject: str, body: str):
        # 1. Check if we know this sender (in companies or email_tracking)
        company = self.db.find_company_by_email(sender_email)
        
        if not company:
            logger.info(f"Sender {sender_email} not found in database. Ignoring.")
            return
            
        company_id = company.get("id")
        
        # 2. Mark tracking as replied
        self.db.mark_email_replied(company_id)
        
        # 3. Classify intent
        intent = self.classify_intent(subject, body)
        logger.info(f"Classified intent for {sender_email} as: {intent}")
        
        # 4. Map intent to CRM kanban column (pipeline_stage)
        new_stage = None
        if intent == "Meeting Booked":
            new_stage = "Meeting Booked"
        elif intent == "Rejected":
            new_stage = "Rejected"
        elif intent == "Information Requested":
            new_stage = "Contacted"
        
        # 5. Update CRM
        if new_stage:
            self.db.update_company_pipeline(company_id, new_stage)
            logger.info(f"Moved company {company_id} to '{new_stage}'")

    def classify_intent(self, subject: str, body: str) -> str:
        """ Returns: 'Meeting Booked', 'Rejected', 'Information Requested', or 'Other' """
        if self.use_ai:
            try:
                prompt = f"""
                You are an AI sales assistant. Analyze the following email reply and classify the intent.
                Choose exactly ONE of the following categories:
                - Meeting Booked (If they want to schedule a call, ask for availability, or agree to a meeting)
                - Rejected (If they say no, unsubscribe, not interested, or stop emailing)
                - Information Requested (If they ask for a portfolio, pricing, more details, or have questions)
                - Other (If none of the above fit, out of office, auto-reply, etc.)
                
                Subject: {subject}
                Body: {body}
                
                Reply ONLY with the category name.
                """
                response = self.model.generate_content(prompt)
                res_text = response.text.strip()
                valid = ["Meeting Booked", "Rejected", "Information Requested", "Other"]
                for v in valid:
                    if v.lower() in res_text.lower():
                        return v
                return "Other"
            except Exception as e:
                logger.error(f"Gemini API error: {e}. Falling back to keywords.")
        
        # Fallback keyword logic
        text = f"{subject} {body}".lower()
        if any(w in text for w in ["unsubscribe", "not interested", "stop", "remove", "no thanks", "do not email"]):
            return "Rejected"
        elif any(w in text for w in ["meeting", "call", "zoom", "teams", "discuss", "book", "availability", "schedule", "talk"]):
            return "Meeting Booked"
        elif any(w in text for w in ["portfolio", "pricing", "cost", "more info", "details", "examples", "send"]):
            return "Information Requested"
        
        return "Other"

if __name__ == "__main__":
    print("Running Inbox Manager...")
    manager = InboxManager()
    manager.process_unread_emails()
    print("Done.")
