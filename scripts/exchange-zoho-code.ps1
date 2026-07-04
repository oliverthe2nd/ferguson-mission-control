param(
  [Parameter(Mandatory = $true)]
  [string]$Code
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$envVars = @{}
Get-Content ".env.local" | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $i = $_.IndexOf('=')
  $name = $_.Substring(0, $i).Trim()
  $value = $_.Substring($i + 1).Trim().Trim('"')
  $envVars[$name] = $value
}

$body = @{
  grant_type    = "authorization_code"
  client_id     = $envVars.ZOHO_CLIENT_ID
  client_secret = $envVars.ZOHO_CLIENT_SECRET
  code          = $Code
}

$accounts = $envVars.ZOHO_ACCOUNTS_DOMAIN
if (-not $accounts) { $accounts = "https://accounts.zoho.com.au" }

$response = Invoke-RestMethod -Method Post -Uri "$accounts/oauth/v2/token" -Body $body

if ($response.error) {
  Write-Error "$($response.error) $($response.error_description)"
}

if (-not $response.refresh_token) {
  Write-Error "No refresh_token in response. Did you paste the Generate Code within 3 minutes?"
}

Write-Host ""
Write-Host "Success. Copy this refresh token into ZOHO_REFRESH_TOKEN:"
Write-Host $response.refresh_token
Write-Host ""
Write-Host "api_domain: $($response.api_domain)"
Write-Host "expires_in: $($response.expires_in)"
