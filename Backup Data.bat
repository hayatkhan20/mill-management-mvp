@echo off
setlocal
set "ROOT=%~dp0"

echo ==========================================
echo   Mill Management - Data Backup
echo ==========================================
echo.

if not exist "%ROOT%runtime\node.exe" (
  echo Portable runtime is missing.
  echo Please run Setup Mill Manager.bat from the complete package.
  pause
  exit /b 1
)

cd /d "%ROOT%backend"
"%ROOT%runtime\node.exe" src\backup.js

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
