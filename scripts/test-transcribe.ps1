<#
test-transcribe.ps1
PowerShell helper script to call the local /api/transcribe endpoint and display a pretty result.

IMPORTANT: The API route uses NextAuth server-side session to access your Google access token.
This means a simple programmatic request from PowerShell will return 401 unless:
  1) The server is running and you have an active browser session that created the session cookie (sign in via browser), and
  2) You supply the session cookie with your request (not done automatically by this script), OR
  3) You temporarily modify the server to accept a header with the access token (not recommended for production).

This script is useful for manual testing when you run it after signing in in the browser and using the browser cookie export tool to obtain the session cookie value (or if you intentionally accept the script will get 401 if not authenticated).

Usage (simple, unauthenticated):
  .\scripts\test-transcribe.ps1 -DriveUrl 'https://drive.google.com/file/d/FILE_ID/view'

Options:
  -DriveUrl <string>    : Google Drive file URL to transcribe
  -SessionCookie <string> : Optional — provide NextAuth session cookie (e.g., next-auth.session-token) to run this command authenticated
#>

param(
  [Parameter(Mandatory=$true)][string]$DriveUrl,
  [string]$SessionCookie
)

$endpoint = 'http://localhost:3000/api/transcribe'
$payload = @{ driveUrl = $DriveUrl } | ConvertTo-Json

# Default fallback that warns the user if no session cookie was provided
if (-not $SessionCookie) {
  Write-Warning "No session cookie provided. This request will likely return 401 unless you include your next-auth session cookie."
  Write-Host "If you signed in using the browser, open DevTools > Application > Cookies and copy the 'next-auth.session-token' or '__Secure-next-auth.session-token' value and re-run this script with -SessionCookie '<value>'" -ForegroundColor Yellow
}

# Build headers
$headers = @{
  'Content-Type' = 'application/json'
}
if ($SessionCookie) {
  # If you pass a full cookie string, the header below will send it in Cookie header (browser style)
  $headers['Cookie'] = "next-auth.session-token=$SessionCookie"
}

try {
  Write-Host "Posting to $endpoint" -ForegroundColor Cyan
  $response = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body $payload -UseBasicParsing -TimeoutSec 300
  Write-Host "Status: OK" -ForegroundColor Green
  $response | ConvertTo-Json -Depth 10 | Write-Host
} catch {
  # If server returns an error response, Invoke-RestMethod throws; we extract details
  if ($_.Exception.Response -ne $null) {
    $resp = $_.Exception.Response
    $stream = $resp.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Host "Server returned error response:" -ForegroundColor Red
    try {
      $json = $body | ConvertFrom-Json
      $json | ConvertTo-Json -Depth 10 | Write-Host
    } catch {
      Write-Host $body
    }
  } else {
    Write-Host "Connection error: $_" -ForegroundColor Red
  }
}
