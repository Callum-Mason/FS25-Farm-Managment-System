import express, { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { verifyFarmMembership } from '../middleware/farmAccess.js'
import { getDbAdapter } from '../database.js'
import { prepareSql, isPostgres } from '../db-adapter.js'

const router = express.Router()

export interface CropStorage {
  id: number
  farmId: number
  cropName: string
  quantityStored: number
  storageLocation: string | null
  lastUpdated: string
  notes: string | null
}

// GET /api/farms/:farmId/storage - Get all crop storage
router.get('/:farmId/storage', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()

    console.log(`📦 GET /farms/${farmId}/storage - Request received`)

    const storage = await db.query<any>(
      prepareSql(`
        SELECT * FROM crop_storage
        WHERE "farmId" = ?
        ORDER BY crop_name
      `, usePostgres),
      [farmId]
    )

    console.log(`📦 Storage records found: ${storage.length}`, storage)

    // Convert snake_case to camelCase
    const converted = storage.map((item: any) => ({
      id: item.id,
      farmId: item.farmId,
      cropName: item.crop_name,
      quantityStored: item.quantity_stored,
      storageLocation: item.storage_location,
      lastUpdated: item.last_updated,
      notes: item.notes
    }))

    console.log(`📦 Converted response: ${converted.length} items`, converted)
    res.json(converted)
  } catch (error) {
    console.error('Get storage error:', error)
    res.status(500).json({ error: 'Failed to fetch storage' })
  }
})

// POST /api/farms/:farmId/storage - Add or update crop storage
router.post('/:farmId/storage', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const role = req.body._userRole

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot modify storage' })
    }

    const { cropName, quantityStored, storageLocation, notes } = req.body

    if (!cropName || quantityStored === undefined) {
      return res.status(400).json({ error: 'Crop name and quantity are required' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()

    // Check if storage already exists for this crop
    const existing = await db.queryOne<any>(
      prepareSql(`
        SELECT id FROM crop_storage
        WHERE "farmId" = ? AND crop_name = ?
      `, usePostgres),
      [farmId, cropName]
    )

    let storageItem
    if (existing) {
      // Update existing
      await db.run(
        prepareSql(`
          UPDATE crop_storage
          SET quantity_stored = ?, storage_location = ?, notes = ?, last_updated = CURRENT_TIMESTAMP
          WHERE id = ?
        `, usePostgres),
        [quantityStored, storageLocation || null, notes || null, existing.id]
      )
      storageItem = await db.queryOne<any>(
        prepareSql('SELECT * FROM crop_storage WHERE id = ?', usePostgres),
        [existing.id]
      )
    } else {
      // Create new
      if (usePostgres) {
        const result = await db.query<any>(
          prepareSql(`
            INSERT INTO crop_storage ("farmId", crop_name, quantity_stored, storage_location, notes)
            VALUES (?, ?, ?, ?, ?)
            RETURNING *
          `, usePostgres),
          [farmId, cropName, quantityStored, storageLocation || null, notes || null]
        )
        storageItem = result[0]
      } else {
        const result = await db.run(
          prepareSql(`
            INSERT INTO crop_storage ("farmId", crop_name, quantity_stored, storage_location, notes)
            VALUES (?, ?, ?, ?, ?)
          `, usePostgres),
          [farmId, cropName, quantityStored, storageLocation || null, notes || null]
        )
        storageItem = await db.queryOne<any>(
          prepareSql('SELECT * FROM crop_storage WHERE id = ?', usePostgres),
          [result.lastID]
        )
      }
    }

    // Convert snake_case to camelCase
    const converted = {
      id: storageItem.id,
      farmId: storageItem.farmId,
      cropName: storageItem.crop_name,
      quantityStored: storageItem.quantity_stored,
      storageLocation: storageItem.storage_location,
      lastUpdated: storageItem.last_updated,
      notes: storageItem.notes
    }

    res.status(201).json(converted)
  } catch (error) {
    console.error('Add/update storage error:', error)
    res.status(500).json({ error: 'Failed to save storage' })
  }
})

// PATCH /api/farms/:farmId/storage/:cropName - Sell from storage (decrease quantity)
router.patch('/:farmId/storage/:cropName', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId, cropName } = req.params
    const role = req.body._userRole
    const { quantityToSell, salePrice } = req.body

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot sell crops' })
    }

    if (quantityToSell === undefined || quantityToSell <= 0) {
      return res.status(400).json({ error: 'Sale quantity must be greater than 0' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()

    // Get current storage
    const storage = await db.queryOne<any>(
      prepareSql(`
        SELECT * FROM crop_storage
        WHERE "farmId" = ? AND crop_name = ?
      `, usePostgres),
      [farmId, cropName]
    )

    if (!storage) {
      return res.status(404).json({ error: 'No storage found for this crop' })
    }

    const currentQuantity = storage.quantity_stored
    if (quantityToSell > currentQuantity) {
      return res.status(400).json({ 
        error: `Cannot sell ${quantityToSell}L - only ${currentQuantity}L in storage` 
      })
    }

    // Update storage (decrease quantity)
    const newQuantity = currentQuantity - quantityToSell
    await db.run(
      prepareSql(`
        UPDATE crop_storage
        SET quantity_stored = ?, last_updated = CURRENT_TIMESTAMP
        WHERE id = ?
      `, usePostgres),
      [newQuantity, storage.id]
    )

    // Create finance entry if sale price provided
    if (salePrice && salePrice > 0) {
      const totalSaleAmount = quantityToSell * salePrice
      
      // Get farm's current game date
      const farm = await db.queryOne<{ currentYear: number; currentMonth: number; currentDay: number }>(
        prepareSql('SELECT "currentYear", "currentMonth", "currentDay" FROM farms WHERE id = ?', usePostgres),
        [farmId]
      )

      if (farm) {
        await db.run(
          prepareSql(`
            INSERT INTO finances ("farmId", "gameYear", "gameMonth", "gameDay", type, category, description, amount, "createdByUserId")
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, usePostgres),
          [
            farmId,
            farm.currentYear,
            farm.currentMonth,
            farm.currentDay,
            'income',
            'Crop Sales',
            `Sold ${quantityToSell}L of ${cropName} @ £${salePrice}/L`,
            totalSaleAmount,
            req.userId
          ]
        )
      }
    }

    // Get updated storage
    const updatedStorage = await db.queryOne<any>(
      prepareSql('SELECT * FROM crop_storage WHERE id = ?', usePostgres),
      [storage.id]
    )

    const converted = {
      id: updatedStorage.id,
      farmId: updatedStorage.farmId,
      cropName: updatedStorage.crop_name,
      quantityStored: updatedStorage.quantity_stored,
      storageLocation: updatedStorage.storage_location,
      lastUpdated: updatedStorage.last_updated,
      notes: updatedStorage.notes
    }

    res.json({
      success: true,
      message: `Sold ${quantityToSell}L of ${cropName}`,
      storage: converted
    })
  } catch (error) {
    console.error('Sell crop error:', error)
    res.status(500).json({ error: 'Failed to sell crop' })
  }
})

// DELETE /api/farms/:farmId/storage/:cropName - Delete crop storage
router.delete('/:farmId/storage/:cropName', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId, cropName } = req.params
    const role = req.body._userRole

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot delete storage' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()

    // Verify storage exists for this farm
    const storage = await db.queryOne<any>(
      prepareSql(`
        SELECT id FROM crop_storage
        WHERE "farmId" = ? AND crop_name = ?
      `, usePostgres),
      [farmId, cropName]
    )

    if (!storage) {
      return res.status(404).json({ error: 'Storage not found' })
    }

    await db.run(
      prepareSql(`
        DELETE FROM crop_storage
        WHERE "farmId" = ? AND crop_name = ?
      `, usePostgres),
      [farmId, cropName]
    )

    res.json({ success: true, message: `Deleted storage for ${cropName}` })
  } catch (error) {
    console.error('Delete storage error:', error)
    res.status(500).json({ error: 'Failed to delete storage' })
  }
})

export default router
