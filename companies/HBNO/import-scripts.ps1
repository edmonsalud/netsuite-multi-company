# PowerShell script to import NetSuite scripts and objects
# Run this after completing: suitecloud account:setup

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "HBNO Script Import Helper" -ForegroundColor Cyan
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
    Write-Host "Follow the prompts and enter credentials from your .env file" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For detailed instructions, see:" -ForegroundColor Cyan
    Write-Host "  - BEGINNER-GUIDE.md" -ForegroundColor White
    Write-Host "  - COMPLETE-SETUP.md" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Authentication configured!" -ForegroundColor Green
Write-Host ""

# Display import menu
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "What would you like to import?" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Import ALL files from /SuiteScripts/" -ForegroundColor White
Write-Host "2. Import specific folder (you'll specify path)" -ForegroundColor White
Write-Host "3. Interactive file import (browse and select)" -ForegroundColor White
Write-Host "4. Import custom objects (fields, workflows, etc.)" -ForegroundColor White
Write-Host "5. Import both files AND objects" -ForegroundColor White
Write-Host "6. List available objects (no import)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-6)"

Write-Host ""

switch ($choice) {
    "1" {
        Write-Host "Importing all SuiteScripts..." -ForegroundColor Yellow
        Write-Host ""
        suitecloud file:import --paths /SuiteScripts
    }
    "2" {
        Write-Host "Enter the folder path to import" -ForegroundColor Cyan
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  /SuiteScripts" -ForegroundColor White
        Write-Host "  /SuiteScripts/MyCustomScripts" -ForegroundColor White
        Write-Host "  /Templates/PDF Templates" -ForegroundColor White
        Write-Host ""
        $folder = Read-Host "Folder path"
        Write-Host ""
        Write-Host "Importing from $folder..." -ForegroundColor Yellow
        suitecloud file:import --paths $folder
    }
    "3" {
        Write-Host "Opening interactive file import menu..." -ForegroundColor Yellow
        Write-Host "Use arrow keys and space to select folders/files" -ForegroundColor Cyan
        Write-Host ""
        suitecloud file:import
    }
    "4" {
        Write-Host "Opening interactive object import menu..." -ForegroundColor Yellow
        Write-Host "You can import:" -ForegroundColor Cyan
        Write-Host "  - Custom Fields" -ForegroundColor White
        Write-Host "  - Custom Records" -ForegroundColor White
        Write-Host "  - Workflows" -ForegroundColor White
        Write-Host "  - Saved Searches" -ForegroundColor White
        Write-Host "  - Script Deployments" -ForegroundColor White
        Write-Host "  - And more..." -ForegroundColor White
        Write-Host ""
        suitecloud object:import
    }
    "5" {
        Write-Host "Importing files first..." -ForegroundColor Yellow
        Write-Host ""
        suitecloud file:import
        Write-Host ""
        Write-Host "Now importing objects..." -ForegroundColor Yellow
        Write-Host ""
        suitecloud object:import
    }
    "6" {
        Write-Host "Listing available objects..." -ForegroundColor Yellow
        Write-Host ""
        suitecloud object:list
        Write-Host ""
        Write-Host "To import objects, run:" -ForegroundColor Cyan
        Write-Host "  suitecloud object:import" -ForegroundColor White
        Write-Host ""
        exit 0
    }
    default {
        Write-Host "Invalid choice. Running interactive file import..." -ForegroundColor Yellow
        Write-Host ""
        suitecloud file:import
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Import Process Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check what was imported
$hasFiles = Test-Path "src/FileCabinet/SuiteScripts"
$hasObjects = Test-Path "src/Objects"

if ($hasFiles) {
    Write-Host "✅ Files imported to:" -ForegroundColor Green
    Write-Host "   src/FileCabinet/SuiteScripts/" -ForegroundColor White
    Write-Host ""

    # List some files
    $fileCount = (Get-ChildItem -Path "src/FileCabinet" -Recurse -File -ErrorAction SilentlyContinue).Count
    if ($fileCount -gt 0) {
        Write-Host "   Found $fileCount file(s)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   Recent files:" -ForegroundColor Yellow
        Get-ChildItem -Path "src/FileCabinet" -Recurse -File -ErrorAction SilentlyContinue |
            Select-Object -First 10 |
            ForEach-Object {
                $relativePath = $_.FullName -replace [regex]::Escape((Get-Location).Path + "\src\"), ""
                Write-Host "     - $relativePath" -ForegroundColor White
            }
    }
}

Write-Host ""

if ($hasObjects) {
    Write-Host "✅ Objects imported to:" -ForegroundColor Green
    Write-Host "   src/Objects/" -ForegroundColor White
    Write-Host ""

    # List object folders
    Get-ChildItem -Path "src/Objects" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $objCount = (Get-ChildItem -Path $_.FullName -Recurse -File).Count
        Write-Host "   - $($_.Name): $objCount object(s)" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Review imported files:" -ForegroundColor Yellow
Write-Host "   - Open src/FileCabinet/ in VS Code" -ForegroundColor White
Write-Host "   - Review src/Objects/ for custom objects" -ForegroundColor White
Write-Host ""
Write-Host "2. Make changes locally:" -ForegroundColor Yellow
Write-Host "   - Edit scripts in your IDE" -ForegroundColor White
Write-Host "   - Use Elite AI agents for help:" -ForegroundColor White
Write-Host "     • claude-architect (Design)" -ForegroundColor Cyan
Write-Host "     • claude-coder (Implement)" -ForegroundColor Cyan
Write-Host "     • claude-reviewer (Audit)" -ForegroundColor Cyan
Write-Host "     • claude-documenter (Document)" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Validate changes:" -ForegroundColor Yellow
Write-Host "   suitecloud project:validate" -ForegroundColor White
Write-Host ""
Write-Host "4. Deploy to NetSuite:" -ForegroundColor Yellow
Write-Host "   suitecloud project:deploy" -ForegroundColor White
Write-Host ""
Write-Host "5. Test in NetSuite UI" -ForegroundColor Yellow
Write-Host ""
Write-Host "For more help, see README.md or BEGINNER-GUIDE.md" -ForegroundColor Cyan
Write-Host ""
