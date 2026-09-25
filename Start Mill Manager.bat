@echo off
setlocal
set ROOT=%~dp0

if not exist "%ROOT%frontend\dist\index.html" (
  echo Mill Management is not installed yet.
  echo Please run install.bat first.
  pause
  exit /b 1
)

echo Starting Mill Management v1.0...
start "Mill Management Server" cmd /k "cd /d "%ROOT%backend" && npm start"

timeout /t 3 /nobreak >nul
start "" http://localhost:4000
exit /b 0
