import os

# Set this to your Render/Railway URL once deployed. For local testing, use localhost:5000
TRACKING_SERVER_URL = os.getenv("TRACKING_SERVER_URL", "http://localhost:5000")

def get_pixel_url(company_id: int) -> str:
    """Returns the URL for the 1x1 tracking pixel."""
    return f"{TRACKING_SERVER_URL}/pixel/{company_id}.png"

def get_cta_url(company_id: int) -> str:
    """Returns the URL for the tracked CTA click redirect."""
    return f"{TRACKING_SERVER_URL}/click/{company_id}"
