# EasyParcel API v1.4.0 Integration Implementation Guide
*Complete step-by-step implementation reference for Malaysian E-commerce Platform*

## 📚 Official Documentation Reference
**Source**: Malaysia_Individual_1.4.0.0.pdf  
**API Version**: 1.4.0.0  
**Base URL**: `https://connect.easyparcel.my/api/v2/`  
**Authentication**: API Key + API Secret  

---

## 🎯 Implementation Overview

### **Current Status Analysis**
✅ **Already Implemented**:
- Basic EasyParcel service class with authentication
- Shipping calculator with Malaysian states
- Simple rate calculation API
- Mock data for development testing

❌ **Missing/Needs Enhancement**:
- Alignment with official API v1.4.0 specification
- Comprehensive shipment lifecycle management
- Real-time tracking with webhook integration
- Label generation and pickup scheduling
- Proper error handling per API documentation
- Malaysian compliance (GST, postal validation)

---

## 📋 Phase-by-Phase Implementation Checklist

## **Phase 1: Database Schema Enhancement**
*Reference: PDF Section 3.2 - Data Models*

### 1.1 Product Model Updates
- [x] Add `weight` field (decimal, required for shipping)
- [x] Add `dimensions` JSON field (length, width, height in cm)
- [x] Add `shippingClass` enum (STANDARD, FRAGILE, HAZARDOUS)
- [x] Add `customsDescription` field for international shipping
- [x] Add `hsCode` field for customs classification

### 1.2 New Shipment Model
```sql
-- Reference: PDF Section 3.2.1 - Shipment Entity
model Shipment {
  id                    String   @id @default(cuid())
  orderId               String   @unique
  easyParcelShipmentId  String?  @unique // EasyParcel shipment ID
  trackingNumber        String?  @unique
  
  // Courier Information (PDF Section 4.1)
  courierId             String
  courierName           String
  serviceName           String
  serviceType           String   // STANDARD, EXPRESS, OVERNIGHT
  
  // Shipping Details (PDF Section 3.3)
  pickupAddress         Json     // Structured address
  deliveryAddress       Json     // Structured address
  parcelDetails         Json     // Weight, dimensions, value
  
  // Pricing (PDF Section 5.2)
  originalPrice         Decimal  @db.Decimal(10, 2)
  finalPrice            Decimal  @db.Decimal(10, 2)
  insuranceAmount       Decimal? @db.Decimal(10, 2)
  codAmount            Decimal? @db.Decimal(10, 2)
  
  // Status Tracking (PDF Section 6.1)
  status               ShipmentStatus @default(DRAFT)
  statusDescription    String?
  estimatedDelivery    DateTime?
  actualDelivery       DateTime?
  
  // Label & Pickup (PDF Sections 7.1, 8.1)
  labelUrl             String?
  labelGenerated       Boolean  @default(false)
  pickupScheduled      Boolean  @default(false)
  pickupDate           DateTime?
  pickupTimeSlot       String?
  
  // Special Instructions (PDF Section 3.4)
  specialInstructions  String?
  signatureRequired    Boolean  @default(false)
  insuranceRequired    Boolean  @default(false)
  
  // Relationships
  order                Order    @relation(fields: [orderId], references: [id])
  trackingEvents       ShipmentTracking[]
  
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

enum ShipmentStatus {
  DRAFT
  RATE_CALCULATED
  BOOKED
  LABEL_GENERATED
  PICKUP_SCHEDULED
  PICKED_UP
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  FAILED
  CANCELLED
}
```

### 1.3 Shipment Tracking Events
```sql
-- Reference: PDF Section 6.2 - Tracking Events
model ShipmentTracking {
  id          String   @id @default(cuid())
  shipmentId  String
  
  // Event Details (PDF Section 6.2.1)
  eventCode   String   // As per EasyParcel event codes
  eventName   String
  description String
  location    String?
  
  // Timing
  eventTime   DateTime
  timezone    String   @default("Asia/Kuala_Lumpur")
  
  // Source
  source      String   @default("EASYPARCEL") // EASYPARCEL, COURIER, MANUAL
  
  shipment    Shipment @relation(fields: [shipmentId], references: [id])
  createdAt   DateTime @default(now())
}
```

### 1.4 Order Model Enhancements
- [x] Add `selectedCourierId` field
- [x] Add `estimatedDeliveryDate` field  
- [x] Add `shippingPreferences` JSON field
- [x] Add `deliveryInstructions` field
- [x] Add relationship to Shipment model

---

## **Phase 2: EasyParcel Service Implementation**
*Reference: PDF Sections 4-8 - API Endpoints*

### 2.1 Authentication & Configuration
- [x] **API Credentials Setup** (PDF Section 2.1)
  ```typescript
  // Environment variables alignment
  EASYPARCEL_API_KEY="your-api-key"
  EASYPARCEL_API_SECRET="your-api-secret"
  EASYPARCEL_BASE_URL="https://connect.easyparcel.my/api/v2"
  EASYPARCEL_SANDBOX="true" // For testing
  ```

- [x] **Headers Implementation** (PDF Section 2.2)
  ```typescript
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': process.env.EASYPARCEL_API_KEY,
    'X-API-SECRET': process.env.EASYPARCEL_API_SECRET,
    'Accept': 'application/json'
  }
  ```

### 2.2 Rate Calculation Enhancement
- [x] **Update Rate API Call** (PDF Section 4.1)
  ```typescript
  // POST /api/v2/rates
  interface RateRequest {
    pickup_address: AddressStructure;
    delivery_address: AddressStructure;
    parcel: ParcelDetails;
    service_types?: string[]; // STANDARD, EXPRESS, OVERNIGHT
    insurance?: boolean;
    cod?: boolean;
  }
  ```

- [x] **Address Structure Validation** (PDF Section 3.1)
  ```typescript
  interface AddressStructure {
    name: string; // Max 100 chars
    company?: string; // Max 100 chars
    phone: string; // Malaysian format: +60XXXXXXXXX
    email?: string;
    address_line_1: string; // Max 100 chars
    address_line_2?: string; // Max 100 chars
    city: string; // Max 50 chars
    state: MalaysianState; // As per PDF Appendix A
    postcode: string; // 5-digit Malaysian postcode
    country: string; // "MY" for Malaysia
  }
  ```

- [x] **Parcel Details Structure** (PDF Section 3.2)
  ```typescript
  interface ParcelDetails {
    weight: number; // In KG, max 70kg
    length?: number; // In CM
    width?: number; // In CM  
    height?: number; // In CM
    content: string; // Description, max 100 chars
    value: number; // In MYR for insurance
    quantity?: number; // Default 1
  }
  ```

### 2.3 Shipment Booking Implementation
- [x] **Shipment Creation API** (PDF Section 5.1)
  ```typescript
  // POST /api/v2/shipments
  interface ShipmentBookingRequest {
    pickup_address: AddressStructure;
    delivery_address: AddressStructure;
    parcel: ParcelDetails;
    service_id: string; // From rate calculation
    reference: string; // Order number
    pickup_date?: string; // YYYY-MM-DD
    pickup_time?: string; // morning, afternoon, evening
    special_instruction?: string;
    insurance?: boolean;
    signature_required?: boolean;
    cod?: {
      amount: number;
      payment_method: "CASH" | "CHEQUE";
    };
  }
  ```

- [x] **Response Handling** (PDF Section 5.2)
  ```typescript
  interface ShipmentBookingResponse {
    shipment_id: string;
    tracking_number: string;
    reference: string;
    status: string;
    estimated_delivery: string; // ISO 8601
    label_url?: string;
    total_price: number;
    courier: {
      id: string;
      name: string;
      service_name: string;
    };
  }
  ```

### 2.4 Label Generation
- [x] **Label Download API** (PDF Section 7.1)
  ```typescript
  // GET /api/v2/shipments/{shipment_id}/label
  // Returns PDF binary data
  async generateLabel(shipmentId: string): Promise<Buffer>
  ```

- [x] **Label Storage Strategy**
  - [x] Save labels to `/public/shipping-labels/`
  - [x] Generate unique filenames: `{orderNumber}-{shipmentId}.pdf`
  - [x] Implement label regeneration capability

### 2.5 Pickup Scheduling
- [x] **Pickup Booking API** (PDF Section 8.1)
  ```typescript
  // POST /api/v2/pickups
  interface PickupRequest {
    shipment_ids: string[];
    pickup_date: string; // YYYY-MM-DD
    pickup_time: "morning" | "afternoon" | "evening";
    contact_person: string;
    contact_phone: string;
    special_instruction?: string;
  }
  ```

### 2.6 Tracking Implementation
- [x] **Tracking API** (PDF Section 6.1)
  ```typescript
  // GET /api/v2/tracking/{tracking_number}
  interface TrackingResponse {
    tracking_number: string;
    status: string;
    status_description: string;
    estimated_delivery?: string;
    events: TrackingEvent[];
    delivery_info?: {
      delivered_at: string;
      received_by: string;
      signature_image?: string;
    };
  }
  ```

- [x] **Webhook Setup** (PDF Section 6.3)
  ```typescript
  // Webhook endpoint: POST /api/webhooks/easyparcel-tracking
  interface WebhookPayload {
    tracking_number: string;
    event_code: string;
    event_name: string;
    event_description: string;
    event_time: string; // ISO 8601
    location?: string;
    shipment_id: string;
    signature?: string; // Webhook signature verification
  }
  ```

---

## **Phase 3: Error Handling & Validation**
*Reference: PDF Section 9 - Error Codes*

### 3.1 API Error Handling
- [ ] **Standard Error Response** (PDF Section 9.1)
  ```typescript
  interface EasyParcelError {
    error: {
      code: string; // E.g., "INVALID_ADDRESS", "INSUFFICIENT_CREDIT"
      message: string;
      details?: any;
    };
    http_status: number;
  }
  ```

- [ ] **Common Error Codes** (PDF Section 9.2)
  - [ ] `INVALID_ADDRESS` - Address validation failed
  - [ ] `UNSUPPORTED_POSTCODE` - Postcode not serviceable
  - [ ] `INVALID_WEIGHT` - Weight exceeds limits
  - [ ] `INSUFFICIENT_CREDIT` - Account balance too low
  - [ ] `SERVICE_UNAVAILABLE` - Courier service not available
  - [ ] `INVALID_PICKUP_DATE` - Pickup date not available

### 3.2 Malaysian Address Validation
- [ ] **Postcode Validation** (PDF Appendix A)
  ```typescript
  const MALAYSIAN_POSTCODE_RANGES = {
    "KUL": [50000, 60999], // Kuala Lumpur & Putrajaya
    "SEL": [40000, 48999], // Selangor
    "JOH": [79000, 86999], // Johor
    "MLK": [75000, 78999], // Melaka
    // ... complete mapping from PDF
  };
  ```

- [ ] **State Code Mapping** (PDF Appendix B)
  ```typescript
  const MALAYSIAN_STATES = {
    "JOH": "Johor",
    "KDH": "Kedah", 
    "KTN": "Kelantan",
    "MLK": "Melaka",
    // ... complete mapping
  };
  ```

---

## **Phase 4: API Endpoints Enhancement**

### 4.1 Shipping Rates API Update
- [ ] **Enhance** `/api/shipping/rates` (Current: Basic implementation)
  - [ ] Add real-time EasyParcel rate fetching
  - [ ] Add service type filtering (STANDARD, EXPRESS, OVERNIGHT)
  - [ ] Add insurance and COD options
  - [ ] Add delivery time estimates

### 4.2 New Shipment Management APIs
- [x] **Create** `/api/shipping/book` - Shipment booking after payment
- [x] **Create** `/api/shipping/labels/[shipmentId]` - Label generation
- [x] **Create** `/api/shipping/pickup/schedule` - Pickup scheduling
- [x] **Create** `/api/shipping/track/[trackingNumber]` - Tracking info
- [x] **Create** `/api/webhooks/easyparcel-tracking` - Webhook handler

### 4.3 Admin Shipping APIs
- [x] **Create** `/api/admin/shipping/bulk-book` - Bulk shipment booking
- [x] **Create** `/api/admin/shipping/bulk-labels` - Bulk label generation
- [x] **Create** `/api/admin/shipping/stats` - Shipping statistics
- [x] **Create** `/api/admin/shipping/pending` - Pending shipments
- [x] **Create** `/api/admin/shipping/pickups` - Pickup schedules

---

## **Phase 5: Frontend Integration**

### 5.1 Checkout Enhancement
- [x] **Courier Selection Component**
  - [x] Real-time rate display with service types
  - [x] Delivery time estimates
  - [x] Insurance and COD options
  - [x] Special delivery instructions

### 5.2 Customer Order Tracking
- [x] **Tracking Page Enhancement** `/track`
  - [x] Real-time tracking status
  - [x] Delivery timeline visualization
  - [x] Delivery notifications
  - [x] Proof of delivery (signature/photo)

### 5.3 Admin Shipping Dashboard
- [x] **Fulfillment Workflow** `/admin/shipping/fulfillment`
  - [x] Pending shipments list
  - [x] Bulk label generation
  - [x] Pickup scheduling interface
  - [x] Shipping performance analytics

---

## **Phase 6: Malaysian Compliance & Testing**

### 6.1 GST/SST Integration
- [x] **Tax Calculation** on shipping costs
- [x] **Tax-inclusive** shipping rate display
- [x] **Invoice generation** with proper tax breakdown

### 6.2 Testing Scenarios
- [x] **Sandbox Testing** (PDF Section 10)
  - [x] Rate calculation for all Malaysian states
  - [x] Shipment booking and cancellation
  - [x] Label generation and download
  - [x] Tracking updates via webhook
  - [x] Error handling scenarios
  - [x] **Comprehensive EasyParcel Test Suite Framework**
  - [x] **Admin Testing API Endpoints** (`/api/admin/testing/easyparcel/`)
  - [x] **Test Execution Logs API** (`/api/admin/testing/easyparcel/logs/`)
  - [x] **Performance Benchmark API** (`/api/admin/testing/easyparcel/benchmark/`)

### 6.3 Production Readiness
- [x] **Credential Migration** to production
- [x] **Webhook URL** configuration
- [x] **SSL Certificate** verification
- [x] **Rate Limiting** implementation
- [x] **Error Monitoring** setup
- [x] **Production Configuration Management System**
- [x] **Production Readiness Validation Framework**
- [x] **Admin Production Management API** (`/api/admin/production/easyparcel/`)

---

## **Phase 7: Performance & Monitoring**

### 7.1 Caching Strategy
- [x] **Rate Caching** - Cache shipping rates for 30 minutes
- [x] **State/Postcode Validation** - Cache validation results
- [x] **Courier Service List** - Cache available services
- [x] **Intelligent Cache Management System**
- [x] **Redis & Memory Cache Implementation**
- [x] **Cache Statistics and Analytics**

### 7.2 Monitoring & Alerts
- [x] **API Response Times** monitoring
- [x] **Error Rate** tracking
- [x] **Failed Shipment** alerts
- [x] **Webhook Failure** notifications
- [x] **Comprehensive Performance Monitoring Framework**
- [x] **Real-time Alert System with Configurable Thresholds**
- [x] **Admin Monitoring Dashboard API** (`/api/admin/monitoring/easyparcel/`)
- [x] **Enhanced EasyParcel Service with Integrated Monitoring**

---

## ✅ Implementation Checklist Summary

### **Database (Phase 1)**
- [x] Product weight and dimensions fields
- [x] Shipment model with full lifecycle tracking  
- [x] Shipment tracking events model
- [x] Order model enhancements

### **Backend Services (Phase 2-3)**
- [x] EasyParcel service alignment with v1.4.0 API
- [x] Comprehensive error handling
- [x] Malaysian address validation
- [x] Webhook integration for real-time updates

### **API Endpoints (Phase 4)**
- [x] Enhanced shipping rates calculation
- [x] Shipment booking and management
- [x] Label generation and download
- [x] Admin bulk operations

### **Frontend (Phase 5)**
- [x] Courier selection in checkout
- [x] Customer tracking portal
- [x] Admin shipping dashboard

### **Compliance & Testing (Phase 6)**
- [x] Malaysian tax integration
- [x] Comprehensive testing scenarios
- [x] Production deployment readiness

### **Production (Phase 7)**
- [x] Performance optimization
- [x] Monitoring and alerting
- [x] Documentation and training

### **Integration Testing (Phase 8)**
- [x] Address validation error fixes
- [x] API route response handling fixes  
- [x] Sandbox environment testing
- [x] Web interface integration verification
- [x] End-to-end shipping calculation flow

---

## 📞 Support & References

### **EasyParcel Documentation**
- **API Reference**: Malaysia_Individual_1.4.0.0.pdf
- **Sandbox Environment**: https://connect.easyparcel.my/api/v2/
- **Support Email**: support@easyparcel.my

### **Malaysian Standards**
- **Postal Codes**: https://www.pos.com.my/
- **GST Guidelines**: https://gst.customs.gov.my/
- **PDPA Compliance**: https://www.pdp.gov.my/

---

*This implementation guide serves as the complete reference for EasyParcel API v1.4.0 integration. Each checkbox item should be completed and verified before proceeding to the next phase.*

**Estimated Total Implementation Time**: 12-16 hours  
**Recommended Team Size**: 1-2 developers  
**Testing Duration**: 2-3 days in sandbox environment