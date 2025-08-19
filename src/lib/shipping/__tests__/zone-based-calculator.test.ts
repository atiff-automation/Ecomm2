/**
 * Unit Tests: Zone-Based Shipping Calculator
 * 
 * Comprehensive test suite for zone resolution and shipping calculation
 * Reference: IMPLEMENTATION_ROADMAP.md Sprint 1.2 - Day 1: Write comprehensive unit tests
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

// Override the Prisma instance
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('ZoneBasedShippingCalculator', () => {
  let calculator: ZoneBasedShippingCalculator;

  // Mock data
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
    },
    {
      id: 'zone-east-malaysia',
      name: 'East Malaysia',
      code: 'EAST_MALAYSIA',
      states: ['SBH', 'SWK', 'LBN'],
      multiplier: { toNumber: () => 1.875 },
      deliveryTimeMin: 3,
      deliveryTimeMax: 7,
      isActive: true,
      sortOrder: 2,
      features: { same_day: false, cod: true, insurance: true }
    }
  ];

  const mockRules = [
    {
      id: 'rule-peninsular-0-1kg',
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
      id: 'rule-peninsular-1-2kg',
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
    {
      id: 'rule-east-0-1kg',
      zoneId: 'zone-east-malaysia',
      weightMin: { toNumber: () => 0 },
      weightMax: { toNumber: () => 1 },
      price: { toNumber: () => 8.00 },
      serviceType: 'STANDARD',
      isActive: true,
      effectiveTo: null,
      zone: { code: 'EAST_MALAYSIA' },
      ruleSet: { id: 'standard-rates' }
    }
  ];

  const mockSystemConfig = {
    key: 'free_shipping_threshold',
    value: '150'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock responses
    mockPrisma.shippingZone.findMany.mockResolvedValue(mockZones);
    mockPrisma.shippingRule.findMany.mockResolvedValue(mockRules);
    mockPrisma.systemConfig.findUnique.mockResolvedValue(mockSystemConfig);
    mockPrisma.shippingCalculation.create.mockResolvedValue({ id: 'calc-123' });

    calculator = new ZoneBasedShippingCalculator();
  });

  describe('Zone Resolution Logic', () => {
    describe('resolveShippingZone', () => {
      it('should resolve Johor to Peninsular Malaysia zone', async () => {
        const zone = await calculator.resolveShippingZone('JOH');
        
        expect(zone).not.toBeNull();
        expect(zone?.code).toBe('PENINSULAR');
        expect(zone?.name).toBe('Peninsular Malaysia');
        expect(zone?.states).toContain('JOH');
      });

      it('should resolve Sabah to East Malaysia zone', async () => {
        const zone = await calculator.resolveShippingZone('SBH');
        
        expect(zone).not.toBeNull();
        expect(zone?.code).toBe('EAST_MALAYSIA');
        expect(zone?.name).toBe('East Malaysia');
        expect(zone?.states).toContain('SBH');
      });

      it('should handle full state names correctly', async () => {
        const zone = await calculator.resolveShippingZone('Johor');
        
        expect(zone).not.toBeNull();
        expect(zone?.code).toBe('PENINSULAR');
      });

      it('should handle alternative state names', async () => {
        const zone1 = await calculator.resolveShippingZone('Penang');
        const zone2 = await calculator.resolveShippingZone('Pulau Pinang');
        
        expect(zone1?.code).toBe('PENINSULAR');
        expect(zone2?.code).toBe('PENINSULAR');
        expect(zone1?.states).toContain('PNG');
        expect(zone2?.states).toContain('PNG');
      });

      it('should fallback to Peninsular Malaysia for unknown states', async () => {
        const zone = await calculator.resolveShippingZone('UNKNOWN_STATE');
        
        expect(zone).not.toBeNull();
        expect(zone?.code).toBe('PENINSULAR'); // Fallback zone
      });

      it('should handle case insensitive state codes', async () => {
        const zone1 = await calculator.resolveShippingZone('joh');
        const zone2 = await calculator.resolveShippingZone('JOH');
        
        expect(zone1?.code).toBe(zone2?.code);
        expect(zone1?.code).toBe('PENINSULAR');
      });
    });

    describe('State Code Normalization', () => {
      it('should normalize common Malaysian state variations', async () => {
        const testCases = [
          { input: 'Melaka', expected: 'PENINSULAR' },
          { input: 'Malacca', expected: 'PENINSULAR' },
          { input: 'Kuala Lumpur', expected: 'PENINSULAR' },
          { input: 'Negeri Sembilan', expected: 'PENINSULAR' },
          { input: 'Sarawak', expected: 'EAST_MALAYSIA' },
        ];

        for (const testCase of testCases) {
          const zone = await calculator.resolveShippingZone(testCase.input);
          expect(zone?.code).toBe(testCase.expected);
        }
      });
    });
  });

  describe('Weight-Based Rule Engine', () => {
    describe('findShippingRule', () => {
      it('should find correct rule for 0.5kg in Peninsular Malaysia', async () => {
        const zone = await calculator.resolveShippingZone('JOH');
        const rule = await calculator.findShippingRule(zone!, 0.5, 'STANDARD');
        
        expect(rule).not.toBeNull();
        expect(rule?.id).toBe('rule-peninsular-0-1kg');
        expect(rule?.price).toBe(5.00);
        expect(rule?.weightMin).toBe(0);
        expect(rule?.weightMax).toBe(1);
      });

      it('should find correct rule for 1.5kg in Peninsular Malaysia', async () => {
        const zone = await calculator.resolveShippingZone('JOH');
        const rule = await calculator.findShippingRule(zone!, 1.5, 'STANDARD');
        
        expect(rule).not.toBeNull();
        expect(rule?.id).toBe('rule-peninsular-1-2kg');
        expect(rule?.price).toBe(7.00);
      });

      it('should find correct rule for East Malaysia', async () => {
        const zone = await calculator.resolveShippingZone('SBH');
        const rule = await calculator.findShippingRule(zone!, 0.5, 'STANDARD');
        
        expect(rule).not.toBeNull();
        expect(rule?.id).toBe('rule-east-0-1kg');
        expect(rule?.price).toBe(8.00);
      });

      it('should return null for weight outside available rules', async () => {
        const zone = await calculator.resolveShippingZone('JOH');
        const rule = await calculator.findShippingRule(zone!, 10.0, 'STANDARD');
        
        expect(rule).toBeNull();
      });

      it('should fallback to STANDARD service when requested service unavailable', async () => {
        const zone = await calculator.resolveShippingZone('JOH');
        const rule = await calculator.findShippingRule(zone!, 0.5, 'EXPRESS');
        
        // Should fallback to STANDARD since EXPRESS is not in mock data
        expect(rule).not.toBeNull();
        expect(rule?.serviceType).toBe('STANDARD');
      });
    });
  });

  describe('Price Calculation & Business Rules', () => {
    describe('calculateShipping', () => {
      it('should calculate correct shipping for Peninsular Malaysia order under threshold', async () => {
        const request = {
          customerState: 'JOH',
          totalWeight: 0.5,
          orderValue: 100.00,
          itemCount: 1,
          serviceType: 'STANDARD' as const,
          sessionId: 'test-session'
        };

        const result = await calculator.calculateShipping(request);
        
        expect(result).not.toBeNull();
        expect(result?.zoneName).toBe('Peninsular Malaysia');
        expect(result?.basePrice).toBe(5.00);
        expect(result?.finalPrice).toBe(5.00); // 5.00 * 1.0 multiplier
        expect(result?.freeShippingApplied).toBe(false);
        expect(result?.calculationData.zoneMultiplier).toBe(1.0);
      });

      it('should apply zone multiplier for East Malaysia', async () => {
        const request = {
          customerState: 'SBH',
          totalWeight: 0.5,
          orderValue: 100.00,
          itemCount: 1,
          serviceType: 'STANDARD' as const
        };

        const result = await calculator.calculateShipping(request);
        
        expect(result).not.toBeNull();
        expect(result?.zoneName).toBe('East Malaysia');
        expect(result?.basePrice).toBe(8.00);
        expect(result?.finalPrice).toBe(15.00); // 8.00 * 1.875 multiplier
        expect(result?.calculationData.zoneMultiplier).toBe(1.875);
      });

      it('should apply free shipping for orders above threshold', async () => {
        const request = {
          customerState: 'JOH',
          totalWeight: 0.5,
          orderValue: 200.00, // Above 150 threshold
          itemCount: 1,
          serviceType: 'STANDARD' as const
        };

        const result = await calculator.calculateShipping(request);
        
        expect(result).not.toBeNull();
        expect(result?.basePrice).toBe(5.00);
        expect(result?.finalPrice).toBe(0); // Free shipping applied
        expect(result?.freeShippingApplied).toBe(true);
      });

      it('should return fallback calculation on error', async () => {
        // Simulate database error
        mockPrisma.shippingZone.findMany.mockRejectedValueOnce(new Error('Database error'));
        
        const request = {
          customerState: 'JOH',
          totalWeight: 0.5,
          orderValue: 100.00,
          itemCount: 1
        };

        const result = await calculator.calculateShipping(request);
        
        expect(result).not.toBeNull();
        expect(result?.calculationMethod).toBe('FALLBACK');
        expect(result?.finalPrice).toBe(8.00); // Fallback rate for Peninsular
      });

      it('should use higher fallback rate for East Malaysia states', async () => {
        // Simulate database error
        mockPrisma.shippingZone.findMany.mockRejectedValueOnce(new Error('Database error'));
        
        const request = {
          customerState: 'SBH', // East Malaysia
          totalWeight: 0.5,
          orderValue: 100.00,
          itemCount: 1
        };

        const result = await calculator.calculateShipping(request);
        
        expect(result).not.toBeNull();
        expect(result?.calculationMethod).toBe('FALLBACK');
        expect(result?.finalPrice).toBe(15.00); // Higher fallback rate for East Malaysia
      });
    });

    describe('Free Shipping Logic', () => {
      it('should respect custom free shipping threshold', async () => {
        // Mock different threshold
        mockPrisma.systemConfig.findUnique.mockResolvedValueOnce({
          key: 'free_shipping_threshold',
          value: '200'
        });

        // Recreate calculator to pick up new threshold
        calculator = new ZoneBasedShippingCalculator();

        const request = {
          customerState: 'JOH',
          totalWeight: 0.5,
          orderValue: 180.00, // Between 150 and 200
          itemCount: 1
        };

        const result = await calculator.calculateShipping(request);
        
        expect(result).not.toBeNull();
        expect(result?.freeShippingApplied).toBe(false); // Should not qualify
        expect(result?.finalPrice).toBeGreaterThan(0);
      });
    });
  });

  describe('Caching and Performance', () => {
    describe('Cache Management', () => {
      it('should initialize cache on first use', async () => {
        const stats = calculator.getCacheStats();
        
        // Trigger cache initialization
        await calculator.resolveShippingZone('JOH');
        
        expect(mockPrisma.shippingZone.findMany).toHaveBeenCalled();
        expect(mockPrisma.shippingRule.findMany).toHaveBeenCalled();
        expect(mockPrisma.systemConfig.findUnique).toHaveBeenCalled();
      });

      it('should provide cache statistics', async () => {
        // Trigger cache initialization
        await calculator.resolveShippingZone('JOH');
        
        const stats = calculator.getCacheStats();
        expect(stats.zones).toBeGreaterThan(0);
        expect(stats.ruleGroups).toBeGreaterThan(0);
        expect(stats.freeShippingThreshold).toBe(150);
        expect(stats.lastRefresh).toBeDefined();
      });

      it('should allow cache refresh', async () => {
        // Initial cache load
        await calculator.resolveShippingZone('JOH');
        
        // Clear mock call history
        jest.clearAllMocks();
        
        // Setup fresh mock data
        mockPrisma.shippingZone.findMany.mockResolvedValue(mockZones);
        mockPrisma.shippingRule.findMany.mockResolvedValue(mockRules);
        mockPrisma.systemConfig.findUnique.mockResolvedValue(mockSystemConfig);
        
        // Refresh cache
        await calculator.refreshCache();
        
        expect(mockPrisma.shippingZone.findMany).toHaveBeenCalled();
        expect(mockPrisma.shippingRule.findMany).toHaveBeenCalled();
      });
    });
  });

  describe('Analytics and Logging', () => {
    it('should log calculation for analytics', async () => {
      const request = {
        customerState: 'JOH',
        totalWeight: 0.5,
        orderValue: 100.00,
        itemCount: 1,
        serviceType: 'STANDARD' as const,
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
          totalWeight: 0.5,
          orderValue: 100.00,
          itemCount: 1,
          userId: 'user-456',
          userType: 'MEMBER',
          responseTimeMs: expect.any(Number)
        })
      });
    });

    it('should handle logging failures gracefully', async () => {
      // Simulate logging failure
      mockPrisma.shippingCalculation.create.mockRejectedValueOnce(new Error('Logging failed'));
      
      const request = {
        customerState: 'JOH',
        totalWeight: 0.5,
        orderValue: 100.00,
        itemCount: 1
      };

      // Should not throw error even if logging fails
      const result = await calculator.calculateShipping(request);
      expect(result).not.toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should return available zones', async () => {
      const zones = await calculator.getAvailableZones();
      
      expect(zones).toHaveLength(2);
      expect(zones.map(z => z.code)).toContain('PENINSULAR');
      expect(zones.map(z => z.code)).toContain('EAST_MALAYSIA');
    });

    it('should return rules for specific zone', async () => {
      const rules = await calculator.getZoneRules('PENINSULAR');
      
      expect(rules).toHaveLength(2); // 0-1kg and 1-2kg rules
      expect(rules[0].price).toBe(5.00);
      expect(rules[1].price).toBe(7.00);
    });

    it('should return empty array for unknown zone', async () => {
      const rules = await calculator.getZoneRules('UNKNOWN_ZONE');
      
      expect(rules).toHaveLength(0);
    });
  });
});