import express, { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { verifyFarmMembership } from '../middleware/farmAccess.js'
import { getDbAdapter } from '../database.js'
import { prepareSql, isPostgres } from '../db-adapter.js'

const router = express.Router()

export interface BaleStorage {
  size: 180 | 220 | 240
  shape: 'round' | 'square'
  quantity: number
}

export interface CropStorage {
  id: number
  farmId: number
  cropName: string
  quantityStored: number
  storageUnit: string
  bales?: BaleStorage[]
  storageLocation: string | null
  lastUpdated: string
  notes: string | null
}

// Helper to determine storage unit for a crop
function getStorageUnit(cropName: string): string {
  const normalizedCrop = cropName.toLowerCase().trim()
  const balesCrops = ['grass', 'straw', 'hay', 'silage']
  return balesCrops.some(crop => normalizedCrop.includes(crop)) ? 'bales' : 'liters'
}

// GET /api/farms/:farmId/storage - Get all crop storage
router.get('/:farmId/storage', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()

    console.log(`📦 GET /farms/${farmId}/storage - Request received`)

    const tableAlias = usePostgres ? 'crop_storage' : 'cropStorage'
    const farmCol = usePostgres ? '"farmId"' : 'farmId'
    const cropCol = usePostgres ? 'crop_name' : 'cropName'
    
    const storage = await db.query<any>(
      prepareSql(`
        SELECT * FROM ${tableAlias}
        WHERE ${farmCol} = ?
        ORDER BY ${cropCol}
      `, usePostgres),
      [farmId]
    )

    console.log(`📦 Storage records found: ${storage.length}`, storage)

    // Convert to API format with bales array
    const converted = storage.map((item: any) => {
      const storageUnit = item.storageUnit || item.storage_unit || getStorageUnit(item.cropName || item.crop_name)
      const isBales = storageUnit === 'bales'
      
      const result: any = {
        id: item.id,
        farmId: item.farmId || item['farmId'],
        cropName: item.cropName || item.crop_name,
        quantityStored: item.quantityStored || item.quantity_stored,
        storageUnit,
        storageLocation: item.storageLocation || item.storage_location,
        lastUpdated: item.lastUpdated || item.last_updated,
        notes: item.notes
      }

      // Extract bale quantities if this is a bale crop
      if (isBales) {
        const baleKeys = usePostgres 
          ? ['bale_180_round', 'bale_180_square', 'bale_220_round', 'bale_220_square', 'bale_240_round', 'bale_240_square']
          : ['bale180Round', 'bale180Square', 'bale220Round', 'bale220Square', 'bale240Round', 'bale240Square']
        
        const bales: BaleStorage[] = [
          { size: 180, shape: 'round', quantity: item[baleKeys[0]] || 0 },
          { size: 180, shape: 'square', quantity: item[baleKeys[1]] || 0 },
          { size: 220, shape: 'round', quantity: item[baleKeys[2]] || 0 },
          { size: 220, shape: 'square', quantity: item[baleKeys[3]] || 0 },
          { size: 240, shape: 'round', quantity: item[baleKeys[4]] || 0 },
          { size: 240, shape: 'square', quantity: item[baleKeys[5]] || 0 }
        ]
        result.bales = bales
      }

      return result
    })

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

    const { cropName, quantityStored, storageLocation, notes, baleSize, baleShape, actualYield } = req.body

    if (!cropName) {
      return res.status(400).json({ error: 'Crop name is required' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()
    const storageUnit = getStorageUnit(cropName)
    
    // For bale crops, use actualYield as the bale quantity
    const baleQuantity = actualYield || quantityStored
    const tableAlias = usePostgres ? 'crop_storage' : 'cropStorage'
    const farmCol = usePostgres ? '"farmId"' : 'farmId'
    const cropCol = usePostgres ? 'crop_name' : 'cropName'
    const qtyCol = usePostgres ? 'quantity_stored' : 'quantityStored'
    const unitCol = usePostgres ? 'storage_unit' : 'storageUnit'
    const locCol = usePostgres ? 'storage_location' : 'storageLocation'
    const updCol = usePostgres ? 'last_updated' : 'lastUpdated'

    // Determine bale column names based on size and shape
    let baleColName = ''
    if (storageUnit === 'bales' && baleSize && baleShape) {
      if (baleSize === 180 && baleShape === 'round') {
        baleColName = usePostgres ? 'bale_180_round' : 'bale180Round'
      } else if (baleSize === 180 && baleShape === 'square') {
        baleColName = usePostgres ? 'bale_180_square' : 'bale180Square'
      } else if (baleSize === 220 && baleShape === 'round') {
        baleColName = usePostgres ? 'bale_220_round' : 'bale220Round'
      } else if (baleSize === 220 && baleShape === 'square') {
        baleColName = usePostgres ? 'bale_220_square' : 'bale220Square'
      } else if (baleSize === 240 && baleShape === 'round') {
        baleColName = usePostgres ? 'bale_240_round' : 'bale240Round'
      } else if (baleSize === 240 && baleShape === 'square') {
        baleColName = usePostgres ? 'bale_240_square' : 'bale240Square'
      }
    }

    // Check if storage already exists for this crop
    const existing = await db.queryOne<any>(
      prepareSql(`
        SELECT id FROM ${tableAlias}
        WHERE ${farmCol} = ? AND ${cropCol} = ?
      `, usePostgres),
      [farmId, cropName]
    )

    let storageItem
    if (existing) {
      // Update existing - if bale crop, increment the specific bale column, otherwise set quantity
      if (storageUnit === 'bales' && baleColName && baleQuantity) {
        const updateSet = `${baleColName} = ${baleColName} + ?, ${updCol} = CURRENT_TIMESTAMP`
        await db.run(
          prepareSql(`UPDATE ${tableAlias} SET ${updateSet} WHERE id = ?`, usePostgres),
          [baleQuantity, existing.id]
        )
      } else if (storageUnit !== 'bales') {
        // Liquid storage: set quantity (or add to it)
        const currentQty = (await db.queryOne<any>(
          prepareSql(`SELECT ${qtyCol} as qty FROM ${tableAlias} WHERE id = ?`, usePostgres),
          [existing.id]
        ))?.qty || 0
        const newQty = (quantityStored || 0) + currentQty
        await db.run(
          prepareSql(`
            UPDATE ${tableAlias}
            SET ${qtyCol} = ?, ${locCol} = ?, notes = ?, ${updCol} = CURRENT_TIMESTAMP
            WHERE id = ?
          `, usePostgres),
          [newQty, storageLocation || null, notes || null, existing.id]
        )
      }
      storageItem = await db.queryOne<any>(
        prepareSql(`SELECT * FROM ${tableAlias} WHERE id = ?`, usePostgres),
        [existing.id]
      )
    } else {
      // Create new
      const baleInsertCols = []
      const baleInsertVals = []
      const baleInsertParams: any[] = []

      if (storageUnit === 'bales' && baleColName && baleQuantity) {
        baleInsertCols.push(baleColName)
        baleInsertVals.push('?')
        baleInsertParams.push(baleQuantity)
      }

      const cols = `${farmCol}, ${cropCol}, ${unitCol}, ${locCol}, notes`
      const vals = `?, ?, ?, ?, ?`
      const params = [farmId, cropName, storageUnit, storageLocation || null, notes || null]

      if (baleInsertCols.length > 0) {
        const fullCols = cols + ', ' + baleInsertCols.join(', ')
        const fullVals = vals + ', ' + baleInsertVals.join(', ')
        const fullParams = params.concat(baleInsertParams)

        if (usePostgres) {
          const result = await db.query<any>(
            prepareSql(`
              INSERT INTO ${tableAlias} (${fullCols})
              VALUES (${fullVals})
              RETURNING *
            `, usePostgres),
            fullParams
          )
          storageItem = result[0]
        } else {
          await db.run(
            prepareSql(`
              INSERT INTO ${tableAlias} (${fullCols})
              VALUES (${fullVals})
            `, usePostgres),
            fullParams
          )
          storageItem = await db.queryOne<any>(
            prepareSql(`SELECT * FROM ${tableAlias} WHERE ${farmCol} = ? AND ${cropCol} = ?`, usePostgres),
            [farmId, cropName]
          )
        }
      } else {
        if (usePostgres) {
          const result = await db.query<any>(
            prepareSql(`
              INSERT INTO ${tableAlias} (${cols})
              VALUES (${vals})
              RETURNING *
            `, usePostgres),
            params
          )
          storageItem = result[0]
        } else {
          await db.run(
            prepareSql(`
              INSERT INTO ${tableAlias} (${cols})
              VALUES (${vals})
            `, usePostgres),
            params
          )
          storageItem = await db.queryOne<any>(
            prepareSql(`SELECT * FROM ${tableAlias} WHERE ${farmCol} = ? AND ${cropCol} = ?`, usePostgres),
            [farmId, cropName]
          )
        }
      }
    }

    // Convert response
    const isBales = storageUnit === 'bales'
    const converted: any = {
      id: storageItem.id,
      farmId: storageItem.farmId || storageItem['farmId'],
      cropName: storageItem.cropName || storageItem.crop_name,
      quantityStored: storageItem.quantityStored || storageItem.quantity_stored || 0,
      storageUnit,
      storageLocation: storageItem.storageLocation || storageItem.storage_location,
      lastUpdated: storageItem.lastUpdated || storageItem.last_updated,
      notes: storageItem.notes
    }

    if (isBales) {
      const baleKeys = usePostgres 
        ? ['bale_180_round', 'bale_180_square', 'bale_220_round', 'bale_220_square', 'bale_240_round', 'bale_240_square']
        : ['bale180Round', 'bale180Square', 'bale220Round', 'bale220Square', 'bale240Round', 'bale240Square']
      
      const bales: BaleStorage[] = [
        { size: 180, shape: 'round', quantity: storageItem[baleKeys[0]] || 0 },
        { size: 180, shape: 'square', quantity: storageItem[baleKeys[1]] || 0 },
        { size: 220, shape: 'round', quantity: storageItem[baleKeys[2]] || 0 },
        { size: 220, shape: 'square', quantity: storageItem[baleKeys[3]] || 0 },
        { size: 240, shape: 'round', quantity: storageItem[baleKeys[4]] || 0 },
        { size: 240, shape: 'square', quantity: storageItem[baleKeys[5]] || 0 }
      ]
      converted.bales = bales
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
    const { quantityToSell, salePrice, baleSize, baleShape } = req.body

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot sell crops' })
    }

    if (quantityToSell === undefined || quantityToSell <= 0) {
      return res.status(400).json({ error: 'Sale quantity must be greater than 0' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()
    const tableAlias = usePostgres ? 'crop_storage' : 'cropStorage'
    const farmCol = usePostgres ? '"farmId"' : 'farmId'
    const cropCol = usePostgres ? 'crop_name' : 'cropName'
    const qtyCol = usePostgres ? 'quantity_stored' : 'quantityStored'
    const updCol = usePostgres ? 'last_updated' : 'lastUpdated'

    // Get current storage
    const storage = await db.queryOne<any>(
      prepareSql(`
        SELECT * FROM ${tableAlias}
        WHERE ${farmCol} = ? AND ${cropCol} = ?
      `, usePostgres),
      [farmId, cropName]
    )

    if (!storage) {
      return res.status(404).json({ error: 'No storage found for this crop' })
    }

    const storageUnit = storage.storageUnit || storage.storage_unit || getStorageUnit(cropName)
    
    // For bale crops, sell from specific bale type
    if (storageUnit === 'bales' && baleSize && baleShape) {
      let baleColName = ''
      if (baleSize === 180 && baleShape === 'round') {
        baleColName = usePostgres ? 'bale_180_round' : 'bale180Round'
      } else if (baleSize === 180 && baleShape === 'square') {
        baleColName = usePostgres ? 'bale_180_square' : 'bale180Square'
      } else if (baleSize === 220 && baleShape === 'round') {
        baleColName = usePostgres ? 'bale_220_round' : 'bale220Round'
      } else if (baleSize === 220 && baleShape === 'square') {
        baleColName = usePostgres ? 'bale_220_square' : 'bale220Square'
      } else if (baleSize === 240 && baleShape === 'round') {
        baleColName = usePostgres ? 'bale_240_round' : 'bale240Round'
      } else if (baleSize === 240 && baleShape === 'square') {
        baleColName = usePostgres ? 'bale_240_square' : 'bale240Square'
      }

      if (!baleColName) {
        return res.status(400).json({ error: 'Invalid bale size or shape' })
      }

      const currentBales = storage[baleColName] || 0
      if (quantityToSell > currentBales) {
        return res.status(400).json({ 
          error: `Cannot sell ${quantityToSell} bales - only ${currentBales} ${baleSize}kg ${baleShape} bales in storage` 
        })
      }

      // Update storage (decrease bale quantity)
      const newBaleCount = currentBales - quantityToSell
      await db.run(
        prepareSql(`
          UPDATE ${tableAlias}
          SET ${baleColName} = ?, ${updCol} = CURRENT_TIMESTAMP
          WHERE id = ?
        `, usePostgres),
        [newBaleCount, storage.id]
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
              `Sold ${quantityToSell} ${baleSize}kg ${baleShape} bales of ${cropName} @ £${salePrice}/bale`,
              totalSaleAmount,
              req.userId
            ]
          )
        }
      }
    } else {
      // Liquid storage
      const currentQuantity = storage.quantityStored || storage.quantity_stored
      if (quantityToSell > currentQuantity) {
        return res.status(400).json({ 
          error: `Cannot sell ${quantityToSell} ${storageUnit} - only ${currentQuantity} ${storageUnit} in storage` 
        })
      }

      // Update storage (decrease quantity)
      const newQuantity = currentQuantity - quantityToSell
      await db.run(
        prepareSql(`
          UPDATE ${tableAlias}
          SET ${qtyCol} = ?, ${updCol} = CURRENT_TIMESTAMP
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
              `Sold ${quantityToSell} ${storageUnit} of ${cropName} @ £${salePrice}/${storageUnit}`,
              totalSaleAmount,
              req.userId
            ]
          )
        }
      }
    }

    // Get updated storage
    const updatedStorage = await db.queryOne<any>(
      prepareSql(`SELECT * FROM ${tableAlias} WHERE id = ?`, usePostgres),
      [storage.id]
    )

    // Build response
    const isBales = storageUnit === 'bales'
    const converted: any = {
      id: updatedStorage.id,
      farmId: updatedStorage.farmId || updatedStorage['farmId'],
      cropName: updatedStorage.cropName || updatedStorage.crop_name,
      quantityStored: updatedStorage.quantityStored || updatedStorage.quantity_stored,
      storageUnit,
      storageLocation: updatedStorage.storageLocation || updatedStorage.storage_location,
      lastUpdated: updatedStorage.lastUpdated || updatedStorage.last_updated,
      notes: updatedStorage.notes
    }

    if (isBales) {
      const baleKeys = usePostgres 
        ? ['bale_180_round', 'bale_180_square', 'bale_220_round', 'bale_220_square', 'bale_240_round', 'bale_240_square']
        : ['bale180Round', 'bale180Square', 'bale220Round', 'bale220Square', 'bale240Round', 'bale240Square']
      
      const bales: BaleStorage[] = [
        { size: 180, shape: 'round', quantity: updatedStorage[baleKeys[0]] || 0 },
        { size: 180, shape: 'square', quantity: updatedStorage[baleKeys[1]] || 0 },
        { size: 220, shape: 'round', quantity: updatedStorage[baleKeys[2]] || 0 },
        { size: 220, shape: 'square', quantity: updatedStorage[baleKeys[3]] || 0 },
        { size: 240, shape: 'round', quantity: updatedStorage[baleKeys[4]] || 0 },
        { size: 240, shape: 'square', quantity: updatedStorage[baleKeys[5]] || 0 }
      ]
      converted.bales = bales
    }

    const baleDesc = isBales ? ` ${baleSize}kg ${baleShape} bales` : ''
    res.json({
      success: true,
      message: `Sold ${quantityToSell}${baleDesc}`,
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
    const tableAlias = usePostgres ? 'crop_storage' : 'cropStorage'
    const farmCol = usePostgres ? '"farmId"' : 'farmId'
    const cropCol = usePostgres ? 'crop_name' : 'cropName'

    // Verify storage exists for this farm
    const storage = await db.queryOne<any>(
      prepareSql(`
        SELECT id FROM ${tableAlias}
        WHERE ${farmCol} = ? AND ${cropCol} = ?
      `, usePostgres),
      [farmId, cropName]
    )

    if (!storage) {
      return res.status(404).json({ error: 'Storage not found' })
    }

    await db.run(
      prepareSql(`
        DELETE FROM ${tableAlias}
        WHERE ${farmCol} = ? AND ${cropCol} = ?
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
