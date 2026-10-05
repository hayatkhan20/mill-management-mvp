param()

$ErrorActionPreference = 'SilentlyContinue'

function Test-MillRoot([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
  try { $Path = [IO.Path]::GetFullPath($Path.Trim('"').Trim()) } catch { return $false }
  return (Test-Path (Join-Path $Path 'runtime\node.exe')) -and
         (Test-Path (Join-Path $Path 'backend\src\server.js')) -and
         (Test-Path (Join-Path $Path 'frontend\dist\index.html')) -and
         (Test-Path (Join-Path $Path 'scripts\StartServer.ps1'))
}

function Add-Candidate([System.Collections.Generic.List[string]]$List, [string]$Path) {
  if (-not [string]::IsNullOrWhiteSpace($Path) -and -not $List.Contains($Path)) {
    $List.Add($Path)
  }
}

$candidates = New-Object 'System.Collections.Generic.List[string]'
$ws = New-Object -ComObject WScript.Shell

# 1) Existing Desktop / Startup shortcuts.
$shortcutPaths = @(
  (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Mill Manager.lnk'),
  (Join-Path ([Environment]::GetFolderPath('Startup')) 'Mill Manager Server.lnk')
)
if ($env:OneDrive) {
  $shortcutPaths += (Join-Path $env:OneDrive 'Desktop\Mill Manager.lnk')
}

foreach ($shortcutPath in ($shortcutPaths | Select-Object -Unique)) {
  if (-not (Test-Path $shortcutPath)) { continue }
  $shortcut = $ws.CreateShortcut($shortcutPath)
  Add-Candidate $candidates $shortcut.WorkingDirectory

  # Recover the install folder from: -File "C:\...\scripts\StartServer.ps1"
  if ($shortcut.Arguments -match '-File\s+"([^"]*\\scripts\\StartServer\.ps1)"') {
    $scriptPath = $matches[1]
    Add-Candidate $candidates (Split-Path -Parent (Split-Path -Parent $scriptPath))
  }
}

# 2) Common folders. This also handles cases where the client moved the
#    installation after Setup, leaving the shortcut pointing to the old place.
$commonParents = @(
  "$env:SystemDrive\",
  [Environment]::GetFolderPath('Desktop'),
  [Environment]::GetFolderPath('MyDocuments'),
  (Join-Path $env:USERPROFILE 'Downloads')
)

foreach ($parent in ($commonParents | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique)) {
  Get-ChildItem -Path $parent -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '(?i)mill' } |
    ForEach-Object {
      Add-Candidate $candidates $_.FullName
      Get-ChildItem -Path $_.FullName -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '(?i)mill' } |
        ForEach-Object { Add-Candidate $candidates $_.FullName }
    }
}

foreach ($candidate in $candidates) {
  if (Test-MillRoot $candidate) {
    [Console]::Out.WriteLine([IO.Path]::GetFullPath($candidate))
    exit 0
  }
}

# 3) Friendly fallback: let the user choose the existing Mill Manager folder.
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Select the EXISTING Mill Manager folder (the folder that contains backend, frontend and runtime).'
$dialog.ShowNewFolderButton = $false
$dialog.RootFolder = [Environment+SpecialFolder]::MyComputer

$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK -and (Test-MillRoot $dialog.SelectedPath)) {
  [Console]::Out.WriteLine([IO.Path]::GetFullPath($dialog.SelectedPath))
  exit 0
}

[System.Windows.Forms.MessageBox]::Show(
  'The selected folder is not a complete Mill Manager installation. Nothing was changed. Please contact the developer.',
  'Mill Manager Update',
  [System.Windows.Forms.MessageBoxButtons]::OK,
  [System.Windows.Forms.MessageBoxIcon]::Warning
) | Out-Null
exit 1
