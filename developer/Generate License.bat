@echo off
setlocal
set "ROOT=%~dp0.."

if not exist "%~dp0license-private.pem" (
  echo Missing developer\license-private.pem
  echo Keep the private license key on your developer computer only.
  pause
  exit /b 1
)

set /p INSTALL_ID=Enter Installation ID: 
set /p CLIENT_NAME=Enter Client / Mill Name: 

echo.
node "%~dp0GenerateLicense.mjs" "%INSTALL_ID%" "%CLIENT_NAME%"
echo.
echo Copy the activation code above and send it to the client.
pause
