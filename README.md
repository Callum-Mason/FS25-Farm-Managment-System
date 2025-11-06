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

### 🌾 **Field Management**
- Track crop growth stages, fertiliser application, and weed states
- Visual field cards with status indicators
- Field-specific notes and hectare tracking

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
# Clone the repository
git clone https://github.com/Callum-Mason/FS25-FMS.git
cd FS25-FMS

# Install dependencies
npm install

# Create environment file
cp .env.example .env

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
FS25-FMS/
├── server/                 # Backend (Node.js + Express)
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth & permissions
│   └── database/          # Database adapters & migrations
├── src/                    # Frontend (Vue 3 + TypeScript)
│   ├── components/        # Reusable Vue components
│   ├── views/             # Page components
│   ├── stores/            # Pinia state management
│   └── router/            # Vue Router config
├── tests/                  # Test suites
└── infra/                  # Azure deployment (Bicep)
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
```

### Database Setup

The project uses a unified migration system that works with both SQLite (local) and PostgreSQL (production):

```bash
# Run migrations (auto-detects database type)
npm run migrate

# Or run directly
node server/database/migrate.cjs
```

**What it does:**
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

### Prerequisites

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
git clone https://github.com/Callum-Mason/FS25-FMS.git
cd FS25-FMS

# Install dependencies
npm install

# Run deployment script
.\deploy.ps1
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
- **Application Insights**: Performance monitoring and logging
- **GitHub Actions**: Automated CI/CD pipeline

### Prerequisites

```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Login to Azure
az login

# Set subscription (if multiple)
az account set --subscription "Your-Subscription-Name"
```

### Deployment Steps

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd FS25-FMS
   npm install
   ```

2. **Run Deployment Script**
   ```powershell
   .\deploy.ps1
   ```

   The script will:
   - ✅ Create resource group
   - ✅ Provision PostgreSQL Flexible Server
   - ✅ Set up App Service with Node 20 LTS
   - ✅ Configure Key Vault for secrets
   - ✅ Enable Application Insights
   - ✅ Set up GitHub Actions workflow
   - ✅ Configure CORS and connection strings

3. **Push to Deploy**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push
   ```

   GitHub Actions automatically:
   - Builds frontend (Vite)
   - Compiles TypeScript backend
   - Deploys to Azure App Service
   - Runs database migrations

### Environment Variables

**Required in Azure App Service Configuration:**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host/db` |
| `JWT_SECRET` | Secret for JWT tokens | `your-secret-key-here` |
| `NODE_ENV` | Environment mode | `production` |
| `DB_TYPE` | Database type | `postgres` |

**Managed via Key Vault:**
- `db-password`: PostgreSQL admin password
- `jwt-secret`: JWT signing secret

---

## �️ Tech Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **ORM**: Custom dual-adapter pattern
- **Authentication**: JWT with bcrypt
- **Validation**: Express middleware

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

### Database Schema
- **users**: Authentication and profiles
- **farms**: Farm details and settings
- **farmMembers**: User-farm relationships with roles
- **fields**: Crop tracking and field management
- **cropPlans**: 4-year rotation planning
- **animals**: Livestock inventory
- **equipment**: Machinery and tools registry
- **finances**: Income/expense ledger
- **joinCodes**: Time-limited farm invitations

### DevOps
- **CI/CD**: GitHub Actions
- **Hosting**: Azure App Service (Linux)
- **Database**: Azure PostgreSQL Flexible Server
- **Secrets**: Azure Key Vault
- **Monitoring**: Application Insights
- **Logs**: Azure Monitor

---

## 📖 Documentation

### API Endpoints

#### Authentication
```http
POST /api/auth/register
POST /api/auth/login
```

#### Farms
```http
GET    /api/farms                    # List user's farms
POST   /api/farms                    # Create new farm
GET    /api/farms/:farmId            # Get farm details
PATCH  /api/farms/:farmId            # Update farm
DELETE /api/farms/:farmId            # Delete farm
POST   /api/farms/:farmId/join       # Join with code
POST   /api/farms/:farmId/codes      # Generate join code (owner)
GET    /api/farms/:farmId/codes      # List active codes (owner)
GET    /api/farms/:farmId/members    # List members
PATCH  /api/farms/:farmId/members/:id # Change role (owner)
DELETE /api/farms/:farmId/members/:id # Remove member (owner)
```

#### Fields
```http
GET    /api/farms/:farmId/fields     # List fields
POST   /api/farms/:farmId/fields     # Create field
PATCH  /api/fields/:farmId/:id       # Update field
DELETE /api/fields/:farmId/:id       # Delete field
```

#### Animals
```http
GET    /api/farms/:farmId/animals    # List animals
POST   /api/farms/:farmId/animals    # Add animals
PATCH  /api/animals/:farmId/:id      # Update animals
DELETE /api/animals/:farmId/:id      # Remove animals
```

#### Equipment
```http
GET    /api/farms/:farmId/equipment  # List equipment
POST   /api/farms/:farmId/equipment  # Add equipment
PATCH  /api/equipment/:farmId/:id    # Update equipment
DELETE /api/equipment/:farmId/:id    # Remove equipment
POST   /api/equipment/:id/sell       # Mark as sold
```

#### Finances
```http
GET    /api/farms/:farmId/finances   # List transactions + balance
POST   /api/farms/:farmId/finances   # Record transaction
DELETE /api/finances/:farmId/:id     # Delete transaction
```

**Authentication**: All endpoints except `/api/auth/*` require:
```http
Authorization: Bearer <jwt-token>
```

### Farm Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full access, can delete farm, manage members, create join codes |
| **Editor** | Can create, edit, delete all farm data (fields, animals, equipment, finances) |
| **Viewer** | Read-only access to all farm data |

---

## 🎨 Design System

### Color Palette

```css
:root {
  --colour-primary: 142 56% 25%;      /* Forest Green #2d6039 */
  --colour-secondary: 38 92% 52%;     /* Golden Yellow #f5ad1a */
  --colour-accent: 38 92% 60%;        /* Light Gold */
  --colour-surface: 49 63% 96%;       /* Cream #fbf9ef */
  --colour-surface-dark: 150 15% 96%; /* Light Grey */
  --colour-text: 150 15% 10%;         /* Dark Green-Grey */
  --colour-text-light: 150 10% 40%;   /* Medium Grey */
  --colour-danger: 0 65% 50%;         /* Red */
  --colour-success: 142 56% 35%;      /* Green */
}
```

### Typography
- **Headings**: Inter font family
- **Body**: System UI fonts
- **Monospace**: For data/numbers

### Components
All UI components use Tailwind CSS with custom design tokens. Colors automatically adapt when CSS variables are changed.

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Suites

- **API Tests**: Authentication, CRUD operations, permissions
- **Database Tests**: Schema validation, data integrity, migrations
- **Component Tests**: Vue components with user interactions
- **Integration Tests**: End-to-end workflows

**Coverage Target**: >80% for critical paths

---

## 🏗️ Project Structure

```
FS25-FMS/
├── server/                     # Backend (Node.js + Express)
│   ├── database.ts            # Database initialization & migrations
│   ├── db-adapter.ts          # Dual database adapter (PostgreSQL/SQLite)
│   ├── index.ts               # Express server entry
│   ├── seed.ts                # Demo data seeding
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication
│   │   └── farmAccess.ts      # Role-based access control
│   └── routes/
│       ├── auth.ts            # Registration & login
│       ├── farms.ts           # Farm management
│       ├── fields.ts          # Field tracking
│       ├── animals.ts         # Livestock management
│       ├── equipment.ts       # Machinery registry
│       └── finances.ts        # Financial ledger
│
├── src/                        # Frontend (Vue 3 + TypeScript)
│   ├── assets/
│   │   └── design.css         # Design system CSS variables
│   ├── components/
│   │   ├── CropRotationPlanner.vue
│   │   └── FieldCard.vue
│   ├── stores/                # Pinia state management
│   │   ├── auth.ts            # Auth state
│   │   └── farm.ts            # Farm state
│   ├── views/                 # Page components
│   │   ├── Dashboard.vue
│   │   ├── Fields.vue
│   │   ├── Equipment.vue
│   │   ├── Money.vue
│   │   └── FarmSettings.vue
│   ├── router/
│   │   └── index.ts           # Vue Router configuration
│   ├── utils/
│   │   └── api.ts             # HTTP client
│   └── main.ts                # Vue app entry
│
├── tests/                      # Test suites
│   ├── api/                   # API endpoint tests
│   ├── db/                    # Database tests
│   └── components/            # Component tests
│
├── .github/
│   └── workflows/
│       └── azure-deploy.yml   # CI/CD pipeline
│
├── infrastructure/             # Azure deployment scripts
│   ├── deploy.ps1             # Main deployment script
│   ├── setup-postgres.ps1     # PostgreSQL provisioning
│   └── setup-keyvault.ps1     # Key Vault configuration
│
├── dist/                       # Production build output
│   ├── index.html             # Frontend entry
│   ├── assets/                # Compiled CSS/JS
│   └── server/                # Compiled TypeScript backend
│
├── package.json                # Dependencies & scripts
├── vite.config.ts             # Frontend build config
├── tsconfig.json              # TypeScript config (frontend)
├── tsconfig.server.json       # TypeScript config (backend)
└── tailwind.config.js         # Tailwind CSS config
```

---

## 💻 Development

### Available Scripts

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm start                # Run production build
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run lint             # Lint code (if configured)
```

### Local Development with PostgreSQL

```bash
# Install PostgreSQL locally
winget install PostgreSQL.PostgreSQL

# Create database
createdb farmmanager

# Set environment
$env:DATABASE_URL="postgresql://localhost/farmmanager"
$env:DB_TYPE="postgres"

# Run migrations
npm run dev
```

---

## 🔒 Security

### Authentication
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiry
- HTTP-only cookies (optional)
### Authorization
- Role-based access control (RBAC)
- Farm-level permissions (Owner/Editor/Viewer)
- Middleware validation on all protected routes

### PostgreSQL Best Practices
- All camelCase identifiers quoted to preserve case
- Connection pooling for performance
- Prepared statements to prevent SQL injection
- SSL/TLS in production (Azure managed)

### Azure Security
- Key Vault for secrets management
- Managed Identity for service-to-service auth
- Network security groups and firewall rules
- HTTPS enforced on App Service

---

## 🐛 Troubleshooting

### Common Issues

**PostgreSQL Case Sensitivity**
```sql
-- ❌ Wrong: Unquoted identifiers
SELECT farmId FROM farmMembers

-- ✅ Correct: Quoted camelCase identifiers  
SELECT "farmId" FROM "farmMembers"
```

**Database Connection**
```bash
# Test PostgreSQL connection
psql $DATABASE_URL

# Check if database exists
az postgres flexible-server db list --resource-group <rg> --server-name <server>
```

**Azure App Service Logs**
```bash
# Stream logs in real-time
az webapp log tail --name <app-name> --resource-group <rg>

# Download logs
az webapp log download --name <app-name> --resource-group <rg>
```

**Build Failures**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## 🚀 Deployment Checklist

- [ ] Azure CLI installed and logged in
- [ ] GitHub repository created
- [ ] Secrets configured in Key Vault
- [ ] PostgreSQL firewall rules set
- [ ] Environment variables set in App Service
- [ ] GitHub Actions workflow configured
- [ ] CORS origins configured
- [ ] SSL certificate enabled
- [ ] Application Insights monitoring active
- [ ] Database backups configured

---

## 📊 Performance

### Optimization

- **Frontend**: Vite code splitting, tree shaking, minification
- **Backend**: Connection pooling, query optimization
- **Database**: Indexed foreign keys, efficient JOINs
- **Caching**: Browser caching for static assets
- **CDN**: Azure CDN (optional for global distribution)

### Monitoring

Track performance in Application Insights:
- Request duration
- Dependency calls (database queries)
- Error rates and exceptions
- User sessions and page views

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- **TypeScript**: Strict mode enabled
- **Vue**: Composition API with `<script setup>`
- **Formatting**: Prettier (if configured)
- **Linting**: ESLint rules
- **Commits**: Conventional Commits format

---

## 📝 License

This project is provided as-is for personal use. See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Farming Simulator 25 community
- Vue.js and Vite teams
- Azure developer tools
- British farming best practices resources

---

## 📞 Support

**Issues**: [GitHub Issues](../../issues)

**Questions**: Open a discussion in the repository

**Updates**: Watch the repository for new releases

---

<div align="center">

### 🚜 Happy Farming! 🌾

**Built with ❤️ for the Farming Simulator community**

[⬆ Back to Top](#-fs25-farm-management-system)

</div>