# State-Based Free Shipping - Complete Implementation Guide

**Feature:** Add state-based eligibility restrictions for free shipping
**Developer Guide Version:** 1.0
**Date:** 2025-11-04
**Estimated Time:** 2-3 hours
**Complexity:** Medium

---

## 🎯 OBJECTIVE

Add the ability for admin to restrict free shipping to selected Malaysian states only. If a customer's delivery state is not in the eligible list, free shipping will not be applied regardless of order value.

### Business Logic
```
BEFORE: Free Shipping = enabled && threshold && orderValue >= threshold
AFTER:  Free Shipping = enabled && threshold && stateEligible && orderValue >= threshold
```

### Example
- Admin selects: Kuala Lumpur, Selangor, Penang (excludes Sarawak)
- Customer in KUL with RM 200 → ✅ Free shipping
- Customer in Sarawak with RM 200 → ❌ Regular shipping (silent)

---

## ⚠️ MANDATORY: READ BEFORE STARTING

### 🔴 CRITICAL REQUIREMENTS

1. **Follow CLAUDE.md Standards**
   - Read `/Users/atiffriduan/Desktop/EcomJRM/CLAUDE.md`
   - Read `/Users/atiffriduan/Desktop/EcomJRM/claudedocs/CODING_STANDARDS.md`
   - ALL code MUST comply with these standards

2. **Coding Principles (Non-Negotiable)**
   - ✅ Single Source of Truth - No duplication
   - ✅ No Hardcoding - Use constants
   - ✅ Type Safety - No `any` types
   - ✅ Three-Layer Validation - Frontend → API → Database
   - ✅ DRY, SOLID, KISS principles
   - ✅ All async operations have try-catch
   - ✅ All inputs validated with Zod

3. **Testing Requirements**
   - ✅ Test after EACH step
   - ✅ Verify TypeScript compilation
   - ✅ Run manual tests before proceeding
   - ✅ Keep git status clean

---

## 📋 PRE-IMPLEMENTATION CHECKLIST

**Complete these BEFORE writing any code:**

- [ ] Read this entire document (don't skip ahead)
- [ ] Read CLAUDE.md and CODING_STANDARDS.md
- [ ] Create a new git branch: `git checkout -b feat/state-based-free-shipping`
- [ ] Ensure dev server is running: `npm run dev`
- [ ] Backup current shipping settings (screenshot admin page)
- [ ] Have access to admin panel at `/admin/shipping-settings`
- [ ] Set a timer - work in focused blocks
- [ ] Clear your terminal for clean output

**Verification Commands:**
```bash
# Check you're on correct branch
git branch

# Verify no uncommitted changes
git status

# Confirm dev server works
curl http://localhost:3000/api/health || echo "Start dev server first!"
```

---

## 🏗️ IMPLEMENTATION STEPS

### PHASE 1: TYPE DEFINITIONS (Foundation)

#### STEP 1.1: Update Shipping Types

**File:** `src/lib/shipping/types.ts`
**Location:** Line 56 (in ShippingSettings interface)
**Action:** Add new field

**Find this section:**
```typescript
export interface ShippingSettings {
  // ... existing fields ...

  // Free Shipping Configuration
  freeShippingEnabled: boolean;
  freeShippingThreshold?: number; // Minimum order amount in RM

  // Automation Settings
  autoUpdateOrderStatus: boolean;
```

**Add AFTER `freeShippingThreshold`:**
```typescript
export interface ShippingSettings {
  // ... existing fields ...

  // Free Shipping Configuration
  freeShippingEnabled: boolean;
  freeShippingThreshold?: number; // Minimum order amount in RM
  freeShippingEligibleStates?: MalaysianStateCode[]; // Whitelist of states eligible for free shipping

  // Automation Settings
  autoUpdateOrderStatus: boolean;
```

**Verification:**
1. Save file
2. Check terminal for TypeScript errors
3. Run: `npx tsc --noEmit` (should pass)
4. Verify `MalaysianStateCode` is imported from constants (it should already be at top of file)

**Expected Output:**
```
✅ No TypeScript errors
✅ File compiles successfully
```

**If errors:** Stop and fix before proceeding. Common issues:
- Missing import: Add `import type { MalaysianStateCode } from './constants';`
- Syntax error: Check for missing commas or brackets

---

#### STEP 1.2: Update TypeScript Export

**File:** Same file `src/lib/shipping/types.ts`
**Action:** Verify `ShippingSettings` is exported

**Check line 27:**
```typescript
export interface ShippingSettings {
```

✅ **Already exported** - No change needed.

**Verification:**
```bash
# Search for exports
grep "export interface ShippingSettings" src/lib/shipping/types.ts
```

Expected: Shows the export statement

---

### PHASE 2: VALIDATION LAYER (Enforcement)

#### STEP 2.1: Update Validation Schema

**File:** `src/lib/shipping/validation.ts`
**Location:** In `ShippingSettingsValidationSchema` definition

**Step 2.1a: Add Import at Top**

Find the imports section (top of file) and verify these exist:
```typescript
import { z } from 'zod';
import { MALAYSIAN_STATES } from './constants';
```

If `MALAYSIAN_STATES` is not imported, add it.

**Step 2.1b: Create Valid State Codes Constant**

Add this BEFORE the `ShippingSettingsValidationSchema`:

```typescript
// Valid Malaysian state codes for validation
const VALID_STATE_CODES = Object.keys(MALAYSIAN_STATES) as [string, ...string[]];
```

**Step 2.1c: Add Validation Rule**

Find the schema (search for `freeShippingThreshold`):

```typescript
export const ShippingSettingsValidationSchema = z.object({
  // ... existing fields ...

  freeShippingEnabled: z.boolean(),
  freeShippingThreshold: z.number().min(0).optional(),

  // ... rest of schema
});
```

**Add AFTER `freeShippingThreshold`:**

```typescript
export const ShippingSettingsValidationSchema = z.object({
  // ... existing fields ...

  freeShippingEnabled: z.boolean(),
  freeShippingThreshold: z.number().min(0).optional(),

  // State-based eligibility validation
  freeShippingEligibleStates: z
    .array(z.enum(VALID_STATE_CODES))
    .optional()
    .refine(
      (states) => {
        // Empty array not allowed - must select at least one state or leave undefined
        if (states !== undefined && states.length === 0) {
          return false;
        }
        return true;
      },
      {
        message:
          'At least one state must be selected for free shipping eligibility. ' +
          'To disable free shipping, uncheck "Enable free shipping" instead.',
      }
    ),

  // ... rest of schema
});
```

**Verification:**
1. Save file
2. Run: `npx tsc --noEmit`
3. Check for validation errors

**Test the validation:**
```typescript
// You can test in browser console later:
// ShippingSettingsValidationSchema.parse({
//   freeShippingEnabled: true,
//   freeShippingThreshold: 150,
//   freeShippingEligibleStates: [] // Should fail
// });
```

**Expected Output:**
```
✅ TypeScript compiles
✅ No linting errors
```

---

### PHASE 3: API LOGIC (Business Rules)

#### STEP 3.1: Update Shipping Calculate Route

**File:** `src/app/api/shipping/calculate/route.ts`
**Location:** Multiple changes needed

**Step 3.1a: Add Import**

Find the imports section (top of file, around lines 13-32) and verify:

```typescript
import type {
  ShippingOption,
  ShippingCalculationResult,
  DeliveryAddress,
  MalaysianStateCode, // ← ADD THIS if not present
} from '@/lib/shipping/types';
```

If `MalaysianStateCode` is not in the import, add it.

**Step 3.1b: Replace Free Shipping Check**

Find this code (around line 151-156):

```typescript
// Check if free shipping eligibility
// orderValue should be cart total (after discounts, before tax/shipping)
const freeShippingApplied =
  settings.freeShippingEnabled &&
  settings.freeShippingThreshold &&
  orderValue >= settings.freeShippingThreshold;
```

**REPLACE with:**

```typescript
// Check if free shipping eligibility (with state-based restrictions)
// orderValue should be cart total (after discounts, before tax/shipping)
const freeShippingApplied = checkFreeShippingEligibility(
  settings,
  deliveryAddress.state,
  orderValue
);
```

**Step 3.1c: Add Helper Function**

Scroll to the END of the file (before the exports section).

Find this:
```typescript
export const GET = handleGET;
export const POST = handlePOST;
export const PUT = handlePUT;
export const DELETE = handleDELETE;
```

**Add this helper function BEFORE the exports:**

```typescript
/**
 * Check if order qualifies for free shipping
 *
 * Implements multi-tier eligibility check:
 * 1. Feature must be enabled globally (toggle overrides all)
 * 2. Threshold must be configured
 * 3. Delivery state must be eligible (if state restrictions configured)
 * 4. Order value must meet threshold
 *
 * @param settings - Shipping settings from database (SystemConfig)
 * @param deliveryState - Customer's delivery state code (e.g., 'kul', 'srw')
 * @param orderValue - Cart total after discounts, before tax/shipping
 * @returns true if free shipping should be applied, false otherwise
 *
 * @example
 * // State restrictions enabled - KUL eligible, SRW not
 * checkFreeShippingEligibility(
 *   { freeShippingEnabled: true, freeShippingThreshold: 150, freeShippingEligibleStates: ['kul'] },
 *   'kul',
 *   200
 * ); // true
 *
 * checkFreeShippingEligibility(
 *   { freeShippingEnabled: true, freeShippingThreshold: 150, freeShippingEligibleStates: ['kul'] },
 *   'srw',
 *   200
 * ); // false (state not eligible)
 */
function checkFreeShippingEligibility(
  settings: {
    freeShippingEnabled: boolean;
    freeShippingThreshold?: number;
    freeShippingEligibleStates?: string[];
  },
  deliveryState: string,
  orderValue: number
): boolean {
  // TIER 1: Feature toggle check (overrides everything)
  if (!settings.freeShippingEnabled) {
    console.log('[FreeShipping] Feature disabled globally');
    return false;
  }

  // TIER 2: Threshold configuration check
  if (!settings.freeShippingThreshold) {
    console.log('[FreeShipping] No threshold configured');
    return false;
  }

  // TIER 3: State-based eligibility check (NEW LOGIC)
  if (settings.freeShippingEligibleStates !== undefined) {
    // State restrictions are configured
    if (settings.freeShippingEligibleStates.length === 0) {
      // Empty array = free shipping disabled (safety check)
      console.log('[FreeShipping] Empty state list - feature effectively disabled');
      return false;
    }

    // Check if delivery state is in eligible list
    const isStateEligible = settings.freeShippingEligibleStates.includes(
      deliveryState
    );

    if (!isStateEligible) {
      // SILENT FAILURE: State not eligible, no error message to customer
      console.log('[FreeShipping] State not eligible for free shipping:', {
        deliveryState,
        eligibleStates: settings.freeShippingEligibleStates,
        stateCount: settings.freeShippingEligibleStates.length,
      });
      return false;
    }

    console.log('[FreeShipping] State eligibility verified:', {
      deliveryState,
      eligibleStates: settings.freeShippingEligibleStates,
    });
  } else {
    // No state restrictions configured = all states eligible (backwards compatible)
    console.log(
      '[FreeShipping] No state restrictions configured - all states eligible'
    );
  }

  // TIER 4: Order value threshold check
  if (orderValue < settings.freeShippingThreshold) {
    console.log('[FreeShipping] Order value below threshold:', {
      orderValue: `RM ${orderValue.toFixed(2)}`,
      threshold: `RM ${settings.freeShippingThreshold.toFixed(2)}`,
      shortfall: `RM ${(settings.freeShippingThreshold - orderValue).toFixed(2)}`,
    });
    return false;
  }

  // ALL CHECKS PASSED
  console.log('[FreeShipping] ✅ ELIGIBLE - All conditions met:', {
    orderValue: `RM ${orderValue.toFixed(2)}`,
    threshold: `RM ${settings.freeShippingThreshold.toFixed(2)}`,
    deliveryState,
    hasStateRestrictions: settings.freeShippingEligibleStates !== undefined,
  });

  return true;
}

// API exports - protection now handled by centralized middleware
export const GET = handleGET;
export const POST = handlePOST;
export const PUT = handlePUT;
export const DELETE = handleDELETE;
```

**Verification:**
1. Save file
2. Run: `npx tsc --noEmit`
3. Check for errors
4. Verify function is before exports

**Test in terminal:**
```bash
# Check function exists
grep -n "function checkFreeShippingEligibility" src/app/api/shipping/calculate/route.ts
```

Expected: Shows line number where function is defined

**Manual Test Plan:**
After implementation, test these scenarios:
1. All states eligible, RM 200 order → ✅ Free shipping
2. Only KUL eligible, KUL delivery, RM 200 → ✅ Free shipping
3. Only KUL eligible, SRW delivery, RM 200 → ❌ Regular shipping
4. Feature disabled → ❌ No free shipping regardless

---

### PHASE 4: ADMIN UI (Configuration Interface)

#### STEP 4.1: Update Shipping Settings Page

**File:** `src/app/admin/shipping-settings/page.tsx`
**Location:** Multiple sections

**Step 4.1a: Update Default Values**

Find the `useForm` hook initialization (around line 132-149):

```typescript
const {
  register,
  handleSubmit,
  formState: { errors, isDirty },
  reset,
  setValue,
  watch,
} = useForm<FormData>({
  resolver: zodResolver(shippingSettingsSchema),
  defaultValues: {
    environment: 'sandbox',
    courierSelectionMode: COURIER_SELECTION_STRATEGIES.CHEAPEST,
    freeShippingEnabled: true,
    freeShippingThreshold: 150,
    autoUpdateOrderStatus: true,
    whatsappNotificationsEnabled: false,
  },
});
```

**UPDATE defaultValues to:**

```typescript
const {
  register,
  handleSubmit,
  formState: { errors, isDirty },
  reset,
  setValue,
  watch,
} = useForm<FormData>({
  resolver: zodResolver(shippingSettingsSchema),
  defaultValues: {
    environment: 'sandbox',
    courierSelectionMode: COURIER_SELECTION_STRATEGIES.CHEAPEST,
    freeShippingEnabled: true,
    freeShippingThreshold: 150,
    freeShippingEligibleStates: [], // NEW: Empty by default (no states selected)
    autoUpdateOrderStatus: true,
    whatsappNotificationsEnabled: false,
  },
});
```

**Step 4.1b: Add State Management Logic**

Add this code RIGHT AFTER the `useForm` declaration (after line 149):

```typescript
// Watch free shipping state for conditional UI rendering
const freeShippingEnabled = watch('freeShippingEnabled');
const freeShippingEligibleStates = watch('freeShippingEligibleStates') || [];

// Helper: Select all states for free shipping
const handleSelectAllStates = useCallback(() => {
  const allStateCodes = Object.keys(MALAYSIAN_STATES);
  setValue('freeShippingEligibleStates', allStateCodes, { shouldDirty: true });
}, [setValue]);

// Helper: Clear all state selections (disables free shipping)
const handleClearAllStates = useCallback(() => {
  setValue('freeShippingEligibleStates', [], { shouldDirty: true });
}, [setValue]);

// Helper: Toggle individual state selection
const handleToggleState = useCallback(
  (stateCode: string) => {
    const currentStates = freeShippingEligibleStates;
    const isCurrentlySelected = currentStates.includes(stateCode);

    const newStates = isCurrentlySelected
      ? currentStates.filter((s: string) => s !== stateCode) // Remove
      : [...currentStates, stateCode]; // Add

    setValue('freeShippingEligibleStates', newStates, { shouldDirty: true });
  },
  [freeShippingEligibleStates, setValue]
);
```

**Verification:**
1. Check imports at top of file include `useCallback` from React
2. Verify `MALAYSIAN_STATES` is imported from constants

**Add missing imports if needed:**
```typescript
import { useCallback } from 'react'; // Add to React import if not present
import { MALAYSIAN_STATES } from '@/lib/shipping/constants'; // Should already exist
```

**Step 4.1c: Add UI Components**

Find the Free Shipping section in the JSX (search for "freeShippingThreshold").

You should find something like:
```typescript
{/* Free Shipping Threshold */}
{freeShippingEnabled && (
  <div className="space-y-2">
    <Label htmlFor="freeShippingThreshold">
      Minimum Order Amount (RM)
    </Label>
    <Input
      id="freeShippingThreshold"
      type="number"
      step="0.01"
      {...register('freeShippingThreshold', {
        valueAsNumber: true,
      })}
    />
    {errors.freeShippingThreshold && (
      <p className="text-sm text-red-600">
        {errors.freeShippingThreshold.message}
      </p>
    )}
  </div>
)}
```

**Add this NEW section RIGHT AFTER the threshold input:**

```typescript
{/* State-Based Eligibility Configuration */}
{freeShippingEnabled && (
  <div className="space-y-4 border-t pt-6 mt-6">
    {/* Header */}
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2 flex-1">
        <Label className="text-base font-semibold">
          Eligible States for Free Shipping
        </Label>
        <p className="text-sm text-gray-600">
          Select which states qualify for free shipping. At least one state must be selected.
          If no states are selected, free shipping will be effectively disabled.
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAllStates}
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearAllStates}
        >
          Clear All
        </Button>
      </div>
    </div>

    {/* State Selection Grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {Object.entries(MALAYSIAN_STATES)
        .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB)) // Sort alphabetically
        .map(([code, name]) => {
          const isChecked = freeShippingEligibleStates.includes(code);
          return (
            <div
              key={code}
              className="flex items-center space-x-2"
            >
              <Checkbox
                id={`state-${code}`}
                checked={isChecked}
                onCheckedChange={() => handleToggleState(code)}
              />
              <Label
                htmlFor={`state-${code}`}
                className="text-sm font-normal cursor-pointer hover:text-blue-600 transition-colors"
              >
                {name}
              </Label>
            </div>
          );
        })}
    </div>

    {/* Validation Error Display */}
    {errors.freeShippingEligibleStates && (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {errors.freeShippingEligibleStates.message}
        </AlertDescription>
      </Alert>
    )}

    {/* Summary Information */}
    <div className="flex items-center gap-3 pt-2">
      <Badge variant="secondary" className="text-sm">
        {freeShippingEligibleStates.length} of {Object.keys(MALAYSIAN_STATES).length} states selected
      </Badge>
      {freeShippingEligibleStates.length === 0 && (
        <div className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Warning: Free shipping will be disabled (no states selected)
          </span>
        </div>
      )}
      {freeShippingEligibleStates.length > 0 && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">
            Free shipping available for selected states
          </span>
        </div>
      )}
    </div>
  </div>
)}
```

**Step 4.1d: Verify Required Imports**

Check the imports section at the top of the file. Ensure these are present:

```typescript
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
```

Add any missing imports.

**Verification:**
1. Save file
2. Run: `npx tsc --noEmit`
3. Check browser - admin page should load
4. No console errors

**Visual Test:**
1. Navigate to `/admin/shipping-settings`
2. Should see new "Eligible States" section
3. "Select All" and "Clear All" buttons work
4. Checkboxes toggle correctly
5. Badge shows count
6. Warning appears when no states selected

---

#### STEP 4.2: Update Settings Load Logic

**File:** Same file `src/app/admin/shipping-settings/page.tsx`

Find the settings initialization effect (search for `initData?.settings`):

```typescript
useEffect(() => {
  if (initData?.settings) {
    reset({
      apiKey: initData.settings.apiKey || '',
      environment: initData.settings.environment || 'sandbox',
      courierSelectionMode:
        initData.settings.courierSelectionMode ||
        COURIER_SELECTION_STRATEGIES.CHEAPEST,
      freeShippingEnabled: initData.settings.freeShippingEnabled ?? true,
      freeShippingThreshold: initData.settings.freeShippingThreshold || 150,
      autoUpdateOrderStatus: initData.settings.autoUpdateOrderStatus ?? true,
      whatsappNotificationsEnabled:
        initData.settings.whatsappNotificationsEnabled ?? false,
    });
    // ... rest of code
  }
}, [initData, reset]);
```

**UPDATE to include the new field:**

```typescript
useEffect(() => {
  if (initData?.settings) {
    reset({
      apiKey: initData.settings.apiKey || '',
      environment: initData.settings.environment || 'sandbox',
      courierSelectionMode:
        initData.settings.courierSelectionMode ||
        COURIER_SELECTION_STRATEGIES.CHEAPEST,
      freeShippingEnabled: initData.settings.freeShippingEnabled ?? true,
      freeShippingThreshold: initData.settings.freeShippingThreshold || 150,
      freeShippingEligibleStates: initData.settings.freeShippingEligibleStates || [], // NEW
      autoUpdateOrderStatus: initData.settings.autoUpdateOrderStatus ?? true,
      whatsappNotificationsEnabled:
        initData.settings.whatsappNotificationsEnabled ?? false,
    });
    // ... rest of code
  }
}, [initData, reset]);
```

**Verification:**
- Settings should load from database correctly
- Empty array if no states previously configured

---

### PHASE 5: TESTING & VERIFICATION

#### STEP 5.1: TypeScript Compilation

```bash
# Full type check
npx tsc --noEmit

# Expected: No errors
```

If errors appear:
1. Read error message carefully
2. Check file and line number
3. Fix type issues
4. Re-run check

---

#### STEP 5.2: Linting Check

```bash
# Run linter
npm run lint

# Expected: No errors (or only existing warnings)
```

---

#### STEP 5.3: Build Test

```bash
# Test production build
npm run build

# Expected: Build completes successfully
```

If build fails:
1. Read error output
2. Fix issues
3. Rebuild

---

#### STEP 5.4: Manual Testing Scenarios

**Test 1: Admin Configuration**

1. Navigate to: `http://localhost:3000/admin/shipping-settings`
2. Enable free shipping
3. Set threshold: RM 150
4. Click "Select All" → All 16 states checked ✅
5. Click "Clear All" → All states unchecked, warning appears ✅
6. Select only: Kuala Lumpur, Selangor, Penang
7. Badge shows: "3 of 16 states selected" ✅
8. Click Save
9. Refresh page → Settings persist ✅

**Expected Database:**
```json
{
  "freeShippingEnabled": true,
  "freeShippingThreshold": 150,
  "freeShippingEligibleStates": ["kul", "sgr", "png"]
}
```

**Test 2: Customer Checkout - Eligible State**

1. Add RM 200 worth of items to cart
2. Go to checkout
3. Enter shipping address:
   - State: Kuala Lumpur
   - Postcode: 50000
4. Wait for shipping calculation
5. **Expected:** Shows "🎉 FREE SHIPPING" ✅
6. Shipping cost: RM 0.00 ✅

**Test 3: Customer Checkout - Ineligible State**

1. Same cart (RM 200)
2. Change shipping address:
   - State: Sarawak
   - Postcode: 93000
3. Wait for shipping calculation
4. **Expected:** Shows regular shipping cost (e.g., RM 15.00) ✅
5. No error message (silent) ✅
6. No "free shipping" badge ✅

**Test 4: State Change During Checkout**

1. Cart with RM 200
2. Enter Kuala Lumpur address → Free shipping shows ✅
3. Change to Sarawak → Shipping recalculates ✅
4. Regular cost appears (silent transition) ✅

**Test 5: Below Threshold**

1. Cart with RM 100
2. Enter Kuala Lumpur address (eligible state)
3. **Expected:** Regular shipping cost ✅
4. Does not qualify (below RM 150 threshold) ✅

**Test 6: Feature Disabled**

1. Admin: Disable "Enable free shipping" checkbox
2. Save settings
3. Customer: RM 200 cart, eligible state
4. **Expected:** Regular shipping cost ✅
5. State configuration ignored ✅

**Test 7: Backwards Compatibility**

1. Admin: Don't select any states
2. Clear database field manually if needed:
```sql
-- This simulates old settings without state field
UPDATE "SystemConfig"
SET value = jsonb_set(value::jsonb, '{freeShippingEligibleStates}', 'null'::jsonb)
WHERE key = 'shipping_settings';
```
3. Customer checkout
4. **Expected:** All states eligible (undefined = unrestricted) ✅

**Test 8: Empty Array Validation**

1. Admin: Try to save with no states selected
2. **Expected:** Validation error shows ✅
3. Message: "At least one state must be selected..." ✅
4. Form does not submit ✅

---

#### STEP 5.5: API Testing

Test the API directly using curl or Postman:

```bash
# Test 1: Eligible state with sufficient order value
curl -X POST http://localhost:3000/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryAddress": {
      "name": "Test User",
      "phone": "0123456789",
      "addressLine1": "123 Test Street",
      "city": "Kuala Lumpur",
      "state": "kul",
      "postalCode": "50000",
      "country": "MY"
    },
    "items": [{"productId": "test-id", "quantity": 1}],
    "orderValue": 200
  }'

# Expected response includes: "freeShippingApplied": true
```

```bash
# Test 2: Ineligible state
curl -X POST http://localhost:3000/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryAddress": {
      "name": "Test User",
      "phone": "0123456789",
      "addressLine1": "123 Test Street",
      "city": "Kuching",
      "state": "srw",
      "postalCode": "93000",
      "country": "MY"
    },
    "items": [{"productId": "test-id", "quantity": 1}],
    "orderValue": 200
  }'

# Expected response includes: "freeShippingApplied": false
```

---

#### STEP 5.6: Console Log Verification

Check browser console and terminal logs:

**Expected logs for eligible state:**
```
[FreeShipping] No state restrictions configured - all states eligible
[FreeShipping] ✅ ELIGIBLE - All conditions met: {orderValue: "RM 200.00", ...}
```

**Expected logs for ineligible state:**
```
[FreeShipping] State not eligible for free shipping: {deliveryState: "srw", ...}
```

---

### PHASE 6: CODE REVIEW CHECKLIST

Before submitting PR, verify:

**Architecture & Standards:**
- [ ] Follows CLAUDE.md principles
- [ ] Single source of truth (uses MALAYSIAN_STATES constant)
- [ ] No hardcoded values
- [ ] Type-safe (no `any` types)
- [ ] Three-layer validation implemented

**Code Quality:**
- [ ] Functions have JSDoc comments
- [ ] Console logs for debugging
- [ ] Error handling in place
- [ ] Consistent naming conventions
- [ ] DRY - no code duplication

**Testing:**
- [ ] All manual tests pass
- [ ] TypeScript compiles without errors
- [ ] Linter passes
- [ ] Build succeeds
- [ ] Admin UI works correctly
- [ ] Customer checkout works correctly

**Database:**
- [ ] Settings save correctly
- [ ] Settings load correctly
- [ ] Backwards compatible with old data

**User Experience:**
- [ ] Admin UI is intuitive
- [ ] State selection works smoothly
- [ ] Customer sees no error messages (silent)
- [ ] Shipping recalculates correctly

---

### PHASE 7: GIT WORKFLOW

#### Commit Strategy

**Commit 1: Type definitions and validation**
```bash
git add src/lib/shipping/types.ts
git add src/lib/shipping/validation.ts
git commit -m "feat(shipping): add state-based eligibility types and validation

- Add freeShippingEligibleStates field to ShippingSettings
- Add Zod validation for state codes array
- Enforce minimum one state selection rule
- Backwards compatible with undefined (all states eligible)

Ref: STATE_BASED_FREE_SHIPPING_IMPLEMENTATION_GUIDE.md"
```

**Commit 2: API business logic**
```bash
git add src/app/api/shipping/calculate/route.ts
git commit -m "feat(shipping): implement state-based free shipping eligibility

- Add checkFreeShippingEligibility() helper function
- Implement four-tier eligibility check
- Add state restriction validation
- Silent failure for ineligible states (per requirements)
- Comprehensive logging for debugging

Ref: STATE_BASED_FREE_SHIPPING_IMPLEMENTATION_GUIDE.md"
```

**Commit 3: Admin UI**
```bash
git add src/app/admin/shipping-settings/page.tsx
git commit -m "feat(shipping): add state selection UI in admin settings

- Add state eligibility checkbox grid (16 Malaysian states)
- Implement Select All / Clear All helpers
- Add validation error display
- Show selection summary with badge
- Warning for empty selection

Ref: STATE_BASED_FREE_SHIPPING_IMPLEMENTATION_GUIDE.md"
```

**Commit 4: Documentation**
```bash
git add claudedocs/implementation/STATE_BASED_FREE_SHIPPING_IMPLEMENTATION_GUIDE.md
git commit -m "docs(shipping): add implementation guide for state-based free shipping

Ref: STATE_BASED_FREE_SHIPPING_IMPLEMENTATION_GUIDE.md"
```

---

### PHASE 8: DEPLOYMENT CHECKLIST

**Pre-deployment:**
- [ ] All tests pass
- [ ] Code reviewed and approved
- [ ] Merged to main branch
- [ ] No merge conflicts

**Deployment:**
- [ ] Database backup created
- [ ] Current shipping settings documented
- [ ] Deploy to staging first
- [ ] Test on staging environment
- [ ] Deploy to production

**Post-deployment:**
- [ ] Verify admin can configure states
- [ ] Test sample orders in production
- [ ] Monitor logs for errors
- [ ] Document new feature for support team

---

## 🚨 ROLLBACK PROCEDURE

If something goes wrong:

### Quick Rollback (Git)
```bash
# Identify last working commit
git log --oneline

# Revert to previous state
git revert <commit-hash>

# Or reset branch (if not pushed)
git reset --hard <commit-hash>
```

### Database Rollback
```sql
-- Remove state restrictions from existing settings
UPDATE "SystemConfig"
SET value = value::jsonb - 'freeShippingEligibleStates'
WHERE key = 'shipping_settings';
```

### Emergency Fix
1. Disable feature in admin: Uncheck "Enable free shipping"
2. This bypasses all state checks
3. Investigate and fix issues
4. Re-enable when resolved

---

## 📚 REFERENCE

### File Locations
| Component | File Path |
|-----------|-----------|
| Type Definitions | `src/lib/shipping/types.ts` |
| Validation | `src/lib/shipping/validation.ts` |
| API Logic | `src/app/api/shipping/calculate/route.ts` |
| Admin UI | `src/app/admin/shipping-settings/page.tsx` |
| Constants | `src/lib/shipping/constants.ts` |

### Key Constants
```typescript
// Malaysian States (16 total)
MALAYSIAN_STATES = {
  jhr: 'Johor',
  kdh: 'Kedah',
  ktn: 'Kelantan',
  mlk: 'Melaka',
  nsn: 'Negeri Sembilan',
  phg: 'Pahang',
  prk: 'Perak',
  pls: 'Perlis',
  png: 'Penang',
  sgr: 'Selangor',
  trg: 'Terengganu',
  kul: 'Kuala Lumpur',
  pjy: 'Putrajaya',
  srw: 'Sarawak',
  sbh: 'Sabah',
  lbn: 'Labuan',
}
```

### Database Structure
```json
{
  "freeShippingEnabled": true,
  "freeShippingThreshold": 150,
  "freeShippingEligibleStates": ["kul", "sgr", "png"]
}
```

---

## 💡 TIPS FOR SUCCESS

1. **Work in Order:** Don't skip steps. Each builds on the previous.

2. **Test Frequently:** After each file change, verify it compiles.

3. **Use Console Logs:** They're your debugging friends.

4. **Read Error Messages:** TypeScript errors are usually very clear.

5. **Take Breaks:** If stuck for >15 minutes, take a break.

6. **Ask Questions:** If unclear, ask before proceeding.

7. **Backup Settings:** Screenshot admin settings before testing.

8. **Use Git:** Commit frequently so you can rollback easily.

9. **Follow CLAUDE.md:** Re-read coding standards if unsure.

10. **Be Systematic:** Check off items as you complete them.

---

## ✅ COMPLETION CHECKLIST

**Implementation:**
- [ ] Step 1.1: Updated ShippingSettings type
- [ ] Step 1.2: Verified type export
- [ ] Step 2.1: Updated validation schema
- [ ] Step 3.1: Updated API route
- [ ] Step 4.1: Updated admin UI
- [ ] Step 4.2: Updated settings load logic

**Testing:**
- [ ] TypeScript compilation passes
- [ ] Linting passes
- [ ] Build succeeds
- [ ] All 8 manual tests pass
- [ ] API tests pass
- [ ] Console logs verified

**Quality:**
- [ ] Code review checklist complete
- [ ] No hardcoded values
- [ ] Single source of truth maintained
- [ ] Type-safe implementation
- [ ] Follows CLAUDE.md standards

**Git:**
- [ ] All changes committed
- [ ] Descriptive commit messages
- [ ] Branch ready for PR
- [ ] No merge conflicts

**Documentation:**
- [ ] Implementation guide saved
- [ ] Code comments added
- [ ] README updated (if needed)

---

## 📞 SUPPORT

**If you encounter issues:**

1. Check the specific step's verification section
2. Review TypeScript error messages
3. Check browser console for runtime errors
4. Verify all imports are correct
5. Ensure dev server is running
6. Clear browser cache if needed

**Common Issues:**

| Issue | Solution |
|-------|----------|
| TypeScript error | Check imports, verify type definitions |
| Validation fails | Check Zod schema matches types |
| UI not showing | Verify conditional rendering with freeShippingEnabled |
| Settings don't save | Check form data structure matches schema |
| Free shipping not applying | Check console logs for eligibility checks |

---

**Good luck with implementation! Follow the steps carefully and you'll succeed.** 🚀

---

**Document Version:** 1.0
**Last Updated:** 2025-11-04
**Status:** Ready for Implementation
