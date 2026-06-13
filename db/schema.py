import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cadlink.db')

def calculate_quality_score(company: dict) -> int:
    """Calculates the lead quality score out of 10 based on V1.2 logic."""
    score = 0
    
    # Geography (max 3)
    high_value_countries = [
        'United Arab Emirates', 'UAE', 'Saudi Arabia', 'Qatar', 
        'Australia', 'Canada', 'United Kingdom', 'UK', 'Oman', 'Kuwait'
    ]
    medium_value_countries = ['India', 'Singapore', 'Malaysia', 'Egypt']
    
    country = company.get('country')
    if country in high_value_countries:
        score += 3
    elif country in medium_value_countries:
        score += 2

    # Sector fit (max 3)
    high_fit_sectors = ['epc', 'oil_gas', 'engineering_consultancy', 
                        'major_contractor', 'structural', 'civil']
    
    if company.get('sector') in high_fit_sectors or \
       company.get('sub_sector') in high_fit_sectors:
        score += 3

    # Contact quality (max 3)
    try:
        contact_conf = int(company.get('contact_confidence', 0) or 0)
    except ValueError:
        contact_conf = 0
    score += min(contact_conf, 3)

    # Active tender = live project = live CAD need (max 3)
    if company.get('has_active_tender'):
        score += 3

    # Has verified/guessed email (max 1)
    if company.get('email_1') or company.get('email_2') or company.get('contact_email'):
        score += 1

    return min(score, 10)  # cap at 10
