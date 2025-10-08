# Shipping & BusinessProfile Integration - Single Source of Truth

**Status**: Backend Complete ✅ | Frontend In Progress 🟡

## Summary

Implemented single source of truth for pickup address by integrating BusinessProfile.shippingAddress with EasyParcel shipping settings.

## Completed Changes

### ✅ Backend (Phase 1)

1. **Created `business-profile-integration.ts`**
   - `getPickupAddressFromBusinessProfile()` - Fetch address from BusinessProfile
   - `validatePickupAddress()` - Validate address meets EasyParcel requirements
   - `isPickupAddressConfigured()` - Quick check for valid address
   - `getPickupAddressOrThrow()` - Get with validation, throws if invalid

2. **Updated `types.ts`**
   - Removed pickup address fields from `ShippingSettings` interface
   - Added documentation noting BusinessProfile as source
   - Removed pickup fields from `ShippingSettingsRequest`

3. **Updated `shipping-settings.ts`**
   - Removed address validation from `validateShippingSettings()`
   - Updated `getDefaultShippingSettings()` to remove address fields
   - Added comments directing to BusinessProfile for pickup address

4. **Updated API Routes**
   - `settings/route.ts`: Added pickup address validation before save
   - Created `pickup-address/route.ts`: New endpoint to fetch pickup address with validation status

5. **Updated Validation Schema**
   - Removed all pickup address fields from `ShippingSettingsSchema`
   - Kept only: apiKey, environment, courier selection, free shipping, automation

## Pending Changes

### 🟡 Frontend (Phase 2)

Need to update `/admin/shipping-settings/page.tsx`:

1. **Remove pickup address form fields**
2. **Add new pickup address display section** (read-only)
3. **Fetch pickup address from new API endpoint**
4. **Show validation status with errors/warnings**
5. **Add alert banner linking to Business Profile settings**
6. **Update form submission** (remove address fields from body)

## Field Mapping

| EasyParcel Requirement | BusinessProfile Source |
|---|---|
| Business Name | `tradingName \|\| legalName` |
| Phone | `primaryPhone` |
| Address Line 1 | `shippingAddress.addressLine1` |
| Address Line 2 | `shippingAddress.addressLine2` |
| City | `shippingAddress.city` |
| State | `shippingAddress.state` |
| Postal Code | `shippingAddress.postalCode` |
| Country | `shippingAddress.country` (always 'MY') |

## API Endpoints

### New: GET `/api/admin/shipping/pickup-address`
Returns:
```json
{
  "success": true,
  "data": {
    "pickupAddress": { /* PickupAddress object or null */ },
    "validation": {
      "isValid": boolean,
      "errors": string[],
      "warnings": string[]
    }
  }
}
```

### Modified: POST `/api/admin/shipping/settings`
- Now validates pickup address from BusinessProfile before saving
- Returns `INVALID_PICKUP_ADDRESS` error if validation fails
- Removed pickup address fields from request body schema

## Next Steps

Continue implementing frontend changes:
1. Update shipping-settings page UI
2. Add validation checks and user guidance
3. Test complete integration flow
4. Verify Phase 1 settings persist correctly
