## System Requirements

### Functional Requirements

**Must Have:**
1. Customer sees shipping cost at checkout before payment
2. Admin can fulfill orders with one click (with optional courier override)
3. Tracking information visible to customer and admin
4. Free shipping threshold support
   - Applied to cart **subtotal** (before shipping, before tax)
   - If subtotal >= threshold: Show RM 0.00 shipping cost
   - If multiple free couriers available, select **cheapest** option
   - Customer sees: "FREE SHIPPING (You saved RM X.XX)"
5. No courier available = block checkout
6. Duplicate fulfillment prevention
7. Email notifications (order confirmation + tracking)
8. **Admin courier override at fulfillment** (can change customer's selected courier)
9. **Pickup date selection** (schedule pickup for next business day or future date)
10. **Credit balance display** (show EasyParcel account balance in settings)
11. **Retry failed bookings** (manual retry button for API failures)
12. **Auto-update toggle** (admin control over automatic order status updates)

**Should Have:**
1. Manual tracking refresh for admin (✅ covered by retry mechanism)
2. Automatic tracking updates every 4 hours
3. Detailed fulfillment UI with clear visual states
4. Low balance warnings when credit < RM 50

**Won't Have (for v1):**
1. CSV export fallback
2. Bulk fulfillment operations
3. Complex courier scoring algorithms
4. Operating hours configuration
5. Insurance/COD/Signature options at checkout
6. Advanced analytics and reporting
7. Webhook integration for tracking

### Non-Functional Requirements

**Performance:**
- Shipping rate calculation: < 3 seconds
- Order fulfillment API call: < 5 seconds
- Page load with shipping: < 2 seconds

**Reliability:**
- Handle EasyParcel API failures gracefully
- Retry mechanism for transient errors
- Clear error messages to users

**Usability:**
- Admin setup: < 5 minutes
- Customer checkout: No confusion
- Admin fulfillment: 1-click operation

**Maintainability:**
- Total code: < 1,000 lines
- Single service file (no layers)
- Clear separation of concerns
- Well-documented functions

---
