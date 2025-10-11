# EasyParcel Fulfillment Debugging Guide

**CRITICAL**: This guide helps debug EasyParcel fulfillment issues WITHOUT costing additional money. Follow these procedures to capture and analyze API responses.

## Issue Summary

### Problem Fixed (2025-10-12)
- **Root Cause**: Overly strict validation on `messagenow` field rejected successful payments
- **Impact**: EasyParcel created fulfillments but our system rejected them, causing:
  - Orders stuck in PAID status instead of READY_TO_SHIP
  - Financial risk: Fulfillments created but not tracked
  - Customer service issues: Tracking numbers not captured
- **Fix Location**: `src/lib/shipping/easyparcel-service.ts:487-518`
- **Fix**: Changed validation to check for `parcel` data presence first, only reject on actual failures

## Logging System

### Automatic Logging (Now Active)

All fulfillment operations now automatically log to:

1. **Railway Logs** (stdout/stderr)
   - View in Railway dashboard → Deployments → Logs
   - Filter by `[EasyParcel]` or `[Fulfillment]`
   - Logs persist for 7 days on Railway

2. **Order Flow Logger** (`src/lib/monitoring/order-flow-logger.ts`)
   - Structured logging with timestamps
   - Captures request/response pairs
   - Includes error details with context

### Logging Locations

#### 1. EasyParcel Service (`src/lib/monitoring/easyparcel-logger.ts`)

**Logs Captured:**
- Rate checking (EPRateCheckingBulk)
- Shipment creation (EPSubmitOrderBulk)
- Payment processing (EPPayOrderBulk) - **EXACT API RESPONSE**
- Balance checking (EPCheckCreditBalance)
- Tracking updates (EPTrackingBulk)

**Example Output:**
```
[EasyParcel: Payment Response (EXACT FROM API)]
{
  "success": true,
  "rawResponse": { ... },  // Complete API response
  "orderNumber": "EI-XXXXX",
  "paymentStatus": "Fully Paid",
  "parcelCount": 1,
  "parcels": [{
    "parcelno": "EP-XXXXX",
    "awb": "JT123456789",
    "awb_id_link": "https://...",
    "tracking_url": "https://...",
    "hasAwb": true,
    "hasAwbLink": true,
    "hasTrackingUrl": true
  }]
}
```

#### 2. Fulfillment Route (`src/app/api/admin/orders/[orderId]/fulfill/route.ts`)

**Logs Captured:**
- Fulfillment initiation with order details
- Shipment creation response
- Payment processing response
- Order update confirmation
- Final fulfillment completion

### How to View Logs

#### Railway (Production/Staging)
```bash
# View logs in real-time
1. Go to Railway dashboard
2. Select your service
3. Click "Deployments" tab
4. Click on latest deployment
5. Click "View Logs"
6. Filter logs:
   - Search for: [EasyParcel]
   - Search for: [Fulfillment]
   - Search for: Payment Response (EXACT FROM API)
```

#### Local Development
Logs appear in terminal where `npm run dev` is running. Look for:
- `[EasyParcel: Payment Response (EXACT FROM API)]` - Payment details
- `[Fulfillment: Complete]` - Fulfillment summary
- `rawResponse` - Complete API response object

## Debugging Procedures

### Procedure 1: Investigate Failed Fulfillment

**When to Use**: Fulfillment fails or order stuck in PAID status

**Steps:**
1. **Check Railway Logs**
   ```
   Filter: [Fulfillment]
   Look for: "Payment error" or "Fulfillment error"
   ```

2. **Find the Order Details**
   ```
   Search for: order ID or order number
   ```

3. **Locate EasyParcel Responses**
   ```
   Look for:
   - [EasyParcel: Shipment Response]
   - [EasyParcel: Payment Response (EXACT FROM API)]
   ```

4. **Analyze Response Structure**
   ```json
   Check these fields:
   - api_status: Should be "Success"
   - error_code: Should be "0"
   - result[0].status: Should be "Success"
   - result[0].parcel: Should have array with awb data
   - result[0].messagenow: Informational only, not critical
   ```

5. **Check Database State**
   ```sql
   -- Via Prisma Studio or psql
   SELECT
     id, orderNumber, status,
     trackingNumber, airwayBillNumber,
     easyparcelOrderNumber, easyparcelPaymentStatus,
     failedBookingAttempts, lastBookingError
   FROM "Order"
   WHERE id = 'YOUR_ORDER_ID';
   ```

### Procedure 2: Verify Successful Fulfillment

**When to Use**: Confirm fulfillment completed correctly

**Steps:**
1. **Check Logs for Success Markers**
   ```
   Search for:
   - "✅ Payment processed - AWB generated"
   - "✅ Fulfillment completed successfully"
   ```

2. **Verify Data Captured**
   ```
   Look for these in logs:
   - trackingNumber: JT123456789 (courier AWB)
   - awbNumber: JT123456789 (same as tracking)
   - easyparcelOrderNumber: EI-XXXXX
   - easyparcelPaymentStatus: "Fully Paid"
   ```

3. **Cross-Reference with WhatsApp**
   ```
   - Did customer receive WhatsApp tracking notification?
   - Does tracking number match what's in database?
   ```

### Procedure 3: Cost-Free Testing

**IMPORTANT**: Never test with real fulfillments to avoid charges!

**Safe Testing Methods:**
1. **Sandbox Environment**
   ```
   Use EasyParcel sandbox API for testing
   No real charges, no real fulfillments
   ```

2. **Log Analysis Only**
   ```
   Review existing logs from real fulfillments
   Don't trigger new fulfillments for debugging
   ```

3. **Mock Testing**
   ```
   Create test scripts that simulate API responses
   Test validation logic without API calls
   ```

## Common Issues & Solutions

### Issue 1: "Payment failed: Failed to process order payment"

**Symptoms:**
- Order stuck in PAID status
- EasyParcel created fulfillment (WhatsApp sent)
- Error in Railway logs

**Root Cause:**
- `messagenow` field validation was too strict
- Field value wasn't exactly "Fully Paid"

**Solution Applied:**
- Changed validation in `easyparcel-service.ts:487-518`
- Now checks for `parcel` array presence first
- Only rejects on actual failures (insufficient balance)

**Verification:**
```typescript
// OLD CODE (WRONG)
if (bulkResult.messagenow !== 'Fully Paid') {
  throw error; // Too strict!
}

// NEW CODE (CORRECT)
const parcels = bulkResult.parcel || [];
if (parcels.length === 0) {
  throw error; // Real failure: no parcels
}
// If we have parcels, payment succeeded ✅
```

### Issue 2: Missing AWB Details

**Symptoms:**
- Order shows READY_TO_SHIP
- trackingNumber or airwayBillNumber is null

**Debug Steps:**
1. Check payment response in logs
2. Verify `result[0].parcel` array exists
3. Check `awb` field in parcel object

**Common Causes:**
- Payment didn't complete (insufficient balance)
- API response structure changed
- Network timeout during payment

### Issue 3: Duplicate Fulfillments

**Symptoms:**
- Multiple charges for same order
- Multiple EasyParcel order IDs

**Prevention:**
- Check `order.trackingNumber` and `order.airwayBillNumber` before fulfilling
- Route already validates this at line 127-141

**If It Happens:**
1. Contact EasyParcel support to void duplicate
2. Check database for duplicate entries
3. Review logs for retry attempts

## Critical Fields Reference

### EasyParcel API Response Structure

#### EPSubmitOrderBulk (Shipment Creation)
```json
{
  "api_status": "Success",
  "error_code": "0",
  "result": [{
    "status": "Success",
    "order_number": "EI-XXXXX",  // Use for payment
    "parcel_number": "EP-XXXXX",
    "courier": "J&T Express",
    "price": "5.50"
  }]
}
```

#### EPPayOrderBulk (Payment Processing)
```json
{
  "api_status": "Success",
  "error_code": "0",
  "result": [{
    "status": "Success",
    "orderno": "EI-XXXXX",
    "messagenow": "Fully Paid",  // Can vary!
    "parcel": [{  // THIS IS THE SUCCESS INDICATOR
      "parcelno": "EP-XXXXX",
      "awb": "JT123456789",  // Courier tracking number
      "awb_id_link": "https://...",  // AWB PDF
      "tracking_url": "https://..."  // Tracking page
    }]
  }]
}
```

### Database Fields

**Order Model:**
- `trackingNumber`: Courier AWB (e.g., JT123456789)
- `airwayBillNumber`: Same as trackingNumber
- `airwayBillUrl`: PDF label link
- `trackingUrl`: Tracking page URL
- `easyparcelOrderNumber`: EasyParcel order ID (EI-XXXXX)
- `easyparcelPaymentStatus`: Payment status from API
- `easyparcelParcelNumber`: Parcel ID (EP-XXXXX)
- `shippingCostCharged`: Actual cost from shipment creation
- `failedBookingAttempts`: Counter for failed attempts
- `lastBookingError`: Last error message

## Emergency Procedures

### If You See Fulfillment Issues in Production

1. **DO NOT retry fulfillment repeatedly**
   - Each retry costs money if it partially succeeds
   - Check logs first

2. **Check if fulfillment actually succeeded**
   - Look for WhatsApp notification to customer
   - Check EasyParcel dashboard
   - Search logs for "Payment processed"

3. **If fulfillment succeeded but not recorded**
   - Note the EasyParcel order number from WhatsApp/email
   - Manually update database:
   ```sql
   UPDATE "Order"
   SET
     status = 'READY_TO_SHIP',
     trackingNumber = 'AWB_FROM_WHATSAPP',
     airwayBillNumber = 'AWB_FROM_WHATSAPP',
     easyparcelOrderNumber = 'EI_FROM_WHATSAPP',
     airwayBillGenerated = true,
     airwayBillGeneratedAt = NOW()
   WHERE orderNumber = 'YOUR_ORDER_NUMBER';
   ```

4. **Report to development**
   - Copy exact error from Railway logs
   - Include order ID
   - Include EasyParcel order number if available

## Monitoring & Alerts

### What to Monitor

1. **Failed Fulfillment Rate**
   - Normal: <1%
   - Alert if: >5%
   - Check: `failedBookingAttempts` field

2. **Payment Errors**
   - Search logs for: "Payment error"
   - Should be rare (<0.1%)

3. **Stuck Orders**
   - Orders in PAID status >24 hours
   - May indicate fulfillment issues

### Health Checks

Run weekly:
```sql
-- Orders stuck in PAID with old timestamps
SELECT id, orderNumber, status, createdAt, failedBookingAttempts
FROM "Order"
WHERE status = 'PAID'
  AND createdAt < NOW() - INTERVAL '24 hours'
ORDER BY createdAt DESC;

-- Recent fulfillment failures
SELECT id, orderNumber, failedBookingAttempts, lastBookingError
FROM "Order"
WHERE failedBookingAttempts > 0
ORDER BY updatedAt DESC
LIMIT 20;
```

## Log Retention

- **Railway Logs**: 7 days
- **Database errors**: Permanent (`lastBookingError` field)
- **Order history**: Permanent (audit trail)

## Contact Points

If debugging reveals systemic issues:

1. **EasyParcel Support**: support@easyparcel.com
   - Provide EasyParcel order number (EI-XXXXX)
   - Include timestamp
   - Attach relevant log excerpts

2. **Development Team**
   - Include this debugging guide reference
   - Provide Railway log links
   - Include database state screenshots

## Version History

- **2025-10-12**: Fixed payment validation bug, added comprehensive logging
- **Initial**: Basic fulfillment implementation
