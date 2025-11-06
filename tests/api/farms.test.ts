import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app, server } from '../../server/index.js'
import { initDatabase, closeDatabase } from '../../server/database.js'

describe('Farms API', () => {
  let authToken: string
  let farmId: number

  beforeAll(async () => {
    process.env.DB_FILE = './data/farm_manager.test.db'
    initDatabase('./data/farm_manager.test.db')

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@farm.local',
        password: 'Demo1234!'
      })

    authToken = loginResponse.body.token
  })

  afterAll(() => {
    closeDatabase()
    server.close()
  })

  it('should create a new farm and make user owner', async () => {
    const response = await request(app)
      .post('/api/farms')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Farm',
        mapName: 'Test Map'
      })

    expect(response.status).toBe(201)
    expect(response.body.name).toBe('Test Farm')
    farmId = response.body.id
  })

  it('should list farms that user is a member of', async () => {
    const response = await request(app)
      .get('/api/farms')
      .set('Authorization', `Bearer ${authToken}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body.length).toBeGreaterThan(0)
  })

  it('should return 403 when accessing farm user is not member of', async () => {
    // Register a new user
    const newUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Other1234!'
      })

    const otherToken = newUserResponse.body.token

    // Try to access fields from farm they're not a member of
    const response = await request(app)
      .get(`/api/farms/${farmId}/fields`)
      .set('Authorization', `Bearer ${otherToken}`)

    expect(response.status).toBe(403)
  })
})
