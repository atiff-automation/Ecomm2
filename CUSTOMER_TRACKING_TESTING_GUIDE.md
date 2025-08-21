# 🧪 Customer Tracking Testing Guide

**Project:** EcomJRM Customer Tracking System  
**Version:** 1.0  
**Date:** August 21, 2025  
**Status:** 🔍 Testing Ready

---

## 📋 Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Environment Configuration](#environment-configuration)
3. [Manual Testing Scenarios](#manual-testing-scenarios)
4. [API Testing](#api-testing)
5. [Security Testing](#security-testing)
6. [Performance Testing](#performance-testing)
7. [Browser & Device Testing](#browser--device-testing)
8. [Error Scenarios](#error-scenarios)
9. [Test Data Setup](#test-data-setup)
10. [Automated Testing](#automated-testing)

---

## 🔧 Pre-Testing Setup

### ✅ Required Services

1. **Development Server Running**
   ```bash
   npm run dev
   # Server should be running at http://localhost:3000
   ```

2. **Database Connection**
   - Ensure PostgreSQL is running
   - Database contains test orders with shipments
   - Prisma migrations are up to date

3. **Environment Variables**
   ```bash
   # Check these are set in .env.local
   NEXTAUTH_SECRET=your-secret
   DATABASE_URL=your-db-url
   EASYPARCEL_API_KEY=your-api-key
   ```

### 🗃️ Test Database Setup

1. **Create Test Orders** (if not existing)
   ```sql
   -- Create test logged-in customer order
   INSERT INTO "Order" (id, orderNumber, userId, status, total, createdAt) 
   VALUES ('test-order-1', 'ORD-20250821-TEST', 'test-user-id', 'shipped', 100.00, NOW());

   -- Create test guest order
   INSERT INTO "Order" (id, orderNumber, guestEmail, guestPhone, status, total, createdAt) 
   VALUES ('test-order-2', 'ORD-20250821-GUES', 'test@example.com', '+60123456789', 'shipped', 150.00, NOW());

   -- Create test shipments
   INSERT INTO "Shipment" (id, orderId, trackingNumber, status, courierName, estimatedDelivery) 
   VALUES 
     ('ship-1', 'test-order-1', 'TRK123456789', 'in_transit', 'Pos Laju', '2025-08-25 17:00:00'),
     ('ship-2', 'test-order-2', 'TRK987654321', 'out_for_delivery', 'GDEX', '2025-08-24 15:00:00');

   -- Create test tracking events
   INSERT INTO "ShipmentTracking" (id, shipmentId, eventName, description, eventTime, location)
   VALUES 
     (uuid_generate_v4(), 'ship-1', 'Package picked up', 'Package collected from origin', '2025-08-20 10:00:00', 'Kuala Lumpur Hub'),
     (uuid_generate_v4(), 'ship-1', 'In transit', 'Package in transit to destination', '2025-08-21 08:00:00', 'Selangor Hub'),
     (uuid_generate_v4(), 'ship-2', 'Out for delivery', 'Package out for delivery', '2025-08-21 09:00:00', 'Local delivery center');
   ```

---

## ⚙️ Environment Configuration

### 🔑 Test Environment Variables

Create a `.env.test.local` file for testing:

```bash
# Testing configuration
GUEST_TRACKING_RATE_LIMIT=20  # Higher limit for testing
CUSTOMER_TRACKING_RATE_LIMIT=50
TRACKING_LOG_RETENTION=1
TRACKING_AUTO_REFRESH=60000  # 1 minute for testing
MAX_TIMELINE_EVENTS=100

# Test mode flags
NODE_ENV=development
ENABLE_TRACKING_DEBUG=true
MOCK_EASYPARCEL_API=false  # Set to true for offline testing
```

### 🎯 Configuration Verification

Check that centralized config is working:

```javascript
// Test in browser console
console.log(TRACKING_CONFIG.RATE_LIMITS.GUEST.REQUESTS_PER_HOUR);
console.log(TRACKING_CONFIG.ORDER_FORMAT.PATTERN);
console.log(TRACKING_CONFIG.STATUS_MAPPING);
```

---

## 🎭 Manual Testing Scenarios

### 🔐 Customer Tracking Tests (Logged-in Users)

#### Test Case 1: View Order History with Tracking

**Steps:**
1. Navigate to `/auth/signin`
2. Sign in with test customer account
3. Go to `/member/orders`
4. Verify tracking information is displayed

**Expected Results:**
- ✅ Orders show tracking numbers
- ✅ Status badges are color-coded correctly  
- ✅ "Copy" and "Track" buttons work
- ✅ Estimated delivery dates shown
- ✅ Mobile layout is responsive

#### Test Case 2: Individual Order Tracking Page

**Steps:**
1. From order history, click on an order
2. Navigate to `/member/orders/[orderId]`
3. Check tracking timeline section

**Expected Results:**
- ✅ Complete tracking timeline displayed
- ✅ Events sorted chronologically (newest first)
- ✅ Status badges consistent with timeline
- ✅ Refresh tracking button works
- ✅ External tracking links work

#### Test Case 3: Copy-to-Clipboard Functionality

**Steps:**
1. On order tracking page
2. Click copy tracking number button
3. Check notification appears
4. Test pasting in another app

**Expected Results:**
- ✅ Success toast notification
- ✅ Tracking number copied correctly
- ✅ Works on both mobile and desktop

### 👥 Guest Tracking Tests

#### Test Case 4: Guest Order Lookup

**Steps:**
1. Navigate to `/track-order`
2. Enter test order number: `ORD-20250821-GUES`
3. Enter email: `test@example.com`
4. Click "Track Order"

**Expected Results:**
- ✅ Order found and tracking displayed
- ✅ Basic tracking information shown (no sensitive data)
- ✅ Status and estimated delivery visible
- ✅ Timeline shows only basic events

#### Test Case 5: Phone Number Verification

**Steps:**
1. On `/track-order` page
2. Select "Phone" verification method
3. Enter order number and phone: `+60123456789`
4. Submit form

**Expected Results:**
- ✅ Order found via phone verification
- ✅ Malaysian phone number format accepted
- ✅ Same tracking data as email method

#### Test Case 6: Invalid Order Lookup

**Steps:**
1. Enter invalid order number: `INVALID-123`
2. Enter valid email
3. Submit form

**Expected Results:**
- ✅ Validation error for order format
- ✅ Error message shows correct format example
- ✅ Form doesn't submit with invalid data

---

## 🔌 API Testing

### 🛡️ Customer Tracking API Tests

Use tools like **Postman**, **curl**, or **Thunder Client** for API testing.

#### Test Case 7: Customer Tracking Endpoint

```bash
# Test authenticated customer tracking
curl -X GET "http://localhost:3000/api/customer/orders/test-order-1/tracking" \
  -H "Cookie: next-auth.session-token=your-session-cookie" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "tracking": {
    "orderNumber": "ORD-20250821-TEST",
    "trackingNumber": "TRK123456789",
    "courierName": "Pos Laju",
    "status": "in_transit",
    "estimatedDelivery": "2025-08-25T17:00:00Z",
    "trackingEvents": [...]
  }
}
```

#### Test Case 8: Guest Tracking API

```bash
# Test guest tracking lookup
curl -X POST "http://localhost:3000/api/customer/track-order" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-20250821-GUES",
    "email": "test@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "tracking": {
    "orderNumber": "ORD-20250821-GUES",
    "status": "out_for_delivery",
    "courierName": "GDEX",
    "estimatedDelivery": "2025-08-24T15:00:00Z",
    "basicEvents": [
      {
        "eventName": "Out for delivery",
        "timestamp": "2025-08-21T09:00:00Z"
      }
    ]
  }
}
```

---

## 🔒 Security Testing

### 🚨 Rate Limiting Tests

#### Test Case 9: Guest Rate Limiting

**Steps:**
1. Make 10 rapid requests to guest tracking API from same IP
2. Make 11th request
3. Verify rate limiting kicks in

**Testing Script:**
```bash
# Test rate limiting (run this script)
for i in {1..12}; do
  echo "Request $i:"
  curl -X POST "http://localhost:3000/api/customer/track-order" \
    -H "Content-Type: application/json" \
    -d '{"orderNumber": "ORD-20250821-GUES", "email": "test@example.com"}' \
    -w "Status: %{http_code}\n"
  sleep 1
done
```

**Expected Results:**
- ✅ First 10 requests succeed (200)
- ✅ 11th request fails with 429 (Too Many Requests)
- ✅ Response includes `Retry-After` header
- ✅ Error message explains wait time

#### Test Case 10: Cross-User Data Access Prevention

**Steps:**
1. Login as Customer A
2. Try to access Customer B's order tracking URL
3. Verify access denied

**Expected Results:**
- ✅ 404 or 401 error returned
- ✅ No tracking data exposed
- ✅ Security event logged

#### Test Case 11: SQL Injection Prevention

**Test Payloads:**
```bash
# Test various injection attempts
curl -X POST "http://localhost:3000/api/customer/track-order" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-20250821-TEST\"; DROP TABLE orders; --",
    "email": "test@example.com"
  }'
```

**Expected Results:**
- ✅ Input sanitized properly
- ✅ No SQL errors in logs
- ✅ Graceful error response

---

## ⚡ Performance Testing

### 🚀 Load Testing

#### Test Case 12: Concurrent User Simulation

Use **Artillery**, **k6**, or **Apache Bench** for load testing:

```bash
# Install artillery for load testing
npm install -g artillery

# Create test config: artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
scenarios:
  - name: "Guest tracking lookup"
    weight: 70
    flow:
      - post:
          url: "/api/customer/track-order"
          json:
            orderNumber: "ORD-20250821-GUES"
            email: "test@example.com"
  - name: "Customer tracking"
    weight: 30
    flow:
      - get:
          url: "/api/customer/orders/test-order-1/tracking"

# Run load test
artillery run artillery-config.yml
```

**Expected Results:**
- ✅ Response times < 500ms for 95% of requests
- ✅ No memory leaks during testing
- ✅ Rate limiting works under load
- ✅ Database connections handled properly

---

## 📱 Browser & Device Testing

### 🌐 Cross-Browser Testing

Test on these browsers:

#### Desktop Browsers
- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest) 
- [ ] **Safari** (macOS)
- [ ] **Edge** (latest)

#### Mobile Browsers
- [ ] **Chrome Mobile** (Android)
- [ ] **Safari Mobile** (iOS)
- [ ] **Samsung Internet**

#### Test Cases for Each Browser

1. **Navigation Flow**
   - Track Order link in header works
   - Guest tracking form submission
   - Customer order history access

2. **UI Components**
   - Tracking status badges display correctly
   - Timeline component renders properly
   - Copy-to-clipboard functionality works
   - Toast notifications appear

3. **Mobile Responsiveness**
   - Forms are touch-friendly
   - Tables/cards stack properly on small screens
   - Buttons are adequately sized for touch
   - Text remains readable without zooming

### 📱 Device Testing

Test on various screen sizes:

- [ ] **Mobile** (375px - iPhone SE)
- [ ] **Mobile Large** (414px - iPhone Pro Max)
- [ ] **Tablet** (768px - iPad)
- [ ] **Desktop** (1024px+)

#### Using Browser Dev Tools

1. Open browser Developer Tools (F12)
2. Click device emulation button
3. Test each screen size
4. Verify responsive behavior

---

## 🚫 Error Scenarios Testing

### ❌ Network & Server Error Tests

#### Test Case 13: Database Connection Error

**Simulate:**
1. Stop PostgreSQL service temporarily
2. Try to access tracking pages
3. Restart database

**Expected Results:**
- ✅ Graceful error messages shown
- ✅ No white screen of death
- ✅ User-friendly error text
- ✅ Recovery after service restoration

#### Test Case 14: Invalid Session Testing

**Steps:**
1. Login and access `/member/orders`
2. Delete session cookie in browser
3. Refresh page or try tracking actions

**Expected Results:**
- ✅ Redirected to login page
- ✅ No sensitive data exposed
- ✅ Proper authentication flow

#### Test Case 15: Malformed Request Testing

**Test malformed JSON:**
```bash
curl -X POST "http://localhost:3000/api/customer/track-order" \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "ORD-20250821-TEST", "email":}'
```

**Expected Results:**
- ✅ 400 Bad Request response
- ✅ Clear error message about invalid input
- ✅ No server crash or 500 errors

---

## 🧪 Test Data Setup

### 📊 Sample Test Orders

Create comprehensive test data:

```sql
-- Logged-in customer orders
INSERT INTO "Order" (id, orderNumber, userId, status, total, createdAt, guestEmail, guestPhone) VALUES
('test-customer-1', 'ORD-20250821-CUS1', 'customer-uuid-1', 'delivered', 299.99, NOW() - INTERVAL '10 days', NULL, NULL),
('test-customer-2', 'ORD-20250820-CUS2', 'customer-uuid-1', 'in_transit', 149.99, NOW() - INTERVAL '5 days', NULL, NULL),
('test-customer-3', 'ORD-20250819-CUS3', 'customer-uuid-1', 'processing', 89.99, NOW() - INTERVAL '2 days', NULL, NULL);

-- Guest orders  
INSERT INTO "Order" (id, orderNumber, userId, status, total, createdAt, guestEmail, guestPhone) VALUES
('test-guest-1', 'ORD-20250821-GST1', NULL, 'delivered', 199.99, NOW() - INTERVAL '7 days', 'guest1@test.com', '+60123456789'),
('test-guest-2', 'ORD-20250820-GST2', NULL, 'out_for_delivery', 79.99, NOW() - INTERVAL '3 days', 'guest2@test.com', '+60198765432'),
('test-guest-3', 'ORD-20250819-GST3', NULL, 'exception', 129.99, NOW() - INTERVAL '1 day', 'guest3@test.com', '+60187654321');

-- Corresponding shipments with various couriers
INSERT INTO "Shipment" (id, orderId, trackingNumber, status, courierName, serviceName, estimatedDelivery, actualDelivery) VALUES
('ship-cust-1', 'test-customer-1', 'POS123456789', 'delivered', 'Pos Laju', 'Standard', '2025-08-18 15:00:00', '2025-08-18 14:30:00'),
('ship-cust-2', 'test-customer-2', 'GDX987654321', 'in_transit', 'GDEX', 'Express', '2025-08-23 17:00:00', NULL),
('ship-cust-3', 'test-customer-3', NULL, 'processing', NULL, NULL, NULL, NULL),
('ship-guest-1', 'test-guest-1', 'CTL555666777', 'delivered', 'City-Link Express', 'Standard', '2025-08-17 16:00:00', '2025-08-17 15:45:00'),
('ship-guest-2', 'test-guest-2', 'JNT111222333', 'out_for_delivery', 'J&T Express', 'Express', '2025-08-22 14:00:00', NULL),
('ship-guest-3', 'test-guest-3', 'NJA444555666', 'exception', 'Ninja Van', 'Standard', '2025-08-21 18:00:00', NULL);
```

### 🎯 Test Scenarios Coverage

| Scenario | Customer | Guest | Status | Courier |
|----------|----------|-------|--------|---------|
| Happy Path - Delivered | ✅ | ✅ | delivered | Pos Laju, City-Link |
| In Progress - Transit | ✅ | ✅ | in_transit | GDEX |
| Current - Out for Delivery | ❌ | ✅ | out_for_delivery | J&T Express |
| Early Stage - Processing | ✅ | ❌ | processing | None |
| Problem - Exception | ❌ | ✅ | exception | Ninja Van |

---

## 🤖 Automated Testing

### 🔧 Unit Test Examples

Create test files in `src/lib/__tests__/`:

#### Configuration Tests
```typescript
// src/lib/__tests__/tracking-config.test.ts
import { 
  getTrackingStatusInfo, 
  validateOrderNumber, 
  formatOrderNumber 
} from '@/lib/config/tracking';

describe('Tracking Configuration', () => {
  test('should validate correct order number format', () => {
    expect(validateOrderNumber('ORD-20250821-A1B2')).toBe(true);
    expect(validateOrderNumber('invalid-format')).toBe(false);
  });

  test('should get correct status info', () => {
    const deliveredStatus = getTrackingStatusInfo('delivered');
    expect(deliveredStatus.isTerminal).toBe(true);
    expect(deliveredStatus.priority).toBe(100);
  });

  test('should format order number correctly', () => {
    expect(formatOrderNumber('ord20250821test')).toBe('ORD-20250821-TEST');
  });
});
```

#### Date Formatter Tests
```typescript
// src/lib/__tests__/date-formatter.test.ts
import { formatTrackingDate, getRelativeTime } from '@/lib/utils/date-formatter';

describe('Date Formatter', () => {
  test('should format tracking date correctly', () => {
    const formatted = formatTrackingDate('2025-08-21T10:00:00Z');
    expect(formatted.full).toContain('August');
    expect(formatted.time).toContain('AM');
  });

  test('should calculate relative time correctly', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(getRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });
});
```

### 🔍 Integration Tests

```typescript
// src/app/api/__tests__/customer-tracking.test.ts
import { GET } from '@/app/api/customer/orders/[id]/tracking/route';
import { NextRequest } from 'next/server';

describe('Customer Tracking API', () => {
  test('should return tracking data for valid customer', async () => {
    const req = new NextRequest('http://localhost:3000/api/customer/orders/test-order-1/tracking');
    // Mock authentication session
    // ... test implementation
  });

  test('should deny access to other customer orders', async () => {
    // ... test unauthorized access
  });
});
```

### 🎭 E2E Tests with Playwright

```typescript
// tests/tracking.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Customer Tracking', () => {
  test('customer can track their orders', async ({ page }) => {
    // Login
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test@customer.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to orders
    await page.goto('/member/orders');
    await expect(page.locator('[data-testid="order-tracking-card"]')).toBeVisible();

    // Check tracking information
    await expect(page.locator('text=TRK123456789')).toBeVisible();
  });

  test('guest can track order with email', async ({ page }) => {
    await page.goto('/track-order');
    
    await page.fill('[name="orderNumber"]', 'ORD-20250821-GST1');
    await page.fill('[name="email"]', 'guest1@test.com');
    await page.click('button:has-text("Track Order")');

    await expect(page.locator('text=Tracking Results')).toBeVisible();
  });
});
```

---

## 📋 Testing Checklist

### ✅ Pre-Deployment Verification

Before deploying to production, verify ALL these items:

#### Functionality
- [ ] Customer order history shows tracking info
- [ ] Individual order tracking pages work
- [ ] Guest order lookup works with email
- [ ] Guest order lookup works with phone
- [ ] Copy-to-clipboard functions properly
- [ ] External courier tracking links work
- [ ] Status badges display correctly
- [ ] Timeline events sort chronologically
- [ ] Mobile layout is responsive

#### Security  
- [ ] Rate limiting enforces limits correctly
- [ ] Cross-user data access prevented
- [ ] Input validation prevents injection
- [ ] Guest users see filtered data only
- [ ] Authentication required for customer APIs
- [ ] Session handling works properly
- [ ] HTTPS enforced in production

#### Performance
- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms  
- [ ] No memory leaks during testing
- [ ] Database queries optimized
- [ ] Caching works effectively
- [ ] Error handling graceful

#### Browser Support
- [ ] Chrome/Firefox/Safari work
- [ ] Mobile browsers function properly
- [ ] Touch interactions work on mobile
- [ ] Copy functionality works across browsers

#### Error Handling
- [ ] Network errors handled gracefully
- [ ] Invalid input shows friendly messages
- [ ] Database errors don't crash app
- [ ] Rate limit errors show retry time
- [ ] 404/401 errors have proper messages

---

## 🎯 Success Criteria

### 📊 Testing Completion Metrics

The tracking system is ready for production when:

- **100% of functional test cases pass**
- **Security tests show no vulnerabilities**
- **Performance targets met (< 500ms API, < 2s page load)**  
- **Cross-browser compatibility verified**
- **Mobile responsiveness confirmed**
- **Error scenarios handled gracefully**
- **Rate limiting working effectively**

### 🚀 Go-Live Readiness

✅ **READY FOR PRODUCTION** when all checklist items are verified and tested.

---

## 📞 Support & Troubleshooting

### 🔧 Common Testing Issues

**Issue: Rate limiting not working**
- Check `TRACKING_CONFIG.RATE_LIMITS` values
- Verify IP extraction in `getClientIP()`
- Clear rate limit store: `rateLimitStore.clear()`

**Issue: Tracking data not appearing**  
- Verify test data exists in database
- Check EasyParcel API configuration
- Review database relationships (Order → Shipment → ShipmentTracking)

**Issue: Authentication problems**
- Verify NextAuth configuration
- Check session cookie settings
- Review user roles and permissions

### 🆘 Getting Help

For testing issues:
1. Check browser console for errors
2. Review server logs for API errors
3. Verify database contains test data
4. Test API endpoints directly with curl/Postman

---

**Testing Guide Complete! 🎉**  
*Ready to ensure quality delivery of customer tracking functionality*