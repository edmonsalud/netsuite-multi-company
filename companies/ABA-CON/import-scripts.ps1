# PowerShell script to import specific NetSuite scripts
# Run this after completing: suitecloud account:setup

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "ABA-CON Script Import Helper" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if authentication is set up
Write-Host "Checking authentication status..." -ForegroundColor Yellow

# Try to validate project (will fail if not authenticated)
$validateResult = suitecloud project:validate 2>&1

if ($validateResult -match "No account has been set up") {
    Write-Host ""
    Write-Host "❌ Authentication not complete!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run this command first:" -ForegroundColor Yellow
    Write-Host "  suitecloud account:setup" -ForegroundColor White
    Write-Host ""
    Write-Host "Use these credentials from COMPLETE-SETUP.md:" -ForegroundColor Yellow
    Write-Host "  - Account ID: 8606430"
    Write-Host "  - Auth ID: aba-con"
    Write-Host "  - Token ID: (from .env file)"
    Write-Host "  - Token Secret: (from .env file)"
    Write-Host "  - Consumer Key: (from .env file)"
    Write-Host "  - Consumer Secret: (from .env file)"
    Write-Host ""
    exit 1
}

Write-Host "✅ Authentication configured!" -ForegroundColor Green
Write-Host ""

# Import files from File Cabinet
Write-Host "Importing files from NetSuite File Cabinet..." -ForegroundColor Yellow
Write-Host ""

# Option 1: Import entire SuiteScripts folder
Write-Host "Choose import method:" -ForegroundColor Cyan
Write-Host "1. Import ALL files from /SuiteScripts/" -ForegroundColor White
Write-Host "2. Import specific folder (you'll choose)" -ForegroundColor White
Write-Host "3. Manual import (interactive menu)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Importing all SuiteScripts..." -ForegroundColor Yellow
        suitecloud file:import --paths /SuiteScripts
    }
    "2" {
        Write-Host ""
        $folder = Read-Host "Enter folder path (e.g., /SuiteScripts/MyScripts)"
        Write-Host "Importing from $folder..." -ForegroundColor Yellow
        suitecloud file:import --paths $folder
    }
    "3" {
        Write-Host ""
        Write-Host "Opening interactive import menu..." -ForegroundColor Yellow
        suitecloud file:import
    }
    default {
        Write-Host "Invalid choice. Running interactive import..." -ForegroundColor Yellow
        suitecloud file:import
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Import Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your scripts should now be in:" -ForegroundColor Cyan
Write-Host "  src/FileCabinet/SuiteScripts/" -ForegroundColor White
Write-Host ""
Write-Host "Looking for:" -ForegroundColor Yellow
Write-Host "  - netsuite_contact_url_updater.js"
Write-Host "  - netsuite_contact_url_userevent.js"
Write-Host ""

# Search for the specific files
Write-Host "Searching for your files..." -ForegroundColor Yellow
Get-ChildItem -Path "src/FileCabinet" -Recurse -Filter "*contact_url*.js" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  ✅ Found: $($_.FullName)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review imported files in src/FileCabinet/"
Write-Host "2. Use AI agents to review/improve code"
Write-Host "3. Make changes and deploy: suitecloud project:deploy"
Write-Host ""
