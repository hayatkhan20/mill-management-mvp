param(
  [switch]$Startup
)

$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
$node = Join-Path $root 'runtime\node.exe'
$server = Join-Path $root 'backend\src\server.js'
$backend = Join-Path $root 'backend'
$logs = Join-Path $root 'logs'
$outLog = Join-Path $logs 'server-output.log'
$errLog = Join-Path $logs 'server-error.log'
$url = 'http://127.0.0.1:4000'

New-Item -ItemType Directory -Force -Path $logs | Out-Null

function Test-MillServer {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$url/api/health" -TimeoutSec 1
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Show-SetupError([string]$message) {
  if (-not $Startup) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show($message, 'Mill Manager') | Out-Null
  }
}

if (-not (Test-Path $node)) {
  Show-SetupError 'Portable Node runtime is missing. Please run Setup Mill Manager.bat again.'
  exit 1
}

if (-not (Test-Path $server)) {
  Show-SetupError 'Mill Manager server files are missing. Please reinstall the application package.'
  exit 1
}

if (-not (Test-MillServer)) {
  $startParams = @{
    FilePath = $node
    ArgumentList = @('--disable-warning=ExperimentalWarning', $server)
    WorkingDirectory = $backend
    WindowStyle = 'Hidden'
    RedirectStandardOutput = $outLog
    RedirectStandardError = $errLog
  }
  Start-Process @startParams | Out-Null

  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-MillServer) { break }
  }
}

if (-not $Startup) {
  if (Test-MillServer) {
    Start-Process 'http://localhost:4000'
  } else {
    Show-SetupError 'Mill Manager could not start. Please send the logs folder to the developer for support.'
    exit 1
  }
}
