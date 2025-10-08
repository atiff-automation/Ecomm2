## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Customer Pages           Admin Pages               │
│  ├─ Checkout             ├─ Settings                │
│  ├─ Track Order          ├─ Orders List             │
│  └─ Order Confirmation   └─ Order Detail            │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ API Calls
                   ↓
┌─────────────────────────────────────────────────────┐
│              API Routes (Next.js)                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  /api/shipping/calculate         (POST)            │
│  /api/admin/shipping/settings    (GET/POST)        │
│  /api/admin/shipping/fulfill     (POST)            │
│  /api/shipping/track/:id         (GET)             │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Uses
                   ↓
┌─────────────────────────────────────────────────────┐
│              Service Layer                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  src/lib/shipping/                                  │
│  ├─ easyparcel.ts         (EasyParcel API client)  │
│  ├─ shipping-settings.ts  (Settings management)    │
│  └─ types.ts              (TypeScript types)       │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Calls External API
                   ↓
┌─────────────────────────────────────────────────────┐
│              EasyParcel API                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  GET  /rates            (Get shipping rates)        │
│  POST /shipments        (Create shipment)           │
│  GET  /tracking/:id     (Get tracking info)         │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Background Jobs (Railway Cron)         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  scripts/update-tracking.ts                         │
│  ├─ Runs every 4 hours                              │
│  ├─ Updates order statuses                          │
│  └─ Logs tracking events                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── shipping/
│   │   │   ├── calculate/route.ts         (~150 lines)
│   │   │   └── track/[id]/route.ts        (~100 lines)
│   │   └── admin/
│   │       └── shipping/
│   │           ├── settings/route.ts      (~100 lines)
│   │           └── fulfill/route.ts       (~150 lines)
│   │
│   ├── checkout/
│   │   └── page.tsx                       (uses ShippingSelector)
│   │
│   ├── admin/
│   │   ├── shipping/
│   │   │   └── page.tsx                   (~200 lines)
│   │   └── orders/
│   │       └── [id]/page.tsx              (shows fulfill button)
│   │
│   └── track-order/
│       └── page.tsx                       (existing, simplify)
│
├── components/
│   ├── checkout/
│   │   └── ShippingSelector.tsx           (~150 lines)
│   │
│   └── admin/
│       ├── ShippingSettings.tsx           (~150 lines)
│       └── FulfillOrderButton.tsx         (~100 lines)
│
├── lib/
│   └── shipping/
│       ├── easyparcel.ts                  (~200 lines)
│       ├── shipping-settings.ts           (~100 lines)
│       └── types.ts                       (~50 lines)
│
└── scripts/
    └── update-tracking.ts                 (~150 lines)

Total estimated: ~1,500 lines (conservative)
```

---
