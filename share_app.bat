@echo off
echo ===================================================
echo Creating Public Link for Log Book App...
echo ===================================================
echo This will generate a public URL (e.g., https://wild-goose-42.loca.lt)
echo You can share this URL with anyone.
echo NOTE: The first time they visit, they might see a "Click to Continue" page.
echo.
call npx -y localtunnel --port 8000
pause
