import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { getDbAdapter as createDbAdapter, closeDbAdapter, type DbAdapter } from './db-adapter.js'

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
  currentYear: number
  currentMonth: number
  currentDay: number
  daysPerMonth: number
}

export interface FarmMember {
  id: number
  farmId: number
  userId: number
  role: string
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
  plantedYear: number | null
  plantedMonth: number | null
  plantedDay: number | null
  seedingRate: number | null
  seedCost: number
  fertilizerCost: number
  limeCost: number
  weedingCost: number
  fuelCost: number
  equipmentCost: number
  otherCosts: number
  expectedYield: number | null
  productionRecordId: number | null
  updatedAt: string
}

export interface FieldProductionRecord {
  id: number
  fieldId: number
  farmId: number
  crop: string
  plantedYear: number
  plantedMonth: number
  plantedDay: number
  harvestedYear: number | null
  harvestedMonth: number | null
  harvestedDay: number | null
  seedingRate: number | null
  seedCost: number
  fertilizerCost: number
  limeCost: number
  weedingCost: number
  fuelCost: number
  equipmentCost: number
  otherCosts: number
  totalCosts: number
  yieldAmount: number | null
  sellingPrice: number | null
  revenue: number | null
  profit: number | null
  status: 'planted' | 'growing' | 'harvested' | 'sold'
  notes: string | null
  createdAt: string
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
  gameYear: number
  gameMonth: number
  gameDay: number
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

let db: Database.Database | undefined
let adapter: DbAdapter

export async function initDatabase(dbPath?: string): Promise<void> {
  adapter = createDbAdapter()
  
  // Run migrations
  await runMigrations()
}

async function runMigrations() {
  const usePostgres = process.env.DB_HOST && process.env.DB_USER

  if (usePostgres) {
    // PostgreSQL migrations - quote camelCase columns to preserve case
    await adapter.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS farms (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        "mapName" TEXT NOT NULL,
        currency TEXT DEFAULT 'GBP',
        "createdByUserId" INTEGER NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "currentYear" INTEGER DEFAULT 1,
        "currentMonth" INTEGER DEFAULT 1,
        "currentDay" INTEGER DEFAULT 1,
        "daysPerMonth" INTEGER DEFAULT 28,
        FOREIGN KEY ("createdByUserId") REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS "farmMembers" (
        id SERIAL PRIMARY KEY,
        "farmId" INTEGER NOT NULL,
        "userId" INTEGER NOT NULL,
        role TEXT NOT NULL,
        "joinedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("farmId") REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE("farmId", "userId")
      );

      CREATE TABLE IF NOT EXISTS fields (
        id SERIAL PRIMARY KEY,
        "farmId" INTEGER NOT NULL,
        "fieldNumber" INTEGER NOT NULL,
        name TEXT NOT NULL,
        "sizeHectares" REAL NOT NULL,
        "currentCrop" TEXT,
        "growthStage" TEXT,
        "fertiliserState" TEXT,
        "weedsState" TEXT,
        notes TEXT,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("farmId") REFERENCES farms(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "cropPlans" (
        id SERIAL PRIMARY KEY,
        "fieldId" INTEGER NOT NULL,
        "yearNumber" INTEGER NOT NULL,
        "plannedCrop" TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY ("fieldId") REFERENCES fields(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS animals (
        id SERIAL PRIMARY KEY,
        "farmId" INTEGER NOT NULL,
        type TEXT NOT NULL,
        count INTEGER NOT NULL,
        "feedPerDay" REAL NOT NULL,
        productivity REAL NOT NULL,
        notes TEXT,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("farmId") REFERENCES farms(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS equipment (
        id SERIAL PRIMARY KEY,
        "farmId" INTEGER NOT NULL,
        model TEXT NOT NULL,
        category TEXT NOT NULL,
        brand TEXT NOT NULL,
        owned INTEGER DEFAULT 1,
        leased INTEGER DEFAULT 0,
        "dailyCost" REAL DEFAULT 0,
        condition REAL DEFAULT 100,
        "userId" INTEGER,
        "purchasePrice" REAL DEFAULT 0,
        "purchaseDate" TEXT,
        sold INTEGER DEFAULT 0,
        "salePrice" REAL DEFAULT 0,
        "saleDate" TEXT,
        notes TEXT,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("farmId") REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS finances (
        id SERIAL PRIMARY KEY,
        "farmId" INTEGER NOT NULL,
        "gameYear" INTEGER NOT NULL,
        "gameMonth" INTEGER NOT NULL,
        "gameDay" INTEGER NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        "createdByUserId" INTEGER NOT NULL,
        FOREIGN KEY ("farmId") REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY ("createdByUserId") REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS "joinCodes" (
        id SERIAL PRIMARY KEY,
        "farmId" INTEGER NOT NULL,
        code TEXT UNIQUE NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TEXT NOT NULL,
        FOREIGN KEY ("farmId") REFERENCES farms(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS field_history (
        id SERIAL PRIMARY KEY,
        field_id INTEGER NOT NULL,
        crop TEXT NOT NULL,
        action TEXT NOT NULL,
        growth_stage TEXT,
        notes TEXT,
        FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS field_production_records (
        id SERIAL PRIMARY KEY,
        field_id INTEGER NOT NULL,
        farm_id INTEGER NOT NULL,
        crop TEXT NOT NULL,
        planted_year INTEGER NOT NULL,
        planted_month INTEGER NOT NULL,
        planted_day INTEGER NOT NULL,
        harvested_year INTEGER,
        harvested_month INTEGER,
        harvested_day INTEGER,
        seeding_rate REAL,
        seed_cost REAL DEFAULT 0,
        fertilizer_cost REAL DEFAULT 0,
        lime_cost REAL DEFAULT 0,
        weeding_cost REAL DEFAULT 0,
        fuel_cost REAL DEFAULT 0,
        equipment_cost REAL DEFAULT 0,
        other_costs REAL DEFAULT 0,
        total_costs REAL DEFAULT 0,
        yield_amount REAL,
        selling_price REAL,
        revenue REAL,
        profit REAL,
        status TEXT DEFAULT 'planted',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );
    `)

    // Migration: Add game date columns to existing farms table if they don't exist
    try {
      await adapter.exec(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='farms' AND column_name='currentYear') THEN
            ALTER TABLE farms ADD COLUMN "currentYear" INTEGER DEFAULT 1;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='farms' AND column_name='currentMonth') THEN
            ALTER TABLE farms ADD COLUMN "currentMonth" INTEGER DEFAULT 1;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='farms' AND column_name='currentDay') THEN
            ALTER TABLE farms ADD COLUMN "currentDay" INTEGER DEFAULT 1;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='farms' AND column_name='daysPerMonth') THEN
            ALTER TABLE farms ADD COLUMN "daysPerMonth" INTEGER DEFAULT 28;
          END IF;
        END $$;
      `)
    } catch (error) {
      console.error('Error adding game date columns to farms:', error)
    }

    // Migration: Add game date columns to existing finances table if they don't exist
    try {
      await adapter.exec(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='finances' AND column_name='gameYear') THEN
            ALTER TABLE finances ADD COLUMN "gameYear" INTEGER DEFAULT 1;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='finances' AND column_name='gameMonth') THEN
            ALTER TABLE finances ADD COLUMN "gameMonth" INTEGER DEFAULT 1;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='finances' AND column_name='gameDay') THEN
            ALTER TABLE finances ADD COLUMN "gameDay" INTEGER DEFAULT 1;
          END IF;
        END $$;
      `)
    } catch (error) {
      console.error('Error adding game date columns to finances:', error)
    }

    // Migration: Add game date columns to existing field_history table if they don't exist
    try {
      await adapter.exec(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='field_history' AND column_name='game_year') THEN
            ALTER TABLE field_history ADD COLUMN game_year INTEGER DEFAULT 1;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='field_history' AND column_name='game_month') THEN
            ALTER TABLE field_history ADD COLUMN game_month INTEGER DEFAULT 1;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='field_history' AND column_name='game_day') THEN
            ALTER TABLE field_history ADD COLUMN game_day INTEGER DEFAULT 1;
          END IF;
        END $$;
      `)
    } catch (error) {
      console.error('Error adding game date columns to field_history:', error)
    }

    // Create indexes AFTER ensuring columns exist
    try {
      await adapter.exec(`
        CREATE INDEX IF NOT EXISTS idx_field_history_field ON field_history(field_id);
        CREATE INDEX IF NOT EXISTS idx_field_history_date ON field_history(game_year, game_month, game_day);
        CREATE INDEX IF NOT EXISTS idx_field_production_records_field ON field_production_records(field_id);
        CREATE INDEX IF NOT EXISTS idx_field_production_records_farm ON field_production_records(farm_id);
        CREATE INDEX IF NOT EXISTS idx_field_production_records_status ON field_production_records(status);
      `)
    } catch (error) {
      console.error('Error creating indexes:', error)
    }

    // Migration: Add production tracking columns to fields table
    try {
      await adapter.exec(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='planted_year') THEN
            ALTER TABLE fields ADD COLUMN planted_year INTEGER;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='planted_month') THEN
            ALTER TABLE fields ADD COLUMN planted_month INTEGER;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='planted_day') THEN
            ALTER TABLE fields ADD COLUMN planted_day INTEGER;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='seeding_rate') THEN
            ALTER TABLE fields ADD COLUMN seeding_rate REAL;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='seed_cost') THEN
            ALTER TABLE fields ADD COLUMN seed_cost REAL DEFAULT 0;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='fertilizer_cost') THEN
            ALTER TABLE fields ADD COLUMN fertilizer_cost REAL DEFAULT 0;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='lime_cost') THEN
            ALTER TABLE fields ADD COLUMN lime_cost REAL DEFAULT 0;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='weeding_cost') THEN
            ALTER TABLE fields ADD COLUMN weeding_cost REAL DEFAULT 0;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='fuel_cost') THEN
            ALTER TABLE fields ADD COLUMN fuel_cost REAL DEFAULT 0;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='equipment_cost') THEN
            ALTER TABLE fields ADD COLUMN equipment_cost REAL DEFAULT 0;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='other_costs') THEN
            ALTER TABLE fields ADD COLUMN other_costs REAL DEFAULT 0;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='expected_yield') THEN
            ALTER TABLE fields ADD COLUMN expected_yield REAL;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='actual_yield') THEN
            ALTER TABLE fields ADD COLUMN actual_yield REAL;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='fields' AND column_name='production_record_id') THEN
            ALTER TABLE fields ADD COLUMN production_record_id INTEGER;
          END IF;
        END $$;
      `)
    } catch (error) {
      console.error('Error adding production tracking columns to fields:', error)
    }
  } else {
    // SQLite migrations (original code)
    await adapter.exec(`
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
        currentYear INTEGER DEFAULT 1,
        currentMonth INTEGER DEFAULT 1,
        currentDay INTEGER DEFAULT 1,
        daysPerMonth INTEGER DEFAULT 28,
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
        plantedYear INTEGER,
        plantedMonth INTEGER,
        plantedDay INTEGER,
        seedingRate REAL,
        seedCost REAL DEFAULT 0,
        fertilizerCost REAL DEFAULT 0,
        limeCost REAL DEFAULT 0,
        weedingCost REAL DEFAULT 0,
        fuelCost REAL DEFAULT 0,
        equipmentCost REAL DEFAULT 0,
        otherCosts REAL DEFAULT 0,
        expectedYield REAL,
        actualYield REAL,
        productionRecordId INTEGER,
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
        gameYear INTEGER NOT NULL,
        gameMonth INTEGER NOT NULL,
        gameDay INTEGER NOT NULL,
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
        gameYear INTEGER NOT NULL,
        gameMonth INTEGER NOT NULL,
        gameDay INTEGER NOT NULL,
        notes TEXT,
        FOREIGN KEY (fieldId) REFERENCES fields(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS fieldProductionRecords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fieldId INTEGER NOT NULL,
        farmId INTEGER NOT NULL,
        crop TEXT NOT NULL,
        plantedYear INTEGER NOT NULL,
        plantedMonth INTEGER NOT NULL,
        plantedDay INTEGER NOT NULL,
        harvestedYear INTEGER,
        harvestedMonth INTEGER,
        harvestedDay INTEGER,
        seedingRate REAL,
        seedCost REAL DEFAULT 0,
        fertilizerCost REAL DEFAULT 0,
        limeCost REAL DEFAULT 0,
        weedingCost REAL DEFAULT 0,
        fuelCost REAL DEFAULT 0,
        equipmentCost REAL DEFAULT 0,
        otherCosts REAL DEFAULT 0,
        totalCosts REAL DEFAULT 0,
        yieldAmount REAL,
        sellingPrice REAL,
        revenue REAL,
        profit REAL,
        status TEXT DEFAULT 'planted',
        notes TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fieldId) REFERENCES fields(id) ON DELETE CASCADE,
        FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_fieldHistory_field ON fieldHistory(fieldId);
      CREATE INDEX IF NOT EXISTS idx_fieldHistory_date ON fieldHistory(gameYear, gameMonth, gameDay);
      CREATE INDEX IF NOT EXISTS idx_fieldProductionRecords_field ON fieldProductionRecords(fieldId);
      CREATE INDEX IF NOT EXISTS idx_fieldProductionRecords_farm ON fieldProductionRecords(farmId);
      CREATE INDEX IF NOT EXISTS idx_fieldProductionRecords_status ON fieldProductionRecords(status);
    `)
  }
}

export function getDbAdapter(): DbAdapter {
  return adapter
}

export async function closeDatabase() {
  await closeDbAdapter()
}
