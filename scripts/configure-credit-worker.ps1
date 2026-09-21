# Run after deployment. Requires gcloud authentication with permission to manage
# Scheduler and service accounts. This creates no user credentials or IAM keys.
$ErrorActionPreference = 'Stop'
$project = 'pilates-center-9dee6'
$region = 'europe-west4'
$account = "credit-settlement@$project.iam.gserviceaccount.com"
$endpoint = 'https://www.pilatesdz.com/api/internal/credits'
$job = 'pilates-credit-settlement'
function Invoke-Cloud {
  param([string[]]$Arguments)
  & gcloud @Arguments
  if ($LASTEXITCODE -ne 0) { throw 'Cloud configuration failed. Check the preceding command output.' }
}
Get-Command gcloud -ErrorAction Stop | Out-Null
Invoke-Cloud -Arguments @('services', 'enable', 'cloudscheduler.googleapis.com', 'iam.googleapis.com', "--project=$project")
& gcloud iam service-accounts describe $account "--project=$project" --format=value 2>$null
if ($LASTEXITCODE -ne 0) {
  Invoke-Cloud -Arguments @('iam', 'service-accounts', 'create', 'credit-settlement', '--display-name=Pilates credit settlement caller', "--project=$project")
}
# The caller gets no Firestore role: the app verifies its OIDC identity and uses
# its own runtime identity. Scheduler uses its Google-managed service agent.
& gcloud scheduler jobs describe $job "--location=$region" "--project=$project" --format=value 2>$null
$operation = if ($LASTEXITCODE -eq 0) { 'update' } else { 'create' }
Invoke-Cloud -Arguments @('scheduler', 'jobs', $operation, 'http', $job, "--location=$region", "--project=$project", '--schedule=*/5 * * * *', '--time-zone=Africa/Algiers', "--uri=$endpoint", '--http-method=POST', "--oidc-service-account-email=$account", "--oidc-token-audience=$endpoint", '--attempt-deadline=60s')
Invoke-Cloud -Arguments @('scheduler', 'jobs', 'run', $job, "--location=$region", "--project=$project")
Write-Output 'Scheduler configured. Verify its execution succeeded, then check automation readiness in CRM > Forfaits > Validation.'
