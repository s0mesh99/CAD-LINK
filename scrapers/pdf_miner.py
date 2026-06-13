import pdfplumber, requests, re, logging
from io import BytesIO
from scrapers.base_scraper import BaseScraper

SEARCH_QUERIES = [
    '"EPC" "structural engineering" "capability statement" filetype:pdf',
    '"civil engineering" "oil and gas" "company profile" filetype:pdf',
    '"engineering consultancy" "AutoCAD" "MicroStation" filetype:pdf',
    '"structural steel" "fabrication" "India" "company profile" filetype:pdf',
    '"EPC contractor" "UAE" "capability" filetype:pdf',
    '"civil structural" "piperack" "platform" "Australia" filetype:pdf',
    '"ADNOC approved" OR "Aramco approved" "contractor" filetype:pdf',
    '"vendor list" "engineering" "structural" "oil and gas" filetype:pdf',
]

class PDFMinerScraper(BaseScraper):
    def __init__(self):
        super().__init__('pdf_miner', min_delay=5.0, max_delay=10.0)

    def extract_from_pdf(self, pdf_url: str) -> dict:
        """
        1. Download PDF into memory (don't save to disk)
        2. Extract all text with pdfplumber
        3. Run regex to find:
           - Email addresses
           - Phone numbers  
           - Company name (usually in first 2 pages)
           - Named people + titles (pattern: Name\nTitle or Title: Name)
           - Website URLs
        4. Return structured dict
        """
        try:
            self.limiter.wait(context="Downloading PDF")
            r = requests.get(pdf_url, timeout=15)
            if r.status_code != 200:
                self.log.warning(f"Failed to fetch PDF: {pdf_url}")
                return {}

            with pdfplumber.open(BytesIO(r.content)) as pdf:
                text = '\n'.join(page.extract_text() or '' for page in pdf.pages[:5])
            
            emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
            phones = re.findall(r'[\+\d][\d\s\-\(\)]{8,15}', text)
            urls   = re.findall(r'https?://[^\s]+|www\.[^\s]+', text)
            
            # Simple heuristic for company name: often precedes common keywords
            company_match = re.search(r'([A-Z][a-zA-Z\s&]+(?:Engineering|Contractors|Group|LLC|Ltd|Inc))', text)
            company_name = company_match.group(1).strip() if company_match else ''

            return {
                'emails': list(set(emails)),
                'phones': list(set([p.strip() for p in phones if len(p.strip()) > 8])),
                'websites': list(set(urls)),
                'company_name': company_name,
                'raw_text_snippet': text[:500],
            }
        except Exception as e:
            self.log.error(f"Error parsing PDF {pdf_url}: {e}")
            return {}

    def run(self):
        # Fetch unparsed PDFs from cache
        rows = self.conn.execute("SELECT id, pdf_url FROM pdf_cache WHERE parsed = 0 LIMIT 20").fetchall()
        for row in rows:
            pdf_id = row['id']
            url = row['pdf_url']
            
            self.log.info(f"Mining PDF: {url}")
            data = self.extract_from_pdf(url)
            
            leads_found = 0
            if data and (data['emails'] or data['phones']):
                domain = self.clean_domain(data['websites'][0]) if data['websites'] else ''
                if not domain and data['emails']:
                    domain = data['emails'][0].split('@')[1]
                
                record = {
                    'name': data['company_name'] or domain.split('.')[0].capitalize(),
                    'domain': domain,
                    'email': data['emails'][0] if data['emails'] else '',
                    'phone': data['phones'][0] if data['phones'] else '',
                    'raw_text_snippet': data['raw_text_snippet'],
                    'source_method': 'pdf_miner',
                    'source_url': url,
                    'sector': 'epc'
                }
                
                if self.insert_company(record):
                    leads_found = 1
            
            self.conn.execute("UPDATE pdf_cache SET parsed = 1, leads_found = ? WHERE id = ?", (leads_found, pdf_id))
            self.conn.commit()
            
        self.log_run("ok")
