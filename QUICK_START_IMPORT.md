# Quick Start - Game Data Import API

## Setup

1. **No additional packages needed!** The API now accepts JSON directly.

2. **Start the server:**
   ```bash
   npm run dev
   ```

## Quick Test with cURL

### 1. Login and get token:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Import game data (JSON):
```bash
curl -X POST http://localhost:3000/api/farms/1/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "gameFarmId": "1",
    "farms": [{"id":"1","name":"My Farm","money":100000}],
    "fields": [
      {
        "id":"1",
        "name":"Field 1",
        "areaHectares":3.5,
        "fruitType":"WHEAT",
        "growthState":4,
        "maxGrowthState":5,
        "weedState":50,
        "fertilizerLevel":100,
        "isReadyToHarvest":false
      }
    ],
    "vehicles": [
      {
        "id":"476",
        "name":"JCB Fastrac",
        "type":"tractor",
        "farmId":"1",
        "damageAmount":0.1
      }
    ]
  }'
```

### 3. Check import status:
```bash
curl -X GET http://localhost:3000/api/farms/1/import/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## What Gets Imported

✅ **Fields:**
- Field number, name, size
- Current crop and growth stage
- Fertilizer and weed states

✅ **Equipment:**
- Vehicle names and types
- Condition percentages
- Categories (Tractors, Harvesters, etc.)

✅ **Money:**
- Farm balance recorded as finance entry
- Tracked as "Game Sync" category

## Integration Flow

Your external dashboard should:

1. **Parse the XML** from `externalMapping_export.xml`
2. **Transform to JSON** with the structure shown above
3. **Authenticate** with this API
4. **POST the JSON** to the import endpoint
5. **Display results** in your dashboard

## File Structure

```
server/
├── routes/
│   └── import.ts          # Import endpoint handlers (JSON-based)
└── index.ts               # Added import route registration

API_INTEGRATION_DOCS.md    # Complete documentation with examples
QUICK_START_IMPORT.md      # This file
```

## JSON Structure Example

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

## Next Steps

See **API_INTEGRATION_DOCS.md** for:
- Complete field/vehicle mapping tables
- Python and C# examples
- Error handling guide
- Troubleshooting tips
