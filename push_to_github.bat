@echo off
echo ===================================================
echo Pushing Code to GitHub...
echo You will be asked for your Username and Password.
echo ===================================================
echo NOTE: We are using --force to overwrite any empty files on GitHub.
git push -u origin main --force
echo.
echo If it says "Authentication failed", you might need a Personal Access Token instead of a password.
echo https://github.com/settings/tokens
pause
