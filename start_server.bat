@echo off
echo Starting Log Book Server...
echo Access the app at:
echo   Local:    http://localhost:8000
echo   Network:  http://DESKTOP-UD5PPHH:8000
echo   (Or use your IP address if the hostname doesn't work)
cd c:\LOGBOOK
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
