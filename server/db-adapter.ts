import pg from 'pg'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

const { Pool } = pg

// Database adapter interface
export interface DbAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined>
  run(sql: string, params?: any[]): Promise<{ lastID?: number; changes?: number }>
  exec(sql: string): Promise<void>
  close(): Promise<void>
}

// PostgreSQL adapter
class PostgresAdapter implements DbAdapter {
  private pool: pg.Pool

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_HOST?.includes('postgres.database.azure.com') 
        ? { rejectUnauthorized: false }
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })

    // Test connection
    this.pool.query('SELECT NOW()').then(() => {
      console.log('✓ PostgreSQL connected successfully')
    }).catch(err => {
      console.error('✗ PostgreSQL connection failed:', err.message)
    })
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.pool.query(sql, params)
    return result.rows as T[]
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const result = await this.pool.query(sql, params)
    return result.rows[0] as T | undefined
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    const result = await this.pool.query(sql, params)
    return {
      lastID: result.rows[0]?.id,
      changes: result.rowCount || 0
    }
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql)
  }

  async close(): Promise<void> {
    await this.pool.end()
  }
}

// SQLite adapter (wraps better-sqlite3 to match async interface)
class SQLiteAdapter implements DbAdapter {
  private db: Database.Database

  constructor(dbPath?: string) {
    const defaultPath = './data/farm_manager.db'
    const dbFile = dbPath || process.env.DB_FILE || defaultPath
    const dataDir = dirname(join(process.cwd(), dbFile))
    
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }

    this.db = new Database(dbFile)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('busy_timeout = 5000')
    console.log('✓ SQLite connected successfully')
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql)
    return stmt.all(...params) as T[]
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const stmt = this.db.prepare(sql)
    return stmt.get(...params) as T | undefined
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    const stmt = this.db.prepare(sql)
    const info = stmt.run(...params)
    return {
      lastID: Number(info.lastInsertRowid),
      changes: info.changes
    }
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql)
  }

  async close(): Promise<void> {
    this.db.close()
  }
}

// Factory function to create the appropriate adapter
export function createDbAdapter(): DbAdapter {
  const usePostgres = process.env.DB_HOST && 
                      process.env.DB_USER && 
                      process.env.DB_PASSWORD &&
                      process.env.DB_NAME

  if (usePostgres) {
    console.log('Using PostgreSQL database')
    return new PostgresAdapter()
  } else {
    console.log('Using SQLite database')
    return new SQLiteAdapter()
  }
}

let dbAdapter: DbAdapter

export function getDbAdapter(): DbAdapter {
  if (!dbAdapter) {
    dbAdapter = createDbAdapter()
  }
  return dbAdapter
}

export async function closeDbAdapter(): Promise<void> {
  if (dbAdapter) {
    await dbAdapter.close()
  }
}

// Helper function to convert SQL with ? placeholders to $1, $2 for PostgreSQL
export function prepareSql(sql: string, usePostgres: boolean): string {
  if (!usePostgres) return sql
  
  let index = 1
  return sql.replace(/\?/g, () => `$${index++}`)
}

// Check if we're using PostgreSQL
export function isPostgres(): boolean {
  return !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD)
}
