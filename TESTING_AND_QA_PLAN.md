# Testing and QA Plan: Smart Zone-Based Shipping System

## Overview

This document outlines a comprehensive testing strategy for the zone-based shipping system with intelligent API/CSV hybrid fulfillment, ensuring robust quality assurance throughout development and deployment phases.

## Testing Philosophy

### Quality Principles
1. **Shift-Left Testing**: Early testing integration in development process
2. **Risk-Based Testing**: Focus on high-risk components and business-critical paths
3. **Test Automation**: Automated testing for regression prevention and CI/CD
4. **Performance First**: Performance testing integrated throughout development
5. **User-Centric**: Testing from actual user perspectives and workflows

### Testing Pyramid
```
                    ┌─────────────────┐
                    │  Manual E2E     │ 5%
                    │  User Testing   │
                ┌───┴─────────────────┴───┐
                │   Automated E2E Tests   │ 15%
                │   Integration Tests     │
            ┌───┴─────────────────────────┴───┐
            │      Component Tests            │ 30%
            │      API Tests                  │
        ┌───┴─────────────────────────────────┴───┐
        │           Unit Tests                    │ 50%
        │           Function Tests                │
        └─────────────────────────────────────────┘
```

## Test Strategy by Phase

### Phase 1: Foundation Testing (Weeks 1-2)

#### Database Schema Testing
**Scope**: Validate database integrity, migrations, and performance

**Test Categories**:
```sql
-- 1. Schema Validation Tests
□ Table creation and relationships
□ Constraint validation (foreign keys, checks, unique)
□ Index performance optimization
□ Data type validation

-- 2. Migration Testing
□ Forward migration execution
□ Rollback procedures
□ Data preservation during migration
□ Performance impact measurement

-- 3. Data Integrity Tests
□ Referential integrity validation
□ Trigger functionality
□ Materialized view refresh
□ Concurrent access handling
```

**Test Implementation**:
```typescript
describe('Database Schema Tests', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  describe('Shipping Zones', () => {
    test('should create zone with valid state array', async () => {
      const zone = await createShippingZone({
        name: 'Test Zone',
        code: 'TEST',
        states: ['JOH', 'KDH'],
        multiplier: 1.5
      });

      expect(zone.id).toBeDefined();
      expect(zone.states).toEqual(['JOH', 'KDH']);
      expect(zone.multiplier).toBe(1.5);
    });

    test('should reject zone with empty states array', async () => {
      await expect(createShippingZone({
        name: 'Invalid Zone',
        code: 'INVALID',
        states: [],
        multiplier: 1.0
      })).rejects.toThrow('states_not_empty');
    });

    test('should enforce unique zone codes', async () => {
      await createShippingZone({
        name: 'Zone 1',
        code: 'DUPLICATE',
        states: ['JOH'],
        multiplier: 1.0
      });

      await expect(createShippingZone({
        name: 'Zone 2',
        code: 'DUPLICATE',
        states: ['KDH'],
        multiplier: 1.0
      })).rejects.toThrow('duplicate key');
    });
  });

  describe('Shipping Rules', () => {
    test('should calculate rates correctly with zone multiplier', async () => {
      const zone = await createShippingZone({
        name: 'Test Zone',
        code: 'TEST',
        states: ['JOH'],
        multiplier: 1.5
      });

      const rule = await createShippingRule({
        zoneId: zone.id,
        weightMin: 0,
        weightMax: 1,
        price: 10.00
      });

      const rate = await calculateShippingRate('JOH', 0.5, 100);
      expect(rate.finalPrice).toBe(15.00); // 10.00 * 1.5
    });

    test('should handle weight band overlaps correctly', async () => {
      const zone = await createShippingZone({
        name: 'Test Zone',
        code: 'TEST',
        states: ['JOH'],
        multiplier: 1.0
      });

      await createShippingRule({
        zoneId: zone.id,
        weightMin: 0,
        weightMax: 1,
        price: 5.00
      });

      await expect(createShippingRule({
        zoneId: zone.id,
        weightMin: 0.5,
        weightMax: 1.5,
        price: 7.00
      })).rejects.toThrow('unique_zone_weight_rule');
    });
  });

  describe('Performance Tests', () => {
    test('should calculate shipping rate within 100ms', async () => {
      const startTime = Date.now();
      await calculateShippingRate('JOH', 1.5, 100);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    test('should handle 1000 concurrent rate calculations', async () => {
      const promises = Array(1000).fill(null).map(() =>
        calculateShippingRate('JOH', Math.random() * 5, 100)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(1000);
      expect(results.every(r => r.finalPrice > 0)).toBe(true);
    });
  });
});
```

#### Core Shipping Calculator Testing
**Scope**: Validate shipping calculation logic and business rules

```typescript
describe('Shipping Calculator', () => {
  describe('Zone Resolution', () => {
    test('should resolve state to correct zone', async () => {
      const result = await shippingCalculator.resolveZone('JOH');
      expect(result.zoneCode).toBe('PENINSULAR');
      expect(result.multiplier).toBe(1.0);
    });

    test('should handle unknown states gracefully', async () => {
      const result = await shippingCalculator.resolveZone('UNKNOWN');
      expect(result).toBeNull();
    });
  });

  describe('Weight Band Matching', () => {
    test('should match exact weight boundaries', async () => {
      const rule = await shippingCalculator.findMatchingRule('PENINSULAR', 1.0);
      expect(rule.weightMin).toBeLessThanOrEqual(1.0);
      expect(rule.weightMax).toBeGreaterThanOrEqual(1.0);
    });

    test('should handle edge cases for weight boundaries', async () => {
      const rules = await Promise.all([
        shippingCalculator.findMatchingRule('PENINSULAR', 0.999),
        shippingCalculator.findMatchingRule('PENINSULAR', 1.000),
        shippingCalculator.findMatchingRule('PENINSULAR', 1.001)
      ]);

      expect(rules[0].weightMax).toBe(1.0);
      expect(rules[1].weightMax).toBe(1.0);
      expect(rules[2].weightMin).toBe(1.0);
    });
  });

  describe('Business Rules', () => {
    test('should apply free shipping threshold', async () => {
      const result = await shippingCalculator.calculate({
        state: 'JOH',
        weight: 1.5,
        orderValue: 150.00
      });

      expect(result.freeShippingApplied).toBe(true);
      expect(result.finalPrice).toBe(0);
    });

    test('should apply promotional rates when active', async () => {
      await activatePromotionalRateSet('HOLIDAY_2024');
      
      const result = await shippingCalculator.calculate({
        state: 'JOH',
        weight: 1.5,
        orderValue: 50.00
      });

      expect(result.ruleSetUsed).toBe('HOLIDAY_2024');
      expect(result.discount).toBeGreaterThan(0);
    });
  });
});
```

### Phase 2: Integration Testing (Weeks 3-4)

#### API Integration Testing
**Scope**: Validate EasyParcel API integration and error handling

```typescript
describe('EasyParcel API Integration', () => {
  let mockAPIServer: MockAPIServer;

  beforeEach(() => {
    mockAPIServer = new MockAPIServer();
    mockAPIServer.start();
  });

  afterEach(() => {
    mockAPIServer.stop();
  });

  describe('Authentication', () => {
    test('should authenticate successfully with valid credentials', async () => {
      mockAPIServer.mockAuthSuccess();
      
      const auth = new EasyParcelAuth(testCredentials);
      const token = await auth.authenticate();

      expect(token.accessToken).toBeDefined();
      expect(token.expiresAt).toBeInstanceOf(Date);
    });

    test('should handle authentication failures gracefully', async () => {
      mockAPIServer.mockAuthFailure(401);
      
      const auth = new EasyParcelAuth(invalidCredentials);
      
      await expect(auth.authenticate())
        .rejects.toThrow('Authentication failed');
    });

    test('should cache and reuse valid tokens', async () => {
      mockAPIServer.mockAuthSuccess();
      
      const auth = new EasyParcelAuth(testCredentials);
      const token1 = await auth.authenticate();
      const token2 = await auth.authenticate();

      expect(token1.accessToken).toBe(token2.accessToken);
      expect(mockAPIServer.authCallCount).toBe(1);
    });
  });

  describe('Rate Calculation', () => {
    test('should calculate rates for valid shipment', async () => {
      mockAPIServer.mockRateCalculationSuccess();
      
      const request = createTestRateRequest();
      const response = await easyParcelAPI.calculateRates(request);

      expect(response.success).toBe(true);
      expect(response.rates).toHaveLength.greaterThan(0);
      expect(response.rates[0].totalPrice).toBeGreaterThan(0);
    });

    test('should handle rate calculation timeout', async () => {
      mockAPIServer.mockTimeout(30000);
      
      const request = createTestRateRequest();
      
      await expect(easyParcelAPI.calculateRates(request))
        .rejects.toThrow('Request timeout');
    });

    test('should retry on transient failures', async () => {
      mockAPIServer
        .mockRateCalculationFailure(500)
        .mockRateCalculationFailure(502)
        .mockRateCalculationSuccess();
      
      const request = createTestRateRequest();
      const response = await easyParcelAPI.calculateRates(request);

      expect(response.success).toBe(true);
      expect(mockAPIServer.rateCallCount).toBe(3);
    });
  });

  describe('Error Handling', () => {
    test('should categorize API errors correctly', async () => {
      const testCases = [
        { statusCode: 400, expectedCategory: 'VALIDATION_ERROR' },
        { statusCode: 401, expectedCategory: 'AUTHENTICATION_FAILED' },
        { statusCode: 429, expectedCategory: 'RATE_LIMIT_EXCEEDED' },
        { statusCode: 500, expectedCategory: 'SERVICE_UNAVAILABLE' }
      ];

      for (const testCase of testCases) {
        mockAPIServer.mockError(testCase.statusCode);
        
        try {
          await easyParcelAPI.calculateRates(createTestRateRequest());
        } catch (error) {
          const category = errorHandler.categorizeError(error);
          expect(category).toBe(testCase.expectedCategory);
        }
      }
    });
  });
});
```

#### Circuit Breaker Testing
**Scope**: Validate fault tolerance and automatic fallback

```typescript
describe('Circuit Breaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 60000,
      successThreshold: 2
    });
  });

  describe('State Transitions', () => {
    test('should open after failure threshold', async () => {
      // Simulate failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(() => Promise.reject(new Error('API failure')));
        } catch {}
      }

      expect(circuitBreaker.state).toBe('OPEN');
      
      // Next call should fail immediately
      await expect(circuitBreaker.execute(() => Promise.resolve('success')))
        .rejects.toThrow('Circuit breaker is OPEN');
    });

    test('should transition to half-open after recovery timeout', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(() => Promise.reject(new Error('API failure')));
        } catch {}
      }

      expect(circuitBreaker.state).toBe('OPEN');

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 60000));

      // Next call should transition to HALF_OPEN
      try {
        await circuitBreaker.execute(() => Promise.resolve('success'));
      } catch {}

      expect(circuitBreaker.state).toBe('HALF_OPEN');
    });

    test('should close after successful calls in half-open state', async () => {
      // Get to HALF_OPEN state
      circuitBreaker.state = 'HALF_OPEN';

      // Make successful calls
      await circuitBreaker.execute(() => Promise.resolve('success 1'));
      await circuitBreaker.execute(() => Promise.resolve('success 2'));

      expect(circuitBreaker.state).toBe('CLOSED');
    });
  });
});
```

#### Fulfillment Decision Engine Testing
**Scope**: Validate smart API/CSV switching logic

```typescript
describe('Fulfillment Decision Engine', () => {
  let decisionEngine: SmartFulfillmentRouter;
  let mockHealthMonitor: MockAPIHealthMonitor;
  let mockCostTracker: MockAPICostTracker;

  beforeEach(() => {
    mockHealthMonitor = new MockAPIHealthMonitor();
    mockCostTracker = new MockAPICostTracker();
    decisionEngine = new SmartFulfillmentRouter({
      healthMonitor: mockHealthMonitor,
      costTracker: mockCostTracker
    });
  });

  describe('Health-Based Decisions', () => {
    test('should use API when healthy', async () => {
      mockHealthMonitor.setHealthStatus('HEALTHY');
      
      const orders = generateTestOrders(10);
      const decision = await decisionEngine.decideFulfillmentMethod(orders);

      expect(decision.method).toBe('API');
      expect(decision.reason).toContain('API_HEALTHY');
    });

    test('should switch to CSV when API is down', async () => {
      mockHealthMonitor.setHealthStatus('DOWN');
      
      const orders = generateTestOrders(10);
      const decision = await decisionEngine.decideFulfillmentMethod(orders);

      expect(decision.method).toBe('CSV');
      expect(decision.reason).toBe('API_DOWN');
    });

    test('should prefer CSV for bulk orders when API degraded', async () => {
      mockHealthMonitor.setHealthStatus('DEGRADED');
      
      const orders = generateTestOrders(50);
      const decision = await decisionEngine.decideFulfillmentMethod(orders);

      expect(decision.method).toBe('CSV');
      expect(decision.reason).toContain('BULK_PROCESSING');
    });
  });

  describe('Cost-Based Decisions', () => {
    test('should switch to CSV when budget exceeded', async () => {
      mockHealthMonitor.setHealthStatus('HEALTHY');
      mockCostTracker.setBudgetUsage(96);
      
      const orders = generateTestOrders(5);
      const decision = await decisionEngine.decideFulfillmentMethod(orders);

      expect(decision.method).toBe('CSV');
      expect(decision.reason).toBe('BUDGET_EXCEEDED');
    });

    test('should prefer CSV when approaching budget limit', async () => {
      mockHealthMonitor.setHealthStatus('HEALTHY');
      mockCostTracker.setBudgetUsage(87);
      
      const orders = generateTestOrders(25);
      const decision = await decisionEngine.decideFulfillmentMethod(orders);

      expect(decision.method).toBe('CSV');
      expect(decision.reason).toContain('BUDGET_WARNING');
    });
  });

  describe('Priority-Based Decisions', () => {
    test('should use API for express orders regardless of volume', async () => {
      mockHealthMonitor.setHealthStatus('HEALTHY');
      
      const orders = [
        ...generateTestOrders(50, { priority: 'STANDARD' }),
        ...generateTestOrders(5, { priority: 'EXPRESS' })
      ];
      
      const decision = await decisionEngine.decideFulfillmentMethod(orders);

      expect(decision.method).toBe('API');
      expect(decision.reason).toContain('PRIORITY_ORDERS');
    });

    test('should use API for high-value orders', async () => {
      mockHealthMonitor.setHealthStatus('HEALTHY');
      
      const orders = generateTestOrders(10, { value: 1500 });
      const decision = await decisionEngine.decideFulfillmentMethod(orders);

      expect(decision.method).toBe('API');
      expect(decision.reason).toContain('HIGH_VALUE');
    });
  });

  describe('Admin Override', () => {
    test('should respect admin force CSV setting', async () => {
      await setAdminOverride('FORCE_CSV');
      mockHealthMonitor.setHealthStatus('HEALTHY');
      
      const orders = generateTestOrders(5, { priority: 'EXPRESS' });
      const decision = await decisionEngine.decideFulfillmentMethod(orders);

      expect(decision.method).toBe('CSV');
      expect(decision.reason).toBe('ADMIN_FORCE_CSV');
    });

    test('should respect admin force API setting when API accessible', async () => {
      await setAdminOverride('FORCE_API');
      mockHealthMonitor.setHealthStatus('HEALTHY');
      
      const orders = generateTestOrders(100);
      const decision = await decisionEngine.decideFulfillmentMethod(orders);

      expect(decision.method).toBe('API');
      expect(decision.reason).toBe('ADMIN_FORCE_API');
    });
  });
});
```

### Phase 3: System Testing (Weeks 5-6)

#### End-to-End Testing
**Scope**: Complete user workflows and system integration

```typescript
describe('End-to-End Shipping Workflows', () => {
  describe('Customer Checkout Flow', () => {
    test('should calculate shipping rates accurately during checkout', async () => {
      // 1. Customer adds items to cart
      const cart = await createTestCart([
        { weight: 0.5, price: 50 },
        { weight: 1.2, price: 75 }
      ]);

      // 2. Customer enters shipping address
      const shippingAddress = {
        state: 'JOH',
        city: 'Johor Bahru',
        postcode: '80000'
      };

      // 3. System calculates shipping rate
      const shippingRate = await calculateShippingForCheckout(cart, shippingAddress);

      expect(shippingRate.zone).toBe('PENINSULAR');
      expect(shippingRate.totalWeight).toBe(1.7);
      expect(shippingRate.price).toBeGreaterThan(0);
      expect(shippingRate.estimatedDelivery).toBeDefined();
    });

    test('should apply free shipping correctly', async () => {
      const cart = await createTestCart([
        { weight: 1.0, price: 150 }
      ]);

      const shippingAddress = { state: 'JOH', city: 'Johor Bahru', postcode: '80000' };
      const shippingRate = await calculateShippingForCheckout(cart, shippingAddress);

      expect(shippingRate.freeShipping).toBe(true);
      expect(shippingRate.price).toBe(0);
      expect(shippingRate.savings).toBeGreaterThan(0);
    });
  });

  describe('Order Processing Flow', () => {
    test('should process order through API successfully', async () => {
      // Mock healthy API
      mockAPIHealth('HEALTHY');
      
      // 1. Order placement
      const order = await createTestOrder({
        items: [{ weight: 1.5, price: 100 }],
        shippingAddress: { state: 'JOH', city: 'Johor Bahru', postcode: '80000' }
      });

      // 2. System decides fulfillment method
      const decision = await decideFulfillmentMethod([order]);
      expect(decision.method).toBe('API');

      // 3. API processing
      const result = await processOrderViaAPI(order);
      expect(result.success).toBe(true);
      expect(result.awbNumber).toBeDefined();
      expect(result.trackingUrl).toBeDefined();

      // 4. Order status update
      const updatedOrder = await getOrder(order.id);
      expect(updatedOrder.status).toBe('PROCESSING');
      expect(updatedOrder.trackingNumber).toBe(result.awbNumber);
    });

    test('should fallback to CSV when API fails', async () => {
      // Mock API failure
      mockAPIHealth('DOWN');
      
      const orders = await createTestOrders(5);
      
      // 1. System decides fulfillment method
      const decision = await decideFulfillmentMethod(orders);
      expect(decision.method).toBe('CSV');

      // 2. CSV generation
      const csvResult = await generateCSVForOrders(orders);
      expect(csvResult.success).toBe(true);
      expect(csvResult.batchId).toBeDefined();
      expect(csvResult.downloadUrl).toBeDefined();

      // 3. Notifications sent
      const notifications = await getNotificationsForBatch(csvResult.batchId);
      expect(notifications.adminNotified).toBe(true);
      expect(notifications.customersNotified).toBe(true);
    });
  });

  describe('Admin Management Flow', () => {
    test('should allow admin to update shipping rates', async () => {
      // 1. Admin logs in
      const adminSession = await loginAsAdmin();
      
      // 2. Navigate to rate management
      const rateMatrix = await getRateMatrix();
      expect(rateMatrix.zones).toHaveLength(2);

      // 3. Update rates
      const updateResult = await updateShippingRate({
        zoneId: rateMatrix.zones[0].id,
        weightMin: 1,
        weightMax: 2,
        newPrice: 12.50
      });

      expect(updateResult.success).toBe(true);

      // 4. Verify change in history
      const history = await getRateChangeHistory();
      expect(history[0].operation).toBe('UPDATE');
      expect(history[0].newValues.price).toBe(12.50);

      // 5. Test calculation with new rate
      const testRate = await calculateShippingRate('JOH', 1.5, 100);
      expect(testRate.basePrice).toBe(12.50);
    });

    test('should handle bulk rate updates correctly', async () => {
      const bulkUpdate = await performBulkRateUpdate({
        zones: ['PENINSULAR', 'EAST_MALAYSIA'],
        weightRanges: [{ min: 0, max: 5 }],
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 10
      });

      expect(bulkUpdate.affectedRules).toBeGreaterThan(0);
      expect(bulkUpdate.previewChanges).toBeDefined();

      // Verify changes applied
      const updatedRates = await getAllShippingRates();
      const peninsularRates = updatedRates.filter(r => r.zoneCode === 'PENINSULAR');
      
      peninsularRates.forEach(rate => {
        expect(rate.price).toBeGreaterThan(rate.originalPrice);
      });
    });
  });
});
```

#### Performance Testing
**Scope**: Load testing, stress testing, and performance benchmarks

```typescript
describe('Performance Tests', () => {
  describe('Database Performance', () => {
    test('should handle 1000 concurrent shipping calculations', async () => {
      const promises = Array(1000).fill(null).map(() =>
        calculateShippingRate(
          randomState(),
          Math.random() * 5,
          Math.random() * 500
        )
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(1000);
      expect(results.every(r => r.finalPrice >= 0)).toBe(true);
      expect(duration).toBeLessThan(5000); // All calculations in 5 seconds
    });

    test('should maintain response time under load', async () => {
      const responseTimes = [];
      
      for (let i = 0; i < 100; i++) {
        const startTime = Date.now();
        await calculateShippingRate('JOH', 1.5, 100);
        responseTimes.push(Date.now() - startTime);
      }

      const averageTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      const p95Time = responseTimes.sort((a, b) => a - b)[94]; // 95th percentile

      expect(averageTime).toBeLessThan(50); // Average under 50ms
      expect(p95Time).toBeLessThan(100); // 95% under 100ms
    });
  });

  describe('API Performance', () => {
    test('should process orders efficiently via API', async () => {
      mockAPIHealth('HEALTHY');
      
      const orders = await createTestOrders(20);
      
      const startTime = Date.now();
      const results = await Promise.all(
        orders.map(order => processOrderViaAPI(order))
      );
      const duration = Date.now() - startTime;

      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(30000); // 20 orders in 30 seconds
    });

    test('should handle CSV generation for large batches', async () => {
      const orders = await createTestOrders(500);
      
      const startTime = Date.now();
      const csvResult = await generateCSVForOrders(orders);
      const duration = Date.now() - startTime;

      expect(csvResult.success).toBe(true);
      expect(csvResult.orderCount).toBe(500);
      expect(duration).toBeLessThan(60000); // 500 orders in 60 seconds
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should not leak memory during extended operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform 1000 operations
      for (let i = 0; i < 1000; i++) {
        await calculateShippingRate('JOH', Math.random() * 5, 100);
        
        // Force garbage collection every 100 operations
        if (i % 100 === 0) {
          global.gc && global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
```

### Phase 4: User Acceptance Testing (Week 7)

#### UAT Test Scenarios
**Scope**: Real-world user scenarios and edge cases

```typescript
describe('User Acceptance Tests', () => {
  describe('Admin User Scenarios', () => {
    test('Scenario: Daily rate management workflow', async () => {
      const admin = await loginAsAdmin('sarah@ecomjrm.com');
      
      // 1. Check morning dashboard
      const dashboard = await loadDashboard();
      expect(dashboard.systemHealth.api).toBe('HEALTHY');
      expect(dashboard.todayOrders).toBeGreaterThan(0);

      // 2. Review pending CSV batches
      const csvQueue = await getCSVProcessingQueue();
      if (csvQueue.pendingBatches > 0) {
        await processPendingBatches(csvQueue.batches[0]);
      }

      // 3. Check if rate adjustments needed
      const performanceReport = await getZonePerformanceReport();
      if (performanceReport.recommendsAdjustment) {
        await applyRecommendedRateAdjustments(performanceReport.suggestions);
      }

      // 4. Monitor API usage and costs
      const costReport = await getDailyCostReport();
      expect(costReport.budgetUsage).toBeLessThan(100);

      // Success criteria: All tasks completed without errors
      const auditLog = await getAdminAuditLog();
      expect(auditLog.todayActions.every(a => a.success)).toBe(true);
    });

    test('Scenario: Emergency API failure response', async () => {
      const admin = await loginAsAdmin('mike@ecomjrm.com');
      
      // 1. Simulate API failure
      mockAPIDown();
      
      // 2. Admin receives alert
      const alerts = await getActiveAlerts();
      const apiAlert = alerts.find(a => a.type === 'API_DOWN');
      expect(apiAlert).toBeDefined();

      // 3. Admin acknowledges alert and checks system status
      await acknowledgeAlert(apiAlert.id);
      const systemStatus = await getSystemStatus();
      expect(systemStatus.fulfillmentMode).toBe('CSV_ONLY');

      // 4. Admin processes emergency CSV batch
      const emergencyOrders = await getOrdersNeedingProcessing();
      const csvResult = await generateEmergencyCSV(emergencyOrders);
      expect(csvResult.success).toBe(true);

      // 5. Admin notifies team
      await sendTeamNotification({
        type: 'EMERGENCY_CSV_GENERATED',
        batchId: csvResult.batchId,
        urgency: 'HIGH'
      });
    });

    test('Scenario: Peak season preparation', async () => {
      const admin = await loginAsAdmin('admin@ecomjrm.com');
      
      // 1. Create seasonal rate set
      const seasonalRates = await createSeasonalRateSet({
        name: '11.11 Flash Sale',
        validFrom: '2024-11-11T00:00:00Z',
        validTo: '2024-11-12T23:59:59Z',
        baseRateAdjustment: -0.20 // 20% discount
      });

      // 2. Configure peak hour settings
      await configurePeakHourSettings({
        enableCSVMode: true,
        apiCallLimit: 50,
        batchInterval: 900 // 15 minutes
      });

      // 3. Test load handling
      const loadTest = await simulatePeakLoad(1000);
      expect(loadTest.systemStability).toBe('STABLE');
      expect(loadTest.responseTimeP95).toBeLessThan(2000);
    });
  });

  describe('Business User Scenarios', () => {
    test('Scenario: Customer checkout experience', async () => {
      // 1. Customer adds items to cart
      const customer = await createGuestCustomer();
      await addItemToCart(customer, { weight: 1.5, price: 89.99 });
      await addItemToCart(customer, { weight: 0.8, price: 45.00 });

      // 2. Customer enters shipping address
      const shippingRate = await calculateShippingForAddress({
        state: 'SBH',
        city: 'Kota Kinabalu',
        postcode: '88000'
      });

      expect(shippingRate.zone).toBe('EAST_MALAYSIA');
      expect(shippingRate.price).toBeGreaterThan(0);
      expect(shippingRate.estimatedDays).toBeBetween(3, 7);

      // 3. Customer completes order
      const order = await completeOrder(customer, {
        shippingAddress: shippingRate.address,
        shippingCost: shippingRate.price
      });

      expect(order.status).toBe('CONFIRMED');
      expect(order.trackingNumber).toBeDefined();

      // 4. Customer receives confirmation
      const confirmation = await getOrderConfirmation(order.id);
      expect(confirmation.emailSent).toBe(true);
      expect(confirmation.estimatedDelivery).toBeDefined();
    });

    test('Scenario: Order tracking and updates', async () => {
      const order = await createProcessedOrder();
      
      // 1. Customer tracks order
      const tracking = await trackOrder(order.trackingNumber);
      expect(tracking.currentStatus).toBeDefined();
      expect(tracking.events).toHaveLength.greaterThan(0);

      // 2. Simulate delivery update
      await simulateTrackingUpdate(order.trackingNumber, {
        status: 'OUT_FOR_DELIVERY',
        location: 'Kota Kinabalu Hub',
        timestamp: new Date()
      });

      // 3. Customer receives notification
      const notifications = await getCustomerNotifications(order.customerId);
      const deliveryNotification = notifications.find(n => 
        n.type === 'DELIVERY_UPDATE' && n.orderId === order.id
      );
      
      expect(deliveryNotification).toBeDefined();
      expect(deliveryNotification.delivered).toBe(true);
    });
  });

  describe('Edge Case Scenarios', () => {
    test('Should handle simultaneous admin and customer operations', async () => {
      const operations = [
        // Admin bulk rate update
        performBulkRateUpdate({
          zones: ['PENINSULAR'],
          adjustmentType: 'PERCENTAGE',
          adjustmentValue: 5
        }),
        
        // Multiple customer checkouts
        ...Array(20).fill(null).map(() => 
          completeCustomerCheckout({
            state: 'JOH',
            weight: Math.random() * 3,
            value: Math.random() * 200
          })
        )
      ];

      const results = await Promise.allSettled(operations);
      const failures = results.filter(r => r.status === 'rejected');
      
      // Should handle concurrent operations gracefully
      expect(failures.length).toBeLessThan(2);
    });

    test('Should maintain data consistency during failovers', async () => {
      // Start processing orders via API
      const orders = await createTestOrders(10);
      const processingPromise = processOrdersViaAPI(orders);

      // Simulate API failure mid-processing
      setTimeout(() => mockAPIDown(), 2000);

      // Wait for processing to complete
      const results = await processingPromise;

      // Verify data consistency
      for (const result of results) {
        const order = await getOrder(result.orderId);
        
        if (result.success) {
          expect(order.status).toBe('PROCESSING');
          expect(order.trackingNumber).toBeDefined();
        } else {
          expect(order.status).toBe('PENDING');
          expect(order.requiresCSVProcessing).toBe(true);
        }
      }
    });
  });
});
```

## Quality Assurance Standards

### Code Quality Metrics
```typescript
interface QualityStandards {
  coverage: {
    unit: 90; // 90% minimum unit test coverage
    integration: 75; // 75% integration test coverage
    e2e: 60; // 60% end-to-end test coverage
  };
  performance: {
    responseTime: {
      p50: 100; // 50th percentile < 100ms
      p95: 500; // 95th percentile < 500ms
      p99: 1000; // 99th percentile < 1000ms
    };
    throughput: {
      shippingCalculations: 1000; // per minute
      orderProcessing: 500; // per minute
    };
  };
  reliability: {
    uptime: 99.9; // 99.9% uptime requirement
    errorRate: 0.1; // <0.1% error rate
    failoverTime: 30; // <30 seconds for failover
  };
}
```

### Test Data Management
```typescript
class TestDataManager {
  async setupTestEnvironment(): Promise<void> {
    // 1. Create test database
    await this.createTestDatabase();
    
    // 2. Seed reference data
    await this.seedReferenceData();
    
    // 3. Create test users
    await this.createTestUsers();
    
    // 4. Setup mock services
    await this.setupMockServices();
  }

  async createTestUsers(): Promise<void> {
    await Promise.all([
      createUser({
        email: 'admin@test.com',
        role: 'ADMIN',
        permissions: ['ZONE_MANAGEMENT', 'RATE_MANAGEMENT']
      }),
      createUser({
        email: 'operator@test.com',
        role: 'OPERATOR',
        permissions: ['RATE_VIEWING', 'CSV_PROCESSING']
      }),
      createUser({
        email: 'viewer@test.com',
        role: 'VIEWER',
        permissions: ['DASHBOARD_VIEWING']
      })
    ]);
  }

  async seedReferenceData(): Promise<void> {
    // Malaysian states and zones
    await this.seedMalaysianZones();
    
    // Standard rate structures
    await this.seedStandardRates();
    
    // Test product catalog
    await this.seedTestProducts();
  }
}
```

## Automated Testing Pipeline

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Automated Testing Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: ecomjrm_test
          POSTGRES_PASSWORD: test123
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test123@localhost:5432/ecomjrm_test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
        env:
          NODE_ENV: test

  performance-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:performance
      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: performance-results.json
```

### Continuous Monitoring
```typescript
class TestMetricsCollector {
  async collectTestMetrics(): Promise<TestMetrics> {
    return {
      coverage: await this.getCoverageMetrics(),
      performance: await this.getPerformanceMetrics(),
      reliability: await this.getReliabilityMetrics(),
      quality: await this.getQualityMetrics()
    };
  }

  async generateQualityReport(): Promise<QualityReport> {
    const metrics = await this.collectTestMetrics();
    
    return {
      summary: {
        overallScore: this.calculateQualityScore(metrics),
        passRate: metrics.passRate,
        coverageScore: metrics.coverage.overall,
        performanceScore: metrics.performance.score
      },
      recommendations: this.generateRecommendations(metrics),
      trends: await this.getQualityTrends(),
      alerts: this.identifyQualityAlerts(metrics)
    };
  }
}
```

## Risk Mitigation

### Testing Risks and Mitigation
| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| **Incomplete API Mock Coverage** | High | • Comprehensive API contract testing<br>• Real API testing in staging<br>• Mock validation against real responses |
| **Performance Test Environment Differences** | Medium | • Production-like test environment<br>• Load testing with real data volumes<br>• Performance monitoring in production |
| **Test Data Staleness** | Medium | • Automated test data refresh<br>• Production data anonymization<br>• Regular test data validation |
| **Insufficient Edge Case Coverage** | High | • Systematic edge case identification<br>• Property-based testing<br>• Real-world scenario simulation |

This comprehensive testing plan ensures robust quality assurance throughout the development lifecycle, providing confidence in the smart shipping system's reliability, performance, and user experience.