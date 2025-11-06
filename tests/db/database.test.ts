import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'

describe('Database Logic', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    
    // Create fields table
    db.exec(`
      CREATE TABLE fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmId INTEGER NOT NULL,
        fieldNumber INTEGER NOT NULL,
        name TEXT NOT NULL,
        sizeHectares REAL NOT NULL,
        currentCrop TEXT
      )
    `)

    // Create finances table
    db.exec(`
      CREATE TABLE finances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmId INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL
      )
    `)
  })

  afterEach(() => {
    db.close()
  })

  it('should create multiple fields with same farmId', () => {
    const farmId = 1

    db.prepare(`
      INSERT INTO fields (farmId, fieldNumber, name, sizeHectares, currentCrop)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmId, 1, 'Field One', 10, 'Wheat')

    db.prepare(`
      INSERT INTO fields (farmId, fieldNumber, name, sizeHectares, currentCrop)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmId, 2, 'Field Two', 15, 'Barley')

    const fields = db.prepare('SELECT * FROM fields WHERE farmId = ?').all(farmId)
    
    expect(fields).toHaveLength(2)
    expect(fields[0].name).toBe('Field One')
    expect(fields[1].name).toBe('Field Two')
  })

  it('should calculate correct balance from income and expenses', () => {
    const farmId = 1

    // Add income
    db.prepare(`
      INSERT INTO finances (farmId, type, amount) VALUES (?, 'income', ?)
    `).run(farmId, 1000)

    db.prepare(`
      INSERT INTO finances (farmId, type, amount) VALUES (?, 'income', ?)
    `).run(farmId, 500)

    // Add expenses
    db.prepare(`
      INSERT INTO finances (farmId, type, amount) VALUES (?, 'expense', ?)
    `).run(farmId, 300)

    db.prepare(`
      INSERT INTO finances (farmId, type, amount) VALUES (?, 'expense', ?)
    `).run(farmId, 200)

    // Calculate balance
    const finances = db.prepare('SELECT type, amount FROM finances WHERE farmId = ?').all(farmId) as Array<{ type: string; amount: number }>
    
    const balance = finances.reduce((acc, entry) => {
      return entry.type === 'income' ? acc + entry.amount : acc - entry.amount
    }, 0)

    expect(balance).toBe(1000) // 1500 income - 500 expenses
  })

  it('should handle zero balance correctly', () => {
    const farmId = 1

    db.prepare(`
      INSERT INTO finances (farmId, type, amount) VALUES (?, 'income', ?)
    `).run(farmId, 500)

    db.prepare(`
      INSERT INTO finances (farmId, type, amount) VALUES (?, 'expense', ?)
    `).run(farmId, 500)

    const finances = db.prepare('SELECT type, amount FROM finances WHERE farmId = ?').all(farmId) as Array<{ type: string; amount: number }>
    
    const balance = finances.reduce((acc, entry) => {
      return entry.type === 'income' ? acc + entry.amount : acc - entry.amount
    }, 0)

    expect(balance).toBe(0)
  })
})
