// ============================================================================
// PostgreSQL Database Adapter
// ============================================================================
// Adapter for PostgreSQL using pg library

import pg from 'pg'
import type { DatabaseAdapter } from './config.js'

const { Pool } = pg

let pool: pg.Pool

export async function createPostgresAdapter(): Promise<DatabaseAdapter> {
  // Connection configuration from environment variables
  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }

  pool = new Pool(config)

  // Test connection
  try {
    const client = await pool.connect()
    console.log('✅ PostgreSQL connection established')
    client.release()
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error)
    throw error
  }

  return {
    async query(sql: string, params?: any[]): Promise<any[]> {
      const result = await pool.query(sql, params)
      return result.rows
    },

    async get(sql: string, params?: any[]): Promise<any> {
      const result = await pool.query(sql, params)
      return result.rows[0] || null
    },

    async run(sql: string, params?: any[]): Promise<{ lastInsertRowid: number; changes: number }> {
      const result = await pool.query(sql, params)
      return {
        lastInsertRowid: result.rows[0]?.id || 0,
        changes: result.rowCount || 0,
      }
    },

    async exec(sql: string): Promise<void> {
      await pool.query(sql)
    },

    async close(): Promise<void> {
      await pool.end()
    },
  }
}

// Helper function to convert camelCase to snake_case for PostgreSQL queries
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

// Helper function to convert snake_case to camelCase for JavaScript objects
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// Convert object keys from snake_case to camelCase
export function rowToCamelCase(row: any): any {
  if (!row) return row
  const result: any = {}
  for (const key in row) {
    result[toCamelCase(key)] = row[key]
  }
  return result
}

// Convert object keys from camelCase to snake_case
export function rowToSnakeCase(obj: any): any {
  if (!obj) return obj
  const result: any = {}
  for (const key in obj) {
    result[toSnakeCase(key)] = obj[key]
  }
  return result
}
