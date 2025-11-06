# Azure Infrastructure Deployment

This script deploys all required Azure resources for the FS25 Farm Management System using environment variables for sensitive data.

## Prerequisites

- **Azure CLI** installed ([Download](https://aka.ms/installazurecliwindows))
- **Azure subscription** with appropriate permissions
- **Node.js 20.x** installed (for running database migrations)

## Usage

### 1. Configure Environment Variables

Create or update your `.env` file with the required settings:

```bash
# Required - Database admin password (minimum 8 characters)
DB_ADMIN_PASSWORD=YourSecurePassword123!

# Required - JWT secret for authentication (minimum 32 characters)
JWT_SECRET=your-very-long-random-secret-key-at-least-32-characters

# Optional - Database admin username (defaults to 'fs25admin')
DB_ADMIN_USERNAME=youradmin

# Optional - Azure subscription ID (uses current if not set)
AZURE_SUBSCRIPTION_ID=your-subscription-id
```

**Note:** The `.env` file is gitignored and never committed to the repository.

### 2. Login to Azure

```powershell
az login
```

### 3. Run the Deployment Script

```powershell
# Default deployment (resource group: rg-fs25fms, location: uksouth)
.\deploy-infrastructure.ps1

# Or customize resource group and location
.\deploy-infrastructure.ps1 -ResourceGroupName "my-resource-group" -Location "westeurope" -AppName "myfarmapp"
```

## What Gets Deployed

- **Resource Group** - Container for all resources
- **App Service Plan** - B1 tier (Basic, ~£40/month)
- **App Service** - Node.js 20 LTS web application
- **PostgreSQL Flexible Server** - B1ms tier (Burstable, ~£10/month)
- **PostgreSQL Database** - `farmmanager` database with UTF8 encoding
- **Firewall Rules** - Allows Azure services to connect

## Post-Deployment Steps

### 1. Configure GitHub Actions

Add these to your GitHub repository secrets/variables:

**Repository Variable:**
- `AZURE_WEBAPP_NAME` = (provided in script output)

**Repository Secret:**
- `AZURE_WEBAPP_PUBLISH_PROFILE` = (get from script instructions)

### 2. Get Publish Profile

Run this command (shown in script output):
```powershell
az webapp deployment list-publishing-profiles --name <app-service-name> --resource-group <resource-group-name> --xml
```

Copy the entire XML output and add it as `AZURE_WEBAPP_PUBLISH_PROFILE` secret in GitHub.

### 3. Deploy Your Code

Push to `main` branch or manually trigger the GitHub Actions workflow.

## Script Features

✅ **Security**: Uses environment variables for sensitive data (no hardcoded secrets)

✅ **Validation**: Checks prerequisites (Azure CLI, login status)

✅ **Error Handling**: Comprehensive error checking and rollback

✅ **Auto-Migration**: Automatically runs database migrations after deployment

✅ **Output Capture**: Saves deployment details to `azure-deployment-outputs.json`

✅ **Idempotent**: Safe to run multiple times (skips existing resources)

## Estimated Costs

| Resource | Tier | Cost (approx) |
|----------|------|--------------|
| App Service Plan | B1 Basic | £40/month |
| PostgreSQL Server | B1ms Burstable | £10/month |
| **Total** | | **£50/month** |

## Troubleshooting

### "Azure CLI is not installed"
Install from: https://aka.ms/installazurecliwindows

### "Not logged in to Azure"
Run: `az login`

### "DB_ADMIN_PASSWORD environment variable is not set"

Ensure your `.env` file contains:

```bash
DB_ADMIN_PASSWORD=YourSecurePassword123!
```

Or set it manually before running the script:

```powershell
$env:DB_ADMIN_PASSWORD = "YourSecurePassword123!"
```

### Deployment takes too long
The script typically takes 10-15 minutes. PostgreSQL server provisioning is the slowest part.

## Clean Up Resources

To delete all resources and stop billing:

```powershell
az group delete --name rg-fs25fms --yes --no-wait
```

⚠️ **Warning**: This permanently deletes all resources and data!
