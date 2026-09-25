@echo off
setlocal
set "ROOT=%~dp0"

powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%ROOT%scripts\StartServer.ps1"
exit /b %errorlevel%
