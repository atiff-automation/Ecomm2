## Implementation Timeline

**Revised Estimate:** 7-8 days (includes 6 WooCommerce-inspired critical features)

---

### Phase 1: Core Setup (Day 1)

**Morning:**
- [ ] Execute removal plan (delete old system)
- [ ] Create new file structure
- [ ] Set up TypeScript types (including new fields)
- [ ] Create EasyParcel service base
- [ ] Update database schema with new fields:
  - [ ] `scheduledPickupDate`, `overriddenByAdmin`, `adminOverrideReason`
  - [ ] `failedBookingAttempts`, `lastBookingError`, `autoStatusUpdate`

**Afternoon:**
- [ ] Implement admin shipping management page (with courier strategy dropdown)
- [ ] Implement `/api/admin/shipping/couriers` endpoint (get courier list)
- [ ] Implement settings GET/POST endpoints
- [ ] **NEW: Add automation settings section (Feature #4)**
- [ ] **NEW: Add credit balance display (Feature #6)**
- [ ] Test connection to EasyParcel API
- [ ] Validate settings storage (including `courierStrategy`, `automation`, `creditBalance`)

**End of Day 1:** Admin can configure API credentials, pickup address, courier selection strategy, automation toggle, and view balance.

---

### Phase 2: Checkout Integration (Day 2)

**Morning:**
- [ ] Implement shipping calculator service
- [ ] Create `/api/shipping/calculate` endpoint
- [ ] Implement strategy application logic:
  - [ ] "Cheapest" - return only lowest cost option
  - [ ] "All" - return all available couriers
  - [ ] "Selected" - filter by admin's selected courier IDs
- [ ] Handle rate calculation logic
- [ ] Implement free shipping threshold

**Afternoon:**
- [ ] Build ShippingSelector component
  - [ ] Single option display (cheapest strategy)
  - [ ] Multiple options display (all/selected strategies)
- [ ] Store selected `serviceId` in order
- [ ] Integrate with checkout page
- [ ] Handle loading/error states
- [ ] Test no couriers scenario

**End of Day 2:** Customers see shipping rates based on admin strategy, select courier if needed, proceed to payment.

---

### Phase 3: Admin Fulfillment Widget (Day 3-4)

**Day 3 Morning:**
- [ ] **NEW: Implement `/api/admin/orders/{id}/shipping-options` (Feature #1)**
  - [ ] Fetch customer's selected courier
  - [ ] Fetch alternative couriers for same destination
  - [ ] Mark cheaper alternatives as "recommended"
- [ ] **NEW: Implement balance validation before fulfillment (Feature #6)**
  - [ ] Check balance API
  - [ ] Show low balance warning if < threshold

**Day 3 Afternoon:**
- [ ] Build FulfillmentWidget component (sidebar widget)
  - [ ] **NEW: Courier override dropdown (Feature #1)**
  - [ ] **NEW: Pickup date selector with smart defaults (Feature #5)**
  - [ ] Shipment summary display
  - [ ] Pre-fulfillment state UI
- [ ] Implement business day calculation utility
  - [ ] Skip Sundays
  - [ ] Skip Malaysian public holidays
  - [ ] Max 7 days ahead validation

**Day 4 Morning:**
- [ ] Enhance `/api/admin/orders/{id}/fulfill` endpoint
  - [ ] Accept `serviceId`, `pickupDate`, `overriddenByAdmin`, `overrideReason`
  - [ ] Validate pickup date (not Sunday/holiday/past/too far)
  - [ ] **NEW: Track failed attempts (Feature #3)**
  - [ ] **NEW: Store error details for retry**
- [ ] Implement processing state UI (loading indicator)
- [ ] Implement post-fulfillment success state UI

**Day 4 Afternoon:**
- [ ] **NEW: Implement retry mechanism (Feature #3)**
  - [ ] Failed state UI with specific error messages
  - [ ] Retry button functionality
  - [ ] Actionable error suggestions (top-up link, change courier, etc.)
- [ ] **NEW: Implement `/api/admin/orders/{id}/retry-awb` endpoint**
- [ ] **NEW: Partial success state UI (AWB retry)**
- [ ] Implement duplicate prevention
- [ ] Add error boundary for widget
- [ ] Test all fulfillment states

**End of Day 4:** Admin has complete fulfillment widget with courier override, pickup scheduling, balance checking, and retry capability.

---

### Phase 4: Tracking & Notifications (Day 5)

**Morning:**
- [ ] Implement `/api/shipping/track/:trackingNumber` endpoint
- [ ] Create tracking display in admin
- [ ] Simplify track-order page for customers
- [ ] Add manual refresh button (Feature #3 - manual retry pattern)
- [ ] Test tracking data flow

**Afternoon:**
- [ ] Set up email templates
- [ ] Implement Email #1 (order confirmation)
- [ ] Implement Email #2 (tracking notification)
- [ ] Test email delivery
- [ ] Ensure emails sent even with automation toggle off

**End of Day 5:** Tracking works, customers receive emails, manual refresh available.

---

### Phase 5: Automation & Cron Job (Day 6)

**Morning:**
- [ ] Create `update-tracking.ts` script
- [ ] **NEW: Implement auto-update toggle respect (Feature #4)**
  - [ ] Check global `automation.autoStatusUpdate` setting
  - [ ] Check per-order `autoStatusUpdate` field
  - [ ] Skip orders where automation is disabled
- [ ] Query only orders with tracking and auto-update enabled
- [ ] Update order statuses based on tracking events

**Afternoon:**
- [ ] Configure Railway cron job (4-hour interval)
- [ ] Test automatic status updates
- [ ] Verify cron job execution
- [ ] Test manual toggle override
- [ ] Create admin UI to toggle auto-update per-order (if needed)

**End of Day 6:** Automatic tracking updates work, respecting automation preferences.

---

### Phase 6: Testing & Quality Assurance (Day 7)

**Morning:**
- [ ] **Unit tests for business logic**
  - [ ] `getNextBusinessDay()` utility
  - [ ] Pickup date validation
  - [ ] Balance threshold checking
  - [ ] Error message mapping
- [ ] **Integration tests for API routes**
  - [ ] Fulfill endpoint (success/failure/retry scenarios)
  - [ ] Shipping options endpoint
  - [ ] Balance endpoint
  - [ ] Retry AWB endpoint

**Afternoon:**
- [ ] **E2E tests for critical flows**
  - [ ] Admin fulfillment with courier override
  - [ ] Retry failed booking after top-up
  - [ ] Pickup date selection validation
  - [ ] Partial success AWB retry
- [ ] **Manual testing checklist**
  - [ ] All 6 critical features working
  - [ ] Error states display correctly
  - [ ] Loading states smooth
  - [ ] Mobile responsiveness

**End of Day 7:** All features tested, bugs fixed, ready for final polish.

---

### Phase 7: Final Polish & Documentation (Day 8)

**Morning:**
- [ ] Code review with best practices checklist
- [ ] Verify TypeScript strict mode compliance
- [ ] Check error handling coverage
- [ ] Optimize queries (add indexes if needed)
- [ ] Add JSDoc comments to complex functions

**Afternoon:**
- [ ] Create admin user guide (with screenshots)
  - [ ] How to configure settings
  - [ ] How to fulfill orders
  - [ ] How to handle failed bookings
  - [ ] How to override couriers
- [ ] Update project README
- [ ] Final end-to-end flow test
- [ ] Deploy to staging for UAT

**End of Day 8:** Production-ready system with all 6 critical features implemented and documented.

---

### Phase 8 (Optional): Post-Launch Monitoring (Week 2+)

**Monitor:**
- [ ] Tracking update success rate (cron job logs)
- [ ] EasyParcel API reliability (error rates)
- [ ] Failed booking patterns (which errors are common?)
- [ ] Courier override frequency (analytics)
- [ ] Balance low warnings (how often?)

**Iterate:**
- [ ] Gather real-world courier reliability data
- [ ] Analyze if courier strategy should be adjusted
- [ ] Consider bulk operations if order volume > 50/day
- [ ] Add dashboard metrics if useful

---

### Feature Implementation Status

**✅ Core Features (MVP Baseline):**
1. Shipping rate calculation at checkout
2. Strategy-based courier selection (cheapest/all/selected)
3. Free shipping threshold
4. One-click order fulfillment
5. Automatic tracking updates (cron job)
6. Email notifications
7. Customer tracking page

**✅ Critical Features (WooCommerce-Inspired):**
1. **Admin courier override at fulfillment** (Day 3-4)
2. **Pickup date selection** (Day 3-4)
3. **Retry failed bookings** (Day 4)
4. **Auto-update toggle** (Day 6)
5. **Detailed fulfillment UI** (Day 3-4)
6. **Credit balance display** (Day 1)

**Timeline Summary:**
- **Original estimate:** 5 days
- **Revised estimate:** 7-8 days (+2-3 days for critical features)
- **Impact:** Acceptable delay for significantly better product (75% → 95% readiness)

---

### Post-Launch (Week 2+)

**Monitor:**
- [ ] Tracking update success rate
- [ ] EasyParcel API reliability
- [ ] Customer shipping complaints
- [ ] Courier delivery times

**Iterate:**
- [ ] Gather courier reliability data
- [ ] Decide on courier selection strategy (pending decision)
- [ ] Add improvements based on real usage
- [ ] Consider bulk operations if order volume increases

---
