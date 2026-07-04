$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$keys = @(
  "ZOHO_CLIENT_ID",
  "ZOHO_CLIENT_SECRET",
  "ZOHO_REFRESH_TOKEN",
  "ZOHO_API_DOMAIN",
  "ZOHO_ACCOUNTS_DOMAIN",
  "ZOHO_SYNC_WEEKS"
)

$vars = @{}
Get-Content ".env.local" | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $i = $_.IndexOf('=')
  $name = $_.Substring(0, $i).Trim()
  $value = $_.Substring($i + 1).Trim().Trim('"')
  if ($keys -contains $name) { $vars[$name] = $value }
}

foreach ($key in $keys) {
  if (-not $vars.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($vars[$key])) {
    Write-Error "Missing $key in .env.local"
  }
}

foreach ($envName in @("production", "preview")) {
  foreach ($key in $keys) {
    npx vercel env add $key $envName --value $vars[$key] --yes --sensitive --force | Out-Null
    Write-Host "Updated $key for $envName"
  }
}

Write-Host "Done. Redeploy production for the deployment to pick up changes."
