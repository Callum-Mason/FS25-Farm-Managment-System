# Database Migration Guide

This project uses a unified migration system that handles all database setup and updates in one command.

## Overview

The migration system:
- ✅ **Idempotent**: Safe to run multiple times
- 🔄 **Version Tracking**: Tracks which migrations have been applied
- 🎯 **Multi-Database**: Works with both SQLite (local) and PostgreSQL (production)
- 📦 **All-in-One**: Creates tables, indexes, triggers, and functions

## Quick Start

### Local Development (SQLite)

```bash
# Run migrations (auto-detects SQLite if no DB_HOST is set)
node server/database/migrate.cjs
```

### Production (PostgreSQL)

```bash
# Ensure .env has PostgreSQL credentials:
# DB_TYPE=postgres
# DB_HOST=your-server.postgres.database.azure.com
# DB_NAME=your-database
# DB_USER=your-username
# DB_PASSWORD=your-password
# DB_SSL=true

# Run migrations
node server/database/migrate.cjs
```

### Force Specific Database

```bash
# Force SQLite (useful for testing)
node server/database/migrate.cjs --db=sqlite

# Force PostgreSQL
node server/database/migrate.cjs --db=postgres
```

## What It Does

The migration script automatically:

1. **Creates Migration Tracking Table**
   - `schema_migrations` table tracks applied migrations
   - Prevents duplicate application of migrations

2. **Applies Pending Migrations**
   - Only runs migrations that haven't been applied yet
   - Safe to run after pulling new code

3. **Creates Complete Database Schema**
   - 10 tables: users, farms, farm_members, fields, field_history, crop_plans, animals, equipment, finances, join_codes
   - All indexes for performance
   - Triggers for auto-updating timestamps
   - Functions for data management

## Migration List

| Migration | Description |
|-----------|-------------|
| `001_initial_schema` | Creates all tables, indexes, and relationships |
| `002_triggers_and_functions` | Creates update triggers and helper functions |
| `003_add_production_tracking` | Adds 14 production tracking columns to fields table |

## Adding New Migrations

To add a new migration, edit `server/database/migrate.cjs`:

1. **Add migration object to `migrations` array**:

```javascript
{
  name: '003_add_new_feature',
  description: 'Add new feature to database',
  postgres: `
    -- PostgreSQL version
    ALTER TABLE fields ADD COLUMN new_column VARCHAR(100);
  `,
  sqlite: `
    -- SQLite version
    ALTER TABLE fields ADD COLUMN newColumn TEXT;
  `
}
```

2. **Run the migration**:

```bash
node server/database/migrate.cjs
```

The script will automatically:
- Detect the new migration
- Apply it to your database
- Record it in `schema_migrations`
- Skip it on future runs

## Migration Safety

✅ **Safe to run:**
- Multiple times (idempotent)
- After pulling new code
- On fresh databases
- On existing databases

❌ **Be careful:**
- Always test on local SQLite first
- Backup production database before running
- Review SQL changes in the migration script

## Database Schema

### Core Tables

- **users**: Authentication and user management
- **farms**: Farm information and game date tracking
- **farm_members**: Multi-user farm access control
- **fields**: Individual field management
- **field_history**: Crop rotation history
- **crop_plans**: Future crop planning
- **animals**: Livestock tracking
- **equipment**: Machinery and tools
- **finances**: Financial transactions
- **join_codes**: Farm invitation system

### Key Features

- **Game Date System**: Year/Month/Day tracking for in-game time
- **Multi-User Farms**: Multiple users can access the same farm
- **Audit Trail**: Field history tracks all crop changes
- **Automatic Timestamps**: `updated_at` columns auto-update on changes

## Troubleshooting

### "Cannot find module 'pg'"

Install PostgreSQL dependencies:
```bash
npm install pg
```

### "Cannot find module 'better-sqlite3'"

Install SQLite dependencies:
```bash
npm install better-sqlite3
```

### "Migration failed: table already exists"

This shouldn't happen (migrations use `CREATE TABLE IF NOT EXISTS`), but if it does:
- Check `schema_migrations` table to see what's recorded
- Manually mark migration as complete if needed:
  ```sql
  INSERT INTO schema_migrations (migration_name) VALUES ('001_initial_schema');
  ```

### Fresh Start (Delete All Data)

**SQLite:**
```bash
rm data/farm_manager.db
node server/database/migrate.cjs
```

**PostgreSQL:**
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
Then run migrations:
```bash
node server/database/migrate.cjs
```

## Legacy Migration Scripts

The following legacy scripts are **deprecated** and should not be used:

- ❌ `server/database/schema.sql` - Replaced by migration `001_initial_schema`
- ❌ `server/database/migrations/add-field-history.sql` - Included in `001_initial_schema`
- ❌ `server/database/add-field-history.cjs` - Included in `001_initial_schema`
- ❌ `server/database/migrate-game-date.cjs` - Included in `001_initial_schema`
- ❌ `add-columns.cjs` - Replaced by migration `003_add_production_tracking`
- ❌ `add-actual-yield.cjs` - Included in migration `003_add_production_tracking`

All functionality from these scripts is now consolidated in `migrate.cjs`.

## CI/CD Integration

### GitHub Actions

Add to your workflow:

```yaml
- name: Run Database Migrations
  run: node server/database/migrate.cjs
  env:
    DB_TYPE: postgres
    DB_HOST: ${{ secrets.DB_HOST }}
    DB_NAME: ${{ secrets.DB_NAME }}
    DB_USER: ${{ secrets.DB_USER }}
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
    DB_SSL: true
```

### Azure Web App

The migration runs automatically on deployment if added to `startup.sh`:

```bash
#!/bin/bash
echo "Running database migrations..."
node server/database/migrate.cjs

echo "Starting application..."
node server/index.js
```

## Support

If you encounter issues:
1. Check the migration script output for detailed error messages
2. Verify your database credentials in `.env`
3. Test locally with SQLite before running on PostgreSQL
4. Review the migration SQL in `migrate.cjs` to understand what's being executed
