# ─────────────────────────────────────────────────────────────
# TEMPLATE A — UAE / Middle East EPC
# Use for: Phase 1, country in [UAE, Saudi, Qatar, Oman, Kuwait]
# Tone: Professional peer-to-peer. No pain-point aggression.
# ─────────────────────────────────────────────────────────────
TEMPLATE_UAE = """
{salutation}

I'm a Civil & Structural CAD draftsman with 5 years on O&G EPC
projects built to ADNOC and Aramco delivery standards.

I provide remote 2D drafting support for EPC firms:

  • Piperacks, structural platforms, equipment foundations
  • AutoCAD and MicroStation (DGN files, seed file compliant)
  • IFR/IFC drawing packages with full revision history
  • 24–48 hr turnaround on standard sheets

I'd like to offer one sample drawing on {company_name}'s project
standard at no charge — so you can evaluate quality before
committing to anything.

Worth a 10-minute call this week?

Somesh Nammina
CAD LINK | cadlink.in
Hyderabad, India | somesh.nammina@cadlink.in
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

I'm a Hyderabad-based Civil & Structural CAD specialist with
5 years of EPC project experience across O&G, industrial plants,
and infrastructure.

I support EPC firms that need reliable overflow drafting:

  • Foundation layouts, piperack drawings, platform details
  • AutoCAD 2D and MicroStation — both tools
  • Flexible: per-drawing, per-week, or monthly retainer

Happy to share my portfolio or provide a free sample drawing on
{company_name}'s standard — no strings attached.

Can we connect for a quick call?

Somesh Nammina
CAD LINK | cadlink.in
Hyderabad | somesh.nammina@cadlink.in
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

I'm a Civil & Structural CAD draftsman with 5 years of EPC
experience — I provide remote AutoCAD and MicroStation 2D
drafting support for exactly this type of project work.

If you need additional CAD capacity for this project, I can
start immediately. Happy to provide one drawing at no charge
as proof of work.

15 minutes this week?

Somesh Nammina
CAD LINK | cadlink.in
Hyderabad | somesh.nammina@cadlink.in
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

Just following up on my note from last week about remote CAD
drafting support for {company_name}.

Quick version: I'm offering one free sample drawing on your
project standard — no commitment needed to try it.

If bandwidth ever becomes an issue, I'm available immediately.

Somesh Nammina
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
