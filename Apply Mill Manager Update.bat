@echo off
setlocal
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "UPDATE=%ROOT%\update-files"

echo ==========================================
echo   Mill Manager - Client Update
echo ==========================================
echo.

if not exist "%ROOT%\runtime\node.exe" (
  echo ERROR: Run this update from inside the existing Mill Manager folder.
  echo The current installation and its data must stay in place.
  pause
  exit /b 1
)

if not exist "%UPDATE%\backend\src\server.js" (
  echo ERROR: Update files are missing.
  echo Extract the complete update ZIP into the existing Mill Manager folder.
  pause
  exit /b 1
)

echo Backing up current data...
cd /d "%ROOT%\backend"
"%ROOT%\runtime\node.exe" src\backup.js
if errorlevel 1 goto :error

echo.
echo Stopping Mill Manager...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$target=[IO.Path]::GetFullPath('%ROOT%\runtime\node.exe'); Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.ExecutablePath -and ([IO.Path]::GetFullPath($_.ExecutablePath) -eq $target) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
timeout /t 2 /nobreak >nul

echo Updating application files...
robocopy "%UPDATE%\backend\src" "%ROOT%\backend\src" *.* /E /R:2 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto :error

if exist "%ROOT%\frontend\dist" rmdir /s /q "%ROOT%\frontend\dist"
mkdir "%ROOT%\frontend\dist"
robocopy "%UPDATE%\frontend\dist" "%ROOT%\frontend\dist" *.* /E /R:2 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto :error

if exist "%UPDATE%\README-CLIENT.txt" copy /Y "%UPDATE%\README-CLIENT.txt" "%ROOT%\README-CLIENT.txt" >nul

echo.
echo Starting updated Mill Manager...
powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%ROOT%\scripts\StartServer.ps1"
if errorlevel 1 goto :error

echo.
echo ==========================================
echo Update completed successfully.
echo.
echo Your existing database, license and backups
echo were preserved.
echo ==========================================
pause
exit /b 0

:error
echo.
echo Update failed.
echo Your database backup was kept in the backups folder.
echo Please contact the developer before changing any files manually.
pause
exit /b 1
