# ─────────────────────────────────────────────────────────────
# TEMPLATE A — UAE / Middle East EPC
# Use for: Phase 1, country in [UAE, Saudi, Qatar, Oman, Kuwait]
# Tone: Professional peer-to-peer. No pain-point aggression.
# ─────────────────────────────────────────────────────────────
TEMPLATE_UAE = """
{salutation}

I'm an independent Civil & Structural CAD specialist with 5+ years 
of EPC project experience across O&G, industrial, and infrastructure 
projects (built to ADNOC and Aramco standards).

I provide remote drafting and 3D modeling support for EPC firms, 
without the typical agency overheads:

  • Piperacks, structural platforms, equipment foundations
  • AutoCAD, MicroStation, Tekla, SmartPlant 3D (S3D), and E3D
  • Rapid resource scaling (no recruitment cycles or idle bench costs)
  • 24-48 hr turnarounds with zero long-term commitments

I offer a "Zero-Risk Guarantee" — I will complete your first drawing
at no cost, against your exact project standards, so you can evaluate
the quality before committing to anything.

Worth a 10-minute call this week?

Somesh Nammina
Independent EPC Drafting Studio
CAD LINK | cadlink.in
somesh.nammina@cadlink.in
"""

TEMPLATE_UAE_SUBJECT = (
    "Structural & Civil CAD Support — AutoCAD/MicroStation | CAD LINK"
)


# ─────────────────────────────────────────────────────────────
# TEMPLATE B — India EPC
# Use for: Phase 2, region = India
# Tone: Peer-to-peer, direct, same-country warmth.
# ─────────────────────────────────────────────────────────────
TEMPLATE_INDIA = """
{salutation}

I'm an independent Civil & Structural CAD specialist based in Hyderabad,
with 5+ years of EPC project experience across O&G, industrial, and
infrastructure projects.

I support EPC firms that need reliable overflow drafting without
the heavy agency markups:

  • Foundation layouts, piperack drawings, platform details
  • AutoCAD, MicroStation, Tekla, SmartPlant 3D (S3D), and E3D
  • Flexible support: per-drawing, weekly, or monthly retainers

I offer a Zero-Risk Guarantee — I will complete your first drawing
on {company_name}'s exact standard at no cost, so you can evaluate
my work before making any commitments.

Can we connect for a quick call?

Somesh Nammina
Independent EPC Drafting Studio
CAD LINK | cadlink.in
somesh.nammina@cadlink.in
"""

TEMPLATE_INDIA_SUBJECT = (
    "Remote CAD Drafting Support — Civil & Structural | CAD LINK"
)


# ─────────────────────────────────────────────────────────────
# TEMPLATE C — Tender-Triggered
# Use for: any lead where has_active_tender = 1
# This overrides A and B — active project = highest priority
# ─────────────────────────────────────────────────────────────
TEMPLATE_TENDER = """
{salutation}

I noticed {company_name} has an active project in
{tender_description}.

I'm an independent Civil & Structural CAD specialist with 5+ years 
of EPC experience — I provide scalable drafting and 3D modeling 
support (AutoCAD, MicroStation, Tekla, S3D) for exactly this type 
of project work, without the agency overheads.

If you need rapid, standards-compliant CAD capacity for this project, 
I can start immediately. I am happy to provide your first drawing at 
no charge as proof of quality.

15 minutes this week?

Somesh Nammina
Independent EPC Drafting Studio
CAD LINK | cadlink.in
somesh.nammina@cadlink.in
"""

TEMPLATE_TENDER_SUBJECT = (
    "CAD Drafting Support for {company_name} Project | CAD LINK"
)


# ─────────────────────────────────────────────────────────────
# TEMPLATE D — Follow-Up (sent 7 days after no reply)
# Use for: any phase, any lead that opened but didn't reply
# Short. No re-pitch. Just a soft nudge.
# ─────────────────────────────────────────────────────────────
TEMPLATE_FOLLOWUP = """
{salutation}

Just following up on my note from last week regarding scalable 
Civil & Structural drafting support for {company_name}.

Quick version: I operate an independent CAD studio and offer a 
Zero-Risk Guarantee. I will draft your first drawing matching 
your exact standards at no cost — no commitment needed to try it.

If bandwidth ever becomes an issue, I'm available immediately.

Somesh Nammina
Independent EPC Drafting Studio
CAD LINK | cadlink.in
"""

TEMPLATE_FOLLOWUP_SUBJECT = "Re: CAD Drafting Support — Quick Follow-Up"


# ─────────────────────────────────────────────────────────────
# TEMPLATE SELECTOR — called by mailer/zoho.py
# ─────────────────────────────────────────────────────────────
def select_template(lead: dict, is_followup: bool = False):
    """
    Returns (subject, body_template) tuple.
    Priority order:
    1. Follow-up flag
    2. Active tender
    3. Country = Middle East → Template A
    4. Country = India → Template B
    5. Default → Template A (safest)
    """
    if is_followup:
        return TEMPLATE_FOLLOWUP_SUBJECT, TEMPLATE_FOLLOWUP

    if lead.get('has_active_tender'):
        subj = TEMPLATE_TENDER_SUBJECT.format(
            company_name=lead.get('name', '')
        )
        return subj, TEMPLATE_TENDER

    country = lead.get('country', '')
    me_countries = [
        'United Arab Emirates', 'UAE', 'Saudi Arabia',
        'Qatar', 'Oman', 'Kuwait', 'Bahrain'
    ]

    if country in me_countries:
        return TEMPLATE_UAE_SUBJECT, TEMPLATE_UAE

    if country == 'India' or lead.get('region') == 'India':
        return TEMPLATE_INDIA_SUBJECT, TEMPLATE_INDIA

    # Default fallback
    return TEMPLATE_UAE_SUBJECT, TEMPLATE_UAE

def render_template(template: str, lead: dict) -> str:
    """
    Safely render a template string with lead data.
    Every variable has a fallback — no placeholder ever
    appears literally in a sent email.
    """

    # Salutation — named person or clean fallback
    contact_name  = lead.get('contact_name', '').strip()
    first_name    = contact_name.split()[0] if contact_name else ''

    # Never use "Hi team" — if no name, use plain "Hi,"
    if first_name:
        salutation = f"Hi {first_name},"
    else:
        salutation = "Hi,"

    # Company name — clean fallback
    company_name = lead.get('name', '').strip()
    if not company_name or 'test' in company_name.lower():
        raise ValueError(
            f"Invalid company name '{company_name}' — skipping lead"
        )

    # Tender description — only used in Template C
    tender_desc = lead.get('tender_description', '').strip() if lead.get('tender_description') else ''
    if tender_desc:
        tender_desc = tender_desc[:100]  # keep it short in email

    # Country-specific signal
    country = lead.get('country', '')

    variables = {
        'salutation':        salutation,
        'first_name':        first_name or 'there',
        'company_name':      company_name,
        'tender_description': tender_desc or 'your current projects',
        'country':           country,
    }

    try:
        rendered = template.format(**variables)
    except KeyError as e:
        raise ValueError(f"Template missing variable: {e}")

    return rendered
