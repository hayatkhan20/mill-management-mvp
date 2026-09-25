@echo off
set ROOT=%~dp0
set "MILL_LICENSE_BYPASS=1"

start "Mill Backend" cmd /k "cd /d %ROOT%backend && npm start"
start "Mill Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"

timeout /t 3 >nul
start http://localhost:5173