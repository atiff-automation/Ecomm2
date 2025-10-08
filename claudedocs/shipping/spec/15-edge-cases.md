## Edge Cases

### 1. EasyParcel API Down During Checkout

**Scenario:** Customer tries to checkout but EasyParcel API is down.

**Behavior:**
- Show error message
- Disable checkout button
- Provide retry button
- Show support contact info
- Don't allow order creation without shipping

**Alternative (future):**
- Allow order creation
- Flag for manual shipping arrangement
- Admin contacts customer later

### 2. Courier Selection Changes Before Fulfillment

**Scenario:** Courier available at checkout but not available at fulfillment.

**Behavior:**
- Admin clicks "Fulfill Order"
- System detects courier no longer available
- Show error with alternative couriers
- Admin selects different courier
- Adjust shipping cost if needed (admin absorbs difference)

### 3. Customer Changes Address After Payment

**Scenario:** Customer requests address change after order is PAID.

**Current Behavior:**
- Not supported in v1
- Admin manually cancels and recreates order
- Customer gets refund and repays

**Future Enhancement:**
- Admin can edit address before fulfillment
- System recalculates shipping
- Adjust payment if needed

### 4. Free Shipping Threshold Met But Couriers Charge Different Rates

**Scenario:** Order qualifies for free shipping, but different couriers have different rates.

**Behavior:**
- Always apply free shipping (cost = RM 0.00)
- Select cheapest courier (to minimize business cost)
- Customer sees "FREE" regardless of original courier rate

### 5. Tracking Updates Stop Coming

**Scenario:** EasyParcel stops sending tracking updates.

**Behavior:**
- Cron job continues trying every 4 hours
- If no update for 7 days, flag order for review
- Admin can manually check with courier
- Customer can contact support

### 6. Duplicate Fulfillment Attempt

**Scenario:** Admin clicks "Fulfill Order" twice quickly.

**Prevention:**
1. Disable button immediately on first click
2. Check for existing tracking number before API call
3. If tracking exists, show error and prevent duplicate
4. Log attempt for debugging

### 7. Partial Fulfillment (Future)

**Scenario:** Order has multiple items but only some are ready to ship.

**Current:** Not supported (ship all items together)

**Future:** Allow partial fulfillment with multiple tracking numbers

### 8. International Shipping

**Scenario:** Customer enters non-Malaysia address.

**Current Behavior:**
- Not supported in v1
- Block checkout with message: "We only ship within Malaysia"
- Validate country = "MY" in address form

**Future:** Add international shipping if needed

### 9. Very Heavy Orders (>70kg)

**Scenario:** Order exceeds EasyParcel weight limit.

**Behavior:**
- EasyParcel API returns error during rate calculation
- Show message: "Order too heavy for standard shipping. Please contact us."
- Block checkout
- Admin arranges freight shipping manually

### 10. API Credentials Changed

**Scenario:** Admin updates EasyParcel API key.

**Behavior:**
- Test connection immediately on save
- If invalid, show error and don't save
- Keep old credentials until new ones verified
- Prevent breaking existing fulfillment process

---
