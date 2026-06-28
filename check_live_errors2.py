import time
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Capture console logs
        page.on("console", lambda msg: print(f"Console [{msg.type}]: {msg.text}"))
        # Capture uncaught exceptions
        page.on("pageerror", lambda err: print(f"Uncaught Exception: {err}"))
        # Capture failed network requests
        page.on("requestfailed", lambda req: print(f"Request Failed: {req.url} - {req.failure}"))
        
        print("Navigating to https://cadlink-admin.web.app...")
        try:
            page.goto("https://cadlink-admin.web.app", wait_until="networkidle", timeout=15000)
        except Exception as e:
            print(f"Navigation error: {e}")
            
        time.sleep(3) # Wait extra time for React to mount and potentially crash
        
        print(f"Page Title: {page.title()}")
        print(f"HTML Content Length: {len(page.content())}")
        
        # Let's extract the actual HTML body to see if React mounted
        body_inner = page.evaluate("document.body.innerHTML")
        print(f"Body Inner HTML: {body_inner[:500]}...")
        
        # Save a screenshot to confirm it's blank
        page.screenshot(path="live_site_screenshot.png")
        print("Screenshot saved to live_site_screenshot.png")
        
        browser.close()

if __name__ == "__main__":
    main()
