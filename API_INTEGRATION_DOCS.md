# FS25 Farm Management System - API Integration Documentation

## Overview

This API allows external applications to export Farming Simulator 25 game data into the Farm Management System. Your external dashboard application parses the XML data from the game and sends structured JSON to this API to automatically sync fields, equipment, and farm financial data.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL](#base-url)
3. [Endpoints](#endpoints)
   - [Import Game Data](#import-game-data)
   - [Get Import Status](#get-import-status)
4. [Data Mapping](#data-mapping)
5. [Error Handling](#error-handling)
6. [Integration Examples](#integration-examples)
7. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints require authentication using a JSON Web Token (JWT).

### Getting an Access Token

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### Using the Token

Include the token in the `Authorization` header for all API requests:

```
Authorization: Bearer <your_token>
```

---

## Base URL

```
http://localhost:3000/api
```

For production deployments, replace `localhost:3000` with your server's domain.

---

## Endpoints

### Import Game Data

Import field, equipment, and financial data from Farming Simulator 25.

**Endpoint:** `POST /api/farms/:farmId/import`

**Method:** `POST`

**URL Parameters:**
- `farmId` (integer, required): The ID of the farm in your database

**Headers:**
```
Authorization: Bearer <your_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "gameFarmId": "1",
  "farms": [
    {
      "id": "1",
      "name": "My Farm",
      "money": 975894.55
    }
  ],
  "fields": [
    {
      "id": "1",
      "name": "Field 1",
      "areaHectares": 3.58,
      "fruitType": "WHEAT",
      "growthState": 4,
      "maxGrowthState": 5,
      "weedState": 50,
      "fertilizerLevel": 100,
      "isReadyToHarvest": false
    }
  ],
  "vehicles": [
    {
      "id": "476",
      "name": "JCB Fastrac 2115 4WS",
      "type": "tractor",
      "farmId": "1",
      "damageAmount": 0.1
    }
  ]
}
```

**Parameters:**
- `gameFarmId` (string, optional): The farm ID in the game (defaults to "1")
- `farms` (array, optional): Array of farm objects with financial data
  - `id`: Farm ID in the game
  - `name`: Farm name
  - `money`: Current money/balance
- `fields` (array, optional): Array of field objects
  - `id`: Field number/ID
  - `name`: Field name
  - `areaHectares`: Size in hectares
  - `fruitType`: Crop type (or "None")
  - `growthState`: Current growth stage (integer)
  - `maxGrowthState`: Maximum growth stage (integer)
  - `weedState`: Weed level (0-300+)
  - `fertilizerLevel`: Fertilizer percentage (0-100)
  - `isReadyToHarvest`: Boolean
- `vehicles` (array, optional): Array of vehicle/equipment objects
  - `id`: Vehicle ID in game
  - `name`: Vehicle name/model
  - `type`: Vehicle type (see mapping table below)
  - `farmId`: Owner farm ID
  - `damageAmount`: Damage percentage (0.0-1.0)

**Response (200 OK):**
```json
{
  "message": "Import completed",
  "results": {
    "fieldsUpdated": 5,
    "fieldsCreated": 2,
    "moneyUpdated": true,
    "equipmentUpdated": 12,
    "errors": []
  }
}
```

**Response Fields:**
- `fieldsUpdated`: Number of existing fields that were updated
- `fieldsCreated`: Number of new fields created
- `moneyUpdated`: Whether farm money was synchronized
- `equipmentUpdated`: Number of equipment items created or updated
- `errors`: Array of error messages for items that failed to import

**Error Responses:**

*401 Unauthorized:*
```json
{
  "error": "Invalid token"
}
```

*403 Forbidden:*
```json
{
  "error": "Viewers cannot import data"
}
```

*400 Bad Request:*
```json
{
  "error": "Invalid data format"
}
```

*500 Internal Server Error:*
```json
{
  "error": "Import failed"
}
```

---

### Get Import Status

Retrieve information about the last successful import and current farm data.

**Endpoint:** `GET /api/farms/:farmId/import/status`

**Method:** `GET`

**URL Parameters:**
- `farmId` (integer, required): The ID of the farm in your database

**Headers:**
```
Authorization: Bearer <your_token>
```

**Response (200 OK):**
```json
{
  "lastSyncDate": "2025-12-11T14:30:00.000Z",
  "lastSyncMoney": 975894.55,
  "totalFields": 15,
  "totalEquipment": 23
}
```

**Response Fields:**
- `lastSyncDate`: ISO 8601 timestamp of the last successful import (null if never imported)
- `lastSyncMoney`: Amount of money synced during the last import
- `totalFields`: Total number of fields in the database for this farm
- `totalEquipment`: Total number of active equipment items (excluding sold items)

**Error Responses:**

*401 Unauthorized:*
```json
{
  "error": "Invalid token"
}
```

*500 Internal Server Error:*
```json
{
  "error": "Failed to fetch import status"
}
```

---

## Data Mapping

### Field Mapping

JSON fields are mapped to the database as follows:

| JSON Field | Database Field | Transformation |
|-----------|---------------|----------------|
| `id` | `field_number` | Direct integer mapping |
| `name` | `name` | Direct string mapping |
| `areaHectares` | `size_hectares` | Parsed as decimal |
| `fruitType` | `current_crop` | Direct string (null if "None") |
| `growthState` / `maxGrowthState` | `growth_stage` | Converted to percentage: "0", "25", "50", "75", "100" |
| `fertilizerLevel` | `fertiliser_state` | Mapped to: "None", "Stage 1", "Stage 2", "Stage 3" |
| `weedState` | `weeds_state` | Mapped to: "None", "Low", "Medium", "High" |

**Growth Stage Mapping:**
- 0% = Not planted
- 25% = Early growth
- 50% = Mid growth
- 75% = Nearly mature
- 100% = Ready to harvest

**Fertilizer State Mapping:**
- 0% = "None"
- 1-33% = "Stage 1"
- 34-66% = "Stage 2"
- 67-100% = "Stage 3"

**Weed State Mapping:**
- 0 = "None"
- 1-100 = "Low"
- 101-200 = "Medium"
- 201+ = "High"

### Equipment Mapping

JSON vehicles are mapped to equipment as follows:

| JSON Field | Database Field | Transformation |
|-----------|---------------|----------------|
| `name` | `model` | Direct string mapping |
| `type` | `category` | Mapped using category dictionary |
| `damageAmount` | `condition` | Converted to percentage: `(1 - damageAmount) * 100` |

**Vehicle Type to Category Mapping:**
- `tractor` → "Tractors"
- `combineDrivable` → "Harvesters"
- `trailer` → "Trailers"
- `cultivator` → "Cultivators"
- `sowingMachine` → "Planters"
- `mower` → "Mowers"
- `forageWagon` → "Trailers"
- `teleHandler` → "Loaders"
- `car` → "Vehicles"
- Other types → "Other"

### Farm Money Mapping

The farm's money from the JSON is recorded as a finance entry with:
- Type: "income"
- Category: "Game Sync"
- Description: "Money synced from game: £{amount}"
- Amount: Direct decimal mapping from JSON

---

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

### Common Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 400 | Bad Request | Invalid JSON format, missing required fields |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User doesn't have permission (viewer role) |
| 404 | Not Found | Farm ID doesn't exist |
| 500 | Internal Server Error | Database error, server misconfiguration |

### Partial Import Handling

If some items fail to import but others succeed, the API will:
1. Return a 200 OK status
2. Include successfully imported items in the `results` object
3. List failed items in the `errors` array

Example:
```json
{
  "message": "Import completed",
  "results": {
    "fieldsUpdated": 10,
    "fieldsCreated": 0,
    "moneyUpdated": true,
    "equipmentUpdated": 15,
    "errors": [
      "Failed to process field Field 42",
      "Failed to process vehicle Broken Tractor"
    ]
  }
}
```

---

## Integration Examples

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const EMAIL = 'user@example.com';
const PASSWORD = 'your_password';
const FARM_ID = 1;

// Sample parsed game data from your dashboard
const gameData = {
  gameFarmId: "1",
  farms: [
    {
      id: "1",
      name: "My Farm",
      money: 975894.55
    }
  ],
  fields: [
    {
      id: "1",
      name: "Field 1",
      areaHectares: 3.58,
      fruitType: "WHEAT",
      growthState: 4,
      maxGrowthState: 5,
      weedState: 50,
      fertilizerLevel: 100,
      isReadyToHarvest: false
    },
    {
      id: "2",
      name: "Field 2",
      areaHectares: 1.82,
      fruitType: "BARLEY",
      growthState: 3,
      maxGrowthState: 5,
      weedState: 0,
      fertilizerLevel: 66,
      isReadyToHarvest: false
    }
  ],
  vehicles: [
    {
      id: "476",
      name: "JCB Fastrac 2115 4WS",
      type: "tractor",
      farmId: "1",
      damageAmount: 0.1
    },
    {
      id: "486",
      name: "Massey Ferguson MF 8570",
      type: "combineDrivable",
      farmId: "1",
      damageAmount: 0.5
    }
  ]
};

async function syncGameData() {
  try {
    // Step 1: Login and get token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Authenticated successfully');

    // Step 2: Import data
    const importResponse = await axios.post(
      `${API_BASE_URL}/farms/${FARM_ID}/import`,
      gameData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✓ Import completed:');
    console.log(`  - Fields updated: ${importResponse.data.results.fieldsUpdated}`);
    console.log(`  - Fields created: ${importResponse.data.results.fieldsCreated}`);
    console.log(`  - Equipment updated: ${importResponse.data.results.equipmentUpdated}`);
    console.log(`  - Money synced: ${importResponse.data.results.moneyUpdated}`);

    if (importResponse.data.results.errors.length > 0) {
      console.log('⚠ Errors encountered:');
      importResponse.data.results.errors.forEach(err => console.log(`  - ${err}`));
    }

    // Step 3: Check status
    const statusResponse = await axios.get(
      `${API_BASE_URL}/farms/${FARM_ID}/import/status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✓ Current status:');
    console.log(`  - Last sync: ${statusResponse.data.lastSyncDate}`);
    console.log(`  - Total fields: ${statusResponse.data.totalFields}`);
    console.log(`  - Total equipment: ${statusResponse.data.totalEquipment}`);

  } catch (error) {
    console.error('✗ Error:', error.response?.data?.error || error.message);
    process.exit(1);
  }
}

syncGameData();
```

### Python Example

```python
import requests
import json

# Configuration
API_BASE_URL = 'http://localhost:3000/api'
EMAIL = 'user@example.com'
PASSWORD = 'your_password'
FARM_ID = 1
XML_FILE_PATH = './externalMapping_export.xml'

def sync_game_data():
    try:
        # Step 1: Login and get token
        login_response = requests.post(
            f'{API_BASE_URL}/auth/login',
            json={'email': EMAIL, 'password': PASSWORD}
        )
        login_response.raise_for_status()
        token = login_response.json()['token']
        print('✓ Authenticated successfully')

        # Step 2: Read XML file
        with open(XML_FILE_PATH, 'r', encoding='utf-8') as file:
            xml_data = file.read()
        print('✓ XML file loaded')

        # Step 3: Import data
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        import_response = requests.post(
            f'{API_BASE_URL}/farms/{FARM_ID}/import/xml',
            json={'xmlData': xml_data, 'gameFarmId': '1'},
            headers=headers
        )
        import_response.raise_for_status()
        results = import_response.json()['results']

        print('✓ Import completed:')
        print(f"  - Fields updated: {results['fieldsUpdated']}")
        print(f"  - Fields created: {results['fieldsCreated']}")
        print(f"  - Equipment updated: {results['equipmentUpdated']}")
        print(f"  - Money synced: {results['moneyUpdated']}")

        if results['errors']:
            print('⚠ Errors encountered:')
            for error in results['errors']:
                print(f"  - {error}")

        # Step 4: Check status
        status_response = requests.get(
            f'{API_BASE_URL}/farms/{FARM_ID}/import/status',
            headers=headers
        )
        status_response.raise_for_status()
        status = status_response.json()

        print('✓ Current status:')
        print(f"  - Last sync: {status['lastSyncDate']}")
        print(f"  - Total fields: {status['totalFields']}")
        print(f"  - Total equipment: {status['totalEquipment']}")

    except requests.exceptions.RequestException as error:
        print(f'✗ Error: {error}')
        if hasattr(error, 'response') and error.response is not None:
            print(f'  Response: {error.response.text}')
        exit(1)

if __name__ == '__main__':
    sync_game_data()
```

### C# Example

```csharp
using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class FarmSyncClient
{
    private const string API_BASE_URL = "http://localhost:3000/api";
    private const string EMAIL = "user@example.com";
    private const string PASSWORD = "your_password";
    private const int FARM_ID = 1;
    private const string XML_FILE_PATH = "./externalMapping_export.xml";

    private static readonly HttpClient client = new HttpClient();

    static async Task Main(string[] args)
    {
        try
        {
            // Step 1: Login
            var loginData = new { email = EMAIL, password = PASSWORD };
            var loginContent = new StringContent(
                JsonSerializer.Serialize(loginData),
                Encoding.UTF8,
                "application/json"
            );

            var loginResponse = await client.PostAsync(
                $"{API_BASE_URL}/auth/login",
                loginContent
            );
            loginResponse.EnsureSuccessStatusCode();

            var loginResult = await JsonSerializer.DeserializeAsync<JsonElement>(
                await loginResponse.Content.ReadAsStreamAsync()
            );
            var token = loginResult.GetProperty("token").GetString();
            Console.WriteLine("✓ Authenticated successfully");

            // Step 2: Read XML file
            var xmlData = await File.ReadAllTextAsync(XML_FILE_PATH);
            Console.WriteLine("✓ XML file loaded");

            // Step 3: Import data
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");

            var importData = new { xmlData = xmlData, gameFarmId = "1" };
            var importContent = new StringContent(
                JsonSerializer.Serialize(importData),
                Encoding.UTF8,
                "application/json"
            );

            var importResponse = await client.PostAsync(
                $"{API_BASE_URL}/farms/{FARM_ID}/import/xml",
                importContent
            );
            importResponse.EnsureSuccessStatusCode();

            var importResult = await JsonSerializer.DeserializeAsync<JsonElement>(
                await importResponse.Content.ReadAsStreamAsync()
            );
            var results = importResult.GetProperty("results");

            Console.WriteLine("✓ Import completed:");
            Console.WriteLine($"  - Fields updated: {results.GetProperty("fieldsUpdated")}");
            Console.WriteLine($"  - Fields created: {results.GetProperty("fieldsCreated")}");
            Console.WriteLine($"  - Equipment updated: {results.GetProperty("equipmentUpdated")}");
            Console.WriteLine($"  - Money synced: {results.GetProperty("moneyUpdated")}");

            // Step 4: Check status
            var statusResponse = await client.GetAsync(
                $"{API_BASE_URL}/farms/{FARM_ID}/import/status"
            );
            statusResponse.EnsureSuccessStatusCode();

            var statusResult = await JsonSerializer.DeserializeAsync<JsonElement>(
                await statusResponse.Content.ReadAsStreamAsync()
            );

            Console.WriteLine("✓ Current status:");
            Console.WriteLine($"  - Last sync: {statusResult.GetProperty("lastSyncDate")}");
            Console.WriteLine($"  - Total fields: {statusResult.GetProperty("totalFields")}");
            Console.WriteLine($"  - Total equipment: {statusResult.GetProperty("totalEquipment")}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"✗ Error: {ex.Message}");
            Environment.Exit(1);
        }
    }
}
```

### Automated Sync with File Watcher

For real-time synchronization, you can set up a file watcher that automatically imports data whenever the XML file is updated:

```javascript
const fs = require('fs');
const axios = require('axios');

const WATCH_FILE = './externalMapping_export.xml';
let lastSync = Date.now();
const SYNC_COOLDOWN = 5000; // 5 seconds minimum between syncs

fs.watch(WATCH_FILE, async (eventType, filename) => {
  if (eventType === 'change') {
    const now = Date.now();
    if (now - lastSync < SYNC_COOLDOWN) {
      console.log('⏳ Sync cooldown active, skipping...');
      return;
    }
    
    lastSync = now;
    console.log(`📁 ${filename} changed, syncing...`);
    
    // Call your sync function here
    await syncGameData();
  }
});

console.log(`👀 Watching ${WATCH_FILE} for changes...`);
```

---

## Rate Limiting

Currently, the API does not enforce rate limiting. However, it's recommended to:

1. **Avoid rapid successive imports**: Wait at least 5 seconds between import requests
2. **Use the status endpoint sparingly**: Check status before importing to avoid unnecessary syncs
3. **Implement client-side throttling**: If using automated file watching, add cooldown periods

For production deployments, consider implementing rate limiting middleware on the server.

---

## Best Practices

### 1. Error Recovery

Always check the `errors` array in the response and log failed items for manual review:

```javascript
if (results.errors.length > 0) {
  fs.appendFileSync('import-errors.log', 
    `${new Date().toISOString()}\n${results.errors.join('\n')}\n\n`
  );
}
```

### 2. Token Management

Store the authentication token securely and refresh it when it expires:

```javascript
let cachedToken = null;
let tokenExpiry = null;

async function getToken() {
  if (cachedToken && tokenExpiry > Date.now()) {
    return cachedToken;
  }
  
  // Login and get new token
  const response = await login();
  cachedToken = response.token;
  tokenExpiry = Date.now() + (3600 * 1000); // 1 hour
  
  return cachedToken;
}
```

### 3. Incremental Updates

Before importing, check the import status to see if an import is necessary:

```javascript
const status = await getImportStatus();
const fileModTime = fs.statSync(XML_FILE_PATH).mtime;

if (status.lastSyncDate && new Date(status.lastSyncDate) > fileModTime) {
  console.log('Data is already up to date');
  return;
}
```

### 4. Backup Before Import

Consider backing up the current database state before large imports:

```javascript
// Export current data before import
const fieldsBackup = await axios.get(`${API_BASE_URL}/farms/${FARM_ID}/fields`);
fs.writeFileSync('backup-fields.json', JSON.stringify(fieldsBackup.data));
```

---

## Troubleshooting

### Issue: "Invalid data format" Error

**Cause:** The JSON data is malformed or contains invalid values.

**Solution:**
1. Verify your XML parser is correctly extracting and transforming data
2. Ensure all numeric values are sent as numbers, not strings
3. Check that field/vehicle arrays are properly formatted
4. Validate the JSON structure before sending

### Issue: "Viewers cannot import data" Error

**Cause:** The authenticated user has a "viewer" role on the farm.

**Solution:** Use an account with "manager" or "owner" role for imports.

### Issue: Fields Not Updating

**Cause:** The `gameFarmId` doesn't match the farm ID in your parsed data.

**Solution:** Ensure the `gameFarmId` parameter matches the farm you want to sync (usually "1" for single-player saves).

### Issue: Money Not Syncing

**Cause:** The farms array is empty or doesn't contain the correct farm ID.

**Solution:** Verify that your XML parser is correctly extracting farm data and that the farm object includes the `id`, `name`, and `money` fields.

---

## Support

For issues or questions:
- Check the server logs for detailed error messages
- Review your XML parsing logic to ensure data is correctly transformed
- Verify authentication tokens are valid and not expired
- Ensure the farm ID exists in your database
- Test with a minimal JSON payload to isolate issues

---

## Changelog

### Version 1.0.0 (2025-12-11)
- Initial release
- XML import endpoint
- Import status endpoint
- Field, equipment, and money synchronization
- Comprehensive error handling
