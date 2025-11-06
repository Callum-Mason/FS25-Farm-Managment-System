import bcrypt from 'bcrypt'
import { getDbAdapter } from './database.js'
import { prepareSql, isPostgres } from './db-adapter.js'

export async function seedDatabase() {
  const db = getDbAdapter()
  const usePostgres = isPostgres()
  
  // Check if there are any users
  const userCount = await db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM users'
  )
  
  if (userCount && userCount.count > 0) {
    return // Already seeded
  }

  console.log('Seeding database with demo data...')

  // Create demo user
  const passwordHash = await bcrypt.hash('Demo1234!', 10)
  let userId: number
  
  if (usePostgres) {
    const userResult = await db.queryOne<{ id: number }>(
      prepareSql('INSERT INTO users (name, email, "passwordHash") VALUES (?, ?, ?) RETURNING id', usePostgres),
      ['Demo User', 'demo@farm.local', passwordHash]
    )
    userId = userResult!.id
  } else {
    const demoResult = await db.run(
      'INSERT INTO users (name, email, "passwordHash") VALUES (?, ?, ?)',
      ['Demo User', 'demo@farm.local', passwordHash]
    )
    userId = demoResult.lastID!
  }

  // Create demo farm
  let farmId: number
  
  if (usePostgres) {
    const farmResult = await db.queryOne<{ id: number }>(
      prepareSql('INSERT INTO farms (name, "mapName", "createdByUserId") VALUES (?, ?, ?) RETURNING id', usePostgres),
      ['Elm Farm', 'Suffolk', userId]
    )
    farmId = farmResult!.id
  } else {
    const farmResult = await db.run(
      'INSERT INTO farms (name, "mapName", "createdByUserId") VALUES (?, ?, ?)',
      ['Elm Farm', 'Suffolk', userId]
    )
    farmId = farmResult.lastID!
  }

  // Add user as owner
  await db.run(
    prepareSql(`INSERT INTO "farmMembers" ("farmId", "userId", role) VALUES (?, ?, 'owner')`, usePostgres),
    [farmId, userId]
  )

  // Add 3 fields
  await db.run(
    prepareSql(`
      INSERT INTO fields ("farmId", "fieldNumber", name, "sizeHectares", "currentCrop", "growthStage", "fertiliserState", "weedsState", notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, usePostgres),
    [farmId, 1, 'Lower Meadow', 12.5, 'Wheat', 'Ready to Harvest', null, null, 'Good drainage']
  )

  await db.run(
    prepareSql(`
      INSERT INTO fields ("farmId", "fieldNumber", name, "sizeHectares", "currentCrop", "growthStage", "fertiliserState", "weedsState", notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, usePostgres),
    [farmId, 2, 'Top Field', 18.3, 'Barley', 'Growing', 'Stage 2', 'Light', 'Clay soil']
  )

  await db.run(
    prepareSql(`
      INSERT INTO fields ("farmId", "fieldNumber", name, "sizeHectares", "currentCrop", "growthStage", "fertiliserState", "weedsState", notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, usePostgres),
    [farmId, 3, 'Oak Field', 9.7, null, null, null, null, 'Ready for planting']
  )

  // Add 1 tractor
  await db.run(
    prepareSql(`
      INSERT INTO equipment ("farmId", model, category, brand, owned, leased, "dailyCost", condition, "purchasePrice", "purchaseDate", sold, "salePrice", "saleDate", notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, usePostgres),
    [farmId, 'T6.180', 'Tractor', 'New Holland', 1, 0, 0, 95, 125000, '2024-01-15', 0, 0, null, 'Main workhorse']
  )

  // Add opening balance
  // The finances table uses gameYear/gameMonth/gameDay fields (not a single `date` column).
  // Insert using those columns so seeding works for both SQLite and Postgres.
  const now = new Date()
  const gameYear = now.getFullYear()
  const gameMonth = now.getMonth() + 1
  const gameDay = now.getDate()

  await db.run(
    prepareSql(`
      INSERT INTO finances ("farmId", "gameYear", "gameMonth", "gameDay", type, category, description, amount, "createdByUserId")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, usePostgres),
    [farmId, gameYear, gameMonth, gameDay, 'income', 'Starting Balance', 'Opening balance', 100000, userId]
  )

  console.log('Demo data seeded successfully')
  console.log('Login with: demo@farm.local / Demo1234!')
}
