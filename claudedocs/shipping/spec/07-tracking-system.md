## Tracking System

### Tracking Updates - Two Methods

#### Method 1: Manual Refresh (Immediate)

**Admin Order Detail Page:**
```
[Refresh Tracking] button

When clicked:
1. Call EasyParcel tracking API
2. Fetch latest tracking events
3. Update order status if changed
4. Display updated tracking history
5. Show success message
```

#### Method 2: Automatic Updates (Every 4 hours)

**Railway Cron Job:**
```
Schedule: 0 */4 * * * (Every 4 hours, on the hour)
Timezone: UTC

Process:
1. Query all orders with status:
   - READY_TO_SHIP
   - IN_TRANSIT
   - OUT_FOR_DELIVERY

2. For each order:
   - Call EasyParcel tracking API
   - Get latest status
   - Update order.status if changed
   - Log tracking event
   - No email notifications (only on first tracking)

3. Mark orders as DELIVERED when confirmed

4. Log completion statistics
```

**Railway Configuration:**
```yaml
# railway.json or service settings
{
  "cron": {
    "schedule": "0 */4 * * *",
    "command": "npm run cron:update-tracking"
  }
}
```

**Script:** `scripts/update-tracking.ts`
```
Expected behavior:
- Runs every 4 hours
- Completes in < 5 minutes
- Exits cleanly when done
- Logs success/failure
- No resource leaks
```

### Tracking History Display

**Admin view:**
```
━━━ Tracking History ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: IN_TRANSIT

📦 2025-10-07 14:30 - Shipment created
✓  2025-10-07 14:30 - Label generated
📧 2025-10-07 14:31 - Customer notified
📦 2025-10-07 16:00 - Picked up by courier
🚚 2025-10-08 09:00 - In transit to Kuala Lumpur
📍 2025-10-08 14:00 - Arrived at KL hub

Last updated: 2025-10-08 14:05

[Refresh Tracking]
```

**Customer view (Track Order page):**
```
┌─────────────────────────────────────────────────┐
│ Order #1234                                     │
│ Status: In Transit 🚚                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Tracking: EP123456789MY                         │
│ Courier: City-Link Express                      │
│ Estimated Delivery: 2-3 working days            │
│                                                 │
│ ━━━ Tracking Updates ━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│ 📦 Oct 7, 2:30 PM - Shipment created            │
│ 📦 Oct 7, 4:00 PM - Picked up by courier        │
│ 🚚 Oct 8, 9:00 AM - In transit to Kuala Lumpur  │
│ 📍 Oct 8, 2:00 PM - Arrived at KL hub           │
│                                                 │
│ Last updated: Oct 8, 2:05 PM                    │
│                                                 │
│ [New Search]                                    │
└─────────────────────────────────────────────────┘
```

---
