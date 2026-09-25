@echo off
setlocal
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "RELEASE_ROOT=%ROOT%\release"
set "DEST=%RELEASE_ROOT%\Mill-Management-v1.0"
set "ZIP=%RELEASE_ROOT%\Mill-Management-v1.0.zip"

echo ==========================================
echo   Prepare Portable Mill Management v1.0
echo ==========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is required only on the developer computer
  echo to prepare the portable client package.
  pause
  exit /b 1
)

for /f "delims=" %%I in ('where node') do (
  set "NODE_EXE=%%I"
  goto :node_found
)

:node_found
if not exist "%NODE_EXE%" (
  echo ERROR: node.exe could not be located.
  pause
  exit /b 1
)

echo Checking backend dependencies...
if not exist "%ROOT%\backend\node_modules\better-sqlite3" (
  echo Backend dependencies are missing. Installing...
  cd /d "%ROOT%\backend"
  call npm ci
  if errorlevel 1 goto :error
)

echo.
echo Checking frontend dependencies...
if not exist "%ROOT%\frontend\node_modules" (
  echo Frontend dependencies are missing. Installing...
  cd /d "%ROOT%\frontend"
  call npm ci
  if errorlevel 1 goto :error
)

echo.
echo Building production frontend...
cd /d "%ROOT%\frontend"
call npm run build
if errorlevel 1 goto :error

echo.
echo Creating clean portable client copy...
if exist "%DEST%" rmdir /s /q "%DEST%"
if exist "%ZIP%" del /q "%ZIP%"
if not exist "%RELEASE_ROOT%" mkdir "%RELEASE_ROOT%"
mkdir "%DEST%"

robocopy "%ROOT%" "%DEST%" *.* /E /R:2 /W:2 /NFL /NDL /NJH /NJS /NP ^
  /XD "%ROOT%\.git" "%ROOT%\frontend\node_modules" "%ROOT%\backend\data" "%ROOT%\backups" "%ROOT%\release" ^
  /XF "*.db" "*.db-shm" "*.db-wal"

if errorlevel 8 goto :error

echo.
echo Adding portable Node runtime...
if not exist "%DEST%\runtime" mkdir "%DEST%\runtime"
copy /Y "%NODE_EXE%" "%DEST%\runtime\node.exe" >nul
if errorlevel 1 goto :error

rem Remove developer-only files from the client package.
del /Q "%DEST%\Prepare Client Package.bat" 2>nul
del /Q "%DEST%\install.bat" 2>nul
del /Q "%DEST%\start-dev.bat" 2>nul
del /Q "%DEST%\README.md" 2>nul

echo.
echo Creating ZIP package...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%DEST%\*' -DestinationPath '%ZIP%' -Force"
if errorlevel 1 goto :error

echo.
echo ==========================================
echo Portable client package created:
echo %ZIP%
echo.
echo Client PC does NOT need Node.js installed.
echo No test database is included.
echo ==========================================
pause
exit /b 0

:error
echo.
echo Failed to prepare the portable client package.
pause
exit /b 1
