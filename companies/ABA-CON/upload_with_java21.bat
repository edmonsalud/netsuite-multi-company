@echo off
echo Setting Java 21 for this session...
set JAVA_HOME=C:\Program Files\Java\jdk-21
set PATH=C:\Program Files\Java\jdk-21\bin;%PATH%

echo Java version:
java -version

echo.
echo Uploading contact_pdf_suitelet.js to NetSuite...
suitecloud file:upload --paths "/SuiteScripts/contact_pdf_suitelet.js"

pause