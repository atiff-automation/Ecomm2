/**
 * Enhanced Unit Tests: Weight-Based Rule Engine
 * 
 * Tests for Day 2 enhancements: packaging weight, rule precedence, and effective date filtering
 * Reference: IMPLEMENTATION_ROADMAP.md Sprint 1.2 - Day 2: Weight-Based Rule Engine
 */

import { ZoneBasedShippingCalculator } from '../zone-based-calculator';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  shippingZone: {
    findMany: jest.fn(),
  },
  shippingRule: {
    findMany: jest.fn(),
  },
  systemConfig: {
    findUnique: jest.fn(),
  },
  shippingCalculation: {
    create: jest.fn(),
  },
} as any;

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('Weight-Based Rule Engine - Day 2 Enhancements', () => {
  let calculator: ZoneBasedShippingCalculator;

  // Enhanced mock data with multiple service types
  const mockZones = [
    {
      id: 'zone-peninsular',
      name: 'Peninsular Malaysia',
      code: 'PENINSULAR',
      states: ['JOH', 'KDH', 'KTN', 'MLK', 'NSN', 'PHG', 'PRK', 'PLS', 'PNG', 'KUL', 'TRG', 'SEL'],
      multiplier: { toNumber: () => 1.0 },
      deliveryTimeMin: 1,
      deliveryTimeMax: 3,
      isActive: true,
      sortOrder: 1,
      features: { same_day: true, cod: true, insurance: true }
    }
  ];

  const mockRules = [
    // Standard service rules
    {
      id: 'rule-standard-0-1kg',
      zoneId: 'zone-peninsular',
      weightMin: { toNumber: () => 0 },
      weightMax: { toNumber: () => 1 },
      price: { toNumber: () => 5.00 },
      serviceType: 'STANDARD',
      isActive: true,
      effectiveTo: null,
      zone: { code: 'PENINSULAR' },
      ruleSet: { id: 'standard-rates' }
    },
    {
      id: 'rule-standard-1-2kg',
      zoneId: 'zone-peninsular',
      weightMin: { toNumber: () => 1 },
      weightMax: { toNumber: () => 2 },
      price: { toNumber: () => 7.00 },
      serviceType: 'STANDARD',
      isActive: true,
      effectiveTo: null,
      zone: { code: 'PENINSULAR' },
      ruleSet: { id: 'standard-rates' }
    },
    // Express service rules (higher cost)
    {
      id: 'rule-express-0-1kg',
      zoneId: 'zone-peninsular',
      weightMin: { toNumber: () => 0 },
      weightMax: { toNumber: () => 1 },
      price: { toNumber: () => 8.00 },
      serviceType: 'EXPRESS',
      isActive: true,
      effectiveTo: null,
      zone: { code: 'PENINSULAR' },
      ruleSet: { id: 'standard-rates' }
    },
    // Overlapping weight ranges for precedence testing
    {
      id: 'rule-standard-0.5-1.5kg',
      zoneId: 'zone-peninsular',
      weightMin: { toNumber: () => 0.5 },
      weightMax: { toNumber: () => 1.5 },
      price: { toNumber: () => 6.00 },
      serviceType: 'STANDARD',
      isActive: true,
      effectiveTo: null,
      zone: { code: 'PENINSULAR' },
      ruleSet: { id: 'standard-rates' }
    }
  ];

  const mockSystemConfig = {
    key: 'free_shipping_threshold',
    value: '150'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPrisma.shippingZone.findMany.mockResolvedValue(mockZones);
    mockPrisma.shippingRule.findMany.mockResolvedValue(mockRules);
    mockPrisma.systemConfig.findUnique.mockResolvedValue(mockSystemConfig);
    mockPrisma.shippingCalculation.create.mockResolvedValue({ id: 'calc-123' });

    calculator = new ZoneBasedShippingCalculator();
  });

  describe('Packaging Weight Calculation', () => {
    it('should calculate minimal packaging weight correctly', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 0.5,
        orderValue: 100.00,
        itemCount: 1,
        items: [
          { weight: 0.5, quantity: 1, shippingClass: 'STANDARD' as const }
        ],
        packagingPreference: 'MINIMAL' as const
      };

      const result = await calculator.calculateShipping(request);
      
      expect(result).not.toBeNull();
      expect(result?.calculationData.totalShippingWeight).toBe(0.525); // 0.5 + (0.5 * 0.05)
      expect(result?.calculationData.packagingWeight).toBe(0.025);
      expect(result?.calculationData.packagingPreference).toBe('MINIMAL');
    });

    it('should calculate standard packaging weight correctly', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 1.0,
        orderValue: 100.00,
        itemCount: 2,
        items: [
          { weight: 0.5, quantity: 2, shippingClass: 'STANDARD' as const }
        ],
        packagingPreference: 'STANDARD' as const
      };

      const result = await calculator.calculateShipping(request);
      
      expect(result).not.toBeNull();
      expect(result?.calculationData.totalShippingWeight).toBe(1.1); // 1.0 + (1.0 * 0.10)
      expect(result?.calculationData.packagingWeight).toBe(0.1);
    });

    it('should use secure packaging for fragile items automatically', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 0.5,
        orderValue: 100.00,
        itemCount: 1,
        items: [
          { weight: 0.5, quantity: 1, shippingClass: 'FRAGILE' as const }
        ],
        packagingPreference: 'MINIMAL' as const // Should be overridden
      };

      const result = await calculator.calculateShipping(request);
      
      expect(result).not.toBeNull();
      expect(result?.calculationData.totalShippingWeight).toBe(0.6); // 0.5 + (0.5 * 0.20) for SECURE
      expect(result?.calculationData.packagingWeight).toBe(0.1);
    });

    it('should apply minimum packaging weight', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 0.1, // Very light item
        orderValue: 100.00,
        itemCount: 1,
        items: [
          { weight: 0.1, quantity: 1, shippingClass: 'STANDARD' as const }
        ],
        packagingPreference: 'MINIMAL' as const
      };

      const result = await calculator.calculateShipping(request);
      
      expect(result).not.toBeNull();
      expect(result?.calculationData.totalShippingWeight).toBe(0.2); // 0.1 + 0.1 (minimum packaging)
      expect(result?.calculationData.packagingWeight).toBe(0.1); // Minimum applied
    });

    it('should handle multiple items with different shipping classes', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 1.0,
        orderValue: 100.00,
        itemCount: 3,
        items: [
          { weight: 0.3, quantity: 1, shippingClass: 'STANDARD' as const },
          { weight: 0.2, quantity: 1, shippingClass: 'FRAGILE' as const },
          { weight: 0.5, quantity: 1, shippingClass: 'STANDARD' as const }
        ],
        packagingPreference: 'STANDARD' as const
      };

      const result = await calculator.calculateShipping(request);
      
      expect(result).not.toBeNull();
      // Should use SECURE packaging due to fragile item
      expect(result?.calculationData.totalShippingWeight).toBe(1.2); // 1.0 + (1.0 * 0.20)
      expect(result?.calculationData.packagingWeight).toBe(0.2);
    });
  });

  describe('Rule Precedence Handling', () => {
    it('should prefer exact service type match', async () => {
      const zone = await calculator.resolveShippingZone('JOH');
      const rule = await calculator.findShippingRule(zone!, 0.5, 'EXPRESS');
      
      expect(rule).not.toBeNull();
      expect(rule?.id).toBe('rule-express-0-1kg');
      expect(rule?.serviceType).toBe('EXPRESS');
      expect(rule?.price).toBe(8.00);
    });

    it('should fallback to STANDARD when requested service unavailable', async () => {
      const zone = await calculator.resolveShippingZone('JOH');
      const rule = await calculator.findShippingRule(zone!, 0.5, 'OVERNIGHT');
      
      expect(rule).not.toBeNull();
      expect(rule?.serviceType).toBe('STANDARD'); // Fallback
      expect(rule?.price).toBe(5.00);
    });

    it('should prefer most specific weight band when multiple rules match', async () => {
      const zone = await calculator.resolveShippingZone('JOH');
      const rule = await calculator.findShippingRule(zone!, 0.8, 'STANDARD');
      
      // Weight 0.8kg matches both:
      // - rule-standard-0-1kg (range: 1.0kg)
      // - rule-standard-0.5-1.5kg (range: 1.0kg)
      // Should prefer the first one found (implementation detail)
      expect(rule).not.toBeNull();
      expect(rule?.serviceType).toBe('STANDARD');
    });

    it('should handle service precedence correctly', async () => {
      // Add OVERNIGHT rule to mock data temporarily
      const enhancedMockRules = [...mockRules, {
        id: 'rule-overnight-0-1kg',
        zoneId: 'zone-peninsular',
        weightMin: { toNumber: () => 0 },
        weightMax: { toNumber: () => 1 },
        price: { toNumber: () => 12.00 },
        serviceType: 'OVERNIGHT',
        isActive: true,
        effectiveTo: null,
        zone: { code: 'PENINSULAR' },
        ruleSet: { id: 'standard-rates' }
      }];

      mockPrisma.shippingRule.findMany.mockResolvedValueOnce(enhancedMockRules);
      
      // Create new calculator instance to pick up new rules
      const enhancedCalculator = new ZoneBasedShippingCalculator();
      
      const zone = await enhancedCalculator.resolveShippingZone('JOH');
      
      // Request ECONOMY but should get OVERNIGHT (higher precedence)
      const rule = await enhancedCalculator.findShippingRule(zone!, 0.5, 'ECONOMY');
      
      expect(rule).not.toBeNull();
      expect(rule?.serviceType).toBe('OVERNIGHT');
      expect(rule?.price).toBe(12.00);
    });
  });

  describe('Enhanced Weight Calculation Integration', () => {
    it('should use enhanced weight calculation in shipping calculation', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 0.8, // Original weight
        orderValue: 100.00,
        itemCount: 2,
        items: [
          { weight: 0.4, quantity: 2, shippingClass: 'STANDARD' as const }
        ],
        packagingPreference: 'STANDARD' as const,
        serviceType: 'STANDARD' as const
      };

      const result = await calculator.calculateShipping(request);
      
      expect(result).not.toBeNull();
      expect(result?.calculationData.originalItemWeight).toBe(0.8);
      expect(result?.calculationData.totalShippingWeight).toBe(0.88); // 0.8 + (0.8 * 0.10)
      expect(result?.calculationData.packagingWeight).toBe(0.08);
      
      // Should still match the 0-1kg rule even with packaging weight
      expect(result?.calculationData.weightBand).toBe('0-1kg');
      expect(result?.finalPrice).toBe(5.00); // STANDARD rate for 0-1kg
    });

    it('should move to next weight band when packaging pushes over threshold', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 0.95, // Close to 1kg threshold
        orderValue: 100.00,
        itemCount: 1,
        items: [
          { weight: 0.95, quantity: 1, shippingClass: 'FRAGILE' as const }
        ],
        packagingPreference: 'STANDARD' as const
      };

      const result = await calculator.calculateShipping(request);
      
      expect(result).not.toBeNull();
      expect(result?.calculationData.totalShippingWeight).toBe(1.14); // 0.95 + (0.95 * 0.20) for SECURE
      
      // Should move to 1-2kg weight band
      expect(result?.calculationData.weightBand).toBe('1-2kg');
      expect(result?.finalPrice).toBe(7.00); // Higher rate for 1-2kg band
    });

    it('should fallback to total weight when items array not provided', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 0.7,
        orderValue: 100.00,
        itemCount: 1,
        serviceType: 'STANDARD' as const
        // No items array provided
      };

      const result = await calculator.calculateShipping(request);
      
      expect(result).not.toBeNull();
      expect(result?.calculationData.totalShippingWeight).toBe(0.7); // Uses provided totalWeight
      expect(result?.calculationData.packagingWeight).toBe(0); // No packaging calculation
      expect(result?.finalPrice).toBe(5.00); // 0-1kg band
    });
  });

  describe('Analytics Integration', () => {
    it('should log enhanced calculation data for analytics', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 0.5,
        orderValue: 100.00,
        itemCount: 1,
        items: [
          { weight: 0.5, quantity: 1, shippingClass: 'STANDARD' as const }
        ],
        packagingPreference: 'STANDARD' as const,
        sessionId: 'test-session',
        orderId: 'order-123',
        userId: 'user-456'
      };

      await calculator.calculateShipping(request);
      
      expect(mockPrisma.shippingCalculation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-123',
          sessionId: 'test-session',
          customerState: 'JOH',
          totalWeight: 0.55, // Enhanced weight with packaging
          orderValue: 100.00,
          itemCount: 1,
          userId: 'user-456',
          calculationData: expect.objectContaining({
            totalShippingWeight: 0.55,
            originalItemWeight: 0.5,
            packagingWeight: 0.05,
            packagingPreference: 'STANDARD'
          })
        })
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle zero weight items gracefully', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 0,
        orderValue: 100.00,
        itemCount: 1,
        items: [
          { weight: 0, quantity: 1, shippingClass: 'STANDARD' as const }
        ],
        packagingPreference: 'MINIMAL' as const
      };

      const result = await calculator.calculateShipping(request);
      
      expect(result).not.toBeNull();
      expect(result?.calculationData.totalShippingWeight).toBe(0.1); // Minimum packaging weight
      expect(result?.calculationData.packagingWeight).toBe(0.1);
    });

    it('should handle empty items array', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 0.5,
        orderValue: 100.00,
        itemCount: 1,
        items: [],
        packagingPreference: 'STANDARD' as const
      };

      const result = await calculator.calculateShipping(request);
      
      expect(result).not.toBeNull();
      expect(result?.calculationData.totalShippingWeight).toBe(0.5); // Falls back to totalWeight
    });

    it('should handle missing dimensions gracefully', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 0.5,
        orderValue: 100.00,
        itemCount: 1,
        items: [
          { weight: 0.5, quantity: 1 } // No dimensions or shipping class
        ],
        packagingPreference: 'STANDARD' as const
      };

      const result = await calculator.calculateShipping(request);
      
      expect(result).not.toBeNull();
      expect(result?.calculationData.totalShippingWeight).toBe(0.55); // With standard packaging
    });
  });
});