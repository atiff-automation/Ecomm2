# EasyParcel Sandbox Timeout Update

**Date:** 2025-10-12
**Issue:** Sandbox API rate calculation endpoint takes 40+ seconds to respond
**Solution:** Increased sandbox timeout from 8 seconds to 60 seconds

---

## Changes Made

### 1. Environment Variable (.env)
**File:** `.env`
**Change:** `EASYPARCEL_SANDBOX_TIMEOUT` increased from `8000` to `60000` (milliseconds)

```diff
- EASYPARCEL_SANDBOX_TIMEOUT="8000"
+ EASYPARCEL_SANDBOX_TIMEOUT="60000"
```

**Impact:** All sandbox API requests now have 60-second timeout instead of 8 seconds

---

### 2. Credentials Service
**File:** `src/lib/services/easyparcel-credentials.ts`
**Change:** Updated sandbox timeout fallback from 8s to 60s

```diff
  sandbox: {
    url: process.env.EASYPARCEL_SANDBOX_URL || 'http://demo.connect.easyparcel.my',
-   timeout: parseInt(process.env.EASYPARCEL_SANDBOX_TIMEOUT || '8000')
+   timeout: parseInt(process.env.EASYPARCEL_SANDBOX_TIMEOUT || '60000')
  }
```

**Impact:** Ensures 60s timeout even if env var is missing

---

### 3. EasyParcel Service
**File:** `src/lib/shipping/easyparcel-service.ts`
**Change:** Constructor now uses environment-specific timeouts

```diff
  constructor(apiKey: string, environment: 'sandbox' | 'production' = 'sandbox') {
    this.apiKey = apiKey;
    this.baseUrl =
      environment === 'production'
        ? EASYPARCEL_CONFIG.PRODUCTION_URL
        : EASYPARCEL_CONFIG.SANDBOX_URL;
-   this.timeout = EASYPARCEL_CONFIG.DEFAULT_TIMEOUT;
+   // Use environment-specific timeout: 60s for sandbox (slow API), 15s for production
+   this.timeout =
+     environment === 'sandbox'
+       ? parseInt(process.env.EASYPARCEL_SANDBOX_TIMEOUT || '60000')
+       : parseInt(process.env.EASYPARCEL_PRODUCTION_TIMEOUT || '15000');
  }
```

**Impact:**
- Sandbox requests: 60-second timeout
- Production requests: 15-second timeout (unchanged)
- Environment-aware timeout handling

---

### 4. Constants Documentation
**File:** `src/lib/shipping/constants.ts`
**Change:** Updated documentation to clarify timeout configuration

```typescript
/**
 * API Configuration
 *
 * EasyParcel API endpoints and defaults.
 *
 * NOTE: Actual timeouts are environment-specific:
 * - Sandbox: 60 seconds (EASYPARCEL_SANDBOX_TIMEOUT env var) - Sandbox API is very slow
 * - Production: 15 seconds (EASYPARCEL_PRODUCTION_TIMEOUT env var)
 * DEFAULT_TIMEOUT is a fallback only.
 */
```

**Impact:** Clear documentation for future developers

---

## Why 60 Seconds?

Based on testing (see `EASYPARCEL_SANDBOX_TIMEOUT_REPORT.md`):

| Test | Timeout | Result |
|------|---------|--------|
| 30 seconds | ❌ | Request timed out |
| 60 seconds | ✅ | Response received (~41s actual) |
| 120 seconds | ✅ | Response received (~41s actual) |

**Decision:** 60 seconds provides sufficient buffer while still catching genuine hangs.

---

## Affected Operations

All EasyParcel API calls in sandbox mode:
- ✅ Rate calculation (`getRates`) - Primary beneficiary (was timing out at 8s)
- ✅ Shipment creation (`createShipment`)
- ✅ Order payment (`payOrder`)
- ✅ Tracking updates (`getTracking`)
- ✅ Balance check (`getBalance`)

---

## Production Impact

**None.** Production timeout remains at 15 seconds:
- Production API is expected to be faster than sandbox
- If production also has performance issues, EasyParcel team needs to be contacted
- 15 seconds is still generous for production e-commerce checkout flows

---

## Testing Recommendations

1. **Test rate calculation in sandbox:**
   ```bash
   # Should complete within 60 seconds (actual: ~41s)
   curl --max-time 60 -X POST "http://demo.connect.easyparcel.my/?ac=EPRateCheckingBulk" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "api=YOUR_API_KEY" \
     -d "bulk[0][pick_code]=20000" \
     -d "bulk[0][pick_state]=trg" \
     -d "bulk[0][pick_country]=MY" \
     -d "bulk[0][send_code]=50000" \
     -d "bulk[0][send_state]=kul" \
     -d "bulk[0][send_country]=MY" \
     -d "bulk[0][weight]=1"
   ```

2. **Monitor application logs:**
   - Check for timeout errors in sandbox mode
   - Verify 60s timeout is being used
   - Watch for actual response times

3. **Production deployment:**
   - Ensure production uses different timeout (15s)
   - Monitor production API performance
   - Report to EasyParcel if production is also slow

---

## Related Documentation

- **Issue Report:** `claudedocs/EASYPARCEL_SANDBOX_TIMEOUT_REPORT.md`
- **Environment Config:** `.env`
- **Service Implementation:** `src/lib/shipping/easyparcel-service.ts`

---

## Rollback Procedure

If 60 seconds causes issues (unlikely):

1. Update `.env`:
   ```bash
   EASYPARCEL_SANDBOX_TIMEOUT="30000"  # 30 seconds
   ```

2. Restart application

3. Revert code changes if needed (git revert)

---

**Status:** ✅ Implemented and ready for testing
**Priority:** High - Unblocks sandbox development and testing
**Risk:** Low - Only affects sandbox environment, not production
