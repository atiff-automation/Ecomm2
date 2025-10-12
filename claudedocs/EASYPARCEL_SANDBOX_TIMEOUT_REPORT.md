# EasyParcel Sandbox API Timeout Issue Report

**Report Date:** 2025-10-12
**Reporter:** EcomJRM Development Team
**API Key:** EP-10Fqii5ZP
**Environment:** Sandbox (demo.connect.easyparcel.my)

---

## Executive Summary

The EasyParcel sandbox API endpoint `EPRateCheckingBulk` (used for shipping rate calculations) has **extremely slow response times** of approximately **40+ seconds**, which is unacceptable for production use and causes frequent timeouts during development.

**Critical Finding:** While basic endpoints (balance check) respond in <1 second, the rate calculation endpoint takes **40+ seconds** to complete, making it impractical for real-world e-commerce checkout flows.

### Quick Summary

| Metric | Balance Check | Rate Calculation | Impact |
|--------|--------------|------------------|--------|
| **Response Time** | <1 second ✅ | 41+ seconds ❌ | **40x slower** |
| **Timeout Needed** | 10s sufficient | 120s minimum | Must use very long timeouts |
| **Production Ready** | Yes ✅ | No ❌ | Blocks e-commerce checkout |
| **With Full Address** | N/A | 41s (no improvement) | Address details don't help |

**Bottom Line:** The sandbox rate calculation API works but is too slow for production testing or development.

---

## Issue Details

### Affected Endpoint
- **URL:** `http://demo.connect.easyparcel.my/?ac=EPRateCheckingBulk`
- **Method:** POST
- **Content-Type:** application/x-www-form-urlencoded
- **Status:** **EXTREMELY SLOW** - Takes 40+ seconds to respond
- **Expected:** <3 seconds for checkout usability
- **Actual:** 40+ seconds consistently

### Working Endpoints (For Comparison)
- **URL:** `http://demo.connect.easyparcel.my/?ac=EPCheckCreditBalance`
- **Status:** ✅ Working normally (responds in <1 second)
- **URL:** `http://demo.connect.easyparcel.my/?ac=EPGetService`
- **Status:** ✅ Working normally (responds immediately)

---

## Test Evidence

### Test Configuration
```
Test Date: 2025-10-12
Test Time: 12:48:05 - 12:49:53 MYT (UTC+8)
Test Location: Malaysia
API Key: EP-10Fqii5ZP
Server IPs: 47.254.199.161, 47.254.192.119
```

### Test 1: Rate Calculation - 30s Timeout (Too Short) ❌

**Request:**
```bash
POST http://demo.connect.easyparcel.my/?ac=EPRateCheckingBulk
Content-Type: application/x-www-form-urlencoded

api=EP-10Fqii5ZP
bulk[0][pick_code]=20000
bulk[0][pick_state]=trg
bulk[0][pick_country]=MY
bulk[0][send_code]=50000
bulk[0][send_state]=kul
bulk[0][send_country]=MY
bulk[0][weight]=1
bulk[0][content]=Test parcel
```

**Result with 30s timeout:**
- Connection established successfully to server IP
- Request sent (211 bytes uploaded)
- Server processing (very slow)
- **Error:** `curl: (28) Operation timed out after 30006 milliseconds with 0 bytes received`
- Client timeout before server finished processing

**Network Timeline:**
```
0s   - Connection established
0s   - Request sent (211 bytes)
1s   - Waiting... (server processing)
5s   - Still waiting...
10s  - Still waiting...
15s  - Still waiting...
20s  - Still waiting...
25s  - Still waiting...
30s  - CLIENT TIMEOUT (server still processing)
```

### Test 2: Rate Calculation - 120s Timeout (SUCCESS but SLOW) ⚠️

**Request:** (Same as Test 1, but with 120s timeout)

**Result:**
- Connection established
- Request sent successfully
- Server processing took **~41 seconds**
- **HTTP 200 OK** - Response received!
- Valid JSON with shipping rates returned

**Response Time:** 41.102 seconds

**Sample Response:**
```json
{
  "api_status": "Success",
  "error_code": "0",
  "error_remark": "",
  "result": [
    {
      "REQ_ID": "",
      "status": "Success",
      "remarks": "",
      "rates": [
        {
          "rate_id": "EP-RR0E5KX",
          "service_name": "J&T Express (Pick Up with 3 Min Parcels)",
          "price": "8.68",
          "delivery": "3 working day(s)",
          "pickup_date": "2025-10-13"
        }
        // ... more rates
      ]
    }
  ]
}
```

**Conclusion:** The endpoint WORKS but is **unacceptably slow** (41 seconds vs expected <3 seconds)

### Test 3: Balance Check - SUCCESS ✅ (For Comparison)

**Request:**
```bash
POST http://demo.connect.easyparcel.my/?ac=EPCheckCreditBalance
Content-Type: application/x-www-form-urlencoded

api=EP-10Fqii5ZP
```

**Result:**
- Response received in **< 1 second**
- **HTTP 200 OK**
- Valid JSON response with balance data

**Response:**
```json
{
  "currency": "MYR",
  "result": 1016.87,
  "wallet": [
    {"balance": 1016.87, "currency_code": "MYR"},
    {"balance": 0, "currency_code": "SGD"}
  ],
  "api_status": "Success",
  "error_code": "0",
  "error_remark": ""
}
```

**Tested 5 times consecutively - all succeeded with consistent response time.**

### Test 4: Rate Calculation WITH Full Addresses - SLOW ⚠️

**Request:**
```bash
POST http://demo.connect.easyparcel.my/?ac=EPRateCheckingBulk
Content-Type: application/x-www-form-urlencoded

api=EP-10Fqii5ZP
bulk[0][pick_name]=Test Sender
bulk[0][pick_contact]=0123456789
bulk[0][pick_addr1]=No. 123 Jalan Test
bulk[0][pick_addr2]=Level 5
bulk[0][pick_city]=Kuala Terengganu
bulk[0][pick_code]=20000
bulk[0][pick_state]=trg
bulk[0][pick_country]=MY
bulk[0][send_name]=Test Receiver
bulk[0][send_contact]=0198765432
bulk[0][send_addr1]=No. 456 Jalan KL
bulk[0][send_city]=Kuala Lumpur
bulk[0][send_code]=50000
bulk[0][send_state]=kul
bulk[0][send_country]=MY
bulk[0][weight]=1
bulk[0][content]=Test parcel
```

**Result:**
- **Response Time:** 41.049 seconds
- **HTTP 200 OK** - Valid response received
- **No improvement** with full address details
- Including sender/receiver name and address does NOT speed up the API

**Conclusion:** Full addresses are NOT required and do NOT improve performance

---

## Technical Analysis

### Connection Details
- DNS resolution: ✅ Working
- TCP connection: ✅ Established successfully
- Request transmission: ✅ Completed
- Server acknowledgment: ✅ Received
- **Response generation: ⚠️ EXTREMELY SLOW - Takes 40+ seconds**

### Server Behavior
The server:
1. Accepts the TCP connection ✅
2. Receives the HTTP request ✅
3. Processes the request successfully ✅
4. **Takes 40+ seconds** to calculate rates ❌
5. Returns valid response with shipping rates ✅

### Possible Root Causes
1. **Database performance** - Slow queries for rate calculation
2. **External API calls** - Multiple sequential courier API calls in sandbox
3. **No caching** - Recalculating rates every time without cache
4. **Resource constraints** - Sandbox server underpowered/overloaded
5. **Network latency** - Sandbox making slow calls to external services
6. **Synchronous processing** - Not using async/parallel processing for multiple couriers

---

## Impact on Development

### Blocked Functionality
Cannot test or develop:
- Shipping rate calculation at checkout
- Courier selection and comparison
- Dynamic shipping cost display
- Multi-destination shipping quotes
- Shipping cost validation

### Workarounds Attempted
- Multiple retry attempts: ⚠️ Works but consistently slow (41s)
- Different test data: ⚠️ Same slow performance
- Longer timeout values (120s): ✅ Works but unacceptably slow
- Full address details: ⚠️ No performance improvement

### Current Status
**Development impacted** - Can test with 120s timeouts, but this is:
- ❌ **Unacceptable for production** (customers won't wait 40+ seconds at checkout)
- ⚠️ **Unrealistic for testing** (production should be <3 seconds)
- ⚠️ **Cannot validate production readiness** (sandbox performance ≠ production)

---

## Request for EasyParcel Team

### Immediate Actions Needed
1. **Optimize** `EPRateCheckingBulk` endpoint performance in sandbox (currently 41s → target <3s)
2. **Check server logs** for performance bottlenecks during test period (2025-10-12 12:48-12:53 MYT)
3. **Verify** if production API has same performance issues or if it's sandbox-specific
4. **Implement caching** or other optimizations to speed up rate calculations

### Information Needed
1. **What is the expected response time** for production `EPRateCheckingBulk` endpoint?
2. **Is the 41-second response** normal for sandbox, or is this a performance issue?
3. **Does production API** perform significantly faster than sandbox?
4. **Are there any optimizations** we can apply (caching, specific parameters, etc.)?
5. **Should we use a different endpoint** for rate calculations?

---

## Reproduction Steps

To reproduce this performance issue:

```bash
# This will take 40+ seconds to respond (use 120s timeout to see response)
time curl --max-time 120 -X POST "http://demo.connect.easyparcel.my/?ac=EPRateCheckingBulk" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api=EP-10Fqii5ZP" \
  -d "bulk[0][pick_code]=20000" \
  -d "bulk[0][pick_state]=trg" \
  -d "bulk[0][pick_country]=MY" \
  -d "bulk[0][send_code]=50000" \
  -d "bulk[0][send_state]=kul" \
  -d "bulk[0][send_country]=MY" \
  -d "bulk[0][weight]=1"

# Expected: ~41 seconds response time (unacceptable)

# Compare with balance check (this responds in <1 second)
time curl -X POST "http://demo.connect.easyparcel.my/?ac=EPCheckCreditBalance" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api=EP-10Fqii5ZP"

# Expected: <1 second response time
```

**Performance Gap:** Rate calculation is **40x slower** than balance check endpoint.

---

## Contact Information

**Development Team:** EcomJRM
**API Account:** EP-10Fqii5ZP
**Environment:** Sandbox
**Date Reported:** 2025-10-12

Please advise on next steps to resolve this blocking issue.

---

**Attachments:**
- Full curl verbose output available upon request
- Network timing logs available upon request
