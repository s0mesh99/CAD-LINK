# V1.5 CAD LINK AUTOMATION ENGINE
# This script runs in the background and fully automates the business.
# It costs $0 because it uses your local PC's resources.

Write-Host "========================================"
Write-Host "🚀 STARTING V1.5 AUTOMATION ENGINE 🚀"
Write-Host "========================================"

# Set the working directory to the script's location
cd $PSScriptRoot

while ($true) {
    Write-Host "`n[$(Get-Date)] 🔍 PHASE 1: Running Cloud Scrapers..."
    python run.py --run-scrapers

    Write-Host "`n[$(Get-Date)] 🧠 PHASE 2: Running Basic Enrichment..."
    python run.py --run-enrichment

    Write-Host "`n[$(Get-Date)] ⚡ PHASE 2.5: Running Deep AI Enrichment (Multi-Key)..."
    python run.py --run-deep-enrichment

    Write-Host "`n[$(Get-Date)] 📧 PHASE 3: Running Campaign Blaster (Max 50 Emails)..."
    python run.py --run-blaster

    Write-Host "`n[$(Get-Date)] 🤖 PHASE 4: Running AI Inbox Manager..."
    python -m mailer.inbox_manager

    Write-Host "`n[$(Get-Date)] ✅ Full cycle complete. Sleeping for 4 hours before next run..."
    
    # Sleep for 4 hours (14400 seconds)
    Start-Sleep -Seconds 14400
}
