# Manual Testing Guide with Automated Monitoring
**Cost-Effective Testing Strategy for Order Flow**

## Overview

This guide provides a **manual testing approach** with **automated monitoring and logging** to validate your order flow without burning through EasyParcel credits.

**Strategy:**
- ✅ Manual order creation and fulfillment
- ✅ Automated payload logging and validation
- ✅ Real-time error tracking
- ✅ Step-by-step verification checklist
- ✅ Minimal EasyParcel credit usage

---

## Table of Contents

1. [Setup Monitoring Tools](#setup-monitoring-tools)
2. [Manual Testing Workflow](#manual-testing-workflow)
3. [Monitoring Dashboard](#monitoring-dashboard)
4. [Payload Inspection](#payload-inspection)
5. [Error Tracking](#error-tracking)
6. [Testing Checklist](#testing-checklist)

---

## Setup Monitoring Tools

### 1. Enable Debug Logging

**File:** `src/lib/monitoring/order-flow-logger.ts`

```typescript
/**
 * Order Flow Debug Logger
 * Logs all API calls, payloads, and responses for manual testing
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOG_DIR = join(process.cwd(), 'logs', 'order-flow');
const SESSION_FILE = join(LOG_DIR, `session-${Date.now()}.log`);

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

export interface LogEntry {
  timestamp: string;
  step: string;
  type: 'REQUEST' | 'RESPONSE' | 'ERROR' | 'INFO';
  data: any;
  orderNumber?: string;
  orderId?: string;
}

class OrderFlowLogger {
  private sessionId: string;
  private logs: LogEntry[] = [];

  constructor() {
    this.sessionId = `SESSION-${Date.now()}`;
    this.log('INFO', 'Session Started', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log API request
   */
  logRequest(step: string, endpoint: string, payload: any, orderId?: string) {
    this.log('REQUEST', step, {
      endpoint,
      payload: this.sanitizePayload(payload),
      orderId
    });
  }

  /**
   * Log API response
   */
  logResponse(step: string, endpoint: string, response: any, orderId?: string) {
    this.log('RESPONSE', step, {
      endpoint,
      response: this.sanitizePayload(response),
      orderId
    });
  }

  /**
   * Log error
   */
  logError(step: string, error: any, context?: any) {
    this.log('ERROR', step, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      context
    });
  }

  /**
   * Log info
   */
  logInfo(step: string, message: string, data?: any) {
    this.log('INFO', step, { message, ...data });
  }

  /**
   * Core logging function
   */
  private log(type: LogEntry['type'], step: string, data: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      step,
      type,
      data,
      orderNumber: data?.orderNumber || data?.orderId
    };

    this.logs.push(entry);

    // Console output with color coding
    const color = {
      REQUEST: '\x1b[36m', // Cyan
      RESPONSE: '\x1b[32m', // Green
      ERROR: '\x1b[31m',    // Red
      INFO: '\x1b[33m'      // Yellow
    }[type];

    console.log(`${color}[${type}]\x1b[0m ${step}`);
    console.log(JSON.stringify(data, null, 2));
    console.log('---');

    // Write to file
    this.writeToFile(entry);
  }

  /**
   * Write log entry to file
   */
  private writeToFile(entry: LogEntry) {
    const logLine = JSON.stringify(entry) + '\n';
    appendFileSync(SESSION_FILE, logLine);
  }

  /**
   * Sanitize sensitive data from payloads
   */
  private sanitizePayload(payload: any): any {
    if (!payload) return payload;

    const sanitized = { ...payload };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'apiKey',
      'api_key',
      'token',
      'secret',
      'creditCard',
      'cvv'
    ];

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      const sanitizedObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitizedObj[key] = '***REDACTED***';
        } else {
          sanitizedObj[key] = sanitizeObject(value);
        }
      }
      return sanitizedObj;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Generate summary report
   */
  generateSummary() {
    const summary = {
      sessionId: this.sessionId,
      totalLogs: this.logs.length,
      requests: this.logs.filter(l => l.type === 'REQUEST').length,
      responses: this.logs.filter(l => l.type === 'RESPONSE').length,
      errors: this.logs.filter(l => l.type === 'ERROR').length,
      steps: [...new Set(this.logs.map(l => l.step))],
      errorSteps: this.logs
        .filter(l => l.type === 'ERROR')
        .map(l => ({ step: l.step, error: l.data }))
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 SESSION SUMMARY');
    console.log('='.repeat(60));
    console.log(JSON.stringify(summary, null, 2));
    console.log('='.repeat(60));

    // Write summary file
    const summaryFile = join(LOG_DIR, `summary-${Date.now()}.json`);
    writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    return summary;
  }

  /**
   * Export logs as JSON
   */
  exportLogs(filename?: string) {
    const file = filename || join(LOG_DIR, `export-${Date.now()}.json`);
    writeFileSync(file, JSON.stringify(this.logs, null, 2));
    console.log(`✅ Logs exported to: ${file}`);
    return file;
  }
}

// Singleton instance
export const orderFlowLogger = new OrderFlowLogger();
```

### 2. Integrate Logger into APIs

**File:** `src/lib/monitoring/api-logger-middleware.ts`

```typescript
import { orderFlowLogger } from './order-flow-logger';

/**
 * Wrap API routes with logging
 */
export function withOrderFlowLogging(
  handler: Function,
  step: string
) {
  return async (req: any, res: any, ...args: any[]) => {
    const orderId = req.params?.orderId || req.body?.orderId;

    // Log request
    orderFlowLogger.logRequest(step, req.url, {
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    }, orderId);

    try {
      const result = await handler(req, res, ...args);

      // Log response
      if (result?.json) {
        const data = await result.json();
        orderFlowLogger.logResponse(step, req.url, data, orderId);
      }

      return result;
    } catch (error) {
      // Log error
      orderFlowLogger.logError(step, error, {
        url: req.url,
        method: req.method,
        orderId
      });
      throw error;
    }
  };
}
```

### 3. EasyParcel API Logger

**File:** `src/lib/shipping/easyparcel-logger.ts`

```typescript
import { orderFlowLogger } from '../monitoring/order-flow-logger';

/**
 * Wraps EasyParcel service with detailed logging
 */
export function createLoggedEasyParcelService(settings: any) {
  const service = createEasyParcelService(settings);

  return {
    async getRates(pickup: any, delivery: any, weight: number) {
      orderFlowLogger.logInfo('EasyParcel: Rate Checking', 'Starting rate check', {
        pickup: pickup.postalCode,
        delivery: delivery.postalCode,
        weight
      });

      orderFlowLogger.logRequest('EasyParcel: Rate Request', '/EPRateCheckingBulk', {
        pickup,
        delivery,
        weight
      });

      try {
        const rates = await service.getRates(pickup, delivery, weight);

        orderFlowLogger.logResponse('EasyParcel: Rate Response', '/EPRateCheckingBulk', {
          ratesCount: rates.length,
          rates: rates.map(r => ({
            courier: r.courier_name,
            service: r.service_name,
            price: r.price,
            delivery: r.estimated_delivery_days
          }))
        });

        return rates;
      } catch (error) {
        orderFlowLogger.logError('EasyParcel: Rate Check Failed', error, {
          pickup,
          delivery,
          weight
        });
        throw error;
      }
    },

    async createShipment(request: any) {
      orderFlowLogger.logInfo('EasyParcel: Shipment Booking', '⚠️ PAID OPERATION - Creating shipment');

      orderFlowLogger.logRequest('EasyParcel: Shipment Request', '/EPMakeOrderBulk', request);

      try {
        const result = await service.createShipment(request);

        orderFlowLogger.logResponse('EasyParcel: Shipment Response', '/EPMakeOrderBulk', {
          shipmentId: result.data.shipment_id,
          trackingNumber: result.data.tracking_number,
          awbNumber: result.data.awb_number,
          labelUrl: result.data.label_url,
          estimatedCost: result.data.price
        });

        orderFlowLogger.logInfo('EasyParcel: Shipment Created', '💰 Credits deducted', {
          trackingNumber: result.data.tracking_number,
          cost: result.data.price
        });

        return result;
      } catch (error) {
        orderFlowLogger.logError('EasyParcel: Shipment Booking Failed', error, {
          request
        });
        throw error;
      }
    },

    async getBalance() {
      orderFlowLogger.logInfo('EasyParcel: Balance Check', 'Checking account balance');

      try {
        const result = await service.getBalance();

        orderFlowLogger.logResponse('EasyParcel: Balance', '/EPCheckCreditBalance', {
          balance: result.data.balance,
          currency: result.data.currency
        });

        return result;
      } catch (error) {
        orderFlowLogger.logError('EasyParcel: Balance Check Failed', error);
        throw error;
      }
    }
  };
}
```

---

## Manual Testing Workflow

### Pre-Testing Checklist

```bash
# 1. Check EasyParcel balance
curl http://localhost:3000/api/admin/shipping/balance

# 2. Start development server with logging enabled
DEBUG=order-flow npm run dev

# 3. Open browser console (F12)
# 4. Have this checklist ready
```

### Step-by-Step Manual Test

#### **Test 1: Order Creation (FREE - No EasyParcel cost)**

**Actions:**
1. Open browser → http://localhost:3000
2. Add product to cart
3. Go to checkout
4. Fill shipping address:
   ```
   Name: Test Customer
   Address: 123 Jalan Test
   City: Kuala Lumpur
   State: Selangor
   Postcode: 50000
   Phone: +60123456789
   Email: test@example.com
   ```
5. Wait for shipping rates to load (watch console)
6. Select shipping method
7. Select payment method: ToyyibPay
8. Click "Place Order"

**What to Monitor:**

✅ **Browser Console:**
```
[REQUEST] Checkout: Create Order
{
  "cartItems": [...],
  "shippingAddress": {...},
  "selectedShipping": {
    "serviceId": "...",
    "courierName": "Pos Laju",
    "cost": 15.00
  }
}

[RESPONSE] Order Created
{
  "orderId": "...",
  "orderNumber": "ORD-20251010-XXXX",
  "status": "PENDING"
}
```

✅ **Server Logs:**
```
[INFO] Order: Creating order
[REQUEST] POST /api/orders
[RESPONSE] Order created: ORD-20251010-XXXX
```

✅ **Database Check:**
```bash
# Verify order stored correctly
npx prisma studio
# Check Orders table → Find your order → Verify:
# - selectedCourierServiceId exists
# - shippingWeight stored
# - courierName stored
```

**Validation Points:**
- ✅ Order number generated
- ✅ Shipping data saved (serviceId, courierName, weight)
- ✅ Status is PENDING
- ✅ Payment status is PENDING
- ✅ No errors in console

---

#### **Test 2: Shipping Rate Calculation (FREE - No cost)**

**Actions:**
1. During checkout, enter different postcodes
2. Watch shipping rates update

**What to Monitor:**

✅ **Browser Network Tab:**
```
POST /api/shipping/calculate
Request:
{
  "pickup": { "postalCode": "50000", "state": "Selangor" },
  "delivery": { "postalCode": "93000", "state": "Sarawak" },
  "weight": 1.5
}

Response:
{
  "rates": [
    {
      "serviceId": "...",
      "courierName": "Pos Laju",
      "price": 25.00,
      "delivery": "3-4 days"
    }
  ]
}
```

✅ **Server Logs:**
```
[REQUEST] EasyParcel: Rate Request
{
  "pickup": "50000",
  "delivery": "93000",
  "weight": 1.5
}

[RESPONSE] EasyParcel: Rate Response
{
  "ratesCount": 5,
  "rates": [...]
}
```

**Validation Points:**
- ✅ Multiple shipping options displayed
- ✅ Prices vary by postcode
- ✅ Delivery estimates shown
- ✅ No errors from EasyParcel API

---

#### **Test 3: Payment Webhook (FREE - Simulate locally)**

**Actions:**
1. After order created, note order number
2. Use webhook simulator:

```bash
# Simulate successful payment
curl -X POST http://localhost:3000/api/webhooks/toyyibpay \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "refno=REF123" \
  -d "status=1" \
  -d "billcode=BILL123" \
  -d "order_id=ORD-20251010-XXXX" \
  -d "amount=16500" \
  -d "transaction_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

**What to Monitor:**

✅ **Server Logs:**
```
[REQUEST] Webhook: Payment received
{
  "status": "1",
  "orderNumber": "ORD-20251010-XXXX",
  "amount": "16500"
}

[INFO] Payment: Processing successful payment
[INFO] Inventory: Reserving stock
[INFO] Membership: Checking activation
[RESPONSE] Webhook: Order updated to CONFIRMED
```

✅ **Database Check:**
```bash
# Verify in Prisma Studio:
# - status changed to CONFIRMED
# - paymentStatus changed to PAID
# - inventory decremented
# - membership activated (if applicable)
```

**Validation Points:**
- ✅ Order status → CONFIRMED
- ✅ Payment status → PAID
- ✅ Inventory reserved
- ✅ Audit log created

---

#### **Test 4: Fulfillment (⚠️ PAID - Costs EasyParcel credits)**

**Pre-check:**
```bash
# Check balance first
curl http://localhost:3000/api/admin/shipping/balance
# Response: { "balance": 45.50 }

# Only proceed if balance > RM 20
```

**Actions:**
1. Login as admin
2. Go to Orders → Processing tab
3. Click on order: ORD-20251010-XXXX
4. Click "Fulfill Order"
5. Select pickup date: Tomorrow
6. **PAUSE HERE** → Review logs before clicking "Book Shipment"

**Review Before Submitting:**

✅ **Check Fulfillment Payload (will be logged):**
```javascript
// This is what will be sent to EasyParcel
{
  "serviceId": "...",
  "reference": "ORD-20251010-XXXX",
  "pickup": {
    "name": "Your Business",
    "phone": "+60123456789",
    "address": "...",
    "postalCode": "50000"
  },
  "delivery": {
    "name": "Test Customer",
    "phone": "+60123456789",
    "address": "123 Jalan Test",
    "postalCode": "50000"
  },
  "parcel": {
    "weight": 1.5
  }
}
```

**If payload looks correct → Click "Book Shipment"**

**What to Monitor:**

✅ **Server Logs:**
```
[INFO] Fulfillment: Starting fulfillment for ORD-20251010-XXXX
[REQUEST] EasyParcel: Shipment Request
⚠️ PAID OPERATION - Creating shipment
{
  "serviceId": "...",
  "reference": "ORD-20251010-XXXX",
  ...
}

[RESPONSE] EasyParcel: Shipment Response
{
  "shipmentId": "SHIP123",
  "trackingNumber": "TRACK123456",
  "awbNumber": "AWB123456",
  "estimatedCost": "15.00"
}

💰 Credits deducted
[INFO] Fulfillment: Order updated to READY_TO_SHIP
```

✅ **Database Check:**
```bash
# Verify in Prisma Studio:
# - status: READY_TO_SHIP
# - trackingNumber: TRACK123456
# - airwayBillNumber: AWB123456
# - airwayBillUrl: https://...
```

**Validation Points:**
- ✅ Tracking number received
- ✅ AWB PDF generated
- ✅ Order status updated
- ✅ Customer email sent
- ✅ Expected credit deduction

---

## Monitoring Dashboard

### Real-time Log Viewer

**Create:** `scripts/view-logs.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const LOG_DIR = path.join(process.cwd(), 'logs', 'order-flow');

// Get latest session log
const files = fs.readdirSync(LOG_DIR)
  .filter(f => f.startsWith('session-'))
  .sort()
  .reverse();

if (files.length === 0) {
  console.log('No log files found');
  process.exit(1);
}

const latestLog = path.join(LOG_DIR, files[0]);

console.log(`📊 Watching log file: ${latestLog}\n`);

// Tail the log file
exec(`tail -f ${latestLog}`, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(stdout);
});
```

**Usage:**
```bash
# Watch logs in real-time
node scripts/view-logs.js

# Or add to package.json:
"scripts": {
  "logs:watch": "node scripts/view-logs.js"
}

npm run logs:watch
```

### Log Analysis Tool

**Create:** `scripts/analyze-logs.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(process.cwd(), 'logs', 'order-flow');

function analyzeLogs(sessionFile) {
  const logs = fs.readFileSync(sessionFile, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));

  const analysis = {
    totalEntries: logs.length,
    byType: {},
    byStep: {},
    errors: [],
    requests: [],
    responses: [],
    timeline: []
  };

  logs.forEach(log => {
    // Count by type
    analysis.byType[log.type] = (analysis.byType[log.type] || 0) + 1;

    // Count by step
    analysis.byStep[log.step] = (analysis.byStep[log.step] || 0) + 1;

    // Collect errors
    if (log.type === 'ERROR') {
      analysis.errors.push({
        step: log.step,
        timestamp: log.timestamp,
        error: log.data.error
      });
    }

    // Collect requests
    if (log.type === 'REQUEST') {
      analysis.requests.push({
        step: log.step,
        timestamp: log.timestamp,
        endpoint: log.data.endpoint
      });
    }

    // Collect responses
    if (log.type === 'RESPONSE') {
      analysis.responses.push({
        step: log.step,
        timestamp: log.timestamp,
        endpoint: log.data.endpoint
      });
    }

    // Timeline
    analysis.timeline.push({
      time: log.timestamp,
      type: log.type,
      step: log.step
    });
  });

  return analysis;
}

// Get latest session
const files = fs.readdirSync(LOG_DIR)
  .filter(f => f.startsWith('session-'))
  .sort()
  .reverse();

const latestLog = path.join(LOG_DIR, files[0]);
const analysis = analyzeLogs(latestLog);

console.log('📊 LOG ANALYSIS REPORT');
console.log('='.repeat(60));
console.log(`Total Entries: ${analysis.totalEntries}`);
console.log('\nBy Type:');
console.log(analysis.byType);
console.log('\nBy Step:');
console.log(analysis.byStep);

if (analysis.errors.length > 0) {
  console.log('\n❌ ERRORS:');
  analysis.errors.forEach(err => {
    console.log(`  [${err.timestamp}] ${err.step}`);
    console.log(`  ${err.error.message}`);
  });
}

console.log('\n✅ Request/Response Pairs:');
analysis.requests.forEach((req, i) => {
  const res = analysis.responses.find(r =>
    r.step === req.step && r.timestamp > req.timestamp
  );
  console.log(`  ${req.step}: ${res ? '✓' : '✗'}`);
});

console.log('='.repeat(60));
```

---

## Payload Inspection

### Browser DevTools Network Monitor

**Setup:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter: `Fetch/XHR`
4. Check "Preserve log"

**During testing, inspect:**

**Order Creation:**
```
POST /api/orders
Status: 201 Created

Request Payload:
{
  "cartItems": [...],
  "shippingAddress": {...},
  "selectedShipping": {
    "serviceId": "service-123",  ← Should match EasyParcel service
    "courierName": "Pos Laju",    ← Should be stored in order
    "cost": 15.00,                 ← Should match final shipping cost
    "weight": 1.5                  ← Should match calculated weight
  }
}

Response:
{
  "order": {
    "id": "...",
    "orderNumber": "ORD-...",
    "selectedCourierServiceId": "service-123",  ← Verify this matches
    "shippingWeight": 1.5                        ← Verify this matches
  }
}
```

**Fulfillment:**
```
POST /api/admin/orders/[id]/fulfill
Status: 200 OK

Request:
{
  "serviceId": "service-123",  ← Should match order.selectedCourierServiceId
  "pickupDate": "2025-10-11"
}

Response:
{
  "tracking": {
    "trackingNumber": "TRACK123456",
    "awbNumber": "AWB123456",
    "labelUrl": "https://..."
  }
}
```

### API Response Validator

**Create:** `src/lib/testing/response-validator.ts`

```typescript
/**
 * Validates API responses match expected schema
 */

export function validateOrderResponse(response: any) {
  const required = [
    'id',
    'orderNumber',
    'status',
    'paymentStatus',
    'selectedCourierServiceId',
    'shippingWeight',
    'courierName'
  ];

  const missing = required.filter(field => !response[field]);

  if (missing.length > 0) {
    console.error('❌ Missing required fields:', missing);
    return false;
  }

  console.log('✅ Order response valid');
  return true;
}

export function validateFulfillmentResponse(response: any) {
  const required = [
    'tracking.trackingNumber',
    'tracking.awbNumber',
    'tracking.labelUrl'
  ];

  const missing = required.filter(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], response);
    return !value;
  });

  if (missing.length > 0) {
    console.error('❌ Missing required fields:', missing);
    return false;
  }

  console.log('✅ Fulfillment response valid');
  return true;
}
```

---

## Error Tracking

### Common Issues Checklist

**Issue 1: serviceId Mismatch**
```
Symptom: Fulfillment fails with "Invalid service ID"

Check:
1. Browser Network → Order creation response
   → Verify: order.selectedCourierServiceId exists
2. Admin panel → Order details
   → Verify: Service ID is displayed
3. Fulfillment request
   → Verify: serviceId matches order.selectedCourierServiceId

Fix: Ensure checkout correctly stores serviceId from selectedShipping
```

**Issue 2: Weight Not Stored**
```
Symptom: Fulfillment fails with "Invalid weight"

Check:
1. Order creation → Verify shippingWeight in response
2. Database → orders.shippingWeight should be > 0
3. Fulfillment request → Verify weight is sent

Fix: Ensure weight calculation in checkout
```

**Issue 3: EasyParcel API Error**
```
Symptom: Rate check or shipment fails

Check Server Logs:
[ERROR] EasyParcel: Rate Check Failed
{
  "error": {
    "message": "...",
    "api_status": "Failed",
    "error_code": "123"
  }
}

Common errors:
- Invalid postcode: Check address format
- Insufficient balance: Top up credits
- Service unavailable: Try again later
```

---

## Testing Checklist

### Order Creation Test ✅

```
□ Product added to cart
□ Checkout page loads
□ Shipping address filled
□ Shipping rates displayed (from EasyParcel)
□ Shipping option selected
□ Payment method selected
□ Order created successfully
□ Order number generated
□ Database: Order stored
□ Database: selectedCourierServiceId stored
□ Database: shippingWeight stored
□ Database: courierName stored
□ Logs: No errors
```

### Payment Webhook Test ✅

```
□ Order status: PENDING → CONFIRMED
□ Payment status: PENDING → PAID
□ Inventory: Stock decremented
□ Membership: Activated (if applicable)
□ Audit log: Created
□ Logs: No errors
```

### Fulfillment Test (⚠️ Uses Credits) ✅

```
Pre-flight:
□ EasyParcel balance checked (> RM 20)
□ Order status: CONFIRMED
□ Payment status: PAID
□ ServiceId matches order.selectedCourierServiceId
□ Weight matches order.shippingWeight

Execution:
□ Admin logged in
□ Order found in Processing tab
□ Fulfill dialog opened
□ Pickup date selected
□ Payload reviewed (console logs)
□ Book Shipment clicked

Validation:
□ Success message displayed
□ Tracking number shown
□ AWB link available
□ Database: status = READY_TO_SHIP
□ Database: trackingNumber stored
□ Database: airwayBillNumber stored
□ Database: airwayBillUrl stored
□ Email sent to customer
□ Logs: No errors
□ EasyParcel: Credits deducted
```

### End-to-End Verification ✅

```
□ Customer receives order confirmation email
□ Customer receives shipping notification email
□ Admin can download AWB PDF
□ Tracking number works on courier website
□ All data flows correctly: Checkout → DB → EasyParcel
□ No data mismatches
□ No missing fields
□ Total cost: < RM 20 per test run
```

---

## Quick Test Commands

```bash
# 1. Start dev server with logging
DEBUG=order-flow npm run dev

# 2. Watch logs in another terminal
npm run logs:watch

# 3. After testing, analyze logs
node scripts/analyze-logs.js

# 4. Export logs for review
node scripts/export-logs.js

# 5. Check EasyParcel balance
curl http://localhost:3000/api/admin/shipping/balance
```

---

## Tips for Cost-Effective Testing

✅ **DO:**
1. Test rate checking extensively (FREE)
2. Test order creation multiple times (FREE)
3. Test payment webhooks locally (FREE)
4. Review all logs before fulfillment (FREE)
5. Only book shipment when confident (PAID)

❌ **DON'T:**
1. Book shipments repeatedly
2. Test with expensive couriers
3. Test fulfillment in automated CI/CD
4. Skip log review before booking
5. Test without checking balance first

---

## Document Version

**Version:** 1.0
**Last Updated:** 2025-10-10
**Status:** Complete ✅
