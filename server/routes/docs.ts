import express, { Request, Response } from 'express'

const router = express.Router()

// GET /api/docs - Get all API endpoints documentation
router.get('/', (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`
  
  // Check if request wants HTML (from browser) or JSON (from API client)
  const acceptsHtml = req.headers.accept?.includes('text/html')
  
  const docs = {
    version: '1.0.0',
    baseUrl: baseUrl,
    endpoints: {
      authentication: {
        register: {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register a new user account',
          requiresAuth: false,
          body: {
            name: 'string (required)',
            email: 'string (required)',
            password: 'string (required)'
          },
          response: {
            token: 'string',
            user: { id: 'number', name: 'string', email: 'string' }
          }
        },
        login: {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login with email and password',
          requiresAuth: false,
          body: {
            email: 'string (required)',
            password: 'string (required)'
          },
          response: {
            token: 'string',
            user: { id: 'number', name: 'string', email: 'string' }
          }
        }
      },
      farms: {
        listFarms: {
          method: 'GET',
          path: '/api/farms',
          description: 'Get all farms for authenticated user',
          requiresAuth: true,
          response: 'Array of farm objects'
        },
        createFarm: {
          method: 'POST',
          path: '/api/farms',
          description: 'Create a new farm',
          requiresAuth: true,
          body: {
            name: 'string (required)',
            mapName: 'string (required)',
            currency: 'string (optional, default: GBP)'
          },
          response: { farmId: 'number' }
        },
        getFarm: {
          method: 'GET',
          path: '/api/farms/:farmId',
          description: 'Get details of a specific farm',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          response: 'Farm object with details'
        },
        updateFarm: {
          method: 'PUT',
          path: '/api/farms/:farmId',
          description: 'Update farm details',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          body: {
            name: 'string (optional)',
            mapName: 'string (optional)',
            currency: 'string (optional)'
          },
          response: { message: 'string' }
        },
        deleteFarm: {
          method: 'DELETE',
          path: '/api/farms/:farmId',
          description: 'Delete a farm',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          response: { message: 'string' }
        },
        generateJoinCode: {
          method: 'POST',
          path: '/api/farms/:farmId/join-code',
          description: 'Generate a join code for farm',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          response: { code: 'string', expiresAt: 'timestamp' }
        },
        joinFarm: {
          method: 'POST',
          path: '/api/farms/join',
          description: 'Join a farm using a code',
          requiresAuth: true,
          body: { code: 'string (required)' },
          response: { farmId: 'number', message: 'string' }
        }
      },
      fields: {
        listFields: {
          method: 'GET',
          path: '/api/farms/:farmId/fields',
          description: 'Get all fields for a farm',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          response: 'Array of field objects'
        },
        getField: {
          method: 'GET',
          path: '/api/fields/:fieldId',
          description: 'Get details of a specific field',
          requiresAuth: true,
          params: { fieldId: 'number (required)' },
          response: 'Field object with details'
        },
        createField: {
          method: 'POST',
          path: '/api/farms/:farmId/fields',
          description: 'Create a new field',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          body: {
            fieldNumber: 'number (required)',
            name: 'string (required)',
            sizeHectares: 'number (required)',
            currentCrop: 'string (optional)',
            growthStage: 'string (optional)',
            fertiliserState: 'string (optional)',
            weedsState: 'string (optional)',
            notes: 'string (optional)'
          },
          response: { fieldId: 'number' }
        },
        updateField: {
          method: 'PATCH',
          path: '/api/fields/:fieldId',
          description: 'Update field details',
          requiresAuth: true,
          params: { fieldId: 'number (required)' },
          body: 'Any field properties to update',
          response: { message: 'string' }
        },
        bulkUpdateFields: {
          method: 'PATCH',
          path: '/api/farms/:farmId/fields/bulk',
          description: 'Update multiple fields at once',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          body: {
            fieldIds: 'Array<number> (required)',
            updates: 'object (required) - properties to update'
          },
          response: { message: 'string', updated: 'number' }
        },
        deleteField: {
          method: 'DELETE',
          path: '/api/fields/:fieldId',
          description: 'Delete a field',
          requiresAuth: true,
          params: { fieldId: 'number (required)' },
          response: { message: 'string' }
        },
        getFieldHistory: {
          method: 'GET',
          path: '/api/fields/:fieldId/history',
          description: 'Get history of actions for a field',
          requiresAuth: true,
          params: { fieldId: 'number (required)' },
          response: 'Array of history entries'
        },
        addFieldHistory: {
          method: 'POST',
          path: '/api/fields/:fieldId/history',
          description: 'Add a history entry for a field',
          requiresAuth: true,
          params: { fieldId: 'number (required)' },
          body: {
            crop: 'string (required)',
            action: 'string (required)',
            growthStage: 'string (optional)',
            notes: 'string (optional)'
          },
          response: { historyId: 'number' }
        }
      },
      animals: {
        listAnimals: {
          method: 'GET',
          path: '/api/farms/:farmId/animals',
          description: 'Get all animals for a farm',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          response: 'Array of animal groups'
        },
        createAnimal: {
          method: 'POST',
          path: '/api/farms/:farmId/animals',
          description: 'Add an animal group',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          body: {
            type: 'string (required)',
            count: 'number (required)',
            feedPerDay: 'number (required)',
            productivity: 'number (required)',
            notes: 'string (optional)'
          },
          response: { animalId: 'number' }
        },
        updateAnimal: {
          method: 'PUT',
          path: '/api/farms/:farmId/animals/:animalId',
          description: 'Update an animal group',
          requiresAuth: true,
          params: {
            farmId: 'number (required)',
            animalId: 'number (required)'
          },
          body: 'Any animal properties to update',
          response: { message: 'string' }
        },
        deleteAnimal: {
          method: 'DELETE',
          path: '/api/farms/:farmId/animals/:animalId',
          description: 'Delete an animal group',
          requiresAuth: true,
          params: {
            farmId: 'number (required)',
            animalId: 'number (required)'
          },
          response: { message: 'string' }
        }
      },
      equipment: {
        listEquipment: {
          method: 'GET',
          path: '/api/farms/:farmId/equipment',
          description: 'Get all equipment for a farm',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          response: 'Array of equipment items'
        },
        getEquipment: {
          method: 'GET',
          path: '/api/equipment/:equipmentId',
          description: 'Get details of specific equipment',
          requiresAuth: true,
          params: { equipmentId: 'number (required)' },
          response: 'Equipment object'
        },
        createEquipment: {
          method: 'POST',
          path: '/api/farms/:farmId/equipment',
          description: 'Add new equipment',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          body: {
            model: 'string (required)',
            category: 'string (required)',
            brand: 'string (required)',
            owned: 'boolean (optional, default: true)',
            leased: 'boolean (optional, default: false)',
            dailyCost: 'number (optional)',
            condition: 'number (optional, default: 100)',
            purchasePrice: 'number (optional)',
            purchaseDate: 'date (optional)',
            notes: 'string (optional)'
          },
          response: { equipmentId: 'number' }
        },
        updateEquipment: {
          method: 'PUT',
          path: '/api/equipment/:equipmentId',
          description: 'Update equipment details',
          requiresAuth: true,
          params: { equipmentId: 'number (required)' },
          body: 'Any equipment properties to update',
          response: { message: 'string' }
        },
        deleteEquipment: {
          method: 'DELETE',
          path: '/api/equipment/:equipmentId',
          description: 'Delete equipment',
          requiresAuth: true,
          params: { equipmentId: 'number (required)' },
          response: { message: 'string' }
        },
        sellEquipment: {
          method: 'POST',
          path: '/api/equipment/:equipmentId/sell',
          description: 'Mark equipment as sold',
          requiresAuth: true,
          params: { equipmentId: 'number (required)' },
          body: {
            salePrice: 'number (required)',
            saleDate: 'date (optional)'
          },
          response: { message: 'string' }
        }
      },
      finances: {
        listFinances: {
          method: 'GET',
          path: '/api/farms/:farmId/finances',
          description: 'Get financial transactions for a farm',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          query: {
            startDate: 'date (optional)',
            endDate: 'date (optional)',
            type: 'income|expense (optional)',
            category: 'string (optional)'
          },
          response: 'Array of finance records'
        },
        createFinance: {
          method: 'POST',
          path: '/api/farms/:farmId/finances',
          description: 'Add a financial transaction',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          body: {
            date: 'date (required)',
            type: 'income|expense (required)',
            category: 'string (required)',
            description: 'string (required)',
            amount: 'number (required)'
          },
          response: { financeId: 'number' }
        },
        updateFinance: {
          method: 'PUT',
          path: '/api/farms/:farmId/finances/:financeId',
          description: 'Update a financial transaction',
          requiresAuth: true,
          params: {
            farmId: 'number (required)',
            financeId: 'number (required)'
          },
          body: 'Any finance properties to update',
          response: { message: 'string' }
        },
        deleteFinance: {
          method: 'DELETE',
          path: '/api/farms/:farmId/finances/:financeId',
          description: 'Delete a financial transaction',
          requiresAuth: true,
          params: {
            farmId: 'number (required)',
            financeId: 'number (required)'
          },
          response: { message: 'string' }
        },
        getSummary: {
          method: 'GET',
          path: '/api/farms/:farmId/finances/summary',
          description: 'Get financial summary',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          query: {
            startDate: 'date (optional)',
            endDate: 'date (optional)'
          },
          response: {
            totalIncome: 'number',
            totalExpenses: 'number',
            netProfit: 'number',
            byCategory: 'object'
          }
        }
      },
      activity: {
        getActivity: {
          method: 'GET',
          path: '/api/farms/:farmId/activity',
          description: 'Get recent activity for a farm',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          query: {
            limit: 'number (optional, default: 50)'
          },
          response: 'Array of activity entries'
        }
      },
      storage: {
        getStorage: {
          method: 'GET',
          path: '/api/farms/:farmId/storage',
          description: 'Get crop storage information',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          response: 'Array of stored crops with quantities'
        },
        updateStorage: {
          method: 'POST',
          path: '/api/farms/:farmId/storage',
          description: 'Update storage quantities',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          body: {
            crop: 'string (required)',
            quantity: 'number (required)',
            unit: 'liters|bales (required)'
          },
          response: { message: 'string' }
        }
      },
      import: {
        importGameData: {
          method: 'POST',
          path: '/api/farms/:farmId/import',
          description: 'Import game data from external dashboard (JSON format)',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          body: {
            gameFarmId: 'string (optional, default: "1")',
            farms: 'Array<{id, name, money}> (optional)',
            fields: 'Array<{id, name, areaHectares, fruitType, growthState, maxGrowthState, weedState, fertilizerLevel}> (optional)',
            vehicles: 'Array<{id, name, type, farmId, damageAmount}> (optional)'
          },
          response: {
            message: 'string',
            results: {
              fieldsUpdated: 'number',
              fieldsCreated: 'number',
              moneyUpdated: 'boolean',
              equipmentUpdated: 'number',
              errors: 'Array<string>'
            }
          }
        },
        getImportStatus: {
          method: 'GET',
          path: '/api/farms/:farmId/import/status',
          description: 'Get last import status and farm statistics',
          requiresAuth: true,
          params: { farmId: 'number (required)' },
          response: {
            lastSyncDate: 'timestamp or null',
            lastSyncMoney: 'number',
            totalFields: 'number',
            totalEquipment: 'number'
          }
        }
      }
    },
    notes: {
      authentication: 'Include the JWT token in the Authorization header as "Bearer <token>" for all authenticated endpoints',
      roles: 'Farm members can have roles: owner, manager, or viewer. Viewers have read-only access.',
      errors: 'All error responses return JSON with an "error" field containing the error message',
      dateFormat: 'Dates should be in ISO 8601 format (YYYY-MM-DD or full timestamp)'
    }
  }

  // Return HTML if browser, JSON if API client
  if (acceptsHtml) {
    res.send(generateHtmlDocs(docs, baseUrl))
  } else {
    res.json(docs)
  }
})

function generateHtmlDocs(docs: any, baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FS25 Farm Management System - API Documentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            margin-bottom: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        .info-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info-box h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        .info-box p {
            margin-bottom: 10px;
        }
        .info-box code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #d73a49;
        }
        .section {
            background: white;
            margin-bottom: 30px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section-header {
            background: #667eea;
            color: white;
            padding: 20px;
            font-size: 1.8em;
            font-weight: bold;
        }
        .endpoint {
            border-bottom: 1px solid #e0e0e0;
            padding: 20px;
        }
        .endpoint:last-child {
            border-bottom: none;
        }
        .endpoint-title {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }
        .method {
            padding: 6px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .method.get { background: #61affe; color: white; }
        .method.post { background: #49cc90; color: white; }
        .method.put { background: #fca130; color: white; }
        .method.patch { background: #50e3c2; color: white; }
        .method.delete { background: #f93e3e; color: white; }
        .path {
            font-family: 'Courier New', monospace;
            font-size: 1.1em;
            color: #333;
            font-weight: 500;
        }
        .description {
            color: #666;
            margin-bottom: 15px;
        }
        .auth-badge {
            display: inline-block;
            padding: 4px 10px;
            background: #fff3cd;
            color: #856404;
            border-radius: 4px;
            font-size: 0.85em;
            margin-bottom: 15px;
            border: 1px solid #ffeaa7;
        }
        .auth-badge.required {
            background: #f8d7da;
            color: #721c24;
            border-color: #f5c6cb;
        }
        .details {
            margin-top: 15px;
        }
        .details h4 {
            color: #667eea;
            margin-bottom: 8px;
            font-size: 1em;
        }
        .code-block {
            background: #f6f8fa;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            padding: 12px;
            margin: 10px 0;
            overflow-x: auto;
        }
        .code-block pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #24292e;
        }
        .params-list {
            list-style: none;
            padding: 0;
        }
        .params-list li {
            padding: 8px 12px;
            background: #f8f9fa;
            margin-bottom: 5px;
            border-radius: 4px;
            border-left: 3px solid #667eea;
        }
        .params-list li strong {
            color: #667eea;
        }
        footer {
            text-align: center;
            padding: 40px 20px;
            color: #666;
            margin-top: 40px;
        }
        .toc {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .toc h2 {
            color: #667eea;
            margin-bottom: 15px;
        }
        .toc ul {
            list-style: none;
        }
        .toc li {
            margin-bottom: 8px;
        }
        .toc a {
            color: #667eea;
            text-decoration: none;
            transition: color 0.2s;
        }
        .toc a:hover {
            color: #764ba2;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚜 FS25 Farm Management System</h1>
            <p>API Documentation v${docs.version}</p>
            <p style="margin-top: 10px; font-size: 0.95em;">Base URL: <code style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 3px;">${baseUrl}</code></p>
        </header>

        <div class="info-box">
            <h2>📋 Important Notes</h2>
            <p><strong>Authentication:</strong> ${docs.notes.authentication}</p>
            <p><strong>User Roles:</strong> ${docs.notes.roles}</p>
            <p><strong>Error Format:</strong> ${docs.notes.errors}</p>
            <p><strong>Date Format:</strong> ${docs.notes.dateFormat}</p>
        </div>

        <div class="toc">
            <h2>📑 Table of Contents</h2>
            <ul>
                <li><a href="#authentication">Authentication</a></li>
                <li><a href="#farms">Farms</a></li>
                <li><a href="#fields">Fields</a></li>
                <li><a href="#animals">Animals</a></li>
                <li><a href="#equipment">Equipment</a></li>
                <li><a href="#finances">Finances</a></li>
                <li><a href="#activity">Activity</a></li>
                <li><a href="#storage">Storage</a></li>
                <li><a href="#import">Import Game Data</a></li>
            </ul>
        </div>

        ${generateSectionHtml('authentication', 'Authentication', docs.endpoints.authentication)}
        ${generateSectionHtml('farms', 'Farms', docs.endpoints.farms)}
        ${generateSectionHtml('fields', 'Fields', docs.endpoints.fields)}
        ${generateSectionHtml('animals', 'Animals', docs.endpoints.animals)}
        ${generateSectionHtml('equipment', 'Equipment', docs.endpoints.equipment)}
        ${generateSectionHtml('finances', 'Finances', docs.endpoints.finances)}
        ${generateSectionHtml('activity', 'Activity', docs.endpoints.activity)}
        ${generateSectionHtml('storage', 'Storage', docs.endpoints.storage)}
        ${generateSectionHtml('import', 'Import Game Data', docs.endpoints.import)}

        <footer>
            <p>FS25 Farm Management System API Documentation</p>
            <p>For JSON format, access this endpoint with <code>Accept: application/json</code> header</p>
        </footer>
    </div>
</body>
</html>`
}

function generateSectionHtml(id: string, title: string, endpoints: any): string {
  let html = `<div class="section" id="${id}">
    <div class="section-header">${title}</div>`
  
  for (const [key, endpoint] of Object.entries(endpoints)) {
    const ep = endpoint as any
    html += `
    <div class="endpoint">
        <div class="endpoint-title">
            <span class="method ${ep.method.toLowerCase()}">${ep.method}</span>
            <span class="path">${ep.path}</span>
        </div>
        <p class="description">${ep.description}</p>
        ${ep.requiresAuth ? '<span class="auth-badge required">🔒 Authentication Required</span>' : '<span class="auth-badge">🔓 No Authentication</span>'}
        
        <div class="details">`
    
    if (ep.params) {
      html += `
            <h4>Path Parameters:</h4>
            <ul class="params-list">`
      for (const [param, desc] of Object.entries(ep.params)) {
        html += `<li><strong>${param}:</strong> ${desc}</li>`
      }
      html += `</ul>`
    }
    
    if (ep.query) {
      html += `
            <h4>Query Parameters:</h4>
            <ul class="params-list">`
      for (const [param, desc] of Object.entries(ep.query)) {
        html += `<li><strong>${param}:</strong> ${desc}</li>`
      }
      html += `</ul>`
    }
    
    if (ep.body) {
      html += `
            <h4>Request Body:</h4>
            <div class="code-block">
                <pre>${JSON.stringify(ep.body, null, 2)}</pre>
            </div>`
    }
    
    if (ep.response) {
      html += `
            <h4>Response:</h4>
            <div class="code-block">
                <pre>${typeof ep.response === 'string' ? ep.response : JSON.stringify(ep.response, null, 2)}</pre>
            </div>`
    }
    
    html += `
        </div>
    </div>`
  }
  
  html += `</div>`
  return html
}

export default router
