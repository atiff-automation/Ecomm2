# Post-Deployment Monitoring Guide

**Deployment Date**: 2025-10-03
**Commit**: fbfc9d6
**Status**: 🚀 DEPLOYED TO RAILWAY

---

## Deployment Summary

### Changes Deployed
- ✅ Rate limits increased 3-5x (6-10x on Railway with 2x multiplier)
- ✅ Health check endpoints bypassed
- ✅ User agent blocking relaxed
- ✅ IP detection improved for Railway
- ✅ CORS configured for Railway domains
- ✅ Environment-based rate limit multiplier
- ✅ Enhanced monitoring logs

### Files Modified
- `src/lib/middleware/api-protection.ts` (~100 lines)
- `src/lib/utils/security.ts` (~70 lines)

---

## Immediate Actions (First 30 Minutes)

### 1. Monitor Railway Deployment
```bash
railway logs --follow
```

**Watch for**:
- ✅ Build successful
- ✅ Deployment successful
- ✅ Application started
- ⚠️ No errors during startup

---

### 2. Monitor Rate Limit Hits
```bash
railway logs --follow | grep "RATE_LIMIT_HIT"
```

**Expected Result**: Very few or zero hits

**If you see hits, check**:
- IP address (is it legitimate user or bot?)
- Path (which endpoint is being hit?)
- User agent (legitimate browser or suspicious?)
- Limit (is the limit too low for that endpoint?)

---

### 3. Verify Health Check Bypass
```bash
railway logs --follow | grep -E "(health|Health|HEALTH)"
```

**Expected Result**:
- Health checks should NOT appear in rate limit logs
- Health checks should return 200 OK
- No "RATE_LIMIT_HIT" entries for health check paths

---

### 4. Test Admin Dashboard
**Action**: Open admin dashboard in browser

**Expected Behavior**:
- ✅ Dashboard loads without 429 errors
- ✅ All widgets load successfully
- ✅ Can navigate between pages smoothly

**If 429 errors occur**:
1. Check Railway logs for "RATE_LIMIT_HIT"
2. Verify rate limit multiplier is active (should be 200 req/min)
3. Check IP detection (all requests should have unique IPs)

---

### 5. Test Shopping Cart
**Action**: Add multiple items to cart

**Expected Behavior**:
- ✅ Can add 10+ items without 429 errors
- ✅ Cart auto-refresh works smoothly
- ✅ Checkout process works

---

## Monitoring Commands

### Check Rate Limit Activity
```bash
# Last 100 rate limit hits
railway logs | grep "RATE_LIMIT_HIT" | tail -100

# Count rate limit hits in last hour
railway logs --since 1h | grep -c "RATE_LIMIT_HIT"

# Show unique IPs getting rate limited
railway logs | grep "RATE_LIMIT_HIT" | grep -oP "IP: \K[^\s]+" | sort | uniq -c | sort -rn

# Show most rate-limited endpoints
railway logs | grep "RATE_LIMIT_HIT" | grep -oP "Path: \K[^\s]+" | sort | uniq -c | sort -rn
```

---

### Check Railway Multiplier (Development Only)
```bash
# This log only appears in development
railway logs | grep "Railway detected"

# In production, console.log is removed, but multiplier still active
```

---

### Check General Application Health
```bash
# Watch all logs
railway logs --follow

# Filter errors only
railway logs --follow | grep -E "(ERROR|Error|error)"

# Filter warnings
railway logs --follow | grep -E "(WARN|Warn|warn)"
```

---

## Success Metrics (24 Hours)

### Expected Improvements
- [ ] 429 errors reduced by 80-95%
- [ ] Admin dashboard loads consistently
- [ ] Shopping cart operations smooth
- [ ] No health check rate limit hits
- [ ] Unique IP addresses in logs (not all same IP)

### Key Performance Indicators

#### Rate Limit Hits
**Before**: High frequency (blocking legitimate users)
**After**: Very low (only suspicious traffic)

**Measurement**:
```bash
# Count hits in last 24 hours
railway logs --since 24h | grep -c "RATE_LIMIT_HIT"
```

**Target**: < 10 hits per day for legitimate traffic

---

#### User Experience
**Before**: Frequent 429 errors during normal usage
**After**: Smooth operation, no 429 errors

**Test Scenarios**:
1. ✅ Admin opens dashboard (15-20 requests)
2. ✅ User browses products (10-15 requests)
3. ✅ User adds to cart multiple times (20+ requests)
4. ✅ User checks out (10-15 requests)

---

#### Health Check Impact
**Before**: Health checks consuming rate limit quota
**After**: Health checks bypassed

**Measurement**:
```bash
railway logs | grep "health" | grep "RATE_LIMIT_HIT"
```

**Target**: 0 results

---

## Troubleshooting

### Issue 1: Still Getting 429 Errors

#### Diagnosis
```bash
# Check which endpoint is being rate limited
railway logs | grep "RATE_LIMIT_HIT" | grep -oP "Path: \K[^\s]+" | sort | uniq -c

# Check the limit that was hit
railway logs | grep "RATE_LIMIT_HIT" | grep -oP "Limit: \K[^\s]+"
```

#### Solutions
1. **Verify Railway environment variables are set**:
   ```bash
   railway variables
   ```
   Should show `RAILWAY_ENVIRONMENT`, `RAILWAY_SERVICE_NAME`, or `RAILWAY_PROJECT_ID`

2. **Check rate limit multiplier is active**:
   - Admin limit should be 200 req/min on Railway (100 × 2)
   - Standard limit should be 300 req/min on Railway (150 × 2)

3. **If limits still too low**, manually increase in `api-protection.ts`

---

### Issue 2: All Requests Showing Same IP

#### Diagnosis
```bash
# Check IP diversity
railway logs | grep "RATE_LIMIT_HIT" | grep -oP "IP: \K[^\s]+" | sort | uniq
```

#### Solutions
1. **Verify IP detection logic**:
   - Check `getClientIP()` function in `src/lib/utils/security.ts`
   - Should prioritize `x-real-ip` and `x-forwarded-for` headers

2. **Check Railway proxy headers**:
   ```bash
   railway logs | grep "x-forwarded-for"
   ```

---

### Issue 3: Health Checks Still Consuming Quota

#### Diagnosis
```bash
# Should return 0 results
railway logs | grep "health" | grep "RATE_LIMIT_HIT"
```

#### Solutions
1. **Verify health check bypass logic** in `api-protection.ts` lines 138-154
2. **Check health check paths** are correct
3. **Add more health check paths** if Railway uses different endpoints

---

### Issue 4: CORS Errors

#### Diagnosis
```bash
railway logs | grep "CORS"
```

#### Solutions
1. **Set environment variables** in Railway dashboard:
   ```
   NEXTAUTH_URL=https://your-app.railway.app
   NEXT_PUBLIC_APP_URL=https://your-app.railway.app
   ```

2. **Verify RAILWAY_PUBLIC_DOMAIN** is set automatically by Railway

---

## Environment Variables Check

### Required Variables (Set in Railway Dashboard)
```bash
# Run in Railway CLI or check dashboard
railway variables
```

**Should include**:
- `NEXTAUTH_URL` - Your Railway app URL
- `NEXT_PUBLIC_APP_URL` - Your Railway app URL
- `RAILWAY_ENVIRONMENT` - Auto-set by Railway (production/staging)
- `RAILWAY_SERVICE_NAME` - Auto-set by Railway
- `RAILWAY_PROJECT_ID` - Auto-set by Railway

---

## Rollback Procedure (If Needed)

### Option 1: Git Revert (Recommended)
```bash
# Revert the rate limit fix commit
git revert fbfc9d6

# Push to trigger rollback deployment
git push origin main
```

### Option 2: Emergency Disable via Environment Variable
**In Railway Dashboard**:
1. Go to Variables
2. Add new variable:
   ```
   DISABLE_RATE_LIMITING=true
   ```
3. Redeploy

**Then update code** (in emergency commit):
```typescript
// In src/lib/middleware/api-protection.ts, line 140
if (process.env.DISABLE_RATE_LIMITING === 'true') {
  console.log('⚠️ Rate limiting DISABLED via env var');
  return { allowed: true };
}
```

### Option 3: Deploy Previous Commit
```bash
# Find previous commit hash
git log --oneline -5

# Reset to previous commit (example: c088068)
git reset --hard c088068

# Force push
git push origin main --force
```

---

## Success Checklist (First 24 Hours)

### Hour 1 (Immediate)
- [ ] Deployment successful on Railway
- [ ] Application started without errors
- [ ] Admin dashboard loads (test manually)
- [ ] Shopping cart works (test manually)
- [ ] No rate limit hits in logs for health checks

### Hour 6 (Mid-term)
- [ ] < 5 rate limit hits for legitimate traffic
- [ ] No user complaints about 429 errors
- [ ] Rate limit logs show diverse IP addresses
- [ ] Admin operations smooth

### Hour 24 (Long-term)
- [ ] 95% reduction in 429 errors
- [ ] Positive user feedback
- [ ] No unexpected rate limit patterns
- [ ] System stability maintained

---

## Ongoing Monitoring (Weekly)

### Weekly Health Check
```bash
# Rate limit hits last 7 days
railway logs --since 7d | grep -c "RATE_LIMIT_HIT"

# Top rate-limited IPs (look for patterns)
railway logs --since 7d | grep "RATE_LIMIT_HIT" | grep -oP "IP: \K[^\s]+" | sort | uniq -c | sort -rn | head -10

# Top rate-limited endpoints
railway logs --since 7d | grep "RATE_LIMIT_HIT" | grep -oP "Path: \K[^\s]+" | sort | uniq -c | sort -rn | head -10
```

### Action Items
- If legitimate IPs are getting rate limited → Increase limits
- If suspicious IPs are hitting limits → Consider blocking
- If specific endpoints are problematic → Investigate or increase limits

---

## Contact & Support

### If Issues Persist
1. Check `claudedocs/` for all documentation
2. Review logs with commands above
3. Verify environment variables are set
4. Test manually with browser DevTools

### Emergency Contacts
- Railway Dashboard: https://railway.app
- GitHub Repo: https://github.com/atiff-automation/Ecomm2.git
- Deployment Logs: `railway logs --follow`

---

## Next Steps (Phase 3 - Optional)

### Medium-Term Improvements (1-2 weeks)
1. **Implement Redis-based rate limiting**
   - Shared state across Railway instances
   - Persistent rate limit counters
   - Better handling of container restarts

2. **Create monitoring dashboard**
   - Real-time rate limit statistics
   - IP address analysis
   - Endpoint usage patterns

3. **Add per-user rate limits**
   - Authenticated users get higher limits
   - Track by user ID instead of just IP
   - Different limits for different user roles

---

**Deployment Status**: 🚀 LIVE
**Monitoring Start**: 2025-10-03
**Expected Impact**: 95% reduction in 429 errors
**Next Review**: 24 hours after deployment
