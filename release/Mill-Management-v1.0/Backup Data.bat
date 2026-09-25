@echo off
setlocal
set ROOT=%~dp0

echo ==========================================
echo   Mill Management - Data Backup
echo ==========================================
echo.

if not exist "%ROOT%backend\node_modules" (
  echo Application dependencies are not installed.
  echo Run install.bat first.
  pause
  exit /b 1
)

cd /d "%ROOT%backend"
call npm run backup

if errorlevel 1 (
  echo.
  echo Backup failed.
  pause
  exit /b 1
)

echo.
echo Your backup is saved inside:
echo %ROOT%backups
echo.
pause
