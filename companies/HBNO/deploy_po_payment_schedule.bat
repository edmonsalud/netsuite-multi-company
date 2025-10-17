@echo off
REM ========================================================================
REM PO Payment Schedule System - Automated Deployment Script
REM Company: HBNO (Account ID: 5221064)
REM Version: 1.0.0
REM ========================================================================

setlocal enabledelayedexpansion

REM Set console colors
color 0A

REM Define paths
set "SCRIPT_DIR=%~dp0"
set "LOG_DIR=%SCRIPT_DIR%logs"
set "LOG_FILE=%LOG_DIR%\deployment_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log"

REM Create logs directory if it doesn't exist
if not exist "%LOG_DIR%" (
    mkdir "%LOG_DIR%"
)

REM Initialize log file
echo ======================================================================== > "%LOG_FILE%"
echo PO Payment Schedule Deployment Log >> "%LOG_FILE%"
echo Deployment Started: %date% %time% >> "%LOG_FILE%"
echo ======================================================================== >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM Display banner
echo.
echo ========================================================================
echo    PO PAYMENT SCHEDULE SYSTEM - DEPLOYMENT SCRIPT
echo ========================================================================
echo    Company: HBNO
echo    Account: 5221064
echo    Version: 1.0.0
echo ========================================================================
echo.

REM Change to script directory
cd /d "%SCRIPT_DIR%"
echo [INFO] Working directory: %SCRIPT_DIR% | tee -a "%LOG_FILE%"
echo.

REM ========================================================================
REM PHASE 1: PRE-DEPLOYMENT VALIDATION
REM ========================================================================
echo ========================================================================
echo PHASE 1: PRE-DEPLOYMENT VALIDATION
echo ========================================================================
echo [STEP 1.1] Checking Node.js installation... | tee -a "%LOG_FILE%"

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH! | tee -a "%LOG_FILE%"
    echo [ERROR] Please install Node.js from https://nodejs.org/ | tee -a "%LOG_FILE%"
    goto :error_exit
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js version: %NODE_VERSION% | tee -a "%LOG_FILE%"
echo.

echo [STEP 1.2] Checking SuiteCloud CLI installation... | tee -a "%LOG_FILE%"

npx suitecloud --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] SuiteCloud CLI may not be properly installed | tee -a "%LOG_FILE%"
    echo [INFO] Will attempt to use via npx... | tee -a "%LOG_FILE%"
) else (
    for /f "tokens=*" %%i in ('npx suitecloud --version') do set SUITECLOUD_VERSION=%%i
    echo [SUCCESS] SuiteCloud CLI version: %SUITECLOUD_VERSION% | tee -a "%LOG_FILE%"
)
echo.

echo [STEP 1.3] Validating project structure... | tee -a "%LOG_FILE%"

REM Check for required directories
if not exist "src" (
    echo [ERROR] 'src' directory not found! | tee -a "%LOG_FILE%"
    goto :error_exit
)

if not exist "src\FileCabinet\SuiteScripts\PO_Payment_Schedule" (
    echo [ERROR] 'PO_Payment_Schedule' script directory not found! | tee -a "%LOG_FILE%"
    goto :error_exit
)

if not exist "src\Objects\Scripts" (
    echo [ERROR] 'Objects\Scripts' directory not found! | tee -a "%LOG_FILE%"
    goto :error_exit
)

echo [SUCCESS] Project structure validated | tee -a "%LOG_FILE%"
echo.

echo [STEP 1.4] Validating required files... | tee -a "%LOG_FILE%"

set "FILES_MISSING=0"

REM Check main script
if not exist "src\FileCabinet\SuiteScripts\PO_Payment_Schedule\po_payment_schedule_ue.js" (
    echo [ERROR] Main script file not found: po_payment_schedule_ue.js | tee -a "%LOG_FILE%"
    set FILES_MISSING=1
)

REM Check library files
if not exist "src\FileCabinet\SuiteScripts\PO_Payment_Schedule\lib\Constants.js" (
    echo [ERROR] Library file not found: Constants.js | tee -a "%LOG_FILE%"
    set FILES_MISSING=1
)

if not exist "src\FileCabinet\SuiteScripts\PO_Payment_Schedule\lib\ValidationHelper.js" (
    echo [ERROR] Library file not found: ValidationHelper.js | tee -a "%LOG_FILE%"
    set FILES_MISSING=1
)

if not exist "src\FileCabinet\SuiteScripts\PO_Payment_Schedule\lib\DateCalculator.js" (
    echo [ERROR] Library file not found: DateCalculator.js | tee -a "%LOG_FILE%"
    set FILES_MISSING=1
)

if not exist "src\FileCabinet\SuiteScripts\PO_Payment_Schedule\lib\PaymentScheduleManager.js" (
    echo [ERROR] Library file not found: PaymentScheduleManager.js | tee -a "%LOG_FILE%"
    set FILES_MISSING=1
)

REM Check script definition
if not exist "src\Objects\Scripts\customscript_po_payment_schedule.xml" (
    echo [ERROR] Script definition file not found: customscript_po_payment_schedule.xml | tee -a "%LOG_FILE%"
    set FILES_MISSING=1
)

REM Check manifest
if not exist "src\manifest.xml" (
    echo [ERROR] Manifest file not found: manifest.xml | tee -a "%LOG_FILE%"
    set FILES_MISSING=1
)

if !FILES_MISSING! equ 1 (
    echo [ERROR] One or more required files are missing! | tee -a "%LOG_FILE%"
    goto :error_exit
)

echo [SUCCESS] All required files present | tee -a "%LOG_FILE%"
echo.

REM ========================================================================
REM PHASE 2: PROJECT VALIDATION
REM ========================================================================
echo ========================================================================
echo PHASE 2: PROJECT VALIDATION
echo ========================================================================
echo [STEP 2.1] Running SuiteCloud project validation... | tee -a "%LOG_FILE%"
echo.

npx suitecloud project:validate >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Project validation failed! | tee -a "%LOG_FILE%"
    echo [ERROR] Check log file for details: %LOG_FILE% | tee -a "%LOG_FILE%"
    echo.
    echo Do you want to continue anyway? (Y/N)
    set /p CONTINUE_CHOICE=
    if /i not "!CONTINUE_CHOICE!"=="Y" (
        goto :error_exit
    )
    echo [WARNING] Continuing despite validation errors... | tee -a "%LOG_FILE%"
) else (
    echo [SUCCESS] Project validation passed | tee -a "%LOG_FILE%"
)
echo.

REM ========================================================================
REM PHASE 3: AUTHENTICATION
REM ========================================================================
echo ========================================================================
echo PHASE 3: AUTHENTICATION
echo ========================================================================
echo [INFO] Checking authentication status... | tee -a "%LOG_FILE%"
echo.

REM Check if account is already configured
npx suitecloud account:ci >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Authentication may be required | tee -a "%LOG_FILE%"
    echo.
    echo You will be prompted to authenticate via browser...
    echo Account ID: 5221064 (HBNO)
    echo.
    pause

    echo [STEP 3.1] Running account setup... | tee -a "%LOG_FILE%"
    npx suitecloud account:setup

    if %errorlevel% neq 0 (
        echo [ERROR] Authentication failed! | tee -a "%LOG_FILE%"
        goto :error_exit
    )

    echo [SUCCESS] Authentication completed | tee -a "%LOG_FILE%"
) else (
    echo [SUCCESS] Already authenticated | tee -a "%LOG_FILE%"
)
echo.

REM ========================================================================
REM PHASE 4: DEPLOYMENT
REM ========================================================================
echo ========================================================================
echo PHASE 4: DEPLOYMENT TO NETSUITE
echo ========================================================================
echo.
echo [WARNING] You are about to deploy to PRODUCTION account 5221064
echo.
echo This will deploy:
echo   - PO Payment Schedule User Event Script
echo   - All supporting library files
echo   - Script deployment configuration
echo.
echo Continue with deployment? (Y/N)
set /p DEPLOY_CHOICE=

if /i not "%DEPLOY_CHOICE%"=="Y" (
    echo [INFO] Deployment cancelled by user | tee -a "%LOG_FILE%"
    goto :normal_exit
)

echo.
echo [STEP 4.1] Deploying project to NetSuite... | tee -a "%LOG_FILE%"
echo [INFO] This may take several minutes... | tee -a "%LOG_FILE%"
echo.

REM Execute deployment
npx suitecloud project:deploy >> "%LOG_FILE%" 2>&1
set DEPLOY_RESULT=%errorlevel%

if %DEPLOY_RESULT% neq 0 (
    echo [ERROR] Deployment FAILED! | tee -a "%LOG_FILE%"
    echo [ERROR] Check log file for details: %LOG_FILE%
    echo.
    goto :error_exit
)

echo [SUCCESS] Deployment completed successfully! | tee -a "%LOG_FILE%"
echo.

REM ========================================================================
REM PHASE 5: POST-DEPLOYMENT VERIFICATION
REM ========================================================================
echo ========================================================================
echo PHASE 5: POST-DEPLOYMENT VERIFICATION
echo ========================================================================

echo [STEP 5.1] Listing deployed scripts... | tee -a "%LOG_FILE%"
echo.

npx suitecloud object:list --type usereventscript >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Could not verify script deployment | tee -a "%LOG_FILE%"
) else (
    echo [SUCCESS] Script deployment verified | tee -a "%LOG_FILE%"
)
echo.

echo [STEP 5.2] Generating deployment summary... | tee -a "%LOG_FILE%"
echo.
echo ======================================================================== >> "%LOG_FILE%"
echo DEPLOYMENT SUMMARY >> "%LOG_FILE%"
echo ======================================================================== >> "%LOG_FILE%"
echo Deployment Time: %date% %time% >> "%LOG_FILE%"
echo Status: SUCCESS >> "%LOG_FILE%"
echo Account: 5221064 (HBNO) >> "%LOG_FILE%"
echo Script ID: customscript_po_payment_schedule >> "%LOG_FILE%"
echo Deployment ID: customdeploy_po_payment_schedule >> "%LOG_FILE%"
echo ======================================================================== >> "%LOG_FILE%"
echo.

REM ========================================================================
REM PHASE 6: NEXT STEPS
REM ========================================================================
echo ========================================================================
echo DEPLOYMENT SUCCESSFUL!
echo ========================================================================
echo.
echo Next Steps:
echo.
echo 1. Log in to NetSuite account 5221064
echo 2. Navigate to: Customization ^> Scripting ^> Scripts
echo 3. Find: "PO Payment Schedule Generator"
echo 4. Verify deployment status is "Released" (or "Testing")
echo 5. Create a test Purchase Order to verify functionality
echo.
echo 6. IMPORTANT: Review the DEPLOYMENT_CHECKLIST.md for:
echo    - Custom record verification
echo    - Payment terms configuration
echo    - Testing scenarios
echo    - Post-deployment monitoring
echo.
echo Deployment log saved to: %LOG_FILE%
echo.
echo ========================================================================
echo.

goto :normal_exit

REM ========================================================================
REM ERROR HANDLING
REM ========================================================================
:error_exit
echo.
echo ========================================================================
echo DEPLOYMENT FAILED!
echo ========================================================================
echo.
echo An error occurred during deployment.
echo.
echo Error Details:
echo   - Check the log file: %LOG_FILE%
echo   - Review error messages above
echo   - Verify all prerequisites are met
echo.
echo Troubleshooting Steps:
echo   1. Verify Node.js is installed
echo   2. Verify SuiteCloud CLI is installed
echo   3. Verify authentication is configured
echo   4. Check network connectivity
echo   5. Review project structure
echo.
echo For assistance, contact:
echo   - Technical Lead
echo   - NetSuite Administrator
echo.
echo ========================================================================
echo.

echo DEPLOYMENT FAILED >> "%LOG_FILE%"
echo Error occurred at: %date% %time% >> "%LOG_FILE%"

pause
exit /b 1

REM ========================================================================
REM NORMAL EXIT
REM ========================================================================
:normal_exit
echo Deployment process completed at: %date% %time% >> "%LOG_FILE%"
echo.

pause
exit /b 0

REM ========================================================================
REM UTILITY FUNCTIONS
REM ========================================================================

:tee
REM Simple tee implementation for Windows
echo %*
echo %* >> "%LOG_FILE%"
goto :eof
