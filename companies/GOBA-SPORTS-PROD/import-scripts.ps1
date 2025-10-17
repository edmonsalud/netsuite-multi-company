# GOBA Sports - Production SuiteScript Import Script
# This script imports multiple SuiteScripts from NetSuite

Write-Host "GOBA Sports - Production SuiteScript Import Tool" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# List of scripts to import (update with your actual script paths)
$scripts = @(
    # Add your SuiteScript paths here, for example:
    # "/SuiteScripts/your_script.js",
    # "/SuiteScripts/folder/another_script.js",
    # "/SuiteScripts/customscript_example.js"
)

# Check if we're in the correct directory
if (-not (Test-Path "suitecloud.config.js")) {
    Write-Host "Error: suitecloud.config.js not found. Please run this script from the GOBA-SPORTS-PROD directory." -ForegroundColor Red
    exit 1
}

# Function to import a single script
function Import-SuiteScript {
    param([string]$scriptPath)

    Write-Host "`nImporting: $scriptPath" -ForegroundColor Yellow

    $result = suitecloud object:import --type file --paths $scriptPath 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully imported: $scriptPath" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ Failed to import: $scriptPath" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
        return $false
    }
}

# Import all scripts
if ($scripts.Count -eq 0) {
    Write-Host "`nNo scripts configured for import." -ForegroundColor Yellow
    Write-Host "Edit this script and add your script paths to the `$scripts array." -ForegroundColor Yellow

    # Offer to import all SuiteScripts
    $importAll = Read-Host "`nWould you like to import ALL SuiteScripts? (y/n)"
    if ($importAll -eq 'y') {
        Write-Host "`nImporting all SuiteScripts..." -ForegroundColor Cyan
        suitecloud object:import --type file --paths /SuiteScripts

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Successfully imported all SuiteScripts" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to import SuiteScripts" -ForegroundColor Red
        }
    }
} else {
    $successCount = 0
    $failCount = 0

    foreach ($script in $scripts) {
        if (Import-SuiteScript -scriptPath $script) {
            $successCount++
        } else {
            $failCount++
        }
    }

    # Summary
    Write-Host "`n================================================" -ForegroundColor Cyan
    Write-Host "Import Summary:" -ForegroundColor Cyan
    Write-Host "  Successful: $successCount" -ForegroundColor Green
    Write-Host "  Failed: $failCount" -ForegroundColor Red
    Write-Host "  Total: $($scripts.Count)" -ForegroundColor White
}

Write-Host "`nImport process completed." -ForegroundColor Cyan
Write-Host "Check src/FileCabinet/SuiteScripts/ for imported files." -ForegroundColor White