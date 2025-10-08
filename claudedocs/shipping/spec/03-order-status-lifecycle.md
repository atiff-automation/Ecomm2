## Order Status Lifecycle

### Status Definitions

```
PENDING
├─ Description: Order created, payment not completed
├─ Trigger: Customer submits order
└─ Next: PAID or CANCELLED

PAID
├─ Description: Payment successful, ready for fulfillment
├─ Trigger: Payment gateway confirms payment
├─ Admin Action Required: Yes (click "Fulfill Order")
└─ Next: READY_TO_SHIP or CANCELLED

READY_TO_SHIP
├─ Description: AWB received, label downloaded, ready for courier
├─ Trigger: Successful EasyParcel booking API call
├─ Admin Action Required: No (automated tracking updates)
├─ Display Name: "Ready to Ship"
└─ Next: IN_TRANSIT

IN_TRANSIT
├─ Description: Courier has picked up parcel
├─ Trigger: Tracking update from EasyParcel
├─ Admin Action Required: No
└─ Next: OUT_FOR_DELIVERY

OUT_FOR_DELIVERY
├─ Description: Parcel out for final delivery
├─ Trigger: Tracking update from EasyParcel
├─ Admin Action Required: No
└─ Next: DELIVERED

DELIVERED
├─ Description: Customer received parcel
├─ Trigger: Tracking update from EasyParcel
├─ Admin Action Required: No
└─ Final State: Yes

CANCELLED
├─ Description: Order cancelled (any reason)
├─ Trigger: Admin or customer cancellation
├─ Admin Action Required: Depends on timing
└─ Final State: Yes
```

### Status Transition Rules

**Allowed Transitions:**
```
PENDING → PAID
PENDING → CANCELLED

PAID → READY_TO_SHIP (via fulfillment)
PAID → CANCELLED (admin decision)

READY_TO_SHIP → IN_TRANSIT (auto-update)
READY_TO_SHIP → CANCELLED (before pickup only)

IN_TRANSIT → OUT_FOR_DELIVERY (auto-update)
IN_TRANSIT → DELIVERED (auto-update if no OUT_FOR_DELIVERY)

OUT_FOR_DELIVERY → DELIVERED (auto-update)
```

**Forbidden Transitions:**
```
❌ DELIVERED → Any other status (final state)
❌ READY_TO_SHIP → PAID (no backwards)
❌ IN_TRANSIT → PAID (no backwards)
```

---
