# EasyParcel AWB Implementation Plan
*Based on Official API Documentation Analysis*

## 🔍 **Current Implementation Issue**

Our existing implementation assumes EasyParcel has a separate `/api/v1/airway-bill/generate` endpoint, but this **does not exist**. According to the official documentation, AWB generation happens automatically during the payment process.

### **Current Code Problem:**
```typescript
// ❌ WRONG - This endpoint doesn't exist
const response = await axiosInstance.post('/api/v1/airway-bill/generate', payload);
```

## 📚 **EasyParcel API Documentation Findings**

### **Making Order Payment API** (`EPPayOrderBulk`)
**Purpose**: Process payment for placed orders
**Returns**: AWB data including PDF download link

**Response Structure:**
```json
{
  "api_status": "Success",
  "result": [{
    "orderno": "EI-5UFAI",
    "messagenow": "Fully Paid",
    "parcel": [{
      "parcelno": "EP-PQKTE",
      "awb": "238770015234",
      "awb_id_link": "http://demo.connect.easyparcel.my/?ac=AWBLabel&id=QmIxTE43eHQjMTYzMDQwMTI%3D",
      "tracking_url": "https://easyparcel.com/my/en/track/details/?courier=Skynet&awb=238770015234"
    }]
  }]
}
```

### **Express Order API** (`EPSubmitOrderBulkV3`)
**Purpose**: Direct order creation + payment in one call
**Returns**: Same AWB structure as payment API

**Response Structure:**
```json
{
  "result": {
    "success": [{
      "awb": "ER665997516MY",
      "awb_id_link": "http://demo.connect.easyparcel.my/?ac=AWBLabel&id=b0VYQjhEMW4jMTc0OTc4MzA%3D",
      "tracking_url": "https://easyparcel.com/my/en/track/details/?courier=Poslaju&awb=ER665997516MY"
    }]
  }
}
```

## ✅ **Correct Implementation Flow**

### **Phase 1: Update Payment Webhook**
File: `src/app/api/webhooks/payment-success/route.ts`

**Current Flow:**
1. Payment confirmed ✓
2. ❌ Call non-existent airway bill generation API
3. Update order status ✓

**Corrected Flow:**
1. Payment confirmed ✓
2. ✅ Call EasyParcel payment API (`EPPayOrderBulk`)
3. ✅ Extract AWB data from response
4. ✅ Update order with real AWB information
5. Update order status ✓

### **Phase 2: Update AirwayBillService**
File: `src/lib/services/airway-bill.service.ts`

**Current Methods:**
- `generateForOrder()` - ❌ Calls wrong API
- `isGenerated()` - ✅ Correct
- `getDownloadUrl()` - ✅ Correct

**Updated Methods:**
- `processPaymentAndExtractAWB()` - ✅ New method for payment processing
- `isGenerated()` - ✅ Keep as is
- `getDownloadUrl()` - ✅ Keep as is

### **Phase 3: Update Download API**
File: `src/app/api/admin/orders/[id]/airway-bill/route.ts`

**Current Logic:**
- Stream PDF from stored URL ✅ (This part is correct)

**No changes needed** - The download logic is already correct since it streams from the stored URL.

## 🔧 **Implementation Details**

### **1. Updated Payment Webhook Logic**

```typescript
// Enhanced payment success webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderReference, status, transactionId } = body;

    if (status !== 'PAID') {
      return NextResponse.json({ message: 'Payment not successful' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { orderNumber: orderReference }
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // ✅ CORRECT: Update payment status first
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paymentId: transactionId,
      },
    });

    // ✅ NEW: Process EasyParcel payment to get AWB
    const awbResult = await AirwayBillService.processPaymentAndExtractAWB(order.orderNumber);

    if (awbResult.success) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          airwayBillNumber: awbResult.awbNumber,
          airwayBillUrl: awbResult.awbPdfUrl,
          trackingUrl: awbResult.trackingUrl,
          airwayBillGenerated: true,
          airwayBillGeneratedAt: new Date(),
        },
      });
    }

    // Continue with existing notification logic...

  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json({ message: 'Webhook processing failed' }, { status: 500 });
  }
}
```

### **2. Updated AirwayBillService**

```typescript
export class AirwayBillService {
  /**
   * ✅ NEW: Process EasyParcel payment and extract AWB data
   */
  static async processPaymentAndExtractAWB(orderNumber: string): Promise<AWBResult> {
    try {
      const credentials = await easyParcelCredentialsService.getCredentials();
      const axiosInstance = await this.getAxiosInstance();

      // Call EasyParcel payment API
      const response = await axiosInstance.post('/?ac=EPPayOrderBulk', {
        api: credentials.apiKey,
        bulk: [{
          order_no: orderNumber
        }]
      });

      if (response.data.api_status === 'Success' && response.data.result[0]?.parcel[0]) {
        const parcelData = response.data.result[0].parcel[0];

        return {
          success: true,
          awbNumber: parcelData.awb,
          awbPdfUrl: parcelData.awb_id_link,
          trackingUrl: parcelData.tracking_url,
        };
      }

      return {
        success: false,
        error: {
          code: 'PAYMENT_PROCESSING_FAILED',
          message: 'EasyParcel payment processing failed',
          details: response.data.result[0]?.messagenow || 'Unknown error',
        },
      };

    } catch (error: any) {
      console.error('EasyParcel payment processing error:', error);
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to process EasyParcel payment',
          details: error.response?.data || error.message,
        },
      };
    }
  }

  /**
   * ✅ DEPRECATED: Remove old generateForOrder method
   * Replace with processPaymentAndExtractAWB
   */
  // static async generateForOrder() { ... } // Remove this method
}
```

### **3. Updated Type Definitions**

```typescript
export interface AWBResult {
  success: boolean;
  awbNumber?: string;
  awbPdfUrl?: string;
  trackingUrl?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### **4. Database Schema Updates**

Add tracking URL field to Order model:

```prisma
model Order {
  // ... existing fields ...

  // Airway Bill Fields
  airwayBillNumber     String?    // AWB tracking number
  airwayBillUrl        String?    // Direct PDF download URL
  trackingUrl          String?    // ✅ NEW: Public tracking page URL
  airwayBillGenerated  Boolean    @default(false)
  airwayBillGeneratedAt DateTime? // When it was generated
}
```

## 🎯 **Implementation Checklist**

### **Phase 1: Core Logic Update**
- [ ] Update `AirwayBillService.processPaymentAndExtractAWB()` method
- [ ] Remove old `generateForOrder()` method
- [ ] Update payment webhook to use correct API call
- [ ] Add tracking URL field to database schema
- [ ] Run database migration

### **Phase 2: Error Handling**
- [ ] Update error codes to match EasyParcel responses
- [ ] Handle insufficient credit scenarios
- [ ] Add proper logging for payment processing steps

### **Phase 3: Frontend Updates**
- [ ] Add tracking URL display in orders interface
- [ ] Update download button to show AWB status correctly
- [ ] Handle different AWB generation states

### **Phase 4: Testing**
- [ ] Test payment webhook with AWB extraction
- [ ] Verify PDF download functionality
- [ ] Test error scenarios (insufficient credit, API failures)
- [ ] End-to-end testing: Payment → AWB → Download

## 🚨 **Critical Points**

### **1. Order of Operations**
1. **Payment must be processed first** via EasyParcel payment API
2. **AWB is generated automatically** during payment processing
3. **PDF download URL is immediately available** in payment response

### **2. API Endpoints**
- ❌ **Wrong**: `/api/v1/airway-bill/generate` (doesn't exist)
- ✅ **Correct**: `/?ac=EPPayOrderBulk` (payment processing)

### **3. No Separate AWB Generation**
EasyParcel doesn't have a separate AWB generation step. AWB creation happens during payment processing, and the PDF is immediately available.

### **4. Environment Considerations**
- **Demo**: `http://demo.connect.easyparcel.my/?ac=EPPayOrderBulk`
- **Live**: `https://connect.easyparcel.my/?ac=EPPayOrderBulk`

## 🔄 **Migration Strategy**

### **Step 1: Update Service Layer**
Update `AirwayBillService` with correct API calls but keep interface compatible.

### **Step 2: Update Webhook**
Modify payment webhook to call updated service method.

### **Step 3: Database Migration**
Add tracking URL field to support enhanced functionality.

### **Step 4: Frontend Updates**
Update admin interface to display tracking information.

### **Step 5: Testing & Rollback Plan**
Test thoroughly with demo environment, maintain rollback capability.

---

**Status**: Ready for implementation
**Priority**: High - Current implementation is calling non-existent API
**Impact**: Critical - AWB generation is not working correctly