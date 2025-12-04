import express, { Request, Response, NextFunction } from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import dotenv from 'dotenv'
import { initDatabase, closeDatabase } from './database.js'
import authRoutes from './routes/auth.js'
import farmRoutes from './routes/farms.js'
import fieldRoutes from './routes/fields.js'
import animalRoutes from './routes/animals.js'
import equipmentRoutes from './routes/equipment.js'
import financeRoutes from './routes/finances.js'
import activityRoutes from './routes/activity.js'
import storageRoutes from './routes/storage.js'
import { seedDatabase } from './seed.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Initialize database and start server (async)
;(async () => {
  try {
    await initDatabase()
    await seedDatabase()
    console.log('✓ Database initialized successfully')
    
    // Start server after database is ready
    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`)
    })
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...')
      await closeDatabase()
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })
  } catch (error) {
    console.error('✗ Failed to initialize:', error)
    process.exit(1)
  }
})()

export { app }

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/farms', farmRoutes)
app.use('/api/farms', fieldRoutes)
app.use('/api', fieldRoutes) // Also mount for /api/fields/:id routes
app.use('/api/farms', animalRoutes)
app.use('/api/farms', equipmentRoutes)
app.use('/api', equipmentRoutes) // Also mount for /api/equipment/:id routes
app.use('/api/farms', financeRoutes)
app.use('/api/farms', activityRoutes)
app.use('/api/farms', storageRoutes)

// Serve frontend
if (process.env.NODE_ENV === 'production') {
  const distPath = join(process.cwd(), 'dist')
  app.use(express.static(distPath))
  
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
} else {
  // Development: Use Vite middleware
  const { createServer } = await import('vite')
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  })
  app.use(vite.middlewares)
}

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})
