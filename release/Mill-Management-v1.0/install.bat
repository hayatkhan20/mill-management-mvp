@echo off
setlocal
set ROOT=%~dp0

echo ==========================================
echo   Mill Management v1.0 - First Time Setup
echo ==========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found.
  echo Please install Node.js 20 or newer, then run this file again.
  pause
  exit /b 1
)

echo Installing backend dependencies...
cd /d "%ROOT%backend"
call npm ci
if errorlevel 1 goto :error

echo.
echo Installing frontend dependencies...
cd /d "%ROOT%frontend"
call npm ci
if errorlevel 1 goto :error

echo.
echo Building Mill Management...
call npm run build
if errorlevel 1 goto :error

echo.
echo ==========================================
echo Setup complete.
echo.
echo From now on, use:
echo   Start Mill Manager.bat
echo ==========================================
pause
exit /b 0

:error
echo.
echo Setup failed.
echo Check your internet connection and Node.js installation, then try again.
pause
exit /b 1
