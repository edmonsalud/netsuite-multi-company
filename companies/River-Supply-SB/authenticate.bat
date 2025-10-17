@echo off
echo ====================================
echo River Supply SB Authentication
echo Company ID: 9910981-sb1
echo ====================================
echo.
echo This will open your browser to authenticate with NetSuite.
echo Please log in when prompted.
echo.
pause
cd /d "%~dp0"
npx suitecloud account:savetoken
echo.
echo Authentication complete!
pause