@echo off
setlocal
set ROOT=%~dp0
set RELEASE_ROOT=%ROOT%release
set DEST=%RELEASE_ROOT%\Mill-Management-v1.0
set ZIP=%RELEASE_ROOT%\Mill-Management-v1.0.zip

echo ==========================================
echo   Prepare Mill Management v1.0 Package
echo ==========================================
echo.

if exist "%DEST%" rmdir /s /q "%DEST%"
if exist "%ZIP%" del /q "%ZIP%"
if not exist "%RELEASE_ROOT%" mkdir "%RELEASE_ROOT%"
mkdir "%DEST%"

echo Creating a clean client copy...
robocopy "%ROOT%" "%DEST%" /E /NFL /NDL /NJH /NJS /NP ^
  /XD "%ROOT%.git" "%ROOT%backend\node_modules" "%ROOT%frontend\node_modules" "%ROOT%frontend\dist" "%ROOT%backend\data" "%ROOT%backups" "%ROOT%release" ^
  /XF "*.db" "*.db-shm" "*.db-wal"

if errorlevel 8 goto :error

echo.
echo Creating ZIP package...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%DEST%\*' -DestinationPath '%ZIP%' -Force"
if errorlevel 1 goto :error

echo.
echo ==========================================
echo Client package created successfully:
echo %ZIP%
echo.
echo IMPORTANT:
echo The ZIP contains NO current/test database.
echo The client/friend will start with a clean database.
echo ==========================================
pause
exit /b 0

:error
echo.
echo Failed to prepare the client package.
pause
exit /b 1
