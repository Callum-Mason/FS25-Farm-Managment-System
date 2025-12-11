import express, { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { verifyFarmMembership } from '../middleware/farmAccess.js'
import { getDbAdapter } from '../database.js'

const router = express.Router()

// Interfaces for JSON data structure
interface Vehicle {
  id: string
  name: string
  type: string
  farmId: string
  damageAmount: number
  fillLevels?: Array<{
    fillType: string
    fillLevel: number
    capacity: number
  }>
}

interface Field {
  id: string
  name: string
  areaHectares: number
  fruitType: string
  growthState: number
  maxGrowthState: number
  weedState: number
  fertilizerLevel: number
  isReadyToHarvest: boolean
}

interface Farm {
  id: string
  name: string
  money: number
}

interface GameData {
  farms?: Farm[]
  fields?: Field[]
  vehicles?: Vehicle[]
  gameFarmId?: string
}

// Helper function to map growth stage to percentage
function mapGrowthStateToPercentage(growthState: number, maxGrowthState: number): string {
  if (maxGrowthState === 0) return '0'
  
  const percentage = Math.round((growthState / maxGrowthState) * 100)
  
  if (percentage >= 100) return '100'
  if (percentage >= 75) return '75'
  if (percentage >= 50) return '50'
  if (percentage >= 25) return '25'
  return '0'
}

// Helper function to map weed state to text
function mapWeedState(weedState: number): string {
  if (weedState === 0) return 'None'
  if (weedState <= 100) return 'Low'
  if (weedState <= 200) return 'Medium'
  return 'High'
}

// Helper function to map fertilizer level to text
function mapFertilizerState(fertilizerLevel: number): string {
  if (fertilizerLevel === 0) return 'None'
  if (fertilizerLevel <= 33) return 'Stage 1'
  if (fertilizerLevel <= 66) return 'Stage 2'
  return 'Stage 3'
}

// Helper function to map vehicle type to category
function mapVehicleCategory(type: string): string {
  const categoryMap: { [key: string]: string } = {
    'tractor': 'Tractors',
    'combineDrivable': 'Harvesters',
    'trailer': 'Trailers',
    'cultivator': 'Cultivators',
    'sowingMachine': 'Planters',
    'mower': 'Mowers',
    'forageWagon': 'Trailers',
    'teleHandler': 'Loaders',
    'car': 'Vehicles'
  }
  return categoryMap[type] || 'Other'
}

// POST /api/farms/:farmId/import - Import game data from external dashboard
router.post('/:farmId/import', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    console.log('POST /farms/:farmId/import - Request received')
    
    const { farmId } = req.params
    const role = req.body._userRole
    const gameData: GameData = req.body

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot import data' })
    }

    const db = getDbAdapter()
    const results = {
      fieldsUpdated: 0,
      fieldsCreated: 0,
      moneyUpdated: false,
      equipmentUpdated: 0,
      errors: [] as string[]
    }

    const gameFarmId = gameData.gameFarmId || '1'

    // Update farm money if farm data is available
    if (gameData.farms && gameData.farms.length > 0) {
      const farm = gameData.farms.find(f => f.id === gameFarmId)
      
      if (farm) {
        try {
          await db.run(
            `UPDATE farms SET currency = 'GBP' WHERE id = ?`,
            [farmId]
          )
          
          // Create a finance record for the money sync
          await db.run(
            `INSERT INTO finances (farm_id, date, type, category, description, amount, created_by_user_id)
             VALUES (?, DATE('now'), 'income', 'Game Sync', 'Money synced from game: £' || ?, ?, ?)`,
            [farmId, farm.money.toFixed(2), farm.money, req.userId!]
          )
          
          results.moneyUpdated = true
        } catch (error) {
          console.error('Error updating farm money:', error)
          results.errors.push('Failed to update farm money')
        }
      }
    }

    // Process fields
    if (gameData.fields && gameData.fields.length > 0) {
      for (const field of gameData.fields) {
        try {
          const fieldData = {
            fieldNumber: parseInt(field.id),
            name: field.name,
            sizeHectares: field.areaHectares,
            currentCrop: field.fruitType === 'None' || !field.fruitType ? null : field.fruitType,
            growthStage: mapGrowthStateToPercentage(field.growthState, field.maxGrowthState),
            fertiliserState: mapFertilizerState(field.fertilizerLevel),
            weedsState: mapWeedState(field.weedState)
          }

          // Check if field exists
          const existing = await db.queryOne(
            `SELECT id FROM fields WHERE farm_id = ? AND field_number = ?`,
            [farmId, fieldData.fieldNumber]
          )

          if (existing) {
            // Update existing field
            await db.run(
              `UPDATE fields 
               SET name = ?, 
                   size_hectares = ?, 
                   current_crop = ?, 
                   growth_stage = ?,
                   fertiliser_state = ?,
                   weeds_state = ?,
                   updated_at = CURRENT_TIMESTAMP
               WHERE farm_id = ? AND field_number = ?`,
              [
                fieldData.name,
                fieldData.sizeHectares,
                fieldData.currentCrop,
                fieldData.growthStage,
                fieldData.fertiliserState,
                fieldData.weedsState,
                farmId,
                fieldData.fieldNumber
              ]
            )
            results.fieldsUpdated++
          } else {
            // Create new field
            await db.run(
              `INSERT INTO fields (farm_id, field_number, name, size_hectares, current_crop, growth_stage, fertiliser_state, weeds_state)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                farmId,
                fieldData.fieldNumber,
                fieldData.name,
                fieldData.sizeHectares,
                fieldData.currentCrop,
                fieldData.growthStage,
                fieldData.fertiliserState,
                fieldData.weedsState
              ]
            )
            results.fieldsCreated++
          }
        } catch (error) {
          console.error(`Error processing field ${field.id}:`, error)
          results.errors.push(`Failed to process field ${field.name}`)
        }
      }
    }

    // Process vehicles as equipment
    if (gameData.vehicles && gameData.vehicles.length > 0) {
      for (const vehicle of gameData.vehicles) {
        if (vehicle.farmId !== gameFarmId) {
          continue // Skip vehicles not owned by this farm
        }

        try {
          const category = mapVehicleCategory(vehicle.type)
          const condition = Math.round((1 - vehicle.damageAmount) * 100)

          // Check if equipment exists by name
          const existing = await db.queryOne(
            `SELECT id FROM equipment WHERE farm_id = ? AND model = ?`,
            [farmId, vehicle.name]
          )

          if (existing) {
            // Update condition only
            await db.run(
              `UPDATE equipment 
               SET condition = ?,
                   updated_at = CURRENT_TIMESTAMP
               WHERE farm_id = ? AND model = ?`,
              [condition, farmId, vehicle.name]
            )
            results.equipmentUpdated++
          } else {
            // Create new equipment
            await db.run(
              `INSERT INTO equipment (farm_id, model, category, brand, owned, condition)
               VALUES (?, ?, ?, 'Unknown', TRUE, ?)`,
              [farmId, vehicle.name, category, condition]
            )
            results.equipmentUpdated++
          }
        } catch (error) {
          console.error(`Error processing vehicle ${vehicle.name}:`, error)
          results.errors.push(`Failed to process vehicle ${vehicle.name}`)
        }
      }
    }

    res.status(200).json({
      message: 'Import completed',
      results
    })
  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ error: 'Import failed' })
  }
})

// GET /api/farms/:farmId/import/status - Get current game data sync status
router.get('/:farmId/import/status', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const db = getDbAdapter()

    // Get last sync info from finances table
    const lastSync = await db.queryOne(
      `SELECT date, amount, created_at 
       FROM finances 
       WHERE farm_id = ? AND category = 'Game Sync'
       ORDER BY created_at DESC 
       LIMIT 1`,
      [farmId]
    )

    // Get field count
    const fieldCount = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM fields WHERE farm_id = ?`,
      [farmId]
    )

    // Get equipment count
    const equipmentCount = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM equipment WHERE farm_id = ? AND sold = FALSE`,
      [farmId]
    )

    res.status(200).json({
      lastSyncDate: lastSync?.created_at || null,
      lastSyncMoney: lastSync?.amount || 0,
      totalFields: fieldCount?.count || 0,
      totalEquipment: equipmentCount?.count || 0
    })
  } catch (error) {
    console.error('Error fetching import status:', error)
    res.status(500).json({ error: 'Failed to fetch import status' })
  }
})

export default router
