@echo off
echo ====================================
echo River Supply SB Deployment
echo Company ID: 9910981-sb1
echo ====================================
echo.
cd /d "%~dp0"
echo Deploying to River Supply SB...
npx suitecloud project:deploy
echo.
echo Deployment complete!
pause