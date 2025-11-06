import express, { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { verifyFarmMembership } from '../middleware/farmAccess.js'
import { getDbAdapter, Field } from '../database.js'
import { prepareSql, isPostgres } from '../db-adapter.js'
import { getCropRecommendations } from '../utils/cropRotation.js'

const router = express.Router()

// PATCH /api/fields/:id - Must come BEFORE /:farmId/fields to avoid route conflicts
router.patch('/fields/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    console.log('PATCH /fields/:id - Request received for field ID:', req.params.id)
    console.log('Request body:', req.body)
    console.log('User ID:', req.userId)
    
    const { id } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    // Get field to verify farm membership
    const field = await db.queryOne<{ farmId: number }>(
      prepareSql('SELECT "farmId" FROM fields WHERE id = ?', usePostgres),
      [id]
    )
    
    console.log('Field found:', field)
    
    if (!field) {
      return res.status(404).json({ error: 'Field not found' })
    }

    // Check farm membership
    const member = await db.queryOne<{ role: string }>(
      prepareSql('SELECT role FROM "farmMembers" WHERE "farmId" = ? AND "userId" = ?', usePostgres),
      [field.farmId, req.userId]
    )

    console.log('Member found:', member)

    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this farm' })
    }

    if (member.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot edit fields' })
    }

    // Update field
    const { name, sizeHectares, currentCrop, growthStage, fertiliserState, weedsState, notes, actualYield } = req.body
    
    // Get old field data to track changes
    const oldField = await db.queryOne<Field>(
      prepareSql('SELECT * FROM fields WHERE id = ?', usePostgres),
      [id]
    )
    
    const updates: string[] = []
    const values: any[] = []

    if (name !== undefined) { updates.push('name = ?'); values.push(name) }
    if (sizeHectares !== undefined) { updates.push('"sizeHectares" = ?'); values.push(sizeHectares) }
    if (currentCrop !== undefined) { updates.push('"currentCrop" = ?'); values.push(currentCrop) }
    if (growthStage !== undefined) { updates.push('"growthStage" = ?'); values.push(growthStage) }
    if (fertiliserState !== undefined) { updates.push('"fertiliserState" = ?'); values.push(fertiliserState) }
    if (weedsState !== undefined) { updates.push('"weedsState" = ?'); values.push(weedsState) }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes) }
    if (actualYield !== undefined) { 
      // Both SQLite and PostgreSQL use snake_case for this column
      updates.push('actual_yield = ?')
      values.push(actualYield) 
    }
    
    if (usePostgres) {
      updates.push('"updatedAt" = CURRENT_TIMESTAMP')
    } else {
      updates.push("updatedAt = datetime('now')")
    }
    values.push(id)

    await db.run(
      prepareSql(`UPDATE fields SET ${updates.join(', ')} WHERE id = ?`, usePostgres),
      values
    )

    // Track significant changes in field history
    if (oldField && growthStage !== undefined && growthStage !== oldField.growthStage) {
      const historyActions = ['Harvested', 'Plowed', 'Cultivated', 'Seeded']
      if (historyActions.includes(growthStage)) {
        // Get farm's current game date
        const farm = await db.queryOne<{ currentYear: number; currentMonth: number; currentDay: number }>(
          prepareSql('SELECT "currentYear", "currentMonth", "currentDay" FROM farms WHERE id = ?', usePostgres),
          [oldField.farmId]
        )
        
        if (!farm) {
          throw new Error('Farm not found')
        }

        const tableName = usePostgres ? 'field_history' : 'fieldHistory'
        const fieldIdCol = usePostgres ? 'field_id' : 'fieldId'
        const growthStageCol = usePostgres ? 'growth_stage' : 'growthStage'
        const gameYearCol = usePostgres ? 'game_year' : 'gameYear'
        const gameMonthCol = usePostgres ? 'game_month' : 'gameMonth'
        const gameDayCol = usePostgres ? 'game_day' : 'gameDay'
        
        // Use the new crop if provided, otherwise use the old crop
        const cropForHistory = currentCrop !== undefined ? currentCrop : oldField.currentCrop
        
        // Only record if there's a crop (skip if both are null)
        if (cropForHistory) {
          // Add actual yield to notes when harvesting
          let historyNotes = notes || null
          if (growthStage === 'Harvested' && actualYield !== undefined) {
            const yieldText = `Harvested: ${actualYield} L`
            historyNotes = historyNotes ? `${historyNotes} | ${yieldText}` : yieldText
          }
          
          const insertSql = `INSERT INTO ${tableName} (${fieldIdCol}, crop, action, ${growthStageCol}, ${gameYearCol}, ${gameMonthCol}, ${gameDayCol}, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          await db.run(
            prepareSql(insertSql, usePostgres),
            [id, cropForHistory, growthStage, growthStage, farm.currentYear, farm.currentMonth, farm.currentDay, historyNotes]
          )
        }
      }
    }

    const updatedField = await db.queryOne<Field>(
      prepareSql('SELECT * FROM fields WHERE id = ?', usePostgres),
      [id]
    )
    console.log('Field updated successfully:', updatedField)
    res.json(updatedField)
  } catch (error) {
    console.error('Update field error:', error)
    res.status(500).json({ error: 'Failed to update field' })
  }
})

// GET /api/farms/:farmId/fields
router.get('/:farmId/fields', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    const fields = await db.query<Field>(
      prepareSql('SELECT * FROM fields WHERE "farmId" = ? ORDER BY "fieldNumber"', usePostgres),
      [farmId]
    )

    // Convert snake_case to camelCase for both SQLite and PostgreSQL
    const converted = fields.map((field: any) => {
      const converted: any = { ...field }
      if ('planted_year' in converted) converted.plantedYear = converted.planted_year
      if ('planted_month' in converted) converted.plantedMonth = converted.planted_month
      if ('planted_day' in converted) converted.plantedDay = converted.planted_day
      if ('seeding_rate' in converted) converted.seedingRate = converted.seeding_rate
      if ('seed_cost' in converted) converted.seedCost = converted.seed_cost
      if ('fertilizer_cost' in converted) converted.fertilizerCost = converted.fertilizer_cost
      if ('lime_cost' in converted) converted.limeCost = converted.lime_cost
      if ('weeding_cost' in converted) converted.weedingCost = converted.weeding_cost
      if ('fuel_cost' in converted) converted.fuelCost = converted.fuel_cost
      if ('equipment_cost' in converted) converted.equipmentCost = converted.equipment_cost
      if ('other_costs' in converted) converted.otherCosts = converted.other_costs
      if ('expected_yield' in converted) converted.expectedYield = converted.expected_yield
      if ('actual_yield' in converted) converted.actualYield = converted.actual_yield
      if ('production_record_id' in converted) converted.productionRecordId = converted.production_record_id
      return converted
    })
    res.json(converted)
  } catch (error) {
    console.error('Get fields error:', error)
    res.status(500).json({ error: 'Failed to fetch fields' })
  }
})

// POST /api/farms/:farmId/fields
router.post('/:farmId/fields', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const role = req.body._userRole

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot add fields' })
    }

    const { fieldNumber, name, sizeHectares, currentCrop, growthStage, fertiliserState, weedsState, notes } = req.body

    if (!fieldNumber || !name || sizeHectares === undefined) {
      return res.status(400).json({ error: 'Field number, name, and size are required' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()

    let field: Field | undefined

    if (usePostgres) {
      const result = await db.query<Field>(
        prepareSql(`
          INSERT INTO fields ("farmId", "fieldNumber", name, "sizeHectares", "currentCrop", "growthStage", "fertiliserState", "weedsState", notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `, usePostgres),
        [farmId, fieldNumber, name, sizeHectares, currentCrop || null, growthStage || null, fertiliserState || null, weedsState || null, notes || null]
      )
      field = result[0]
    } else {
      const result = await db.run(
        prepareSql(`
          INSERT INTO fields ("farmId", "fieldNumber", name, "sizeHectares", "currentCrop", "growthStage", "fertiliserState", "weedsState", notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, usePostgres),
        [farmId, fieldNumber, name, sizeHectares, currentCrop || null, growthStage || null, fertiliserState || null, weedsState || null, notes || null]
      )
      field = await db.queryOne<Field>(
        prepareSql('SELECT * FROM fields WHERE id = ?', usePostgres),
        [result.lastID]
      )
    }
    
    res.status(201).json(field)
  } catch (error) {
    console.error('Create field error:', error)
    res.status(500).json({ error: 'Failed to create field' })
  }
})

// GET /api/fields/:id/history - Get field history
router.get('/fields/:id/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    // Verify user has access to this field
    const field = await db.queryOne<{ farmId: number }>(
      prepareSql('SELECT "farmId" FROM fields WHERE id = ?', usePostgres),
      [id]
    )
    
    if (!field) {
      return res.status(404).json({ error: 'Field not found' })
    }

    const member = await db.queryOne<{ role: string }>(
      prepareSql('SELECT role FROM "farmMembers" WHERE "farmId" = ? AND "userId" = ?', usePostgres),
      [field.farmId, req.userId]
    )

    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this farm' })
    }

    // Get field history
    const tableName = usePostgres ? 'field_history' : 'fieldHistory'
    const fieldIdCol = usePostgres ? 'field_id' : 'fieldId'
    const gameYearCol = usePostgres ? 'game_year' : 'gameYear'
    const gameMonthCol = usePostgres ? 'game_month' : 'gameMonth'
    const gameDayCol = usePostgres ? 'game_day' : 'gameDay'
    
    const historySql = `SELECT * FROM ${tableName} WHERE ${fieldIdCol} = ? ORDER BY ${gameYearCol} DESC, ${gameMonthCol} DESC, ${gameDayCol} DESC LIMIT 50`
    const history = await db.query<{
      id: number
      fieldId: number
      crop: string
      action: string
      growthStage: string | null
      gameYear: number
      gameMonth: number
      gameDay: number
      notes: string | null
    }>(
      prepareSql(historySql, usePostgres),
      [id]
    )

    // Convert snake_case to camelCase for PostgreSQL
    const convertedHistory = history.map((entry: any) => {
      const converted: any = { ...entry }
      if ('field_id' in converted) converted.fieldId = converted.field_id
      if ('growth_stage' in converted) converted.growthStage = converted.growth_stage
      if ('game_year' in converted) converted.gameYear = converted.game_year
      if ('game_month' in converted) converted.gameMonth = converted.game_month
      if ('game_day' in converted) converted.gameDay = converted.game_day
      return converted
    })

    res.json(convertedHistory)
  } catch (error) {
    console.error('Get field history error:', error)
    res.status(500).json({ error: 'Failed to fetch field history' })
  }
})

// GET /api/fields/:id/recommendations - Get crop recommendations
router.get('/fields/:id/recommendations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    // Verify user has access to this field
    const field = await db.queryOne<Field>(
      prepareSql('SELECT * FROM fields WHERE id = ?', usePostgres),
      [id]
    )
    
    if (!field) {
      return res.status(404).json({ error: 'Field not found' })
    }

    const member = await db.queryOne<{ role: string }>(
      prepareSql('SELECT role FROM "farmMembers" WHERE "farmId" = ? AND "userId" = ?', usePostgres),
      [field.farmId, req.userId]
    )

    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this farm' })
    }

    // Get field history
    const tableName = usePostgres ? 'field_history' : 'fieldHistory'
    const fieldIdCol = usePostgres ? 'field_id' : 'fieldId'
    const gameYearCol = usePostgres ? 'game_year' : 'gameYear'
    const gameMonthCol = usePostgres ? 'game_month' : 'gameMonth'
    const gameDayCol = usePostgres ? 'game_day' : 'gameDay'
    
    const historySql = `SELECT crop FROM ${tableName} WHERE ${fieldIdCol} = ? ORDER BY ${gameYearCol} DESC, ${gameMonthCol} DESC, ${gameDayCol} DESC LIMIT 10`
    const history = await db.query<{ crop: string }>(
      prepareSql(historySql, usePostgres),
      [id]
    )

    // Determine the previous crop - use current crop if set, otherwise use most recent from history
    let previousCrop = field.currentCrop
    if (!previousCrop && history.length > 0) {
      previousCrop = history[0].crop
    }

    // Get recommendations based on previous crop and history
    const recommendations = getCropRecommendations(previousCrop, history)

    res.json({
      currentCrop: field.currentCrop,
      growthStage: field.growthStage,
      previousCrop: previousCrop,
      recommendations
    })
  } catch (error) {
    console.error('Get crop recommendations error:', error)
    res.status(500).json({ error: 'Failed to get recommendations' })
  }
})

// PATCH /api/fields/:id/production - Update field production costs and tracking
router.patch('/fields/:id/production', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    // Get field to verify farm membership
    const field = await db.queryOne<Field>(
      prepareSql('SELECT * FROM fields WHERE id = ?', usePostgres),
      [id]
    )
    
    if (!field) {
      return res.status(404).json({ error: 'Field not found' })
    }

    // Check farm membership
    const member = await db.queryOne<{ role: string }>(
      prepareSql('SELECT role FROM "farmMembers" WHERE "farmId" = ? AND "userId" = ?', usePostgres),
      [field.farmId, req.userId]
    )

    if (!member || member.role === 'viewer') {
      return res.status(403).json({ error: 'You do not have permission to edit fields' })
    }

    const {
      plantedYear,
      plantedMonth,
      plantedDay,
      seedingRate,
      seedCost,
      fertilizerCost,
      limeCost,
      weedingCost,
      fuelCost,
      equipmentCost,
      otherCosts,
      expectedYield
    } = req.body

    const updates: string[] = []
    const values: any[] = []

    // Both SQLite and PostgreSQL use snake_case column names
    if (plantedYear !== undefined) { updates.push('planted_year = ?'); values.push(plantedYear) }
    if (plantedMonth !== undefined) { updates.push('planted_month = ?'); values.push(plantedMonth) }
    if (plantedDay !== undefined) { updates.push('planted_day = ?'); values.push(plantedDay) }
    if (seedingRate !== undefined) { updates.push('seeding_rate = ?'); values.push(seedingRate) }
    if (seedCost !== undefined) { updates.push('seed_cost = ?'); values.push(seedCost) }
    if (fertilizerCost !== undefined) { updates.push('fertilizer_cost = ?'); values.push(fertilizerCost) }
    if (limeCost !== undefined) { updates.push('lime_cost = ?'); values.push(limeCost) }
    if (weedingCost !== undefined) { updates.push('weeding_cost = ?'); values.push(weedingCost) }
    if (fuelCost !== undefined) { updates.push('fuel_cost = ?'); values.push(fuelCost) }
    if (equipmentCost !== undefined) { updates.push('equipment_cost = ?'); values.push(equipmentCost) }
    if (otherCosts !== undefined) { updates.push('other_costs = ?'); values.push(otherCosts) }
    if (expectedYield !== undefined) { updates.push('expected_yield = ?'); values.push(expectedYield) }
    
    // SQLite uses snake_case, PostgreSQL uses quoted camelCase for updatedAt
    if (usePostgres) {
      updates.push('"updatedAt" = CURRENT_TIMESTAMP')
    } else {
      updates.push("updated_at = datetime('now')")
    }
    values.push(id)

    const sql = prepareSql(`UPDATE fields SET ${updates.join(', ')} WHERE id = ?`, usePostgres)
    console.log('Executing SQL:', sql)
    console.log('With values:', values)

    await db.run(sql, values)

    // Get updated field
    const updatedField = await db.queryOne<Field>(
      prepareSql('SELECT * FROM fields WHERE id = ?', usePostgres),
      [id]
    )

    console.log('✅ Update successful! Returning updated field:', updatedField)
    
    // Convert snake_case to camelCase for both SQLite and PostgreSQL
    if (updatedField) {
      const converted: any = { ...updatedField }
      if ('planted_year' in converted) converted.plantedYear = converted.planted_year
      if ('planted_month' in converted) converted.plantedMonth = converted.planted_month
      if ('planted_day' in converted) converted.plantedDay = converted.planted_day
      if ('seeding_rate' in converted) converted.seedingRate = converted.seeding_rate
      if ('seed_cost' in converted) converted.seedCost = converted.seed_cost
      if ('fertilizer_cost' in converted) converted.fertilizerCost = converted.fertilizer_cost
      if ('lime_cost' in converted) converted.limeCost = converted.lime_cost
      if ('weeding_cost' in converted) converted.weedingCost = converted.weeding_cost
      if ('fuel_cost' in converted) converted.fuelCost = converted.fuel_cost
      if ('equipment_cost' in converted) converted.equipmentCost = converted.equipment_cost
      if ('other_costs' in converted) converted.otherCosts = converted.other_costs
      if ('expected_yield' in converted) converted.expectedYield = converted.expected_yield
      if ('production_record_id' in converted) converted.productionRecordId = converted.production_record_id
      res.json(converted)
    } else {
      res.json(updatedField)
    }
  } catch (error) {
    console.error('Update field production error:', error)
    res.status(500).json({ error: 'Failed to update field production data' })
  }
})

export default router
