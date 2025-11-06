import express, { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { verifyFarmMembership } from '../middleware/farmAccess.js'
import { getDbAdapter, Animal } from '../database.js'
import { prepareSql, isPostgres } from '../db-adapter.js'

const router = express.Router()

// GET /api/farms/:farmId/animals
router.get('/:farmId/animals', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    const animals = await db.query<Animal>(
      prepareSql('SELECT * FROM animals WHERE "farmId" = ? ORDER BY type', usePostgres),
      [farmId]
    )

    res.json(animals)
  } catch (error) {
    console.error('Get animals error:', error)
    res.status(500).json({ error: 'Failed to fetch animals' })
  }
})

// POST /api/farms/:farmId/animals
router.post('/:farmId/animals', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const role = req.body._userRole

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot add animals' })
    }

    const { type, count, feedPerDay, productivity, notes } = req.body

    if (!type || count === undefined || feedPerDay === undefined || productivity === undefined) {
      return res.status(400).json({ error: 'Type, count, feed per day, and productivity are required' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    let animal: Animal
    
    if (usePostgres) {
      animal = (await db.queryOne<Animal>(
        prepareSql('INSERT INTO animals ("farmId", type, count, "feedPerDay", productivity, notes) VALUES (?, ?, ?, ?, ?, ?) RETURNING *', usePostgres),
        [farmId, type, count, feedPerDay, productivity, notes || null]
      ))!
    } else {
      const result = await db.run(
        'INSERT INTO animals ("farmId", type, count, "feedPerDay", productivity, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [farmId, type, count, feedPerDay, productivity, notes || null]
      )
      animal = (await db.queryOne<Animal>('SELECT * FROM animals WHERE id = ?', [result.lastID]))!
    }
    
    res.status(201).json(animal)
  } catch (error) {
    console.error('Create animal error:', error)
    res.status(500).json({ error: 'Failed to create animal entry' })
  }
})

export default router
