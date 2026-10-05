@echo off
setlocal EnableExtensions

set "UPDATE_ROOT=%~dp0"
set "UPDATE_ROOT=%UPDATE_ROOT:~0,-1%"
set "UPDATE=%UPDATE_ROOT%\update-files"
set "INSTALL_ROOT="

echo ==========================================
echo   Mill Manager - Easy Client Update
echo ==========================================
echo.
echo Finding the existing Mill Manager installation...

if not exist "%UPDATE_ROOT%\Locate Mill Manager.ps1" (
  echo.
  echo ERROR: Update helper is missing.
  echo Please extract the complete update ZIP again.
  echo Nothing was changed.
  pause
  exit /b 1
)

for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%UPDATE_ROOT%\Locate Mill Manager.ps1"`) do set "INSTALL_ROOT=%%I"

if not defined INSTALL_ROOT (
  echo.
  echo ERROR: Existing Mill Manager installation was not found.
  echo Nothing was changed.
  pause
  exit /b 1
)

if not exist "%UPDATE%\backend\src\server.js" (
  echo.
  echo ERROR: Update files are missing.
  echo Please extract the complete Mill-Management-Update ZIP first.
  echo Nothing was changed.
  pause
  exit /b 1
)

echo Found:
echo %INSTALL_ROOT%
echo.

echo 1/4 Backing up current mill data...
cd /d "%INSTALL_ROOT%\backend"
"%INSTALL_ROOT%\runtime\node.exe" src\backup.js
if errorlevel 1 goto :error

echo.
echo 2/4 Stopping Mill Manager...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$target=[IO.Path]::GetFullPath('%INSTALL_ROOT%\runtime\node.exe'); Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.ExecutablePath -and ([IO.Path]::GetFullPath($_.ExecutablePath) -eq $target) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
timeout /t 2 /nobreak >nul

echo.
echo 3/4 Installing the update...
robocopy "%UPDATE%\backend\src" "%INSTALL_ROOT%\backend\src" *.* /E /R:2 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto :error

if exist "%INSTALL_ROOT%\frontend\dist" rmdir /s /q "%INSTALL_ROOT%\frontend\dist"
mkdir "%INSTALL_ROOT%\frontend\dist"
robocopy "%UPDATE%\frontend\dist" "%INSTALL_ROOT%\frontend\dist" *.* /E /R:2 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto :error

if exist "%UPDATE%\README-CLIENT.txt" copy /Y "%UPDATE%\README-CLIENT.txt" "%INSTALL_ROOT%\README-CLIENT.txt" >nul

echo.
echo 4/4 Starting updated Mill Manager...
powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%INSTALL_ROOT%\scripts\StartServer.ps1"
if errorlevel 1 goto :error

echo.
echo ==========================================
echo Update completed successfully.
echo.
echo Your existing records, database, license
echo and backups were preserved.
echo ==========================================
pause
exit /b 0

:error
echo.
echo ==========================================
echo Update failed.
echo.
echo Your existing data was not deleted.
echo A backup was created before the update.
echo Please contact the developer.
echo ==========================================
pause
exit /b 1
