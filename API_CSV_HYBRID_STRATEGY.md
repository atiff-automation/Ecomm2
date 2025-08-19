# API/CSV Hybrid Fulfillment Strategy

## Overview

This document defines the intelligent switching strategy between EasyParcel API integration and CSV export processing, ensuring zero-downtime shipping operations with optimal cost management and operational efficiency.

## Strategic Approach

### Dual-Mode Philosophy

The hybrid system operates on the principle of **"API First, CSV Always Ready"** - leveraging real-time API capabilities when optimal while maintaining immediate fallback to proven CSV processing methods.

```
┌─────────────────────────────────────────────────────────────┐
│                    Smart Decision Engine                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    Decision     ┌─────────────┐            │
│  │   Order     │    Factors      │  EasyParcel │            │
│  │   Queue     │ ──────────────► │  API Call   │            │
│  │             │                 │             │            │
│  └─────────────┘                 └─────────────┘            │
│         │                               │                   │
│         │         ┌─────────────┐       │                   │
│         └────────►│ CSV Export  │◄──────┘                   │
│                   │ Generation  │ (Fallback)                │
│                   └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Decision Matrix

### Primary Decision Factors

#### 1. API Health Status
```typescript
interface APIHealthMetrics {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  responseTime: number; // milliseconds
  successRate: number; // percentage (0-100)
  consecutiveFailures: number;
  lastSuccessfulCall: Date;
  errorRate: number; // failures per hour
}

const HEALTH_THRESHOLDS = {
  HEALTHY: {
    responseTime: 5000, // < 5 seconds
    successRate: 95, // >= 95%
    consecutiveFailures: 0,
    errorRate: 2 // < 2 failures per hour
  },
  DEGRADED: {
    responseTime: 10000, // < 10 seconds
    successRate: 85, // >= 85%
    consecutiveFailures: 3, // < 3 consecutive
    errorRate: 5 // < 5 failures per hour
  },
  DOWN: {
    responseTime: 10000, // >= 10 seconds
    successRate: 85, // < 85%
    consecutiveFailures: 3, // >= 3 consecutive
    errorRate: 5 // >= 5 failures per hour
  }
};
```

#### 2. Business Operation Context
```typescript
interface BusinessContext {
  orderVolume: {
    current: number;
    threshold: number; // Switch to CSV above this
    peakHourMultiplier: number;
  };
  urgency: {
    expressOrders: number;
    sameDay: number;
    international: number;
  };
  cost: {
    monthlyAPIBudget: number;
    currentUsage: number;
    costPerAPICall: number;
  };
  operational: {
    staffAvailable: boolean;
    maintenanceWindow: boolean;
    holidayMode: boolean;
  };
}
```

#### 3. Order Characteristics
```typescript
interface OrderProfile {
  priority: 'EXPRESS' | 'STANDARD' | 'ECONOMY';
  value: number;
  weight: number;
  destination: 'PENINSULAR' | 'EAST_MALAYSIA' | 'INTERNATIONAL';
  paymentMethod: 'CARD' | 'COD' | 'WALLET';
  customerTier: 'VIP' | 'MEMBER' | 'REGULAR';
  specialRequirements: string[];
}
```

## Smart Decision Engine

### Core Decision Algorithm

```typescript
class SmartFulfillmentRouter {
  private config: FulfillmentConfig;
  private healthMonitor: APIHealthMonitor;
  private costTracker: APICostTracker;

  async decideFulfillmentMethod(
    orders: Order[], 
    context: BusinessContext
  ): Promise<FulfillmentDecision> {
    
    // 1. Check Admin Overrides
    const adminOverride = await this.checkAdminOverride();
    if (adminOverride) {
      return this.createDecision(adminOverride.method, adminOverride.reason);
    }

    // 2. Emergency Situations
    const emergency = await this.checkEmergencyConditions();
    if (emergency) {
      return this.createDecision('CSV', emergency.reason);
    }

    // 3. API Health Assessment
    const apiHealth = await this.healthMonitor.getHealthStatus();
    if (apiHealth.status === 'DOWN') {
      return this.createDecision('CSV', 'API_DOWN');
    }

    // 4. Cost Budget Check
    const costStatus = await this.costTracker.checkBudgetStatus();
    if (costStatus.exceedsThreshold) {
      return this.createDecision('CSV', 'BUDGET_EXCEEDED');
    }

    // 5. Volume and Performance Analysis
    const volumeAnalysis = await this.analyzeOrderVolume(orders, context);
    if (volumeAnalysis.recommendCSV) {
      return this.createDecision('CSV', volumeAnalysis.reason);
    }

    // 6. Order Priority Assessment
    const priorityAnalysis = this.analyzeOrderPriority(orders);
    if (priorityAnalysis.requiresAPI) {
      return this.createDecision('API', priorityAnalysis.reason);
    }

    // 7. Operational Context
    const operationalCheck = await this.checkOperationalContext(context);
    if (operationalCheck.preferCSV) {
      return this.createDecision('CSV', operationalCheck.reason);
    }

    // 8. Default Decision (API preferred for small batches)
    return this.createDecision('API', 'DEFAULT_SMALL_BATCH');
  }

  private async checkAdminOverride(): Promise<AdminOverride | null> {
    const settings = await this.getAdminSettings();
    
    if (settings.forceCSVMode) {
      return { method: 'CSV', reason: 'ADMIN_FORCE_CSV' };
    }
    
    if (settings.forceAPIMode && await this.healthMonitor.isAPIAccessible()) {
      return { method: 'API', reason: 'ADMIN_FORCE_API' };
    }
    
    return null;
  }

  private async checkEmergencyConditions(): Promise<Emergency | null> {
    // Check for system-wide issues
    const systemHealth = await this.getSystemHealth();
    
    if (systemHealth.databaseLatency > 10000) {
      return { reason: 'DATABASE_PERFORMANCE_ISSUE' };
    }
    
    if (systemHealth.memoryUsage > 0.9) {
      return { reason: 'HIGH_MEMORY_USAGE' };
    }
    
    // Check for EasyParcel service announcements
    const serviceStatus = await this.checkEasyParcelServiceStatus();
    if (serviceStatus.maintenanceMode) {
      return { reason: 'EASYPARCEL_MAINTENANCE' };
    }
    
    return null;
  }

  private async analyzeOrderVolume(
    orders: Order[], 
    context: BusinessContext
  ): Promise<VolumeAnalysis> {
    const orderCount = orders.length;
    const threshold = context.orderVolume.threshold;
    
    // Large batch processing
    if (orderCount > threshold) {
      return {
        recommendCSV: true,
        reason: `BULK_PROCESSING_${orderCount}_ORDERS`
      };
    }
    
    // Peak hour considerations
    if (this.isPeakHour() && orderCount > threshold * 0.5) {
      return {
        recommendCSV: true,
        reason: 'PEAK_HOUR_VOLUME_MANAGEMENT'
      };
    }
    
    // Historical performance analysis
    const historicalData = await this.getHistoricalPerformance();
    if (historicalData.csvPerformsSpeedBetter(orderCount)) {
      return {
        recommendCSV: true,
        reason: 'HISTORICAL_CSV_PERFORMANCE_ADVANTAGE'
      };
    }
    
    return { recommendCSV: false };
  }

  private analyzeOrderPriority(orders: Order[]): PriorityAnalysis {
    const expressOrders = orders.filter(o => o.priority === 'EXPRESS');
    const highValueOrders = orders.filter(o => o.value > 1000);
    const vipCustomers = orders.filter(o => o.customerTier === 'VIP');
    
    // High-priority orders should use API for immediate processing
    if (expressOrders.length > 0 || highValueOrders.length > 0 || vipCustomers.length > 0) {
      return {
        requiresAPI: true,
        reason: `PRIORITY_ORDERS_EXPRESS:${expressOrders.length}_HIGH_VALUE:${highValueOrders.length}_VIP:${vipCustomers.length}`
      };
    }
    
    return { requiresAPI: false };
  }
}
```

### Switching Scenarios

#### Scenario 1: Normal Operations
```typescript
// Typical day with mixed order volume
const NORMAL_OPERATIONS_RULES = {
  api: {
    conditions: [
      'apiHealth.status === HEALTHY',
      'orderCount <= 20',
      'expressOrders.length > 0',
      'costBudget.remaining > 30%'
    ],
    priority: 'HIGH'
  },
  csv: {
    conditions: [
      'orderCount > 50',
      'bulkProcessingHours(9-11, 14-16)',
      'standardOrdersOnly === true'
    ],
    priority: 'MEDIUM'
  }
};
```

#### Scenario 2: Peak Traffic (11.11, Black Friday)
```typescript
const PEAK_TRAFFIC_RULES = {
  api: {
    conditions: [
      'order.priority === EXPRESS',
      'order.value > 500',
      'customer.tier === VIP',
      'order.paymentMethod === CARD' // Faster processing
    ],
    maxConcurrent: 10 // Limit API calls during peak
  },
  csv: {
    conditions: [
      'orderCount > 10', // Lower threshold during peak
      'order.priority === STANDARD',
      'order.paymentMethod === COD' // Batch COD orders
    ],
    batchInterval: 1800 // 30-minute batches
  }
};
```

#### Scenario 3: API Degradation
```typescript
const DEGRADED_API_RULES = {
  api: {
    conditions: [
      'order.priority === EXPRESS',
      'order.value > 1000', // Only high-value orders
      'retryCount < 2' // Limited retries
    ],
    timeout: 15000, // Shorter timeout
    circuitBreaker: 'HALF_OPEN'
  },
  csv: {
    conditions: [
      'ALL_OTHER_ORDERS' // Everything else goes to CSV
    ],
    priority: 'IMMEDIATE',
    notification: 'URGENT' // Alert staff immediately
  }
};
```

## API Health Monitoring

### Real-time Monitoring System

```typescript
class APIHealthMonitor {
  private healthMetrics: APIHealthMetrics;
  private circuitBreaker: CircuitBreaker;
  private alertManager: AlertManager;

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // 1. Basic connectivity test
      const pingResult = await this.pingEasyParcelAPI();
      
      // 2. Authentication verification
      const authResult = await this.verifyAuthentication();
      
      // 3. Sample rate calculation
      const rateTestResult = await this.performSampleRateCalculation();
      
      // 4. Bulk operation test (if healthy)
      const bulkTestResult = await this.testBulkOperations();
      
      const responseTime = Date.now() - startTime;
      
      return this.evaluateOverallHealth({
        ping: pingResult,
        auth: authResult,
        rateTest: rateTestResult,
        bulkTest: bulkTestResult,
        responseTime
      });
      
    } catch (error) {
      return this.handleHealthCheckFailure(error, Date.now() - startTime);
    }
  }

  private async pingEasyParcelAPI(): Promise<PingResult> {
    const response = await fetch(`${EASYPARCEL_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent': 'EcomJRM-HealthCheck/1.0'
      }
    });
    
    return {
      success: response.ok,
      statusCode: response.status,
      responseTime: response.responseTime
    };
  }

  private async verifyAuthentication(): Promise<AuthResult> {
    try {
      const response = await this.easyParcelAPI.validateCredentials();
      return {
        authenticated: true,
        validUntil: response.tokenExpiry,
        rateLimitRemaining: response.rateLimitRemaining
      };
    } catch (error) {
      return {
        authenticated: false,
        error: error.message
      };
    }
  }

  private async performSampleRateCalculation(): Promise<RateTestResult> {
    const sampleOrder = this.generateSampleOrder();
    
    try {
      const rateResponse = await this.easyParcelAPI.calculateRate(sampleOrder);
      return {
        success: true,
        responseTime: rateResponse.responseTime,
        rateReturned: rateResponse.rates.length > 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: error.timeout ? 30000 : 0
      };
    }
  }

  // Circuit Breaker Pattern Implementation
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const breaker = this.circuitBreaker.getBreaker(operationName);
    
    if (breaker.state === 'OPEN') {
      throw new Error(`Circuit breaker OPEN for ${operationName}`);
    }
    
    try {
      const result = await operation();
      breaker.recordSuccess();
      return result;
    } catch (error) {
      breaker.recordFailure();
      
      if (breaker.shouldOpen()) {
        breaker.open();
        await this.alertManager.sendAlert({
          level: 'CRITICAL',
          message: `Circuit breaker opened for ${operationName}`,
          action: 'SWITCHING_TO_CSV'
        });
      }
      
      throw error;
    }
  }

  // Predictive Health Analysis
  async predictAPIPerformance(
    timeWindow: number = 3600000 // 1 hour
  ): Promise<PerformancePrediction> {
    const historicalData = await this.getHistoricalMetrics(timeWindow);
    
    // Analyze trends
    const trends = {
      responseTime: this.analyzeTrend(historicalData.responseTimes),
      successRate: this.analyzeTrend(historicalData.successRates),
      errorRate: this.analyzeTrend(historicalData.errorRates)
    };
    
    // Predict next hour performance
    const prediction = {
      expectedResponseTime: this.extrapolateTrend(trends.responseTime),
      expectedSuccessRate: this.extrapolateTrend(trends.successRate),
      confidence: this.calculateConfidence(trends),
      recommendation: this.generateRecommendation(trends)
    };
    
    return prediction;
  }
}
```

### Circuit Breaker Implementation

```typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: Date;
  private successCount = 0;
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000, // 1 minute
    private successThreshold: number = 3
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.recoveryTimeout;
  }
}
```

## Cost Management System

### API Budget Tracking

```typescript
class APICostTracker {
  private currentUsage: APICostUsage;
  private budgetLimits: BudgetLimits;

  async trackAPICall(
    operation: string,
    cost: number,
    metadata: APICallMetadata
  ): Promise<void> {
    // Record the API call cost
    await this.recordUsage({
      operation,
      cost,
      timestamp: new Date(),
      metadata
    });

    // Check budget thresholds
    await this.checkBudgetThresholds();
    
    // Update real-time metrics
    await this.updateUsageMetrics();
  }

  async checkBudgetThresholds(): Promise<BudgetStatus> {
    const usage = await this.getCurrentUsage();
    const limits = await this.getBudgetLimits();
    
    const percentageUsed = (usage.monthlyTotal / limits.monthlyBudget) * 100;
    
    if (percentageUsed >= 95) {
      await this.triggerBudgetAlert('CRITICAL', percentageUsed);
      return { status: 'CRITICAL', action: 'FORCE_CSV' };
    } else if (percentageUsed >= 85) {
      await this.triggerBudgetAlert('WARNING', percentageUsed);
      return { status: 'WARNING', action: 'PREFER_CSV' };
    } else if (percentageUsed >= 70) {
      await this.triggerBudgetAlert('CAUTION', percentageUsed);
      return { status: 'CAUTION', action: 'MONITOR' };
    }
    
    return { status: 'NORMAL', action: 'CONTINUE' };
  }

  // Cost optimization recommendations
  async generateCostOptimizationReport(): Promise<OptimizationReport> {
    const usage = await this.getDetailedUsage();
    
    return {
      currentSpend: usage.monthlyTotal,
      projectedSpend: this.projectMonthlySpend(usage),
      savings: {
        byUsingCSVForBulk: this.calculateBulkSavings(usage),
        byOptimizingPeakHours: this.calculatePeakHourSavings(usage),
        byBetterRulesets: this.calculateRulesetOptimization(usage)
      },
      recommendations: [
        'Use CSV for orders > 20 items',
        'Batch processing during 10-11 AM and 3-4 PM',
        'API only for express and high-value orders'
      ]
    };
  }
}
```

## CSV Fallback Enhancement

### Intelligent CSV Generation

```typescript
class EnhancedCSVProcessor {
  async generateIntelligentCSV(
    orders: Order[],
    context: ProcessingContext
  ): Promise<CSVGenerationResult> {
    
    // 1. Pre-processing and validation
    const validatedOrders = await this.validateAndCleanOrders(orders);
    
    // 2. Smart batching based on characteristics
    const batches = await this.createSmartBatches(validatedOrders);
    
    // 3. Address normalization and validation
    const normalizedBatches = await Promise.all(
      batches.map(batch => this.normalizeAddresses(batch))
    );
    
    // 4. Courier optimization suggestions
    const optimizedBatches = await Promise.all(
      normalizedBatches.map(batch => this.optimizeCouriers(batch))
    );
    
    // 5. Generate multiple CSV formats
    const csvFiles = await this.generateMultipleFormats(optimizedBatches);
    
    // 6. Create processing instructions
    const instructions = await this.generateProcessingInstructions(optimizedBatches);
    
    // 7. Notify stakeholders
    await this.notifyStakeholders(csvFiles, instructions, context);
    
    return {
      csvFiles,
      instructions,
      batchCount: batches.length,
      orderCount: orders.length,
      estimatedProcessingTime: this.estimateProcessingTime(orders.length),
      qualityScore: this.calculateQualityScore(validatedOrders)
    };
  }

  private async createSmartBatches(orders: Order[]): Promise<OrderBatch[]> {
    // Group orders by characteristics for optimal processing
    const batches: Map<string, Order[]> = new Map();
    
    for (const order of orders) {
      const batchKey = this.generateBatchKey(order);
      
      if (!batches.has(batchKey)) {
        batches.set(batchKey, []);
      }
      
      batches.get(batchKey)!.push(order);
    }
    
    // Convert to batch objects with metadata
    return Array.from(batches.entries()).map(([key, orders]) => ({
      id: generateBatchId(),
      key,
      orders,
      characteristics: this.parseBatchKey(key),
      priority: this.calculateBatchPriority(orders),
      estimatedProcessingTime: this.estimateBatchTime(orders)
    }));
  }

  private generateBatchKey(order: Order): string {
    // Create batch key based on order characteristics
    const zone = order.shippingAddress.zone;
    const priority = order.priority;
    const paymentMethod = order.paymentMethod;
    const hasSpecialRequirements = order.specialRequirements.length > 0;
    
    return `${zone}_${priority}_${paymentMethod}_${hasSpecialRequirements}`;
  }

  private async optimizeCouriers(batch: OrderBatch): Promise<OptimizedBatch> {
    // Analyze destinations and suggest optimal couriers
    const destinations = batch.orders.map(o => ({
      state: o.shippingAddress.state,
      city: o.shippingAddress.city,
      postcode: o.shippingAddress.postcode
    }));
    
    const courierAnalysis = await this.analyzeCourierCoverage(destinations);
    
    return {
      ...batch,
      recommendedCouriers: courierAnalysis.optimal,
      backupCouriers: courierAnalysis.alternatives,
      coverageScore: courierAnalysis.score,
      specialInstructions: this.generateSpecialInstructions(batch.orders)
    };
  }

  // Real-time processing status
  async trackCSVProcessingStatus(batchId: string): Promise<ProcessingStatus> {
    const batch = await this.getBatchDetails(batchId);
    
    return {
      batchId,
      status: batch.status, // GENERATED, UPLOADED, PROCESSING, COMPLETED
      ordersProcessed: batch.processedCount,
      ordersTotal: batch.totalCount,
      awbsGenerated: batch.awbNumbers.length,
      estimatedCompletion: batch.estimatedCompletion,
      issues: batch.processingIssues
    };
  }
}
```

### Automated Notifications

```typescript
class CSVNotificationManager {
  async notifyCSVGenerated(
    batchResult: CSVGenerationResult,
    context: ProcessingContext
  ): Promise<void> {
    const notifications = [];
    
    // 1. Notify admin team
    notifications.push(this.notifyAdminTeam({
      batchCount: batchResult.batchCount,
      orderCount: batchResult.orderCount,
      priority: this.calculateUrgency(batchResult),
      downloadLinks: batchResult.csvFiles.map(f => f.downloadUrl),
      deadline: this.calculateProcessingDeadline(batchResult)
    }));
    
    // 2. Notify customers about processing delays
    if (context.shouldNotifyCustomers) {
      notifications.push(this.notifyCustomers(batchResult.orders, {
        estimatedDelay: batchResult.estimatedProcessingTime,
        reason: context.fallbackReason
      }));
    }
    
    // 3. Update order tracking status
    notifications.push(this.updateOrderTracking(batchResult.orders, {
      status: 'PROCESSING_BATCH',
      estimatedShipDate: this.calculateShipDate(batchResult)
    }));
    
    // 4. Integration notifications (Slack, Teams, etc.)
    notifications.push(this.sendIntegrationNotifications({
      platform: 'slack',
      channel: '#shipping-operations',
      message: this.formatSlackMessage(batchResult),
      urgency: this.calculateUrgency(batchResult)
    }));
    
    await Promise.all(notifications);
  }

  private async notifyAdminTeam(details: AdminNotificationDetails): Promise<void> {
    const emailTemplate = {
      subject: `📦 CSV Batch Generated - ${details.orderCount} orders (${details.priority} priority)`,
      body: `
        New shipping batch ready for processing:
        
        📊 Batch Details:
        - Orders: ${details.orderCount}
        - Batches: ${details.batchCount}
        - Priority: ${details.priority}
        - Deadline: ${details.deadline}
        
        📁 Download Links:
        ${details.downloadLinks.map(link => `• ${link}`).join('\n')}
        
        ⏰ Estimated Processing Time: ${details.estimatedTime}
        
        Please process these batches as soon as possible.
      `
    };
    
    await this.emailService.send({
      to: this.getShippingTeamEmails(),
      ...emailTemplate
    });
  }

  private async notifyCustomers(
    orders: Order[],
    delayInfo: DelayNotification
  ): Promise<void> {
    const customerNotifications = orders.map(order => ({
      customerId: order.customerId,
      orderId: order.id,
      email: order.customerEmail,
      message: `
        Your order #${order.id} is being prepared for shipment.
        
        Due to high order volume, there may be a slight delay of ${delayInfo.estimatedDelay}.
        You'll receive tracking information within the next 4-6 hours.
        
        Thank you for your patience!
      `
    }));
    
    await this.emailService.sendBulk(customerNotifications);
  }
}
```

## Performance Monitoring Dashboard

### Real-time Metrics

```typescript
interface FulfillmentMetrics {
  apiPerformance: {
    currentStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    responseTime: number;
    successRate: number;
    callsToday: number;
    costToday: number;
  };
  csvProcessing: {
    pendingBatches: number;
    processingTime: number;
    completionRate: number;
    qualityScore: number;
  };
  orderFlow: {
    apiOrders: number;
    csvOrders: number;
    totalOrders: number;
    apiPercentage: number;
  };
  businessImpact: {
    customerSatisfaction: number;
    avgShippingTime: number;
    costEfficiency: number;
    operationalEfficiency: number;
  };
}
```

### Alerting System

```typescript
class IntelligentAlertManager {
  async evaluateAlerts(metrics: FulfillmentMetrics): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    // API Performance Alerts
    if (metrics.apiPerformance.successRate < 90) {
      alerts.push({
        level: 'WARNING',
        type: 'API_PERFORMANCE',
        message: `API success rate dropped to ${metrics.apiPerformance.successRate}%`,
        action: 'Consider switching to CSV mode',
        threshold: '90%',
        current: `${metrics.apiPerformance.successRate}%`
      });
    }
    
    // Cost Budget Alerts
    const budgetUsage = await this.calculateBudgetUsage();
    if (budgetUsage > 85) {
      alerts.push({
        level: 'CRITICAL',
        type: 'BUDGET_EXCEEDED',
        message: `Monthly API budget ${budgetUsage}% used`,
        action: 'Switch to CSV mode for remaining month',
        threshold: '85%',
        current: `${budgetUsage}%`
      });
    }
    
    // CSV Processing Backlog
    if (metrics.csvProcessing.pendingBatches > 5) {
      alerts.push({
        level: 'WARNING',
        type: 'CSV_BACKLOG',
        message: `${metrics.csvProcessing.pendingBatches} CSV batches pending`,
        action: 'Review processing capacity',
        threshold: '5 batches',
        current: `${metrics.csvProcessing.pendingBatches} batches`
      });
    }
    
    return alerts;
  }
}
```

## Integration Testing Strategy

### API Testing Scenarios

```typescript
describe('API/CSV Hybrid Decision Engine', () => {
  test('switches to CSV when API is down', async () => {
    // Mock API failure
    mockAPIHealth({ status: 'DOWN' });
    
    const orders = generateTestOrders(10);
    const decision = await fulfillmentRouter.decideFulfillmentMethod(orders);
    
    expect(decision.method).toBe('CSV');
    expect(decision.reason).toBe('API_DOWN');
  });
  
  test('uses API for express orders even during peak', async () => {
    // Mock peak hour conditions
    mockPeakHour(true);
    mockOrderVolume(100);
    
    const expressOrders = generateTestOrders(5, { priority: 'EXPRESS' });
    const decision = await fulfillmentRouter.decideFulfillmentMethod(expressOrders);
    
    expect(decision.method).toBe('API');
    expect(decision.reason).toContain('PRIORITY_ORDERS');
  });
  
  test('respects budget constraints', async () => {
    // Mock budget near limit
    mockBudgetUsage(95);
    
    const orders = generateTestOrders(10);
    const decision = await fulfillmentRouter.decideFulfillmentMethod(orders);
    
    expect(decision.method).toBe('CSV');
    expect(decision.reason).toBe('BUDGET_EXCEEDED');
  });
});
```

This hybrid strategy ensures robust, cost-effective shipping operations with intelligent switching between automated API processing and reliable CSV fallback, maintaining operational continuity while optimizing for both performance and cost.