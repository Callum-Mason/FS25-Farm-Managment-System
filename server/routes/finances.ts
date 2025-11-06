import express, { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { verifyFarmMembership } from '../middleware/farmAccess.js'
import { getDbAdapter, Finance } from '../database.js'
import { prepareSql, isPostgres } from '../db-adapter.js'

const router = express.Router()

// GET /api/farms/:farmId/finances
router.get('/:farmId/finances', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    const finances = await db.query<Finance & { createdByName: string }>(
      prepareSql(`
        SELECT f.*, u.name as "createdByName" 
        FROM finances f
        LEFT JOIN users u ON f."createdByUserId" = u.id
        WHERE f."farmId" = ? 
        ORDER BY f."gameYear" DESC, f."gameMonth" DESC, f."gameDay" DESC
      `, usePostgres),
      [farmId]
    )

    // Calculate balance
    const balance = finances.reduce((acc, entry) => {
      return entry.type === 'income' ? acc + entry.amount : acc - entry.amount
    }, 0)

    res.json({ finances, balance })
  } catch (error) {
    console.error('Get finances error:', error)
    res.status(500).json({ error: 'Failed to fetch finances' })
  }
})

// POST /api/farms/:farmId/finances
router.post('/:farmId/finances', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const role = req.body._userRole

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot add finance entries' })
    }

    const { type, category, description, amount } = req.body

    if (!type || !category || !description || amount === undefined) {
      return res.status(400).json({ error: 'Type, category, description, and amount are required' })
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "income" or "expense"' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()

    // Get farm's current game date
    const farm = await db.queryOne<{ currentYear: number; currentMonth: number; currentDay: number }>(
      prepareSql('SELECT "currentYear", "currentMonth", "currentDay" FROM farms WHERE id = ?', usePostgres),
      [farmId]
    )

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' })
    }

    let finance: Finance | undefined

    if (usePostgres) {
      // Postgres schemas may include a NOT NULL "date" column in finances — provide a date value
      const result = await db.query<Finance>(
        prepareSql(`
          INSERT INTO finances ("farmId", date, "gameYear", "gameMonth", "gameDay", type, category, description, amount, "createdByUserId")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `, usePostgres),
        [farmId, new Date().toISOString().slice(0, 10), farm.currentYear, farm.currentMonth, farm.currentDay, type, category, description, amount, req.userId]
      )
      finance = result[0]
    } else {
      const result = await db.run(
        prepareSql(`
          INSERT INTO finances ("farmId", "gameYear", "gameMonth", "gameDay", type, category, description, amount, "createdByUserId")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, usePostgres),
        [farmId, farm.currentYear, farm.currentMonth, farm.currentDay, type, category, description, amount, req.userId]
      )
      finance = await db.queryOne<Finance>(
        prepareSql('SELECT * FROM finances WHERE id = ?', usePostgres),
        [result.lastID]
      )
    }
    
    res.status(201).json(finance)
  } catch (error) {
    console.error('Create finance error:', error)
    res.status(500).json({ error: 'Failed to create finance entry' })
  }
})

export default router
