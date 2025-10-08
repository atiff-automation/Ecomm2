# EasyParcel API Integration Specifications

## Overview

This document provides comprehensive specifications for integrating with the EasyParcel API v1.4.0, including authentication, rate calculation, shipment creation, tracking, and webhook handling for the smart shipping system.

## API Architecture

### Integration Approach
```
┌─────────────────────────────────────────────────────────────┐
│                EcomJRM Smart Shipping System                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │    Rate     │    │  Shipment   │    │   Tracking  │      │
│  │ Calculator  │◄──►│  Creator    │◄──►│   Monitor   │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│         │                   │                   │           │
│         └───────────────────┼───────────────────┘           │
│                             │                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │           EasyParcel Service Layer                      ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        ││
│  │  │ Rate API    │ │ Shipment    │ │ Tracking    │        ││
│  │  │ v1.4.0      │ │ API v1.4.0  │ │ API v1.4.0  │        ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘        ││
│  └─────────────────────────────────────────────────────────┘│
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │
              ┌───────────────────────────┐
              │    EasyParcel Cloud API   │
              │     api.easyparcel.my     │
              └───────────────────────────┘
```

## Authentication & Security

### API Credentials Management

```typescript
interface EasyParcelCredentials {
  apiKey: string;         // Primary API key
  apiSecret: string;      // API secret for request signing
  baseURL: string;        // https://api.easyparcel.my/v1
  environment: 'SANDBOX' | 'PRODUCTION';
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

class EasyParcelAuth {
  private credentials: EasyParcelCredentials;
  private tokenCache: Map<string, AuthToken> = new Map();

  async authenticate(): Promise<AuthToken> {
    const cachedToken = this.getCachedToken();
    if (cachedToken && !this.isTokenExpired(cachedToken)) {
      return cachedToken;
    }

    const authRequest = {
      grant_type: 'client_credentials',
      client_id: this.credentials.apiKey,
      client_secret: this.credentials.apiSecret,
      scope: 'rate_calculation shipment_creation tracking'
    };

    const response = await this.makeAuthRequest('/oauth/token', authRequest);
    const token = this.processAuthResponse(response);
    
    this.cacheToken(token);
    return token;
  }

  private generateRequestSignature(
    method: string,
    endpoint: string,
    timestamp: number,
    body?: string
  ): string {
    const message = `${method}|${endpoint}|${timestamp}|${body || ''}`;
    return crypto
      .createHmac('sha256', this.credentials.apiSecret)
      .update(message)
      .digest('hex');
  }
}
```

### Request Security Headers

```typescript
interface SecurityHeaders {
  'Authorization': string;        // Bearer {access_token}
  'X-API-Key': string;           // API key
  'X-Timestamp': string;         // Unix timestamp
  'X-Signature': string;         // HMAC SHA256 signature
  'Content-Type': string;        // application/json
  'User-Agent': string;          // EcomJRM/1.0.0 (Malaysia)
  'X-Request-ID': string;        // Unique request identifier
}
```

## Rate Calculation API

### Endpoint: `/v1/rates/calculate`

#### Request Specification

```typescript
interface RateCalculationRequest {
  pickup: {
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;            // Malaysian state code
    postcode: string;         // 5-digit postcode
    country: string;          // 'MY'
    contact_name: string;
    contact_phone: string;
    contact_email: string;
  };
  delivery: {
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    contact_name: string;
    contact_phone: string;
    contact_email?: string;
  };
  parcel: {
    weight: number;           // Weight in kg (up to 3 decimal places)
    length?: number;          // Length in cm
    width?: number;           // Width in cm
    height?: number;          // Height in cm
    declared_value: number;   // Value in MYR
    content_description: string;
    dangerous_goods: boolean;
    fragile: boolean;
  };
  services: {
    courier_companies?: string[];  // Filter by specific couriers
    service_types?: string[];      // ['STANDARD', 'EXPRESS', 'OVERNIGHT']
    cod_required?: boolean;
    insurance_required?: boolean;
    pickup_required?: boolean;
    delivery_confirmation?: boolean;
  };
  preferences: {
    currency: string;         // 'MYR'
    include_tax: boolean;     // true for tax-inclusive pricing
    include_fuel_surcharge: boolean;
    include_remote_area_surcharge: boolean;
  };
}

// Example request
const rateRequest: RateCalculationRequest = {
  pickup: {
    address_line_1: "No. 123, Jalan Technology",
    city: "Kuala Lumpur",
    state: "KUL",
    postcode: "50000",
    country: "MY",
    contact_name: "EcomJRM Store",
    contact_phone: "+60123456789",
    contact_email: "store@ecomjrm.com"
  },
  delivery: {
    address_line_1: "No. 456, Jalan Customer",
    city: "Johor Bahru",
    state: "JOH",
    postcode: "80000",
    country: "MY",
    contact_name: "John Customer",
    contact_phone: "+60123456790"
  },
  parcel: {
    weight: 1.5,
    length: 20,
    width: 15,
    height: 10,
    declared_value: 150.00,
    content_description: "Electronics - Smartphone",
    dangerous_goods: false,
    fragile: false
  },
  services: {
    service_types: ["STANDARD", "EXPRESS"],
    cod_required: false,
    insurance_required: true
  },
  preferences: {
    currency: "MYR",
    include_tax: true,
    include_fuel_surcharge: true,
    include_remote_area_surcharge: true
  }
};
```

#### Response Specification

```typescript
interface RateCalculationResponse {
  success: boolean;
  request_id: string;
  rates: CourierRate[];
  metadata: {
    calculation_time_ms: number;
    total_rates_found: number;
    pickup_zone: string;
    delivery_zone: string;
    distance_km?: number;
  };
  warnings?: string[];
  errors?: string[];
}

interface CourierRate {
  courier_company: string;          // 'Poslaju', 'CityLink', 'J&T Express'
  service_name: string;            // 'Standard', 'Express', 'Overnight'
  service_type: string;            // 'parcel', 'document' - NOT pickup/dropoff
  service_detail: string;          // 'pickup', 'dropoff', 'dropoff or pickup'
  service_code: string;            // Internal service code
  
  // Pricing breakdown
  base_price: number;              // Base shipping cost
  fuel_surcharge: number;          // Fuel surcharge
  remote_area_surcharge: number;   // Remote area surcharge
  insurance_fee: number;           // Insurance cost
  cod_fee: number;                // COD handling fee
  tax_amount: number;              // GST/Tax amount
  total_price: number;             // Final total price
  
  // Service details
  estimated_delivery_days: number; // 1-7 days
  pickup_available: boolean;
  dropoff_point?: DropoffPoint[];  // Array of dropoff locations (if service_detail includes 'dropoff')
  pickup_point?: PickupPoint[];    // Array of pickup locations
  cod_available: boolean;
  insurance_available: boolean;
  tracking_available: boolean;
  signature_required: boolean;
  
  // Restrictions and notes
  weight_limit_kg: number;
  size_restrictions?: {
    max_length_cm: number;
    max_width_cm: number;
    max_height_cm: number;
  };
  service_notes?: string[];
  
  // Internal references
  rate_id: string;                // EasyParcel rate reference
  valid_until: string;            // ISO 8601 timestamp
}

/**
 * Dropoff point location details
 */
interface DropoffPoint {
  point_id: string;              // Unique dropoff point identifier
  point_name: string;            // e.g., "City-Link Drop-Off - Mid Valley"
  point_addr1: string;           // Address line 1
  point_addr2?: string;          // Address line 2
  point_city: string;            // City name
  point_state: string;           // State code
  point_postcode: string;        // Postal code
  start_time: string;            // Opening time (HH:mm format)
  end_time: string;              // Closing time (HH:mm format)
  latitude?: number;             // GPS coordinates
  longitude?: number;            // GPS coordinates
  price_difference?: number;     // Cost difference from pickup (usually negative = cheaper)
}

/**
 * Pickup point location details
 */
interface PickupPoint {
  point_id: string;
  point_name: string;
  point_addr1: string;
  point_addr2?: string;
  point_city: string;
  point_state: string;
  point_postcode: string;
  operating_hours: string;
  contact_number?: string;
}
```

### Rate Calculation Service Implementation

```typescript
class EasyParcelRateService {
  private auth: EasyParcelAuth;
  private cache: RateCache;
  private rateLimiter: RateLimiter;

  async calculateRates(
    request: RateCalculationRequest,
    options: CalculationOptions = {}
  ): Promise<RateCalculationResponse> {
    
    // 1. Validate request
    const validation = await this.validateRateRequest(request);
    if (!validation.valid) {
      throw new ValidationError('Invalid rate request', validation.errors);
    }

    // 2. Check cache first
    const cacheKey = this.generateCacheKey(request);
    if (!options.skipCache) {
      const cachedRates = await this.cache.get(cacheKey);
      if (cachedRates) {
        return cachedRates;
      }
    }

    // 3. Rate limiting check
    await this.rateLimiter.checkLimit();

    // 4. Make API request
    const startTime = Date.now();
    const response = await this.makeRateAPIRequest(request);
    const calculationTime = Date.now() - startTime;

    // 5. Process and validate response
    const processedResponse = await this.processRateResponse(response, calculationTime);

    // 6. Cache successful responses
    if (processedResponse.success) {
      await this.cache.set(cacheKey, processedResponse, { ttl: 3600 }); // 1 hour cache
    }

    // 7. Log for analytics
    await this.logRateCalculation(request, processedResponse, calculationTime);

    return processedResponse;
  }

  private async makeRateAPIRequest(
    request: RateCalculationRequest
  ): Promise<any> {
    const token = await this.auth.authenticate();
    const requestId = this.generateRequestId();

    const headers: SecurityHeaders = {
      'Authorization': `Bearer ${token.access_token}`,
      'X-API-Key': this.auth.getApiKey(),
      'X-Timestamp': Date.now().toString(),
      'X-Signature': this.auth.generateRequestSignature('POST', '/v1/rates/calculate', Date.now(), JSON.stringify(request)),
      'Content-Type': 'application/json',
      'User-Agent': 'EcomJRM/1.0.0 (Malaysia)',
      'X-Request-ID': requestId
    };

    const response = await fetch(`${this.auth.getBaseURL()}/v1/rates/calculate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      await this.handleAPIError(response, requestId);
    }

    return response.json();
  }

  private async handleAPIError(response: Response, requestId: string): Promise<never> {
    const errorBody = await response.text();
    
    const error = new EasyParcelAPIError(
      `Rate calculation failed: ${response.status}`,
      {
        statusCode: response.status,
        requestId,
        responseBody: errorBody,
        timestamp: new Date().toISOString()
      }
    );

    // Log error for monitoring
    await this.logAPIError(error);

    throw error;
  }
}
```

## Shipment Creation API

### Endpoint: `/v1/shipments/create`

#### Request Specification

```typescript
interface ShipmentCreationRequest {
  shipment: {
    reference_number: string;      // Internal order reference
    pickup: PickupDetails;
    delivery: DeliveryDetails;
    parcel: ParcelDetails;
    service: ServiceSelection;
    insurance?: InsuranceDetails;
    cod?: CODDetails;
    special_instructions?: string;
  };
  preferences: {
    auto_assign_courier: boolean;  // Let EasyParcel choose best courier
    preferred_couriers?: string[]; // Priority list if not auto-assign
    pickup_date?: string;          // ISO 8601 date for pickup
    delivery_date?: string;        // Requested delivery date
    notification_email?: string;   // Email for status updates
    notification_sms?: string;     // SMS for status updates
  };
}

interface ServiceSelection {
  courier_company: string;       // From rate calculation response
  service_code: string;         // From rate calculation response
  rate_id: string;             // Rate reference from calculation
  confirmed_price: number;      // Price confirmation
}

interface InsuranceDetails {
  required: boolean;
  declared_value: number;
  coverage_type: 'FULL' | 'PARTIAL';
  deductible?: number;
}

interface CODDetails {
  required: boolean;
  amount: number;
  collection_method: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH';
  bank_details?: {
    account_name: string;
    account_number: string;
    bank_name: string;
  };
}
```

#### Response Specification

```typescript
interface ShipmentCreationResponse {
  success: boolean;
  request_id: string;
  shipment: {
    shipment_id: string;          // EasyParcel shipment ID
    awb_number: string;           // Air Waybill tracking number
    reference_number: string;     // Your internal reference
    
    // Service details
    courier_company: string;
    service_name: string;
    
    // Pricing
    final_price: number;
    currency: string;
    
    // Status
    status: ShipmentStatus;
    created_at: string;           // ISO 8601 timestamp
    
    // Tracking
    tracking_url: string;
    tracking_number: string;
    
    // Documents
    label_url?: string;           // Shipping label PDF URL
    invoice_url?: string;         // Invoice PDF URL
    
    // Pickup details
    pickup_date?: string;
    pickup_time_slot?: string;
    
    // Delivery estimate
    estimated_delivery_date?: string;
    
    // Additional services
    insurance_coverage?: number;
    cod_amount?: number;
  };
  warnings?: string[];
  errors?: string[];
}

enum ShipmentStatus {
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
  PICKUP_SCHEDULED = 'PICKUP_SCHEDULED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED_DELIVERY = 'FAILED_DELIVERY',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED'
}
```

### Shipment Creation Service

```typescript
class EasyParcelShipmentService {
  private auth: EasyParcelAuth;
  private documentService: DocumentService;

  async createShipment(
    request: ShipmentCreationRequest
  ): Promise<ShipmentCreationResponse> {
    
    // 1. Validate shipment request
    await this.validateShipmentRequest(request);

    // 2. Pre-creation checks
    await this.performPreCreationChecks(request);

    // 3. Create shipment via API
    const response = await this.makeShipmentAPIRequest(request);

    // 4. Process response and handle documents
    const processedResponse = await this.processShipmentResponse(response);

    // 5. Store shipment record locally
    await this.storeShipmentRecord(request, processedResponse);

    // 6. Download and store documents
    if (processedResponse.shipment.label_url) {
      await this.downloadAndStoreLabel(processedResponse.shipment);
    }

    return processedResponse;
  }

  private async performPreCreationChecks(
    request: ShipmentCreationRequest
  ): Promise<void> {
    // Check if reference number already exists
    const existingShipment = await this.findExistingShipment(
      request.shipment.reference_number
    );
    
    if (existingShipment) {
      throw new DuplicateShipmentError(
        `Shipment already exists for reference: ${request.shipment.reference_number}`
      );
    }

    // Validate address serviceability
    await this.validateAddressServiceability(
      request.shipment.pickup,
      request.shipment.delivery
    );

    // Check service availability
    await this.validateServiceAvailability(request.shipment.service);
  }

  private async downloadAndStoreLabel(
    shipment: ShipmentCreationResponse['shipment']
  ): Promise<void> {
    if (!shipment.label_url) return;

    try {
      const labelResponse = await fetch(shipment.label_url);
      const labelBuffer = await labelResponse.arrayBuffer();

      // Store label in local storage
      const labelPath = await this.documentService.storeLabelDocument({
        awbNumber: shipment.awb_number,
        shipmentId: shipment.shipment_id,
        buffer: labelBuffer,
        format: 'PDF'
      });

      // Update local shipment record with label path
      await this.updateShipmentDocument(shipment.shipment_id, {
        labelPath,
        labelDownloadedAt: new Date()
      });

    } catch (error) {
      // Log error but don't fail the shipment creation
      console.error('Failed to download shipping label:', error);
      await this.logDocumentError(shipment.shipment_id, 'LABEL_DOWNLOAD_FAILED', error);
    }
  }
}
```

## Tracking and Webhooks

### Tracking API: `/v1/tracking/{awb_number}`

#### Response Specification

```typescript
interface TrackingResponse {
  success: boolean;
  tracking: {
    awb_number: string;
    shipment_id: string;
    current_status: ShipmentStatus;
    
    // Location details
    current_location?: {
      city: string;
      state: string;
      country: string;
      facility_name?: string;
    };
    
    // Delivery information
    estimated_delivery: string;   // ISO 8601 date
    actual_delivery?: string;     // ISO 8601 timestamp
    delivery_attempt_count: number;
    
    // Recipient information (for delivered packages)
    delivered_to?: {
      recipient_name: string;
      relationship: string;       // 'RECIPIENT', 'FAMILY_MEMBER', 'NEIGHBOR'
      signature_captured: boolean;
    };
    
    // Tracking events
    events: TrackingEvent[];
    
    // Additional information
    notes?: string[];
    delivery_instructions?: string;
    proof_of_delivery_url?: string;
  };
}

interface TrackingEvent {
  timestamp: string;            // ISO 8601 timestamp
  status: ShipmentStatus;
  location: {
    city: string;
    state: string;
    country: string;
    facility_name?: string;
  };
  description: string;
  courier_remarks?: string;
  event_code: string;           // Internal event code
}
```

### Webhook Configuration

#### Webhook Endpoint: `POST /api/webhooks/easyparcel`

```typescript
interface WebhookPayload {
  event_type: WebhookEventType;
  timestamp: string;           // ISO 8601 timestamp
  data: {
    shipment_id: string;
    awb_number: string;
    reference_number: string;   // Your internal reference
    previous_status?: ShipmentStatus;
    current_status: ShipmentStatus;
    location?: TrackingLocation;
    event_details?: any;
  };
  signature: string;           // HMAC SHA256 signature for verification
}

enum WebhookEventType {
  SHIPMENT_CREATED = 'shipment.created',
  PICKUP_SCHEDULED = 'pickup.scheduled',
  PICKUP_COMPLETED = 'pickup.completed',
  IN_TRANSIT = 'shipment.in_transit',
  OUT_FOR_DELIVERY = 'shipment.out_for_delivery',
  DELIVERED = 'shipment.delivered',
  DELIVERY_FAILED = 'delivery.failed',
  SHIPMENT_RETURNED = 'shipment.returned',
  SHIPMENT_CANCELLED = 'shipment.cancelled',
  EXCEPTION_OCCURRED = 'shipment.exception'
}
```

#### Webhook Handler Implementation

```typescript
class EasyParcelWebhookHandler {
  async handleWebhook(
    payload: WebhookPayload,
    signature: string
  ): Promise<WebhookResponse> {
    
    // 1. Verify webhook signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new WebhookSecurityError('Invalid webhook signature');
    }

    // 2. Idempotency check
    const processedBefore = await this.checkWebhookIdempotency(payload);
    if (processedBefore) {
      return { success: true, message: 'Webhook already processed' };
    }

    // 3. Process webhook based on event type
    try {
      switch (payload.event_type) {
        case WebhookEventType.SHIPMENT_CREATED:
          await this.handleShipmentCreated(payload);
          break;
        case WebhookEventType.PICKUP_COMPLETED:
          await this.handlePickupCompleted(payload);
          break;
        case WebhookEventType.DELIVERED:
          await this.handleDeliveryCompleted(payload);
          break;
        case WebhookEventType.DELIVERY_FAILED:
          await this.handleDeliveryFailed(payload);
          break;
        default:
          await this.handleGenericStatusUpdate(payload);
      }

      // 4. Update local tracking data
      await this.updateLocalTrackingData(payload);

      // 5. Notify customers if needed
      await this.notifyCustomerIfNeeded(payload);

      // 6. Record webhook processing
      await this.recordWebhookProcessing(payload, 'SUCCESS');

      return { success: true, message: 'Webhook processed successfully' };

    } catch (error) {
      await this.recordWebhookProcessing(payload, 'FAILED', error);
      throw error;
    }
  }

  private verifyWebhookSignature(
    payload: WebhookPayload,
    signature: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.EASYPARCEL_WEBHOOK_SECRET!)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  private async handleDeliveryCompleted(payload: WebhookPayload): Promise<void> {
    const { awb_number, reference_number } = payload.data;

    // Update order status
    await this.orderService.updateOrderStatus(reference_number, 'DELIVERED');

    // Send delivery confirmation email
    await this.notificationService.sendDeliveryConfirmation({
      awbNumber: awb_number,
      orderReference: reference_number,
      deliveredAt: payload.timestamp
    });

    // Update inventory if needed
    await this.inventoryService.confirmDelivery(reference_number);

    // Trigger post-delivery workflows (review requests, etc.)
    await this.workflowService.triggerPostDeliveryWorkflow(reference_number);
  }
}
```

## Error Handling and Monitoring

### Error Types and Handling

```typescript
class EasyParcelAPIError extends Error {
  constructor(
    message: string,
    public details: {
      statusCode: number;
      requestId: string;
      responseBody: string;
      timestamp: string;
      endpoint?: string;
    }
  ) {
    super(message);
    this.name = 'EasyParcelAPIError';
  }
}

class APIErrorHandler {
  async handleError(error: EasyParcelAPIError): Promise<void> {
    const errorCategory = this.categorizeError(error);
    
    switch (errorCategory) {
      case 'RATE_LIMIT_EXCEEDED':
        await this.handleRateLimitError(error);
        break;
      case 'AUTHENTICATION_FAILED':
        await this.handleAuthError(error);
        break;
      case 'SERVICE_UNAVAILABLE':
        await this.handleServiceError(error);
        break;
      case 'VALIDATION_ERROR':
        await this.handleValidationError(error);
        break;
      default:
        await this.handleGenericError(error);
    }

    // Log error for monitoring
    await this.logError(error, errorCategory);

    // Alert if critical
    if (this.isCriticalError(error)) {
      await this.sendCriticalAlert(error);
    }
  }

  private categorizeError(error: EasyParcelAPIError): string {
    const { statusCode, responseBody } = error.details;

    if (statusCode === 429) return 'RATE_LIMIT_EXCEEDED';
    if (statusCode === 401 || statusCode === 403) return 'AUTHENTICATION_FAILED';
    if (statusCode >= 500) return 'SERVICE_UNAVAILABLE';
    if (statusCode === 400) {
      // Parse response body to determine specific validation error
      try {
        const errorData = JSON.parse(responseBody);
        if (errorData.error_code?.includes('VALIDATION')) {
          return 'VALIDATION_ERROR';
        }
      } catch {}
    }

    return 'UNKNOWN_ERROR';
  }
}
```

### Health Monitoring

```typescript
class EasyParcelHealthMonitor {
  private healthMetrics: APIHealthMetrics = {
    lastHealthCheck: new Date(),
    successRate: 100,
    averageResponseTime: 0,
    consecutiveFailures: 0,
    status: 'HEALTHY'
  };

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = [];

    // 1. Authentication check
    checks.push(this.checkAuthentication());

    // 2. Rate calculation test
    checks.push(this.checkRateCalculation());

    // 3. Service availability check
    checks.push(this.checkServiceAvailability());

    const results = await Promise.allSettled(checks);
    const responseTime = Date.now() - startTime;

    const healthResult = this.evaluateHealthResults(results, responseTime);
    await this.updateHealthMetrics(healthResult);

    return healthResult;
  }

  private async checkRateCalculation(): Promise<HealthCheckStep> {
    try {
      const testRequest = this.generateTestRateRequest();
      const response = await this.rateService.calculateRates(testRequest);
      
      return {
        step: 'RATE_CALCULATION',
        success: response.success && response.rates.length > 0,
        responseTime: response.metadata.calculation_time_ms,
        details: `Found ${response.rates.length} rates`
      };
    } catch (error) {
      return {
        step: 'RATE_CALCULATION',
        success: false,
        error: error.message,
        details: 'Rate calculation test failed'
      };
    }
  }

  private generateTestRateRequest(): RateCalculationRequest {
    return {
      pickup: {
        address_line_1: "No. 1, Test Street",
        city: "Kuala Lumpur",
        state: "KUL",
        postcode: "50000",
        country: "MY",
        contact_name: "Test Sender",
        contact_phone: "+60123456789",
        contact_email: "test@ecomjrm.com"
      },
      delivery: {
        address_line_1: "No. 2, Test Avenue",
        city: "Johor Bahru",
        state: "JOH",
        postcode: "80000",
        country: "MY",
        contact_name: "Test Recipient",
        contact_phone: "+60123456790"
      },
      parcel: {
        weight: 1.0,
        declared_value: 100.00,
        content_description: "Health Check Test Item",
        dangerous_goods: false,
        fragile: false
      },
      preferences: {
        currency: "MYR",
        include_tax: true,
        include_fuel_surcharge: true,
        include_remote_area_surcharge: true
      }
    };
  }
}
```

## Rate Limiting and Quotas

### Rate Limiting Implementation

```typescript
class EasyParcelRateLimiter {
  private tokenBucket: Map<string, TokenBucket> = new Map();
  
  async checkLimit(endpoint: string = 'default'): Promise<void> {
    const bucket = this.getTokenBucket(endpoint);
    
    if (!bucket.consume()) {
      const resetTime = bucket.getResetTime();
      throw new RateLimitError(
        `Rate limit exceeded for ${endpoint}`,
        { resetTime, remainingTokens: bucket.getTokens() }
      );
    }
  }

  private getTokenBucket(endpoint: string): TokenBucket {
    if (!this.tokenBucket.has(endpoint)) {
      const limits = this.getEndpointLimits(endpoint);
      this.tokenBucket.set(endpoint, new TokenBucket(limits));
    }
    return this.tokenBucket.get(endpoint)!;
  }

  private getEndpointLimits(endpoint: string): RateLimitConfig {
    const limits: Record<string, RateLimitConfig> = {
      'rate_calculation': { tokens: 60, window: 60000 }, // 60 requests per minute
      'shipment_creation': { tokens: 30, window: 60000 }, // 30 requests per minute
      'tracking': { tokens: 120, window: 60000 }, // 120 requests per minute
      'default': { tokens: 100, window: 60000 } // Default limit
    };

    return limits[endpoint] || limits.default;
  }
}

class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(private config: RateLimitConfig) {
    this.tokens = config.tokens;
    this.lastRefill = Date.now();
  }

  consume(): boolean {
    this.refill();
    
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.config.window * this.config.tokens);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.config.tokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}
```

## Testing and Quality Assurance

### API Testing Suite

```typescript
describe('EasyParcel API Integration', () => {
  let rateService: EasyParcelRateService;
  let shipmentService: EasyParcelShipmentService;

  beforeEach(() => {
    rateService = new EasyParcelRateService(testCredentials);
    shipmentService = new EasyParcelShipmentService(testCredentials);
  });

  describe('Rate Calculation', () => {
    test('should calculate rates for domestic shipment', async () => {
      const request = createTestRateRequest();
      const response = await rateService.calculateRates(request);

      expect(response.success).toBe(true);
      expect(response.rates).toHaveLength.greaterThan(0);
      expect(response.rates[0]).toMatchObject({
        courier_company: expect.any(String),
        service_name: expect.any(String),
        total_price: expect.any(Number),
        estimated_delivery_days: expect.any(Number)
      });
    });

    test('should handle invalid addresses gracefully', async () => {
      const invalidRequest = createInvalidAddressRequest();
      
      await expect(rateService.calculateRates(invalidRequest))
        .rejects.toThrow(ValidationError);
    });

    test('should respect rate limiting', async () => {
      // Make requests beyond rate limit
      const promises = Array(70).fill(null).map(() =>
        rateService.calculateRates(createTestRateRequest())
      );

      await expect(Promise.all(promises))
        .rejects.toThrow(RateLimitError);
    });
  });

  describe('Shipment Creation', () => {
    test('should create shipment successfully', async () => {
      // First get rates
      const rateRequest = createTestRateRequest();
      const rateResponse = await rateService.calculateRates(rateRequest);
      
      // Then create shipment
      const shipmentRequest = createShipmentFromRate(rateResponse.rates[0]);
      const shipmentResponse = await shipmentService.createShipment(shipmentRequest);

      expect(shipmentResponse.success).toBe(true);
      expect(shipmentResponse.shipment.awb_number).toBeDefined();
      expect(shipmentResponse.shipment.tracking_url).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle API downtime gracefully', async () => {
      // Mock API failure
      mockAPIDown();

      const request = createTestRateRequest();
      await expect(rateService.calculateRates(request))
        .rejects.toThrow(EasyParcelAPIError);
    });
  });
});
```

This comprehensive API integration specification provides a robust foundation for seamless EasyParcel integration, ensuring reliable shipping operations with proper error handling, monitoring, and fallback mechanisms.