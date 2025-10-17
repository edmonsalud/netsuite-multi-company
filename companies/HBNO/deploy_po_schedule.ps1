# PO Payment Schedule Deployment Script for HBNO
# Account ID: 5221064

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PO Payment Schedule Deployment for HBNO" -ForegroundColor Cyan
Write-Host "Account ID: 5221064" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get current directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "`nCurrent Directory: $scriptPath" -ForegroundColor Yellow

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
    npm install @oracle/suitecloud-cli --save-dev
}

# Set account ID
$env:ACCOUNT_ID = "5221064"

# Function to run SuiteCloud commands
function Run-SuiteCloudCommand {
    param(
        [string]$Command,
        [string]$Description
    )

    Write-Host "`n$Description..." -ForegroundColor Yellow
    $result = Invoke-Expression $Command

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $Description completed successfully" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ $Description failed" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        return $false
    }
}

# Validate project structure
Write-Host "`nValidating project structure..." -ForegroundColor Yellow
$requiredFiles = @(
    "src\FileCabinet\SuiteScripts\PO_Payment_Schedule\po_payment_schedule_ue.js",
    "src\FileCabinet\SuiteScripts\PO_Payment_Schedule\lib\Constants.js",
    "src\FileCabinet\SuiteScripts\PO_Payment_Schedule\lib\ValidationHelper.js",
    "src\FileCabinet\SuiteScripts\PO_Payment_Schedule\lib\DateCalculator.js",
    "src\FileCabinet\SuiteScripts\PO_Payment_Schedule\lib\PaymentScheduleManager.js",
    "src\Objects\Scripts\customscript_po_payment_schedule.xml"
)

$allFilesPresent = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file is missing!" -ForegroundColor Red
        $allFilesPresent = $false
    }
}

if (!$allFilesPresent) {
    Write-Host "`nSome required files are missing. Please ensure all files are in place." -ForegroundColor Red
    exit 1
}

# Check if already authenticated
Write-Host "`nChecking authentication status..." -ForegroundColor Yellow
$authCheck = npx suitecloud account:ci list 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Not authenticated. Setting up account..." -ForegroundColor Yellow
    Write-Host "Please enter your NetSuite credentials when prompted." -ForegroundColor Cyan
    npx suitecloud account:setup

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Authentication failed. Please check your credentials." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Already authenticated" -ForegroundColor Green
}

# Validate the project
if (Run-SuiteCloudCommand "npx suitecloud project:validate" "Validating SDF project") {

    # Deploy the project
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Ready to deploy to NetSuite" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    $confirm = Read-Host "`nDo you want to proceed with deployment? (Y/N)"

    if ($confirm -eq 'Y' -or $confirm -eq 'y') {
        if (Run-SuiteCloudCommand "npx suitecloud project:deploy" "Deploying to NetSuite") {
            Write-Host "`n========================================" -ForegroundColor Green
            Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green

            Write-Host "`nNext Steps:" -ForegroundColor Cyan
            Write-Host "1. Log into NetSuite account 5221064" -ForegroundColor White
            Write-Host "2. Navigate to Customization > Scripting > Scripts" -ForegroundColor White
            Write-Host "3. Find 'PO Payment Schedule Generator'" -ForegroundColor White
            Write-Host "4. Verify the deployment is 'Released'" -ForegroundColor White
            Write-Host "5. Test by creating a PO with custom payment terms" -ForegroundColor White

            Write-Host "`nTo view logs:" -ForegroundColor Cyan
            Write-Host "Customization > Scripting > Script Execution Log" -ForegroundColor White
        } else {
            Write-Host "`nDeployment failed. Please check the error messages above." -ForegroundColor Red
        }
    } else {
        Write-Host "`nDeployment cancelled by user." -ForegroundColor Yellow
    }
} else {
    Write-Host "`nValidation failed. Please fix the errors before deploying." -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")