# Admin Credentials Reference
**⚠️ PRIVATE FILE - DO NOT COMMIT TO GIT**

## Current Admin Credentials

### Super Admin
- **Email**: superadmin@jrm.com
- **Password**: ParitRaja9396#$%
- **Role**: SUPERADMIN

### Admin
- **Email**: admin@jrm.com
- **Password**: ParitRaja9396#$%
- **Role**: ADMIN

---

## How to Update Credentials

### Local Environment:
1. Edit `/prisma/seed.ts` - change email/password in seed script
2. Run: `npm run db:seed`
3. Update this reference file

### Railway Environment:
1. Update seed script locally (if needed)
2. Push to Railway
3. Run: `railway run npm run db:seed`

### Direct Database Update (Alternative):
```sql
-- Connect to database first
UPDATE users SET
  email = 'newemail@jrm.com',
  password = '[new_hashed_password]'
WHERE email = 'admin@jrm.com';
```

---

## Login URLs

### Local:
- http://localhost:3000/admin
- http://localhost:3000/login

### Railway (when deployed):
- https://[your-app].railway.app/admin
- https://[your-app].railway.app/login

---

*Last Updated: 2025-09-27*
*Note: This file should be added to .gitignore*