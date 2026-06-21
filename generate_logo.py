import asyncio
from playwright.async_api import async_playwright

HTML_CONTENT = """
<!DOCTYPE html>
<html>
<head>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@900&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 20px 40px;
            display: inline-block;
            background: transparent;
        }
        .logo {
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 80px;
            letter-spacing: -0.04em;
            line-height: 1;
            margin: 0;
        }
        .cad { color: #0f172a; }
        .link { color: #18624E; } /* text-cadlink-600 */
        .dot { color: #1F7A62; } /* text-cadlink-500 */
    </style>
</head>
<body>
    <div class="logo" id="logo-element">
        <span class="cad">CAD</span><span class="link">LINK</span><span class="dot">.</span>
    </div>
</body>
</html>
"""

async def generate():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content(HTML_CONTENT)
        # Wait for fonts to load
        await page.evaluate('document.fonts.ready')
        
        # Select the element and take a screenshot
        element = await page.query_selector('#logo-element')
        
        # Save high-res for LinkedIn
        await element.screenshot(path='WEBSITE/public/logo.png', omit_background=True)
        
        await browser.close()
        print("✅ Logo generated at WEBSITE/public/logo.png")

if __name__ == '__main__':
    asyncio.run(generate())
