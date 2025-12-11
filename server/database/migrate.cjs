#!/usr/bin/env node

/**
 * Unified Database Migration Script
 * 
 * This script handles all database setup and migrations in one command.
 * It works with both SQLite (local development) and PostgreSQL (production).
 * 
 * Features:
 * - Idempotent: Can be run multiple times safely
 * - Tracks applied migrations to avoid duplicates
 * - Creates all tables if they don't exist
 * - Applies pending migrations in order
 * - Supports both SQLite and PostgreSQL
 * 
 * Usage:
 *   node server/database/migrate.cjs [--db=sqlite|postgres]
 * 
 * Examples:
 *   node server/database/migrate.cjs                    # Auto-detect database type
 *   node server/database/migrate.cjs --db=sqlite        # Force SQLite
 *   node server/database/migrate.cjs --db=postgres      # Force PostgreSQL
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const forceDb = args.find(arg => arg.startsWith('--db='))?.split('=')[1];

// Determine database type
let dbType = forceDb;
if (!dbType) {
  if (process.env.DB_TYPE) {
    dbType = process.env.DB_TYPE;
  } else if (process.env.DATABASE_URL || process.env.DB_HOST) {
    dbType = 'postgres';
  } else {
    dbType = 'sqlite';
  }
}

console.log(`\n🔧 Database Migration Tool`);
console.log(`📊 Database Type: ${dbType}`);
console.log(`⏰ Started: ${new Date().toISOString()}\n`);

// Database connection
let db;

// Initialize database connection based on type
if (dbType === 'postgres') {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  db = {
    async query(sql, params = []) {
      const result = await pool.query(sql, params);
      return result.rows;
    },
    async exec(sql) {
      await pool.query(sql);
    },
    async close() {
      await pool.end();
    }
  };
} else {
  const Database = require('better-sqlite3');
  const dbDir = path.join(__dirname, '../../data');
  const dbPath = path.join(dbDir, 'farm_manager.db');
  
  // Ensure data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const sqlite = new Database(dbPath);
  
  db = {
    async query(sql, params = []) {
      // For SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = sqlite.prepare(sql);
        return stmt.all(...params);
      }
      // For INSERT/UPDATE/DELETE queries
      const stmt = sqlite.prepare(sql);
      const info = stmt.run(...params);
      return [{ id: info.lastInsertRowid }];
    },
    async exec(sql) {
      sqlite.exec(sql);
    },
    async close() {
      sqlite.close();
    }
  };
}

// Migration tracking table
const MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const MIGRATIONS_TABLE_SQLITE = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_name TEXT NOT NULL UNIQUE,
  applied_at TEXT DEFAULT (datetime('now'))
);
`;

// Define all migrations in order
const migrations = [
  {
    name: '001_initial_schema',
    description: 'Create all initial tables',
    postgres: `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Farms table
      CREATE TABLE IF NOT EXISTS farms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(100),
        created_by_user_id INTEGER NOT NULL,
        current_year INTEGER DEFAULT 1,
        current_month INTEGER DEFAULT 1,
        current_day INTEGER DEFAULT 1,
        days_per_month INTEGER DEFAULT 28,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
      );

      -- Farm members table
      CREATE TABLE IF NOT EXISTS farm_members (
        id SERIAL PRIMARY KEY,
        farm_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(farm_id, user_id)
      );

      -- Fields table
      CREATE TABLE IF NOT EXISTS fields (
        id SERIAL PRIMARY KEY,
        farm_id INTEGER NOT NULL,
        field_number INTEGER NOT NULL,
        name VARCHAR(100),
        size REAL NOT NULL,
        current_crop VARCHAR(100),
        growth_stage VARCHAR(50),
        last_harvest_date TIMESTAMP,
        last_planting_date TIMESTAMP,
        soil_type VARCHAR(50),
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Field history table
      CREATE TABLE IF NOT EXISTS field_history (
        id SERIAL PRIMARY KEY,
        field_id INTEGER NOT NULL,
        crop VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        growth_stage VARCHAR(50),
        game_year INTEGER NOT NULL DEFAULT 1,
        game_month INTEGER NOT NULL DEFAULT 1,
        game_day INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
      );

      -- Crop plans table
      CREATE TABLE IF NOT EXISTS crop_plans (
        id SERIAL PRIMARY KEY,
        field_id INTEGER NOT NULL,
        planned_crop VARCHAR(100) NOT NULL,
        planting_year INTEGER NOT NULL,
        planting_month INTEGER NOT NULL,
        harvest_year INTEGER NOT NULL,
        harvest_month INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
      );

      -- Animals table
      CREATE TABLE IF NOT EXISTS animals (
        id SERIAL PRIMARY KEY,
        farm_id INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        breed VARCHAR(50),
        quantity INTEGER NOT NULL DEFAULT 1,
        purchase_date TIMESTAMP,
        purchase_price REAL,
        health_status VARCHAR(50) DEFAULT 'healthy',
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Equipment table
      CREATE TABLE IF NOT EXISTS equipment (
        id SERIAL PRIMARY KEY,
        farm_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        brand VARCHAR(50),
        purchase_date TIMESTAMP,
        purchase_price REAL,
        maintenance_schedule TEXT,
        last_maintenance_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'operational',
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Finances table
      CREATE TABLE IF NOT EXISTS finances (
        id SERIAL PRIMARY KEY,
        farm_id INTEGER NOT NULL,
        game_year INTEGER NOT NULL DEFAULT 1,
        game_month INTEGER NOT NULL DEFAULT 1,
        game_day INTEGER NOT NULL DEFAULT 1,
        type VARCHAR(20) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        created_by_user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
      );

      -- Join codes table
      CREATE TABLE IF NOT EXISTS join_codes (
        id SERIAL PRIMARY KEY,
        farm_id INTEGER NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_farm_members_farm ON farm_members(farm_id);
      CREATE INDEX IF NOT EXISTS idx_farm_members_user ON farm_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_fields_farm ON fields(farm_id);
      CREATE INDEX IF NOT EXISTS idx_field_history_field ON field_history(field_id);
      CREATE INDEX IF NOT EXISTS idx_field_history_date ON field_history(game_year, game_month, game_day);
      CREATE INDEX IF NOT EXISTS idx_crop_plans_field ON crop_plans(field_id);
      CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id);
      CREATE INDEX IF NOT EXISTS idx_equipment_farm ON equipment(farm_id);
      CREATE INDEX IF NOT EXISTS idx_finances_farm ON finances(farm_id);
      CREATE INDEX IF NOT EXISTS idx_finances_date ON finances(game_year, game_month, game_day);
      CREATE INDEX IF NOT EXISTS idx_join_codes_code ON join_codes(code);
      CREATE INDEX IF NOT EXISTS idx_join_codes_farm ON join_codes(farm_id);
    `,
    sqlite: `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        createdAt TEXT DEFAULT (datetime('now'))
      );

      -- Farms table
      CREATE TABLE IF NOT EXISTS farms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        createdByUserId INTEGER NOT NULL,
        currentYear INTEGER DEFAULT 1,
        currentMonth INTEGER DEFAULT 1,
        currentDay INTEGER DEFAULT 1,
        daysPerMonth INTEGER DEFAULT 28,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (createdByUserId) REFERENCES users(id)
      );

      -- Farm members table
      CREATE TABLE IF NOT EXISTS farmMembers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        role TEXT DEFAULT 'member',
        joinedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(farmId, userId)
      );

      -- Fields table
      CREATE TABLE IF NOT EXISTS fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmId INTEGER NOT NULL,
        fieldNumber INTEGER NOT NULL,
        name TEXT,
        size REAL NOT NULL,
        currentCrop TEXT,
        growthStage TEXT,
        lastHarvestDate TEXT,
        lastPlantingDate TEXT,
        soilType TEXT,
        notes TEXT,
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Field history table
      CREATE TABLE IF NOT EXISTS fieldHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fieldId INTEGER NOT NULL,
        crop TEXT NOT NULL,
        action TEXT NOT NULL,
        growthStage TEXT,
        gameYear INTEGER NOT NULL DEFAULT 1,
        gameMonth INTEGER NOT NULL DEFAULT 1,
        gameDay INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        FOREIGN KEY (fieldId) REFERENCES fields(id) ON DELETE CASCADE
      );

      -- Crop plans table
      CREATE TABLE IF NOT EXISTS cropPlans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fieldId INTEGER NOT NULL,
        plannedCrop TEXT NOT NULL,
        plantingYear INTEGER NOT NULL,
        plantingMonth INTEGER NOT NULL,
        harvestYear INTEGER NOT NULL,
        harvestMonth INTEGER NOT NULL,
        notes TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (fieldId) REFERENCES fields(id) ON DELETE CASCADE
      );

      -- Animals table
      CREATE TABLE IF NOT EXISTS animals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmId INTEGER NOT NULL,
        type TEXT NOT NULL,
        breed TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        purchaseDate TEXT,
        purchasePrice REAL,
        healthStatus TEXT DEFAULT 'healthy',
        notes TEXT,
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Equipment table
      CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmId INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        brand TEXT,
        purchaseDate TEXT,
        purchasePrice REAL,
        maintenanceSchedule TEXT,
        lastMaintenanceDate TEXT,
        status TEXT DEFAULT 'operational',
        notes TEXT,
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Finances table
      CREATE TABLE IF NOT EXISTS finances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmId INTEGER NOT NULL,
        gameYear INTEGER NOT NULL DEFAULT 1,
        gameMonth INTEGER NOT NULL DEFAULT 1,
        gameDay INTEGER NOT NULL DEFAULT 1,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        createdByUserId INTEGER NOT NULL,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY (createdByUserId) REFERENCES users(id)
      );

      -- Join codes table
      CREATE TABLE IF NOT EXISTS joinCodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmId INTEGER NOT NULL,
        code TEXT UNIQUE NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_farm_members_farm ON farmMembers(farmId);
      CREATE INDEX IF NOT EXISTS idx_farm_members_user ON farmMembers(userId);
      CREATE INDEX IF NOT EXISTS idx_fields_farm ON fields(farmId);
      CREATE INDEX IF NOT EXISTS idx_field_history_field ON fieldHistory(fieldId);
      CREATE INDEX IF NOT EXISTS idx_field_history_date ON fieldHistory(gameYear, gameMonth, gameDay);
      CREATE INDEX IF NOT EXISTS idx_crop_plans_field ON cropPlans(fieldId);
      CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farmId);
      CREATE INDEX IF NOT EXISTS idx_equipment_farm ON equipment(farmId);
      CREATE INDEX IF NOT EXISTS idx_finances_farm ON finances(farmId);
      CREATE INDEX IF NOT EXISTS idx_finances_date ON finances(gameYear, gameMonth, gameDay);
      CREATE INDEX IF NOT EXISTS idx_join_codes_code ON joinCodes(code);
      CREATE INDEX IF NOT EXISTS idx_join_codes_farm ON joinCodes(farmId);
    `
  },
  {
    name: '002_triggers_and_functions',
    description: 'Create triggers for updated_at columns and helper functions',
    postgres: `
      -- Function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Triggers for updated_at
      DROP TRIGGER IF EXISTS update_fields_updated_at ON fields;
      CREATE TRIGGER update_fields_updated_at
        BEFORE UPDATE ON fields
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_animals_updated_at ON animals;
      CREATE TRIGGER update_animals_updated_at
        BEFORE UPDATE ON animals
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
      CREATE TRIGGER update_equipment_updated_at
        BEFORE UPDATE ON equipment
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Function to cleanup expired join codes
      CREATE OR REPLACE FUNCTION cleanup_expired_join_codes()
      RETURNS void AS $$
      BEGIN
        DELETE FROM join_codes WHERE expires_at < CURRENT_TIMESTAMP;
      END;
      $$ LANGUAGE plpgsql;
    `,
    sqlite: `
      -- SQLite triggers for updated_at
      DROP TRIGGER IF EXISTS update_fields_updated_at;
      CREATE TRIGGER update_fields_updated_at
        AFTER UPDATE ON fields
        FOR EACH ROW
        BEGIN
          UPDATE fields SET updatedAt = datetime('now') WHERE id = NEW.id;
        END;

      DROP TRIGGER IF EXISTS update_animals_updated_at;
      CREATE TRIGGER update_animals_updated_at
        AFTER UPDATE ON animals
        FOR EACH ROW
        BEGIN
          UPDATE animals SET updatedAt = datetime('now') WHERE id = NEW.id;
        END;

      DROP TRIGGER IF EXISTS update_equipment_updated_at;
      CREATE TRIGGER update_equipment_updated_at
        AFTER UPDATE ON equipment
        FOR EACH ROW
        BEGIN
          UPDATE equipment SET updatedAt = datetime('now') WHERE id = NEW.id;
        END;
    `
  },
  {
    name: '003_add_production_tracking',
    description: 'Add production tracking columns to fields table',
    postgres: `
      -- Add production tracking columns to fields table
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS planted_year INTEGER;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS planted_month INTEGER;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS planted_day INTEGER;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS seeding_rate REAL;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS seed_cost REAL DEFAULT 0;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS fertilizer_cost REAL DEFAULT 0;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS lime_cost REAL DEFAULT 0;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS weeding_cost REAL DEFAULT 0;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS fuel_cost REAL DEFAULT 0;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS equipment_cost REAL DEFAULT 0;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS other_costs REAL DEFAULT 0;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS expected_yield REAL;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS production_record_id INTEGER;
      ALTER TABLE fields ADD COLUMN IF NOT EXISTS actual_yield REAL;
    `,
    sqlite: `
      -- SQLite: Add production tracking columns (will skip if they already exist)
    `,
    sqliteCustom: async (db) => {
      // SQLite doesn't support IF NOT EXISTS for ALTER TABLE
      // So we check each column and add it if missing
      const columns = [
        { name: 'planted_year', type: 'INTEGER' },
        { name: 'planted_month', type: 'INTEGER' },
        { name: 'planted_day', type: 'INTEGER' },
        { name: 'seeding_rate', type: 'REAL' },
        { name: 'seed_cost', type: 'REAL DEFAULT 0' },
        { name: 'fertilizer_cost', type: 'REAL DEFAULT 0' },
        { name: 'lime_cost', type: 'REAL DEFAULT 0' },
        { name: 'weeding_cost', type: 'REAL DEFAULT 0' },
        { name: 'fuel_cost', type: 'REAL DEFAULT 0' },
        { name: 'equipment_cost', type: 'REAL DEFAULT 0' },
        { name: 'other_costs', type: 'REAL DEFAULT 0' },
        { name: 'expected_yield', type: 'REAL' },
        { name: 'production_record_id', type: 'INTEGER' },
        { name: 'actual_yield', type: 'REAL' }
      ];

      // Get existing columns
      const tableInfo = await db.query('PRAGMA table_info(fields)', []);
      const existingColumns = tableInfo.map(col => col.name);

      // Add missing columns
      let addedCount = 0;
      for (const col of columns) {
        if (!existingColumns.includes(col.name)) {
          try {
            await db.exec(`ALTER TABLE fields ADD COLUMN ${col.name} ${col.type}`);
            console.log(`      ✓ Added column: ${col.name}`);
            addedCount++;
          } catch (error) {
            // Skip if column already exists (shouldn't happen due to check, but just in case)
            if (!error.message.includes('duplicate column')) {
              throw error;
            }
          }
        }
      }
      
      if (addedCount === 0) {
        console.log(`      ✓ All production tracking columns already exist`);
      }
    }
  },
  {
    name: '004_add_activity_log',
    description: 'Add activity log table for tracking multi-user actions',
    postgres: `
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        "farmId" INTEGER NOT NULL,
        "userId" INTEGER NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("farmId") REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_activity_log_farm ON activity_log("farmId");
      CREATE INDEX idx_activity_log_user ON activity_log("userId");
      CREATE INDEX idx_activity_log_created ON activity_log("createdAt" DESC);
    `,
    sqlite: `
      -- SQLite: Create activity log table
    `,
    sqliteCustom: async (db) => {
      // Create activity log table for SQLite
      await db.exec(`
        CREATE TABLE IF NOT EXISTS activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          "farmId" INTEGER NOT NULL,
          "userId" INTEGER NOT NULL,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id INTEGER,
          description TEXT,
          "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("farmId") REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_activity_log_farm ON activity_log("farmId");
        CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log("userId");
        CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log("createdAt");
      `);
      
      console.log(`      ✓ Activity log table created`);
    }
  },
  {
    name: '005_add_crop_storage',
    description: 'Add crop storage/inventory tracking table',
    postgres: `
      CREATE TABLE IF NOT EXISTS crop_storage (
        id SERIAL PRIMARY KEY,
        "farmId" INTEGER NOT NULL,
        crop_name VARCHAR(100) NOT NULL,
        quantity_stored DECIMAL(15, 2) NOT NULL DEFAULT 0,
        storage_location VARCHAR(255),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY ("farmId") REFERENCES farms(id) ON DELETE CASCADE,
        UNIQUE("farmId", crop_name)
      );

      CREATE INDEX idx_crop_storage_farm ON crop_storage("farmId");
      CREATE INDEX idx_crop_storage_crop ON crop_storage(crop_name);
    `,
    sqlite: `
      -- SQLite: Create crop storage table
    `,
    sqliteCustom: async (db) => {
      // Create crop storage table for SQLite
      await db.exec(`
        CREATE TABLE IF NOT EXISTS crop_storage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          "farmId" INTEGER NOT NULL,
          crop_name VARCHAR(100) NOT NULL,
          quantity_stored DECIMAL(15, 2) NOT NULL DEFAULT 0,
          storage_location VARCHAR(255),
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          notes TEXT,
          FOREIGN KEY ("farmId") REFERENCES farms(id) ON DELETE CASCADE,
          UNIQUE("farmId", crop_name)
        );
      `);

      await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_crop_storage_farm ON crop_storage("farmId");
        CREATE INDEX IF NOT EXISTS idx_crop_storage_crop ON crop_storage(crop_name);
      `);
      
      console.log(`      ✓ Crop storage table created`);
    }
  },
  {
    name: '006_add_bales_support',
    description: 'Add storage unit support for hay bales and straw bales',
    postgres: `
      ALTER TABLE crop_storage 
      ADD COLUMN IF NOT EXISTS storage_unit VARCHAR(50) DEFAULT 'liters';

      CREATE INDEX IF NOT EXISTS idx_crop_storage_unit ON crop_storage(storage_unit);
    `,
    sqlite: `
      -- SQLite: Add storage unit column
    `,
    sqliteCustom: async (db) => {
      try {
        // Check if column already exists
        const result = await db.all(`PRAGMA table_info(crop_storage)`);
        const hasUnit = result.some((col) => col.name === 'storage_unit');
        
        if (!hasUnit) {
          await db.exec(`
            ALTER TABLE crop_storage 
            ADD COLUMN storage_unit VARCHAR(50) DEFAULT 'liters';
          `);
          
          await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_crop_storage_unit ON crop_storage(storage_unit);
          `);
          
          console.log(`      ✓ Storage unit column added`);
        } else {
          console.log(`      ✓ Storage unit column already exists`);
        }
      } catch (error) {
        console.log(`      ℹ Storage unit column (may already exist):`, error.message);
      }
    }
  }
];

// Check if migration has been applied
async function isMigrationApplied(migrationName) {
  try {
    const result = await db.query(
      dbType === 'postgres' 
        ? 'SELECT * FROM schema_migrations WHERE migration_name = $1'
        : 'SELECT * FROM schema_migrations WHERE migration_name = ?',
      [migrationName]
    );
    return result.length > 0;
  } catch (error) {
    // Table doesn't exist yet
    return false;
  }
}

// Record migration as applied
async function recordMigration(migrationName) {
  await db.query(
    dbType === 'postgres'
      ? 'INSERT INTO schema_migrations (migration_name) VALUES ($1)'
      : 'INSERT INTO schema_migrations (migration_name) VALUES (?)',
    [migrationName]
  );
}

// Main migration function
async function runMigrations() {
  try {
    // Create migrations tracking table
    console.log('📋 Setting up migration tracking...');
    await db.exec(dbType === 'postgres' ? MIGRATIONS_TABLE : MIGRATIONS_TABLE_SQLITE);
    console.log('✅ Migration tracking ready\n');

    // Run each migration
    let appliedCount = 0;
    let skippedCount = 0;

    for (const migration of migrations) {
      const isApplied = await isMigrationApplied(migration.name);
      
      if (isApplied) {
        console.log(`⏭️  Skipping: ${migration.name} (already applied)`);
        skippedCount++;
        continue;
      }

      console.log(`\n🔄 Running: ${migration.name}`);
      console.log(`   ${migration.description}`);

      // Handle custom SQLite migration function
      if (dbType === 'sqlite' && migration.sqliteCustom) {
        await migration.sqliteCustom(db);
      } else {
        const sql = dbType === 'postgres' ? migration.postgres : migration.sqlite;
        if (sql.trim()) {
          await db.exec(sql);
        }
      }
      
      await recordMigration(migration.name);
      
      console.log(`✅ Completed: ${migration.name}`);
      appliedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Migration Summary:');
    console.log(`   ✅ Applied: ${appliedCount} migration(s)`);
    console.log(`   ⏭️  Skipped: ${skippedCount} migration(s) (already applied)`);
    console.log(`   📊 Total: ${migrations.length} migration(s)`);
    console.log('='.repeat(60));
    console.log(`\n⏰ Completed: ${new Date().toISOString()}`);
    console.log('✨ Database is up to date!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run migrations
runMigrations();
