# 🚜 FS25 Farm Management System

<div align="center">

**A comprehensive farm management web application for Farming Simulator 25 players**

[![Azure](https://img.shields.io/badge/Azure-App_Service-0078D4?logo=microsoftazure)](https://azure.microsoft.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Flexible_Server-336791?logo=postgresql)](https://www.postgresql.org)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vue.js)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)

*Track fields, livestock, equipment, and finances with a realistic British farming dashboard*

[Features](#-features) • [Quick Start](#-quick-start) • [Development](#-development-setup) • [Deployment](#-azure-deployment-with-github-actions)

 </div>


---

## ✨ Features

### **FS25 Farm Managment System**

- Track crop growth stages, fertiliser application, and weed states
- Visual field cards with status indicators
**Access the app:** `http://localhost:3000`

### 🔄 **Crop Rotation Planner**

- Intelligent 4-year rotation suggestions based on UK farming best practices
- Prevents disease buildup and optimizes soil health
- Season-specific planting recommendations

### 💰 **Financial Ledger**

- Complete income/expense tracking with real-time balance calculations
- Category-based organization (Sales, Purchases, Equipment, etc.)

### 🐄 **Livestock Management**

- Track animal counts by type (Cows, Sheep, Chickens, Pigs)
- Monitor feed requirements and productivity

### 🚜 **Equipment Registry**

- Machinery tracking with ownership status (owned/leased)
- Daily cost calculations and condition monitoring

### 👥 **Multi-User Collaboration**

- Role-based access control (Owner, Editor, Viewer)
- Time-limited join codes for farm invitations

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))

### Installation

```bash
# Clone the repository (correct repo name)
git clone https://github.com/Callum-Mason/FS25-Farm-Managment-System.git
cd FS25-Farm-Managment-System

# Install dependencies
npm install

# Create environment file (PowerShell)
Copy-Item .env.example .env
# On macOS / Linux use: cp .env.example .env

# Start the development server
npm run dev
```

**Access the app:** http://localhost:3000

### Demo Account

- **Email:** `demo@farm.local`
- **Password:** `Demo1234!`

---

## 💻 Development Setup

### Project Structure

```
FS25-Farm-Managment-System/
├── server/                 # Backend (Node.js + Express)
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth & permissions
│   └── database/          # Database adapters & migrations
├── src/                    # Frontend (Vue 3 + TypeScript)
│   ├── components/        # Reusable Vue components
│   ├── views/             # Page components
│   ├── stores/            # Pinia state management
│   └── router/            # Vue Router config
└── tests/                  # Test suites
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Database
npm run migrate          # Run database migrations (auto-detects SQLite/PostgreSQL)

# Building
npm run build            # Build frontend and backend for production
npm run build:frontend   # Build Vue.js frontend only
npm run build:backend    # Compile TypeScript backend only

# Production
npm start                # Run production build

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:api         # Run API tests (test:api)
```

### Database Setup

The project uses a unified migration system that works with both SQLite (local) and PostgreSQL (production):

```bash
# Run migrations (auto-detects database type)
npm run migrate

# Or run directly
node server/database/migrate.cjs
```

- **What it does:**

- ✅ Creates all tables (users, farms, fields, animals, equipment, finances, etc.)
- ✅ Sets up indexes for performance
- ✅ Creates triggers and helper functions
- ✅ Tracks applied migrations to prevent duplicates
- ✅ Safe to run multiple times (idempotent)

For detailed migration documentation, see [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md).

### Environment Variables

Create a `.env` file in the project root:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your-random-secret-key-min-32-characters

# Database (SQLite for local development)
DB_FILE=./data/farm_manager.db

# For PostgreSQL (optional local testing)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=farmmanager
# DB_USER=postgres
# DB_PASSWORD=your-password
```

### Local Development Features

- **Hot Module Replacement (HMR)** - Instant updates without refresh
- **SQLite Database** - Zero-config local database
- **TypeScript** - Full type safety
- **Demo Data** - Pre-seeded with sample farm data

---

## ☁️ Azure Deployment with GitHub Actions

### Overview

Deploy your Farm Management System to Azure with automated CI/CD using GitHub Actions. The application will run on:

- **Azure App Service** (B1 tier) - ~£40/month
- **Azure PostgreSQL Flexible Server** (B1ms tier) - ~£10/month
- **Total cost:** ~£50/month

### Azure prerequisites

1. **Azure Account** - [Create free account](https://azure.microsoft.com/free/)
2. **Azure CLI** - Install via:

   ```powershell
   winget install Microsoft.AzureCLI
   ```
3. **GitHub Account** - Your repository must be on GitHub

### Step 1: Deploy Azure Infrastructure

```powershell
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "Your-Subscription-Name"

# Clone and navigate to repository
git clone https://github.com/Callum-Mason/FS25-Farm-Managment-System.git
cd FS25-Farm-Managment-System

# Install dependencies
npm install

# Run deployment script
.\deploy-infrastructure.ps1
```

The deployment script will:
- ✅ Create Azure resource group
- ✅ Provision PostgreSQL Flexible Server
- ✅ Set up App Service with Node.js 20
- ✅ Configure environment variables
- ✅ Run database migrations

**Note:** You'll be prompted for a PostgreSQL admin password. Save this securely!

### Step 2: Configure GitHub Secrets

Your GitHub Actions workflow needs two pieces of information:

#### 2a. Set GitHub Variable

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click the **Variables** tab
4. Click **New repository variable**
5. Add:
   - **Name:** `AZURE_WEBAPP_NAME`
   - **Value:** Your Azure Web App name (e.g., `fs25fms-app-xxxxx`)

#### 2b. Set GitHub Secret

1. Get your publish profile:
   ```powershell
   az webapp deployment list-publishing-profiles `
     --name YOUR-AZURE-APP-NAME `
     --resource-group YOUR-RESOURCE-GROUP `
     --xml > publish-profile.xml
   ```

2. In GitHub, go to **Settings** → **Secrets and variables** → **Actions**
3. Click the **Secrets** tab
4. Click **New repository secret**
5. Add:
   - **Name:** `AZURE_WEBAPP_PUBLISH_PROFILE`
   - **Value:** Paste the **entire contents** of `publish-profile.xml`

6. **Important:** Delete the local `publish-profile.xml` file:
   ```powershell
   Remove-Item publish-profile.xml
   ```

### Step 3: Deploy with GitHub Actions

```bash
# Commit your changes (if any)
git add .
git commit -m "Configure deployment"

# Push to GitHub - this triggers deployment
git push origin main
```

### Step 4: Monitor Deployment

1. Go to your repository's **Actions** tab on GitHub
2. Watch the "Deploy to Azure" workflow run
3. Deployment typically takes 3-5 minutes

Once complete, your app will be live at: `https://YOUR-AZURE-APP-NAME.azurewebsites.net`

### Automatic Deployments

Every time you push to the `main` branch, GitHub Actions will:
1. ✅ Install dependencies
2. ✅ Build frontend (Vite)
3. ✅ Compile TypeScript backend
4. ✅ Deploy to Azure App Service
5. ✅ Your app updates automatically

### Troubleshooting Deployment

**Check application logs:**
```powershell
az webapp log tail --name YOUR-AZURE-APP-NAME --resource-group YOUR-RESOURCE-GROUP
```

**Restart the app:**
```powershell
az webapp restart --name YOUR-AZURE-APP-NAME --resource-group YOUR-RESOURCE-GROUP
```

**Verify environment variables:**
```powershell
az webapp config appsettings list `
  --name YOUR-AZURE-APP-NAME `
  --resource-group YOUR-RESOURCE-GROUP `
  --output table
```

---

## 🛠️ Tech Stack

### Backend
- **Node.js 20 LTS** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL / SQLite** - Dual database support
- **JWT + bcrypt** - Authentication

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type safety
- **Pinia** - State management
- **Vue Router** - Navigation
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool

### DevOps
- **GitHub Actions** - CI/CD pipeline
- **Azure App Service** - Hosting (Linux)
- **Azure PostgreSQL** - Production database
- **Azure Key Vault** - Secrets management

---

## 📖 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register    # Create new account
POST /api/auth/login       # Login and get JWT token
```

### Farm Management

```http
GET    /api/farms                    # List your farms
POST   /api/farms                    # Create new farm
GET    /api/farms/:farmId            # Get farm details
PATCH  /api/farms/:farmId            # Update farm
DELETE /api/farms/:farmId            # Delete farm (owner only)
```

### Field Tracking

```http
GET    /api/farms/:farmId/fields     # List fields
POST   /api/farms/:farmId/fields     # Create field
PATCH  /api/fields/:farmId/:id       # Update field
DELETE /api/fields/:farmId/:id       # Delete field
```

### Financial Ledger

```http
GET    /api/farms/:farmId/finances   # Get transactions + balance
POST   /api/farms/:farmId/finances   # Add transaction
DELETE /api/finances/:farmId/:id     # Delete transaction
```

**All endpoints (except auth) require:**
```http
Authorization: Bearer <jwt-token>
```

---

## 🔒 Security Features

- ✅ **Password Hashing** - bcrypt with 10 rounds
- ✅ **JWT Authentication** - 7-day token expiry
- ✅ **Role-Based Access** - Owner, Editor, Viewer permissions
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **HTTPS Enforced** - In production
- ✅ **Environment Variables** - Never commit secrets

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode during development
npm run test:watch
```

**Test Coverage:**
- ✅ API endpoint tests
- ✅ Authentication & authorization
- ✅ Database operations
- ✅ Vue component tests

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 📄 License

This project is provided as-is for personal use.

---

## 🙏 Acknowledgments

Built for the Farming Simulator 25 community with ❤️

---

<div align="center">

### 🚜 Happy Farming! 🌾

[⬆ Back to Top](#-fs25-farm-management-system)

</div>