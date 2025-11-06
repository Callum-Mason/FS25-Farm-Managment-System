import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app, server } from '../../server/index.js'
import { initDatabase, closeDatabase } from '../../server/database.js'

describe('Auth API', () => {
  beforeAll(() => {
    process.env.DB_FILE = './data/farm_manager.test.db'
    initDatabase('./data/farm_manager.test.db')
  })

  afterAll(() => {
    closeDatabase()
    server.close()
  })

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test1234!'
      })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('token')
    expect(response.body.email).toBe('test@example.com')
  })

  it('should login with correct credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@farm.local',
        password: 'Demo1234!'
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('token')
  })

  it('should reject login with incorrect password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@farm.local',
        password: 'wrongpassword'
      })

    expect(response.status).toBe(401)
  })

  it('should delete user account and owned farms', async () => {
    // First, register a new user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Delete Test User',
        email: 'delete@example.com',
        password: 'Test1234!'
      })

    expect(registerResponse.status).toBe(201)
    const token = registerResponse.body.token

    // Create a farm for this user
    const farmResponse = await request(app)
      .post('/api/farms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Farm',
        mapName: 'Test Map'
      })

    expect(farmResponse.status).toBe(201)

    // Delete the account
    const deleteResponse = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${token}`)

    expect(deleteResponse.status).toBe(200)
    expect(deleteResponse.body.message).toBe('Account deleted successfully')

    // Try to login again - should fail
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'delete@example.com',
        password: 'Test1234!'
      })

    expect(loginResponse.status).toBe(401)
  })
})
