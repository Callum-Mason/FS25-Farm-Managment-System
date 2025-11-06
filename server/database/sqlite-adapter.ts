// ============================================================================
// SQLite Database Adapter
// ============================================================================
// Adapter for SQLite using better-sqlite3 library

import Database from 'better-sqlite3'
import { dirname, join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import type { DatabaseAdapter } from './config.js'

let db: Database.Database

export async function createSqliteAdapter(dbPath?: string): Promise<DatabaseAdapter> {
  const dbFile = dbPath || process.env.DB_FILE || './data/farm_manager.db'
  const dataDir = dirname(join(process.cwd(), dbFile))

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  db = new Database(dbFile)
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000')

  console.log('✅ SQLite database initialized')

  return {
    async query(sql: string, params?: any[]): Promise<any[]> {
      const stmt = db.prepare(sql)
      return stmt.all(params || []) as any[]
    },

    async get(sql: string, params?: any[]): Promise<any> {
      const stmt = db.prepare(sql)
      return stmt.get(params || []) as any
    },

    async run(sql: string, params?: any[]): Promise<{ lastInsertRowid: number; changes: number }> {
      const stmt = db.prepare(sql)
      const result = stmt.run(params || [])
      return {
        lastInsertRowid: Number(result.lastInsertRowid),
        changes: result.changes,
      }
    },

    async exec(sql: string): Promise<void> {
      db.exec(sql)
    },

    async close(): Promise<void> {
      db.close()
    },
  }
}
