import express, { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { verifyFarmMembership } from '../middleware/farmAccess.js'
import { getDbAdapter, Field } from '../database.js'
import { prepareSql, isPostgres } from '../db-adapter.js'
import { getCropRecommendations } from '../utils/cropRotation.js'

const router = express.Router()

// Helper function to determine storage unit for a crop
function getStorageUnit(cropName: string): { unit: string; convertedValue: number; displayValue: string } {
  const normalizedCrop = cropName.toLowerCase().trim()
  
  // Grass and straw crops stored as bales (1 bale = approximately 12.5L)
  const balesCrops = ['grass', 'straw', 'hay', 'silage']
  const isBalesCrop = balesCrops.some(crop => normalizedCrop.includes(crop))
  
  if (isBalesCrop) {
    return {
      unit: 'bales',
      convertedValue: 12.5, // 1 bale ≈ 12.5L equivalent
      displayValue: 'bales'
    }
  }
  
  // All other crops stored as liters
  return {
    unit: 'liters',
    convertedValue: 1,
    displayValue: 'L'
  }
}

// PATCH /api/farms/:farmId/fields/bulk - Bulk update multiple fields
router.patch('/:farmId/fields/bulk', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    console.log('PATCH /farms/:farmId/fields/bulk - Request received')
    console.log('Request body:', req.body)
    
    const { farmId } = req.params
    const { fieldIds, updates } = req.body
    const role = req.body._userRole

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot edit fields' })
    }

    if (!fieldIds || !Array.isArray(fieldIds) || fieldIds.length === 0) {
      return res.status(400).json({ error: 'fieldIds array is required and must not be empty' })
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'updates object is required' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    // Get farm's current game date for history logging
    const farm = await db.queryOne<{ currentYear: number; currentMonth: number; currentDay: number }>(
      prepareSql('SELECT "currentYear", "currentMonth", "currentDay" FROM farms WHERE id = ?', usePostgres),
      [farmId]
    )
    
    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' })
    }

    const updateArray: string[] = []
    const values: any[] = []
    
    if (updates.growthStage !== undefined) { updateArray.push('"growthStage" = ?'); values.push(updates.growthStage) }
    if (updates.fertiliserState !== undefined) { updateArray.push('"fertiliserState" = ?'); values.push(updates.fertiliserState) }
    if (updates.weedsState !== undefined) { updateArray.push('"weedsState" = ?'); values.push(updates.weedsState) }
    if (updates.currentCrop !== undefined) { updateArray.push('"currentCrop" = ?'); values.push(updates.currentCrop) }
    if (updates.notes !== undefined) { updateArray.push('notes = ?'); values.push(updates.notes) }
    
    if (usePostgres) {
      updateArray.push('"updatedAt" = CURRENT_TIMESTAMP')
    } else {
      updateArray.push("updatedAt = datetime('now')")
    }

    // Create placeholder for field IDs in query
    const placeholders = fieldIds.map(() => '?').join(',')
    const updateValues = [...values, ...fieldIds]

    // Update all fields
    const sql = prepareSql(
      `UPDATE fields SET ${updateArray.join(', ')} WHERE id IN (${placeholders})`,
      usePostgres
    )
    await db.run(sql, updateValues)

    // Log history for significant changes
    if (updates.growthStage) {
      const tableName = usePostgres ? 'field_history' : 'fieldHistory'
      const fieldIdCol = usePostgres ? 'field_id' : 'fieldId'
      const growthStageCol = usePostgres ? 'growth_stage' : 'growthStage'
      const gameYearCol = usePostgres ? 'game_year' : 'gameYear'
      const gameMonthCol = usePostgres ? 'game_month' : 'gameMonth'
      const gameDayCol = usePostgres ? 'game_day' : 'gameDay'

      for (const fieldId of fieldIds) {
        const field = await db.queryOne<Field>(
          prepareSql('SELECT * FROM fields WHERE id = ?', usePostgres),
          [fieldId]
        )
        
        if (field && field.currentCrop) {
          const insertSql = `INSERT INTO ${tableName} (${fieldIdCol}, crop, action, ${growthStageCol}, ${gameYearCol}, ${gameMonthCol}, ${gameDayCol}) VALUES (?, ?, ?, ?, ?, ?, ?)`
          await db.run(
            prepareSql(insertSql, usePostgres),
            [fieldId, field.currentCrop, updates.growthStage, updates.growthStage, farm.currentYear, farm.currentMonth, farm.currentDay]
          )
        }
      }
    }

    // Fetch updated fields
    const updatedFields = await db.query<Field>(
      prepareSql(`SELECT * FROM fields WHERE id IN (${placeholders})`, usePostgres),
      fieldIds
    )

    res.json({
      success: true,
      updatedCount: fieldIds.length,
      fields: updatedFields
    })
  } catch (error) {
    console.error('Bulk update fields error:', error)
    res.status(500).json({ error: 'Failed to bulk update fields' })
  }
})

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
    const { name, sizeHectares, currentCrop, growthStage, fertiliserState, weedsState, notes, actualYield, baleSize, baleShape, produceStraw, strawYield, strawBaleSize, strawBaleShape } = req.body
    
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
      // SQLite uses camelCase, PostgreSQL uses snake_case
      const yieldCol = usePostgres ? 'actual_yield' : 'actualYield'
      updates.push(`${usePostgres ? '' : ''}${yieldCol} = ?`)
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
        console.log(`📋 Field history action: ${growthStage} (oldStage: ${oldField.growthStage})`)
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
        
        console.log(`🌾 Crop for history: ${cropForHistory}, actualYield: ${actualYield}`)
        
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

          // AUTO-ADD TO CROP STORAGE when harvesting with yield
          if (growthStage === 'Harvested' && actualYield !== undefined && actualYield > 0) {
            console.log(`🌾 AUTO-HARVEST: Attempting to add ${cropForHistory} (${actualYield}L) to storage for farm ${oldField.farmId}`)
            try {
              // Determine if this is a bales crop (grass/straw) or liquid crop
              const storageInfo = getStorageUnit(cropForHistory)
              const storageQuantity = actualYield / storageInfo.convertedValue
              
              console.log(`🌾 AUTO-HARVEST: Crop type: ${storageInfo.unit}, converting ${actualYield}L to ${storageQuantity.toFixed(2)} ${storageInfo.unit}`)
              
              const tableAlias = usePostgres ? 'crop_storage' : 'cropStorage'
              const farmCol = usePostgres ? '"farmId"' : 'farmId'
              const cropCol = usePostgres ? 'crop_name' : 'cropName'
              const qtyCol = usePostgres ? 'quantity_stored' : 'quantityStored'
              const unitCol = usePostgres ? 'storage_unit' : 'storageUnit'
              const locCol = usePostgres ? 'storage_location' : 'storageLocation'
              const updCol = usePostgres ? 'last_updated' : 'lastUpdated'
              
              // Determine bale column name if this is a bale crop
              let baleColName = ''
              if (storageInfo.unit === 'bales' && baleSize && baleShape) {
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
              
              // Check if storage entry already exists for this crop on this farm
              const existingStorage = await db.queryOne<any>(
                prepareSql(`
                  SELECT * FROM ${tableAlias}
                  WHERE ${farmCol} = ? AND ${cropCol} = ?
                `, usePostgres),
                [oldField.farmId, cropForHistory]
              )

              if (existingStorage) {
                // Update existing storage - increment the appropriate bale column or quantity
                if (storageInfo.unit === 'bales' && baleColName) {
                  const currentBales = existingStorage[baleColName] || 0
                  const newBales = currentBales + storageQuantity
                  console.log(`🌾 AUTO-HARVEST: Adding ${storageQuantity.toFixed(0)} ${baleSize}kg ${baleShape} bales to existing storage (now ${newBales.toFixed(0)})`)
                  await db.run(
                    prepareSql(`
                      UPDATE ${tableAlias}
                      SET ${baleColName} = ${baleColName} + ?, ${updCol} = CURRENT_TIMESTAMP
                      WHERE id = ?
                    `, usePostgres),
                    [storageQuantity, existingStorage.id]
                  )
                } else {
                  // Liquid storage - add to existing quantity
                  const newQuantity = (existingStorage.quantityStored || existingStorage.quantity_stored || 0) + storageQuantity
                  console.log(`🌾 AUTO-HARVEST: Updating existing ${cropForHistory} storage to ${newQuantity.toFixed(2)} ${storageInfo.unit}`)
                  await db.run(
                    prepareSql(`
                      UPDATE ${tableAlias}
                      SET ${qtyCol} = ?, ${updCol} = CURRENT_TIMESTAMP
                      WHERE id = ?
                    `, usePostgres),
                    [newQuantity, existingStorage.id]
                  )
                }
              } else {
                // Create new storage entry
                if (storageInfo.unit === 'bales' && baleColName && baleSize && baleShape) {
                  console.log(`🌾 AUTO-HARVEST: Creating NEW storage for ${cropForHistory} with ${storageQuantity.toFixed(0)} ${baleSize}kg ${baleShape} bales`)
                  await db.run(
                    prepareSql(`
                      INSERT INTO ${tableAlias} (${farmCol}, ${cropCol}, ${unitCol}, ${baleColName}, ${locCol}, notes, ${updCol})
                      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    `, usePostgres),
                    [oldField.farmId, cropForHistory, storageInfo.unit, storageQuantity, null, `Harvested from Field ${oldField.fieldNumber}`]
                  )
                } else {
                  // Liquid crop
                  console.log(`🌾 AUTO-HARVEST: Creating NEW storage entry for ${cropForHistory} with ${storageQuantity.toFixed(2)} ${storageInfo.unit}`)
                  await db.run(
                    prepareSql(`
                      INSERT INTO ${tableAlias} (${farmCol}, ${cropCol}, ${qtyCol}, ${unitCol}, ${locCol}, notes, ${updCol})
                      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    `, usePostgres),
                    [oldField.farmId, cropForHistory, storageQuantity, storageInfo.unit, null, `Harvested from Field ${oldField.fieldNumber}`]
                  )
                }
              }
              console.log(`✅ AUTO-HARVEST: Successfully added ${cropForHistory} to storage`)
            } catch (storageError) {
              console.warn('❌ Warning: Failed to auto-add harvested crop to storage:', storageError)
              // Don't fail the harvest if storage update fails - just log warning
            }
          } else {
            console.log(`🌾 AUTO-HARVEST: Skipped (stage: ${growthStage}, yield: ${actualYield})`)
          }

          // HANDLE STRAW PRODUCTION
          const strawProducingCrops = ['wheat', 'barley', 'oat', 'sorghum', 'rye', 'corn']
          if (produceStraw === true && strawYield !== undefined && strawYield > 0 && strawProducingCrops.includes(cropForHistory.toLowerCase())) {
            console.log(`🌾 STRAW PRODUCTION: Creating straw storage for ${cropForHistory} harvest`)
            try {
              const tableAlias = usePostgres ? 'crop_storage' : 'cropStorage'
              const farmCol = usePostgres ? '"farmId"' : 'farmId'
              const cropCol = usePostgres ? 'crop_name' : 'cropName'
              const unitCol = usePostgres ? 'storage_unit' : 'storageUnit'
              const locCol = usePostgres ? 'storage_location' : 'storageLocation'
              const updCol = usePostgres ? 'last_updated' : 'lastUpdated'

              // Use user-provided straw yield directly (already in bale count)
              const strawQuantity = strawYield
              
              // Determine bale column name for straw using strawBaleSize and strawBaleShape
              let strawBaleColName = ''
              if (strawBaleSize && strawBaleShape) {
                if (strawBaleSize === 180 && strawBaleShape === 'round') {
                  strawBaleColName = usePostgres ? 'bale_180_round' : 'bale180Round'
                } else if (strawBaleSize === 180 && strawBaleShape === 'square') {
                  strawBaleColName = usePostgres ? 'bale_180_square' : 'bale180Square'
                } else if (strawBaleSize === 220 && strawBaleShape === 'round') {
                  strawBaleColName = usePostgres ? 'bale_220_round' : 'bale220Round'
                } else if (strawBaleSize === 220 && strawBaleShape === 'square') {
                  strawBaleColName = usePostgres ? 'bale_220_square' : 'bale220Square'
                } else if (strawBaleSize === 240 && strawBaleShape === 'round') {
                  strawBaleColName = usePostgres ? 'bale_240_round' : 'bale240Round'
                } else if (strawBaleSize === 240 && strawBaleShape === 'square') {
                  strawBaleColName = usePostgres ? 'bale_240_square' : 'bale240Square'
                }
              }

              // Check if straw storage already exists for this farm
              const existingStrawStorage = await db.queryOne<any>(
                prepareSql(`
                  SELECT * FROM ${tableAlias}
                  WHERE ${farmCol} = ? AND ${cropCol} = ?
                `, usePostgres),
                [oldField.farmId, 'Straw']
              )

              if (existingStrawStorage) {
                // Update existing straw storage
                if (strawBaleColName) {
                  const currentBales = existingStrawStorage[strawBaleColName] || 0
                  const newBales = currentBales + strawQuantity
                  console.log(`🌾 STRAW PRODUCTION: Adding ${strawQuantity.toFixed(0)} ${strawBaleSize}kg ${strawBaleShape} straw bales to existing storage (now ${newBales.toFixed(0)})`)
                  await db.run(
                    prepareSql(`
                      UPDATE ${tableAlias}
                      SET ${strawBaleColName} = ${strawBaleColName} + ?, ${updCol} = CURRENT_TIMESTAMP
                      WHERE id = ?
                    `, usePostgres),
                    [strawQuantity, existingStrawStorage.id]
                  )
                }
              } else {
                // Create new straw storage entry
                if (strawBaleColName) {
                  console.log(`🌾 STRAW PRODUCTION: Creating NEW straw storage with ${strawQuantity.toFixed(0)} ${strawBaleSize}kg ${strawBaleShape} bales`)
                  const insertValues = [oldField.farmId, 'Straw', 'bales', strawQuantity, null, `Straw from ${cropForHistory} harvest, Field ${oldField.fieldNumber}`]
                  await db.run(
                    prepareSql(`
                      INSERT INTO ${tableAlias} (${farmCol}, ${cropCol}, ${unitCol}, ${strawBaleColName}, ${locCol}, notes)
                      VALUES (?, ?, ?, ?, ?, ?)
                    `, usePostgres),
                    insertValues
                  )
                }
              }
              console.log(`✅ STRAW PRODUCTION: Successfully added straw to storage`)
            } catch (strawError) {
              console.warn('❌ Warning: Failed to add straw to storage:', strawError)
              // Don't fail the harvest if straw storage update fails
            }
          }
        }
      }
    } else {
      console.log(`📋 No history action: oldStage=${oldField?.growthStage}, newStage=${growthStage}`)
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
