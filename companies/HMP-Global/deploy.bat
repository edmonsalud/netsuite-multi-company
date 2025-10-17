@echo off
echo ========================================
echo Deploying to HMP-Global Account
echo ========================================
echo.

REM Navigate to the HMP-Global directory
cd /d "%~dp0"

echo Using browser-based authentication...
echo If not authenticated, you will be prompted to log in via browser.
echo.

REM Deploy the project using browser authentication
echo Running SuiteCloud deployment...
npx suitecloud project:deploy

REM Check if deployment was successful
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo Deployment FAILED!
    echo ========================================
    echo.
    echo If authentication failed, run: npx suitecloud account:setup
    exit /b %errorlevel%
) else (
    echo.
    echo ========================================
    echo Deployment SUCCESSFUL!
    echo ========================================
)