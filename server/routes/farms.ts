import express, { Response } from 'express'
import { nanoid } from 'nanoid'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { verifyFarmMembership } from '../middleware/farmAccess.js'
import { getDbAdapter, Farm } from '../database.js'
import { prepareSql, isPostgres } from '../db-adapter.js'

const router = express.Router()

// GET /api/farms - Get all farms user is a member of
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    const farms = await db.query(
      prepareSql(`
        SELECT f.*, fm.role as "userRole" FROM farms f
        INNER JOIN "farmMembers" fm ON f.id = fm."farmId"
        WHERE fm."userId" = ?
      `, usePostgres),
      [req.userId]
    )

    res.json(farms)
  } catch (error) {
    console.error('Get farms error:', error)
    res.status(500).json({ error: 'Failed to fetch farms' })
  }
})

// GET /api/farms/:farmId/role - Get user's role for a specific farm
router.get('/:farmId/role', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    const member = await db.queryOne<{ role: string }>(
      prepareSql('SELECT role FROM "farmMembers" WHERE "farmId" = ? AND "userId" = ?', usePostgres),
      [farmId, req.userId]
    )

    if (!member) {
      return res.status(404).json({ error: 'Not a member of this farm' })
    }

    res.json({ role: member.role })
  } catch (error) {
    console.error('Get role error:', error)
    res.status(500).json({ error: 'Failed to fetch role' })
  }
})

// POST /api/farms - Create a new farm
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const db = getDbAdapter()
  const usePostgres = isPostgres()
  
  try {
    const { name, mapName, startingFunds } = req.body

    if (!name || !mapName) {
      return res.status(400).json({ error: 'Farm name and map name are required' })
    }

    // Ensure the authenticated user exists (prevent FK constraint failures when token refers to missing user)
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const existingUser = await db.queryOne(
      prepareSql('SELECT id FROM users WHERE id = ?', usePostgres),
      [req.userId]
    )

    if (!existingUser) {
      return res.status(401).json({ error: 'Authenticated user not found, please log in' })
    }

    // Insert farm
    let farmId: number

    if (usePostgres) {
      const result = await db.query<{ id: number }>(
        prepareSql('INSERT INTO farms (name, "mapName", "createdByUserId") VALUES (?, ?, ?) RETURNING id', usePostgres),
        [name, mapName, req.userId]
      )
      farmId = result[0].id
    } else {
      const result = await db.run(
        prepareSql('INSERT INTO farms (name, "mapName", "createdByUserId") VALUES (?, ?, ?)', usePostgres),
        [name, mapName, req.userId]
      )
      farmId = result.lastID!
    }

    // Add creator as owner
    await db.run(
      prepareSql('INSERT INTO "farmMembers" ("farmId", "userId", role, "joinedAt") VALUES (?, ?, ?, ?)', usePostgres),
      [farmId, req.userId, 'owner', new Date().toISOString()]
    )

    // If starting funds provided, create opening balance entry
    if (startingFunds && startingFunds > 0) {
      await db.run(
        prepareSql(`
          INSERT INTO finances ("farmId", "gameYear", "gameMonth", "gameDay", type, category, description, amount, "createdByUserId")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, usePostgres),
        [
          farmId,
          1, // Year 1
          1, // Month 1 (January)
          1, // Day 1
          'income',
          'Starting Balance',
          'Opening balance for new farm',
          startingFunds,
          req.userId
        ]
      )
    }

    const farm = await db.queryOne(
      prepareSql(`
        SELECT f.*, fm.role as "userRole" FROM farms f
        INNER JOIN "farmMembers" fm ON f.id = fm."farmId"
        WHERE f.id = ? AND fm."userId" = ?
      `, usePostgres),
      [farmId, req.userId]
    )
    
    res.status(201).json(farm)
  } catch (error) {
    console.error('Create farm error:', error)
    res.status(500).json({ error: 'Failed to create farm' })
  }
})

// POST /api/farms/:farmId/join - Join a farm with a code
router.post('/:farmId/join', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const { joinCode } = req.body

    if (!joinCode) {
      return res.status(400).json({ error: 'Join code is required' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    // Verify join code
    const expiryCheck = usePostgres 
      ? '"expiresAt"::timestamp > CURRENT_TIMESTAMP'
      : '"expiresAt" > datetime(\'now\')'
    
    const codeRecord = await db.queryOne(
      prepareSql(`SELECT * FROM "joinCodes" WHERE "farmId" = ? AND code = ? AND ${expiryCheck}`, usePostgres),
      [farmId, joinCode]
    )

    if (!codeRecord) {
      return res.status(400).json({ error: 'Invalid or expired join code' })
    }

    // Check if already a member
    const existing = await db.queryOne(
      prepareSql('SELECT id FROM "farmMembers" WHERE "farmId" = ? AND "userId" = ?', usePostgres),
      [farmId, req.userId]
    )

    if (existing) {
      return res.status(400).json({ error: 'You are already a member of this farm' })
    }

    // Add as viewer
    await db.run(
      prepareSql('INSERT INTO "farmMembers" ("farmId", "userId", role) VALUES (?, ?, ?)', usePostgres),
      [farmId, req.userId, 'viewer']
    )

    res.json({ message: 'Successfully joined farm' })
  } catch (error) {
    console.error('Join farm error:', error)
    res.status(500).json({ error: 'Failed to join farm' })
  }
})

// POST /api/farms/join - Join a farm with just a code (finds farm automatically)
router.post('/join', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { joinCode } = req.body

    if (!joinCode) {
      return res.status(400).json({ error: 'Join code is required' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    // Find the farm by join code
    const expiryCheck = usePostgres 
      ? '"expiresAt"::timestamp > CURRENT_TIMESTAMP'
      : '"expiresAt" > datetime(\'now\')'
    
    const codeRecord = await db.queryOne<{ farmId: number }>(
      prepareSql(`SELECT * FROM "joinCodes" WHERE code = ? AND ${expiryCheck}`, usePostgres),
      [joinCode]
    )

    if (!codeRecord) {
      return res.status(400).json({ error: 'Invalid or expired join code' })
    }

    const farmId = codeRecord.farmId

    // Check if already a member
    const existing = await db.queryOne(
      prepareSql('SELECT id FROM "farmMembers" WHERE "farmId" = ? AND "userId" = ?', usePostgres),
      [farmId, req.userId]
    )

    if (existing) {
      return res.status(400).json({ error: 'You are already a member of this farm' })
    }

    // Add as viewer
    await db.run(
      prepareSql('INSERT INTO "farmMembers" ("farmId", "userId", role) VALUES (?, ?, ?)', usePostgres),
      [farmId, req.userId, 'viewer']
    )

    // Get the farm details to return
    const farm = await db.queryOne<Farm>(
      prepareSql('SELECT * FROM farms WHERE id = ?', usePostgres),
      [farmId]
    )

    res.json({ message: 'Successfully joined farm', farm })
  } catch (error) {
    console.error('Join farm error:', error)
    res.status(500).json({ error: 'Failed to join farm' })
  }
})

// POST /api/farms/:farmId/codes - Create join code (owner only)
router.post('/:farmId/codes', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const role = req.body._userRole

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only farm owners can create join codes' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()
    const code = nanoid(10)
    
    // Expires in 7 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await db.run(
      prepareSql('INSERT INTO "joinCodes" ("farmId", code, "expiresAt") VALUES (?, ?, ?)', usePostgres),
      [farmId, code, expiresAt.toISOString()]
    )

    res.json({ code, expiresAt: expiresAt.toISOString() })
  } catch (error) {
    console.error('Create join code error:', error)
    res.status(500).json({ error: 'Failed to create join code' })
  }
})

// PATCH /api/farms/:farmId - Update farm details (owner only)
router.patch('/:farmId', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const role = req.body._userRole

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only farm owners can update farm details' })
    }

    const { name, mapName, currency, daysPerMonth } = req.body
    const db = getDbAdapter()
    const usePostgres = isPostgres()

    const updates: string[] = []
    const values: any[] = []

    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name)
    }
    if (mapName !== undefined) {
      updates.push('"mapName" = ?')
      values.push(mapName)
    }
    if (currency !== undefined) {
      updates.push('currency = ?')
      values.push(currency)
    }
    if (daysPerMonth !== undefined) {
      updates.push('"daysPerMonth" = ?')
      values.push(daysPerMonth)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' })
    }

    values.push(farmId)
    
    await db.run(
      prepareSql(`UPDATE farms SET ${updates.join(', ')} WHERE id = ?`, usePostgres),
      values
    )

    const farm = await db.queryOne<Farm>(
      prepareSql('SELECT * FROM farms WHERE id = ?', usePostgres),
      [farmId]
    )
    
    res.json(farm)
  } catch (error) {
    console.error('Update farm error:', error)
    res.status(500).json({ error: 'Failed to update farm' })
  }
})

// POST /api/farms/:farmId/advance-date - Advance the game date by one day
router.post('/:farmId/advance-date', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()

    // Get current farm date
    const farm = await db.queryOne<Farm>(
      prepareSql('SELECT * FROM farms WHERE id = ?', usePostgres),
      [farmId]
    )

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' })
    }

    let { currentYear, currentMonth, currentDay, daysPerMonth } = farm

    // Advance day
    currentDay++

    // Check if we need to advance month
    if (currentDay > daysPerMonth) {
      currentDay = 1
      currentMonth++

      // Check if we need to advance year
      if (currentMonth > 12) {
        currentMonth = 1
        currentYear++
      }
    }

    // Update the farm
    await db.run(
      prepareSql(`
        UPDATE farms 
        SET "currentYear" = ?, "currentMonth" = ?, "currentDay" = ?
        WHERE id = ?
      `, usePostgres),
      [currentYear, currentMonth, currentDay, farmId]
    )

    // Return updated farm
    const updatedFarm = await db.queryOne<Farm>(
      prepareSql('SELECT * FROM farms WHERE id = ?', usePostgres),
      [farmId]
    )

    res.json(updatedFarm)
  } catch (error) {
    console.error('Advance date error:', error)
    res.status(500).json({ error: 'Failed to advance date' })
  }
})

// POST /api/farms/:farmId/retreat-date - Go back one day
router.post('/:farmId/retreat-date', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const db = getDbAdapter()
    const usePostgres = isPostgres()

    // Get current farm date
    const farm = await db.queryOne<Farm>(
      prepareSql('SELECT * FROM farms WHERE id = ?', usePostgres),
      [farmId]
    )

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' })
    }

    let { currentYear, currentMonth, currentDay, daysPerMonth } = farm

    // Check if we're at the earliest possible date
    if (currentYear === 1 && currentMonth === 1 && currentDay === 1) {
      return res.status(400).json({ error: 'Cannot go before Year 1, Month 1, Day 1' })
    }

    // Retreat day
    currentDay--

    // Check if we need to go back a month
    if (currentDay < 1) {
      currentMonth--

      // Check if we need to go back a year
      if (currentMonth < 1) {
        currentMonth = 12
        currentYear--
      }
      
      // Set to last day of previous month
      currentDay = daysPerMonth
    }

    // Update the farm
    await db.run(
      prepareSql(`
        UPDATE farms 
        SET "currentYear" = ?, "currentMonth" = ?, "currentDay" = ?
        WHERE id = ?
      `, usePostgres),
      [currentYear, currentMonth, currentDay, farmId]
    )

    // Return updated farm
    const updatedFarm = await db.queryOne<Farm>(
      prepareSql('SELECT * FROM farms WHERE id = ?', usePostgres),
      [farmId]
    )

    res.json(updatedFarm)
  } catch (error) {
    console.error('Retreat date error:', error)
    res.status(500).json({ error: 'Failed to retreat date' })
  }
})

// POST /api/farms/:farmId/jump-to-date - Jump to a specific date
router.post('/:farmId/jump-to-date', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const { year, month, day } = req.body
    const role = req.body._userRole

    // Only owners can jump to dates
    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only farm owners can jump to dates' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()

    // Get current farm
    const farm = await db.queryOne<Farm>(
      prepareSql('SELECT * FROM farms WHERE id = ?', usePostgres),
      [farmId]
    )

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' })
    }

    // Validate input
    if (!year || !month || !day) {
      return res.status(400).json({ error: 'Year, month, and day are required' })
    }

    if (year < 1) {
      return res.status(400).json({ error: 'Year must be at least 1' })
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'Month must be between 1 and 12' })
    }

    if (day < 1 || day > farm.daysPerMonth) {
      return res.status(400).json({ error: `Day must be between 1 and ${farm.daysPerMonth}` })
    }

    // Update the farm date
    await db.run(
      prepareSql(`
        UPDATE farms 
        SET "currentYear" = ?, "currentMonth" = ?, "currentDay" = ?
        WHERE id = ?
      `, usePostgres),
      [year, month, day, farmId]
    )

    // Return updated farm
    const updatedFarm = await db.queryOne<Farm>(
      prepareSql('SELECT * FROM farms WHERE id = ?', usePostgres),
      [farmId]
    )

    res.json(updatedFarm)
  } catch (error) {
    console.error('Jump to date error:', error)
    res.status(500).json({ error: 'Failed to jump to date' })
  }
})

// GET /api/farms/:farmId/members - Get farm members (owner/editor only)
router.get('/:farmId/members', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const role = req.body._userRole

    if (role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot see member list' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    const members = await db.query(
      prepareSql(`
        SELECT fm.id, fm."userId", fm.role, u.name, u.email, fm."joinedAt"
        FROM "farmMembers" fm
        INNER JOIN users u ON fm."userId" = u.id
        WHERE fm."farmId" = ?
        ORDER BY 
          CASE fm.role 
            WHEN 'owner' THEN 1 
            WHEN 'editor' THEN 2 
            WHEN 'viewer' THEN 3 
          END, u.name
      `, usePostgres),
      [farmId]
    )

    res.json(members)
  } catch (error) {
    console.error('Get members error:', error)
    res.status(500).json({ error: 'Failed to fetch members' })
  }
})

// PATCH /api/farms/:farmId/members/:memberId - Update member role (owner only)
router.patch('/:farmId/members/:memberId', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId, memberId } = req.params
    const { role: newRole } = req.body
    const userRole = req.body._userRole

    if (userRole !== 'owner') {
      return res.status(403).json({ error: 'Only farm owners can change member roles' })
    }

    if (!['owner', 'editor', 'viewer'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()

    // Prevent changing own role if last owner
    const member = await db.queryOne<{ userId: number }>(
      prepareSql('SELECT "userId" FROM "farmMembers" WHERE id = ?', usePostgres),
      [memberId]
    )
    
    if (member && member.userId === req.userId && newRole !== 'owner') {
      const ownerCount = await db.queryOne<{ count: number }>(
        prepareSql('SELECT COUNT(*) as count FROM "farmMembers" WHERE "farmId" = ? AND role = ?', usePostgres),
        [farmId, 'owner']
      )
      if (ownerCount && ownerCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last owner' })
      }
    }

    await db.run(
      prepareSql('UPDATE "farmMembers" SET role = ? WHERE id = ? AND "farmId" = ?', usePostgres),
      [newRole, memberId, farmId]
    )

    res.json({ message: 'Member role updated successfully' })
  } catch (error) {
    console.error('Update member role error:', error)
    res.status(500).json({ error: 'Failed to update member role' })
  }
})

// DELETE /api/farms/:farmId/members/:memberId - Remove member (owner only)
router.delete('/:farmId/members/:memberId', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId, memberId } = req.params
    const userRole = req.body._userRole

    if (userRole !== 'owner') {
      return res.status(403).json({ error: 'Only farm owners can remove members' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()

    // Prevent removing self if last owner
    const member = await db.queryOne<{ userId: number, role: string }>(
      prepareSql('SELECT "userId", role FROM "farmMembers" WHERE id = ?', usePostgres),
      [memberId]
    )
    
    if (member && member.userId === req.userId && member.role === 'owner') {
      const ownerCount = await db.queryOne<{ count: number }>(
        prepareSql('SELECT COUNT(*) as count FROM "farmMembers" WHERE "farmId" = ? AND role = ?', usePostgres),
        [farmId, 'owner']
      )
      if (ownerCount && ownerCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last owner' })
      }
    }

    await db.run(
      prepareSql('DELETE FROM "farmMembers" WHERE id = ? AND "farmId" = ?', usePostgres),
      [memberId, farmId]
    )

    res.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Remove member error:', error)
    res.status(500).json({ error: 'Failed to remove member' })
  }
})

// GET /api/farms/:farmId/codes - Get active join codes (owner only)
router.get('/:farmId/codes', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const role = req.body._userRole

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only farm owners can view join codes' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    const expiryCheck = usePostgres 
      ? '"expiresAt"::timestamp > CURRENT_TIMESTAMP'
      : '"expiresAt" > datetime(\'now\')'
    
    const codes = await db.query(
      prepareSql(`
        SELECT * FROM "joinCodes" 
        WHERE "farmId" = ? AND ${expiryCheck}
        ORDER BY "createdAt" DESC
      `, usePostgres),
      [farmId]
    )

    res.json(codes)
  } catch (error) {
    console.error('Get join codes error:', error)
    res.status(500).json({ error: 'Failed to fetch join codes' })
  }
})

// DELETE /api/farms/:farmId - Delete a farm (owner only)
router.delete('/:farmId', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const role = req.body._userRole

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Only farm owners can delete farms' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    // Delete the farm (CASCADE will handle related data)
    await db.run(
      prepareSql('DELETE FROM farms WHERE id = ?', usePostgres),
      [farmId]
    )

    res.json({ message: 'Farm deleted successfully' })
  } catch (error) {
    console.error('Delete farm error:', error)
    res.status(500).json({ error: 'Failed to delete farm' })
  }
})

export default router
