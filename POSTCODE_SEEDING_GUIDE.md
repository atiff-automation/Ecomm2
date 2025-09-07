# Malaysian Postcode Database Seeding Guide

## Overview
This guide documents the implementation of comprehensive Malaysian postcode database seeding following CLAUDE.md principles: DRY, centralized approach, single source of truth, and no hardcoding.

## Files Created

### 1. Seed Script: `prisma/seed-malaysian-postcodes.ts`
- **Purpose**: Comprehensive seeding of Malaysian postcode and state data from CSV files
- **Architecture**: 
  - Centralized CSV parsing with reusable functions
  - Single source of truth approach using official CSV data
  - No hardcoded postcode mappings
  - Batch processing for performance (1000 postcodes per batch)
  - Data integrity validation
- **Features**:
  - Reads state mappings from `Malaysia_Postcode-states.csv`
  - Reads postcode data from `Malaysia_Postcode-postcodes - Malaysia_Postcode-postcodes_clean.csv`
  - Validates data integrity before seeding
  - Provides progress tracking during seeding
  - Includes sample postcode testing after completion

### 2. Package.json Script Addition
- **Script**: `"db:seed:postcodes": "npx tsx prisma/seed-malaysian-postcodes.ts"`
- **Usage**: `npm run db:seed:postcodes`

## Data Sources

### State Mapping CSV (`Malaysia_Postcode-states.csv`)
```
Format: "StateCode","StateName"
Example: "KUL","Wilayah Persekutuan Kuala Lumpur"
Records: 16 Malaysian states
```

### Postcode Data CSV (`Malaysia_Postcode-postcodes - Malaysia_Postcode-postcodes_clean.csv`)
```
Format: postcode,city,stateCode
Example: 50200,Kuala Lumpur,KUL
Records: 2,784 Malaysian postcodes
```

## Database Schema Integration

### MalaysianState Model
- `id` (VARCHAR(3)): State code (e.g., "KUL", "SEL")  
- `name` (VARCHAR(100)): Full state name
- Primary key: `id`

### MalaysianPostcode Model
- `id` (CUID): Auto-generated primary key
- `postcode` (VARCHAR(5)): 5-digit postcode
- `district` (VARCHAR(100)): City/district name  
- `stateCode` (VARCHAR(3)): Foreign key to MalaysianState.id
- Unique constraint: `[postcode, district]`

## Usage Instructions

### Running the Seed Script
```bash
# Run postcode seeding only
npm run db:seed:postcodes

# Or run directly with tsx
npx tsx prisma/seed-malaysian-postcodes.ts
```

### Seeding Process
1. **Data Reading**: Reads both CSV files and validates file existence
2. **Data Parsing**: Parses CSV content with error handling for malformed lines
3. **Data Validation**: Ensures data integrity between states and postcodes
4. **State Seeding**: Creates all 16 Malaysian states (clears existing data first)
5. **Postcode Seeding**: Creates 2,784 postcodes in batches of 1000 for performance
6. **Validation**: Tests sample postcodes to ensure proper seeding

### Expected Output
```
🚀 Starting Malaysian postcode seeding...
📋 Following CLAUDE.md principles: DRY, centralized, no hardcoding
📁 Reading CSV files...
🔍 Parsing CSV data...
✅ Parsed 16 states and 2784 postcodes
🌱 Seeding Malaysian states...
✅ Seeded 16 Malaysian states
🌱 Seeding Malaysian postcodes...
📦 Processed 1000/2784 postcodes
📦 Processed 2000/2784 postcodes
📦 Processed 2784/2784 postcodes
✅ Seeded 2784 Malaysian postcodes
🔍 Validating seeded data...
📊 Database contains 16 states and 2784 postcodes
🧪 Testing sample postcodes:
  ✅ 50200 → Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur
  ✅ 40000 → Shah Alam, Selangor
  ✅ 10200 → Pulau Pinang, Pulau Pinang
  ✅ 80100 → Johor Bahru, Johor
🎉 Malaysian postcode seeding completed successfully!
💡 Auto-fill functionality should now work correctly
```

## API Integration

### Postcode Validation Endpoint
- **Endpoint**: `/api/postcode/validate?postcode={code}`
- **Method**: GET
- **Response Format**: 
```json
{
  "valid": true,
  "formatted": "50200",
  "location": {
    "state": "KUL",
    "stateCode": "KUL", 
    "stateName": "Wilayah Persekutuan Kuala Lumpur",
    "city": "Kuala Lumpur",
    "zone": "west"
  }
}
```

### Testing API Functionality
```bash
# Test valid postcode
curl "http://localhost:3000/api/postcode/validate?postcode=50200"

# Test invalid postcode  
curl "http://localhost:3000/api/postcode/validate?postcode=99999"
```

## Auto-fill Integration

The seeded data works seamlessly with the existing auto-fill functionality in:
- **Business Profile Settings** (`/admin/settings/business-profile`)
- **Checkout Page** (`/checkout`)
- Any other form using the postcode validation API

When users enter a valid Malaysian postcode:
1. API validates the postcode against database
2. Returns city and state information
3. Frontend auto-fills the corresponding fields

## Architecture Benefits

Following CLAUDE.md principles, this implementation provides:

1. **DRY (Don't Repeat Yourself)**: Single reusable CSV parser, consistent data handling
2. **Single Source of Truth**: All postcode data comes from official CSV files
3. **Centralized Management**: One seed script handles all Malaysian postcode data
4. **No Hardcoding**: No embedded postcode mappings in code
5. **Maintainable**: Easy to update with new CSV data when available
6. **Scalable**: Batch processing handles large datasets efficiently
7. **Reliable**: Data integrity validation and error handling

## Future Maintenance

To update postcode data:
1. Replace CSV files with updated versions
2. Run `npm run db:seed:postcodes`
3. The script will clear existing data and reseed with new information

This approach ensures the system remains current with official Malaysian postcode changes while maintaining architectural integrity.