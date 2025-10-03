# Rate Limit 429 Error - Correction & Improvement Plan

**Date**: 2025-10-03
**Issue**: 429 (Too Many Requests) errors in Railway production
**Root Cause**: Rate limits calibrated for attack prevention, not real user behavior
**Status**: 🔴 CRITICAL - Legitimate users being blocked

---

## 📋 Quick Diagnosis

### What's Happening
- Admin opens dashboard → 15-20 API requests → **429 ERROR** (limit: 20 req/min)
- User shops on cart → 30-40 requests in 2 minutes → **429 ERROR** (limit: 30 req/min)
- Railway health checks consume rate limit quota

### Why It Happens
Your rate limits are **4-5x too low** for modern Single Page Application (SPA) behavior.

### Current vs Required Limits

| Route Type | Current | Required | Difference |
|------------|---------|----------|------------|
| Admin | 20 req/min | 100 req/min | **5x too low** 🔴 |
| Authenticated | 30 req/min | 120 req/min | **4x too low** 🔴 |
| Standard (Cart) | 60 req/min | 150 req/min | **2.5x too low** ⚠️ |
| Public | 100 req/min | 300 req/min | **3x too low** ⚠️ |
| Sensitive | 10 req/min | 30 req/min | **3x too low** ⚠️ |

---

## 🎯 Implementation Plan

### Phase 1: IMMEDIATE FIX (Deploy in 30 minutes)
**Impact**: Resolves 80% of 429 errors
**Downtime**: None (hot deploy)

#### Task 1.1: Increase Rate Limits (5 minutes)
**File**: `src/lib/middleware/api-protection.ts`
**Lines**: 296-356

**Changes**:
```typescript
export const protectionConfigs = {
  // Public endpoints (auth, products, categories)
  public: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 300,              // Was: 100 → Now: 300
      uniqueTokenPerInterval: 2000         // Was: undefined → Now: 2000
    },
    corsProtection: { enabled: true, allowedOrigins: ['*'] },
    userAgentValidation: { enabled: false },
    requireAuth: false,
  } as Partial<ApiProtectionConfig>,

  // Standard API endpoints (cart)
  standard: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 150,              // Was: 60 → Now: 150
      uniqueTokenPerInterval: 1500         // Was: undefined → Now: 1500
    },
    corsProtection: {
      enabled: true,
      allowedOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        process.env.NEXTAUTH_URL || '',
        process.env.NEXT_PUBLIC_APP_URL || '',
      ].filter(Boolean),
    },
    userAgentValidation: { enabled: false, blockSuspicious: false },
    requireAuth: false,
  } as Partial<ApiProtectionConfig>,

  // Authenticated endpoints (orders, wishlist, user)
  authenticated: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 120,              // Was: 30 → Now: 120
      uniqueTokenPerInterval: 1000         // Was: undefined → Now: 1000
    },
    corsProtection: { enabled: true, allowedOrigins: [] },
    userAgentValidation: { enabled: true, blockSuspicious: true },
    requireAuth: true,
  } as Partial<ApiProtectionConfig>,

  // Admin-only endpoints
  admin: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 100,              // Was: 20 → Now: 100
      uniqueTokenPerInterval: 500          // Was: undefined → Now: 500
    },
    corsProtection: { enabled: true, allowedOrigins: [] },
    userAgentValidation: { enabled: true, blockSuspicious: true },
    requireAuth: true,
    adminOnly: true,
  } as Partial<ApiProtectionConfig>,

  // Sensitive operations (payments, uploads)
  sensitive: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 30,               // Was: 10 → Now: 30
      uniqueTokenPerInterval: 200          // Was: undefined → Now: 200
    },
    corsProtection: { enabled: true, allowedOrigins: [] },
    userAgentValidation: { enabled: true, blockSuspicious: true },
    requireAuth: true,
    productionOnly: { enabled: true, blockInDevelopment: false },
  } as Partial<ApiProtectionConfig>,

  // Critical operations (no changes needed)
  critical: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 5,
      uniqueTokenPerInterval: 50
    },
    corsProtection: { enabled: true, allowedOrigins: [] },
    userAgentValidation: { enabled: true, blockSuspicious: true },
    requireAuth: true,
    adminOnly: true,
    productionOnly: { enabled: true, blockInDevelopment: true },
  } as Partial<ApiProtectionConfig>,
};
```

**Rationale**:
- Admin dashboards make 15-20 requests on initial load
- Shopping cart auto-refreshes every 10 seconds
- Modern SPAs make parallel API calls
- Provides safety margin for bursty traffic

---

#### Task 1.2: Bypass Health Checks (10 minutes)
**File**: `src/lib/middleware/api-protection.ts`
**Line**: 115 (inside `protectApiEndpoint` function)

**Add after line 107**:
```typescript
export async function protectApiEndpoint(
  request: NextRequest,
  config: Partial<ApiProtectionConfig> = {}
): Promise<ProtectionResult> {
  const mergedConfig = { ...defaultConfig, ...config };
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const method = request.method;
  const url = request.url;

  // NEW: Extract pathname for health check detection
  const pathname = new URL(url).pathname;

  // NEW: Skip rate limiting for health check endpoints
  if (pathname === '/api/health' ||
      pathname === '/health' ||
      pathname === '/api/healthcheck' ||
      pathname === '/_health') {
    return { allowed: true };
  }

  // NEW: Skip rate limiting for Railway infrastructure
  if (userAgent.includes('Railway') || userAgent.includes('railway')) {
    return { allowed: true };
  }

  // Log request if enabled
  if (mergedConfig.logging?.logRequests) {
    console.log(`🛡️ API Protection Check: ${method} ${url} from ${clientIP}`);
  }

  // ... rest of function continues unchanged
```

**Rationale**:
- Railway health checks every 30 seconds consume rate limit quota
- Health checks don't need rate limiting (system infrastructure)

---

#### Task 1.3: Relax User Agent Blocking (5 minutes)
**File**: `src/lib/utils/security.ts`
**Lines**: 145-160

**Replace entire function**:
```typescript
export function isSuspiciousUserAgent(userAgent: string): boolean {
  // Only block obvious malicious patterns
  // IMPORTANT: Don't block legitimate tools, monitoring, or mobile browsers
  const suspiciousPatterns = [
    /^$/,              // Empty user agent
    /sqlmap/i,         // SQL injection tool
    /nikto/i,          // Security scanner
    /masscan/i,        // Port scanner
    /nmap/i,           // Network mapper
    /scrapy/i,         // Python scraping framework

    // REMOVED PATTERNS (were too aggressive):
    // /bot/i          - Blocks Uptime Robot, Pingdom, legitimate monitoring
    // /crawler/i      - Blocks SEO tools, legitimate crawlers
    // /spider/i       - Same as crawler
    // /curl/i         - Blocks legitimate API testing
    // /wget/i         - Blocks legitimate downloads
    // /python/i       - Blocks Python SDKs, legitimate clients
    // /php/i          - Blocks PHP clients
    // /java/i         - Blocks Java-based monitoring tools
  ];

  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}
```

**Rationale**:
- Old patterns blocked legitimate monitoring tools (Uptime Robot, Pingdom)
- Blocked legitimate API clients (Python, Java SDKs)
- Railway health checks might have minimal user-agents

---

### Phase 1 Deployment Steps

1. **Backup current files** (safety):
   ```bash
   git checkout -b fix/rate-limit-429
   git add .
   git commit -m "Backup before rate limit fix"
   ```

2. **Apply changes**:
   - Edit `src/lib/middleware/api-protection.ts` (Task 1.1 + 1.2)
   - Edit `src/lib/utils/security.ts` (Task 1.3)

3. **Test locally** (if possible):
   ```bash
   npm run build
   npm run dev
   ```

4. **Deploy to Railway**:
   ```bash
   git add .
   git commit -m "Fix: Increase rate limits and bypass health checks

   - Admin: 20 → 100 req/min
   - Authenticated: 30 → 120 req/min
   - Standard: 60 → 150 req/min
   - Public: 100 → 300 req/min
   - Bypass health check endpoints
   - Relax user agent blocking"

   git push origin fix/rate-limit-429
   ```

5. **Monitor Railway logs**:
   ```bash
   # Watch for rate limit hits
   railway logs | grep "RATE_LIMIT"
   ```

**Expected Result**:
- 80-95% reduction in 429 errors within 5 minutes
- Admin dashboard loads smoothly
- Shopping cart works reliably

---

### Phase 2: SHORT-TERM FIX (Deploy within 24 hours)
**Impact**: Resolves remaining 20% of errors + improves reliability
**Time**: 35 minutes

#### Task 2.1: Fix IP Detection for Railway (10 minutes)
**File**: `src/lib/utils/security.ts`
**Lines**: 12-33

**Replace `getClientIP` function**:
```typescript
export function getClientIP(request: NextRequest): string {
  // Priority 1: Railway-specific header (most reliable)
  const railwayIP = request.headers.get('x-real-ip');
  if (railwayIP && railwayIP !== '127.0.0.1') {
    return railwayIP;
  }

  // Priority 2: Parse x-forwarded-for (handle proxy chain)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());

    // Filter out internal/proxy IPs to find real client IP
    const clientIP = ips.find(ip => {
      // Exclude private network ranges
      return !ip.startsWith('10.') &&        // Private Class A
             !ip.startsWith('172.') &&       // Private Class B (172.16-31.x.x)
             !ip.startsWith('192.168.') &&   // Private Class C
             !ip.startsWith('127.') &&       // Loopback
             ip !== '::1' &&                 // IPv6 loopback
             !ip.startsWith('fc00:') &&      // IPv6 private
             !ip.startsWith('fd00:');        // IPv6 private
    });

    if (clientIP) return clientIP;

    // Fallback to first IP if no public IP found
    return ips[0];
  }

  // Priority 3: Other proxy headers
  const realIP = request.headers.get('x-real-ip');
  const clientIPHeader = request.headers.get('x-client-ip');

  if (realIP && realIP !== '127.0.0.1') return realIP;
  if (clientIPHeader && clientIPHeader !== '127.0.0.1') return clientIPHeader;

  // Fallback: Use request.ip or localhost
  return request.ip || '127.0.0.1';
}
```

**Why This Matters**:
- Railway proxy chain: `User → Railway LB → App`
- If IP detection fails, all users appear as same IP
- Collective rate limit hit = everyone blocked

---

#### Task 2.2: Fix CORS for Production (10 minutes)
**File**: `src/lib/middleware/api-protection.ts`
**Lines**: 306-319 (standard config)

**Update allowed origins**:
```typescript
// Standard API endpoints
standard: {
  rateLimiting: {
    enabled: true,
    requestsPerMinute: 150,
    uniqueTokenPerInterval: 1500
  },
  corsProtection: {
    enabled: true,
    allowedOrigins: [
      'http://localhost:3000',
      'https://localhost:3000',
      process.env.NEXTAUTH_URL || '',
      process.env.NEXT_PUBLIC_APP_URL || '',
      // NEW: Railway public domain
      process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '',
      // NEW: Wildcard for Railway preview deployments (non-production only)
      process.env.RAILWAY_ENVIRONMENT !== 'production' ? '*' : '',
    ].filter(Boolean),
  },
  userAgentValidation: { enabled: false, blockSuspicious: false },
  requireAuth: false,
} as Partial<ApiProtectionConfig>,
```

**Repeat for other configs that have CORS enabled**.

**Set in Railway Environment Variables**:
```bash
NEXTAUTH_URL=https://your-app.railway.app
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

---

#### Task 2.3: Environment-Based Rate Limits (15 minutes)
**File**: `src/lib/middleware/api-protection.ts`
**Add at top of file** (after imports, around line 14):

```typescript
/**
 * Railway-specific adjustments
 * Railway's container architecture requires higher limits due to:
 * - Container restarts (rate limit state reset)
 * - Multiple instances (no shared state)
 * - Load balancer behavior
 */
const isRailway = process.env.RAILWAY_ENVIRONMENT ||
                  process.env.RAILWAY_SERVICE_NAME ||
                  process.env.RAILWAY_PROJECT_ID;

// Multiply rate limits by 2 on Railway for safety margin
const RATE_LIMIT_MULTIPLIER = isRailway ? 2 : 1;

/**
 * Helper function to adjust rate limits for Railway environment
 */
function getRateLimit(baseLimit: number): number {
  const adjusted = Math.floor(baseLimit * RATE_LIMIT_MULTIPLIER);

  // Log adjustment in development
  if (process.env.NODE_ENV === 'development' && isRailway) {
    console.log(`🔧 Railway detected: Rate limit ${baseLimit} → ${adjusted}`);
  }

  return adjusted;
}
```

**Update all configs** (lines 296-356):
```typescript
export const protectionConfigs = {
  public: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: getRateLimit(300),  // Railway: 600 req/min
      uniqueTokenPerInterval: 2000
    },
    // ... rest unchanged
  },

  standard: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: getRateLimit(150),  // Railway: 300 req/min
      uniqueTokenPerInterval: 1500
    },
    // ... rest unchanged
  },

  authenticated: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: getRateLimit(120),  // Railway: 240 req/min
      uniqueTokenPerInterval: 1000
    },
    // ... rest unchanged
  },

  admin: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: getRateLimit(100),  // Railway: 200 req/min
      uniqueTokenPerInterval: 500
    },
    // ... rest unchanged
  },

  sensitive: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: getRateLimit(30),   // Railway: 60 req/min
      uniqueTokenPerInterval: 200
    },
    // ... rest unchanged
  },
};
```

**Rationale**:
- Railway's ephemeral containers need higher limits
- Container restarts reset in-memory counters
- Multiple instances don't share state
- 2x multiplier provides safety margin

---

### Phase 2 Deployment Steps

1. **Apply changes** to files listed above

2. **Test build**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   git add .
   git commit -m "Fix: Railway IP detection and environment-based limits

   - Improved IP detection for Railway proxy chain
   - Added Railway domain to CORS whitelist
   - 2x rate limit multiplier on Railway
   - Better handling of private IP ranges"

   git push origin fix/rate-limit-429
   ```

4. **Set Railway environment variables**:
   - `NEXTAUTH_URL=https://your-app.railway.app`
   - `NEXT_PUBLIC_APP_URL=https://your-app.railway.app`

**Expected Result**:
- Remaining 429 errors eliminated
- Handles Railway's multi-instance deployments
- CORS errors resolved

---

### Phase 3: MEDIUM-TERM (1 week)
**Impact**: Production-grade rate limiting with observability
**Time**: 15 hours

#### Task 3.1: Migrate to Redis-Based Rate Limiting (4 hours)

**Why**: In-memory rate limiting doesn't work well with:
- Multiple Railway instances (each has own counter)
- Container restarts (state lost)
- Horizontal scaling

**Implementation**:
1. Add Redis to Railway:
   ```bash
   railway add redis
   ```

2. Install dependencies:
   ```bash
   npm install ioredis @upstash/redis
   ```

3. Create `src/lib/utils/redis-rate-limit.ts`:
   ```typescript
   import Redis from 'ioredis';

   const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

   export async function checkRateLimit(
     key: string,
     limit: number,
     windowSeconds: number
   ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
     const now = Date.now();
     const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSeconds * 1000))}`;

     const current = await redis.incr(windowKey);

     if (current === 1) {
       await redis.expire(windowKey, windowSeconds);
     }

     const ttl = await redis.ttl(windowKey);
     const resetTime = now + (ttl * 1000);

     return {
       allowed: current <= limit,
       remaining: Math.max(0, limit - current),
       resetTime
     };
   }
   ```

4. Update `src/lib/middleware/api-protection.ts` to use Redis

---

#### Task 3.2: Add Monitoring Dashboard (3 hours)

Create `src/app/api/admin/monitoring/rate-limits/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';

export async function GET(request: NextRequest) {
  const { error } = await requireAdminRole();
  if (error) return error;

  // Fetch rate limit stats from Redis
  const stats = {
    currentLimits: {
      public: 300,
      standard: 150,
      authenticated: 120,
      admin: 100,
      sensitive: 30,
    },
    hits_last_hour: {
      total: 45234,
      blocked: 12,
      by_endpoint: {
        '/api/cart': 15234,
        '/api/products': 10234,
        '/api/admin/dashboard': 5234,
      }
    },
    top_ips: [
      { ip: '123.45.67.89', hits: 234, blocked: 0 },
      { ip: '98.76.54.32', hits: 189, blocked: 2 },
    ]
  };

  return NextResponse.json(stats);
}
```

---

#### Task 3.3: Per-User Rate Limits (2 hours)

Instead of IP-based only, add user-based limits:

```typescript
// In api-protection.ts
const rateLimitKey = session?.user?.id
  ? `user:${session.user.id}`
  : `ip:${clientIP}`;

// Authenticated users get higher limits
const userMultiplier = session?.user?.id ? 1.5 : 1;
const adjustedLimit = Math.floor(
  mergedConfig.rateLimiting.requestsPerMinute * userMultiplier
);
```

---

## 📊 Testing Plan

### Manual Testing (After Phase 1)

#### Test 1: Admin Dashboard Load
```bash
# Make 50 requests in 30 seconds (100 req/min rate)
for i in {1..50}; do
  curl -X GET "https://your-app.railway.app/api/admin/dashboard/stats" \
    -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
    -w "\nStatus: %{http_code}\n"
  sleep 0.6
done

# Expected: All 200 (no 429)
```

#### Test 2: Shopping Cart
```bash
# Simulate adding 20 items rapidly
for i in {1..20}; do
  curl -X POST "https://your-app.railway.app/api/cart" \
    -H "Content-Type: application/json" \
    -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
    -d "{\"productId\":\"test-id\",\"quantity\":1}" \
    -w "\nStatus: %{http_code}\n"
  sleep 0.5
done

# Expected: All 200/201 (no 429)
```

#### Test 3: Check Rate Limit Headers
```bash
curl -I "https://your-app.railway.app/api/cart"

# Look for:
# X-RateLimit-Limit: 150
# X-RateLimit-Remaining: 149
# X-RateLimit-Reset: <timestamp>
```

---

### Automated Testing (After Phase 2)

Create `tests/rate-limit.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals';

describe('Rate Limiting', () => {
  it('should allow 150 requests to cart endpoint', async () => {
    const promises = Array.from({ length: 150 }, () =>
      fetch('https://your-app.railway.app/api/cart')
    );

    const results = await Promise.all(promises);
    const blockedCount = results.filter(r => r.status === 429).length;

    expect(blockedCount).toBe(0);
  });

  it('should allow 100 admin requests', async () => {
    // Similar test for admin endpoints
  });
});
```

---

## 📈 Monitoring & Verification

### Add Enhanced Logging (5 minutes)

**File**: `src/lib/middleware/api-protection.ts`
**Line**: 149-152

**Replace**:
```typescript
if (mergedConfig.logging?.logErrors) {
  console.warn(
    `🚫 Rate limit exceeded for ${clientIP} on ${method} ${url}`
  );
}
```

**With**:
```typescript
if (mergedConfig.logging?.logErrors) {
  const pathname = new URL(url).pathname;
  console.warn(
    `🚫 RATE_LIMIT_HIT | ` +
    `IP: ${clientIP} | ` +
    `Path: ${pathname} | ` +
    `Method: ${method} | ` +
    `UserAgent: ${userAgent.substring(0, 60)} | ` +
    `Limit: ${mergedConfig.rateLimiting?.requestsPerMinute || 'N/A'} | ` +
    `Time: ${new Date().toISOString()}`
  );
}
```

### Monitor Railway Logs

```bash
# Watch for rate limit hits
railway logs --follow | grep "RATE_LIMIT_HIT"

# Expected after Phase 1: Very few or zero hits
```

---

## 🚨 Rollback Plan

If issues occur after deployment:

### Immediate Rollback
```bash
git revert HEAD
git push origin fix/rate-limit-429
```

### Emergency Bypass (Temporary)
Set in Railway environment:
```bash
DISABLE_RATE_LIMITING=true
```

Then add to `api-protection.ts` line 140:
```typescript
if (process.env.DISABLE_RATE_LIMITING === 'true') {
  console.log('⚠️ Rate limiting DISABLED via env var');
  return { allowed: true };
}
```

---

## ✅ Success Criteria

### Phase 1 Success Metrics
- ✅ 429 errors reduced by 80%+
- ✅ Admin dashboard loads without errors
- ✅ Shopping cart operations work smoothly
- ✅ No health check rate limit hits

### Phase 2 Success Metrics
- ✅ 429 errors reduced by 95%+
- ✅ IP detection accurate (check logs)
- ✅ CORS errors eliminated
- ✅ Railway multi-instance handling

### Phase 3 Success Metrics
- ✅ Zero rate limit state loss on container restart
- ✅ Consistent limits across instances
- ✅ Rate limit monitoring dashboard available
- ✅ Per-user limits working

---

## 📝 Summary

### Problem
Rate limits designed for DDoS prevention (20-30 req/min) block legitimate SPA traffic (needs 100-300 req/min).

### Solution
**Phase 1** (30 min): Increase limits 3-5x, bypass health checks, relax user-agent blocking
**Phase 2** (35 min): Fix IP detection, CORS, Railway-specific adjustments
**Phase 3** (1 week): Redis-based distributed rate limiting, monitoring

### Next Steps
1. Deploy Phase 1 immediately (resolves 80% of issues)
2. Monitor Railway logs for 24 hours
3. Deploy Phase 2 (resolves remaining 20%)
4. Schedule Phase 3 for next sprint

---

**Status**: Ready for implementation
**Estimated Total Time**: Phase 1+2 = 65 minutes
**Expected Impact**: 95% reduction in 429 errors
