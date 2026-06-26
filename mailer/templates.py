# ─────────────────────────────────────────────────────────────
# TEMPLATE A — GLOBAL / DEFAULT
# ─────────────────────────────────────────────────────────────
TEMPLATE_UAE = """
Subject: Structural & Civil Design Engineer — Freelancer | CAD LINK

Hi {first_name},

Hope you are doing well,
 
{icebreaker}

I'm a freelance Civil & Structural Design engineer with 5+ years of EPC project experience across O&G, industrial, and infrastructure projects (built to ADNOC and Aramco standards).

I provide remote Design, 3D Modeling and 2D Drafting support for EPC firms, without the typical agency overheads.

• Expert in both steel and concrete structures
• Stad-pro, Mat 3D, AutoCAD, MicroStation, Tekla, Smart Plant 3D (S3D), and E3D
• Rapid resource scaling (no recruitment cycles or idle bench costs)
• 24-48 hr turnarounds with zero long-term commitments

I offer a "Zero-Risk Guarantee" — I will complete your first drawing at no cost, against your exact project standards, so you can evaluate the quality before committing to anything.

Worth a 10-minute call this week?

Best regards,

Somesh Nammina
Freelance C&S Design Engineer
"""

TEMPLATE_UAE_SUBJECT = (
    "Structural & Civil Design Engineer — Freelancer | CAD LINK"
)

# We will alias all templates to this core one as requested
TEMPLATE_INDIA = TEMPLATE_UAE
TEMPLATE_INDIA_SUBJECT = TEMPLATE_UAE_SUBJECT
TEMPLATE_TENDER = TEMPLATE_UAE
TEMPLATE_TENDER_SUBJECT = TEMPLATE_UAE_SUBJECT
TEMPLATE_FOLLOWUP = TEMPLATE_UAE
TEMPLATE_FOLLOWUP_SUBJECT = TEMPLATE_UAE_SUBJECT

_cached_templates = None

def fetch_templates_from_db():
    global _cached_templates
    if _cached_templates is not None:
        return _cached_templates
    
    _cached_templates = {
        'TEMPLATE_GLOBAL': (TEMPLATE_UAE_SUBJECT, TEMPLATE_UAE),
        'TEMPLATE_INDIA': (TEMPLATE_INDIA_SUBJECT, TEMPLATE_INDIA),
        'TEMPLATE_TENDER': (TEMPLATE_TENDER_SUBJECT, TEMPLATE_TENDER),
        'TEMPLATE_FOLLOWUP': (TEMPLATE_FOLLOWUP_SUBJECT, TEMPLATE_FOLLOWUP)
    }
    
    try:
        from db.client import DatabaseClient
        db = DatabaseClient()
        if db.supabase:
            res = db.supabase.table('email_templates').select('*').execute()
            if res.data and len(res.data) > 0:
                for row in res.data:
                    _cached_templates[row['template_name']] = (row['subject'], row['body_html'])
    except Exception as e:
        import logging
        logging.warning(f"Could not load dynamic templates from Supabase, using defaults. Error: {e}")
        
    return _cached_templates

def select_template(lead: dict, is_followup: bool = False):
    import random
    templates = fetch_templates_from_db()

    def get_variant(prefix: str, default_subj: str, default_body: str):
        variants = {k: v for k, v in templates.items() if k == prefix or k.startswith(f"{prefix}_")}
        if not variants:
            return (default_subj, default_body, prefix)
        chosen_key = random.choice(list(variants.keys()))
        subj, body = variants[chosen_key]
        return (subj, body, chosen_key)

    if is_followup:
        return get_variant('TEMPLATE_FOLLOWUP', TEMPLATE_FOLLOWUP_SUBJECT, TEMPLATE_FOLLOWUP)

    if lead.get('has_active_tender'):
        subj, body, t_name = get_variant('TEMPLATE_TENDER', TEMPLATE_TENDER_SUBJECT, TEMPLATE_TENDER)
        return subj.replace('{company}', lead.get('name', '')), body, t_name

    country = lead.get('country', '')
    me_countries = [
        'United Arab Emirates', 'UAE', 'Saudi Arabia',
        'Qatar', 'Oman', 'Kuwait', 'Bahrain'
    ]

    if country in me_countries:
        return get_variant('TEMPLATE_GLOBAL', TEMPLATE_UAE_SUBJECT, TEMPLATE_UAE)

    if country == 'India' or lead.get('region') == 'India':
        return get_variant('TEMPLATE_INDIA', TEMPLATE_INDIA_SUBJECT, TEMPLATE_INDIA)

    return get_variant('TEMPLATE_GLOBAL', TEMPLATE_UAE_SUBJECT, TEMPLATE_UAE)

def render_template(template: str, lead: dict) -> str:
    contact_name  = (lead.get('contact_name') or '').strip()
    first_name    = contact_name.split()[0] if contact_name else 'there'

    company_name = (lead.get('name') or '').strip()
    if not company_name or 'test' in company_name.lower():
        raise ValueError(f"Invalid company name '{company_name}' — skipping lead")

    tender_desc = str(lead.get('tender_description') or 'your current projects')[:100]
    
    # Fallback icebreaker if AI failed
    icebreaker = lead.get('icebreaker')
    if not icebreaker:
        icebreaker = f"I visited your website and noticed {company_name} handles some great projects."

    variables = {
        'first_name':        first_name,
        'name':              first_name,
        'company_name':      company_name,
        'company':           company_name,
        'tender_description': tender_desc,
        'icebreaker':        icebreaker,
    }

    # Clean the template to remove the 'Subject: ...' line if it's there, as we use the subject variable separately
    lines = template.strip().split('\n')
    if lines[0].startswith('Subject:'):
        template = '\n'.join(lines[1:]).strip()

    try:
        rendered = template.format(**variables)
    except KeyError as e:
        raise ValueError(f"Template missing variable: {e}")

    return rendered
