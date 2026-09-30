@echo off
setlocal
set "ROOT=%~dp0"
set "MILL_LICENSE_BYPASS=1"

echo ==========================================
echo   Starting Mill Management Development
echo ==========================================
echo.

echo Closing any old Mill dev servers...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":4000" ^| findstr "LISTENING"') do taskkill /PID %%P /F >nul 2>&1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /PID %%P /F >nul 2>&1

timeout /t 1 /nobreak >nul

echo Starting backend...
start "Mill Backend" cmd /k "cd /d "%ROOT%backend" && set MILL_LICENSE_BYPASS=1 && npm start"

timeout /t 2 /nobreak >nul

echo Starting frontend...
start "Mill Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

timeout /t 3 /nobreak >nul
start "" http://localhost:5173

endlocal
