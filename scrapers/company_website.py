import re
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

PAGES_TO_CHECK = [
    '', '/contact', '/contact-us', '/about', '/about-us'
]

def extract_from_website(domain: str) -> dict:
    """
    Intelligently extracts emails, phone numbers using Playwright headless browser
    to bypass Cloudflare and execute JavaScript.
    """
    if not domain.startswith('http'):
        base_url = f"https://{domain}"
    else:
        base_url = domain
        
    extracted_data = {
        'email_1': None,
        'email_2': None,
        'phone': None,
        'contact_name': None,
        'contact_title': None,
        'method': 'playwright'
    }
    
    emails_found = set()
    phones_found = set()
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            ignore_https_errors=True
        )
        page = context.new_page()
        page.set_default_timeout(10000) # 10s timeout per page
        
        for path in PAGES_TO_CHECK:
            url = urljoin(base_url, path)
            try:
                page.goto(url, wait_until="domcontentloaded")
                # Wait briefly for any JS rendering or Cloudflare redirects
                page.wait_for_timeout(2000)
                html = page.content()
                
                # Regex for emails in raw HTML
                emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html)
                for email in emails:
                    email = email.lower()
                    if not email.endswith(('.png', '.jpg', '.jpeg', '.gif', '.css', '.js', '.webp')):
                        emails_found.add(email)
                
                # Extract specifically from mailto: links which might be hydrated by JS
                try:
                    mailto_links = page.locator("a[href^='mailto:']").all()
                    for link in mailto_links:
                        href = link.get_attribute("href")
                        if href:
                            email = href.replace('mailto:', '').split('?')[0].strip().lower()
                            if '@' in email:
                                emails_found.add(email)
                except:
                    pass
                
                # Basic regex for international phones
                phones = re.findall(r'\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}', html)
                for phone in phones:
                    if len(re.sub(r'\D', '', phone)) >= 8:
                        phones_found.add(phone.strip())
                
                if len(emails_found) >= 2:
                    break
            except Exception as e:
                # Could be a timeout or a bad path
                continue
                
        browser.close()
            
    if emails_found:
        emails_list = list(emails_found)
        emails_list.sort(key=lambda e: 0 if any(x in e for x in ['info@', 'contact@', 'sales@', 'hello@', 'admin@']) else 1)
        extracted_data['email_1'] = emails_list[0]
        if len(emails_list) > 1:
            extracted_data['email_2'] = emails_list[1]
            
    if phones_found:
        extracted_data['phone'] = list(phones_found)[0]
        
    return extracted_data
