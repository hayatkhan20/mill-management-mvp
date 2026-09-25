param(
  [Parameter(Mandatory=$true)]
  [string]$Root
)

$ErrorActionPreference = 'Stop'
$Root = $Root.TrimEnd('\')
$script = Join-Path $Root 'scripts\StartServer.ps1'
$powershell = (Get-Command powershell.exe).Source
$desktop = [Environment]::GetFolderPath('Desktop')
$startup = [Environment]::GetFolderPath('Startup')
$icon = "$env:SystemRoot\System32\shell32.dll,220"

$ws = New-Object -ComObject WScript.Shell

function New-MillShortcut {
  param(
    [string]$Path,
    [string]$ExtraArgs,
    [string]$Description
  )

  $shortcut = $ws.CreateShortcut($Path)
  $shortcut.TargetPath = $powershell
  $shortcut.Arguments = ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $script + '" ' + $ExtraArgs).Trim()
  $shortcut.WorkingDirectory = $Root
  $shortcut.Description = $Description
  $shortcut.IconLocation = $icon
  $shortcut.Save()
}

New-MillShortcut -Path (Join-Path $desktop 'Mill Manager.lnk') -ExtraArgs '' -Description 'Open Mill Management'
New-MillShortcut -Path (Join-Path $startup 'Mill Manager Server.lnk') -ExtraArgs '-Startup' -Description 'Start Mill Management server when Windows starts'

Write-Host 'Desktop and Windows startup shortcuts created.'
