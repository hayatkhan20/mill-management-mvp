@echo off
setlocal
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "RELEASE=%ROOT%\release"
set "DEST=%RELEASE%\Mill-Management-Update"
set "FILES=%DEST%\update-files"
set "ZIP=%RELEASE%\Mill-Management-Update.zip"

echo ==========================================
echo   Prepare Mill Manager Client Update
echo ==========================================
echo.

echo Building production frontend...
cd /d "%ROOT%\frontend"
call npm run build
if errorlevel 1 goto :error

if exist "%DEST%" rmdir /s /q "%DEST%"
if exist "%ZIP%" del /q "%ZIP%"
mkdir "%DEST%"
mkdir "%FILES%"
mkdir "%FILES%\backend"
mkdir "%FILES%\backend\src"
mkdir "%FILES%\frontend"

echo Copying update files...
robocopy "%ROOT%\backend\src" "%FILES%\backend\src" *.* /E /R:2 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto :error

robocopy "%ROOT%\frontend\dist" "%FILES%\frontend\dist" *.* /E /R:2 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto :error

copy /Y "%ROOT%\README-CLIENT.txt" "%FILES%\README-CLIENT.txt" >nul
copy /Y "%ROOT%\Apply Mill Manager Update.bat" "%DEST%\Apply Mill Manager Update.bat" >nul

echo Creating ZIP...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%DEST%\*' -DestinationPath '%ZIP%' -Force"
if errorlevel 1 goto :error

echo.
echo ==========================================
echo Client update created:
echo %ZIP%
echo.
echo This is an UPDATE package.
echo It preserves mill.db, license.json and backups.
echo ==========================================
pause
exit /b 0

:error
echo.
echo Failed to prepare client update package.
pause
exit /b 1
