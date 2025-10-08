## Admin Configuration

### Shipping Management Screen

**Location:** Admin → Shipping

**Navigation:** Top-level sidebar link (not under Settings)

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ EasyParcel Shipping Settings                        │
└─────────────────────────────────────────────────────┘

━━━ 1. API Configuration ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API Key *
[_________________________________________________]
Get your API key from EasyParcel dashboard

Environment *
○ Sandbox (Testing)
● Production (Live)

━━━ 2. Pickup Address (Sender Information) ━━━━━━━━━

Business Name *
[_________________________________________________]

Phone Number *
[_________________________________________________]
Format: +60XXXXXXXXX

Address Line 1 *
[_________________________________________________]

Address Line 2
[_________________________________________________]

City *
[_________________________________________________]

State *
[Kuala Lumpur ▼                                    ]

Postal Code *
[_____]
5-digit Malaysian postal code

Country *
[Malaysia (MY)]
ℹ️ v1: Malaysia only. v2: Add Singapore support.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPLEMENTATION NOTE (GAP #3 RESOLVED):

State field MUST use dropdown (not free text) to prevent typos.
Populate dropdown from MALAYSIAN_STATES constant defined in
src/lib/shipping/constants.ts

Example implementation:
```tsx
<select name="state" value={formData.state} onChange={handleChange}>
  <option value="">Select State</option>
  {Object.entries(MALAYSIAN_STATES).map(([code, name]) => (
    <option key={code} value={code}>{name}</option>
  ))}
</select>
```

Valid state codes: jhr, kdh, ktn, mlk, nsn, phg, prk, pls,
png, sgr, trg, kul, pjy, srw, sbh, lbn

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ 3. Courier Selection Strategy ━━━━━━━━━━━━━━━━━

How should customers see shipping options?

Courier Selection Mode *
[Cheapest Courier (Recommended) ▼                  ]

Options:
• Cheapest Courier - Auto-select lowest price (simplest)
• Show All Couriers - Customer chooses from all available
• Selected Couriers - Limit to specific couriers you choose

[Only shown if "Selected Couriers" is chosen above]
┌────────────────────────────────────────────────┐
│ Select Allowed Couriers:                       │
│ ☑ City-Link Express                            │
│ ☑ Skynet                                       │
│ ☐ J&T Express                                  │
│ ☐ Ninja Van                                    │
│ ☐ Poslaju                                      │
│ ☐ DHL eCommerce                                │
│                                                │
│ [Refresh Courier List]                         │
└────────────────────────────────────────────────┘

━━━ 4. Shipping Preferences ━━━━━━━━━━━━━━━━━━━━━━━

Free Shipping
☑ Enable free shipping threshold
Minimum order amount: RM [150___]

When enabled, orders above this amount get free shipping.

━━━ 5. Automation Settings ━━━━━━━━━━━━━━━━━━━━━━━━━

Order Status Auto-Update
☑ Automatically update order status based on tracking
  When enabled, order status will change based on courier tracking
  updates (e.g., IN_TRANSIT → DELIVERED).
  Uncheck if you prefer manual status control.

━━━ 6. Account Information ━━━━━━━━━━━━━━━━━━━━━━━━━

┌────────────────────────────────────────────────┐
│ Current Balance: RM 250.50                     │
│ [Refresh Balance] [Top Up Account]            │
│                                                │
│ ⚠️ Your balance is running low. Top up to     │
│    avoid fulfillment failures.                 │
│    (This warning appears when balance < RM 50) │
└────────────────────────────────────────────────┘

Last updated: 5 minutes ago

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Test Connection]  [Save Settings]
```

### Field Validations

**API Key:**
- Required
- Minimum 20 characters
- Alphanumeric + special characters
- Test connection before saving

**Phone Number:**
- Required
- Format: `+60XXXXXXXXX` (Malaysian format)
- Regex: `^\\+60[0-9]{8,10}$`

**Postal Code:**
- Required
- Exactly 5 digits
- Regex: `^\\d{5}$`

**Country:**
- Required
- v1: Only 'MY' (Malaysia) accepted
- v2: Add 'SG' (Singapore) support

**State:**
- Required
- Must be valid lowercase 3-letter Malaysian state code
- See state code constant for valid values

**Courier Selection Mode:**
- Required
- Default: "Cheapest Courier"
- If "Selected Couriers": At least 1 courier must be selected

**Free Shipping Amount:**
- Optional (if enabled)
- Minimum: RM 1
- Maximum: RM 10,000
- Decimal allowed (e.g., RM 150.50)

### Test Connection Feature

When admin clicks "Test Connection":
```
1. Validate all required fields
2. Call EasyParcel API health check
3. Show result:
   ✅ "Connection successful! API is working."
   OR
   ❌ "Connection failed: [error message]"
```

---
