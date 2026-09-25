@echo off
set ROOT=%~dp0
start "Mill Backend" cmd /k "cd /d %ROOT%backend && set MILL_LICENSE_BYPASS=1 && npm start"
start "Mill Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"
timeout /t 3 >nul
start http://localhost:5173
