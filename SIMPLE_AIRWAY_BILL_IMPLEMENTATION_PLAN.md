# Simple Airway Bill Generation & Download Implementation Plan

## Overview
After customer payment success → Automatically generate airway bill → Show download button in order processing interface

**Starting Point**: Clean state after git reset (no complex automatic features)
**End Goal**: Simple airway bill generation with download functionality

---

## Architecture Principles (Following @CLAUDE.md)
- ✅ **No hardcoding** - All configurations centralized
- ✅ **DRY approach** - Single source of truth for airway bill logic
- ✅ **Systematic implementation** - Follow this plan step by step
- ✅ **Best practices** - Clean, maintainable code structure

---

## Implementation Plan

### Phase 1: Database Schema Enhancement
**Goal**: Add minimal fields for airway bill tracking

#### ☐ 1.1 Update Order Model in Prisma Schema
**File**: `prisma/schema.prisma`
```prisma
model Order {
  // ... existing fields ...

  // Airway Bill Fields
  airwayBillNumber     String?    // Generated airway bill number
  airwayBillUrl        String?    // URL to download airway bill PDF
  airwayBillGenerated  Boolean    @default(false)
  airwayBillGeneratedAt DateTime? // When it was generated
}
```

#### ☐ 1.2 Run Database Migration
```bash
npx prisma migrate dev --name add_airway_bill_fields
```

### Phase 2: Core Service Implementation
**Goal**: Single service to handle airway bill generation

#### ☐ 2.1 Create AirwayBillService
**File**: `src/lib/services/airway-bill.service.ts`

**Single Responsibility**: Generate and manage airway bills
```typescript
export class AirwayBillService {
  // Main method: Generate airway bill for order
  static async generateForOrder(orderId: string): Promise<AirwayBillResult>

  // Helper: Check if already generated
  static async isGenerated(orderId: string): Promise<boolean>

  // Helper: Get download URL
  static async getDownloadUrl(orderId: string): Promise<string | null>
}
```

**Key Features**:
- ✅ Centralized logic
- ✅ Error handling with proper logging
- ✅ Integration with EasyParcel API
- ✅ Database updates after successful generation

#### ☐ 2.2 Create Configuration File
**File**: `src/lib/config/airway-bill.config.ts`

**Single Source of Truth** for all configurations:
```typescript
export const AirwayBillConfig = {
  // EasyParcel API settings
  easyParcel: {
    apiUrl: process.env.EASYPARCEL_API_URL,
    apiKey: process.env.EASYPARCEL_API_KEY,
    // ... other settings
  },

  // File storage settings
  storage: {
    uploadPath: process.env.AIRWAY_BILL_STORAGE_PATH || '/tmp/airway-bills',
    // ... other storage settings
  }
}
```

### Phase 3: Payment Integration
**Goal**: Trigger airway bill generation immediately after payment success

#### ☐ 3.1 Enhance Payment Success Webhook
**File**: `src/app/api/webhooks/payment-success/route.ts`

**Add Simple Logic**:
1. Payment confirmed ✅
2. Generate airway bill → Call `AirwayBillService.generateForOrder()`
3. Update order status
4. Send confirmation (existing logic)

**No Complex Features**:
- ❌ No circuit breakers
- ❌ No manual queues
- ❌ No retry mechanisms
- ✅ Simple try-catch error handling

### Phase 4: Download API Endpoint
**Goal**: Provide secure download endpoint for airway bills

#### ☐ 4.1 Create Download API
**File**: `src/app/api/admin/orders/[orderId]/airway-bill/route.ts`

**Features**:
- ✅ Admin authentication check
- ✅ Order existence validation
- ✅ File stream response
- ✅ Proper headers for PDF download

### Phase 5: Frontend Enhancement
**Goal**: Add download button to existing order processing interface

#### ☐ 5.1 Enhance Orders Page
**File**: `src/app/admin/orders/page.tsx`

**Minimal Changes**:
1. Add airway bill status to order interface type
2. Add download button in actions column
3. Show "Generated" or "Not Available" status

**Button Logic**:
```typescript
// Only show if airway bill is generated
{order.airwayBillGenerated && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => downloadAirwayBill(order.id)}
  >
    <Download className="h-4 w-4" />
    Airway Bill
  </Button>
)}
```

#### ☐ 5.2 Add Download Function
```typescript
const downloadAirwayBill = async (orderId: string) => {
  // Simple fetch and blob download
  const response = await fetch(`/api/admin/orders/${orderId}/airway-bill`);
  // ... download logic
}
```

### Phase 6: Error Handling & Validation
**Goal**: Basic error handling without complex systems

#### ☐ 6.1 Add Order Status Update
**File**: `src/lib/notifications/order-status-handler.ts`

**Simple Addition**:
- Add handling for when airway bill generation fails
- Send admin notification on failure
- No complex retry mechanisms

### Phase 7: Testing & Validation
**Goal**: Ensure functionality works end-to-end

#### ☐ 7.1 Test Payment Flow
1. Create test order
2. Process payment
3. Verify airway bill generation
4. Test download functionality

#### ☐ 7.2 Test Error Scenarios
1. EasyParcel API failure
2. File storage issues
3. Invalid order scenarios

---

## File Changes Summary

### New Files (7 files)
1. `src/lib/services/airway-bill.service.ts` - Core business logic
2. `src/lib/config/airway-bill.config.ts` - Centralized configuration
3. `src/app/api/admin/orders/[orderId]/airway-bill/route.ts` - Download endpoint

### Modified Files (4 files)
1. `prisma/schema.prisma` - Add airway bill fields
2. `src/app/api/webhooks/payment-success/route.ts` - Add generation trigger
3. `src/app/admin/orders/page.tsx` - Add download button
4. `src/lib/notifications/order-status-handler.ts` - Add error handling

### Environment Variables
```env
# Add to .env
EASYPARCEL_API_URL=https://api.easyparcel.com
EASYPARCEL_API_KEY=your_api_key_here
AIRWAY_BILL_STORAGE_PATH=/uploads/airway-bills
```

---

## Implementation Checklist

### Database Layer
- [ ] Update Prisma schema with airway bill fields
- [ ] Run database migration
- [ ] Verify schema changes

### Service Layer
- [ ] Create AirwayBillService with core methods
- [ ] Create configuration file
- [ ] Add proper TypeScript types
- [ ] Implement error handling

### API Layer
- [ ] Enhance payment webhook
- [ ] Create download endpoint
- [ ] Add proper authentication
- [ ] Test API endpoints

### Frontend Layer
- [ ] Update orders interface type
- [ ] Add download button to orders table
- [ ] Implement download functionality
- [ ] Test user interface

### Integration Testing
- [ ] End-to-end payment to download flow
- [ ] Error scenario testing
- [ ] Admin interface validation
- [ ] File download verification

---

## Success Criteria

1. ✅ **Customer pays** → Payment webhook triggers airway bill generation
2. ✅ **Airway bill generated** → Stored in database with download URL
3. ✅ **Order appears in processing** → Shows with download button
4. ✅ **Admin clicks download** → PDF downloads successfully
5. ✅ **No complex features** → Simple, clean implementation
6. ✅ **Follows CLAUDE.md** → Systematic, DRY, centralized approach

---

## Notes
- Start fresh after `git reset --hard` to last commit before automatic features
- Focus on simplicity over complexity
- Single source of truth for all airway bill logic
- No monitoring dashboards or complex fallback systems needed
- Just: Payment → Generate → Download