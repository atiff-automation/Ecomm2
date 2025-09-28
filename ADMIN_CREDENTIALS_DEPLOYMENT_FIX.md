# Admin Credentials Railway Deployment Fix

## Problem
Admin credentials were not working on Railway deployment because:
1. Seed script was using wrong password (`password123` instead of `ParitRaja9396#$%`)
2. Missing `postinstall` script in package.json to run seeding during deployment

## Solution Applied

### 1. Updated Seed Script (`prisma/seed.ts`)
✅ **Fixed admin password logic:**
- Now uses `process.env.ADMIN_PASSWORD` or fallback to `ParitRaja9396#$%`
- Separate password for test users (`password123`)
- Added console logs to show credentials during seeding

### 2. Added Postinstall Script (`package.json`)
✅ **Added automatic deployment seeding:**
```json
{
  "scripts": {
    "postinstall": "npm run db:deploy:production"
  }
}
```

This runs automatically when Railway installs dependencies.

## Admin Credentials

### Railway Production
- **Super Admin**: `superadmin@jrm.com`
- **Admin**: `admin@jrm.com`
- **Password**: `ParitRaja9396#$%`

### Test Users (Local/Development)
- **Staff**: `staff@jrm.com` - password: `password123`
- **Member**: `member@test.com` - password: `password123`
- **Customer**: `customer@test.com` - password: `password123`

## Railway Environment Variable (Optional)

You can set a custom admin password by adding this environment variable in Railway:

```
ADMIN_PASSWORD=YourCustomPassword
```

If not set, it defaults to `ParitRaja9396#$%`.

## Deployment Process

The seeding now runs automatically when you deploy to Railway:

1. **Railway installs dependencies** → triggers `postinstall`
2. **Runs migrations** → `prisma migrate deploy`
3. **Seeds essential data** → Creates admin users with correct passwords
4. **Seeds postcodes** → Malaysian postcode system
5. **Seeds shipping zones** → Courier configurations

## Next Steps

1. **Deploy to Railway:**
   ```bash
   git add .
   git commit -m "Fix admin credentials and add automatic seeding"
   git push
   ```

2. **Monitor Railway logs** to see seeding output:
   ```
   📧 Admin credentials will be:
     Super Admin: superadmin@jrm.com
     Admin: admin@jrm.com
     Password: ParitRaja9396#$%
   ```

3. **Test admin login** at your Railway URL:
   - Go to: `https://your-app.railway.app/auth/signin`
   - Use: `admin@jrm.com` / `ParitRaja9396#$%`

## Verification

After deployment, the admin credentials should work immediately. The seeding is idempotent, so it's safe to redeploy multiple times.

If you still have issues, check Railway logs for any seeding errors.