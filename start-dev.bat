@echo off
setlocal
set "ROOT=%~dp0"

echo ==========================================
echo   Mill Management - DEVELOPMENT MODE
echo ==========================================
echo.
echo Frontend : http://localhost:5173
echo Dev API  : http://localhost:4001
echo Production remains on port 4000.
echo.

echo Closing old DEVELOPMENT servers only...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":4001" ^| findstr "LISTENING"') do taskkill /PID %%P /F >nul 2>&1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /PID %%P /F >nul 2>&1

timeout /t 1 /nobreak >nul

echo Starting DEVELOPMENT backend on port 4001...
pushd "%ROOT%backend"
start "Mill Backend DEV - Port 4001" cmd /k "set MILL_LICENSE_BYPASS=1&& set PORT=4001&& npm start"
popd

timeout /t 2 /nobreak >nul

echo Starting DEVELOPMENT frontend on port 5173...
pushd "%ROOT%frontend"
start "Mill Frontend DEV - Port 5173" cmd /k "npm run dev"
popd

timeout /t 3 /nobreak >nul
start "" http://localhost:5173

endlocal
