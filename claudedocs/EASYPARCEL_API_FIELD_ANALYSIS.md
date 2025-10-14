# EasyParcel API Field Analysis: service_name vs courier_name

## Summary

EasyParcel API returns **different courier-related fields** across their three main API endpoints, causing confusion and data inconsistency issues.

---

## Field Comparison Across API Endpoints

### **1. EPRateCheckingBulk (Get Shipping Rates)**

**Purpose**: Get available shipping options for checkout

**Courier-Related Fields Returned**:
```json
{
  "service_id": "EP-CS0A5A",
  "service_name": "Pickupp",           ← Service brand name
  "courier_name": "Dropicks Sdn Bhd",  ← Legal company name
  "courier_id": "EP-CR0DL",
  "courier_logo": "https://.../Pickupp.jpg",
  "service_detail": "pickup"
}
```

**Key Fields**:
- ✅ `service_name`: Available
- ✅ `courier_name`: Available
- ✅ `courier_id`: Available

---

### **2. EPSubmitOrderBulk (Create Shipment)**

**Purpose**: Create shipping order (Step 1 of fulfillment)

**Courier-Related Fields Returned**:
```json
{
  "order_number": "EI-5CFV7",
  "parcel_number": "EP-AQOPLZ",
  "courier": "Pickupp",  ← ONLY THIS FIELD!
  "price": "6.78",
  "status": "Success"
}
```

**Key Fields**:
- ❌ `service_name`: NOT returned
- ❌ `courier_name`: NOT returned
- ✅ `courier`: Available (single field only)

---

### **3. EPPayOrderBulk (Pay for Order)**

**Purpose**: Process payment and generate AWB/tracking

**Courier-Related Fields Returned**:
```json
{
  "orderno": "EI-5CFV7",
  "messagenow": "Payment Done",
  "parcel": [
    {
      "parcelno": "EP-AQOPLZ",
      "awb": null,
      "awb_id_link": "https://...",
      "tracking_url": "https://easyparcel.rocks/my/en/track/details/?courier=Poslaju&awb="
    }
  ]
}
```

**Key Fields**:
- ❌ `service_name`: NOT returned
- ❌ `courier_name`: NOT returned
- ❌ `courier`: NOT returned
- ⚠️ `tracking_url` contains courier name in URL: "courier=Poslaju"

---

## What Do These Fields Mean?

### **`service_name`** (Only in Rate Check)
- **Definition**: The **service brand name** or **product name**
- **Example**: "Pickupp", "J&T Express", "Ninjavan"
- **Purpose**: Marketing/display name for the shipping service
- **Usage**: Show to customers during checkout

### **`courier_name`** (Only in Rate Check)
- **Definition**: The **legal registered company name** of the courier
- **Example**: "Dropicks Sdn Bhd", "J&T Express (Malaysia) Sdn. Bhd."
- **Purpose**: Official business entity handling the shipment
- **Usage**: Legal documentation, invoices, compliance

### **`courier`** (Only in Create Shipment)
- **Definition**: The **actual courier** assigned to handle the shipment
- **Example**: "Pickupp"
- **Purpose**: The real courier that will fulfill the order
- **Usage**: Internal tracking, operations

---

## The Dropicks/Pickupp Case Study

### What EasyParcel Returns:

| API Call | Field | Value | Meaning |
|----------|-------|-------|---------|
| **Rate Check** | `service_name` | `Pickupp` | Service brand |
| **Rate Check** | `courier_name` | `Dropicks Sdn Bhd` | Legal entity |
| **Create Shipment** | `courier` | `Pickupp` | Actual courier |
| **Pay Order** | (none) | - | No courier info |

### The Inconsistency Problem:

1. **At Checkout (Rate Check)**:
   - Customer sees: "Dropicks Sdn Bhd" (courier_name)
   - Service: "Pickupp" (service_name)

2. **At Fulfillment (Create Shipment)**:
   - EasyParcel returns: "Pickupp" (courier field)
   - Does NOT return "Dropicks Sdn Bhd"

3. **Result**:
   - Database saves: "Dropicks Sdn Bhd" (from checkout)
   - Actual courier: "Pickupp" (from EasyParcel)
   - **MISMATCH!**

---

## Why This Happens

### Theory 1: White Label / Reseller Relationship
- **Dropicks Sdn Bhd** = Parent company / Legal entity
- **Pickupp** = Operating brand / Service name
- EasyParcel's rate check shows the legal entity, but operations use the brand name

### Theory 2: Service Aggregation
- EasyParcel aggregates multiple courier services
- One `service_id` might map to multiple couriers
- The actual courier is determined at booking time (not rate check time)

### Theory 3: API Data Inconsistency
- EasyParcel's database has inconsistent data entry
- Rate check uses one data source (showing legal name)
- Shipment creation uses another data source (showing brand name)

---

## Impact on Your System

### Current Behavior:
```typescript
// During checkout (src/app/api/orders/route.ts:319-333)
courierName: orderData.selectedShipping.courierName  // "Dropicks Sdn Bhd"

// During fulfillment (src/app/api/admin/orders/[orderId]/fulfill/route.ts:492-494)
courierName: validatedData.overriddenByAdmin
  ? shipmentResponse.data.courier_name || order.courierName
  : order.courierName  // Keeps "Dropicks Sdn Bhd" (original)
```

### The Problem:
- **Saved**: "Dropicks Sdn Bhd"
- **Actual**: "Pickupp"
- Customer might go to wrong dropoff point or get confused tracking

---

## Recommendations

### **Option 1: Always Trust Create Shipment Response** ✅ RECOMMENDED
```typescript
// ALWAYS use the courier from EasyParcel's response
courierName: shipmentResponse.data.courier_name || shipmentResponse.data.courier || order.courierName
```

**Pros**:
- Uses actual courier handling the shipment
- Matches EasyParcel's internal system
- Reduces confusion

**Cons**:
- Different from what customer selected at checkout
- Might confuse customer if they remember checkout name

### **Option 2: Store Both Names**
```typescript
// Add new fields to Order model
courierDisplayName: "Dropicks Sdn Bhd"  // From checkout
courierActualName: "Pickupp"             // From EasyParcel
```

**Pros**:
- Maintains full audit trail
- Can show both names to admin/customer
- Best for transparency

**Cons**:
- Requires database migration
- More complexity

### **Option 3: Use service_name from Rate Check**
```typescript
// Store service_name instead of courier_name at checkout
courierName: orderData.selectedShipping.serviceName  // "Pickupp"
```

**Pros**:
- Matches what EasyParcel returns later
- Consistency across flow

**Cons**:
- Loses legal entity information
- Might not be clear which company is handling shipment

### **Option 4: Contact EasyParcel Support**
Report this inconsistency to EasyParcel and ask:
- Why is `courier_name` different from `courier` field?
- Which field should be used for customer-facing displays?
- Is Dropicks a parent company of Pickupp?

---

## Test Results

**Service ID**: EP-CS0A5A

| Stage | API | Field | Value |
|-------|-----|-------|-------|
| Checkout | EPRateCheckingBulk | service_name | Pickupp |
| Checkout | EPRateCheckingBulk | courier_name | Dropicks Sdn Bhd |
| Quote | EPSubmitOrderBulk | courier | Pickupp |
| Pay | EPPayOrderBulk | (none) | - |

**Conclusion**: courier_name changes between Rate Check and Create Shipment!

---

## Recommended Implementation

### Store service_name at checkout (most consistent):
```typescript
// src/app/api/orders/route.ts
courierName: orderData.selectedShipping.serviceName  // Use service_name, not courier_name
courierServiceType: orderData.selectedShipping.serviceType
```

### Update from EasyParcel response during fulfillment:
```typescript
// src/app/api/admin/orders/[orderId]/fulfill/route.ts
courierName: shipmentResponse.data.courier || order.courierName
```

This ensures:
- ✅ Consistency between checkout and fulfillment
- ✅ Uses actual courier handling the shipment
- ✅ Matches EasyParcel's internal system
- ✅ Reduces customer confusion

---

**Generated**: 2025-10-14
**Test Order**: EI-5CFV7
**Service ID Tested**: EP-CS0A5A (Pickupp/Dropicks)
