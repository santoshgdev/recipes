# One-time setup: creates terraform.tfvars interactively
# Run from the terraform\ directory

Write-Host "`nFetching your GCP billing accounts..." -ForegroundColor Cyan
gcloud beta billing accounts list

$projectId      = Read-Host "`nEnter a globally unique project ID (e.g. sg-recipes-12345)"
$billingAccount = Read-Host "Enter your billing account ID (format: XXXXXX-XXXXXX-XXXXXX)"

@"
project_id      = "$projectId"
project_name    = "Recipes"
billing_account = "$billingAccount"
"@ | Out-File terraform.tfvars -Encoding utf8

Write-Host "`nCreated terraform.tfvars. Now run:" -ForegroundColor Green
Write-Host "  terraform init" -ForegroundColor Yellow
Write-Host "  terraform apply" -ForegroundColor Yellow
