import Database from 'better-sqlite3'
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

let db: Database.Database

export function initDatabase(dbPath?: string): Database.Database {
  const dbFile = dbPath || process.env.DB_FILE || './data/farm_manager.db'
  const dataDir = dirname(join(process.cwd(), dbFile))
  
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  db = new Database(dbFile)
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000') // Wait up to 5 seconds when database is locked
  
  runMigrations()
  
  return db
}

function runMigrations() {
  db.exec(`
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
  `)

  // Add joinedAt column to farmMembers if it doesn't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(farmMembers)").all() as any[]
    const hasJoinedAt = tableInfo.some(col => col.name === 'joinedAt')
    
    if (!hasJoinedAt) {
      // SQLite doesn't allow CURRENT_TIMESTAMP in ALTER TABLE, so we use a fixed value
      const now = new Date().toISOString()
      db.exec(`ALTER TABLE farmMembers ADD COLUMN joinedAt TEXT DEFAULT '${now}'`)
      // Update existing rows to have the current timestamp
      db.exec(`UPDATE farmMembers SET joinedAt = '${now}' WHERE joinedAt IS NULL`)
      console.log('Added joinedAt column to farmMembers table')
    }
  } catch (error) {
    console.error('Migration error:', error)
  }

  // Migrate equipment table: rename 'name' to 'model' and add 'userId', 'purchasePrice', 'purchaseDate', 'sold', 'salePrice', 'saleDate'
  try {
    const equipmentInfo = db.prepare("PRAGMA table_info(equipment)").all() as any[]
    const hasModel = equipmentInfo.some(col => col.name === 'model')
    const hasUserId = equipmentInfo.some(col => col.name === 'userId')
    const hasPurchasePrice = equipmentInfo.some(col => col.name === 'purchasePrice')
    const hasSold = equipmentInfo.some(col => col.name === 'sold')
    
    if (!hasModel || !hasUserId || !hasPurchasePrice || !hasSold) {
      console.log('Migrating equipment table...')
      // Create new table with correct schema
      db.exec(`
        CREATE TABLE IF NOT EXISTS equipment_new (
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
        )
      `)
      
      // Copy data from old table
      const hasName = equipmentInfo.some(col => col.name === 'name')
      if (hasName) {
        // If old schema has 'name', rename it to 'model'
        db.exec(`
          INSERT INTO equipment_new (id, farmId, model, category, brand, owned, leased, dailyCost, condition, userId, notes, updatedAt)
          SELECT id, farmId, name, category, brand, owned, leased, dailyCost, condition, 
                 ${hasUserId ? 'userId' : 'NULL'}, notes, updatedAt 
          FROM equipment
        `)
      } else {
        // If already has 'model', just copy and add missing columns
        db.exec(`
          INSERT INTO equipment_new (id, farmId, model, category, brand, owned, leased, dailyCost, condition, userId, notes, updatedAt)
          SELECT id, farmId, model, category, brand, owned, leased, dailyCost, condition, 
                 ${hasUserId ? 'userId' : 'NULL'}, notes, updatedAt 
          FROM equipment
        `)
      }
      
      // Drop old table and rename new one
      db.exec(`DROP TABLE equipment`)
      db.exec(`ALTER TABLE equipment_new RENAME TO equipment`)
      
      console.log('Equipment table migrated successfully')
    }
  } catch (error) {
    console.error('Equipment migration error:', error)
  }
}

export function getDatabase(): Database.Database {
  return db
}

export function closeDatabase() {
  if (db) {
    db.close()
  }
}
