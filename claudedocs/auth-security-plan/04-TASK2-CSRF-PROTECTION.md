# Task 2: CSRF Protection Enforcement

**Priority**: 🔴 CRITICAL
**Time Estimate**: 2-3 hours
**Files to Modify**: Multiple API routes

---

## Overview

### Current Issue
CSRF protection exists in the codebase but is not consistently enforced across all API routes. This leaves the application vulnerable to Cross-Site Request Forgery attacks where malicious websites can trick authenticated users into performing unwanted actions.

### What This Task Delivers
- ✅ CSRF protection middleware wrapper for easy application
- ✅ CSRF enforcement on all POST, PUT, DELETE, PATCH routes
- ✅ Frontend CSRF token handling
- ✅ Comprehensive testing procedures
- ✅ Security audit compliance

---

## Prerequisites

**Before Starting**:
- [ ] Verify `src/lib/security/csrf-protection.ts` exists
- [ ] Read CLAUDE.md coding standards
- [ ] Understand NextAuth.js middleware patterns
- [ ] Database backup completed
- [ ] Development environment running

**Required Knowledge**:
- Next.js 14 API routes
- NextAuth.js authentication
- CSRF attack vectors and prevention
- TypeScript middleware patterns
- Request/Response handling

---

## Implementation Steps

### Step 2.1: Verify CSRF Protection Implementation

**File to Review**: `src/lib/security/csrf-protection.ts`

**What to Check**:
```typescript
// Verify these components exist:
- CSRFProtection class
- generateToken() method
- validateToken() method
- middleware() method
```

**Validation Checklist**:
- [ ] File exists at correct path
- [ ] CSRFProtection class exported
- [ ] Token generation works with crypto.randomBytes
- [ ] Token validation includes expiry checking
- [ ] Middleware method returns NextResponse on failure

**If Missing**: This file should have been created as part of a previous security implementation. If it doesn't exist, you'll need to create it following the pattern in the main implementation plan.

---

### Step 2.2: Create CSRF Middleware Wrapper

**File**: `src/lib/middleware/with-csrf.ts` (NEW FILE)
**Purpose**: Reusable CSRF middleware wrapper following DRY principle

**Implementation**:
```typescript
/**
 * CSRF Protection Middleware Wrapper
 * DRY utility for adding CSRF to API routes
 * Following CLAUDE.md: Centralized, reusable, no duplication
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/security/csrf-protection';

/**
 * Wrap API route handler with CSRF protection
 * Use this for all POST, PUT, DELETE, PATCH routes
 *
 * @example
 * export const POST = withCSRF(async (request: NextRequest) => {
 *   // Your handler logic
 * });
 */
export function withCSRF(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
    const method = request.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return handler(request);
    }

    // Apply CSRF protection for mutation methods
    const csrfCheck = await CSRFProtection.middleware(request);
    if (csrfCheck) {
      // CSRF validation failed - return error response
      return csrfCheck;
    }

    // CSRF passed, proceed to handler
    return handler(request);
  };
}

/**
 * Apply CSRF check directly in route
 * Use at the beginning of POST/PUT/DELETE handlers
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const csrfCheck = await checkCSRF(request);
 *   if (csrfCheck) return csrfCheck;
 *   // Your handler logic
 * }
 */
export async function checkCSRF(
  request: NextRequest
): Promise<Response | null> {
  // Skip for safe methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  // Apply CSRF check
  return await CSRFProtection.middleware(request);
}
```

**Validation Checklist**:
- [ ] File created at `src/lib/middleware/with-csrf.ts`
- [ ] Two approaches provided (wrapper and inline)
- [ ] Safe HTTP methods (GET, HEAD, OPTIONS) are skipped
- [ ] TypeScript types are explicit (no `any`)
- [ ] Clear JSDoc documentation
- [ ] Follows DRY principle (centralized logic)
- [ ] No hardcoded values

**Why Two Approaches**:
- **withCSRF wrapper**: Clean, declarative, good for new routes
- **checkCSRF inline**: Flexible, good for existing routes with complex logic

---

### Step 2.3: Add CSRF to Authentication Routes

**Routes to Update**:
1. `src/app/api/auth/register/route.ts`
2. `src/app/api/auth/forgot-password/route.ts`
3. `src/app/api/auth/reset-password/route.ts`

**Pattern to Apply**:
```typescript
// ADD THIS IMPORT AT TOP
import { checkCSRF } from '@/lib/middleware/with-csrf';

export async function POST(request: NextRequest) {
  try {
    // ADD THIS LINE FIRST - CSRF Protection
    const csrfCheck = await checkCSRF(request);
    if (csrfCheck) return csrfCheck;

    // ... rest of existing code ...
  } catch (error) {
    // ... error handling ...
  }
}
```

**Implementation Steps**:

1. **Register Route** (`src/app/api/auth/register/route.ts`):
   - [ ] Add import: `import { checkCSRF } from '@/lib/middleware/with-csrf';`
   - [ ] Add CSRF check as first line in POST handler
   - [ ] Test registration still works
   - [ ] Verify CSRF error returns 403

2. **Forgot Password Route** (`src/app/api/auth/forgot-password/route.ts`):
   - [ ] Add import
   - [ ] Add CSRF check
   - [ ] Test password reset flow
   - [ ] Verify CSRF protection active

3. **Reset Password Route** (`src/app/api/auth/reset-password/route.ts`):
   - [ ] Add import
   - [ ] Add CSRF check
   - [ ] Test password reset completion
   - [ ] Verify protection works

**Validation Checklist**:
- [ ] All three routes updated
- [ ] CSRF check is first operation in handler
- [ ] Error handling preserved
- [ ] No TypeScript errors
- [ ] Routes still functional with valid tokens

---

### Step 2.4: Add CSRF to Settings Routes

**Routes to Update**:
- `src/app/api/settings/password/route.ts` (POST)
- `src/app/api/settings/account/route.ts` (PUT)
- `src/app/api/settings/addresses/route.ts` (POST)
- `src/app/api/settings/addresses/[id]/route.ts` (PUT, DELETE)
- `src/app/api/settings/addresses/[id]/default/route.ts` (PUT)
- `src/app/api/settings/preferences/route.ts` (PUT)

**Pattern for Multiple HTTP Methods**:
```typescript
import { checkCSRF } from '@/lib/middleware/with-csrf';

export async function POST(request: NextRequest) {
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;
  // ... POST handler logic ...
}

export async function PUT(request: NextRequest) {
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;
  // ... PUT handler logic ...
}

export async function DELETE(request: NextRequest) {
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;
  // ... DELETE handler logic ...
}
```

**Systematic Approach**:
1. Find all settings routes with glob:
   ```bash
   find src/app/api/settings -name "route.ts" -type f
   ```
2. For each file:
   - [ ] Add import statement
   - [ ] Identify all mutation methods (POST, PUT, DELETE, PATCH)
   - [ ] Add CSRF check as first line in each method
   - [ ] Test the route functionality
   - [ ] Verify CSRF protection

**Validation Checklist**:
- [ ] All settings routes identified
- [ ] CSRF check added to all mutation methods
- [ ] GET methods untouched (no CSRF needed)
- [ ] Routes tested and functional
- [ ] No TypeScript errors

---

### Step 2.5: Add CSRF to Admin Routes

**Discovery Process**:
```bash
# Find all admin API routes
find src/app/api/admin -name "route.ts" | xargs grep -l "POST\|PUT\|DELETE\|PATCH"
```

**Routes to Update** (Common Admin Routes):
- `src/app/api/admin/products/*` - Product management
- `src/app/api/admin/orders/*` - Order management
- `src/app/api/admin/customers/*` - Customer management
- `src/app/api/admin/settings/*` - Admin settings
- Any other admin routes with mutations

**Pattern**:
```typescript
import { checkCSRF } from '@/lib/middleware/with-csrf';

export async function POST(request: NextRequest) {
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;
  // ... existing logic ...
}

// Repeat for PUT, DELETE, PATCH methods
```

**Systematic Application**:
1. **List all admin routes**:
   ```bash
   ls -R src/app/api/admin/**/*route.ts
   ```

2. **For each route file**:
   - [ ] Read file to identify mutation methods
   - [ ] Add CSRF import
   - [ ] Add CSRF check to each mutation method
   - [ ] Preserve existing authentication checks
   - [ ] Test admin functionality

3. **Priority Order**:
   - High: Orders, Payments, User management
   - Medium: Products, Categories, Settings
   - Low: Analytics, Reports (if read-only)

**Validation Checklist**:
- [ ] All admin routes with mutations protected
- [ ] Authentication checks still work
- [ ] Admin panel functionality tested
- [ ] No performance degradation
- [ ] Logs show CSRF checks activating

---

### Step 2.6: Add CSRF to SuperAdmin Routes

**Discovery Process**:
```bash
# Find all superadmin API routes
find src/app/api/superadmin -name "route.ts" | xargs grep -l "POST\|PUT\|DELETE\|PATCH"
```

**Common SuperAdmin Routes**:
- `src/app/api/superadmin/users/*` - User management
- `src/app/api/superadmin/admins/*` - Admin management
- `src/app/api/superadmin/settings/*` - System settings
- `src/app/api/superadmin/audit/*` - Audit operations

**Same Pattern as Admin Routes**:
```typescript
import { checkCSRF } from '@/lib/middleware/with-csrf';

export async function POST(request: NextRequest) {
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;
  // ... existing logic ...
}
```

**Validation Checklist**:
- [ ] All superadmin routes protected
- [ ] SuperAdmin panel tested
- [ ] User management functions work
- [ ] System settings updates protected

---

### Step 2.7: Frontend CSRF Token Handling

**File**: `src/lib/api/fetch-with-csrf.ts` (NEW FILE)
**Purpose**: Fetch wrapper that automatically includes CSRF token

**Implementation**:
```typescript
/**
 * Fetch with CSRF Token
 * Wrapper for API calls that automatically includes CSRF protection
 *
 * IMPORTANT: This is a simplified implementation for client-side usage.
 * In production, CSRF tokens should be:
 * 1. Generated on the server
 * 2. Stored in HTTP-only cookies
 * 3. Retrieved from cookies by the browser
 * 4. Validated on the server
 */

export interface FetchWithCSRFOptions extends RequestInit {
  skipCSRF?: boolean; // Option to skip CSRF for specific calls
}

/**
 * Fetch wrapper that automatically includes CSRF token
 * Use this for all POST/PUT/DELETE/PATCH requests
 *
 * @example
 * const response = await fetchWithCSRF('/api/settings/profile', {
 *   method: 'PUT',
 *   body: JSON.stringify(data)
 * });
 */
export async function fetchWithCSRF(
  url: string,
  options: FetchWithCSRFOptions = {}
): Promise<Response> {
  // Skip CSRF for GET, HEAD, OPTIONS
  const method = (options.method || 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method) || options.skipCSRF) {
    return fetch(url, options);
  }

  // Get CSRF token from cookie or meta tag
  const csrfToken = getCSRFToken();

  // Merge headers with CSRF token
  const headers = new Headers(options.headers || {});
  if (csrfToken) {
    headers.set('x-csrf-token', csrfToken);
  }

  // Ensure Content-Type is set for JSON
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Make request with CSRF token
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle CSRF token refresh (403 with new token)
  if (response.status === 403) {
    const data = await response.json();
    if (data.newToken) {
      // Store new token and retry
      setCSRFToken(data.newToken);
      headers.set('x-csrf-token', data.newToken);

      return fetch(url, {
        ...options,
        headers,
      });
    }
  }

  return response;
}

/**
 * Get CSRF token from meta tag or cookie
 * Priority: meta tag > cookie
 */
function getCSRFToken(): string | null {
  // Try meta tag first (for SSR)
  if (typeof document !== 'undefined') {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }

    // Try cookie as fallback
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf-token') {
        return decodeURIComponent(value);
      }
    }
  }

  return null;
}

/**
 * Store CSRF token in cookie for future requests
 */
function setCSRFToken(token: string): void {
  if (typeof document !== 'undefined') {
    document.cookie = `csrf-token=${encodeURIComponent(token)}; path=/; SameSite=Strict`;
  }
}
```

**Note**: This is a client-side utility. The actual CSRF token generation and validation happens on the server (in `CSRFProtection` class).

**Validation Checklist**:
- [ ] File created at `src/lib/api/fetch-with-csrf.ts`
- [ ] Token retrieval from cookie/meta tag works
- [ ] Automatic retry on token refresh
- [ ] TypeScript types explicit
- [ ] Documentation clear about usage

---

### Step 2.8: Test CSRF Protection

**Manual Testing Procedures**:

#### Test 1: Valid CSRF Token
**Purpose**: Verify requests with valid tokens succeed

**Steps**:
1. [ ] Open browser DevTools → Network tab
2. [ ] Login to application
3. [ ] Submit a form (e.g., update profile)
4. [ ] Inspect request headers
5. [ ] Verify `x-csrf-token` header present
6. [ ] Verify request succeeds (200/201 status)
7. [ ] Check response for no CSRF errors

**Expected Result**: Request completes successfully

---

#### Test 2: Missing CSRF Token
**Purpose**: Verify requests without tokens are blocked

**Steps**:
1. [ ] Open browser console
2. [ ] Run manual fetch without CSRF token:
   ```javascript
   fetch('/api/settings/profile', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ test: 'data' })
   }).then(r => r.json()).then(console.log);
   ```
3. [ ] Check response status
4. [ ] Verify 403 Forbidden returned
5. [ ] Check error message mentions CSRF

**Expected Result**: 403 error with CSRF failure message

---

#### Test 3: Invalid CSRF Token
**Purpose**: Verify requests with fake tokens are blocked

**Steps**:
1. [ ] Open browser console
2. [ ] Run fetch with fake token:
   ```javascript
   fetch('/api/settings/profile', {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
       'x-csrf-token': 'fake-invalid-token-12345'
     },
     body: JSON.stringify({ test: 'data' })
   }).then(r => r.json()).then(console.log);
   ```
3. [ ] Verify 403 Forbidden returned
4. [ ] Check error message

**Expected Result**: 403 error, invalid token message

---

#### Test 4: Expired CSRF Token
**Purpose**: Verify old tokens are rejected and refreshed

**Steps**:
1. [ ] Generate CSRF token
2. [ ] Wait for token expiry (or manually set old timestamp)
3. [ ] Try to use expired token
4. [ ] Verify 403 response with new token
5. [ ] Verify automatic retry with new token works

**Expected Result**: First request fails, retry succeeds

---

#### Test 5: Safe Methods Bypass
**Purpose**: Verify GET requests don't require CSRF

**Steps**:
1. [ ] Make GET request without CSRF token:
   ```javascript
   fetch('/api/settings/profile').then(r => r.json()).then(console.log);
   ```
2. [ ] Verify request succeeds
3. [ ] Check no CSRF validation occurred

**Expected Result**: GET request works without CSRF token

---

#### Test 6: Comprehensive Route Testing
**Purpose**: Verify all protected routes enforce CSRF

**Routes to Test**:
- [ ] `/api/auth/register` (POST)
- [ ] `/api/auth/forgot-password` (POST)
- [ ] `/api/auth/reset-password` (POST)
- [ ] `/api/settings/password` (POST)
- [ ] `/api/settings/account` (PUT)
- [ ] `/api/admin/products` (POST/PUT/DELETE)
- [ ] `/api/superadmin/users` (POST/PUT/DELETE)

**For Each Route**:
1. Test with valid token → Should succeed
2. Test without token → Should fail with 403
3. Test with invalid token → Should fail with 403

---

### Testing Checklist Summary

**Authentication Routes**:
- [ ] Register route protected
- [ ] Forgot password protected
- [ ] Reset password protected

**Settings Routes**:
- [ ] Password change protected
- [ ] Profile update protected
- [ ] Address management protected
- [ ] Preferences update protected

**Admin Routes**:
- [ ] Product management protected
- [ ] Order management protected
- [ ] Customer management protected
- [ ] Settings updates protected

**SuperAdmin Routes**:
- [ ] User management protected
- [ ] Admin management protected
- [ ] System settings protected

**Edge Cases**:
- [ ] Expired tokens handled
- [ ] Missing tokens rejected
- [ ] Invalid tokens rejected
- [ ] GET requests bypass CSRF
- [ ] Token refresh works

---

## Database Verification

**Check CSRF-related audit logs**:
```sql
-- Verify CSRF failures are logged
SELECT * FROM audit_logs
WHERE details->>'csrfValidation' = 'failed'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check for suspicious patterns
SELECT
  details->>'ipAddress' as ip,
  COUNT(*) as failed_attempts,
  MAX("createdAt") as last_attempt
FROM audit_logs
WHERE details->>'csrfValidation' = 'failed'
GROUP BY details->>'ipAddress'
HAVING COUNT(*) > 10
ORDER BY failed_attempts DESC;
```

---

## Troubleshooting

### Issue: All requests failing with 403

**Possible Causes**:
1. CSRF token not being generated
2. Token not stored in cookie/meta tag
3. Middleware applied to GET requests incorrectly

**Solutions**:
1. Check `CSRFProtection.generateToken()` works
2. Verify token storage in browser (check cookies/meta)
3. Ensure safe methods (GET, HEAD, OPTIONS) are skipped
4. Check browser console for CSRF errors

---

### Issue: Token refresh not working

**Possible Causes**:
1. New token not returned in 403 response
2. Frontend not detecting new token
3. Cookie not being updated

**Solutions**:
1. Verify server returns `newToken` in 403 response
2. Check `fetchWithCSRF` handles token refresh
3. Verify `setCSRFToken()` updates cookie correctly

---

### Issue: Performance degradation

**Possible Causes**:
1. Token validation on every request (including GET)
2. Crypto operations too slow
3. No caching of token validation

**Solutions**:
1. Ensure GET requests bypass CSRF check
2. Review token generation algorithm
3. Consider caching valid tokens (short TTL)

---

## Success Criteria

### Task Complete When:
- [ ] CSRF middleware created and documented
- [ ] All mutation routes protected (POST, PUT, DELETE, PATCH)
- [ ] Frontend fetch wrapper implemented
- [ ] All manual tests passed
- [ ] No false positives (legitimate requests blocked)
- [ ] No false negatives (malicious requests succeed)
- [ ] Performance acceptable (<10ms overhead per request)
- [ ] Documentation updated

### Quality Metrics:
- **Coverage**: 100% of mutation endpoints protected
- **False Positive Rate**: <0.1% (legitimate requests blocked)
- **Performance**: <10ms CSRF validation overhead
- **Security**: No CSRF vulnerabilities in penetration test

---

## Next Steps

After completing this task:
1. ✅ CSRF protection enforced across all routes
2. ➡️ Proceed to [05-TASK3-ADMIN-PASSWORD.md](./05-TASK3-ADMIN-PASSWORD.md)
3. Continue with Phase 1 implementation

**Related Tasks**:
- **Previous**: [03-TASK1-FORGOT-PASSWORD.md](./03-TASK1-FORGOT-PASSWORD.md)
- **Next**: [05-TASK3-ADMIN-PASSWORD.md](./05-TASK3-ADMIN-PASSWORD.md)
- **Testing**: [08-TESTING-GUIDE.md](./08-TESTING-GUIDE.md)

---

**Task Version**: 1.0
**Last Updated**: January 2025
**Estimated Time**: 2-3 hours
**Difficulty**: Medium
**Prerequisites**: Understanding of CSRF attacks and Next.js middleware
