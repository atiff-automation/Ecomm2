# Service Detail & Dropoff Point Implementation

## Overview

This document describes the systematic implementation of proper `service_detail` field support and dropoff point functionality based on official EasyParcel API documentation and WooCommerce plugin analysis.

## Background

### Problem Identified
The courier listing API response was incorrectly using `serviceType: "Pick-up"` when the actual EasyParcel API uses:
- `service_type`: Indicates the type of shipment ('parcel' or 'document')
- `service_detail`: Indicates the pickup/dropoff method ('pickup', 'dropoff', or 'dropoff or pickup')

### Important Clarification

**Courier List vs Rate Checking:**
- **EPCourierList API** (courier listing): Returns only courier IDs and names - NO service_detail information
- **EPRateCheckingBulk API** (rate checking): Returns service_detail, dropoff_point, pickup_point for each courier service

**Why?**
A single courier (e.g., "J&T Express") may offer multiple services:
- Service A: "J&T Express Standard" - `service_detail: "pickup"`
- Service B: "J&T Express Drop-off" - `service_detail: "dropoff"`
- Service C: "J&T Express Flexible" - `service_detail: "dropoff or pickup"`

The `service_detail` is **service-specific**, not courier-specific. You only discover available service types when checking rates for a specific destination.

### Official API Response Structure

```json
{
  "service_id": "123",
  "courier_name": "City-Link Express",
  "service_type": "parcel",          // Type: parcel or document
  "service_detail": "pickup",         // Method: pickup, dropoff, or dropoff or pickup
  "dropoff_point": [                 // Available when service_detail includes 'dropoff'
    {
      "point_id": "CL-KL-001",
      "point_name": "City-Link Drop-Off - Mid Valley",
      "point_addr1": "Mid Valley Megamall, Ground Floor",
      "point_city": "Kuala Lumpur",
      "point_postcode": "58000",
      "start_time": "10:00",
      "end_time": "22:00",
      "price_difference": -2.50      // Cheaper by RM 2.50
    }
  ],
  "pickup_point": [],                // Available pickup locations
  "price": 5.50
}
```

## Implementation Changes

### 1. API Integration Specs (`API_INTEGRATION_SPECS.md`)

**Added:**
- `service_detail` field to `CourierRate` interface
- `DropoffPoint` interface with full location details
- `PickupPoint` interface for pickup locations
- `dropoff_point` and `pickup_point` arrays to rate response

```typescript
interface CourierRate {
  service_type: string;            // 'parcel', 'document'
  service_detail: string;          // 'pickup', 'dropoff', 'dropoff or pickup'
  dropoff_point?: DropoffPoint[];  // Dropoff locations
  pickup_point?: PickupPoint[];    // Pickup locations
}
```

### 2. TypeScript Types (`src/lib/shipping/types.ts`)

**Added:**
- `DropoffPoint` export interface
- `PickupPoint` export interface
- `serviceDetail` field to `ShippingOption`
- `dropoffPoints` and `pickupPoints` arrays to `ShippingOption`
- Updated `EasyParcelRateService` with correct field names

**Updated:**
- `serviceType` comment to clarify it's 'parcel' or 'document'
- Added `serviceDetail` for pickup/dropoff method

### 3. Database Schema (`prisma/schema.prisma`)

**Shipment Model:**
```prisma
model Shipment {
  serviceType          String             // 'parcel' or 'document'
  serviceDetail        String             // 'pickup', 'dropoff', 'dropoff or pickup'
  selectedDropoffPoint Json?              // Dropoff point details if applicable
}
```

**Order Model:**
```prisma
model Order {
  courierServiceType       String?        // 'parcel' or 'document'
  courierServiceDetail     String?        // 'pickup', 'dropoff', 'dropoff or pickup'
  selectedDropoffPointId   String?        // Dropoff point ID if applicable
}
```

### 4. Constants & Validation (`src/lib/shipping/constants.ts`)

**Added:**
```typescript
export const SERVICE_TYPES = {
  PARCEL: 'parcel',
  DOCUMENT: 'document',
} as const;

export const SERVICE_DETAILS = {
  PICKUP: 'pickup',
  DROPOFF: 'dropoff',
  PICKUP_OR_DROPOFF: 'dropoff or pickup',
} as const;

// Helper functions
export function isValidServiceDetail(value: string): value is ServiceDetail
export function supportsDropoff(serviceDetail: string): boolean
export function supportsPickup(serviceDetail: string): boolean
```

### 5. Rate Calculation API (`src/app/api/shipping/calculate/route.ts`)

**Updated:**
```typescript
let shippingOptions: ShippingOption[] = rates.map((rate) => ({
  serviceId: rate.service_id,
  courierName: rate.courier_name,
  serviceType: rate.service_type,           // 'parcel' or 'document'
  serviceDetail: rate.service_detail,       // 'pickup', 'dropoff', etc.
  dropoffPoints: rate.dropoff_point,        // Dropoff locations
  pickupPoints: rate.pickup_point,          // Pickup locations
  cost: freeShippingApplied ? 0 : rate.price,
  // ... rest
}));
```

## Benefits

### 1. **Accurate Field Mapping**
- Matches EasyParcel official API structure
- Aligns with WooCommerce plugin implementation
- Prevents confusion between service type and service detail

### 2. **Dropoff Point Support**
- Enables cost savings (dropoff typically RM 2-5 cheaper than pickup)
- Provides flexibility for high-volume sellers
- Includes full location details (address, operating hours, GPS coordinates)

### 3. **Type Safety**
- Proper TypeScript types with validation
- Constants prevent typos
- Helper functions for service capability checks

### 4. **Future Extensibility**
- Foundation for dropoff point selection UI
- Support for hybrid services ('dropoff or pickup')
- Ready for multi-point delivery features

## Where Service Detail Appears

### ✅ Rate Checking API (Checkout Flow)
When customers check shipping rates during checkout, the response includes:
```json
{
  "options": [
    {
      "courierName": "J&T Express",
      "serviceDetail": "pickup",          // ✅ Shows here
      "dropoffPoints": [],                // Empty for pickup-only
      "cost": 5.50
    },
    {
      "courierName": "City-Link Express",
      "serviceDetail": "dropoff or pickup", // ✅ Hybrid service
      "dropoffPoints": [                   // ✅ Dropoff locations available
        {
          "point_name": "City-Link Drop-Off - Mid Valley",
          "price_difference": -2.50        // RM 2.50 cheaper
        }
      ],
      "cost": 4.80
    }
  ]
}
```

### ❌ Courier List API (Admin Settings)
When admin loads courier list in shipping settings, the response is:
```json
{
  "couriers": [
    {
      "courierId": "123",
      "name": "J&T Express"              // ❌ No service_detail here
    },
    {
      "courierId": "456",
      "name": "City-Link Express"        // ❌ No service_detail here
    }
  ]
}
```

**Why?** The courier list is destination-independent. Service availability (pickup/dropoff) depends on:
- Customer's delivery address
- Courier's service coverage in that area
- Current operational constraints

### Admin UI Solution
Added informational notes in shipping settings page explaining:
- Service types are determined during checkout
- Each courier may offer different service types per destination
- Customers will see available options (pickup/dropoff) based on their address

## Next Steps (Not Implemented Yet)

### 1. Checkout UI Enhancement
Update `ShippingSelector.tsx` to:
- Display service detail badge (Pickup/Dropoff/Both)
- Show dropoff point selector when `dropoffPoints` array exists
- Highlight cost savings for dropoff options (show `price_difference`)
- Allow customer to select preferred dropoff location

### 2. Admin Fulfillment Widget
Update `FulfillmentWidget.tsx` to:
- Display selected dropoff point (if customer chose dropoff during checkout)
- Show dropoff location details (address, hours)
- Allow admin to see dropoff point for order fulfillment

### 3. Order Creation
Update order creation flow to:
- Store selected dropoff point ID in `Order.selectedDropoffPointId`
- Include dropoff point in `Shipment.selectedDropoffPoint` JSON field
- Display dropoff point in order confirmation emails

### 4. Shipment Creation
Update shipment creation to:
- Include dropoff point in EasyParcel API payload
- Send `pick_point` parameter with selected dropoff point ID
- Handle dropoff-specific fulfillment flow

### 5. Documentation Updates
- Update `claudedocs/shipping/spec/12-api-endpoints.md` with service_detail examples
- Update `SHIPPING_COMPREHENSIVE_AUDIT.md` with dropoff support status
- Add dropoff point selection to user guides and admin documentation

## Testing Checklist

- [x] Database schema updated with new fields
- [x] TypeScript types include service_detail and dropoff points
- [x] Constants and validation functions added
- [x] Rate calculation API maps fields correctly
- [ ] Checkout UI displays service detail correctly
- [ ] Dropoff points rendered when available
- [ ] Order stores dropoff point selection
- [ ] Shipment creation includes dropoff point
- [ ] Admin can view customer's dropoff choice

## References

- Official API: `https://developers.easyparcel.com`
- WooCommerce Plugin: Analyzed `have_dropoff` and `getCourierDropoffList` implementations
- API Documentation: Rate checking response structure (`EPRateCheckingBulk`)

## Code Quality Standards

✅ **DRY Principle**: Single source of truth for service detail values in constants
✅ **Type Safety**: Proper TypeScript interfaces with validation
✅ **Centralized**: All service detail logic in `constants.ts`
✅ **Documentation**: Clear comments explaining field purposes
✅ **Backwards Compatible**: Existing code continues to work, new fields are additive

---

**Implementation Date:** 2025-10-08
**Status:** Core types and schema updated, UI integration pending
