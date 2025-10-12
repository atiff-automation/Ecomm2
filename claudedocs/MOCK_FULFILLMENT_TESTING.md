# Mock Fulfillment Testing Guide

**PURPOSE**: Test EasyParcel payment validation logic WITHOUT making real API calls or incurring costs

## Overview

The mock fulfillment testing endpoint allows you to verify the payment validation logic works correctly on **production** without spending money on real EasyParcel fulfillments.

### Key Features

✅ **Zero Cost** - No EasyParcel API calls made
✅ **Real Response Data** - Uses actual captured response from order ORD-20251012-NJCX
✅ **Production Testing** - Test on live Railway deployment safely
✅ **Multiple Scenarios** - Test success and failure cases
✅ **Read-Only** - Order is NOT updated in database

## Quick Start

### 1. Get an Order ID

Find any order ID from your database (doesn't need to be PAID status):

```sql
SELECT id, orderNumber, status FROM "Order" LIMIT 5;
```

Example order ID: `cm2vq1k2r000008l5hsqd3rfn`

### 2. Run the Test

```bash
# Test with success response (default)
./scripts/test-mock-fulfillment.sh cm2vq1k2r000008l5hsqd3rfn

# Test with insufficient balance response
./scripts/test-mock-fulfillment.sh cm2vq1k2r000008l5hsqd3rfn insufficient_balance
```

### 3. Check the Result

- ✅ **TEST PASSED** = Validation logic accepted the mock response (fix is working)
- ❌ **TEST FAILED** = Validation logic rejected the mock response (fix not deployed)

## API Endpoint

### Endpoint URL

```
POST /api/admin/orders/[orderId]/fulfill-test
```

### Authentication

Requires admin session (same as regular fulfill endpoint)

### Request Body

```json
{
  "mode": "success" | "insufficient_balance" | "custom",
  "customResponse": {...}  // Optional, only for mode: "custom"
}
```

### Response (Success)

```json
{
  "success": true,
  "message": "Mock fulfillment test passed! Validation logic accepted the response.",
  "test": {
    "mode": "success",
    "orderNumber": "ORD-20251012-XXXX",
    "orderId": "cm2v...",
    "mockEasyParcelOrder": "EI-ZQ932",
    "mockAWB": "631875892940",
    "paymentStatus": "Payment Done"
  },
  "validation": {
    "success": true,
    "data": {
      "order_number": "EI-ZQ932",
      "payment_status": "Payment Done",
      "parcels": [...]
    }
  },
  "note": "This was a TEST - no real API calls made, order NOT updated in database"
}
```

### Response (Failure)

```json
{
  "success": false,
  "message": "Mock fulfillment test failed! Validation logic rejected the response.",
  "test": {
    "mode": "success",
    "orderNumber": "ORD-20251012-XXXX",
    "orderId": "cm2v..."
  },
  "error": "Failed to process order payment",
  "note": "This was a TEST - no real API calls made, order NOT updated in database"
}
```

## Testing Modes

### 1. Success Mode (Default)

Tests with the **real captured response** from order ORD-20251012-NJCX:

```json
{
  "api_status": "Success",
  "error_code": "0",
  "result": [{
    "status": "Success",
    "orderno": "EI-ZQ932",
    "messagenow": "Payment Done",  // ⚠️ NOT "Fully Paid"
    "parcel": [{
      "awb": "631875892940",
      "awb_id_link": "https://...",
      "tracking_url": "https://..."
    }]
  }]
}
```

**Purpose**: Verify the fix accepts `messagenow: "Payment Done"` (the response that originally failed)

### 2. Insufficient Balance Mode

Tests with simulated insufficient balance response:

```json
{
  "api_status": "Success",
  "error_code": "0",
  "result": [{
    "status": "Success",
    "messagenow": "Insufficient Balance",
    "parcel": []  // No AWB = payment failed
  }]
}
```

**Purpose**: Verify the validation correctly rejects when there's no AWB

### 3. Custom Mode

Allows you to inject any custom EasyParcel response:

```bash
curl -X POST http://localhost:3000/api/admin/orders/ORDER_ID/fulfill-test \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "custom",
    "customResponse": {
      "api_status": "Success",
      "error_code": "0",
      "result": [{ ... }]
    }
  }'
```

**Purpose**: Test with future captured responses or edge cases

## Testing on Local vs Production

### Local Testing

```bash
# Default uses http://localhost:3000
./scripts/test-mock-fulfillment.sh ORDER_ID success
```

### Production Testing (Railway)

```bash
# Set BASE_URL to your Railway domain
BASE_URL=https://ecomm2-production.up.railway.app \
  ./scripts/test-mock-fulfillment.sh ORDER_ID success
```

**Note**: You need to be logged in as admin on the production site for this to work.

## Common Use Cases

### Verify Fix is Deployed

After pushing code to Railway:

```bash
# Test on production
BASE_URL=https://ecomm2-production.up.railway.app \
  ./scripts/test-mock-fulfillment.sh cm2vxxxxx success
```

**Expected**: ✅ TEST PASSED (validates "Payment Done" response)

### Test Edge Cases

```bash
# Test insufficient balance handling
./scripts/test-mock-fulfillment.sh cm2vxxxxx insufficient_balance
```

**Expected**: ❌ TEST FAILED (correctly rejects when no AWB)

### Capture and Test New Responses

If you get a new response from production:

1. Copy the response from Railway logs
2. Update `MOCK_SUCCESS_RESPONSE` in `fulfill-test/route.ts`
3. Or use custom mode to test immediately

## Validation Logic

The endpoint uses the **exact same validation logic** as the real fulfillment:

```typescript
// Step 1: Check API status
if (response.api_status !== 'Success' || response.error_code !== '0') {
  throw error;
}

// Step 2: Check bulk result status
const bulkResult = response.result?.[0];
if (!bulkResult || bulkResult.status !== 'Success') {
  throw error;
}

// Step 3: Check for parcel data (CRITICAL)
const parcels = bulkResult.parcel || [];
if (parcels.length === 0) {
  throw error;  // No AWB = payment failed
}

// Step 4: Check messagenow for actual failures only
if (bulkResult.messagenow) {
  const message = bulkResult.messagenow.toLowerCase();
  if (message.includes('insufficient') || message.includes('not enough credit')) {
    throw error;
  }
}

// Success! We have AWB data
return { success: true, data: {...} };
```

## Safety Features

### No API Calls

- ✅ Does NOT call `EasyParcelService.payOrder()`
- ✅ Uses hardcoded mock responses only
- ✅ Zero cost to run unlimited times

### No Database Changes

- ✅ Does NOT update order in database
- ✅ Read-only operation (only verifies order exists)
- ✅ Safe to run on any order, any status

### Admin Only

- ✅ Requires admin authentication
- ✅ Same security as regular fulfill endpoint
- ✅ Cannot be accessed by non-admin users

## Troubleshooting

### "Order not found"

- Check the order ID is correct
- Order ID should be from the `Order` table `id` column (not `orderNumber`)

### "Unauthorized"

- You need to be logged in as admin
- Check your session is valid
- For production, ensure you're authenticated on the Railway domain

### Test passes locally but fails on production

- Railway deployment may not have the latest code yet
- Check Railway dashboard for deployment status
- Verify commit hash matches your local repo

## Examples

### Basic Success Test

```bash
./scripts/test-mock-fulfillment.sh cm2vq1k2r000008l5hsqd3rfn
```

Output:
```
╔════════════════════════════════════════════════════════════╗
║     Mock Fulfillment Test (NO EASYPARCEL API CALLS)       ║
╚════════════════════════════════════════════════════════════╝

Order ID: cm2vq1k2r000008l5hsqd3rfn
Mode: success
Base URL: http://localhost:3000

Sending mock test request...

HTTP Status: 200

{
  "success": true,
  "message": "Mock fulfillment test passed!",
  ...
}

╔════════════════════════════════════════════════════════════╗
║                    ✅ TEST PASSED                          ║
╚════════════════════════════════════════════════════════════╝
The validation logic ACCEPTED the mock response!
This means the fix is working correctly.
```

### Test Insufficient Balance

```bash
./scripts/test-mock-fulfillment.sh cm2vq1k2r000008l5hsqd3rfn insufficient_balance
```

Output:
```
╔════════════════════════════════════════════════════════════╗
║     Mock Fulfillment Test (NO EASYPARCEL API CALLS)       ║
╚════════════════════════════════════════════════════════════╝

...

HTTP Status: 400

{
  "success": false,
  "message": "Mock fulfillment test failed!",
  "error": "No parcel details returned after payment",
  ...
}

╔════════════════════════════════════════════════════════════╗
║                    ❌ REQUEST FAILED                       ║
╚════════════════════════════════════════════════════════════╝
HTTP 400 - Check error message above
```

This is **expected** - the validation correctly rejected a response with no AWB!

## Next Steps

After running mock tests:

1. **If tests pass locally**: Deploy to Railway and test again
2. **If tests pass on Railway**: The fix is deployed correctly, safe to use real fulfillment
3. **If tests fail**: Check validation logic in `easyparcel-service.ts` lines 495-518

## Related Files

- **API Endpoint**: `src/app/api/admin/orders/[orderId]/fulfill-test/route.ts`
- **Test Script**: `scripts/test-mock-fulfillment.sh`
- **Validation Logic**: `src/lib/shipping/easyparcel-service.ts` (lines 495-518)
- **Real Fulfillment**: `src/app/api/admin/orders/[orderId]/fulfill/route.ts`

## Version History

- **2025-10-12**: Initial implementation with real captured response from ORD-20251012-NJCX
