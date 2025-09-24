# Automatic Shipment Creation Implementation Plan

## Overview

This plan implements automatic shipment creation and airway bill generation immediately after payment success, eliminating manual admin intervention and achieving the intended customer experience: Order → Payment → Automatic Processing → Airway Bill Available.

## Current State Analysis

### ✅ Existing Infrastructure
- **Database Schema**: Complete shipment tables (Shipment, ShipmentTracking, TrackingCache)
- **Order Creation**: Customer courier selection captured during checkout
- **Payment Processing**: Webhook updates order status to CONFIRMED/PAID
- **EasyParcel Integration**: API and CSV export capabilities
- **Admin Interface**: Manual courier assignment system at `/admin/shipping/orders`

### ❌ Critical Gap
- **Manual Bottleneck**: Requires admin to manually assign couriers and create shipments
- **Customer Experience Gap**: No automatic airway bill generation after payment
- **Process Inefficiency**: 3-step manual process instead of automatic flow

## Architecture Principles (Adherence to CLAUDE.md)

### 1. Single Source of Truth
- **Courier Selection**: Use customer's checkout selection as primary source
- **Order Processing Logic**: Centralized in `OrderStatusHandler`
- **Shipment Creation**: Single service class handling all scenarios

### 2. DRY (Don't Repeat Yourself)
- **Reuse Existing**: Leverage current EasyParcel integration
- **Unified Logic**: Same shipment creation whether manual or automatic
- **Shared Validation**: Common courier rate validation across flows

### 3. Centralized Approach
- **Service Layer**: `AutomaticShipmentService` as central orchestrator
- **Configuration Management**: Business rules in centralized config
- **Error Handling**: Unified error handling and fallback strategies

## Implementation Strategy

### Phase 1: Core Service Development
**Duration**: 3-4 days
**Files to Create/Modify**:

#### 1.1 Create Automatic Shipment Service
**File**: `/src/lib/services/automatic-shipment.service.ts`

```typescript
export class AutomaticShipmentService {
  // Centralized logic for automatic shipment creation
  static async createShipmentFromOrder(orderId: string): Promise<ShipmentResult>
  static async validateCourierSelection(courierData: CourierSelection): Promise<boolean>
  static async generateAirwayBill(shipmentId: string): Promise<AirwayBillResult>
  static async handleShipmentFailure(orderId: string, error: Error): Promise<void>
}
```

**Responsibilities**:
- Extract courier selection from order
- Validate courier availability and pricing
- Create EasyParcel shipment via API
- Generate and store airway bill URL
- Handle failures with appropriate fallbacks
- Update order status and tracking information

#### 1.2 Enhance Payment Success Webhook
**File**: `/src/app/api/webhooks/payment-success/route.ts`

**Current Flow**:
```
Payment Success → Update Order Status → Done
```

**Enhanced Flow**:
```
Payment Success → Update Order Status → Create Shipment → Generate Airway Bill → Update Tracking
```

**Implementation**:
```typescript
// After existing order status update
if (order.paymentStatus === 'PAID') {
  // Trigger automatic shipment creation
  try {
    await AutomaticShipmentService.createShipmentFromOrder(order.id);
    console.log('✅ Automatic shipment created for order:', order.orderNumber);
  } catch (shipmentError) {
    console.error('❌ Automatic shipment failed:', shipmentError);
    // Fallback: Queue for manual processing
    await QueueManualProcessing.add(order.id, shipmentError);
  }
}
```

#### 1.3 Create Configuration Management
**File**: `/src/lib/config/automatic-shipment.config.ts`

```typescript
export const AutomaticShipmentConfig = {
  enabled: true,
  fallbackToManual: true,
  retryAttempts: 3,
  supportedCouriers: ['poslaju', 'gdex', 'jnt', 'dhl'],
  businessRules: {
    maxOrderValue: 5000, // Auto-process orders up to RM 5000
    allowedStates: ['JOH', 'KDH', 'KTN', 'MLK', 'NSN', 'PHG', 'PRK', 'PLS', 'PNG', 'KUL', 'TRG', 'SEL', 'SBH', 'SWK', 'LBN'],
    requiresInsurance: (orderValue: number) => orderValue > 500
  }
};
```

### Phase 2: Integration and Data Flow
**Duration**: 2-3 days

#### 2.1 Modify Order Creation to Store Courier Details
**File**: `/src/app/api/orders/route.ts`

**Enhancement**: Ensure courier selection is properly stored
```typescript
// Store complete courier selection data
const courierSelection = {
  courierId: orderData.shippingRate.courierId,
  courierName: orderData.shippingRate.courierName,
  serviceName: orderData.shippingRate.serviceName,
  serviceType: orderData.shippingRate.serviceType,
  price: orderData.shippingRate.price,
  estimatedDelivery: orderData.shippingRate.estimatedDelivery,
  features: orderData.shippingRate.features
};

// Store in order record for later use
await tx.order.update({
  where: { id: order.id },
  data: {
    selectedCourierId: courierSelection.courierId,
    shippingPreferences: courierSelection
  }
});
```

#### 2.2 Create Fallback Queue System
**File**: `/src/lib/services/manual-processing-queue.service.ts`

```typescript
export class ManualProcessingQueue {
  // For orders that fail automatic processing
  static async addToQueue(orderId: string, reason: string, priority: 'HIGH' | 'NORMAL' = 'NORMAL')
  static async getQueuedOrders(): Promise<QueuedOrder[]>
  static async markAsProcessed(orderId: string)
}
```

#### 2.3 Enhance Order Status Handler
**File**: `/src/lib/notifications/order-status-handler.ts`

**Add New Status**: `PROCESSING_SHIPMENT`
```typescript
// New order status flow
PENDING → CONFIRMED → PROCESSING_SHIPMENT → SHIPPED → DELIVERED

// Enhanced status handler
export const OrderStatusHandler = {
  async handleOrderStatusChange(params: StatusChangeParams) {
    // Existing logic...

    // New: Handle automatic shipment processing
    if (params.newStatus === 'PROCESSING_SHIPMENT') {
      await this.notifyShipmentProcessing(params.orderId);
    }

    if (params.newStatus === 'SHIPPED' && params.metadata?.automaticCreation) {
      await this.notifyAutomaticShipment(params.orderId, params.metadata.trackingNumber);
    }
  }
};
```

### Phase 3: Admin Interface Enhancements
**Duration**: 2 days

#### 3.1 Create Automatic Processing Dashboard
**File**: `/src/app/admin/shipping/automatic/page.tsx`

**Features**:
- Real-time automatic processing status
- Failed automation queue management
- Success/failure rate analytics
- Manual intervention triggers

#### 3.2 Enhance Existing Admin Orders Interface
**File**: `/src/app/admin/shipping/orders/page.tsx`

**Enhancements**:
- Filter for "Auto-processed" vs "Manual" orders
- Quick retry button for failed automatic processing
- Status indicators showing processing type (automatic/manual)

### Phase 4: Error Handling and Resilience
**Duration**: 2 days

#### 4.1 Create Comprehensive Error Handling
**File**: `/src/lib/services/shipment-error-handler.service.ts`

```typescript
export class ShipmentErrorHandler {
  static async handleEasyParcelApiFailure(orderId: string, error: EasyParcelError)
  static async handleCourierValidationFailure(orderId: string, courierData: any)
  static async handleNetworkFailure(orderId: string, retryCount: number)
  static async escalateToManualProcessing(orderId: string, reason: string)
}
```

**Error Categories**:
- **API Failures**: EasyParcel service unavailable
- **Validation Failures**: Courier no longer available at selected rate
- **Business Rule Violations**: Order value, destination restrictions
- **Network Issues**: Temporary connectivity problems

#### 4.2 Implement Circuit Breaker Pattern
**File**: `/src/lib/utils/circuit-breaker.ts`

```typescript
export class EasyParcelCircuitBreaker {
  // Prevent cascade failures when EasyParcel API is down
  static async execute<T>(operation: () => Promise<T>): Promise<T>
  static getStatus(): 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  static reset(): void
}
```

### Phase 5: Testing and Validation
**Duration**: 2-3 days

#### 5.1 Create Comprehensive Test Suite
**Files**:
- `/src/lib/services/__tests__/automatic-shipment.service.test.ts`
- `/src/app/api/__tests__/payment-webhook-shipment.test.ts`
- `/src/lib/utils/__tests__/circuit-breaker.test.ts`

**Test Scenarios**:
- ✅ Successful automatic shipment creation
- ❌ EasyParcel API failure with fallback
- ❌ Invalid courier selection handling
- ❌ Network timeout scenarios
- ✅ Business rule validation
- ✅ Airway bill generation and storage

#### 5.2 Integration Testing
- End-to-end order flow testing
- Payment webhook with shipment creation
- Admin interface integration
- Error handling validation

## Database Schema Enhancements

### Required Schema Updates
**File**: `/prisma/schema.prisma`

```prisma
model Order {
  // Add new fields for automatic processing
  selectedCourierId     String?
  shippingPreferences   Json?              // Store complete courier selection
  automaticProcessing   Boolean @default(true)
  processingAttempts    Int     @default(0)
  lastProcessingError   String?
  processingQueuedAt    DateTime?

  // Existing fields remain unchanged
}

model Shipment {
  // Add automatic processing tracking
  createdViaApi         Boolean @default(true)
  automaticCreation     Boolean @default(false)
  creationMethod        String  @default("MANUAL") // "AUTOMATIC" | "MANUAL" | "RETRY"

  // Existing fields remain unchanged
}
```

### Migration Strategy
```sql
-- Migration: Add automatic processing fields
ALTER TABLE orders
ADD COLUMN selected_courier_id VARCHAR(255),
ADD COLUMN shipping_preferences JSONB,
ADD COLUMN automatic_processing BOOLEAN DEFAULT true,
ADD COLUMN processing_attempts INTEGER DEFAULT 0,
ADD COLUMN last_processing_error TEXT,
ADD COLUMN processing_queued_at TIMESTAMP;

ALTER TABLE shipments
ADD COLUMN created_via_api BOOLEAN DEFAULT true,
ADD COLUMN automatic_creation BOOLEAN DEFAULT false,
ADD COLUMN creation_method VARCHAR(20) DEFAULT 'MANUAL';
```

## Configuration Management

### Environment Variables
```env
# Automatic Shipment Configuration
AUTOMATIC_SHIPMENT_ENABLED=true
AUTOMATIC_SHIPMENT_MAX_ORDER_VALUE=5000
AUTOMATIC_SHIPMENT_RETRY_ATTEMPTS=3
AUTOMATIC_SHIPMENT_FALLBACK_TO_MANUAL=true

# EasyParcel Circuit Breaker
EASYPARCEL_CIRCUIT_BREAKER_THRESHOLD=5
EASYPARCEL_CIRCUIT_BREAKER_TIMEOUT=60000
EASYPARCEL_CIRCUIT_BREAKER_RESET_TIMEOUT=300000
```

### Business Rules Configuration
**File**: `/src/lib/config/business-rules.config.ts`

```typescript
export const BusinessRules = {
  automaticProcessing: {
    enabled: process.env.AUTOMATIC_SHIPMENT_ENABLED === 'true',
    maxOrderValue: parseInt(process.env.AUTOMATIC_SHIPMENT_MAX_ORDER_VALUE || '5000'),
    supportedDestinations: ['MY'], // Malaysia only initially
    requiresManualReview: (order: Order) => {
      return order.total > BusinessRules.automaticProcessing.maxOrderValue ||
             order.customerNotes?.toLowerCase().includes('fragile') ||
             order.items.some(item => item.product.shippingClass === 'HAZARDOUS');
    }
  }
};
```

## Implementation Timeline

### Week 1: Foundation
- **Day 1-2**: Create `AutomaticShipmentService` and core logic
- **Day 3**: Enhance payment success webhook
- **Day 4**: Configuration management and business rules
- **Day 5**: Database schema updates and migrations

### Week 2: Integration
- **Day 1-2**: Order creation enhancements and data flow
- **Day 3**: Error handling and circuit breaker implementation
- **Day 4-5**: Fallback queue system and manual processing integration

### Week 3: Interface and Testing
- **Day 1-2**: Admin interface enhancements
- **Day 3-4**: Comprehensive testing suite
- **Day 5**: Integration testing and validation

### Week 4: Deployment and Monitoring
- **Day 1-2**: Staging deployment and testing
- **Day 3**: Production deployment with feature flags
- **Day 4-5**: Monitoring, optimization, and documentation

## Risk Mitigation

### Technical Risks
1. **EasyParcel API Failures**
   - **Mitigation**: Circuit breaker pattern + automatic fallback to manual queue
   - **Monitoring**: Real-time API health checks

2. **Data Inconsistency**
   - **Mitigation**: Database transactions + rollback procedures
   - **Validation**: Pre and post-processing data validation

3. **Performance Impact**
   - **Mitigation**: Async processing + queue systems
   - **Monitoring**: Response time tracking

### Business Risks
1. **Incorrect Automatic Processing**
   - **Mitigation**: Comprehensive validation + manual review queue
   - **Safety**: Business rule enforcement + admin override capabilities

2. **Customer Experience Issues**
   - **Mitigation**: Clear communication + fallback notifications
   - **Support**: Enhanced tracking and customer service tools

## Success Metrics

### Technical KPIs
- **Automation Rate**: >90% of eligible orders processed automatically
- **Processing Time**: <2 minutes from payment to airway bill generation
- **Error Rate**: <5% automatic processing failures
- **API Uptime**: >99.5% EasyParcel integration availability

### Business KPIs
- **Customer Satisfaction**: Faster order processing feedback
- **Operational Efficiency**: 80% reduction in manual courier assignment
- **Cost Savings**: Reduced admin time and processing overhead
- **Order Fulfillment**: 50% faster average fulfillment time

## Deployment Strategy

### Phase 1: Feature Flag Deployment
```typescript
// Feature flag control
const AUTOMATIC_SHIPMENT_FEATURE = {
  enabled: false, // Start disabled
  rolloutPercentage: 0, // Gradual rollout
  allowedOrderTypes: ['STANDARD'], // Exclude complex orders initially
};
```

### Phase 2: Gradual Rollout
- **Week 1**: 10% of eligible orders
- **Week 2**: 25% of eligible orders
- **Week 3**: 50% of eligible orders
- **Week 4**: 100% rollout (if metrics are positive)

### Phase 3: Full Production
- Remove feature flags
- Enable for all order types
- Implement advanced optimizations

## Monitoring and Alerting

### Key Metrics to Monitor
1. **Processing Success Rate**: Automatic vs manual processing ratios
2. **Error Classifications**: API failures, validation errors, business rule violations
3. **Performance Metrics**: Processing times, queue lengths, retry rates
4. **Customer Impact**: Order-to-shipment time improvements

### Alert Thresholds
- **Critical**: >10% automatic processing failure rate
- **Warning**: >5% processing failures or >5 minute processing times
- **Info**: Queue length >50 orders or retry rate >15%

## Conclusion

This implementation plan provides a systematic, centralized approach to automatic shipment creation while maintaining the flexibility to fallback to manual processing when needed. The solution adheres to software architecture best practices with single source of truth, DRY principles, and comprehensive error handling.

The phased approach ensures minimal disruption to current operations while progressively enhancing the customer experience through automation.

---

**Next Steps**:
1. Review and approve this plan
2. Set up development environment with feature flags
3. Begin Phase 1 implementation with `AutomaticShipmentService`
4. Establish monitoring and alerting infrastructure