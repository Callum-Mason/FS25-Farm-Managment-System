import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.js'
import { getDbAdapter } from '../database.js'
import { prepareSql, isPostgres } from '../db-adapter.js'

export function verifyFarmMembership(req: AuthRequest, res: Response, next: NextFunction) {
  const farmId = req.params.farmId
  const userId = req.userId

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const db = getDbAdapter()
  const usePostgres = isPostgres()
  
  db.queryOne<{ role: string }>(
    prepareSql('SELECT role FROM "farmMembers" WHERE "farmId" = ? AND "userId" = ?', usePostgres),
    [farmId, userId]
  ).then(member => {
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this farm' })
    }

    req.body._userRole = member.role
    next()
  }).catch(error => {
    console.error('Farm membership check error:', error)
    res.status(500).json({ error: 'Failed to verify farm membership' })
  })
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.body._userRole

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}
