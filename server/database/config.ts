// ============================================================================
// Database Configuration
// ============================================================================
// This file handles database connections for both SQLite (development)
// and PostgreSQL (production)

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface User {
  id: number
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

export interface Farm {
  id: number
  name: string
  mapName: string
  currency: string
  createdByUserId: number
  createdAt: string
}

export interface FarmMember {
  id: number
  farmId: number
  userId: number
  role: string
  joinedAt?: string
}

export interface Field {
  id: number
  farmId: number
  fieldNumber: number
  name: string
  sizeHectares: number
  currentCrop: string | null
  growthStage: string | null
  fertiliserState: string | null
  weedsState: string | null
  notes: string | null
  updatedAt: string
}

export interface CropPlan {
  id: number
  fieldId: number
  yearNumber: number
  plannedCrop: string
  notes: string | null
}

export interface Animal {
  id: number
  farmId: number
  type: string
  count: number
  feedPerDay: number
  productivity: number
  notes: string | null
  updatedAt: string
}

export interface Equipment {
  id: number
  farmId: number
  model: string
  category: string
  brand: string
  owned: boolean
  leased: boolean
  dailyCost: number
  condition: number
  userId: number | null
  purchasePrice: number
  purchaseDate: string | null
  sold: boolean
  salePrice: number
  saleDate: string | null
  notes: string | null
  updatedAt: string
}

export interface Finance {
  id: number
  farmId: number
  date: string
  type: string
  category: string
  description: string
  amount: number
  createdByUserId: number
}

export interface JoinCode {
  id: number
  farmId: number
  code: string
  createdAt: string
  expiresAt: string
}

// Database adapter interface for abstraction
export interface DatabaseAdapter {
  query(sql: string, params?: any[]): Promise<any[]>
  get(sql: string, params?: any[]): Promise<any>
  run(sql: string, params?: any[]): Promise<{ lastInsertRowid: number; changes: number }>
  exec(sql: string): Promise<void>
  close(): Promise<void>
}

let dbAdapter: DatabaseAdapter

// ============================================================================
// Database Type Detection
// ============================================================================

export function getDatabaseType(): 'sqlite' | 'postgres' {
  // Use PostgreSQL if DB_HOST is set (Azure production)
  if (process.env.DB_HOST) {
    return 'postgres'
  }
  // Otherwise use SQLite (local development)
  return 'sqlite'
}

// ============================================================================
// Database Initialization
// ============================================================================

export async function initDatabase(dbPath?: string): Promise<DatabaseAdapter> {
  const dbType = getDatabaseType()

  if (dbType === 'postgres') {
    console.log('Initializing PostgreSQL connection...')
    const { createPostgresAdapter } = await import('./postgres-adapter.js')
    dbAdapter = await createPostgresAdapter()
  } else {
    console.log('Initializing SQLite connection...')
    const { createSqliteAdapter } = await import('./sqlite-adapter.js')
    dbAdapter = await createSqliteAdapter(dbPath)
  }

  await runMigrations()
  return dbAdapter
}

// ============================================================================
// Migrations
// ============================================================================

async function runMigrations() {
  const dbType = getDatabaseType()

  if (dbType === 'postgres') {
    // PostgreSQL migrations
    await runPostgresMigrations()
  } else {
    // SQLite migrations (keeping existing logic)
    await runSqliteMigrations()
  }
}

async function runPostgresMigrations() {
  // For PostgreSQL, we use snake_case column names
  await dbAdapter.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farms (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      map_name VARCHAR(255) NOT NULL,
      currency VARCHAR(10) DEFAULT 'GBP',
      created_by_user_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS farm_members (
      id SERIAL PRIMARY KEY,
      farm_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role VARCHAR(50) NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(farm_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS fields (
      id SERIAL PRIMARY KEY,
      farm_id INTEGER NOT NULL,
      field_number INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      size_hectares DECIMAL(10, 2) NOT NULL,
      current_crop VARCHAR(100),
      growth_stage VARCHAR(50),
      fertiliser_state VARCHAR(50),
      weeds_state VARCHAR(50),
      notes TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS crop_plans (
      id SERIAL PRIMARY KEY,
      field_id INTEGER NOT NULL,
      year_number INTEGER NOT NULL,
      planned_crop VARCHAR(100) NOT NULL,
      notes TEXT,
      FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS animals (
      id SERIAL PRIMARY KEY,
      farm_id INTEGER NOT NULL,
      type VARCHAR(100) NOT NULL,
      count INTEGER NOT NULL,
      feed_per_day DECIMAL(10, 2) NOT NULL,
      productivity DECIMAL(10, 2) NOT NULL,
      notes TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id SERIAL PRIMARY KEY,
      farm_id INTEGER NOT NULL,
      model VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      brand VARCHAR(100) NOT NULL,
      owned BOOLEAN DEFAULT TRUE,
      leased BOOLEAN DEFAULT FALSE,
      daily_cost DECIMAL(10, 2) DEFAULT 0,
      condition DECIMAL(5, 2) DEFAULT 100,
      user_id INTEGER,
      purchase_price DECIMAL(10, 2) DEFAULT 0,
      purchase_date DATE,
      sold BOOLEAN DEFAULT FALSE,
      sale_price DECIMAL(10, 2) DEFAULT 0,
      sale_date DATE,
      notes TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS finances (
      id SERIAL PRIMARY KEY,
      farm_id INTEGER NOT NULL,
      date DATE NOT NULL,
      type VARCHAR(50) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      created_by_user_id INTEGER NOT NULL,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS join_codes (
      id SERIAL PRIMARY KEY,
      farm_id INTEGER NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS field_history (
      id SERIAL PRIMARY KEY,
      field_id INTEGER NOT NULL,
      crop VARCHAR(100) NOT NULL,
      action VARCHAR(50) NOT NULL,
      growth_stage VARCHAR(50),
      action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
    );
  `)

  // Create indexes if they don't exist
  try {
    await dbAdapter.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_farms_created_by ON farms(created_by_user_id);
      CREATE INDEX IF NOT EXISTS idx_farm_members_farm ON farm_members(farm_id);
      CREATE INDEX IF NOT EXISTS idx_farm_members_user ON farm_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_fields_farm ON fields(farm_id);
      CREATE INDEX IF NOT EXISTS idx_crop_plans_field ON crop_plans(field_id);
      CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id);
      CREATE INDEX IF NOT EXISTS idx_equipment_farm ON equipment(farm_id);
      CREATE INDEX IF NOT EXISTS idx_finances_farm ON finances(farm_id);
      CREATE INDEX IF NOT EXISTS idx_join_codes_farm ON join_codes(farm_id);
      CREATE INDEX IF NOT EXISTS idx_field_history_field ON field_history(field_id);
      CREATE INDEX IF NOT EXISTS idx_field_history_date ON field_history(action_date);
    `)
  } catch (error) {
    console.log('Some indexes may already exist:', error)
  }

  console.log('PostgreSQL migrations completed successfully')
}

async function runSqliteMigrations() {
  // Keep original SQLite schema with camelCase
  await dbAdapter.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mapName TEXT NOT NULL,
      currency TEXT DEFAULT 'GBP',
      createdByUserId INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdByUserId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS farmMembers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      role TEXT NOT NULL,
      joinedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(farmId, userId)
    );

    CREATE TABLE IF NOT EXISTS fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmId INTEGER NOT NULL,
      fieldNumber INTEGER NOT NULL,
      name TEXT NOT NULL,
      sizeHectares REAL NOT NULL,
      currentCrop TEXT,
      growthStage TEXT,
      fertiliserState TEXT,
      weedsState TEXT,
      notes TEXT,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cropPlans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fieldId INTEGER NOT NULL,
      yearNumber INTEGER NOT NULL,
      plannedCrop TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (fieldId) REFERENCES fields(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS animals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmId INTEGER NOT NULL,
      type TEXT NOT NULL,
      count INTEGER NOT NULL,
      feedPerDay REAL NOT NULL,
      productivity REAL NOT NULL,
      notes TEXT,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmId INTEGER NOT NULL,
      model TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT NOT NULL,
      owned INTEGER DEFAULT 1,
      leased INTEGER DEFAULT 0,
      dailyCost REAL DEFAULT 0,
      condition REAL DEFAULT 100,
      userId INTEGER,
      purchasePrice REAL DEFAULT 0,
      purchaseDate TEXT,
      sold INTEGER DEFAULT 0,
      salePrice REAL DEFAULT 0,
      saleDate TEXT,
      notes TEXT,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS finances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmId INTEGER NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      createdByUserId INTEGER NOT NULL,
      FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE,
      FOREIGN KEY (createdByUserId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS joinCodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmId INTEGER NOT NULL,
      code TEXT UNIQUE NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      expiresAt TEXT NOT NULL,
      FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fieldHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fieldId INTEGER NOT NULL,
      crop TEXT NOT NULL,
      action TEXT NOT NULL,
      growthStage TEXT,
      actionDate TEXT DEFAULT (datetime('now')),
      notes TEXT,
      FOREIGN KEY (fieldId) REFERENCES fields(id) ON DELETE CASCADE
    );
  `)
}

// ============================================================================
// Database Accessors
// ============================================================================

export function getDatabase(): DatabaseAdapter {
  if (!dbAdapter) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return dbAdapter
}

export async function closeDatabase() {
  if (dbAdapter) {
    await dbAdapter.close()
  }
}
