#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Azure Infrastructure for FS25 Farm Management System

.DESCRIPTION
    This script creates all required Azure resources using Bicep templates.
    Sensitive values are read from .env file or environment variables.

.EXAMPLE
    # Configure .env file with required settings:
    DB_ADMIN_PASSWORD=your-secure-password-min-8-chars
    JWT_SECRET=your-jwt-secret-min-32-chars
    
    # Run the script
    .\deploy-infrastructure.ps1

.NOTES
    Requires: Azure CLI installed and authenticated
    Run 'az login' before executing this script
    Sensitive values should be in .env file (gitignored)
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroupName = "rg-fs25fms",
    
    [Parameter(Mandatory = $false)]
    [string]$Location = "uksouth",
    
    [Parameter(Mandatory = $false)]
    [string]$AppName = "fs25fms"
)

# ============================================================================
# Configuration
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 FS25 Farm Management System - Infrastructure Deployment" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# ============================================================================
# Check Prerequisites
# ============================================================================

Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

# Check if Azure CLI is installed
try {
    $azVersion = az version --output json 2>$null | ConvertFrom-Json
    Write-Host "✅ Azure CLI version: $($azVersion.'azure-cli')" -ForegroundColor Green
}
catch {
    Write-Host "❌ Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "   Install from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    $account = az account show 2>$null | ConvertFrom-Json
    Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
    Write-Host "   Subscription: $($account.name)" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Not logged in to Azure!" -ForegroundColor Red
    Write-Host "   Run: az login" -ForegroundColor Yellow
    exit 1
}

# ============================================================================
# Get Required Environment Variables
# ============================================================================

Write-Host "`n🔐 Loading environment variables from .env file..." -ForegroundColor Yellow

# Load .env file if it exists
$envFile = ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove quotes if present
            $value = $value -replace '^["'']|["'']$', ''
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ Environment variables loaded from .env" -ForegroundColor Green
}
else {
    Write-Host "⚠️  .env file not found, using existing environment variables" -ForegroundColor Yellow
}

Write-Host "`n🔐 Validating environment variables..." -ForegroundColor Yellow

# Azure Subscription ID (optional - uses current if not set)
$subscriptionId = $env:AZURE_SUBSCRIPTION_ID
if (-not $subscriptionId) {
    $subscriptionId = $account.id
    Write-Host "⚠️  AZURE_SUBSCRIPTION_ID not set, using current: $subscriptionId" -ForegroundColor Yellow
}
else {
    Write-Host "✅ AZURE_SUBSCRIPTION_ID: $subscriptionId" -ForegroundColor Green
}

# Database Admin Password (required)
$dbPassword = $env:DB_ADMIN_PASSWORD
if (-not $dbPassword) {
    Write-Host "❌ DB_ADMIN_PASSWORD environment variable is not set!" -ForegroundColor Red
    Write-Host "   Set it with: `$env:DB_ADMIN_PASSWORD = 'your-secure-password'" -ForegroundColor Yellow
    Write-Host "   Requirements: Minimum 8 characters, includes uppercase, lowercase, numbers" -ForegroundColor Yellow
    exit 1
}
if ($dbPassword.Length -lt 8) {
    Write-Host "❌ DB_ADMIN_PASSWORD must be at least 8 characters!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ DB_ADMIN_PASSWORD: ****** (${dbPassword.Length} chars)" -ForegroundColor Green

# JWT Secret (required)
$jwtSecret = $env:JWT_SECRET
if (-not $jwtSecret) {
    Write-Host "❌ JWT_SECRET environment variable is not set!" -ForegroundColor Red
    Write-Host "   Set it with: `$env:JWT_SECRET = 'your-random-secret-min-32-chars'" -ForegroundColor Yellow
    exit 1
}
if ($jwtSecret.Length -lt 32) {
    Write-Host "❌ JWT_SECRET must be at least 32 characters!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ JWT_SECRET: ****** (${jwtSecret.Length} chars)" -ForegroundColor Green

# Database Admin Username (optional - defaults to fs25admin)
$dbUsername = $env:DB_ADMIN_USERNAME
if (-not $dbUsername) {
    $dbUsername = "fs25admin"
    Write-Host "⚠️  DB_ADMIN_USERNAME not set, using default: $dbUsername" -ForegroundColor Yellow
}
else {
    Write-Host "✅ DB_ADMIN_USERNAME: $dbUsername" -ForegroundColor Green
}

# ============================================================================
# Set Active Subscription
# ============================================================================

Write-Host "`n📌 Setting active subscription..." -ForegroundColor Yellow
az account set --subscription $subscriptionId
Write-Host "✅ Active subscription set" -ForegroundColor Green

# ============================================================================
# Create Resource Group
# ============================================================================

Write-Host "`n📦 Creating resource group..." -ForegroundColor Yellow
Write-Host "   Name: $ResourceGroupName" -ForegroundColor Cyan
Write-Host "   Location: $Location" -ForegroundColor Cyan

$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "true") {
    Write-Host "⚠️  Resource group already exists" -ForegroundColor Yellow
}
else {
    az group create --name $ResourceGroupName --location $Location --output none
    Write-Host "✅ Resource group created" -ForegroundColor Green
}

# ============================================================================
# Generate Bicep Template Inline
# ============================================================================

Write-Host "`n📝 Generating Bicep template..." -ForegroundColor Yellow

$bicepTemplate = @"
// FS25 Farm Management System - Azure Infrastructure
targetScope = 'resourceGroup'

param location string = resourceGroup().location
param appName string = 'fs25fms'
@secure()
param dbAdminUsername string
@secure()
param dbAdminPassword string
@secure()
param jwtSecret string

var uniqueSuffix = uniqueString(resourceGroup().id)
var appServiceName = '\${appName}-app-\${uniqueSuffix}'
var appServicePlanName = '\${appName}-plan-\${uniqueSuffix}'
var postgresServerName = '\${appName}-db-\${uniqueSuffix}'
var databaseName = 'farmmanager'

// App Service Plan (B1 - Basic tier)
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
    size: 'B1'
    family: 'B'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// PostgreSQL Flexible Server (B1ms - Burstable tier)
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: postgresServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: dbAdminUsername
    administratorLoginPassword: dbAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// PostgreSQL Firewall Rule - Allow Azure Services
resource postgresFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  parent: postgresServer
  name: 'AllowAllAzureIPs'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// PostgreSQL Database
resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgresServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// App Service (Web App)
resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: appServiceName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: true
      appSettings: [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'DB_TYPE'
          value: 'postgres'
        }
        {
          name: 'DB_HOST'
          value: postgresServer.properties.fullyQualifiedDomainName
        }
        {
          name: 'DB_PORT'
          value: '5432'
        }
        {
          name: 'DB_NAME'
          value: databaseName
        }
        {
          name: 'DB_USER'
          value: dbAdminUsername
        }
        {
          name: 'DB_PASSWORD'
          value: dbAdminPassword
        }
        {
          name: 'DB_SSL'
          value: 'true'
        }
        {
          name: 'JWT_SECRET'
          value: jwtSecret
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
      ]
    }
    httpsOnly: true
  }
}

// Outputs
output appServiceName string = appService.name
output appServiceUrl string = 'https://\${appService.properties.defaultHostName}'
output postgresServerName string = postgresServer.name
output postgresServerFqdn string = postgresServer.properties.fullyQualifiedDomainName
output databaseName string = databaseName
"@

# Save Bicep template to temp file
$tempBicepFile = Join-Path $env:TEMP "fs25fms-infrastructure.bicep"
$bicepTemplate | Out-File -FilePath $tempBicepFile -Encoding UTF8
Write-Host "✅ Bicep template generated" -ForegroundColor Green

# ============================================================================
# Deploy Infrastructure
# ============================================================================

Write-Host "`n🚀 Deploying infrastructure to Azure..." -ForegroundColor Yellow
Write-Host "   This may take 10-15 minutes..." -ForegroundColor Cyan

$deploymentName = "fs25fms-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

try {
    $deployment = az deployment group create `
        --name $deploymentName `
        --resource-group $ResourceGroupName `
        --template-file $tempBicepFile `
        --parameters appName=$AppName `
        --parameters dbAdminUsername=$dbUsername `
        --parameters dbAdminPassword=$dbPassword `
        --parameters jwtSecret=$jwtSecret `
        --output json | ConvertFrom-Json

    Write-Host "`n✅ Deployment completed successfully!" -ForegroundColor Green
    
    # ============================================================================
    # Display Outputs
    # ============================================================================
    
    Write-Host "`n📊 Deployment Outputs:" -ForegroundColor Cyan
    Write-Host "=" * 70 -ForegroundColor Cyan
    
    $outputs = $deployment.properties.outputs
    Write-Host "🌐 App Service Name:      $($outputs.appServiceName.value)" -ForegroundColor White
    Write-Host "🔗 App Service URL:       $($outputs.appServiceUrl.value)" -ForegroundColor White
    Write-Host "🗄️  PostgreSQL Server:    $($outputs.postgresServerName.value)" -ForegroundColor White
    Write-Host "🔌 PostgreSQL FQDN:       $($outputs.postgresServerFqdn.value)" -ForegroundColor White
    Write-Host "💾 Database Name:         $($outputs.databaseName.value)" -ForegroundColor White
    
    # ============================================================================
    # Run Database Migrations
    # ============================================================================
    
    Write-Host "`n🔄 Running database migrations..." -ForegroundColor Yellow
    
    # Set environment variables for migration
    $env:DB_TYPE = "postgres"
    $env:DB_HOST = $outputs.postgresServerFqdn.value
    $env:DB_PORT = "5432"
    $env:DB_NAME = $outputs.databaseName.value
    $env:DB_USER = $dbUsername
    $env:DB_PASSWORD = $dbPassword
    $env:DB_SSL = "true"
    
    npm run migrate
    
    Write-Host "`n✅ Database migrations completed!" -ForegroundColor Green
    
    # ============================================================================
    # Next Steps
    # ============================================================================
    
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host "1. Configure GitHub Actions:" -ForegroundColor Yellow
    Write-Host "   - Go to: https://github.com/YOUR-USERNAME/FS25-FMS/settings/secrets/actions" -ForegroundColor White
    Write-Host "   - Add variable: AZURE_WEBAPP_NAME = $($outputs.appServiceName.value)" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Get Publish Profile:" -ForegroundColor Yellow
    Write-Host "   Run: az webapp deployment list-publishing-profiles --name $($outputs.appServiceName.value) --resource-group $ResourceGroupName --xml" -ForegroundColor White
    Write-Host "   - Copy the entire XML output" -ForegroundColor White
    Write-Host "   - Add secret: AZURE_WEBAPP_PUBLISH_PROFILE = <paste XML here>" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Deploy your code:" -ForegroundColor Yellow
    Write-Host "   - Push to main branch, or" -ForegroundColor White
    Write-Host "   - Manually trigger workflow in GitHub Actions" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Monitor deployment:" -ForegroundColor Yellow
    Write-Host "   - App Service: https://portal.azure.com/#resource$($deployment.properties.outputResources[0].id)" -ForegroundColor White
    Write-Host "   - Application URL: $($outputs.appServiceUrl.value)" -ForegroundColor White
    Write-Host ""
    
    # Save outputs to file
    $outputFile = "azure-deployment-outputs.json"
    $outputs | ConvertTo-Json | Out-File -FilePath $outputFile
    Write-Host "💾 Deployment outputs saved to: $outputFile" -ForegroundColor Green
}
catch {
    Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
finally {
    # Clean up temp file
    if (Test-Path $tempBicepFile) {
        Remove-Item $tempBicepFile -Force
    }
}

Write-Host "`n✨ Infrastructure deployment complete!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
