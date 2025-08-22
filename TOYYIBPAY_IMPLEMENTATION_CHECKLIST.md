# toyyibPay Implementation Checklist

## 📋 Complete Step-by-Step Implementation Guide

This checklist provides granular, actionable steps for implementing toyyibPay integration following best practices and maintaining architectural consistency.

---

## 🚀 Phase 1: Foundation & Security (Week 1)

### Day 1-2: Database Schema & Core Setup

#### Database Schema Updates
- [ ] **1.1** Update Prisma schema to add toyyibPay fields to Orders table:
  ```prisma
  model Order {
    // ... existing fields
    toyyibpayBillCode    String?
    toyyibpayPaymentUrl  String?
    paymentMethod        String? // Update enum to include 'TOYYIBPAY'
  }
  ```

- [ ] **1.2** Create migration file: `npx prisma migrate dev --name add_toyyibpay_fields`

- [ ] **1.3** Add toyyibPay system config entries to database:
  ```sql
  INSERT INTO system_config (key, value, type) VALUES 
  ('toyyibpay_user_secret_key_encrypted', '{}', 'json'),
  ('toyyibpay_environment', 'sandbox', 'string'),
  ('toyyibpay_category_code', '', 'string'),
  ('toyyibpay_credentials_enabled', 'false', 'boolean'),
  ('toyyibpay_credentials_updated_by', '', 'string');
  ```

- [ ] **1.4** Run migration and verify database changes: `npm run db:migrate`

- [ ] **1.5** Test database connection and schema updates

### Day 3-4: Credential Management Service

#### Create toyyibPay Credentials Service
- [ ] **2.1** Create file: `/src/lib/services/toyyibpay-credentials.ts`

- [ ] **2.2** Implement credential interface:
  ```typescript
  export interface ToyyibPayCredentials {
    userSecretKey: string;
    environment: 'sandbox' | 'production';
    categoryCode?: string;
    lastUpdated?: Date;
    updatedBy?: string;
  }
  ```

- [ ] **2.3** Implement `ToyyibPayCredentialsService` class with methods:
  - [ ] `storeCredentials()` - Encrypt and store credentials in database
  - [ ] `getCredentials()` - Retrieve and decrypt credentials
  - [ ] `getCredentialStatus()` - Get configuration status
  - [ ] `switchEnvironment()` - Switch between sandbox/production
  - [ ] `clearCredentials()` - Clear stored credentials
  - [ ] `validateCredentials()` - Test API connection
  - [ ] `logCredentialOperation()` - Audit logging

- [ ] **2.4** Implement encryption/decryption using existing security utils

- [ ] **2.5** Add caching mechanism (5-minute cache duration)

- [ ] **2.6** Create singleton instance export

- [ ] **2.7** Add comprehensive error handling and logging

### Day 5: Category Management

#### toyyibPay Category Service
- [ ] **3.1** Create file: `/src/lib/services/toyyibpay-category.ts`

- [ ] **3.2** Implement category management:
  ```typescript
  export interface ToyyibPayCategory {
    categoryCode: string;
    categoryName: string;
    categoryDescription: string;
    categoryStatus: string;
  }
  ```

- [ ] **3.3** Add methods:
  - [ ] `createCategory()` - Create new category via API
  - [ ] `getCategory()` - Get category details
  - [ ] `getOrCreateDefaultCategory()` - Ensure default category exists

- [ ] **3.4** Integrate with credentials service

- [ ] **3.5** Add proper error handling and validation

---

## 🔧 Phase 2: Core Service Implementation (Week 2)

### Day 1-2: toyyibPay Service Foundation

#### Create Main Service
- [ ] **4.1** Create file: `/src/lib/payments/toyyibpay-service.ts`

- [ ] **4.2** Implement service class structure:
  ```typescript
  export class ToyyibPayService {
    private credentials: ToyyibPayCredentials | null = null;
    private isConfigured: boolean = false;
    private isSandbox: boolean = true;
    private baseURL: string;
    private apiClient!: AxiosInstance;
    private categoryCode: string | null = null;
  }
  ```

- [ ] **4.3** Add configuration management:
  - [ ] `initializeCredentials()` - Load credentials from database
  - [ ] `initializeClient()` - Setup Axios client with proper headers
  - [ ] `ensureCredentials()` - Ensure credentials are loaded
  - [ ] `getBaseUrl()` - Get URL based on environment

- [ ] **4.4** Implement API client with:
  - [ ] Proper headers: `Content-Type: application/x-www-form-urlencoded`
  - [ ] Request/response interceptors for logging
  - [ ] Timeout configuration (30 seconds)
  - [ ] Error handling

### Day 3-4: Bill Creation Implementation

#### Bill Creation Methods
- [ ] **5.1** Implement bill creation interface:
  ```typescript
  export interface ToyyibPayBillRequest {
    userSecretKey: string;
    categoryCode: string;
    billName: string; // Max 30 alphanumeric + space + underscore
    billDescription: string; // Max 100 alphanumeric + space + underscore
    billPriceSetting: 0 | 1; // 0=dynamic, 1=fixed
    billPayorInfo: 0 | 1;
    billAmount: number; // In cents
    billReturnUrl: string;
    billCallbackUrl: string;
    billExternalReferenceNo: string;
    billTo: string;
    billEmail: string;
    billPhone?: string;
    billPaymentChannel: '0' | '1' | '2'; // FPX/CC/Both
  }
  ```

- [ ] **5.2** Add `createBill()` method:
  - [ ] Input validation (name/description length limits)
  - [ ] Amount conversion (RM to cents)
  - [ ] Form data preparation
  - [ ] API call to `/index.php/api/createBill`
  - [ ] Response parsing and error handling

- [ ] **5.3** Add `getBillTransactions()` method:
  - [ ] Query bill payment status
  - [ ] Parse transaction history
  - [ ] Handle different status codes (1=success, 2=pending, 3=fail)

- [ ] **5.4** Add `inactiveBill()` method for canceling bills

### Day 5: Testing & Validation

#### Service Testing
- [ ] **6.1** Create test file: `/src/lib/payments/__tests__/toyyibpay-service.test.ts`

- [ ] **6.2** Add unit tests for:
  - [ ] Credential initialization
  - [ ] Bill creation with valid data
  - [ ] Error handling for invalid data
  - [ ] Environment switching
  - [ ] Amount formatting

- [ ] **6.3** Test with toyyibPay sandbox account

- [ ] **6.4** Verify all methods work correctly

- [ ] **6.5** Add comprehensive logging for debugging

---

## 🎛️ Phase 3: Admin Interface (Week 3)

### Day 1-2: Admin API Routes

#### Credentials Management API
- [ ] **7.1** Create file: `/src/app/api/admin/payment/toyyibpay/credentials/route.ts`

- [ ] **7.2** Implement GET endpoint:
  - [ ] Check admin authentication
  - [ ] Return credential status (masked secret key)
  - [ ] Include environment and last updated info

- [ ] **7.3** Implement POST endpoint:
  - [ ] Validate admin permissions
  - [ ] Validate secret key format
  - [ ] Test API connection before storing
  - [ ] Store encrypted credentials
  - [ ] Log credential changes

- [ ] **7.4** Implement DELETE endpoint for credential clearing

#### Category Management API
- [ ] **8.1** Create file: `/src/app/api/admin/payment/toyyibpay/categories/route.ts`

- [ ] **8.2** Add endpoints:
  - [ ] GET: List categories
  - [ ] POST: Create new category
  - [ ] PUT: Update category
  - [ ] GET: Get category details

#### Test Connection API
- [ ] **9.1** Create file: `/src/app/api/admin/payment/toyyibpay/test/route.ts`

- [ ] **9.2** Implement connection testing:
  - [ ] Test credentials validation
  - [ ] Create test category
  - [ ] Measure response time
  - [ ] Return detailed test results

### Day 3-4: Admin Interface Components

#### Main Settings Page
- [ ] **10.1** Create file: `/src/app/admin/payment/toyyibpay/page.tsx`

- [ ] **10.2** Implement credential form:
  - [ ] User Secret Key input (password field)
  - [ ] Environment selector (sandbox/production)
  - [ ] Save/Clear buttons
  - [ ] Connection status indicator
  - [ ] Last updated information

- [ ] **10.3** Add category management section:
  - [ ] Default category display
  - [ ] Create new category form
  - [ ] Category list with status

- [ ] **10.4** Add testing section:
  - [ ] Test connection button
  - [ ] Response time display
  - [ ] API status indicator
  - [ ] Error message display

#### UI Components
- [ ] **11.1** Create credential status component:
  ```typescript
  interface CredentialStatusProps {
    isConfigured: boolean;
    environment: 'sandbox' | 'production';
    lastUpdated?: Date;
    onRefresh: () => void;
  }
  ```

- [ ] **11.2** Create connection test component with loading states

- [ ] **11.3** Add form validation and error handling

- [ ] **11.4** Implement auto-refresh for status updates

### Day 5: Navigation & Integration

#### Admin Navigation
- [ ] **12.1** Add toyyibPay to admin navigation menu

- [ ] **12.2** Update main payment settings page to include toyyibPay

- [ ] **12.3** Add breadcrumb navigation

- [ ] **12.4** Test admin interface end-to-end

- [ ] **12.5** Add proper loading states and error boundaries

---

## 💳 Phase 4: Payment Flow Integration (Week 4)

### Day 1-2: Payment Method Selection

#### Update Checkout Interface
- [ ] **13.1** Create payment method selector component:
  ```typescript
  interface PaymentMethodOption {
    id: 'BILLPLZ' | 'TOYYIBPAY';
    name: string;
    description: string;
    icon: React.ComponentType;
    features: string[];
    processingTime: string;
  }
  ```

- [ ] **13.2** Add toyyibPay option with:
  - [ ] toyyibPay logo/branding
  - [ ] "FPX & Credit Card" description
  - [ ] "Instant processing" feature
  - [ ] Malaysian bank logos

- [ ] **13.3** Update checkout flow to handle method selection

- [ ] **13.4** Add payment method validation

#### Payment Router Service
- [ ] **14.1** Create file: `/src/lib/payments/payment-router.ts`

- [ ] **14.2** Implement payment method routing:
  - [ ] Check gateway availability
  - [ ] Route to appropriate service
  - [ ] Handle fallback scenarios
  - [ ] Log routing decisions

### Day 3-4: Bill Creation Integration

#### Update Payment API
- [ ] **15.1** Modify `/src/app/api/payment/create-bill/route.ts`:

- [ ] **15.2** Add payment method detection:
  ```typescript
  const paymentMethod = body.paymentMethod || 'BILLPLZ';
  ```

- [ ] **15.3** Implement toyyibPay bill creation:
  - [ ] Map order data to toyyibPay format
  - [ ] Handle amount conversion (RM to cents)
  - [ ] Generate external reference number
  - [ ] Set callback/return URLs
  - [ ] Create bill via toyyibPay service

- [ ] **15.4** Update order creation:
  - [ ] Set paymentMethod = 'TOYYIBPAY'
  - [ ] Store toyyibpayBillCode
  - [ ] Store toyyibpayPaymentUrl
  - [ ] Log payment creation

- [ ] **15.5** Add comprehensive error handling

#### Response Format Updates
- [ ] **16.1** Standardize payment response format:
  ```typescript
  interface PaymentResponse {
    success: boolean;
    order: OrderSummary;
    payment: {
      method: PaymentMethod;
      billId: string;
      paymentUrl: string;
      expiresAt?: string;
    };
    error?: string;
  }
  ```

### Day 5: Testing Payment Creation

#### Integration Testing
- [ ] **17.1** Test complete payment flow:
  - [ ] Add items to cart
  - [ ] Select toyyibPay payment method
  - [ ] Complete checkout form
  - [ ] Verify bill creation
  - [ ] Check payment URL generation

- [ ] **17.2** Test error scenarios:
  - [ ] Invalid credentials
  - [ ] Network timeout
  - [ ] Invalid amount
  - [ ] Missing category

- [ ] **17.3** Test fallback to Billplz when toyyibPay fails

---

## 🔄 Phase 5: Webhook Implementation (Week 5)

### Day 1-2: Webhook Handler

#### Create Webhook Route
- [ ] **18.1** Create file: `/src/app/api/webhooks/toyyibpay/route.ts`

- [ ] **18.2** Implement webhook processing:
  ```typescript
  interface ToyyibPayCallback {
    refno: string;           // Payment reference
    status: '1' | '2' | '3'; // 1=success, 2=pending, 3=fail
    reason: string;          // Status reason
    billcode: string;        // Bill code
    order_id: string;        // External reference
    amount: string;          // Payment amount
    transaction_time: string; // Transaction timestamp
  }
  ```

- [ ] **18.3** Add webhook validation:
  - [ ] Verify required fields
  - [ ] Validate order_id format
  - [ ] Check amount matches order
  - [ ] Prevent duplicate processing

- [ ] **18.4** Implement status processing:
  - [ ] Status 1 (success): Update order to PAID
  - [ ] Status 2 (pending): Keep as PENDING
  - [ ] Status 3 (fail): Update to FAILED

### Day 3-4: Order Status Updates

#### Order Processing Logic
- [ ] **19.1** Create order update service:
  - [ ] Find order by external reference
  - [ ] Validate payment amount
  - [ ] Update payment status
  - [ ] Update order status
  - [ ] Log status changes

- [ ] **19.2** Integrate with existing notification system:
  - [ ] Send customer email notifications
  - [ ] Trigger admin notifications
  - [ ] Update inventory on successful payment
  - [ ] Process membership benefits

- [ ] **19.3** Add duplicate payment prevention

- [ ] **19.4** Implement webhook retry handling

#### Return URL Processing
- [ ] **20.1** Update success/failure pages to handle toyyibPay parameters:
  - [ ] Parse status_id parameter
  - [ ] Display appropriate success/failure message
  - [ ] Show order reference and amount
  - [ ] Provide next steps for customer

### Day 5: Testing & Monitoring

#### Webhook Testing
- [ ] **21.1** Test webhook with sandbox:
  - [ ] Create test payment
  - [ ] Complete payment in sandbox
  - [ ] Verify webhook received
  - [ ] Check order status updated
  - [ ] Verify notifications sent

- [ ] **21.2** Test error scenarios:
  - [ ] Invalid webhook data
  - [ ] Duplicate webhooks
  - [ ] Failed payments
  - [ ] Network issues

- [ ] **21.3** Add monitoring and alerting:
  - [ ] Log all webhook requests
  - [ ] Monitor processing times
  - [ ] Alert on failed webhooks
  - [ ] Track payment success rates

---

## 🧪 Phase 6: Testing & Quality Assurance (Week 6)

### Day 1-2: Comprehensive Testing

#### Unit Testing
- [ ] **22.1** Test credential service:
  - [ ] Encryption/decryption
  - [ ] Database operations
  - [ ] Error handling
  - [ ] Environment switching

- [ ] **22.2** Test toyyibPay service:
  - [ ] Bill creation
  - [ ] Status checking
  - [ ] Error handling
  - [ ] Amount formatting

- [ ] **22.3** Test webhook processing:
  - [ ] Valid webhook data
  - [ ] Invalid webhook data
  - [ ] Order status updates
  - [ ] Notification triggering

#### Integration Testing
- [ ] **23.1** End-to-end payment flow:
  - [ ] Complete checkout process
  - [ ] Payment gateway redirect
  - [ ] Webhook processing
  - [ ] Order completion

- [ ] **23.2** Admin interface testing:
  - [ ] Credential management
  - [ ] Category creation
  - [ ] Connection testing
  - [ ] Status monitoring

### Day 3-4: User Acceptance Testing

#### Customer Journey Testing
- [ ] **24.1** Test customer experience:
  - [ ] Payment method selection clarity
  - [ ] Payment process smoothness
  - [ ] Success/failure handling
  - [ ] Email notifications

- [ ] **24.2** Test admin experience:
  - [ ] Configuration ease of use
  - [ ] Status visibility
  - [ ] Error troubleshooting
  - [ ] Reporting functionality

#### Cross-browser & Device Testing
- [ ] **25.1** Test on different browsers:
  - [ ] Chrome, Firefox, Safari, Edge
  - [ ] Mobile browsers
  - [ ] Different screen sizes

- [ ] **25.2** Test payment flow on mobile devices

### Day 5: Performance & Security Testing

#### Performance Testing
- [ ] **26.1** Load testing:
  - [ ] Concurrent payment processing
  - [ ] Database performance
  - [ ] API response times
  - [ ] Webhook processing speed

- [ ] **26.2** Security testing:
  - [ ] Credential encryption
  - [ ] Webhook validation
  - [ ] SQL injection prevention
  - [ ] CSRF protection

---

## 🚀 Phase 7: Production Deployment (Week 7)

### Day 1-2: Production Setup

#### toyyibPay Account Setup
- [ ] **27.1** Create production toyyibPay account
- [ ] **27.2** Complete account verification
- [ ] **27.3** Set up bank account details
- [ ] **27.4** Configure webhook URLs
- [ ] **27.5** Test production API access

#### Environment Configuration
- [ ] **28.1** Add production environment variables:
  ```env
  TOYYIBPAY_PRODUCTION_URL="https://toyyibpay.com"
  TOYYIBPAY_WEBHOOK_URL="${NEXT_PUBLIC_APP_URL}/api/webhooks/toyyibpay"
  TOYYIBPAY_RETURN_SUCCESS_URL="${NEXT_PUBLIC_APP_URL}/checkout/success"
  TOYYIBPAY_RETURN_FAILED_URL="${NEXT_PUBLIC_APP_URL}/checkout/failed"
  ```

### Day 3-4: Staging Deployment

#### Deploy to Staging
- [ ] **29.1** Deploy application to staging environment
- [ ] **29.2** Configure production credentials in admin
- [ ] **29.3** Test complete payment flow
- [ ] **29.4** Verify webhook configuration
- [ ] **29.5** Test with real bank accounts (small amounts)

#### Pre-production Testing
- [ ] **30.1** Comprehensive testing checklist:
  - [ ] Payment creation works
  - [ ] Webhook processing works
  - [ ] Order status updates correctly
  - [ ] Notifications are sent
  - [ ] Admin interface functions
  - [ ] Error handling works

### Day 5: Production Launch

#### Production Deployment
- [ ] **31.1** Create deployment checklist:
  - [ ] Database migration applied
  - [ ] Environment variables set
  - [ ] Webhook URLs configured
  - [ ] Monitoring enabled
  - [ ] Backup procedures ready

- [ ] **31.2** Deploy to production
- [ ] **31.3** Verify all services running
- [ ] **31.4** Test payment flow with small transaction
- [ ] **31.5** Monitor logs for any issues

#### Post-Launch Monitoring
- [ ] **32.1** Monitor for 24 hours:
  - [ ] Payment success rates
  - [ ] Error rates
  - [ ] Response times
  - [ ] Customer feedback

- [ ] **32.2** Set up alerts for:
  - [ ] Failed payments >5%
  - [ ] Webhook failures
  - [ ] API timeouts
  - [ ] Database errors

---

## 📊 Success Verification Checklist

### Technical Verification
- [ ] ✅ **API Integration**: All toyyibPay APIs working correctly
- [ ] ✅ **Database Storage**: Credentials securely stored and retrieved
- [ ] ✅ **Webhook Processing**: Real-time payment status updates
- [ ] ✅ **Error Handling**: Graceful failure and fallback mechanisms
- [ ] ✅ **Performance**: Sub-2s payment processing times
- [ ] ✅ **Security**: Encrypted credential storage and audit logging

### Business Verification
- [ ] ✅ **Payment Options**: Customers can choose between gateways
- [ ] ✅ **Admin Control**: Easy credential and category management
- [ ] ✅ **Transaction Tracking**: Complete payment audit trail
- [ ] ✅ **Notification System**: Automated customer and admin notifications
- [ ] ✅ **Reporting**: Payment method analytics and settlement tracking

### User Experience Verification
- [ ] ✅ **Checkout Flow**: Smooth and intuitive payment selection
- [ ] ✅ **Payment Process**: Clear status indicators and messaging
- [ ] ✅ **Success Handling**: Proper order confirmation and receipts
- [ ] ✅ **Error Handling**: Clear error messages and recovery options
- [ ] ✅ **Mobile Experience**: Fully responsive payment flow

---

## 🔧 Maintenance & Monitoring Checklist

### Ongoing Monitoring
- [ ] **Daily**: Check payment success rates and error logs
- [ ] **Weekly**: Review transaction volumes and performance metrics
- [ ] **Monthly**: Reconcile settlements and update documentation
- [ ] **Quarterly**: Security audit and credential rotation

### Regular Updates
- [ ] **API Updates**: Monitor toyyibPay API changes and deprecations
- [ ] **Security Patches**: Keep dependencies updated
- [ ] **Performance Optimization**: Monitor and optimize slow queries
- [ ] **Feature Enhancements**: Based on customer feedback

---

**Total Implementation Time**: 6-7 weeks
**Critical Success Factors**: 
- Secure credential management
- Robust webhook processing  
- Comprehensive error handling
- Seamless user experience
- Proper monitoring and alerting

*This checklist ensures zero-defect implementation following the established EasyParcel integration patterns and maintaining architectural consistency.*