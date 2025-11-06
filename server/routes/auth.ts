import express, { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getDbAdapter, User } from '../database.js'
import { prepareSql, isPostgres } from '../db-adapter.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = express.Router()

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    // Check if user exists
    const existingUser = await db.queryOne(
      prepareSql('SELECT id FROM users WHERE email = ?', usePostgres),
      [email]
    )
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Insert user (use RETURNING for PostgreSQL compatibility)
    let userId: number

    if (usePostgres) {
      const result = await db.queryOne<User>(
        prepareSql('INSERT INTO users (name, email, "passwordHash") VALUES (?, ?, ?) RETURNING id', usePostgres),
        [name, email, passwordHash]
      )
      userId = result!.id
    } else {
      const result = await db.run(
        'INSERT INTO users (name, email, "passwordHash") VALUES (?, ?, ?)',
        [name, email, passwordHash]
      )
      userId = result.lastID!
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET || 'default-secret'
    const token = jwt.sign({ userId }, secret, { expiresIn: '7d' })

    res.status(201).json({ token, userId, name, email })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Failed to register user' })
  }
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    const user = await db.queryOne<User>(
      prepareSql('SELECT * FROM users WHERE email = ?', usePostgres),
      [email]
    )

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET || 'default-secret'
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' })

    res.json({ token, userId: user.id, name: user.name, email: user.email })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Failed to log in' })
  }
})

// DELETE /api/auth/account - Delete user account
router.delete('/account', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!
    const db = getDbAdapter()
    const usePostgres = isPostgres()
    
    console.log('Deleting account for user:', userId)
    console.log('Using PostgreSQL:', usePostgres)
    
    // First, delete all farms where the user is the owner
    // This will cascade delete all related data (farm_members, fields, animals, equipment, finances, etc.)
    // Use quoted identifiers for PostgreSQL, unquoted for SQLite
    const deleteFarmsSql = usePostgres 
      ? 'DELETE FROM farms WHERE "createdByUserId" = $1'
      : 'DELETE FROM farms WHERE createdByUserId = ?'
    
    console.log('Delete farms SQL:', deleteFarmsSql)
    await db.run(deleteFarmsSql, [userId])
    console.log('Farms deleted successfully')

    // Then delete the user
    // This will cascade delete remaining farm memberships where they're just a member
    const deleteUserSql = usePostgres
      ? 'DELETE FROM users WHERE id = $1'
      : 'DELETE FROM users WHERE id = ?'
    
    console.log('Delete user SQL:', deleteUserSql)
    await db.run(deleteUserSql, [userId])
    console.log('User deleted successfully')

    res.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})

export default router
