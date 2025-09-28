# Railway Deployment Guide - Malaysian Postcode System

## Overview

This guide covers deploying your JRM E-commerce application to Railway with automatic Malaysian postcode database seeding.

## Deployment Approaches

### **Option 1: Automatic Post-Install Hook (Recommended)**

The postcode seeding is configured to run automatically after Railway installs dependencies.

**How it works:**
1. Railway runs `npm install`
2. The `postinstall` script triggers automatically
3. Database migrations run via `prisma migrate deploy`
4. Malaysian postcode data is seeded (idempotent - safe to run multiple times)

**Package.json configuration:**
```json
{
  "scripts": {
    "postinstall": "npm run db:deploy:production",
    "db:deploy:production": "npx prisma migrate deploy && npm run db:seed:production",
    "db:seed:production": "npm run db:seed:essential && npm run db:seed:postcodes:production && npm run db:seed:shipping:production",
    "db:seed:essential": "NODE_ENV=production npx tsx prisma/seed.ts",
    "db:seed:postcodes:production": "NODE_ENV=production npx tsx prisma/seed-malaysian-postcodes.ts",
    "db:seed:shipping:production": "NODE_ENV=production npx tsx prisma/seed-shipping-zones.ts"
  }
}
```

### **Option 2: Manual Railway Script (Alternative)**

If you prefer more control, use the custom deployment script:

```bash
# In Railway dashboard, set build command to:
npm run build

# Set start command to:
./scripts/railway-deploy.sh && npm start
```

## Railway Environment Variables

Set these in your Railway project dashboard:

### Required Variables
```env
# Database (automatically provided by Railway Postgres)
DATABASE_URL=postgresql://...

# Application
NODE_ENV=production
RAILWAY_ENVIRONMENT=production

# Next.js
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=your-secret-key

# Other environment variables specific to your app
```

## Deployment Steps

### 1. Prepare Your Repository

Ensure these files are committed:
- `prisma/seed-malaysian-postcodes.ts` (seeding script)
- `Malaysia_Postcode-states.csv` (states data)
- `Malaysia_Postcode-postcodes - Malaysia_Postcode-postcodes_clean.csv` (postcodes data)
- `scripts/railway-deploy.sh` (deployment script)

### 2. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init
railway add postgresql
```

### 3. Deploy

```bash
# Deploy to Railway
railway up

# Or connect to GitHub for automatic deployments
# (recommended for continuous deployment)
```

### 4. Monitor Deployment

Check Railway logs to see:
```
🚂 Starting Railway deployment process...
📊 Running database migrations...

🌱 Seeding essential data...
👥 Seeding admin users (superadmin@jrm.com, admin@jrm.com)
📦 Seeding product categories and sample products
💰 Seeding tax configurations (GST 6%, SST 10%)
✅ Essential data seeded successfully

🌱 Seeding Malaysian postcode data...
📋 Following CLAUDE.md principles: DRY, centralized, no hardcoding
✅ Seeded 16 Malaysian states and 2,784 postcodes
💡 Auto-fill functionality ready

🚚 Seeding shipping zones and rates...
🌏 Seeding Malaysian shipping zones (West/East Malaysia)
📋 Seeding courier rates (Pos Malaysia, J&T, etc.)
✅ Shipping system ready

✅ Railway deployment completed successfully!
```

## Production Safety Features

### Idempotent Seeding
The seeding script is **idempotent** - it can be run multiple times safely:
- Checks if data already exists before seeding
- Skips seeding if 16 states and 2784+ postcodes are found
- Never duplicates data

### Error Handling
- Graceful failure handling
- Detailed logging for debugging
- Database transaction safety

### Performance Optimized
- Batch processing (1000 postcodes per batch)
- Efficient database queries
- Minimal memory footprint

## Testing the Deployment

### 1. Test API Endpoint
```bash
curl "https://your-app.railway.app/api/postcode/validate?postcode=50200"
```

Expected response:
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

### 2. Test Auto-fill in Business Profile
1. Go to `/admin/settings/business-profile`
2. Enter postcode `50200` in any address section
3. Verify city auto-fills to "Kuala Lumpur"
4. Verify state auto-fills to "KUL"

## Troubleshooting

### Common Issues

**1. CSV Files Not Found**
```
Error: ENOENT: no such file or directory, open 'Malaysia_Postcode-states.csv'
```
**Solution:** Ensure CSV files are in the project root and committed to git.

**2. Database Connection Issues**
```
Error: P1001: Can't reach database server
```
**Solution:** Verify `DATABASE_URL` environment variable is set correctly.

**3. Migration Failures**
```
Error: P3005: The database schema is not empty
```
**Solution:** This is normal for existing databases. The script handles this gracefully.

### Railway-Specific Configuration

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm start
```

**Root Directory:**
```
/ (project root)
```

## Updating Postcode Data

To update postcode data in the future:

1. Replace CSV files with new data
2. Deploy to Railway
3. The seeding script will detect existing data and skip
4. If you need to force re-seeding, temporarily clear the database or modify the script

## Architecture Benefits

✅ **Automatic Setup** - No manual intervention needed
✅ **Idempotent** - Safe to run multiple times
✅ **Production Safe** - Built-in safety checks
✅ **Performance Optimized** - Batch processing and caching
✅ **Railway Native** - Uses Railway's deployment patterns
✅ **Zero Downtime** - Seeding runs during deployment
✅ **Error Resistant** - Graceful failure handling

This setup ensures your Malaysian postcode auto-fill functionality works immediately after Railway deployment with zero manual intervention required.