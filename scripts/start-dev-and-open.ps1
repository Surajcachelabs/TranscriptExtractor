# start-dev-and-open.ps1
# Starts the development server in a new PowerShell window and opens the app in your default browser.
# Usage: run this from the project root (c:\Users\Asus\Desktop\AuditUp) in PowerShell

param(
  [int]$DelaySeconds = 2
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Resolve-Path -Relative
if (-not (Test-Path "${projectRoot}\package.json")) {
  Write-Error "This script should be run from the project scripts directory or from the repository root."
  Exit 1
}

Write-Host "Installing dependencies (if missing) and starting dev server in a new window..." -ForegroundColor Cyan

# Run `npm install` to ensure deps are installed, then start dev in a separate PowerShell window.
# Use an explicit ArgumentList to avoid quoting issues in PowerShell.
Start-Process pwsh -ArgumentList '-NoExit', '-Command', "cd '$PWD'; npm install; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds $DelaySeconds

# Open the app in the default browser
$uri = 'http://localhost:3000'
Write-Host "Opening $uri — sign in with Google to ensure tokens are created." -ForegroundColor Green
Start-Process $uri

Write-Host "Dev server started in new window. After sign-in, use scripts\test-transcribe.ps1 to test the /api/transcribe endpoint." -ForegroundColor Yellow
