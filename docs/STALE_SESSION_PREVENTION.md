# Stale Session Prevention System

## Overview
Comprehensive solution to prevent NextAuth JWT session stale user ID issues that occur after database reseeding, preventing foreign key constraint violations and authentication failures.

## Problem Statement
- **Issue**: NextAuth JWT tokens persist in browser cookies after database resets
- **Impact**: Foreign key violations when session contains non-existent user IDs
- **Trigger**: Always occurs after `npm run db:seed` or database resets
- **Symptom**: 500 errors on media uploads, site customization saves

## Production-Ready Solutions Implemented

### 1. ✅ Automatic Session Validation Middleware
**File**: `/middleware.ts`
**Function**: Validates JWT user IDs against database on every protected route request
**Action**: Auto-clears stale sessions and redirects to signin

```typescript
// Protects critical routes automatically
const protectedPaths = ['/admin', '/api/admin', '/api/site-customization', '/api/upload']
```

**Production Benefits**:
- Zero configuration required
- Automatic detection and cleanup
- Graceful user experience with redirect
- No application crashes or 500 errors

### 2. ✅ Session Clear API Endpoint
**File**: `/src/app/api/auth/clear-session/route.ts`
**Function**: Manual session clearing for development and troubleshooting

```bash
# Clear sessions manually
curl -X POST http://localhost:3000/api/auth/clear-session
# or
npm run session:clear
```

### 3. ✅ Post-Seed Cleanup Automation
**File**: `/scripts/post-seed-cleanup.js`
**Integration**: Automatically runs after `npm run db:seed`
**Function**: Provides clear instructions and warnings

```bash
# Enhanced seed command with cleanup
npm run db:seed  # Now includes automatic cleanup instructions
```

### 4. ✅ Enhanced NPM Scripts
**Added Commands**:
```json
{
  "session:clear": "curl -X POST http://localhost:3000/api/auth/clear-session",
  "db:seed": "npx tsx prisma/seed.ts && node scripts/post-seed-cleanup.js"
}
```

## Developer Workflow

### After Database Seeding
```bash
# 1. Run seed with automatic cleanup
npm run db:seed

# 2. Clear browser sessions (if needed)
npm run session:clear

# 3. Sign in again with fresh credentials
# Visit: http://localhost:3000/auth/signin
```

### For New Team Members
1. The system automatically handles stale sessions
2. Users get redirected to signin if session is invalid
3. No manual intervention required in production

## Production Deployment Checklist

### ✅ Environment Variables Required
- `DATABASE_URL` - Production database connection
- `NEXTAUTH_SECRET` - Secure random secret for JWT signing
- `NEXTAUTH_URL` - Production domain URL

### ✅ Security Considerations
- Middleware validates sessions on server-side only
- No sensitive data exposed in client-side redirects
- Proper cookie clearing with security flags
- Database connection pooling with error handling

### ✅ Performance Impact
- **Minimal**: Only validates on protected routes
- **Cached**: Uses efficient database queries with select optimization
- **Error-Resilient**: Continues on validation errors without breaking requests
- **Connection-Managed**: Proper Prisma client connection handling

### ✅ Monitoring and Logging
- Middleware logs stale session detection
- Clear error messages for troubleshooting
- Structured logging format for production monitoring

```typescript
// Example log output
console.warn(`[MIDDLEWARE] Stale session detected for user ID: ${token.sub}`);
```

## Testing Validation

### Manual Testing
1. Login to admin panel
2. Run `npm run db:seed` to reset database
3. Try to upload media or save site customization
4. **Expected**: Automatic redirect to signin (no 500 errors)
5. Sign in again and retry operation
6. **Expected**: Operations work normally

### Automated Testing
```bash
# Test session clearing
npm run session:clear
# Should return: {"success":true,"message":"Session cleared successfully"}

# Test middleware compilation
npm run dev
# Should compile middleware without errors
```

## Rollback Plan

If issues occur, disable middleware by renaming:
```bash
mv middleware.ts middleware.ts.disabled
```

System falls back to NextAuth default behavior.

## Production Monitoring

Monitor these metrics:
- Session validation errors in middleware logs
- Authentication redirect rates
- Foreign key constraint violation rates (should be zero)
- User login success rates after database operations

## Future Enhancements

Consider implementing:
- User notification system for stale session detection
- Admin dashboard for session health monitoring
- Automated session cleanup scheduling
- Integration with external session stores (Redis)

---

**Status**: ✅ Production Ready
**Last Updated**: 2025-09-26
**Tested**: Development Environment
**Deployment**: Ready for Production