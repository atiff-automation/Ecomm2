# Railway Rate Limiting & Security Configuration Guide

**Created:** 2025-10-25
**Purpose:** Configure Railway platform protection after removing in-memory rate limiting

---

## Overview

After removing in-memory rate limiting (which caused memory leaks and 4-hour crashes), we now rely on Railway's infrastructure-level protection. This guide covers configuration and alternatives.

---

## Part 1: Railway Built-In Protection (Already Active)

### What Railway Provides Out-of-the-Box

Railway automatically provides:

1. **DDoS Protection**
   - Automatic detection and mitigation of DDoS attacks
   - Traffic filtering at the infrastructure level
   - No configuration needed - always active

2. **Infrastructure Rate Limiting**
   - Connection-level rate limiting
   - Protection against resource exhaustion
   - Automatic scaling throttling

3. **Health Monitoring**
   - Container health checks via `/api/health` endpoint
   - Automatic restart of unhealthy containers
   - Resource usage monitoring

### Verify Health Check Configuration

1. **Go to Railway Dashboard**
   ```
   https://railway.app/project/<your-project-id>
   ```

2. **Select Your Service** → Click on your Next.js service

3. **Navigate to Settings Tab**

4. **Scroll to "Health Check" Section**

5. **Configure Health Check:**
   ```
   Health Check Path: /api/health
   Health Check Timeout: 10 seconds
   Health Check Interval: 30 seconds
   ```

6. **Save Changes**

### Verify Health Check is Working

After deployment, test the endpoint:
```bash
curl https://your-app.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-25T10:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "memory": {
      "used": 150,
      "total": 512,
      "percentage": 29
    }
  }
}
```

---

## Part 2: Railway Custom Rate Limiting (If Available)

### Check if Your Plan Supports Custom Rate Limiting

**Note:** As of 2025, Railway's custom rate limiting features may be limited to Pro/Team plans or not yet available. Check your plan features.

### Option 1: Using Railway's Network Policies (Enterprise)

If you have Enterprise plan:

1. **Go to Railway Dashboard** → Your Project
2. **Navigate to Networking** → Network Policies
3. **Create New Policy:**
   ```yaml
   name: api-rate-limit
   rules:
     - match:
         path: /api/*
       rateLimit:
         requests: 100
         period: 60s
         burst: 20
   ```

### Option 2: Using Environment Variables for Configuration

Railway doesn't expose granular rate limiting controls in most plans. Instead, configure at the application level if needed later.

---

## Part 3: Cloudflare Rate Limiting (Recommended Alternative)

### Why Cloudflare?

- **Free Tier Available:** 10k requests/month rate limiting rules
- **Edge Protection:** Filters traffic before it reaches Railway
- **No Code Changes:** Works at DNS/proxy level
- **DDoS Protection:** Enhanced protection beyond Railway

### Step-by-Step Cloudflare Setup

#### Step 1: Add Your Domain to Cloudflare

1. **Sign up at** https://dash.cloudflare.com/sign-up
2. **Add Your Site:** Enter your domain name
3. **Choose Plan:** Free plan is sufficient to start
4. **Update Nameservers:** Follow Cloudflare's instructions to point your domain to Cloudflare nameservers

#### Step 2: Configure DNS for Railway

1. **In Cloudflare Dashboard** → DNS → Records
2. **Add CNAME Record:**
   ```
   Type: CNAME
   Name: @ (or your subdomain)
   Target: your-app.up.railway.app
   Proxy Status: Proxied (orange cloud icon)
   TTL: Auto
   ```

3. **Important:** Ensure "Proxied" (orange cloud) is enabled, NOT "DNS only" (gray cloud)

#### Step 3: Configure Rate Limiting Rules

1. **In Cloudflare Dashboard** → Security → WAF
2. **Go to Rate Limiting Rules**
3. **Create Rule:**

**Rule 1: General API Protection**
```
Rule Name: General API Rate Limit
If: (http.request.uri.path contains "/api/")
Then:
  - Rate Limit: 100 requests per 1 minute
  - Action: Block
  - Duration: 1 minute
```

**Rule 2: Authentication Endpoints (Strict)**
```
Rule Name: Auth Rate Limit
If: (http.request.uri.path contains "/api/auth/")
Then:
  - Rate Limit: 5 requests per 15 minutes
  - Action: Block
  - Duration: 15 minutes
```

**Rule 3: Payment Endpoints (Very Strict)**
```
Rule Name: Payment Rate Limit
If: (http.request.uri.path contains "/api/payment/") OR
    (http.request.uri.path contains "/api/orders/retry-payment")
Then:
  - Rate Limit: 3 requests per 5 minutes
  - Action: Block
  - Duration: 10 minutes
```

#### Step 4: Configure WAF (Web Application Firewall)

1. **Security** → WAF → Managed Rules
2. **Enable:**
   - ✅ Cloudflare Managed Ruleset
   - ✅ Cloudflare OWASP Core Ruleset
   - ✅ Cloudflare Exposed Credentials Check

#### Step 5: Configure DDoS Protection

1. **Security** → DDoS
2. **Enable HTTP DDoS Attack Protection:** ON
3. **Sensitivity Level:** Medium (adjust based on traffic patterns)

#### Step 6: Update Railway Environment Variable

In Railway dashboard, update:
```
NEXTAUTH_URL=https://yourdomain.com (your Cloudflare domain, not railway.app)
```

---

## Part 4: Upstash Redis Rate Limiting (Advanced Alternative)

### When to Use Upstash

- Need per-user rate limiting (not just per-IP)
- Need complex rate limiting rules (different limits per endpoint)
- Need rate limit data persistence across Railway container restarts
- Need rate limiting shared across multiple Railway instances

### Step-by-Step Upstash Setup

#### Step 1: Create Upstash Redis Database

1. **Sign up at** https://console.upstash.com
2. **Create Database:**
   - Name: `ecomjrm-rate-limit`
   - Type: Regional
   - Region: Choose closest to your users
   - Eviction: OFF (we want persistent rate limit data)

3. **Copy Connection Details:**
   - REST URL
   - REST Token

#### Step 2: Add to Railway Environment Variables

In Railway dashboard → Your Service → Variables:
```bash
UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

#### Step 3: Install Upstash Redis Package

```bash
npm install @upstash/redis
```

#### Step 4: Create Upstash Rate Limiter (Implementation)

Create `src/lib/rate-limit-upstash.ts`:
```typescript
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client
const redis = Redis.fromEnv();

// Create rate limiters for different use cases
export const rateLimiters = {
  // General API - 100 requests per minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: '@ecomjrm/api',
  }),

  // Authentication - 5 attempts per 15 minutes
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: '@ecomjrm/auth',
  }),

  // Payment - 3 attempts per 5 minutes
  payment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '5 m'),
    prefix: '@ecomjrm/payment',
  }),
};

// Usage in API routes
export async function checkRateLimit(
  identifier: string,
  limiter: keyof typeof rateLimiters = 'api'
) {
  const { success, limit, remaining, reset } = await rateLimiters[limiter].limit(
    identifier
  );

  return {
    success,
    limit,
    remaining,
    reset,
  };
}
```

#### Step 5: Use in API Routes

Update API routes to use Upstash rate limiting:
```typescript
import { checkRateLimit } from '@/lib/rate-limit-upstash';

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  // Check rate limit
  const rateLimit = await checkRateLimit(clientIP, 'payment');

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: new Date(rateLimit.reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    );
  }

  // Continue with request processing...
}
```

---

## Part 5: Monitoring & Verification

### Check Railway Logs for Memory Usage

After deployment with new memory monitoring:

```bash
# In Railway Dashboard → Deployments → Latest → Logs

# Look for memory logs (every 10 minutes):
💾 Memory: Heap 150MB/512MB (29%), RSS 180MB

# Look for health check confirmations:
✅ Health check passed in 45ms
```

### Monitor for Issues

**Warning Signs to Watch:**
```
⚠️  HIGH MEMORY USAGE: 85% - Consider investigating memory leaks
⚠️  Health check FAILED in 2500ms
❌ Health check endpoint error
```

### Verify Rate Limiting is Working

#### Test with curl:

**Test 1: Normal Request (Should Pass)**
```bash
curl -i https://your-app.up.railway.app/api/health
# Expected: 200 OK
```

**Test 2: Rapid Requests (Should Block if Cloudflare is configured)**
```bash
for i in {1..150}; do
  curl -s https://your-app.up.railway.app/api/health &
done
wait
# Expected: Some requests return 429 after threshold
```

---

## Part 6: Recommended Configuration

### For Most Applications (Start Here)

1. ✅ **Railway Health Check** (Already configured via code)
2. ✅ **Railway Built-in DDoS Protection** (Automatic)
3. ⏳ **Cloudflare Free Plan** (Add when you have a custom domain)
   - Basic rate limiting: 10k requests/month on free tier
   - DDoS protection
   - WAF rules

**Cost:** $0/month

### For Growing Applications

1. ✅ Railway Health Check
2. ✅ Railway DDoS Protection
3. ✅ **Cloudflare Pro Plan** ($20/month)
   - Unlimited rate limiting rules
   - Advanced DDoS protection
   - Image optimization
4. ⏳ **Upstash Redis** (Free tier: 10k requests/day)
   - Add when you need per-user rate limiting
   - Add when you scale to multiple Railway instances

**Cost:** $20/month

### For High-Traffic Applications

1. ✅ All of the above
2. ✅ **Upstash Redis Paid Plan** ($10+/month)
3. ✅ **Railway Pro Plan** ($20+/month)
   - Better resources
   - Priority support
4. ✅ **Monitoring Service** (Sentry, DataDog, etc.)

**Cost:** $50+/month

---

## Part 7: Immediate Action Items

### Do This Now (Before Next Deployment)

- [x] Code changes committed
- [ ] Push changes to Railway:
  ```bash
  git push origin main
  ```

- [ ] Configure Railway Health Check (5 minutes)
  - Path: `/api/health`
  - Timeout: 10s
  - Interval: 30s

- [ ] Deploy and verify:
  ```bash
  # Wait for deployment
  # Test health endpoint
  curl https://your-app.up.railway.app/api/health
  ```

- [ ] Monitor Railway logs for 24 hours:
  - Check for memory logs every 10 minutes
  - Verify no crashes
  - Look for "💾 Memory" logs

### Do This Week (Optional but Recommended)

- [ ] Add custom domain to Railway
- [ ] Set up Cloudflare (if you have a domain)
- [ ] Configure basic Cloudflare rate limiting rules
- [ ] Test rate limiting with curl

### Do Later (When Scaling)

- [ ] Implement Upstash Redis rate limiting
- [ ] Add per-user rate limiting
- [ ] Set up advanced monitoring (Sentry, etc.)
- [ ] Configure Railway Pro features

---

## Part 8: Troubleshooting

### Issue: App Still Crashes

**Check:**
1. Memory logs - is memory still growing?
   ```bash
   # Railway logs should show:
   💾 Memory: Heap XXmB/512MB (XX%)
   ```

2. Is health check passing?
   ```bash
   curl https://your-app.up.railway.app/api/health
   ```

3. Check Railway metrics dashboard for memory trends

### Issue: Too Many Rate Limit Blocks

**If using Cloudflare:**
- Lower sensitivity in Cloudflare dashboard
- Adjust rate limits to higher thresholds
- Whitelist specific IPs (your office, etc.)

**If using Upstash:**
- Increase limits in `rate-limit-upstash.ts`
- Use different identifiers (user ID instead of IP for logged-in users)

### Issue: Health Check Failing

**Check:**
1. Is database connection working?
2. Is `/api/health` endpoint accessible?
3. Railway logs for health check errors

---

## Summary

**What We Did:**
- ✅ Removed in-memory rate limiting (causing crashes)
- ✅ Added graceful shutdown handling
- ✅ Added memory monitoring
- ✅ Health check endpoint ready

**What Railway Provides:**
- ✅ DDoS protection (automatic)
- ✅ Health monitoring (configure health check path)
- ✅ Infrastructure rate limiting (basic)

**What You Should Add:**
1. **Immediate:** Configure Railway health check
2. **This Week:** Set up Cloudflare (when you have a domain)
3. **Later:** Consider Upstash Redis for advanced rate limiting

---

## Quick Reference Commands

```bash
# Push changes to Railway
git push origin main

# Test health endpoint
curl https://your-app.up.railway.app/api/health

# Check Railway logs
# (Use Railway dashboard → Logs)

# Test rate limiting (if Cloudflare configured)
for i in {1..150}; do curl -s https://your-app.up.railway.app/api/health & done; wait
```

---

**Questions?** Check Railway docs: https://docs.railway.app
**Cloudflare docs:** https://developers.cloudflare.com/waf/rate-limiting-rules/
