# toyyibPay Integration Implementation Plan

## 🎯 Executive Summary

This document outlines the complete integration of toyyibPay Malaysian payment gateway into the JRM E-commerce platform, following best practices architecture and maintaining consistency with the existing EasyParcel integration patterns.

## 📊 Current System Analysis

### Existing Payment Architecture
- **Primary Gateway**: Billplz (configured via environment variables)
- **Service Pattern**: `/src/lib/payments/billplz-service.ts`
- **API Endpoints**: `/src/app/api/payment/create-bill/route.ts`, `/src/app/api/payment/webhook/route.ts`
- **Database Integration**: Orders table with `paymentMethod` field
- **Features**: Tax calculation, shipping, discounts, membership, audit logging

### Current Payment Flow
1. Customer checkout → Create bill via service
2. Redirect to payment gateway → Customer pays
3. Webhook processes payment status → Update order status
4. Success/failure handling → Customer notification

---

## 🏗️ Implementation Architecture

### 1. Database-First Credential Management
Following the EasyParcel pattern for secure, database-stored credentials:

```typescript
// System Config Storage
{
  key: 'toyyibpay_user_secret_key_encrypted',
  value: 'encrypted_secret_key_data',
  type: 'json'
}
{
  key: 'toyyibpay_environment', 
  value: 'sandbox|production',
  type: 'string'
}
{
  key: 'toyyibpay_category_code',
  value: 'default_category_code',
  type: 'string'  
}
```

### 2. Service Layer Architecture
Create `toyyibpay-service.ts` following the same pattern as `easyparcel-service.ts`:

```typescript
export class ToyyibPayService {
  private credentials: ToyyibPayCredentials | null = null;
  private isConfigured: boolean = false;
  private isSandbox: boolean = true;
  private baseURL: string;
  private categoryCode: string | null = null;
}
```

### 3. Multi-Gateway Support
Implement payment method selection with graceful fallback:

```typescript
enum PaymentMethod {
  TOYYIBPAY = 'TOYYIBPAY',
  BILLPLZ = 'BILLPLZ'
}
```

---

## 📋 Detailed Implementation Checklist

### Phase 1: Foundation & Security (Week 1)

#### 1.1 Database Schema Updates
- [ ] Add `systemConfig` entries for toyyibPay credentials
- [ ] Update `Order.paymentMethod` enum to include 'TOYYIBPAY'
- [ ] Add `toyyibpay_bill_code` field to orders table
- [ ] Create migration scripts for new fields

#### 1.2 Credential Management Service
- [ ] Create `src/lib/services/toyyibpay-credentials.ts`
- [ ] Implement encrypted credential storage (following EasyParcel pattern)
- [ ] Add credential validation methods
- [ ] Create environment switching (sandbox ↔ production)
- [ ] Add category management (create/retrieve default category)

#### 1.3 Core Service Implementation
- [ ] Create `src/lib/payments/toyyibpay-service.ts`
- [ ] Implement API client with proper authentication
- [ ] Add error handling and retry logic
- [ ] Create category management methods
- [ ] Implement bill creation functionality
- [ ] Add transaction status checking

### Phase 2: API Integration (Week 2)

#### 2.1 Admin Configuration Interface
- [ ] Create admin settings page: `/src/app/admin/payment/toyyibpay/page.tsx`
- [ ] Add credential input form with validation
- [ ] Implement environment switching UI
- [ ] Add category creation interface
- [ ] Create API test functionality
- [ ] Add connection status indicators

#### 2.2 API Routes Implementation
- [ ] Create `/src/app/api/admin/toyyibpay/credentials/route.ts`
- [ ] Create `/src/app/api/admin/toyyibpay/categories/route.ts`
- [ ] Create `/src/app/api/admin/toyyibpay/test/route.ts`
- [ ] Implement credential CRUD operations
- [ ] Add category management endpoints
- [ ] Create connection testing endpoints

### Phase 3: Payment Flow Integration (Week 3)

#### 3.1 Payment Method Selection
- [ ] Update checkout UI for gateway selection
- [ ] Create payment method router service
- [ ] Implement fallback mechanisms
- [ ] Add gateway-specific configurations
- [ ] Update order creation flow

#### 3.2 Bill Creation & Processing
- [ ] Update `/src/app/api/payment/create-bill/route.ts` for multi-gateway
- [ ] Implement toyyibPay bill creation
- [ ] Add proper amount formatting (RM to cents conversion)
- [ ] Integrate with existing tax/shipping calculations
- [ ] Add external reference number mapping

#### 3.3 Webhook Handling
- [ ] Create `/src/app/api/webhooks/toyyibpay/route.ts`
- [ ] Implement signature verification (if available)
- [ ] Add callback parameter processing
- [ ] Update order status based on payment status
- [ ] Integrate with notification system

### Phase 4: User Experience & UI (Week 4)

#### 4.1 Customer-Facing Interface
- [ ] Create payment method selection component
- [ ] Add toyyibPay branding and logos
- [ ] Implement payment flow indicators
- [ ] Add loading states and error handling
- [ ] Create success/failure pages

#### 4.2 Admin Dashboard Enhancements
- [ ] Add toyyibPay payment statistics
- [ ] Create settlement summary reports
- [ ] Add payment method analytics
- [ ] Implement transaction monitoring
- [ ] Create reconciliation tools

### Phase 5: Testing & Quality Assurance (Week 5)

#### 5.1 Unit Testing
- [ ] Test credential management service
- [ ] Test toyyibPay service methods
- [ ] Test webhook processing
- [ ] Test error handling scenarios
- [ ] Test environment switching

#### 5.2 Integration Testing
- [ ] Test full payment flow (sandbox)
- [ ] Test webhook callbacks
- [ ] Test order status updates
- [ ] Test notification system
- [ ] Test admin interface functionality

#### 5.3 Production Testing
- [ ] Deploy to staging environment
- [ ] Test with real toyyibPay sandbox
- [ ] Verify webhook handling
- [ ] Test transaction reconciliation
- [ ] Performance testing

---

## 🎨 User Experience & Interface Design

### 1. Payment Method Selection
**Location**: Checkout page payment step
**Design**: Card-based selection with gateway logos and features

```typescript
interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  features: string[];
  processingFee?: string;
  supportedChannels: string[];
}
```

### 2. Admin Configuration Interface
**Location**: `/admin/settings/payment/toyyibpay`
**Features**:
- Credential management (encrypted storage)
- Environment switching
- Category management
- Connection testing
- Transaction monitoring
- Settlement reports

### 3. Payment Status Indicators
- Real-time payment status updates
- Clear success/failure messaging
- Transaction reference numbers
- Receipt generation options

---

## 🔧 Technical Implementation Details

### 1. API Integration Specifications

#### toyyibPay API Endpoints to Implement:
- **Create Category**: `POST /index.php/api/createCategory`
- **Create Bill**: `POST /index.php/api/createBill`
- **Get Bill Transactions**: `POST /index.php/api/getBillTransactions`
- **Inactive Bill**: `POST /index.php/api/inactiveBill`

#### Key Parameters Mapping:
```typescript
interface ToyyibPayBillRequest {
  userSecretKey: string;
  categoryCode: string;
  billName: string; // Max 30 chars
  billDescription: string; // Max 100 chars
  billPriceSetting: 0 | 1; // 0=dynamic, 1=fixed
  billPayorInfo: 0 | 1; // 0=no info required, 1=info required
  billAmount: number; // In cents
  billReturnUrl: string;
  billCallbackUrl: string;
  billExternalReferenceNo: string;
  billTo: string;
  billEmail: string;
  billPhone: string;
  billPaymentChannel: '0' | '1' | '2'; // 0=FPX, 1=CC, 2=Both
}
```

### 2. Database Schema Changes

```sql
-- Orders table updates
ALTER TABLE orders ADD COLUMN toyyibpay_bill_code VARCHAR(255);
ALTER TABLE orders ADD COLUMN toyyibpay_payment_url TEXT;
ALTER TABLE orders MODIFY COLUMN paymentMethod ENUM('BILLPLZ', 'TOYYIBPAY', 'BANK_TRANSFER');

-- System configuration for credentials
INSERT INTO system_config (key, value, type) VALUES 
('toyyibpay_user_secret_key_encrypted', '{}', 'json'),
('toyyibpay_environment', 'sandbox', 'string'),
('toyyibpay_category_code', '', 'string'),
('toyyibpay_credentials_enabled', 'false', 'boolean');
```

### 3. Security Implementation

#### Credential Encryption
Following EasyParcel pattern:
```typescript
interface EncryptedCredential {
  encrypted: string;
  iv: string;
  tag: string;
}
```

#### Webhook Security
- IP whitelisting (if supported by toyyibPay)
- Reference number validation
- Order status verification
- Duplicate payment prevention

---

## 🚀 Deployment Strategy

### 1. Environment Configuration
```env
# toyyibPay Configuration - Centralized
TOYYIBPAY_SANDBOX_URL="http://dev.toyyibpay.com"
TOYYIBPAY_PRODUCTION_URL="https://toyyibpay.com"
TOYYIBPAY_WEBHOOK_URL="${NEXT_PUBLIC_APP_URL}/api/webhooks/toyyibpay"
TOYYIBPAY_RETURN_URL="${NEXT_PUBLIC_APP_URL}/checkout/success"
TOYYIBPAY_CALLBACK_TIMEOUT="30000"
```

### 2. Staging Deployment Steps
1. Deploy credential management service
2. Configure sandbox credentials
3. Test payment flow end-to-end
4. Verify webhook processing
5. Test admin interface
6. Performance testing

### 3. Production Deployment Steps
1. Create production toyyibPay account
2. Configure production credentials
3. Update webhook URLs
4. Deploy with feature flags
5. Gradual rollout (10% → 50% → 100%)
6. Monitor transaction success rates

---

## 📊 Success Metrics & KPIs

### Technical Metrics
- [ ] **Integration Success Rate**: >99.5% successful API calls
- [ ] **Webhook Processing**: <2s response time
- [ ] **Payment Completion Rate**: >95% successful payments
- [ ] **Error Rate**: <0.5% payment processing errors

### Business Metrics
- [ ] **Customer Adoption**: >70% customers choose toyyibPay
- [ ] **Payment Conversion**: Maintain >85% checkout completion
- [ ] **Processing Costs**: Reduce payment processing fees by >15%
- [ ] **Settlement Speed**: 2-3 business days (vs 5-7 for alternatives)

### User Experience Metrics
- [ ] **Payment Flow Time**: <60s average completion
- [ ] **Customer Satisfaction**: >4.5/5 rating
- [ ] **Support Tickets**: <2% payment-related issues
- [ ] **Admin Efficiency**: 80% reduction in payment configuration time

---

## 🔍 Risk Assessment & Mitigation

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|---------|------------|------------|
| API Downtime | High | Low | Implement fallback to Billplz |
| Webhook Failures | Medium | Medium | Retry mechanism + manual reconciliation |
| Credential Breach | High | Low | Encryption + audit logging |
| Rate Limiting | Medium | Low | Request throttling + queuing |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|---------|------------|------------|
| Customer Confusion | Medium | Medium | Clear UI/UX + documentation |
| Transaction Disputes | High | Low | Comprehensive logging + support |
| Compliance Issues | High | Low | Legal review + audit trail |
| Integration Delays | Medium | Medium | Phased rollout + contingency |

---

## 📚 Additional Considerations

### 1. Malaysian Market Specifics
- **FPX Integration**: Primary payment method for Malaysian customers
- **Local Banking**: Support for all major Malaysian banks
- **Language Support**: Bahasa Malaysia interface options
- **Currency**: MYR handling with proper formatting
- **Business Hours**: Consider local timezone for settlement

### 2. Compliance & Legal
- **Data Privacy**: PDPA compliance for customer data
- **Financial Regulations**: BNM guidelines compliance
- **Tax Implications**: SST on payment processing fees
- **Audit Requirements**: Transaction logging and reporting

### 3. Scalability Planning
- **Transaction Volume**: Design for 10,000+ transactions/month
- **Concurrent Users**: Handle 1000+ simultaneous checkouts
- **Geographic Expansion**: Consider Singapore/ASEAN expansion
- **Multi-Currency**: Future USD/SGD support planning

---

## ✅ Final Implementation Checklist

### Pre-Development
- [ ] toyyibPay account setup (sandbox + production)
- [ ] API documentation review complete
- [ ] Architecture design approved
- [ ] Database schema planned
- [ ] Security requirements defined

### Development Phase
- [ ] Credential management service
- [ ] Core toyyibPay service
- [ ] Admin configuration interface
- [ ] Payment flow integration
- [ ] Webhook handling
- [ ] Error handling & logging

### Testing Phase
- [ ] Unit tests (>90% coverage)
- [ ] Integration tests
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Security testing
- [ ] Production sandbox testing

### Deployment Phase
- [ ] Staging deployment
- [ ] Production credential setup
- [ ] Webhook configuration
- [ ] Monitoring setup
- [ ] Documentation complete
- [ ] Team training complete

### Post-Launch
- [ ] Transaction monitoring
- [ ] Performance analytics
- [ ] Customer feedback collection
- [ ] Settlement reconciliation
- [ ] Support documentation

---

**Estimated Timeline**: 5-6 weeks
**Team Requirements**: 1 Full-stack developer + 1 QA + 1 DevOps
**Budget Considerations**: toyyibPay account fees + development time
**Success Criteria**: Seamless multi-gateway payment system with database-managed credentials

---

*This implementation plan ensures secure, scalable, and maintainable toyyibPay integration following industry best practices and maintaining consistency with the existing EasyParcel integration pattern.*