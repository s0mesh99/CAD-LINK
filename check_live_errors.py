from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Listen for console events
        page.on("console", lambda msg: print(f"Console {msg.type}: {msg.text}"))
        # Listen for page errors
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))
        
        print("Navigating to https://cadlink-admin.web.app...")
        response = page.goto("https://cadlink-admin.web.app", wait_until="networkidle")
        print(f"Status: {response.status}")
        
        print("Content length:", len(page.content()))
        browser.close()

if __name__ == "__main__":
    main()
