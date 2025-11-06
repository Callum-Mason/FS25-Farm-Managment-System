import express, { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { verifyFarmMembership } from '../middleware/farmAccess.js'
import { getDbAdapter, Equipment } from '../database.js'
import { prepareSql, isPostgres } from '../db-adapter.js'

const router = express.Router()

// GET /api/farms/:farmId/equipment
router.get('/:farmId/equipment', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    const equipment = await db.query<Equipment>(
      prepareSql(`
        SELECT e.*, u.name as "ownerName" 
        FROM equipment e
        LEFT JOIN users u ON e."userId" = u.id
        WHERE e."farmId" = ? 
        ORDER BY e.category, e.brand, e.model
      `, usePostgres),
      [farmId]
    )

    res.json(equipment)
  } catch (error) {
    console.error('Get equipment error:', error)
    res.status(500).json({ error: 'Failed to fetch equipment' })
  }
})

// GET /api/farms/:farmId/equipment/brands - Get unique brands used in farm
router.get('/:farmId/equipment/brands', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    const brands = await db.query<{ brand: string }>(
      prepareSql('SELECT DISTINCT brand FROM equipment WHERE "farmId" = ? ORDER BY brand', usePostgres),
      [farmId]
    )

    res.json(brands.map(b => b.brand))
  } catch (error) {
    console.error('Get brands error:', error)
    res.status(500).json({ error: 'Failed to fetch brands' })
  }
})

// POST /api/farms/:farmId/equipment
router.post('/:farmId/equipment', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  const db = getDbAdapter()
  const usePostgres = isPostgres()
  
  try {
    const { farmId } = req.params
    const role = req.body._userRole

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot add equipment' })
    }

    const { model, category, brand, owned, leased, dailyCost, condition, userId, purchasePrice, purchaseDate, notes } = req.body

    if (!model || !category || !brand) {
      return res.status(400).json({ error: 'Model, category, and brand are required' })
    }

    // Insert equipment
    let equipmentId: number

    if (usePostgres) {
      const result = await db.query<{ id: number }>(
        prepareSql(`
          INSERT INTO equipment ("farmId", model, category, brand, owned, leased, "dailyCost", condition, "userId", "purchasePrice", "purchaseDate", notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id
        `, usePostgres),
        [
          farmId,
          model,
          category,
          brand,
          owned !== undefined ? (owned ? 1 : 0) : 1,
          leased !== undefined ? (leased ? 1 : 0) : 0,
          dailyCost || 0,
          condition || 100,
          userId || null,
          purchasePrice || 0,
          purchaseDate || null,
          notes || null
        ]
      )
      equipmentId = result[0].id
    } else {
      const result = await db.run(
        prepareSql(`
          INSERT INTO equipment ("farmId", model, category, brand, owned, leased, "dailyCost", condition, "userId", "purchasePrice", "purchaseDate", notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, usePostgres),
        [
          farmId,
          model,
          category,
          brand,
          owned !== undefined ? (owned ? 1 : 0) : 1,
          leased !== undefined ? (leased ? 1 : 0) : 0,
          dailyCost || 0,
          condition || 100,
          userId || null,
          purchasePrice || 0,
          purchaseDate || null,
          notes || null
        ]
      )
      equipmentId = result.lastID!
    }

    // If purchase price is provided, create a finance entry
    if (purchasePrice && purchasePrice > 0) {
      const financeDate = purchaseDate || new Date().toISOString().split('T')[0]
      await db.run(
        prepareSql(`
          INSERT INTO finances ("farmId", date, type, category, description, amount, "createdByUserId")
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, usePostgres),
        [
          farmId,
          financeDate,
          'expense',
          'Equipment Purchase',
          `Purchased ${brand} ${model}`,
          purchasePrice,
          req.userId
        ]
      )
    }

    const equipmentItem = await db.queryOne<Equipment>(
      prepareSql(`
        SELECT e.*, u.name as "ownerName" 
        FROM equipment e
        LEFT JOIN users u ON e."userId" = u.id
        WHERE e.id = ?
      `, usePostgres),
      [equipmentId]
    )
    
    res.status(201).json(equipmentItem)
  } catch (error) {
    console.error('Create equipment error:', error)
    res.status(500).json({ error: 'Failed to create equipment entry' })
  }
})

// PATCH /api/equipment/:id - Update equipment
router.patch('/equipment/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const role = req.body._userRole

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot update equipment' })
    }

    const { model, category, brand, owned, leased, dailyCost, condition, userId, purchasePrice, purchaseDate, sold, salePrice, saleDate, notes } = req.body
    const db = getDbAdapter()
    const usePostgres = isPostgres()

    const updates: string[] = []
    const values: any[] = []

    if (model !== undefined) {
      updates.push('model = ?')
      values.push(model)
    }
    if (category !== undefined) {
      updates.push('category = ?')
      values.push(category)
    }
    if (brand !== undefined) {
      updates.push('brand = ?')
      values.push(brand)
    }
    if (owned !== undefined) {
      updates.push('owned = ?')
      values.push(owned ? 1 : 0)
    }
    if (leased !== undefined) {
      updates.push('leased = ?')
      values.push(leased ? 1 : 0)
    }
    if (dailyCost !== undefined) {
      updates.push('"dailyCost" = ?')
      values.push(dailyCost)
    }
    if (condition !== undefined) {
      updates.push('condition = ?')
      values.push(condition)
    }
    if (userId !== undefined) {
      updates.push('"userId" = ?')
      values.push(userId)
    }
    if (purchasePrice !== undefined) {
      updates.push('"purchasePrice" = ?')
      values.push(purchasePrice)
    }
    if (purchaseDate !== undefined) {
      updates.push('"purchaseDate" = ?')
      values.push(purchaseDate)
    }
    if (sold !== undefined) {
      updates.push('sold = ?')
      values.push(sold ? 1 : 0)
    }
    if (salePrice !== undefined) {
      updates.push('"salePrice" = ?')
      values.push(salePrice)
    }
    if (saleDate !== undefined) {
      updates.push('"saleDate" = ?')
      values.push(saleDate)
    }
    if (notes !== undefined) {
      updates.push('notes = ?')
      values.push(notes)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' })
    }

    updates.push('"updatedAt" = CURRENT_TIMESTAMP')
    values.push(id)

    await db.run(
      prepareSql(`UPDATE equipment SET ${updates.join(', ')} WHERE id = ?`, usePostgres),
      values
    )

    const equipmentItem = await db.queryOne<Equipment>(
      prepareSql(`
        SELECT e.*, u.name as "ownerName" 
        FROM equipment e
        LEFT JOIN users u ON e."userId" = u.id
        WHERE e.id = ?
      `, usePostgres),
      [id]
    )
    
    res.json(equipmentItem)
  } catch (error) {
    console.error('Update equipment error:', error)
    res.status(500).json({ error: 'Failed to update equipment' })
  }
})

// POST /api/equipment/:id/sell - Mark equipment as sold and create finance entry
router.post('/equipment/:id/sell', authenticateToken, async (req: AuthRequest, res: Response) => {
  const db = getDbAdapter()
  const usePostgres = isPostgres()
  
  try {
    const { id } = req.params
    const role = req.body._userRole

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot sell equipment' })
    }

    const { salePrice, saleDate } = req.body

    if (!salePrice || salePrice <= 0) {
      return res.status(400).json({ error: 'Sale price is required and must be positive' })
    }
    
    // Get equipment details for finance entry
    const equipment = await db.queryOne<Equipment>(
      prepareSql('SELECT * FROM equipment WHERE id = ?', usePostgres),
      [id]
    )
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' })
    }

    const financeDate = saleDate || new Date().toISOString().split('T')[0]
    
    // Mark as sold
    await db.run(
      prepareSql(`
        UPDATE equipment 
        SET sold = 1, "salePrice" = ?, "saleDate" = ?, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ?
      `, usePostgres),
      [salePrice, financeDate, id]
    )

    // Create finance entry for the sale (positive income)
    await db.run(
      prepareSql(`
        INSERT INTO finances ("farmId", date, type, category, description, amount, "createdByUserId")
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, usePostgres),
      [
        equipment.farmId,
        financeDate,
        'income',
        'Equipment Sale',
        `Sold ${equipment.brand} ${equipment.model}`,
        salePrice,
        req.userId
      ]
    )

    const updatedEquipment = await db.queryOne<Equipment>(
      prepareSql(`
        SELECT e.*, u.name as "ownerName" 
        FROM equipment e
        LEFT JOIN users u ON e."userId" = u.id
        WHERE e.id = ?
      `, usePostgres),
      [id]
    )
    
    res.json(updatedEquipment)
  } catch (error) {
    console.error('Sell equipment error:', error)
    res.status(500).json({ error: 'Failed to sell equipment' })
  }
})

export default router
