from flask import Flask, request, send_file, redirect
import io
import datetime
from PIL import Image
from db.client import DatabaseClient

app = Flask(__name__)

@app.route('/pixel/<int:lead_id>.png')
def track_open(lead_id):
    """Tracks when an email is opened by loading a 1x1 transparent PNG."""
    try:
        db = DatabaseClient()
        db.track_email_open(lead_id)
    except Exception as e:
        print(f"Tracking error: {e}")
        
    # Return 1x1 transparent PNG
    img = Image.new('RGBA', (1, 1), (0, 0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

@app.route('/click/<int:lead_id>')
def track_click(lead_id):
    """Tracks when a user clicks the CTA button, then redirects them to cadlink.in."""
    try:
        db = DatabaseClient()
        db.track_email_click(lead_id)
    except Exception as e:
        print(f"Tracking error: {e}")
        
    return redirect('https://cadlink.in?ref=email_cta')

@app.route('/stats')
def show_stats():
    """Simple dashboard endpoint to show email campaign performance."""
    try:
        db = DatabaseClient()
        stats = db.get_tracking_stats()
        return stats
    except Exception as e:
        return {"error": str(e)}

if __name__ == '__main__':
    # Run locally for testing. For production, host on Render.com or Railway.app
    app.run(host='0.0.0.0', port=5000, debug=True)
