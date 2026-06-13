from flask import Flask, request, send_file, redirect
import sqlite3
import io
import datetime
from PIL import Image

app = Flask(__name__)
DB_PATH = 'cadlink.db'  # Persistent SQLite database path

@app.route('/pixel/<int:lead_id>.png')
def track_open(lead_id):
    """Tracks when an email is opened by loading a 1x1 transparent PNG."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute('''
            UPDATE email_tracking 
            SET opened_at = COALESCE(opened_at, ?),
                open_count = open_count + 1
            WHERE company_id = ?
        ''', (datetime.datetime.now(), lead_id))
        conn.commit()
        conn.close()
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
        conn = sqlite3.connect(DB_PATH)
        conn.execute('''
            UPDATE email_tracking 
            SET replied = 1
            WHERE company_id = ?
        ''', (lead_id,))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Tracking error: {e}")
        
    return redirect('https://cadlink.in?ref=email_cta')

@app.route('/stats')
def show_stats():
    """Simple dashboard endpoint to show email campaign performance."""
    try:
        conn = sqlite3.connect(DB_PATH)
        stats = conn.execute('''
            SELECT 
                COUNT(*) as total_sent,
                COUNT(opened_at) as total_opened,
                SUM(open_count) as total_opens,
                COUNT(CASE WHEN replied=1 THEN 1 END) as total_replies,
                ROUND(COUNT(opened_at)*100.0/MAX(COUNT(*), 1), 1) as open_rate
            FROM email_tracking
        ''').fetchone()
        conn.close()
        
        return {
            'total_sent': stats[0] or 0,
            'unique_opens': stats[1] or 0,
            'total_opens': stats[2] or 0,
            'total_clicks': stats[3] or 0,
            'open_rate': f"{stats[4] or 0.0}%"
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == '__main__':
    # Run locally for testing. For production, host on Render.com or Railway.app
    app.run(host='0.0.0.0', port=5000, debug=True)
