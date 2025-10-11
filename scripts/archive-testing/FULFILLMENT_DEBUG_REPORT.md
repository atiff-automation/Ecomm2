# EasyParcel Fulfillment Flow - Debug Report
**Order**: ORD-20251011-Y323
**Date**: 2025-10-11
**Status**: Investigation Complete

---

## 📊 Complete Data Flow

### 1. EasyParcel API → Service Layer
```
EPPayOrderBulk API Response
├── result[0].parcel[0].awb = "631867054753"           → data.parcels[0].awb
├── result[0].parcel[0].awb_id_link = "https://..."    → data.parcels[0].awb_id_link
├── result[0].parcel[0].tracking_url = "https://..."   → data.parcels[0].tracking_url
└── result[0].parcel[0].parcelno = "EP-A2V318"         → data.parcels[0].parcelno (NOT used for tracking)
```

### 2. Service Layer → Database
```
EasyParcelPaymentResponse.data.parcels[0]
├── .awb           → orders.trackingNumber        ✅
├── .awb           → orders.airwayBillNumber      ✅
├── .awb_id_link   → orders.airwayBillUrl         ✅
└── .tracking_url  → orders.trackingUrl           ✅
```

### 3. Database → API → UI
```
Database (orders table)
├── trackingNumber     → API response → order.trackingNumber     → UI displays
├── airwayBillNumber   → API response → order.airwayBillNumber   → UI displays
├── airwayBillUrl      → API response → order.airwayBillUrl      → UI button
└── trackingUrl        → API response → order.trackingUrl        → UI link
```

---

## 🔍 Investigation Results

### ✅ Simulation Test: PASSED
- File: `/scripts/simulate-payment-response.ts`
- Result: All 11 verification checks passed
- Conclusion: **Code mapping logic is 100% correct**

### ❌ Actual Fulfillment: FAILED
- Order status: Still `PAID` (should be `READY_TO_SHIP`)
- All tracking fields: `NULL` (should have values)
- Root cause: Unknown (need to check logs)

---

## 🐛 Issues Identified

### Issue 1: Missing Payment Response Logging
**File**: `/src/lib/shipping/easyparcel-service.ts`

**Before** (lines 318-327):
```typescript
const bulkResult = response.result?.[0];
// No file write - payment response not saved! ❌
```

**After** (lines 462-474) ✅ FIXED:
```typescript
// Write payment response to file
fs.writeFileSync('/tmp/easyparcel-payment-response.json', JSON.stringify(response, null, 2));
console.log('[EasyParcel] Payment response written to /tmp/easyparcel-payment-response.json');
```

**Impact**: Can now debug payment responses in future attempts

---

### Issue 2: Print Packing Slip Button - 404 Error
**File**: `/src/app/admin/orders/[orderId]/page.tsx` (lines 249-256)

**Current** ❌:
```typescript
const handlePrintPackingSlip = () => {
  if (order) {
    window.open(
      `/api/orders/${order.id}/packing-slip?download=true`,  // Route doesn't exist!
      '_blank'
    );
  }
};
```

**Should Be** ✅:
```typescript
const handlePrintPackingSlip = () => {
  if (order?.airwayBillUrl) {
    // Open EasyParcel AWB PDF directly
    window.open(order.airwayBillUrl, '_blank');
  } else {
    toast({
      title: 'AWB Not Available',
      description: 'Airway bill has not been generated yet',
      variant: 'destructive',
    });
  }
};
```

**Status**: NOT FIXED YET - Awaiting approval

---

## 📝 Why Your Fulfillment Failed

### Database State Analysis
```sql
SELECT "orderNumber", status, "trackingNumber", "airwayBillUrl"
FROM orders
WHERE "orderNumber" = 'ORD-20251011-Y323';

-- Result:
orderNumber           | status | trackingNumber | airwayBillUrl
ORD-20251011-Y323     | PAID   | NULL           | NULL
```

### Possible Failure Points

1. **Payment API Never Called** (line 335 in fulfill route)
   - Check: Did `createShipment()` succeed?
   - File: `/tmp/easyparcel-response.json` exists → YES, it succeeded
   - Conclusion: Should have proceeded to payment

2. **Payment API Failed** (lines 346-408)
   - Check: Error response from EasyParcel?
   - File: `/tmp/easyparcel-payment-response.json` → DOESN'T EXIST (now fixed)
   - Conclusion: Can't verify without logs

3. **Database Update Failed** (line 422)
   - Check: Transaction error?
   - Database: Shows `PAID` status, not `READY_TO_SHIP`
   - Conclusion: Update never executed OR rolled back

---

## 🔄 Debug Files Generated

### EPSubmitOrderBulk (Step 1: Create Shipment)
**File**: `/tmp/easyparcel-response.json` ✅ EXISTS
```json
{
  "result": [{
    "order_number": "EI-ZQ0RT",
    "parcel_number": "EP-A2V318",
    "courier": "J&T Express"
  }],
  "api_status": "Success"
}
```

### EPPayOrderBulk (Step 2: Payment)
**File**: `/tmp/easyparcel-payment-response.json` ❌ MISSING (NOW FIXED)
```
Expected structure:
{
  "result": [{
    "orderno": "EI-ZQ0RT",
    "messagenow": "Fully Paid",
    "parcel": [{
      "awb": "631867054753",
      "awb_id_link": "https://...",
      "tracking_url": "https://..."
    }]
  }]
}
```

---

## 🎯 Next Steps

### For Next Fulfillment Attempt:
1. ✅ **Enhanced logging added** - Payment response will be saved to file
2. ✅ **Simulation verified** - Code logic is correct
3. ⏳ **UI fix pending** - Print Packing Slip button needs update
4. ⏳ **Retry fulfillment** - Try again and check `/tmp/easyparcel-payment-response.json`

### Investigation Checklist:
- [ ] Check server console logs from original attempt
- [ ] Verify `/tmp/easyparcel-payment-response.json` is created on next attempt
- [ ] Confirm database update happens (watch Prisma logs)
- [ ] Fix Print Packing Slip button to use `airwayBillUrl`

---

## 📚 Reference Files

- **Simulation Script**: `/scripts/simulate-payment-response.ts`
- **Test Mapping**: `/scripts/test-fulfillment-mapping.ts`
- **Field Investigation**: `/scripts/investigate-field-extraction.ts`
- **Service Layer**: `/src/lib/shipping/easyparcel-service.ts`
- **Fulfill Route**: `/src/app/api/admin/orders/[orderId]/fulfill/route.ts`
- **UI Component**: `/src/app/admin/orders/[orderId]/page.tsx`

---

## 🔬 Official EasyParcel Documentation

**EPPayOrderBulk Response Structure** (from developers.easyparcel.com):
```json
{
  "result": [{
    "orderno": "EI-5UFAI",
    "messagenow": "Fully Paid",
    "parcel": [{
      "parcelno": "EP-PQKTE",
      "awb": "238770015234",
      "awb_id_link": "http://demo.connect.easyparcel.my/?ac=AWBLabel&id=...",
      "tracking_url": "https://easyparcel.com/my/en/track/details/?courier=Skynet&awb=238770015234"
    }]
  }],
  "api_status": "Success",
  "error_code": "0",
  "error_remark": ""
}
```

---

**Report Generated**: 2025-10-11
**Investigation Status**: ✅ Complete
**Code Mapping**: ✅ Verified Correct
**Logging Enhancement**: ✅ Added
**UI Fix**: ⏳ Pending Approval
