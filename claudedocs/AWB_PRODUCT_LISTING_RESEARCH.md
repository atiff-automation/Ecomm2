# AWB + Product Listing Research & Analysis

**Date**: 2025-11-04
**Status**: Research Complete - Ready for Implementation Planning
**Objective**: Combine EasyParcel AWB with product listing for comprehensive shipping documentation

---

## 🔍 Current Implementation Analysis

### **1. "Print Packing Slip" Button (Line 147-159)**

**Location**: `src/app/admin/orders/[orderId]/page.tsx:147-159`

```typescript
const handlePrintPackingSlip = () => {
  if (!order) {
    return;
  }

  if (order.airwayBillUrl) {
    window.open(order.airwayBillUrl, '_blank');  // ← Opens EasyParcel AWB directly
  } else {
    toast.error('Packing slip is not yet available. Please fulfill the order first.');
  }
};
```

**Current Behavior**:
- ❌ **Misleading name**: Button says "Print Packing Slip" but actually opens EasyParcel AWB
- ✅ **Direct link**: Opens `order.airwayBillUrl` in new tab (EasyParcel hosted PDF)
- ❌ **No product listing**: EasyParcel AWB only shows shipping label, no product details
- ✅ **Conditional display**: Only shown when `hasPackingSlip` (i.e., `airwayBillGenerated === true`)

**UI Location**: Admin Order Details page (line 483-494)
```typescript
{/* Print Packing Slip - Only show if available */}
{hasPackingSlip && (
  <Button
    variant="outline"
    size="sm"
    onClick={handlePrintPackingSlip}
    className="w-full justify-start"
  >
    <Package className="h-4 w-4 mr-2" />
    Print Packing Slip
  </Button>
)}
```

### **2. "View Airway Bill" Button (Line 635-648)**

**Location**: `src/app/admin/orders/[orderId]/page.tsx:635-648`

```typescript
{/* View AWB */}
{order.airwayBillUrl && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => window.open(order.airwayBillUrl || '', '_blank')}
    className="w-full justify-start text-xs"
  >
    <Package className="h-3 w-3 mr-2" />
    View Airway Bill
  </Button>
)}
```

**Current Behavior**:
- ✅ **Accurate name**: Correctly labeled as "Airway Bill"
- ✅ **Same functionality**: Opens same EasyParcel AWB URL
- 📍 **Different location**: Shown in "Shipping & Tracking" card sidebar

**Duplication Issue**: Both buttons open the exact same AWB URL - redundant functionality

---

## 📊 Available Order Data

### **OrderDetailsData Structure** (types.ts:191-309)

**Product Information Available**:
```typescript
orderItems: Array<{
  id: string;
  productId: string;
  quantity: number;
  regularPrice: number;
  memberPrice: number;
  appliedPrice: number;
  totalPrice: number;
  productName: string;        // ✅ Available
  productSku: string | null;  // ✅ Available
  product: {
    id: string;
    name: string;             // ✅ Available
    sku: string | null;       // ✅ Available
    images: Array<{           // ✅ Images available
      url: string;
      altText: string | null;
    }>;
  } | null;
}>
```

**Shipping Information Available**:
```typescript
shippingAddress: {
  recipientName: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string | null;
  phone: string | null;
}
```

**Order Metadata**:
```typescript
orderNumber: string;
trackingNumber: string | null;
courierName: string | null;
courierServiceType: string | null;
shippingWeight: number | null;
estimatedDelivery: string | null;
```

✅ **Verdict**: All necessary data for product listing packing slip is available

---

## 🛠️ PDF Generation Infrastructure

### **Existing PDF Generation System**

**1. PDFKit Library** (package.json)
```json
{
  "pdfkit": "^0.17.2",
  "@types/pdfkit": "^0.17.3"
}
```

**2. PDF Generator Utility** (`src/lib/utils/pdf-generator.ts`)
- ✅ **Production-ready**: Used for receipt generation
- ✅ **Malaysian compliance**: Handles currency, tax formatting
- ✅ **Professional layout**: Clean design with business logo
- ✅ **Product tables**: Already renders order items with SKU, quantity, price
- ✅ **No browser required**: Pure Node.js (no Puppeteer dependency)

**Key Features**:
- Company logo integration (top-right corner)
- Two-column layouts
- Professional tables with headers
- Currency formatting (`RM XX.XX`)
- Date formatting (Malaysian locale)
- Line items with SKU display

**Example Implementation** (generateReceiptPDF):
```typescript
// Table with product details
orderItems.forEach(item => {
  doc.text(item.productName, descCol, itemY, { width: 300 });

  if (item.productSku) {
    doc.fontSize(8)
       .fillColor('#666666')
       .text(item.productSku, descCol, doc.y + 3);
  }

  doc.text(item.quantity.toString(), qtyCol, itemY, { align: 'right', width: 50 })
     .text(formatCurrency(item.appliedPrice), priceCol, itemY, { align: 'right', width: 60 })
     .text(formatCurrency(item.totalPrice), amountCol, itemY, { align: 'right', width: 60 });
});
```

---

## 🎯 Implementation Options

### **Option 1: PDF Merging (Recommended)**

**Description**: Generate custom packing slip PDF + merge with EasyParcel AWB

**Advantages**:
- ✅ **Single document**: One file contains both AWB and product listing
- ✅ **Professional**: Page 1 = AWB label, Page 2+ = Product details
- ✅ **Print-friendly**: Print entire document at once
- ✅ **Reuses infrastructure**: Leverages existing PDFKit code

**Implementation Steps**:
1. Install `pdf-lib` package for PDF manipulation
2. Create `generatePackingSlipPDF()` function using PDFKit
3. Fetch EasyParcel AWB PDF from `order.airwayBillUrl`
4. Merge AWB (page 1) with packing slip (page 2+) using pdf-lib
5. Create new API endpoint: `/api/admin/orders/[orderId]/combined-awb`
6. Update button handler to call new endpoint

**Required Package**:
```bash
npm install pdf-lib
```

**Code Structure**:
```typescript
// New utility function
export async function generateCombinedAWB(
  order: OrderDetailsData,
  awbPdfBuffer: Buffer
): Promise<Buffer> {
  // 1. Generate packing slip with PDFKit
  const packingSlipPDF = await generatePackingSlipPDF(order);

  // 2. Merge with pdf-lib
  const combinedPDF = await mergePDFs(awbPdfBuffer, packingSlipPDF);

  return combinedPDF;
}
```

**File Structure**:
```
Page 1: EasyParcel AWB Label
  ├─ Barcode
  ├─ Tracking number
  ├─ Sender/recipient addresses
  └─ Courier information

Page 2: Product Listing
  ├─ Order number & date
  ├─ Customer information
  ├─ Product table
  │   ├─ Item name
  │   ├─ SKU
  │   ├─ Quantity
  │   └─ Price
  └─ Shipping details
```

---

### **Option 2: Standalone Packing Slip**

**Description**: Generate separate packing slip PDF (no merging)

**Advantages**:
- ✅ **Simple implementation**: No PDF merging complexity
- ✅ **Flexible**: Can print separately or together
- ✅ **Quick to implement**: Reuse existing receipt template

**Disadvantages**:
- ❌ **Two files**: Requires downloading/printing two documents
- ❌ **User friction**: Extra step for warehouse staff

**Implementation Steps**:
1. Create `generatePackingSlipPDF()` function
2. Create new API endpoint: `/api/admin/orders/[orderId]/packing-slip`
3. Add separate button: "Download Packing Slip"
4. Keep existing "View Airway Bill" button unchanged

---

### **Option 3: Replace AWB Button Text Only**

**Description**: Keep current functionality, just fix misleading button text

**Advantages**:
- ✅ **Zero development**: Just rename button
- ✅ **No risk**: No code changes

**Disadvantages**:
- ❌ **Doesn't solve problem**: No product listing on AWB
- ❌ **Not a solution**: Original requirement unmet

---

## 📋 Recommended Packing Slip Content

### **Packing Slip Template Design**

**Header Section**:
- Company logo (from business profile)
- Document title: "PACKING SLIP"
- Order number
- Order date
- Tracking number

**Shipping Information**:
- Ship to: Customer name & full address
- Courier: Service name
- Estimated delivery

**Product Table**:
| Item | SKU | Quantity | Unit Price | Total |
|------|-----|----------|------------|-------|
| Product Name | ABC123 | 2 | RM 50.00 | RM 100.00 |

**Order Summary**:
- Subtotal
- Discount (if any)
- Shipping cost
- Tax
- **Grand Total**

**Footer**:
- Special instructions (if any)
- Customer notes
- Barcode (optional)

---

## 🚀 Implementation Recommendation

### **Recommended Approach: Option 1 (PDF Merging)**

**Why?**
1. **Best user experience**: Single document with all information
2. **Professional output**: Matches industry standards
3. **Warehouse-friendly**: Print once, attach to package
4. **Leverages existing code**: Reuses PDFKit infrastructure

**Implementation Priority**: High
**Estimated Complexity**: Medium
**Estimated Time**: 4-6 hours

---

## 🔧 Technical Implementation Plan

### **Phase 1: Packing Slip PDF Generation** (2 hours)

**Create**: `src/lib/utils/packing-slip-generator.ts`

```typescript
import PDFDocument from 'pdfkit';
import { OrderDetailsData } from '@/components/admin/orders/types';

export async function generatePackingSlipPDF(
  order: OrderDetailsData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('PACKING SLIP', { align: 'center' });
    doc.moveDown();

    // Order info
    doc.fontSize(12).font('Helvetica');
    doc.text(`Order Number: ${order.orderNumber}`);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString('en-MY')}`);
    doc.text(`Tracking: ${order.trackingNumber || 'N/A'}`);
    doc.moveDown();

    // Shipping address
    if (order.shippingAddress) {
      doc.fontSize(10).font('Helvetica-Bold').text('Ship To:');
      doc.fontSize(9).font('Helvetica');
      doc.text(`${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`);
      doc.text(order.shippingAddress.addressLine1);
      if (order.shippingAddress.addressLine2) {
        doc.text(order.shippingAddress.addressLine2);
      }
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`);
      doc.moveDown();
    }

    // Products table
    doc.fontSize(10).font('Helvetica-Bold').text('Items:');
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Item', 50, tableTop);
    doc.text('SKU', 250, tableTop);
    doc.text('Qty', 350, tableTop);
    doc.text('Price', 400, tableTop);
    doc.text('Total', 480, tableTop);

    // Draw line
    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown();

    // Table rows
    order.orderItems.forEach((item) => {
      const itemY = doc.y;
      doc.fontSize(9).font('Helvetica');
      doc.text(item.productName, 50, itemY, { width: 180 });
      doc.text(item.productSku || '-', 250, itemY);
      doc.text(item.quantity.toString(), 350, itemY);
      doc.text(`RM ${item.appliedPrice.toFixed(2)}`, 400, itemY);
      doc.text(`RM ${item.totalPrice.toFixed(2)}`, 480, itemY);
      doc.moveDown();
    });

    doc.moveDown();

    // Totals
    const totalsX = 400;
    doc.fontSize(9).font('Helvetica');
    doc.text(`Subtotal: RM ${order.subtotal.toFixed(2)}`, totalsX);
    doc.text(`Shipping: RM ${order.shippingCost.toFixed(2)}`, totalsX);
    doc.text(`Tax: RM ${order.taxAmount.toFixed(2)}`, totalsX);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Total: RM ${order.total.toFixed(2)}`, totalsX);

    doc.end();
  });
}
```

### **Phase 2: PDF Merging** (1 hour)

**Install dependency**:
```bash
npm install pdf-lib
```

**Create**: `src/lib/utils/pdf-merge.ts`

```typescript
import { PDFDocument } from 'pdf-lib';

export async function mergePDFs(
  awbBuffer: Buffer,
  packingSlipBuffer: Buffer
): Promise<Buffer> {
  // Load both PDFs
  const awbPDF = await PDFDocument.load(awbBuffer);
  const packingSlipPDF = await PDFDocument.load(packingSlipBuffer);

  // Create new document
  const mergedPDF = await PDFDocument.create();

  // Copy AWB pages (page 1)
  const awbPages = await mergedPDF.copyPages(awbPDF, awbPDF.getPageIndices());
  awbPages.forEach((page) => mergedPDF.addPage(page));

  // Copy packing slip pages (page 2+)
  const packingPages = await mergedPDF.copyPages(
    packingSlipPDF,
    packingSlipPDF.getPageIndices()
  );
  packingPages.forEach((page) => mergedPDF.addPage(page));

  // Save merged PDF
  const mergedBytes = await mergedPDF.save();
  return Buffer.from(mergedBytes);
}
```

### **Phase 3: API Endpoint** (1 hour)

**Create**: `src/app/api/admin/orders/[orderId]/combined-awb/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';
import { prisma } from '@/lib/db/prisma';
import { generatePackingSlipPDF } from '@/lib/utils/packing-slip-generator';
import { mergePDFs } from '@/lib/utils/pdf-merge';
import axios from 'axios';

interface RouteParams {
  params: {
    orderId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Admin authentication
    const { error } = await requireAdminRole();
    if (error) return error;

    const orderId = params.orderId;

    // Get order with full details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: { name: true, sku: true },
            },
          },
        },
        shippingAddress: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (!order.airwayBillUrl) {
      return NextResponse.json(
        { message: 'AWB not generated yet' },
        { status: 404 }
      );
    }

    // Fetch EasyParcel AWB PDF
    const awbResponse = await axios.get(order.airwayBillUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    const awbBuffer = Buffer.from(awbResponse.data);

    // Generate packing slip
    const packingSlipBuffer = await generatePackingSlipPDF(order);

    // Merge PDFs
    const combinedPDF = await mergePDFs(awbBuffer, packingSlipBuffer);

    // Return combined PDF
    const filename = `AWB-PackingSlip-${order.orderNumber}.pdf`;

    return new NextResponse(combinedPDF, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': combinedPDF.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Combined AWB generation error:', error);
    return NextResponse.json(
      { message: 'Failed to generate combined AWB', error: error.message },
      { status: 500 }
    );
  }
}
```

### **Phase 4: Frontend Update** (30 minutes)

**Update**: `src/app/admin/orders/[orderId]/page.tsx:147-159`

```typescript
const handlePrintPackingSlip = async () => {
  if (!order) return;

  if (!order.airwayBillUrl) {
    toast.error('AWB not generated yet. Please fulfill the order first.');
    return;
  }

  try {
    // Download combined AWB + Packing Slip
    const response = await fetch(`/api/admin/orders/${order.id}/combined-awb`);

    if (!response.ok) {
      throw new Error('Failed to generate combined AWB');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AWB-PackingSlip-${order.orderNumber}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Combined AWB and packing slip downloaded');
  } catch (error) {
    toast.error('Failed to generate packing slip');
    console.error(error);
  }
};
```

**Update button text**:
```typescript
<Button
  variant="outline"
  size="sm"
  onClick={handlePrintPackingSlip}
  className="w-full justify-start"
>
  <Package className="h-4 w-4 mr-2" />
  Download AWB + Packing Slip  {/* Updated text */}
</Button>
```

### **Phase 5: Testing** (1 hour)

**Test Cases**:
1. ✅ Generate combined PDF for order with products
2. ✅ Verify AWB appears as page 1
3. ✅ Verify packing slip appears as page 2
4. ✅ Test with multiple products (pagination)
5. ✅ Test with products having long names
6. ✅ Test error handling (AWB not generated)
7. ✅ Test PDF download in browser
8. ✅ Test print preview

---

## 🎨 Packing Slip Design Mockup

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│           [COMPANY LOGO]     PACKING SLIP          │
│                                                     │
│  Order Number: ORD-1234567                         │
│  Order Date: November 4, 2025                      │
│  Tracking: ABC123456789MY                          │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Ship To:                                          │
│  John Doe                                          │
│  123 Jalan Bukit Bintang                          │
│  Kuala Lumpur, Wilayah Persekutuan 50200          │
│  Phone: +60123456789                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Items Ordered:                                    │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ Item          │ SKU    │ Qty │ Price  │Total│ │
│  ├──────────────────────────────────────────────┤ │
│  │ Product A     │ ABC123 │  2  │ RM50  │RM100│ │
│  │ Product B     │ DEF456 │  1  │ RM75  │ RM75│ │
│  │ Product C     │ GHI789 │  3  │ RM30  │ RM90│ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│                              Subtotal: RM 265.00   │
│                              Shipping: RM  15.00   │
│                                   Tax: RM  16.80   │
│                              ─────────────────────  │
│                                  Total: RM 296.80   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

**Functional Requirements**:
- ✅ Combined PDF contains AWB (page 1) + packing slip (page 2)
- ✅ All order products listed with SKU, quantity, price
- ✅ Shipping address displayed correctly
- ✅ Professional formatting matches receipt design
- ✅ Downloads with descriptive filename

**Non-Functional Requirements**:
- ✅ Generation time < 5 seconds
- ✅ PDF file size < 2MB
- ✅ Works for orders with 1-100 products
- ✅ Handles missing data gracefully (no SKU, etc.)
- ✅ Mobile-responsive download

---

## 🚨 Risks & Mitigation

**Risk 1: EasyParcel AWB download timeout**
- Mitigation: 30-second timeout, retry logic, fallback to packing slip only

**Risk 2: PDF merging complexity**
- Mitigation: Use battle-tested pdf-lib library, comprehensive error handling

**Risk 3: Large product lists exceed single page**
- Mitigation: PDFKit handles pagination automatically

**Risk 4: Performance impact on server**
- Mitigation: PDF generation is fast (~2s), no concurrent limit needed for MVP

---

## 📝 Next Steps

1. ✅ **Research Complete** - This document
2. ⏳ **Get approval** - Review with stakeholder
3. ⏳ **Install pdf-lib** - Add dependency
4. ⏳ **Implement packing slip generator** - Phase 1
5. ⏳ **Implement PDF merging** - Phase 2
6. ⏳ **Create API endpoint** - Phase 3
7. ⏳ **Update frontend** - Phase 4
8. ⏳ **Testing** - Phase 5
9. ⏳ **Production deployment**

---

**Documentation Status**: ✅ Complete
**Ready for Implementation**: ✅ Yes
**Estimated Delivery**: 1-2 days
