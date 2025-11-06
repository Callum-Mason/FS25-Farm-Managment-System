import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app, server } from '../../server/index.js'
import { initDatabase, closeDatabase } from '../../server/database.js'

describe('Fields API', () => {
  let authToken: string
  let farmId: number
  let fieldId: number

  beforeAll(async () => {
    process.env.DB_FILE = './data/farm_manager.test.db'
    initDatabase('./data/farm_manager.test.db')

    // Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@farm.local',
        password: 'Demo1234!'
      })

    authToken = loginResponse.body.token

    // Get first farm
    const farmsResponse = await request(app)
      .get('/api/farms')
      .set('Authorization', `Bearer ${authToken}`)

    farmId = farmsResponse.body[0].id
  })

  afterAll(() => {
    closeDatabase()
    server.close()
  })

  it('should create a field under a farm', async () => {
    const response = await request(app)
      .post(`/api/farms/${farmId}/fields`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fieldNumber: 99,
        name: 'Test Field',
        sizeHectares: 15.5,
        currentCrop: 'Wheat'
      })

    expect(response.status).toBe(201)
    expect(response.body.name).toBe('Test Field')
    expect(response.body.sizeHectares).toBe(15.5)
    fieldId = response.body.id
  })

  it('should retrieve created field', async () => {
    const response = await request(app)
      .get(`/api/farms/${farmId}/fields`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    
    const testField = response.body.find((f: any) => f.id === fieldId)
    expect(testField).toBeDefined()
    expect(testField.name).toBe('Test Field')
  })

  it('should update a field', async () => {
    const response = await request(app)
      .patch(`/api/fields/${fieldId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        growthStage: 'Harvest Ready',
        fertiliserState: 'Fully Fertilised'
      })

    expect(response.status).toBe(200)
    expect(response.body.growthStage).toBe('Harvest Ready')
  })
})
