@echo off
set ROOT=%~dp0
echo Installing backend dependencies...
cd /d "%ROOT%backend"
call npm install
if errorlevel 1 goto :error

echo Installing frontend dependencies...
cd /d "%ROOT%frontend"
call npm install
if errorlevel 1 goto :error

echo.
echo Installation complete.
pause
exit /b 0

:error
echo.
echo Installation failed. Check Node.js/npm and internet connection.
pause
exit /b 1
