# Fulfillment Confirmation Dialog Implementation Plan

## 📋 Overview

Add a confirmation dialog that appears when users click the inline "Fulfil" button in the order management table, allowing them to review and customize the pickup date before creating the shipment with EasyParcel.

**Problem Being Solved**:
- Prevents accidental fulfillment when clicking inline "Fulfil" button
- Allows users to review/edit pickup date before shipment creation
- Provides clear warning about irreversible action
- Matches WooCommerce EasyParcel plugin pattern (uses popup confirmation)

---

## 🗂️ Files to Create/Modify

### 1. **CREATE**: `FulfillmentConfirmDialog.tsx`
**Path**: `src/components/admin/orders/FulfillmentConfirmDialog.tsx`

**Purpose**: Reusable dialog component for fulfillment confirmation

**Responsibilities**:
- Display order summary (order number, courier name)
- Provide pickup date selector with validation
- Show warning about irreversible action
- Handle confirm/cancel actions
- Display loading state during API call
- Show error messages if fulfillment fails

**Props Interface**:
```typescript
interface FulfillmentConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    orderNumber: string;
    courierName?: string;
    selectedCourierServiceId: string;
  };
  onConfirm: (pickupDate: string) => Promise<void>;
  isLoading?: boolean;
}
```

---

### 2. **MODIFY**: `OrderTable.tsx`
**Path**: `src/components/admin/orders/OrderTable.tsx`

**Changes Required**:
1. Add state management for dialog
2. Modify `handleFulfill` to open dialog instead of immediate API call
3. Create new `handleConfirmFulfillment` function for actual fulfillment
4. Import and render `FulfillmentConfirmDialog` component
5. Handle success/error states from fulfillment

**New State Variables**:
```typescript
const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);
const [selectedOrderForFulfillment, setSelectedOrderForFulfillment] = useState<OrderTableData | null>(null);
const [isFulfilling, setIsFulfilling] = useState(false);
```

---

### 3. **REVIEW** (Optional): `OrderInlineActions.tsx`
**Path**: `src/components/admin/orders/OrderInlineActions.tsx`

**Check If**:
- Proper order data is passed to `onFulfill` callback
- Additional fields needed (e.g., `courierName`) are available

**Note**: May not need changes if current data structure is sufficient

---

## 🔧 Detailed Implementation Steps

### **STEP 1: Create FulfillmentConfirmDialog Component**

**File**: `src/components/admin/orders/FulfillmentConfirmDialog.tsx`

#### Component Structure

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { getNextBusinessDay, validatePickupDate } from '@/lib/shipping/utils/date-utils';
import { format } from 'date-fns';

interface FulfillmentConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    orderNumber: string;
    courierName?: string;
    selectedCourierServiceId: string;
  };
  onConfirm: (pickupDate: string) => Promise<void>;
  isLoading?: boolean;
}

export function FulfillmentConfirmDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isLoading = false,
}: FulfillmentConfirmDialogProps) {
  // State
  const [pickupDate, setPickupDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize pickup date when dialog opens
  useEffect(() => {
    if (open) {
      const nextBusinessDay = getNextBusinessDay();
      setPickupDate(format(nextBusinessDay, 'yyyy-MM-dd'));
      setDateError(null);
      setError(null);
    }
  }, [open]);

  // Calculate min and max dates for date picker
  const minDate = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    'yyyy-MM-dd'
  );

  // Validate pickup date on change
  const handleDateChange = (newDate: string) => {
    setPickupDate(newDate);

    const date = new Date(newDate);
    const validation = validatePickupDate(date);

    if (!validation.isValid) {
      setDateError(validation.error || 'Invalid pickup date');
    } else {
      setDateError(null);
    }
  };

  // Handle confirm button
  const handleConfirm = async () => {
    if (dateError) return;

    try {
      setError(null);
      await onConfirm(pickupDate);
      // Dialog will be closed by parent component on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fulfill order');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirm Order Fulfillment</DialogTitle>
          <DialogDescription>
            Review and confirm shipment details before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Order Number</Label>
            <p className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border">
              {order.orderNumber}
            </p>
          </div>

          {/* Courier Service */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Courier Service</Label>
            <p className="text-sm">{order.courierName || 'Selected at checkout'}</p>
            <p className="text-xs text-gray-500">
              Go to order detail page to change courier
            </p>
          </div>

          {/* Pickup Date Selector */}
          <div className="space-y-2">
            <Label htmlFor="pickup-date" className="text-sm font-medium">
              Pickup Date: <span className="text-red-500">*</span>
            </Label>
            <input
              id="pickup-date"
              type="date"
              className="w-full px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              value={pickupDate}
              onChange={e => handleDateChange(e.target.value)}
              min={minDate}
              max={maxDate}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-600">
              Default: Next business day. Can schedule up to 7 days ahead.
            </p>
            {dateError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {dateError}
              </p>
            )}
          </div>

          {/* Warning Alert */}
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              This will create a shipment with EasyParcel and cannot be undone.
              Please ensure the pickup date is correct before confirming.
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !!dateError || !pickupDate}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Fulfillment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### **STEP 2: Modify OrderTable.tsx**

**File**: `src/components/admin/orders/OrderTable.tsx`

#### 2.1 Add Imports

Add to existing imports:

```typescript
import { useState } from 'react';
import { FulfillmentConfirmDialog } from './FulfillmentConfirmDialog';
```

#### 2.2 Add State Variables

Add after existing component state (around line 34):

```typescript
// Fulfillment dialog state
const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);
const [selectedOrderForFulfillment, setSelectedOrderForFulfillment] = useState<OrderTableData | null>(null);
const [isFulfilling, setIsFulfilling] = useState(false);
```

#### 2.3 Modify handleFulfill Function

**Replace existing handleFulfill (lines 70-143) with**:

```typescript
const handleFulfill = async (orderId: string): Promise<ActionResult> => {
  // Get the order to retrieve the selected courier service ID
  const orderToFulfill = orders.find(o => o.id === orderId);

  if (!orderToFulfill) {
    return {
      success: false,
      error: 'Order not found',
    };
  }

  // Check if courier service was selected during checkout
  if (!orderToFulfill.selectedCourierServiceId) {
    return {
      success: false,
      error: 'No courier service selected. Please select a courier from the order detail page.',
    };
  }

  // Open confirmation dialog instead of immediate fulfillment
  setSelectedOrderForFulfillment(orderToFulfill);
  setFulfillmentDialogOpen(true);

  // Return success to prevent error toast
  // Actual fulfillment happens in handleConfirmFulfillment
  return {
    success: true,
    message: 'Opening fulfillment dialog...',
  };
};
```

#### 2.4 Add handleConfirmFulfillment Function

Add new function after handleFulfill:

```typescript
const handleConfirmFulfillment = async (pickupDate: string) => {
  if (!selectedOrderForFulfillment) {
    throw new Error('No order selected for fulfillment');
  }

  setIsFulfilling(true);

  try {
    const response = await fetch(
      `/api/admin/orders/${selectedOrderForFulfillment.id}/fulfill`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedOrderForFulfillment.selectedCourierServiceId,
          pickupDate: pickupDate,
          overriddenByAdmin: false,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();

      // Close dialog
      setFulfillmentDialogOpen(false);
      setSelectedOrderForFulfillment(null);

      // Refresh page to show updated order status
      // Alternative: use router.refresh() or refetch data
      window.location.reload();
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fulfill order');
    }
  } catch (error) {
    console.error('[OrderTable] Fulfillment error:', error);
    // Re-throw to be caught by dialog component
    throw error;
  } finally {
    setIsFulfilling(false);
  }
};
```

#### 2.5 Add Dialog to JSX

**Modify the return statement** to include the dialog:

Find the existing return statement (around line 254) and wrap it:

```typescript
return (
  <>
    <div className="overflow-x-auto">
      <Table>
        {/* ... existing table code ... */}
      </Table>
    </div>

    {/* Fulfillment Confirmation Dialog */}
    {selectedOrderForFulfillment && (
      <FulfillmentConfirmDialog
        open={fulfillmentDialogOpen}
        onOpenChange={setFulfillmentDialogOpen}
        order={{
          id: selectedOrderForFulfillment.id,
          orderNumber: selectedOrderForFulfillment.orderNumber,
          courierName: selectedOrderForFulfillment.courierName,
          selectedCourierServiceId: selectedOrderForFulfillment.selectedCourierServiceId,
        }}
        onConfirm={handleConfirmFulfillment}
        isLoading={isFulfilling}
      />
    )}
  </>
);
```

---

### **STEP 3: Verify Dependencies**

**All Required Dependencies Already Available**:

✅ `@/components/ui/dialog` (shadcn)
✅ `@/components/ui/button` (shadcn)
✅ `@/components/ui/label` (shadcn)
✅ `@/components/ui/alert` (shadcn)
✅ `@/lib/shipping/utils/date-utils` (has `getNextBusinessDay`, `validatePickupDate`)
✅ `date-fns` (for date formatting)
✅ `lucide-react` (icons: Loader2, AlertCircle)

**No New Dependencies Required** ✅

---

## 🧪 Testing Checklist

### **Dialog Functionality**

- [ ] **Open Dialog**
  - Click "Fulfil" button on any PAID order
  - Dialog appears with correct order number
  - Dialog shows courier name (or "Selected at checkout")
  - Pickup date defaults to next business day
  - Cancel and Confirm buttons visible

- [ ] **Date Picker Validation**
  - Default date is next business day (skips Sundays/holidays)
  - Can select future dates up to 7 days ahead
  - Cannot select past dates
  - Shows error when selecting Sunday
  - Shows error when selecting public holiday
  - Error message is clear and helpful
  - Confirm button disabled when date has error

- [ ] **Cancel Action**
  - Click Cancel button closes dialog
  - Click outside dialog closes it (optional behavior)
  - Press Escape key closes dialog
  - No API call is made
  - Order remains in PAID status
  - Can reopen dialog and it resets to default date

- [ ] **Confirm Action - Success**
  - Click Confirm triggers API call
  - Loading spinner shows on Confirm button
  - All inputs disabled during loading
  - Success closes dialog automatically
  - Page refreshes to show updated order
  - Order status changes to READY_TO_SHIP
  - Toast/notification shows success (optional)

- [ ] **Confirm Action - Error**
  - API error keeps dialog open
  - Error message displays in dialog
  - Can retry after fixing issue
  - Can cancel to abort
  - Order status unchanged on error

### **Integration Tests**

- [ ] **Different Courier Types**
  - Works with "Pick-up" services
  - Works with "Drop-off" services
  - Works with other service types

- [ ] **Edge Cases**
  - Multiple rapid clicks don't cause duplicate dialogs
  - Opening dialog for different orders works correctly
  - Selected order data persists during dialog interaction
  - Dialog cleans up state on close

- [ ] **Accessibility**
  - Tab navigation works
  - Focus trapped in dialog
  - Escape key closes dialog
  - Screen reader announcements work
  - Form labels properly associated

### **Visual/UX Tests**

- [ ] Dialog is centered on screen
- [ ] Dialog is responsive on mobile
- [ ] Warning alert is visible and clear
- [ ] Date picker is easy to use
- [ ] Loading states are obvious
- [ ] Error states are clear
- [ ] Buttons have proper spacing
- [ ] Text is readable

---

## 🚀 Implementation Order

### Phase 1: Create Dialog Component
1. Create `FulfillmentConfirmDialog.tsx`
2. Implement basic structure with all UI elements
3. Add date validation logic
4. Test component in isolation (Storybook optional)

### Phase 2: Integrate with OrderTable
1. Add state management to OrderTable
2. Modify handleFulfill to open dialog
3. Create handleConfirmFulfillment for API call
4. Add dialog to JSX return

### Phase 3: Testing & Refinement
1. Test all dialog functionality
2. Test integration with order table
3. Fix any bugs found
4. Refine UI/UX based on testing
5. Add polish (animations, transitions)

### Phase 4: Documentation
1. Update component documentation
2. Add inline code comments
3. Update user guide (if applicable)

---

## 💡 Optional Enhancements (Future)

### Quick Date Selection Buttons
Add preset buttons for common pickup dates:
```
[Tomorrow] [+2 Days] [+3 Days] [Next Week]
```

### Remember Last Selection
Store last used pickup date offset in localStorage:
- User selects "Tomorrow" → Remember preference
- Next fulfillment defaults to same offset

### Show Estimated Delivery
Calculate and display estimated delivery date based on:
- Pickup date selected
- Courier service transit time
- Destination location

### Courier Override in Dialog (Advanced)
Allow changing courier from dialog:
- Fetch alternative couriers
- Show price comparison
- Allow selection before confirming

### Batch Fulfillment
Extend dialog to support multiple orders:
- Select multiple orders in table
- Single dialog for batch fulfillment
- Same pickup date for all

---

## 📝 Notes & Considerations

### Why This Approach?

1. **Prevents Accidents**: Dialog provides "speed bump" before irreversible action
2. **Flexible**: Users can customize pickup date without navigating away
3. **Fast**: Single modal vs full page navigation
4. **Consistent**: Matches WooCommerce EasyParcel plugin pattern
5. **Scalable**: Dialog component reusable for other actions

### Alternative Approaches Considered

**Option A: Remove Inline Fulfil**
- Force users to order detail page for all fulfillments
- ❌ Slower workflow, more clicks required

**Option B: Auto-fulfil with Edit Later**
- Auto-create shipment, allow editing after
- ❌ EasyParcel API doesn't support easy modification
- ❌ May incur charges or complications

**Option C: Inline Date Picker**
- Add date picker directly in table row
- ❌ Clutters table UI
- ❌ No space for validation/warnings

### Technical Decisions

1. **Use Native Date Input**: Instead of custom date picker library
   - Simpler, lighter weight
   - Good browser support
   - Accessible by default

2. **Page Reload on Success**: Instead of optimistic update
   - Ensures data consistency
   - Simpler implementation
   - Can be optimized later if needed

3. **Dialog State in Parent**: Instead of URL/routing
   - Simpler state management
   - No URL pollution
   - Faster interactions

---

## 🔗 Related Files

- `/src/components/admin/FulfillmentWidget.tsx` - Full fulfillment UI with all options
- `/src/lib/shipping/utils/date-utils.ts` - Date validation utilities
- `/src/app/api/admin/orders/[orderId]/fulfill/route.ts` - Fulfillment API endpoint
- `/claudedocs/shipping/spec/06-admin-fulfillment.md` - Fulfillment specification

---

## 📊 Success Criteria

Implementation is complete when:

✅ Dialog opens when clicking "Fulfil" button
✅ User can review order details
✅ User can select/edit pickup date
✅ Date validation prevents invalid dates
✅ Warning message is clear
✅ Confirm creates shipment successfully
✅ Cancel aborts without side effects
✅ Error handling works properly
✅ All tests pass
✅ Code is reviewed and approved

---

**Document Version**: 1.0
**Created**: 2025-10-11
**Last Updated**: 2025-10-11
**Status**: Ready for Implementation
