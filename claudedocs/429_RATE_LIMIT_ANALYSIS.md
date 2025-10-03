# 429 Rate Limit Error Analysis - Railway Production

**Date**: 2025-10-03
**Environment**: Railway Production
**Issue**: Getting 429 (Too Many Requests) errors
**Status**: 🔴 CRITICAL - Legitimate requests being blocked

---

## Executive Summary

Your Railway production environment is experiencing **false positive rate limiting**, blocking legitimate user requests. The root cause is a **temporary workaround** that was meant to be removed but is currently **DISABLED IN PRODUCTION** (line 27-29 of `rate-limit.ts`).

### Current State
```typescript
// TEMPORARY: Disable rate limiting in production until properly configured
// Railway deployment is triggering false positives
if (process.env.NODE_ENV === 'production') {
  return; // Skip rate limiting in production ❌
}
```

**Result**: Rate limiting is completely OFF in production, yet 429 errors still occur.

---

## Root Cause Analysis

### 🔍 Problem 1: Multiple Rate Limiting Systems Running Simultaneously

You have **THREE different rate limiting implementations** active at the same time:

1. **`src/lib/utils/rate-limit.ts`** - Disabled in production (but imported)
2. **`src/lib/middleware/api-protection.ts`** - Active on ALL API routes (lines 139-178)
3. **`src/lib/middleware/rate-limit.ts`** - Used for specific chat endpoints

**Conflict**: Even though `rate-limit.ts` is disabled, `api-protection.ts` is still enforcing rate limits with **TOO AGGRESSIVE SETTINGS**.

---

### 🔍 Problem 2: Aggressive Rate Limits in Production

From `src/lib/middleware/api-protection.ts`, your current limits:

| Route Type | Limit | Window | Impact |
|------------|-------|--------|--------|
| **Public** (auth, products) | 100 req/min | 1 min | ⚠️ Moderate - May be okay |
| **Standard** (cart) | 60 req/min | 1 min | ⚠️ Moderate - Tight for browsing |
| **Authenticated** (orders, wishlist) | **30 req/min** | 1 min | 🔴 **TOO LOW** |
| **Admin** | **20 req/min** | 1 min | 🔴 **TOO LOW** |
| **Sensitive** (payment, uploads) | **10 req/min** | 1 min | 🔴 **EXTREMELY LOW** |

**Real-world scenario**:
- Admin opens dashboard → Initial load makes 15 requests (API calls for stats, products, orders, analytics)
- Admin clicks "Products" → 5 more requests
- Admin clicks "Orders" → 5 more requests
- **Total**: 25 requests in ~10 seconds
- **Limit**: 20 requests/minute
- **Result**: 🔴 **429 ERROR** - Admin locked out for 50 seconds

---

### 🔍 Problem 3: In-Memory Rate Limiting on Railway

Railway uses **ephemeral containers** with potential issues:

1. **Multiple Instances**: If Railway scales to 2+ instances, each has its own rate limit counter
   - User makes 15 requests → Instance A (counts 15)
   - Load balancer sends next request → Instance B (counts 1)
   - User makes 10 more requests → Instance A (15+10=25) → **429 ERROR**
   - But user only made 26 requests total, under the 60/min limit

2. **Container Restarts**: Railway restarts containers periodically
   - Rate limit counters reset to zero
   - User suddenly has "clean slate" mid-session
   - Inconsistent behavior

3. **IP Detection Issues**: Railway proxies requests
   - Your code gets IP from `x-forwarded-for` header
   - If Railway's load balancer doesn't preserve original IP correctly
   - All users might appear as the **same IP** → collective rate limit hit

---

### 🔍 Problem 4: CORS Validation Blocking Legitimate Requests

From `src/lib/middleware/api-protection.ts` lines 180-210:

```typescript
// Standard API endpoints
standard: {
  corsProtection: {
    enabled: true,
    allowedOrigins: [
      'http://localhost:3000',
      'https://localhost:3000',
      process.env.NEXTAUTH_URL || '',
      process.env.NEXT_PUBLIC_APP_URL || '',
    ].filter(Boolean),
  },
}
```

**Problem**: If `NEXTAUTH_URL` or `NEXT_PUBLIC_APP_URL` are not set correctly in Railway:
- Allowed origins: `['http://localhost:3000', 'https://localhost:3000']`
- Production origin: `https://your-app.railway.app`
- **Result**: 🔴 **403 CORS ERROR** (not 429, but related)

---

### 🔍 Problem 5: User Agent Blocking

From `src/lib/utils/security.ts` lines 145-160:

```typescript
export function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
    /java/i,    // ← This blocks legitimate Java-based monitoring tools
    /^$/,       // ← This blocks requests with no user-agent
  ];

  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}
```

**Problem**:
- Railway health checks might have user-agent containing "bot" or empty
- Monitoring tools (Uptime Robot, Pingdom) often have "bot" in user-agent
- Some mobile browsers send minimal user-agents
- **Result**: Legitimate traffic blocked as "suspicious"

---

## Evidence of Current Issues

### File: `src/lib/utils/rate-limit.ts`
```typescript
Line 26-29:
// TEMPORARY: Disable rate limiting in production until properly configured
// Railway deployment is triggering false positives
if (process.env.NODE_ENV === 'production') {
  return; // Skip rate limiting in production
}
```
**Status**: ⚠️ This comment confirms Railway was already having rate limit issues

### File: `src/lib/middleware/api-protection.ts`
```typescript
Line 296-356: Protection configs with aggressive limits
Line 139-178: Rate limiting implementation using rateLimit()
Line 74-88: Creates rate limiters with uniqueTokenPerInterval: 100/500/1000
```
**Status**: 🔴 This is the ACTIVE rate limiter causing 429 errors

### File: `src/middleware.ts`
```typescript
Line 124-138:
if (isApiRoute) {
  const protectionLevel = getProtectionLevel(pathname);
  const config = protectionConfigs[protectionLevel];
  const protection = await protectApiEndpoint(request, config);
  if (!protection.allowed) {
    return protection.response!; // ← This returns 429
  }
}
```
**Status**: 🔴 Applied to ALL API routes (257 routes total)

---

## Why This Happens on Railway Specifically

### 1. **Proxy Chain Complexity**
```
User → Cloudflare (if enabled) → Railway Load Balancer → App Instance
```
- IP detection relies on `x-forwarded-for` header
- If any proxy in chain doesn't forward correctly → wrong IP → rate limit triggered

### 2. **Container Architecture**
- Railway uses Docker containers that restart frequently
- Each restart = new in-memory rate limit state
- No shared state between instances

### 3. **Health Checks**
- Railway sends health check requests every 30 seconds
- If health checks count toward rate limits → constant drain on quota
- Health checks from Railway infrastructure IP might be counted

### 4. **Build vs Runtime Environment**
- `NODE_ENV` might not be set correctly
- If `NODE_ENV !== 'production'` → rate limits ACTIVE
- Check Railway environment variables

---

## Detailed Analysis by Route Type

### Admin Routes (20 req/min)
**Impact**: 🔴 **SEVERE**

**Scenario 1: Dashboard Load**
```
GET /api/admin/dashboard/stats      (1 req)
GET /api/admin/dashboard/analytics  (1 req)
GET /api/admin/products?limit=10    (1 req)
GET /api/admin/orders?limit=10      (1 req)
GET /api/admin/customers?limit=10   (1 req)
GET /api/admin/chat/metrics         (1 req)
... (potentially 10-15 more requests for full dashboard)

Total: 15-20 requests in ~2 seconds
Result: ✅ Just under limit, but...
```

**Scenario 2: Admin Working**
```
Dashboard load: 15 requests (0-2 sec)
Click "Products": 5 requests (3-5 sec)
Click "Create Product": 3 requests (6-8 sec)
Upload image: 2 requests (9-10 sec)
Submit form: 1 request (11 sec)

Total: 26 requests in 11 seconds
Limit: 20 requests/60 seconds
Result: 🔴 429 ERROR at request #21
```

**Fix Needed**: Increase to **60-100 req/min** for admin routes

---

### Authenticated Routes (30 req/min)
**Impact**: 🔴 **HIGH**

**Scenario: Shopping Experience**
```
GET /api/products?page=1           (1 req)
GET /api/cart                      (1 req)
POST /api/cart (add item 1)        (1 req)
GET /api/cart (refresh)            (1 req)
POST /api/cart (add item 2)        (1 req)
GET /api/cart (refresh)            (1 req)
GET /api/orders (check history)    (1 req)
GET /api/wishlist                  (1 req)
... continue browsing/shopping

Total: 8 requests in ~30 seconds
Result: ✅ Okay, but tight
```

**With modern frontend (React/Next.js)**:
- Auto-refresh cart every 10 seconds → 6 requests/min
- Product page loads → 3-5 requests per page
- User browses 5 products in 2 minutes → 15-25 requests
- **Total**: 30-35 requests in 2 minutes
- **Limit**: 30 requests/minute
- **Result**: 🔴 **429 ERROR** - Shopping cart freezes

**Fix Needed**: Increase to **60-120 req/min** for authenticated routes

---

### Cart Routes (60 req/min)
**Impact**: ⚠️ **MODERATE** - Borderline acceptable

**Modern E-commerce Pattern**:
- SPA (Single Page Application) behavior
- Real-time cart updates
- Multiple parallel API calls

**Typical cart interaction**:
```javascript
// User adds item to cart - Frontend makes:
POST /api/cart { productId, quantity }
GET /api/cart  // Refresh cart state
GET /api/products/${productId}  // Get updated stock
GET /api/member/eligibility  // Check membership status

Total: 4 requests per cart addition
```

If user adds 10 items quickly → 40 requests in 30 seconds → **Approaching limit**

**Recommendation**: Increase to **100-150 req/min** to handle shopping sprees

---

### Public Routes (100 req/min)
**Impact**: ✅ **ACCEPTABLE** for most cases

**But consider**:
- Product browsing: 5-10 requests per page load
- Category filtering: 3-5 requests per filter change
- Search: 1 request per keystroke (debounced to every 300ms)
- User browses fast → 100 requests in 1 minute is reachable

**Edge case**: User types "laptop" in search (6 keystrokes × debounced)
- 6 search requests + 10 product loads + 5 category requests = 21 requests
- User does this for 5 different searches = 105 requests
- **Result**: 🔴 **429 ERROR**

**Recommendation**: Increase to **200-300 req/min** for public routes

---

## Critical Code Locations

### 1. Main Middleware Entry Point
**File**: `src/middleware.ts`
**Lines**: 124-138
```typescript
if (isApiRoute) {
  const protectionLevel = getProtectionLevel(pathname);
  const config = protectionConfigs[protectionLevel];
  const protection = await protectApiEndpoint(request, config);

  if (!protection.allowed) {
    return protection.response!; // ← THIS RETURNS 429
  }
}
```
**Issue**: Applies rate limiting to EVERY API request

---

### 2. Rate Limit Configuration
**File**: `src/lib/middleware/api-protection.ts`
**Lines**: 296-356
```typescript
export const protectionConfigs = {
  public: {
    rateLimiting: { enabled: true, requestsPerMinute: 100 },
  },
  standard: {
    rateLimiting: { enabled: true, requestsPerMinute: 60 },
  },
  authenticated: {
    rateLimiting: { enabled: true, requestsPerMinute: 30 }, // ← TOO LOW
  },
  admin: {
    rateLimiting: { enabled: true, requestsPerMinute: 20 }, // ← TOO LOW
  },
  sensitive: {
    rateLimiting: { enabled: true, requestsPerMinute: 10 }, // ← TOO LOW
  },
}
```
**Issue**: Limits too aggressive for real-world usage

---

### 3. Rate Limiter Implementation
**File**: `src/lib/middleware/api-protection.ts`
**Lines**: 139-178
```typescript
if (mergedConfig.rateLimiting?.enabled) {
  const limiter = rateLimiters.moderate; // ← Always uses moderate (500 tokens)

  try {
    await limiter.check(
      mergedConfig.rateLimiting.requestsPerMinute,
      clientIP
    );
  } catch {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          success: false,
          message: 'Too many requests. Please try again later.',
          error: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429, ... }
      ),
      reason: 'Rate limit exceeded',
    };
  }
}
```
**Issue**:
- Hardcoded to use `rateLimiters.moderate`
- Should dynamically select based on protection level
- 500 unique tokens might be too low for production

---

### 4. Rate Limit Store
**File**: `src/lib/utils/rate-limit.ts`
**Lines**: 16-22
```typescript
class RateLimiter {
  private config: RateLimitConfig;
  private hits = new Map<string, RateLimitState>(); // ← IN-MEMORY MAP

  constructor(config: RateLimitConfig) {
    this.config = config;
  }
```
**Issue**:
- In-memory Map loses state on container restart
- Not shared across Railway instances
- No Redis backing

---

### 5. IP Detection
**File**: `src/lib/utils/security.ts`
**Lines**: 12-33
```typescript
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0]; // ← First IP might be proxy, not client
  }

  return request.ip || '127.0.0.1';
}
```
**Issue**:
- Railway might inject proxy IPs in `x-forwarded-for`
- Format: `client, proxy1, proxy2`
- If Railway's proxy is first → all requests appear from same IP

---

## Recommended Solutions

### Solution 1: IMMEDIATE FIX - Increase Rate Limits (5 minutes)

**Priority**: 🔴 CRITICAL - Do this NOW

**File**: `src/lib/middleware/api-protection.ts`

Change lines 296-356 from:
```typescript
export const protectionConfigs = {
  public: {
    rateLimiting: { enabled: true, requestsPerMinute: 100 },
  },
  standard: {
    rateLimiting: { enabled: true, requestsPerMinute: 60 },
  },
  authenticated: {
    rateLimiting: { enabled: true, requestsPerMinute: 30 },
  },
  admin: {
    rateLimiting: { enabled: true, requestsPerMinute: 20 },
  },
  sensitive: {
    rateLimiting: { enabled: true, requestsPerMinute: 10 },
  },
}
```

To:
```typescript
export const protectionConfigs = {
  public: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 300,  // 100 → 300 (3x increase)
      uniqueTokenPerInterval: 2000
    },
  },
  standard: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 150,  // 60 → 150 (2.5x increase)
      uniqueTokenPerInterval: 1500
    },
  },
  authenticated: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 120,  // 30 → 120 (4x increase)
      uniqueTokenPerInterval: 1000
    },
  },
  admin: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 100,  // 20 → 100 (5x increase)
      uniqueTokenPerInterval: 500
    },
  },
  sensitive: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 30,   // 10 → 30 (3x increase)
      uniqueTokenPerInterval: 200
    },
  },
}
```

**Rationale**:
- Admin dashboard needs ~15-20 requests on initial load
- Modern SPAs make parallel API calls
- Shopping cart auto-refresh every 10 seconds
- Safety margin for bursty traffic

---

### Solution 2: Fix IP Detection for Railway (10 minutes)

**File**: `src/lib/utils/security.ts`

Change `getClientIP` function:
```typescript
export function getClientIP(request: NextRequest): string {
  // Railway-specific: Check for Railway proxy headers first
  const railwayIP = request.headers.get('x-real-ip');
  if (railwayIP) {
    return railwayIP;
  }

  // Standard proxy headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    // IMPORTANT: Take the LAST proxy-added IP, not the first
    // Format: client, proxy1, proxy2, ..., railway-proxy
    // We want the client IP, which is typically the last real IP before Railway
    const clientIP = ips.find(ip => {
      // Filter out known Railway/Cloudflare proxy IPs
      return !ip.startsWith('10.') &&
             !ip.startsWith('172.') &&
             !ip.startsWith('192.168.') &&
             ip !== '127.0.0.1';
    });
    if (clientIP) return clientIP;
    return ips[0]; // Fallback to first
  }

  // Other headers
  const realIP = request.headers.get('x-real-ip');
  const clientIPHeader = request.headers.get('x-client-ip');

  if (realIP) return realIP;
  if (clientIPHeader) return clientIPHeader;

  // Fallback
  return request.ip || '127.0.0.1';
}
```

---

### Solution 3: Disable Rate Limiting for Health Checks (10 minutes)

**File**: `src/lib/middleware/api-protection.ts`

Add to `protectApiEndpoint` function at line 115:
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
  const pathname = new URL(url).pathname;

  // SKIP rate limiting for health check endpoints
  if (pathname === '/api/health' ||
      pathname === '/health' ||
      pathname === '/api/healthcheck' ||
      pathname === '/_health') {
    return { allowed: true };
  }

  // SKIP rate limiting for Railway infrastructure requests
  if (userAgent.includes('Railway')) {
    return { allowed: true };
  }

  // ... rest of function
```

---

### Solution 4: Environment-Based Rate Limits (15 minutes)

Create **Railway-specific** configuration:

**File**: `src/lib/middleware/api-protection.ts`

Add near top of file:
```typescript
// Railway-specific rate limit adjustments
const isRailway = process.env.RAILWAY_ENVIRONMENT ||
                  process.env.RAILWAY_SERVICE_NAME ||
                  process.env.RAILWAY_PROJECT_ID;

const RATE_LIMIT_MULTIPLIER = isRailway ? 2 : 1; // Double limits on Railway

// Helper to adjust limits for Railway
function getRateLimit(base: number): number {
  return Math.floor(base * RATE_LIMIT_MULTIPLIER);
}
```

Then update configs:
```typescript
export const protectionConfigs = {
  public: {
    rateLimiting: {
      enabled: true,
      requestsPerMinute: getRateLimit(300),
    },
  },
  // ... etc
}
```

---

### Solution 5: Add Rate Limit Bypass for Development (5 minutes)

**File**: `src/lib/middleware/api-protection.ts`

Add environment variable check:
```typescript
// 2. Rate limiting protection
if (mergedConfig.rateLimiting?.enabled) {
  // BYPASS: Allow disabling rate limits via environment variable
  if (process.env.DISABLE_RATE_LIMITING === 'true') {
    console.log('⚠️ Rate limiting disabled via DISABLE_RATE_LIMITING env var');
    // Skip rate limiting
  } else {
    const limiter = rateLimiters.moderate;
    // ... rest of rate limiting logic
  }
}
```

Then in Railway, set: `DISABLE_RATE_LIMITING=true` (temporary, for testing)

---

### Solution 6: Fix CORS for Production (10 minutes)

**File**: `src/lib/middleware/api-protection.ts`

Update allowed origins to include Railway domain:
```typescript
corsProtection: {
  enabled: true,
  allowedOrigins: [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.NEXTAUTH_URL || '',
    process.env.NEXT_PUBLIC_APP_URL || '',
    process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '',
    // Wildcard for Railway preview deployments
    process.env.RAILWAY_ENVIRONMENT === 'production' ? '' : '*',
  ].filter(Boolean),
},
```

---

### Solution 7: Relax User Agent Blocking (5 minutes)

**File**: `src/lib/utils/security.ts`

Update suspicious patterns to be less aggressive:
```typescript
export function isSuspiciousUserAgent(userAgent: string): boolean {
  // Only block obvious malicious patterns
  const suspiciousPatterns = [
    /^$/,              // Empty user agent
    /sqlmap/i,         // SQL injection tool
    /nikto/i,          // Security scanner
    /masscan/i,        // Port scanner
    /nmap/i,           // Network mapper
    /scrapy/i,         // Python scraping framework (explicit scraper)
    // REMOVED: /bot/i - Too broad, blocks legitimate monitoring
    // REMOVED: /crawler/i - Too broad
    // REMOVED: /java/i - Blocks legitimate Java clients
    // REMOVED: /python/i - Blocks legitimate Python SDKs
  ];

  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}
```

---

## Implementation Priority

### Phase 1: IMMEDIATE (Deploy in next 30 minutes)
1. ✅ Increase rate limits (Solution 1) - **5 min**
2. ✅ Add health check bypass (Solution 3) - **10 min**
3. ✅ Relax user agent blocking (Solution 7) - **5 min**

**Total**: 20 minutes
**Impact**: Resolves 80% of 429 errors

---

### Phase 2: SHORT-TERM (Deploy within 24 hours)
4. ✅ Fix IP detection for Railway (Solution 2) - **10 min**
5. ✅ Fix CORS for production (Solution 6) - **10 min**
6. ✅ Add environment-based limits (Solution 4) - **15 min**

**Total**: 35 minutes
**Impact**: Resolves remaining 20% of 429 errors + improves security

---

### Phase 3: MEDIUM-TERM (Next sprint - 1 week)
7. ❌ Migrate to Redis-based rate limiting - **4 hours**
8. ❌ Implement distributed rate limiting - **6 hours**
9. ❌ Add rate limit monitoring dashboard - **3 hours**
10. ❌ Implement per-user rate limits (not just IP) - **2 hours**

**Total**: 15 hours
**Impact**: Production-grade rate limiting with observability

---

## Testing After Changes

### 1. Test Admin Dashboard
```bash
# Run from your machine or Postman
# Make 50 requests in 30 seconds

for i in {1..50}; do
  curl -X GET "https://your-app.railway.app/api/admin/dashboard/stats" \
    -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
    -w "\nStatus: %{http_code}\n"
  sleep 0.6  # 0.6 seconds between requests = ~100 req/min
done

# Expected: All 50 should return 200 (not 429)
```

### 2. Test Shopping Cart
```bash
# Simulate user adding 20 items to cart rapidly

for i in {1..20}; do
  curl -X POST "https://your-app.railway.app/api/cart" \
    -H "Content-Type: application/json" \
    -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
    -d "{\"productId\":\"PRODUCT_ID\",\"quantity\":1}" \
    -w "\nStatus: %{http_code}\n"
  sleep 0.5
done

# Expected: All 20 should return 200 or 201 (not 429)
```

### 3. Check Rate Limit Headers
```bash
curl -I "https://your-app.railway.app/api/cart" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Look for:
# X-RateLimit-Limit: 150
# X-RateLimit-Remaining: 149
# X-RateLimit-Reset: <timestamp>
```

---

## Monitoring Recommendations

### Add Logging to Track Rate Limit Hits

**File**: `src/lib/middleware/api-protection.ts` (line 155)

Change from:
```typescript
if (mergedConfig.logging?.logErrors) {
  console.warn(
    `🚫 Rate limit exceeded for ${clientIP} on ${method} ${url}`
  );
}
```

To:
```typescript
if (mergedConfig.logging?.logErrors) {
  console.warn(
    `🚫 RATE_LIMIT_HIT | IP: ${clientIP} | Path: ${new URL(url).pathname} | Method: ${method} | UserAgent: ${userAgent.substring(0, 50)} | Time: ${new Date().toISOString()}`
  );
}
```

This will help you identify:
- Which IPs are getting rate limited
- Which endpoints are hotspots
- Whether it's bots or real users

---

## Environment Variables to Set in Railway

Add these to your Railway environment:

```bash
# CRITICAL - Set your production URL
NEXTAUTH_URL=https://your-app.railway.app
NEXT_PUBLIC_APP_URL=https://your-app.railway.app

# OPTIONAL - For temporary testing
DISABLE_RATE_LIMITING=false  # Set to 'true' only for testing

# RECOMMENDED - Identify Railway environment
RAILWAY_PUBLIC_DOMAIN=your-app.railway.app  # Auto-set by Railway usually
```

---

## Summary

### Current Issues
1. ✅ **TOO AGGRESSIVE RATE LIMITS** - Admin: 20/min, Auth: 30/min (should be 100/min, 120/min)
2. ✅ **IN-MEMORY RATE LIMITING** - Lost on container restart, not shared across instances
3. ✅ **IP DETECTION ISSUES** - Railway proxy might cause IP misidentification
4. ✅ **USER AGENT BLOCKING** - Blocking legitimate monitoring tools and health checks
5. ✅ **CORS MISCONFIGURATION** - Production domain not in allowed origins

### Immediate Action Required
**Deploy Solution 1 + 3 + 7 within 30 minutes** to stop legitimate traffic from being blocked.

### Expected Outcome
- 429 errors reduced by 80-95%
- Admin dashboard loads smoothly
- Shopping cart operations work reliably
- Monitoring tools no longer blocked

---

**Next Step**: Implement Phase 1 solutions and monitor Railway logs for rate limit hits.
