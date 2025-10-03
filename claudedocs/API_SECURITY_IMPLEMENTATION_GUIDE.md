# API Security & Performance Implementation Guide
**EcomJRM Platform - Complete Remediation Plan**

**Document Version:** 1.0
**Last Updated:** 2025-10-03
**Estimated Implementation Time:** 4-6 weeks (1-2 developers)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Critical Security Fixes (Days 1-3)](#phase-1-critical-security-fixes)
4. [Phase 2: Core Infrastructure (Week 1-2)](#phase-2-core-infrastructure)
5. [Phase 3: Performance & Architecture (Week 2-4)](#phase-3-performance--architecture)
6. [Phase 4: Enhancements (Month 2)](#phase-4-enhancements)
7. [Code Reference Library](#code-reference-library)
8. [Testing & Validation](#testing--validation)
9. [Deployment Checklist](#deployment-checklist)

---

## Quick Start

### Severity Legend
- 🔴 **CRITICAL** - Security vulnerabilities, production incidents possible
- 🟡 **HIGH** - Performance issues, architecture violations
- 🟢 **MEDIUM** - Code quality, maintainability improvements

### Implementation Overview
```
Phase 1 (Days 1-3)    → 7 Critical fixes
Phase 2 (Week 1-2)    → 9 High priority fixes
Phase 3 (Week 2-4)    → 6 High priority fixes
Phase 4 (Month 2)     → 7 Medium priority enhancements
```

---

## Prerequisites

### Required Tools
- Node.js 18+
- PostgreSQL/MySQL database access
- Git access to repository
- Access to production environment variables
- Prisma CLI: `npm install -g prisma`

### Required Knowledge
- TypeScript/JavaScript
- Next.js 14 App Router
- Prisma ORM
- NextAuth.js
- Basic security concepts

### Backup & Safety
```bash
# 1. Create feature branch
git checkout -b security/api-audit-fixes

# 2. Backup database
pg_dump your_database > backup_$(date +%Y%m%d).sql

# 3. Document current behavior
npm run test:api > test_baseline.txt
```

---

## Phase 1: Critical Security Fixes

**Duration:** 3 days
**Risk Level:** 🔴 Critical
**Impact:** High - Addresses active security vulnerabilities

### Fix 1: Remove Test Endpoints from Production

**Time:** 2 hours
**Priority:** 🔴 CRITICAL
**Files:** `src/middleware.ts`, `src/app/api/test/**`

#### Step 1.1: Update Middleware to Block Test Routes

Create or update `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CRITICAL: Block all test endpoints in production
  if (pathname.startsWith('/api/test') || pathname.startsWith('/api/debug')) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`🚫 Blocked test endpoint access in production: ${pathname}`);
      return NextResponse.json(
        { message: 'Not found' },
        { status: 404 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/test/:path*',
    '/api/debug/:path*',
    '/api/payment/test-simulator/:path*',
  ],
};
```

#### Step 1.2: Add Environment Guards to Test Files

Update each test endpoint file to add guards:

```typescript
// src/app/api/test/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Environment guard
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Development test endpoint',
    timestamp: new Date().toISOString(),
  });
}
```

#### Step 1.3: Update All Test Endpoints

Apply the same pattern to:
- `src/app/api/test/db/route.ts`
- `src/app/api/test/auth-debug/route.ts`
- `src/app/api/test/reset-membership/route.ts`
- `src/app/api/test/session/route.ts`
- `src/app/api/test/payment-success/route.ts`
- `src/app/api/test/prisma-fields/route.ts`
- `src/app/api/payment/test-simulator/route.ts`

#### Step 1.4: Verification

```bash
# Test in development (should work)
NODE_ENV=development curl http://localhost:3000/api/test
# Expected: {"status":"ok",...}

# Test in production mode (should fail)
NODE_ENV=production curl http://localhost:3000/api/test
# Expected: {"message":"Not found"} with 404

# Verify middleware is active
npm run build && npm run start
curl http://localhost:3000/api/test
# Expected: 404 in production build
```

---

### Fix 2: Enable Rate Limiting

**Time:** 1 hour
**Priority:** 🔴 CRITICAL
**Files:** `src/app/api/chat/send/route.ts`

#### Step 2.1: Enable Rate Limiting on Chat Endpoints

```typescript
// src/app/api/chat/send/route.ts

import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';

// Remove this line:
// export const POST = handlePOST; // Temporarily disable rate limiting for testing

// Replace with environment-aware rate limiting:
export const POST = process.env.ENABLE_RATE_LIMITING !== 'false'
  ? withRateLimit(handlePOST, RateLimitPresets.CHAT_API)
  : handlePOST;

// For strict production enforcement:
// export const POST = withRateLimit(handlePOST, RateLimitPresets.CHAT_API);
```

#### Step 2.2: Verify Rate Limit Configuration

Check `src/lib/middleware/rate-limit.ts` for proper configuration:

```typescript
export const RateLimitPresets = {
  CHAT_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // Adjust based on your needs
    message: 'Too many messages sent. Please wait before sending another message.'
  },
  // ... other presets
};
```

#### Step 2.3: Add Rate Limiting to Other High-Risk Endpoints

```typescript
// src/app/api/auth/register/route.ts
import { withRateLimit } from '@/lib/middleware/rate-limit';

async function handlePOST(request: NextRequest) {
  // Registration logic
}

export const POST = withRateLimit(handlePOST, {
  windowMs: 60 * 1000,
  maxRequests: 3, // Only 3 registration attempts per minute
  message: 'Too many registration attempts. Please try again later.'
});

// Apply to:
// - /api/auth/register
// - /api/auth/[...nextauth]
// - /api/payment/create-bill
// - /api/webhooks/*
```

#### Step 2.4: Testing Rate Limits

```bash
# Test rate limiting with curl
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/chat/send \
    -H "Content-Type: application/json" \
    -d '{"sessionId":"test","content":"test"}' \
    -w "\n%{http_code}\n"
  sleep 1
done

# Expected: First 10 succeed (200), next 5 fail (429)
```

---

### Fix 3: Fix Authorization Consistency (SUPERADMIN)

**Time:** 3 hours
**Priority:** 🔴 CRITICAL
**Files:** Multiple admin routes

#### Step 3.1: Create Centralized Authorization Helper

Create `src/lib/auth/authorization.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';

// Define role hierarchies
export const ROLES = {
  SUPERADMIN_ONLY: [UserRole.SUPERADMIN],
  ADMIN_ROLES: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
  MEMBER_ROLES: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF, UserRole.USER],
} as const;

/**
 * Require admin-level access (SUPERADMIN, ADMIN, or STAFF)
 */
export async function requireAdminRole() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      ),
      session: null,
    };
  }

  if (!ROLES.ADMIN_ROLES.includes(session.user.role)) {
    return {
      error: NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Require superadmin-only access
 */
export async function requireSuperAdminRole() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      ),
      session: null,
    };
  }

  if (session.user.role !== UserRole.SUPERADMIN) {
    return {
      error: NextResponse.json(
        { message: 'Unauthorized. SuperAdmin access required.' },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Require authenticated user (any role)
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}
```

#### Step 3.2: Update Admin Product Routes

Update `src/app/api/admin/products/route.ts`:

```typescript
import { requireAdminRole } from '@/lib/auth/authorization';

export async function POST(request: NextRequest) {
  // OLD CODE - REMOVE:
  // const session = await getServerSession(authOptions);
  // if (!session?.user ||
  //     (session.user.role !== UserRole.ADMIN &&
  //      session.user.role !== UserRole.STAFF)) {

  // NEW CODE:
  const { error, session } = await requireAdminRole();
  if (error) return error;

  // Rest of the handler
  const body = await request.json();
  // ...
}

export async function GET(request: NextRequest) {
  const { error, session } = await requireAdminRole();
  if (error) return error;

  // Rest of the handler
  // ...
}
```

#### Step 3.3: Update All Admin Routes

Apply the same pattern to:

```bash
# Find all files with admin role checks
grep -r "UserRole.ADMIN" src/app/api/admin --include="*.ts" -l

# Update each file:
# - src/app/api/admin/products/route.ts
# - src/app/api/admin/products/[id]/route.ts
# - src/app/api/admin/customers/route.ts
# - src/app/api/admin/orders/route.ts
# - src/app/api/admin/settings/**/*.ts
# - src/app/api/admin/chat/**/*.ts
# ... and all other admin routes
```

#### Step 3.4: Update SuperAdmin-Only Routes

```typescript
// src/app/api/superadmin/users/route.ts
import { requireSuperAdminRole } from '@/lib/auth/authorization';

export async function GET(request: NextRequest) {
  const { error, session } = await requireSuperAdminRole();
  if (error) return error;

  // SuperAdmin-only logic
  // ...
}
```

#### Step 3.5: Verification Script

Create `scripts/verify-auth.ts`:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function verifyAuth() {
  // Check for old patterns
  const { stdout } = await execAsync(
    `grep -r "session.user.role !== UserRole.ADMIN" src/app/api/admin --include="*.ts" || echo "PASS"`
  );

  if (!stdout.includes('PASS')) {
    console.error('❌ Found old authorization patterns:');
    console.error(stdout);
    process.exit(1);
  }

  // Check for new pattern usage
  const { stdout: imports } = await execAsync(
    `grep -r "requireAdminRole\\|requireSuperAdminRole" src/app/api/admin --include="*.ts" -c`
  );

  console.log('✅ Authorization patterns updated');
  console.log(`Found ${imports.split('\n').length} files using new helpers`);
}

verifyAuth();
```

Run verification:
```bash
npx tsx scripts/verify-auth.ts
```

---

### Fix 4: Implement User Validation Caching

**Time:** 2 hours
**Priority:** 🔴 CRITICAL
**Files:** `src/lib/auth/config.ts`, `src/lib/auth/cache.ts`

#### Step 4.1: Install LRU Cache

```bash
npm install lru-cache
npm install --save-dev @types/lru-cache
```

#### Step 4.2: Create User Validation Cache

Create `src/lib/auth/cache.ts`:

```typescript
import { LRUCache } from 'lru-cache';

// User validation cache - prevents DB query on every request
const userValidationCache = new LRUCache<string, boolean>({
  max: 5000, // Cache up to 5000 users
  ttl: 60 * 1000, // 1 minute TTL
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

export function getCachedUserValidation(userId: string): boolean | undefined {
  return userValidationCache.get(userId);
}

export function setCachedUserValidation(userId: string, isValid: boolean): void {
  userValidationCache.set(userId, isValid);
}

export function invalidateUserValidation(userId: string): void {
  userValidationCache.delete(userId);
}

export function clearUserValidationCache(): void {
  userValidationCache.clear();
}

// Session data cache - reduces DB queries for user info
const sessionDataCache = new LRUCache<string, {
  role: string;
  isMember: boolean;
  memberSince: Date | null;
  status: string;
}>({
  max: 5000,
  ttl: 5 * 60 * 1000, // 5 minute TTL for session data
});

export function getCachedSessionData(userId: string) {
  return sessionDataCache.get(userId);
}

export function setCachedSessionData(userId: string, data: any): void {
  sessionDataCache.set(userId, data);
}

export function invalidateSessionData(userId: string): void {
  sessionDataCache.delete(userId);
}
```

#### Step 4.3: Update Auth Config to Use Cache

Update `src/lib/auth/config.ts`:

```typescript
import {
  getCachedUserValidation,
  setCachedUserValidation,
  getCachedSessionData,
  setCachedSessionData
} from '@/lib/auth/cache';

export const authOptions: NextAuthOptions = {
  // ... existing config
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.isMember = user.isMember;
        token.memberSince = user.memberSince;
      }

      // Validate that user still exists in database
      if (token.sub) {
        // Check cache first
        const cachedValid = getCachedUserValidation(token.sub);

        if (cachedValid !== undefined) {
          if (!cachedValid) {
            console.warn(`Cached invalid user: ${token.sub}`);
            return {};
          }

          // Use cached session data if available
          const cachedData = getCachedSessionData(token.sub);
          if (cachedData && trigger !== 'update') {
            token.role = cachedData.role;
            token.isMember = cachedData.isMember;
            token.memberSince = cachedData.memberSince;
            return token;
          }
        }

        // Cache miss - query database
        const userExists = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            role: true,
            isMember: true,
            memberSince: true,
            status: true
          },
        });

        if (!userExists || userExists.status !== UserStatus.ACTIVE) {
          // Cache invalid user
          setCachedUserValidation(token.sub, false);
          console.warn(
            `Token validation failed for user ${token.sub}: ${
              !userExists ? 'User not found' : 'User not active'
            }`
          );
          return {};
        }

        // Cache valid user and session data
        setCachedUserValidation(token.sub, true);
        setCachedSessionData(token.sub, {
          role: userExists.role,
          isMember: userExists.isMember,
          memberSince: userExists.memberSince,
          status: userExists.status,
        });

        // Refresh user data when session.update() is called
        if (trigger === 'update' || !token.role) {
          token.role = userExists.role;
          token.isMember = userExists.isMember;
          token.memberSince = userExists.memberSince;
        }
      }

      return token;
    },
    // ... rest of callbacks
  },
};
```

#### Step 4.4: Invalidate Cache on User Changes

Create `src/lib/auth/events.ts`:

```typescript
import { invalidateUserValidation, invalidateSessionData } from './cache';

/**
 * Call this when user data changes (role, status, membership, etc.)
 */
export function invalidateUserCache(userId: string): void {
  invalidateUserValidation(userId);
  invalidateSessionData(userId);
  console.log(`🔄 Invalidated cache for user: ${userId}`);
}
```

Update user modification endpoints to invalidate cache:

```typescript
// Example: src/app/api/admin/users/[id]/route.ts
import { invalidateUserCache } from '@/lib/auth/events';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // ... update user logic

  await prisma.user.update({
    where: { id: params.id },
    data: { /* updates */ }
  });

  // Invalidate cache after update
  invalidateUserCache(params.id);

  return NextResponse.json({ success: true });
}
```

#### Step 4.5: Performance Testing

```bash
# Before: Measure baseline
npm run test:load -- --endpoint=/api/cart --requests=100

# After: Measure with cache
npm run test:load -- --endpoint=/api/cart --requests=100

# Expected improvement: 50-100ms reduction per request
```

---

### Fix 5: Apply API Protection Middleware System-Wide

**Time:** 4 hours
**Priority:** 🔴 CRITICAL
**Files:** `src/middleware.ts`, `src/lib/middleware/api-protection.ts`

#### Step 5.1: Update Global Middleware

Update `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { protectApiEndpoint, protectionConfigs } from '@/lib/middleware/api-protection';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Block test endpoints in production
  if ((pathname.startsWith('/api/test') || pathname.startsWith('/api/debug')) &&
      process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  // 2. Apply API protection to all API routes
  if (pathname.startsWith('/api/')) {
    // Determine protection level based on route
    let config = protectionConfigs.standard;

    // Public endpoints - minimal protection
    if (
      pathname.startsWith('/api/health') ||
      pathname.startsWith('/api/products') ||
      pathname.startsWith('/api/categories') ||
      pathname.startsWith('/api/branding')
    ) {
      config = protectionConfigs.public;
    }

    // Admin endpoints - strict protection
    if (
      pathname.startsWith('/api/admin') ||
      pathname.startsWith('/api/superadmin')
    ) {
      config = protectionConfigs.admin;
    }

    // Authenticated endpoints - standard protection
    if (
      pathname.startsWith('/api/member') ||
      pathname.startsWith('/api/user') ||
      pathname.startsWith('/api/settings') ||
      pathname.startsWith('/api/cart') ||
      pathname.startsWith('/api/orders')
    ) {
      config = protectionConfigs.authenticated;
    }

    // Sensitive operations - strict protection
    if (
      pathname.startsWith('/api/payment') ||
      pathname.startsWith('/api/auth/register')
    ) {
      config = protectionConfigs.sensitive;
    }

    // Webhooks - special handling
    if (pathname.startsWith('/api/webhooks')) {
      config = {
        ...protectionConfigs.standard,
        corsProtection: { enabled: false, allowedOrigins: [] }, // External webhooks
        rateLimiting: { enabled: true, requestsPerMinute: 100 },
      };
    }

    // Apply protection
    const protection = await protectApiEndpoint(request, config);
    if (!protection.allowed) {
      return protection.response;
    }
  }

  // 3. Session validation for authenticated routes
  // (handled by session-validator middleware)

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
  ],
};
```

#### Step 5.2: Remove Redundant withApiProtection Calls

Since middleware now handles all routes, remove individual `withApiProtection` wrappers:

```typescript
// src/app/api/cart/route.ts - BEFORE
export const GET = withApiProtection(handleGET, protectionConfigs.standard);

// src/app/api/cart/route.ts - AFTER
export const GET = handleGET;

// Middleware handles protection globally
```

#### Step 5.3: Configure Protection Levels

Review and adjust `src/lib/middleware/api-protection.ts` configs:

```typescript
export const protectionConfigs = {
  public: {
    rateLimiting: { enabled: true, requestsPerMinute: 100 },
    corsProtection: { enabled: true, allowedOrigins: ['*'] },
    userAgentValidation: { enabled: false },
    requireAuth: false,
  },

  standard: {
    rateLimiting: { enabled: true, requestsPerMinute: 60 },
    corsProtection: { enabled: true, allowedOrigins: [
      process.env.NEXTAUTH_URL || '',
      process.env.NEXT_PUBLIC_APP_URL || '',
    ]},
    userAgentValidation: { enabled: true, blockSuspicious: false },
    requireAuth: false,
  },

  authenticated: {
    rateLimiting: { enabled: true, requestsPerMinute: 30 },
    corsProtection: { enabled: true, allowedOrigins: [] },
    userAgentValidation: { enabled: true, blockSuspicious: true },
    requireAuth: true,
  },

  admin: {
    rateLimiting: { enabled: true, requestsPerMinute: 20 },
    corsProtection: { enabled: true, allowedOrigins: [] },
    userAgentValidation: { enabled: true, blockSuspicious: true },
    requireAuth: true,
    adminOnly: true,
  },

  sensitive: {
    rateLimiting: { enabled: true, requestsPerMinute: 10 },
    corsProtection: { enabled: true, allowedOrigins: [] },
    userAgentValidation: { enabled: true, blockSuspicious: true },
    requireAuth: true,
  },
};
```

#### Step 5.4: Testing Protection

```bash
# Test CORS protection
curl -X GET http://localhost:3000/api/cart \
  -H "Origin: https://evil.com" \
  -v
# Expected: 403 Forbidden

# Test rate limiting
for i in {1..100}; do curl http://localhost:3000/api/products; done
# Expected: First 100 succeed, then 429

# Test user agent blocking
curl -X GET http://localhost:3000/api/member/orders \
  -H "User-Agent: curl/7.0 (suspicious-bot)" \
  -v
# Expected: 403 Forbidden
```

---

### Fix 6: Extend Session Validation Coverage

**Time:** 1 hour
**Priority:** 🔴 CRITICAL
**Files:** `src/middleware/session-validator.ts`

#### Step 6.1: Update Session Validation Paths

```typescript
// src/middleware/session-validator.ts

export const sessionValidationPaths = [
  // Admin routes
  '/admin/:path*',
  '/api/admin/:path*',
  '/api/superadmin/:path*',

  // Member routes
  '/api/member/:path*',

  // User routes
  '/api/user/:path*',
  '/api/settings/:path*',

  // E-commerce authenticated routes
  '/api/cart/:path*',
  '/api/orders/:path*',
  '/api/wishlist/:path*',

  // Customization routes
  '/api/site-customization/:path*',
  '/api/upload/:path*',

  // Chat (authenticated sessions)
  '/api/chat/send/:path*',
];
```

#### Step 6.2: Remove Redundant User Existence Checks

Now that middleware validates sessions, remove redundant checks:

```typescript
// src/app/api/cart/route.ts - REMOVE THIS:
const userExists = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { id: true }
});

if (!userExists) {
  return NextResponse.json(
    { message: 'User session invalid' },
    { status: 401 }
  );
}

// Middleware already validated - can trust session.user.id exists
```

---

### Fix 7: Fix Audit Log Error Handling

**Time:** 2 hours
**Priority:** 🔴 CRITICAL
**Files:** Multiple admin routes, new audit utility

#### Step 7.1: Create Centralized Audit Logger

Create `src/lib/audit/logger.ts`:

```typescript
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

interface AuditLogData {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'LOGOUT';
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

// Queue for failed audit logs
const auditQueue: AuditLogData[] = [];
let isProcessingQueue = false;

/**
 * Log audit event with proper error handling and queueing
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({ data });
  } catch (error) {
    // CRITICAL: Audit log failure is a system issue
    console.error('🚨 CRITICAL: Audit log failed:', error);

    // Alert monitoring system (if available)
    if (process.env.SENTRY_DSN) {
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureException(error, {
        tags: {
          severity: 'critical',
          type: 'audit_log_failure'
        },
        extra: data,
      });
    }

    // Queue for retry
    auditQueue.push(data);
    processAuditQueue();
  }
}

/**
 * Process queued audit logs
 */
async function processAuditQueue(): Promise<void> {
  if (isProcessingQueue || auditQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (auditQueue.length > 0) {
    const item = auditQueue[0];

    try {
      await prisma.auditLog.create({ data: item });
      auditQueue.shift(); // Remove successful item
    } catch (error) {
      console.error('Failed to process queued audit log:', error);
      // Keep in queue and try again later
      break;
    }

    // Small delay between retries
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  isProcessingQueue = false;

  // Schedule next queue processing if items remain
  if (auditQueue.length > 0) {
    setTimeout(processAuditQueue, 60000); // Retry in 1 minute
  }
}

/**
 * Get audit queue status
 */
export function getAuditQueueStatus() {
  return {
    queueLength: auditQueue.length,
    isProcessing: isProcessingQueue,
  };
}
```

#### Step 7.2: Update All Audit Log Calls

Replace all audit log calls in admin routes:

```typescript
// BEFORE:
try {
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'CREATE',
      resource: 'PRODUCT',
      resourceId: result.id,
      details: { /* ... */ },
    },
  });
} catch (auditError) {
  console.warn('Failed to create audit log:', auditError);
}

// AFTER:
import { logAudit } from '@/lib/audit/logger';

await logAudit({
  userId: session.user.id,
  action: 'CREATE',
  resource: 'PRODUCT',
  resourceId: result.id,
  details: {
    productName: result.name,
    sku: result.sku,
  },
  ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
  userAgent: request.headers.get('user-agent') || 'unknown',
});
```

#### Step 7.3: Add Audit Monitoring Endpoint

Create `src/app/api/admin/audit/status/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';
import { getAuditQueueStatus } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error } = await requireAdminRole();
  if (error) return error;

  const status = getAuditQueueStatus();

  return NextResponse.json({
    ...status,
    healthy: status.queueLength < 100, // Alert if queue grows too large
    timestamp: new Date().toISOString(),
  });
}
```

---

## Phase 1 Completion Checklist

```bash
✅ Test endpoints blocked in production
✅ Rate limiting enabled on critical endpoints
✅ Authorization helpers created and applied
✅ User validation caching implemented
✅ API protection middleware applied globally
✅ Session validation extended to all auth routes
✅ Audit logging centralized with error handling

# Run validation
npm run test
npm run build
npm run lint

# Deploy to staging
git add .
git commit -m "Phase 1: Critical security fixes"
git push origin security/api-audit-fixes
```

---

## Phase 2: Core Infrastructure

**Duration:** 1-2 weeks
**Risk Level:** 🟡 High
**Impact:** High - Performance and architecture improvements

### Fix 8: Optimize Database Query Patterns

**Time:** 6 hours
**Priority:** 🟡 HIGH

#### Step 8.1: Combine Sequential Queries

**Pattern: Multiple Sequential findUnique Calls**

```typescript
// BEFORE (src/app/api/cart/route.ts):
const userWithMembership = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isMember: true, memberSince: true }
});

const pendingMembership = await prisma.pendingMembership.findFirst({
  where: { userId: session.user.id }
});

// AFTER - Single query with include:
const userWithDetails = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: {
    isMember: true,
    memberSince: true,
    pendingMemberships: {
      take: 1,
      orderBy: { createdAt: 'desc' }
    }
  }
});

const effectiveMemberStatus = userWithDetails.pendingMemberships.length > 0
  ? false
  : userWithDetails.isMember;
```

#### Step 8.2: Fix Chat Session Race Condition

Replace retry logic with proper transaction:

```typescript
// BEFORE (src/app/api/chat/send/route.ts):
let session = null;
let attempts = 0;
while (!session && attempts < maxAttempts) {
  attempts++;
  session = await prisma.chatSession.findUnique({ /* ... */ });
  await new Promise(resolve => setTimeout(resolve, 100)); // ❌ BAD
}

// AFTER - Use transaction for atomicity:
const session = await prisma.$transaction(async (tx) => {
  // Check if session exists
  const existing = await tx.chatSession.findUnique({
    where: { sessionId: validatedData.sessionId },
    include: { user: { /* ... */ } }
  });

  if (!existing) {
    throw createChatError('SESSION_NOT_FOUND');
  }

  return existing;
});
```

#### Step 8.3: Create Query Optimization Utility

Create `src/lib/db/optimizations.ts`:

```typescript
import { prisma } from './prisma';

/**
 * Get user with all related data in single query
 */
export async function getUserWithDetails(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      isMember: true,
      memberSince: true,
      membershipTotal: true,
      pendingMemberships: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      },
      addresses: {
        where: { isDefault: true },
        take: 1
      }
    }
  });
}

/**
 * Batch load multiple users efficiently
 */
export async function batchLoadUsers(userIds: string[]) {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    }
  });

  // Return as map for O(1) lookup
  return new Map(users.map(u => [u.id, u]));
}
```

---

### Fix 9: Optimize Cart Calculation

**Time:** 3 hours
**Priority:** 🟡 HIGH

#### Step 9.1: Single-Pass Cart Calculation

Update `src/app/api/cart/route.ts`:

```typescript
// BEFORE: Two iterations (lines 927-975 and 986-1008)

// AFTER: Single pass
async function calculateCartSummary(
  cartItems: CartItemWithProduct[],
  isMember: boolean
) {
  const thresholdConfig = await prisma.systemConfig.findFirst({
    where: { key: 'membership_threshold' },
  });
  const membershipThreshold = Number(thresholdConfig?.value) || 80;

  // Single-pass calculation using reduce
  const summary = cartItems.reduce((acc, cartItem) => {
    const { product, quantity } = cartItem;

    // Calculate price once
    const priceInfo = getBestPrice({
      isPromotional: product.isPromotional,
      promotionalPrice: product.promotionalPrice,
      promotionStartDate: product.promotionStartDate,
      promotionEndDate: product.promotionEndDate,
      isQualifyingForMembership: product.isQualifyingForMembership,
      memberOnlyUntil: product.memberOnlyUntil,
      earlyAccessStart: product.earlyAccessStart,
      regularPrice: product.regularPrice,
      memberPrice: product.memberPrice,
    }, isMember);

    // Calculate all values in single pass
    const itemRegularTotal = product.regularPrice * quantity;
    const itemMemberTotal = product.memberPrice * quantity;
    const itemApplicableTotal = priceInfo.price * quantity;
    const itemSavings = priceInfo.savings * quantity;

    // Accumulate totals
    acc.itemCount += quantity;
    acc.subtotal += itemRegularTotal;
    acc.memberSubtotal += itemMemberTotal;
    acc.applicableSubtotal += itemApplicableTotal;

    // Categorize discounts
    if (priceInfo.priceType === 'promotional') {
      acc.promotionalDiscount += itemSavings;
    } else if (priceInfo.priceType === 'member') {
      acc.memberDiscount += itemSavings;
    }

    // Track qualifying items
    const qualifies = productQualifiesForMembership({
      isPromotional: product.isPromotional,
      promotionalPrice: product.promotionalPrice,
      promotionStartDate: product.promotionStartDate,
      promotionEndDate: product.promotionEndDate,
      isQualifyingForMembership: product.isQualifyingForMembership,
      memberOnlyUntil: product.memberOnlyUntil,
      earlyAccessStart: product.earlyAccessStart,
    });

    if (qualifies && priceInfo.priceType !== 'promotional') {
      acc.qualifyingTotal += itemApplicableTotal;
    }

    return acc;
  }, {
    itemCount: 0,
    subtotal: 0,
    memberSubtotal: 0,
    applicableSubtotal: 0,
    promotionalDiscount: 0,
    memberDiscount: 0,
    qualifyingTotal: 0,
  });

  // Calculate membership eligibility
  const membershipProgress = Math.min(
    (summary.qualifyingTotal / membershipThreshold) * 100,
    100
  );
  const isEligibleForMembership = summary.qualifyingTotal >= membershipThreshold;
  const amountNeededForMembership = Math.max(
    0,
    membershipThreshold - summary.qualifyingTotal
  );

  return {
    ...summary,
    potentialSavings: summary.memberDiscount,
    membershipThreshold,
    isEligibleForMembership,
    membershipProgress,
    amountNeededForMembership,
    taxAmount: 0,
    shippingCost: 0,
    total: summary.applicableSubtotal,
  };
}
```

---

### Fix 10: Add Database Indexes

**Time:** 2 hours
**Priority:** 🟡 HIGH

#### Step 10.1: Update Prisma Schema

Update `prisma/schema.prisma`:

```prisma
model Order {
  // ... existing fields

  // Add compound indexes for common queries
  @@index([userId, status])
  @@index([userId, createdAt])
  @@index([status, createdAt])
  @@index([orderNumber])
}

model Product {
  // ... existing fields

  @@index([status, createdAt])
  @@index([status, featured])
  @@index([slug])
  @@index([sku])
}

model CartItem {
  // ... existing fields

  @@index([userId, createdAt])
  @@index([productId])
}

model ChatSession {
  // ... existing fields

  @@index([status, expiresAt])
  @@index([userId, status])
  @@index([sessionId])
}

model AuditLog {
  // ... existing fields

  @@index([userId, createdAt])
  @@index([resource, createdAt])
  @@index([action, createdAt])
}

model User {
  // ... existing fields

  @@index([email])
  @@index([role, status])
  @@index([isMember, memberSince])
}
```

#### Step 10.2: Generate and Apply Migration

```bash
# Generate migration
npx prisma migrate dev --name add_performance_indexes

# Review migration file
cat prisma/migrations/*_add_performance_indexes/migration.sql

# Apply to production (with backup first!)
pg_dump your_database > backup_before_indexes_$(date +%Y%m%d).sql
npx prisma migrate deploy
```

#### Step 10.3: Verify Index Usage

```sql
-- Check index usage in PostgreSQL
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check slow queries before/after
EXPLAIN ANALYZE
SELECT * FROM "Order"
WHERE "userId" = 'some-id' AND status = 'PENDING'
ORDER BY "createdAt" DESC;
```

---

### Fix 11: Centralize User Validation

**Time:** 2 hours
**Priority:** 🟡 HIGH

#### Step 11.1: Create User Validation Utility

Already done in Fix 3 (requireAuth helpers). Now remove duplicates:

```bash
# Find all duplicate user validation code
grep -r "userExists.*prisma.user.findUnique" src/app/api -A 10

# Replace with:
import { validateUserSession } from '@/lib/auth/validation';

const { error, user } = await validateUserSession(session);
if (error) return error;
```

Create `src/lib/auth/validation.ts`:

```typescript
import { NextResponse } from 'next/server';
import { Session } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { getCachedUserValidation } from './cache';

export async function validateUserSession(session: Session | null) {
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      ),
      user: null,
    };
  }

  // Check cache first
  const cached = getCachedUserValidation(session.user.id);
  if (cached === false) {
    return {
      error: NextResponse.json(
        { message: 'User session invalid', code: 'USER_NOT_FOUND' },
        { status: 401 }
      ),
      user: null,
    };
  }

  // Session validator middleware already validated user existence
  // This is just for routes not covered by middleware
  return { error: null, user: session.user };
}
```

---

### Fix 12: Standardize Error Responses

**Time:** 3 hours
**Priority:** 🟡 HIGH

#### Step 12.1: Create Error Response System

Create `src/lib/api/errors.ts`:

```typescript
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  requestId?: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

// Standard error codes
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

/**
 * Create standardized error response
 */
export function createApiError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  }, { status });
}

/**
 * Create standardized success response
 */
export function createApiSuccess<T>(
  data: T,
  status: number = 200,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  }, { status });
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError, requestId?: string) {
  return createApiError(
    ErrorCodes.VALIDATION_ERROR,
    'Validation failed',
    400,
    error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
    requestId
  );
}

/**
 * Handle Prisma errors
 */
export function handlePrismaError(error: any, requestId?: string) {
  // P2002: Unique constraint violation
  if (error.code === 'P2002') {
    return createApiError(
      ErrorCodes.ALREADY_EXISTS,
      `A record with this ${error.meta?.target?.[0] || 'value'} already exists`,
      409,
      undefined,
      requestId
    );
  }

  // P2025: Record not found
  if (error.code === 'P2025') {
    return createApiError(
      ErrorCodes.NOT_FOUND,
      'Record not found',
      404,
      undefined,
      requestId
    );
  }

  // Default database error
  return createApiError(
    ErrorCodes.DATABASE_ERROR,
    'Database operation failed',
    500,
    process.env.NODE_ENV === 'development' ? error.message : undefined,
    requestId
  );
}

/**
 * Unified error handler
 */
export function handleApiError(error: unknown, requestId?: string) {
  if (error instanceof ZodError) {
    return handleZodError(error, requestId);
  }

  if (error && typeof error === 'object' && 'code' in error) {
    return handlePrismaError(error, requestId);
  }

  // Generic error
  console.error('API Error:', error);
  return createApiError(
    ErrorCodes.INTERNAL_ERROR,
    'An unexpected error occurred',
    500,
    process.env.NODE_ENV === 'development' ? String(error) : undefined,
    requestId
  );
}
```

#### Step 12.2: Generate Request IDs

Add to middleware:

```typescript
// src/middleware.ts
import { v4 as uuidv4 } from 'uuid';

export function middleware(request: NextRequest) {
  // Generate request ID
  const requestId = uuidv4();
  request.headers.set('x-request-id', requestId);

  // ... rest of middleware
}
```

#### Step 12.3: Update All Route Handlers

```typescript
// Example: src/app/api/products/route.ts
import {
  createApiSuccess,
  createApiError,
  handleApiError,
  ErrorCodes
} from '@/lib/api/errors';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  try {
    const products = await prisma.product.findMany({ /* ... */ });

    return createApiSuccess(
      { products, total: products.length },
      200,
      requestId
    );
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  try {
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const body = await request.json();
    const productData = createProductSchema.parse(body);

    // Check for conflicts
    const existing = await prisma.product.findUnique({
      where: { sku: productData.sku }
    });

    if (existing) {
      return createApiError(
        ErrorCodes.ALREADY_EXISTS,
        'A product with this SKU already exists',
        409,
        { field: 'sku', value: productData.sku },
        requestId
      );
    }

    const product = await prisma.product.create({ data: productData });

    return createApiSuccess(
      { product },
      201,
      requestId
    );
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
```

---

### Fix 13: Add Transactions Consistently

**Time:** 4 hours
**Priority:** 🟡 HIGH

#### Step 13.1: Identify Operations Needing Transactions

Operations that modify multiple related records:
- Order creation
- Chat message + session update
- User registration + initial data
- Product creation + categories + images
- Address updates with default flag

#### Step 13.2: Wrap Multi-Step Operations

```typescript
// Example: Chat send operation
// src/app/api/chat/send/route.ts

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SendMessageSchema.parse(body);

    // Use transaction for atomicity
    const { userMessage, session } = await prisma.$transaction(async (tx) => {
      // 1. Validate session
      const chatSession = await tx.chatSession.findUnique({
        where: { sessionId: validatedData.sessionId },
        include: { user: { /* ... */ } }
      });

      if (!chatSession) {
        throw createChatError('SESSION_NOT_FOUND');
      }

      if (chatSession.status !== 'active') {
        throw createChatError('SESSION_NOT_FOUND', 'Chat session is not active');
      }

      // 2. Create message
      const message = await tx.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          senderType: 'user',
          content: validatedData.content,
          messageType: validatedData.messageType,
          status: 'pending',
          metadata: validatedData.metadata,
        },
      });

      // 3. Update session activity
      await tx.chatSession.update({
        where: { id: chatSession.id },
        data: { lastActivity: new Date() },
      });

      return { userMessage: message, session: chatSession };
    });

    // Queue webhook outside transaction
    await webhookService.queueWebhook(/* ... */);

    return createSuccessResponse({
      messageId: userMessage.id,
      status: 'sent',
      timestamp: userMessage.createdAt.toISOString(),
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## Phase 2 Completion Checklist

```bash
✅ Database queries optimized (combined sequential queries)
✅ Cart calculation optimized (single-pass)
✅ Database indexes added and migrated
✅ User validation centralized
✅ Error responses standardized
✅ Transactions added to multi-step operations

# Validation
npm run test
npm run test:load
npm run lint

# Measure improvements
npm run benchmark:before
npm run benchmark:after

# Deploy to staging
git add .
git commit -m "Phase 2: Core infrastructure improvements"
git push origin security/api-audit-fixes
```

---

## Phase 3: Performance & Architecture

**Duration:** 2-4 weeks
**Risk Level:** 🟡 High
**Impact:** Medium-High - Systematic improvements

### Fix 14: Centralize Zod Schemas

**Time:** 4 hours
**Priority:** 🟡 HIGH

#### Step 14.1: Create Schema Library Structure

```
src/lib/validation/
├── index.ts
├── product.schemas.ts
├── user.schemas.ts
├── order.schemas.ts
├── cart.schemas.ts
└── common.schemas.ts
```

#### Step 14.2: Extract and Centralize Schemas

`src/lib/validation/common.schemas.ts`:
```typescript
import { z } from 'zod';

// Common reusable schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number');

export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

export const paginationSchema = z.object({
  page: z.string().default('1').transform(Number),
  limit: z.string().default('20').transform(Number),
  offset: z.string().optional().transform(v => v ? Number(v) : undefined),
});

export const idSchema = z.string().min(1, 'ID is required');
```

`src/lib/validation/product.schemas.ts`:
```typescript
import { z } from 'zod';

export const productBaseSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Product slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  shortDescription: z.string().max(200).optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  regularPrice: z.number().positive('Regular price must be positive'),
  memberPrice: z.number().positive().nullable().optional(),
  stockQuantity: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0).default(10),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  featured: z.boolean().default(false),
  isPromotional: z.boolean().default(false),
  isQualifyingForMembership: z.boolean().default(true),
});

export const createProductSchema = productBaseSchema.extend({
  categoryIds: z.array(z.string()).min(1, 'At least one category required'),
  images: z.array(z.object({
    url: z.string().url(),
    altText: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })).optional(),
});

export const updateProductSchema = productBaseSchema.partial().extend({
  categoryIds: z.array(z.string()).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    altText: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })).optional(),
});

export const productSearchSchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  inStock: z.string().transform(Boolean).optional(),
  sortBy: z.enum(['name', 'price', 'created', 'rating']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

#### Step 14.3: Update Route Imports

```typescript
// src/app/api/products/route.ts
import { createProductSchema, productSearchSchema } from '@/lib/validation/product.schemas';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  const validated = productSearchSchema.parse(params);
  // ... use validated data
}
```

---

### Fix 15: Add Request Timeouts

**Time:** 2 hours
**Priority:** 🟡 HIGH

#### Step 15.1: Configure Route Timeouts

```typescript
// Add to all API routes
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds max (adjust per route)

// For long-running operations:
// export const maxDuration = 60; // 1 minute
```

#### Step 15.2: Add Prisma Client Timeout

Update `src/lib/db/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Add query timeout
prisma.$use(async (params, next) => {
  const timeout = 10000; // 10 seconds

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Query timeout')), timeout)
  );

  return Promise.race([next(params), timeoutPromise]);
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

### Fix 16: Implement API Versioning

**Time:** 6 hours
**Priority:** 🟡 HIGH

#### Step 16.1: Choose Versioning Strategy

**Recommended: URL-based versioning**
- `/api/v1/products`
- `/api/v2/products`

#### Step 16.2: Restructure API Directory

```
src/app/api/
├── v1/
│   ├── products/
│   │   └── route.ts
│   ├── orders/
│   │   └── route.ts
│   └── ...
├── v2/
│   ├── products/
│   │   └── route.ts  (new version)
│   └── ...
└── (root routes redirect to v1)
```

#### Step 16.3: Create Version Router Middleware

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auto-redirect unversioned API calls to v1
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/v')) {
    const versionedPath = pathname.replace('/api/', '/api/v1/');
    const url = request.nextUrl.clone();
    url.pathname = versionedPath;
    return NextResponse.rewrite(url);
  }

  // ... rest of middleware
}
```

#### Step 16.4: Add Version Header Support

```typescript
// Alternative: Header-based versioning
export function middleware(request: NextRequest) {
  const apiVersion = request.headers.get('api-version') || 'v1';

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/v')) {
    const url = request.nextUrl.clone();
    url.pathname = `/api/${apiVersion}${pathname.replace('/api', '')}`;
    return NextResponse.rewrite(url);
  }
}
```

---

## Phase 3 Completion Checklist

```bash
✅ Zod schemas centralized
✅ Request timeouts configured
✅ API versioning implemented
✅ Migration path documented

git add .
git commit -m "Phase 3: Architecture improvements"
git push origin security/api-audit-fixes
```

---

## Phase 4: Enhancements

**Duration:** 4-6 weeks
**Risk Level:** 🟢 Medium
**Impact:** Long-term maintainability

### Fix 17-23: Medium Priority Enhancements

Due to space constraints, here's a summary approach for Phase 4:

#### Fix 17: API Documentation with OpenAPI

```bash
npm install swagger-jsdoc swagger-ui-express
```

Create `src/lib/docs/swagger.ts` to auto-generate OpenAPI spec from routes.

#### Fix 18: Response Caching

```typescript
import { unstable_cache } from 'next/cache';

export const getProducts = unstable_cache(
  async () => prisma.product.findMany({ /* ... */ }),
  ['products-list'],
  { revalidate: 60 } // Cache for 60 seconds
);
```

#### Fix 19: Standardize Pagination

```typescript
// Cursor-based pagination
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
});
```

#### Fix 20: Input Sanitization

```bash
npm install dompurify isomorphic-dompurify
```

#### Fix 21: CSRF Protection

```typescript
// Use next-csrf for CSRF tokens
npm install @edge-csrf/nextjs
```

#### Fix 22: Structured Logging

```bash
npm install pino pino-pretty
```

#### Fix 23: Enhanced Health Checks

```typescript
export async function GET() {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    fetch(process.env.EXTERNAL_API + '/health'),
  ]);

  return NextResponse.json({
    status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
    checks,
  });
}
```

---

## Code Reference Library

### Common Patterns

#### 1. API Route Handler Pattern

```typescript
import { NextRequest } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';
import { createApiSuccess, handleApiError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  try {
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const data = await fetchData();

    return createApiSuccess(data, 200, requestId);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
```

#### 2. Transaction Pattern

```typescript
const result = await prisma.$transaction(async (tx) => {
  const record1 = await tx.model1.create({ /* ... */ });
  const record2 = await tx.model2.create({ /* ... */ });
  await tx.model3.update({ /* ... */ });
  return { record1, record2 };
});
```

#### 3. Audit Logging Pattern

```typescript
import { logAudit } from '@/lib/audit/logger';

await logAudit({
  userId: session.user.id,
  action: 'CREATE',
  resource: 'PRODUCT',
  resourceId: product.id,
  details: { /* ... */ },
  ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
  userAgent: request.headers.get('user-agent') || 'unknown',
});
```

---

## Testing & Validation

### Unit Tests

```typescript
// Example: tests/api/products.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/products/route';

describe('/api/products', () => {
  it('should return products list', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.products).toBeDefined();
  });
});
```

### Integration Tests

```bash
# Run all tests
npm run test

# Run specific test suite
npm run test:api

# Run with coverage
npm run test:coverage
```

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run tests/load/api-products.js
```

`tests/load/api-products.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/api/products');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## Deployment Checklist

### Pre-Deployment

```bash
# 1. Run all tests
npm run test
npm run test:e2e
npm run test:load

# 2. Lint and type check
npm run lint
npm run type-check

# 3. Build verification
npm run build

# 4. Security audit
npm audit --production
npm audit fix

# 5. Backup database
pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# 6. Review migration files
ls -la prisma/migrations/
```

### Deployment Steps

```bash
# 1. Merge to main
git checkout main
git merge security/api-audit-fixes

# 2. Tag release
git tag -a v1.1.0 -m "Security audit fixes and performance improvements"
git push origin v1.1.0

# 3. Deploy to staging
npm run deploy:staging

# 4. Run smoke tests on staging
npm run test:smoke -- --env=staging

# 5. Deploy to production
npm run deploy:production

# 6. Monitor for issues
# Check logs, error rates, performance metrics
```

### Post-Deployment

```bash
# 1. Verify endpoints
curl https://your-api.com/api/health
curl https://your-api.com/api/test  # Should return 404

# 2. Check metrics
# - Response times
# - Error rates
# - Database query performance
# - Cache hit rates

# 3. Monitor audit logs
# Check audit queue status
curl https://your-api.com/api/admin/audit/status

# 4. Rollback plan (if needed)
git revert HEAD
npm run deploy:production
```

---

## Success Metrics

Track these metrics before/after implementation:

### Performance Metrics
- **API Response Time**: Target <200ms (p95)
- **Database Query Time**: Target <50ms (p95)
- **Cart Calculation Time**: Target <100ms → <50ms
- **Auth Validation Time**: Target 100ms → <10ms (cached)

### Security Metrics
- **Test Endpoint Access**: 0 (blocked in production)
- **Rate Limit Violations**: Monitor and alert
- **Auth Failures**: Track patterns
- **Audit Log Success Rate**: >99.9%

### Quality Metrics
- **Code Coverage**: Target >80%
- **Linting Errors**: 0
- **Type Errors**: 0
- **Security Vulnerabilities**: 0 critical, 0 high

---

## Troubleshooting Guide

### Common Issues

**Issue: Cache invalidation not working**
```typescript
// Solution: Ensure cache is invalidated on user updates
import { invalidateUserCache } from '@/lib/auth/events';
invalidateUserCache(userId);
```

**Issue: Transactions timing out**
```typescript
// Solution: Reduce transaction scope, optimize queries
await prisma.$transaction(
  async (tx) => { /* ... */ },
  { timeout: 10000 } // 10 second timeout
);
```

**Issue: Middleware not applied**
```typescript
// Solution: Check middleware matcher config
export const config = {
  matcher: ['/api/:path*'],  // Ensure path is matched
};
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check audit queue status
- Review rate limit violations

**Weekly:**
- Review slow query logs
- Check cache hit rates
- Analyze API usage patterns

**Monthly:**
- Update dependencies
- Review and optimize indexes
- Audit security vulnerabilities

---

## Conclusion

This implementation guide provides a systematic approach to remediating all 23 findings from the API audit. Follow the phases in order, validate each step, and monitor metrics throughout.

**Total Estimated Time:** 4-6 weeks
**Required Skills:** TypeScript, Next.js, Prisma, Security
**Success Criteria:** All critical and high priority issues resolved, metrics improved

**Next Steps:**
1. Review and approve implementation plan
2. Assign resources and timeline
3. Begin Phase 1 (Critical fixes)
4. Monitor and iterate

---

**Document End**
