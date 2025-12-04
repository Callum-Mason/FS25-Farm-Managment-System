import express, { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { verifyFarmMembership } from '../middleware/farmAccess.js'
import { getDbAdapter } from '../database.js'
import { prepareSql, isPostgres } from '../db-adapter.js'

const router = express.Router()

export interface ActivityLog {
  id: number
  farmId: number
  userId: number
  action: string
  entityType: string
  entityId: number | null
  description: string | null
  createdAt: string
  userName?: string
}

// GET /api/farms/:farmId/activity - Get activity log
router.get('/:farmId/activity', authenticateToken, verifyFarmMembership, async (req: AuthRequest, res: Response) => {
  try {
    const { farmId } = req.params
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const offset = parseInt(req.query.offset as string) || 0

    const db = getDbAdapter()
    const usePostgres = isPostgres()

    const activities = await db.query<ActivityLog>(
      prepareSql(`
        SELECT 
          al.*,
          u.name as "userName"
        FROM activity_log al
        LEFT JOIN users u ON al."userId" = u.id
        WHERE al."farmId" = ?
        ORDER BY al."createdAt" DESC
        LIMIT ? OFFSET ?
      `, usePostgres),
      [farmId, limit, offset]
    )

    // Convert snake_case to camelCase
    const converted = activities.map((activity: any) => {
      const result: any = { ...activity }
      if ('entity_type' in result) result.entityType = result.entity_type
      if ('entity_id' in result) result.entityId = result.entity_id
      if ('created_at' in result) result.createdAt = result.created_at
      if ('user_name' in result) result.userName = result.user_name
      return result
    })

    res.json(converted)
  } catch (error) {
    console.error('Get activity log error:', error)
    res.status(500).json({ error: 'Failed to fetch activity log' })
  }
})

// Internal helper function to log activity (called from other routes)
export async function logActivity(
  farmId: number,
  userId: number,
  action: string,
  entityType: string,
  entityId: number | null = null,
  description: string | null = null
) {
  try {
    const db = getDbAdapter()
    const usePostgres = isPostgres()

    const columnNames = usePostgres
      ? `"farmId", "userId", action, entity_type, entity_id, description`
      : `"farmId", "userId", action, entity_type, entity_id, description`

    await db.run(
      prepareSql(
        `INSERT INTO activity_log (${columnNames}) VALUES (?, ?, ?, ?, ?, ?)`,
        usePostgres
      ),
      [farmId, userId, action, entityType, entityId, description]
    )
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw - activity logging should not break the main operation
  }
}

export default router
