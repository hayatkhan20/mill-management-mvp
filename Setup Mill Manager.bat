@echo off
setlocal
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

echo ==========================================
echo   Mill Management v1.0 - Setup
echo ==========================================
echo.

if not exist "%ROOT%\runtime\node.exe" (
  echo ERROR: Portable runtime is missing.
  echo Please use the complete Mill-Management-v1.0 package.
  pause
  exit /b 1
)

if not exist "%ROOT%\backend\node_modules\better-sqlite3" (
  echo ERROR: Backend dependencies are missing.
  echo Please use the complete Mill-Management-v1.0 package.
  pause
  exit /b 1
)

if not exist "%ROOT%\frontend\dist\index.html" (
  echo ERROR: Production frontend build is missing.
  echo Please use the complete Mill-Management-v1.0 package.
  pause
  exit /b 1
)

echo Creating desktop and Windows startup shortcuts...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\CreateShortcuts.ps1" -Root "%ROOT%"
if errorlevel 1 goto :error

echo.
echo Starting Mill Manager...
powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%ROOT%\scripts\StartServer.ps1"

echo.
echo ==========================================
echo Setup complete.
echo.
echo A "Mill Manager" shortcut has been added
echo to the Desktop.
echo.
echo The server will also start automatically
echo after Windows login.
echo ==========================================
pause
exit /b 0

:error
echo.
echo Setup failed. Please contact the developer.
pause
exit /b 1
