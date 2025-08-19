# Zone-Based Shipping Design Specification

## Overview

This document provides detailed specifications for implementing a flexible, zone-based shipping system that allows admin-controlled rate management based on geographic zones and package weight tiers.

## Zone Configuration

### Malaysian Shipping Zones

#### Zone 1: Peninsular Malaysia
**Coverage**: West Coast and Central Peninsula
```javascript
const PENINSULAR_STATES = [
  'JOH', // Johor
  'KDH', // Kedah  
  'KTN', // Kelantan
  'MLK', // Melaka
  'NSN', // Negeri Sembilan
  'PHG', // Pahang
  'PRK', // Perak
  'PLS', // Perlis
  'PNG', // Pulau Pinang
  'KUL', // Kuala Lumpur
  'TRG', // Terengganu
  'SEL'  // Selangor
];
```

**Characteristics**:
- **Population**: ~26 million (80% of Malaysia)
- **Delivery Network**: Extensive courier coverage
- **Standard Delivery**: 1-3 business days
- **Cost Factor**: Base rates (1.0x multiplier)

#### Zone 2: East Malaysia
**Coverage**: Borneo States and Federal Territory
```javascript
const EAST_MALAYSIA_STATES = [
  'SBH', // Sabah
  'SWK', // Sarawak  
  'LBN'  // Labuan
];
```

**Characteristics**:
- **Population**: ~6 million (20% of Malaysia)
- **Delivery Network**: Limited courier coverage
- **Standard Delivery**: 3-7 business days
- **Cost Factor**: Premium rates (1.5-2.0x multiplier)

### Zone Expansion Framework

#### Future Zone Possibilities
```javascript
// Extensible zone system for future expansion
const ZONE_TEMPLATES = {
  URBAN_PREMIUM: {
    name: 'Urban Premium',
    description: 'Major cities with same-day delivery',
    states: ['KUL', 'SEL'], // KL and Selangor urban areas
    multiplier: 0.8, // Discounted rates for high volume
    features: ['SAME_DAY', 'EXPRESS', 'PICKUP_POINTS']
  },
  
  RURAL_EXTENDED: {
    name: 'Rural Extended',
    description: 'Remote areas requiring special handling',
    postcodeRanges: ['17xxx', '18xxx'], // Specific postal codes
    multiplier: 1.3,
    features: ['EXTENDED_DELIVERY', 'SIGNATURE_REQUIRED']
  },
  
  INTERNATIONAL: {
    name: 'International Shipping',
    countries: ['SG', 'TH', 'ID'], // Future expansion
    multiplier: 3.0,
    features: ['CUSTOMS_HANDLING', 'DOCUMENTATION']
  }
};
```

## Weight-Based Rate Structure

### Standard Weight Bands

#### Industry Analysis
Based on analysis of Shopee, Lazada, and Zalora shipping tiers:

```javascript
const WEIGHT_BANDS = [
  {
    min: 0,
    max: 1,
    description: 'Small Items',
    examples: ['Books', 'Cosmetics', 'Accessories', 'Phone cases'],
    packagingOverhead: 0.1 // 100g for packaging
  },
  {
    min: 1,
    max: 2, 
    description: 'Medium Items',
    examples: ['Shoes', 'Small electronics', 'Clothing items'],
    packagingOverhead: 0.15 // 150g for packaging
  },
  {
    min: 2,
    max: 3,
    description: 'Large Items', 
    examples: ['Clothing bundles', 'Small appliances', 'Sports equipment'],
    packagingOverhead: 0.2 // 200g for packaging
  },
  {
    min: 3,
    max: 5,
    description: 'Bulk Items',
    examples: ['Multiple products', 'Large electronics', 'Home goods'],
    packagingOverhead: 0.3 // 300g for packaging
  },
  {
    min: 5,
    max: 999, // Effectively unlimited
    description: 'Heavy Items',
    examples: ['Appliances', 'Furniture', 'Bulk orders'],
    packagingOverhead: 0.5 // 500g for packaging
  }
];
```

### Rate Calculation Examples

#### Peninsular Malaysia (Zone 1) - Base Rates
```javascript
const PENINSULAR_RATES = [
  { weightMin: 0,   weightMax: 1,   price: 5.00,  margin: 25% },
  { weightMin: 1,   weightMax: 2,   price: 7.00,  margin: 28% },
  { weightMin: 2,   weightMax: 3,   price: 9.00,  margin: 30% },
  { weightMin: 3,   weightMax: 5,   price: 12.00, margin: 32% },
  { weightMin: 5,   weightMax: 999, price: 15.00, margin: 35% }
];
```

#### East Malaysia (Zone 2) - Premium Rates
```javascript
const EAST_MALAYSIA_RATES = [
  { weightMin: 0,   weightMax: 1,   price: 10.00, margin: 20% },
  { weightMin: 1,   weightMax: 2,   price: 13.00, margin: 23% },
  { weightMin: 2,   weightMax: 3,   price: 16.00, margin: 25% },
  { weightMin: 3,   weightMax: 5,   price: 20.00, margin: 27% },
  { weightMin: 5,   weightMax: 999, price: 25.00, margin: 30% }
];
```

#### Competitive Analysis
| Competitor | 0-1kg | 1-2kg | 2-3kg | 3-5kg | 5kg+ |
|------------|-------|-------|-------|-------|------|
| **Shopee** | RM 4.90 | RM 6.90 | RM 8.90 | RM 11.90 | RM 14.90 |
| **Lazada** | RM 5.50 | RM 7.50 | RM 9.50 | RM 12.50 | RM 15.50 |
| **Zalora** | RM 6.00 | RM 8.00 | RM 10.00 | RM 13.00 | RM 16.00 |
| **EcomJRM** | RM 5.00 | RM 7.00 | RM 9.00 | RM 12.00 | RM 15.00 |

## Database Schema Design

### Core Tables

#### shipping_zones
```sql
CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- 'Peninsular Malaysia'
  code VARCHAR(20) UNIQUE NOT NULL, -- 'PENINSULAR'
  description TEXT,
  states TEXT[] NOT NULL, -- PostgreSQL array: ['JOH','KDH',...]
  postcode_ranges TEXT[], -- Optional specific postcodes: ['50xxx','51xxx']
  multiplier DECIMAL(4,2) DEFAULT 1.0, -- Rate multiplier: 1.0, 1.5, 2.0
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_shipping_zones_active ON shipping_zones(is_active, sort_order);
CREATE INDEX idx_shipping_zones_states ON shipping_zones USING GIN(states);
```

#### shipping_rules
```sql
CREATE TABLE shipping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  rule_set_id UUID REFERENCES shipping_rule_sets(id), -- Optional grouping
  weight_min DECIMAL(6,3) NOT NULL, -- 0.000 kg
  weight_max DECIMAL(6,3) NOT NULL, -- 999.999 kg
  price DECIMAL(8,2) NOT NULL, -- RM 0.00
  currency CHAR(3) DEFAULT 'MYR',
  description VARCHAR(200), -- 'Standard delivery'
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_to TIMESTAMP, -- Optional expiry date
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT weight_min_positive CHECK (weight_min >= 0),
  CONSTRAINT weight_max_greater CHECK (weight_max > weight_min),
  CONSTRAINT price_positive CHECK (price >= 0),
  CONSTRAINT unique_zone_weight_range UNIQUE (zone_id, weight_min, weight_max, rule_set_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_shipping_rules_zone_weight ON shipping_rules(zone_id, weight_min, weight_max);
CREATE INDEX idx_shipping_rules_active ON shipping_rules(is_active, effective_from, effective_to);
```

#### shipping_rule_sets
```sql
CREATE TABLE shipping_rule_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- 'Standard Rates', 'Promotional Rates'
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_to TIMESTAMP, -- Optional expiry
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Only one default rule set at a time
  CONSTRAINT single_default_rule_set EXCLUDE (is_default WITH =) WHERE (is_default = true)
);
```

### Audit and Analytics Tables

#### shipping_rule_history
```sql
CREATE TABLE shipping_rule_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL,
  zone_id UUID NOT NULL,
  weight_min DECIMAL(6,3) NOT NULL,
  weight_max DECIMAL(6,3) NOT NULL,
  old_price DECIMAL(8,2),
  new_price DECIMAL(8,2) NOT NULL,
  change_reason TEXT,
  operation VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Index for audit queries
CREATE INDEX idx_shipping_rule_history_rule ON shipping_rule_history(rule_id, created_at);
```

#### shipping_calculations
```sql
CREATE TABLE shipping_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID, -- Optional: link to actual order
  zone_id UUID NOT NULL REFERENCES shipping_zones(id),
  rule_id UUID NOT NULL REFERENCES shipping_rules(id),
  customer_state CHAR(3) NOT NULL,
  total_weight DECIMAL(6,3) NOT NULL,
  base_price DECIMAL(8,2) NOT NULL,
  final_price DECIMAL(8,2) NOT NULL, -- After discounts/free shipping
  free_shipping_applied BOOLEAN DEFAULT false,
  calculation_data JSONB, -- Store full calculation details
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics indexes
CREATE INDEX idx_shipping_calculations_zone_date ON shipping_calculations(zone_id, created_at);
CREATE INDEX idx_shipping_calculations_price_analysis ON shipping_calculations(base_price, final_price, created_at);
```

## Rate Calculation Logic

### Core Algorithm

```typescript
interface ShippingCalculationInput {
  items: Array<{
    weight: number;
    quantity: number;
    value: number;
  }>;
  deliveryState: string;
  orderValue: number;
  ruleSetId?: string; // Optional: use specific rule set
}

interface ShippingCalculationResult {
  zoneId: string;
  zoneName: string;
  ruleId: string;
  totalWeight: number;
  basePrice: number;
  finalPrice: number;
  freeShippingApplied: boolean;
  estimatedDeliveryDays: number;
  breakdown: {
    weightBand: string;
    zoneMultiplier: number;
    discountsApplied: number;
  };
}

class ZoneBasedShippingCalculator {
  async calculateShipping(input: ShippingCalculationInput): Promise<ShippingCalculationResult> {
    // 1. Calculate total weight including packaging
    const totalWeight = this.calculateTotalWeight(input.items);
    
    // 2. Find appropriate zone
    const zone = await this.findZoneByState(input.deliveryState);
    
    // 3. Find matching shipping rule
    const rule = await this.findShippingRule(zone.id, totalWeight, input.ruleSetId);
    
    // 4. Calculate base price
    const basePrice = rule.price * zone.multiplier;
    
    // 5. Apply business rules (free shipping, promotions)
    const finalPrice = await this.applyBusinessRules(basePrice, input.orderValue, zone);
    
    // 6. Log calculation for analytics
    await this.logCalculation(input, zone, rule, totalWeight, basePrice, finalPrice);
    
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      ruleId: rule.id,
      totalWeight,
      basePrice,
      finalPrice,
      freeShippingApplied: finalPrice < basePrice,
      estimatedDeliveryDays: this.getEstimatedDelivery(zone),
      breakdown: {
        weightBand: `${rule.weight_min}-${rule.weight_max}kg`,
        zoneMultiplier: zone.multiplier,
        discountsApplied: basePrice - finalPrice
      }
    };
  }

  private calculateTotalWeight(items: Array<{weight: number; quantity: number}>): number {
    const itemWeight = items.reduce((total, item) => {
      return total + (item.weight * item.quantity);
    }, 0);
    
    // Add packaging overhead based on total weight
    const packagingWeight = this.calculatePackagingWeight(itemWeight);
    
    return itemWeight + packagingWeight;
  }

  private calculatePackagingWeight(itemWeight: number): number {
    if (itemWeight <= 1) return 0.1;      // 100g for small items
    if (itemWeight <= 2) return 0.15;     // 150g for medium items  
    if (itemWeight <= 3) return 0.2;      // 200g for large items
    if (itemWeight <= 5) return 0.3;      // 300g for bulk items
    return 0.5;                           // 500g for heavy items
  }

  private async findZoneByState(stateCode: string): Promise<ShippingZone> {
    const zone = await prisma.shippingZones.findFirst({
      where: {
        states: {
          has: stateCode // PostgreSQL array contains operator
        },
        is_active: true
      },
      orderBy: {
        sort_order: 'asc' // Prioritize zones by sort order
      }
    });

    if (!zone) {
      throw new Error(`No shipping zone found for state: ${stateCode}`);
    }

    return zone;
  }

  private async findShippingRule(
    zoneId: string, 
    weight: number, 
    ruleSetId?: string
  ): Promise<ShippingRule> {
    const rule = await prisma.shippingRules.findFirst({
      where: {
        zone_id: zoneId,
        weight_min: { lte: weight },
        weight_max: { gte: weight },
        rule_set_id: ruleSetId || { in: this.getActiveRuleSetIds() },
        is_active: true,
        effective_from: { lte: new Date() },
        OR: [
          { effective_to: null },
          { effective_to: { gte: new Date() } }
        ]
      },
      orderBy: {
        effective_from: 'desc' // Most recent rule takes precedence
      }
    });

    if (!rule) {
      throw new Error(`No shipping rule found for zone ${zoneId} and weight ${weight}kg`);
    }

    return rule;
  }

  private async applyBusinessRules(
    basePrice: number, 
    orderValue: number, 
    zone: ShippingZone
  ): Promise<number> {
    // Get business configuration
    const businessConfig = await this.getBusinessConfiguration();
    
    // Apply free shipping threshold
    if (orderValue >= businessConfig.freeShippingThreshold) {
      return 0;
    }
    
    // Apply zone-specific promotions
    const promotion = await this.getActivePromotion(zone.id);
    if (promotion) {
      return Math.max(0, basePrice * (1 - promotion.discountPercentage));
    }
    
    return basePrice;
  }
}
```

### Error Handling and Fallbacks

```typescript
class ShippingCalculatorWithFallbacks extends ZoneBasedShippingCalculator {
  async calculateShippingWithFallbacks(input: ShippingCalculationInput): Promise<ShippingCalculationResult> {
    try {
      return await this.calculateShipping(input);
    } catch (error) {
      console.error('Primary shipping calculation failed:', error);
      
      // Fallback 1: Use default zone (Peninsular Malaysia)
      try {
        return await this.calculateWithDefaultZone(input);
      } catch (fallbackError) {
        console.error('Fallback calculation failed:', fallbackError);
        
        // Fallback 2: Return emergency rates
        return this.getEmergencyShippingRate(input);
      }
    }
  }

  private async calculateWithDefaultZone(input: ShippingCalculationInput): Promise<ShippingCalculationResult> {
    const defaultZone = await this.getDefaultZone();
    const totalWeight = this.calculateTotalWeight(input.items);
    const emergencyRule = await this.getEmergencyRule(defaultZone.id, totalWeight);
    
    return {
      zoneId: defaultZone.id,
      zoneName: `${defaultZone.name} (Fallback)`,
      ruleId: emergencyRule.id,
      totalWeight,
      basePrice: emergencyRule.price,
      finalPrice: emergencyRule.price,
      freeShippingApplied: false,
      estimatedDeliveryDays: 5, // Conservative estimate
      breakdown: {
        weightBand: 'Fallback rate',
        zoneMultiplier: 1.0,
        discountsApplied: 0
      }
    };
  }

  private getEmergencyShippingRate(input: ShippingCalculationInput): ShippingCalculationResult {
    const totalWeight = this.calculateTotalWeight(input.items);
    const emergencyPrice = totalWeight <= 1 ? 8.00 : 
                          totalWeight <= 3 ? 12.00 : 
                          20.00; // Emergency flat rates

    return {
      zoneId: 'EMERGENCY',
      zoneName: 'Emergency Rate',
      ruleId: 'EMERGENCY',
      totalWeight,
      basePrice: emergencyPrice,
      finalPrice: emergencyPrice,
      freeShippingApplied: false,
      estimatedDeliveryDays: 7, // Conservative estimate
      breakdown: {
        weightBand: 'Emergency calculation',
        zoneMultiplier: 1.0,
        discountsApplied: 0
      }
    };
  }
}
```

## Performance Optimization

### Caching Strategy

```typescript
import { Redis } from 'ioredis';

class CachedShippingCalculator extends ZoneBasedShippingCalculator {
  private redis = new Redis(process.env.REDIS_URL);
  private readonly CACHE_TTL = 3600; // 1 hour

  async calculateShipping(input: ShippingCalculationInput): Promise<ShippingCalculationResult> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(input);
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Calculate and cache result
    const result = await super.calculateShipping(input);
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
    
    return result;
  }

  private generateCacheKey(input: ShippingCalculationInput): string {
    const keyData = {
      state: input.deliveryState,
      weight: Math.ceil(this.calculateTotalWeight(input.items) * 10) / 10, // Round to 0.1kg
      orderValue: Math.floor(input.orderValue / 10) * 10, // Round to nearest RM10
      ruleSet: input.ruleSetId || 'default'
    };
    
    return `shipping:${JSON.stringify(keyData)}`;
  }

  // Invalidate cache when rules change
  async invalidateCache(zoneId?: string): Promise<void> {
    const pattern = zoneId ? `shipping:*${zoneId}*` : 'shipping:*';
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### Database Optimization

```sql
-- Materialized view for fast zone lookups
CREATE MATERIALIZED VIEW shipping_zone_state_lookup AS
SELECT 
  sz.id as zone_id,
  sz.name as zone_name,
  sz.multiplier,
  unnest(sz.states) as state_code
FROM shipping_zones sz
WHERE sz.is_active = true;

-- Index for instant state-to-zone resolution
CREATE UNIQUE INDEX idx_zone_state_lookup ON shipping_zone_state_lookup(state_code);

-- Refresh materialized view when zones change
CREATE OR REPLACE FUNCTION refresh_zone_lookup()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW shipping_zone_state_lookup;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_zone_lookup
  AFTER INSERT OR UPDATE OR DELETE ON shipping_zones
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_zone_lookup();
```

## Admin Interface Integration Points

### Rule Management API Endpoints

```typescript
// GET /api/admin/shipping/zones
interface GetZonesResponse {
  zones: Array<{
    id: string;
    name: string;
    states: string[];
    multiplier: number;
    ruleCount: number;
    isActive: boolean;
  }>;
}

// POST /api/admin/shipping/zones/:zoneId/rules
interface CreateRuleRequest {
  weightMin: number;
  weightMax: number;
  price: number;
  description?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

// PUT /api/admin/shipping/rules/bulk
interface BulkUpdateRulesRequest {
  operation: 'PERCENTAGE_INCREASE' | 'FLAT_INCREASE' | 'SET_PRICE';
  value: number;
  filters: {
    zoneIds?: string[];
    weightRanges?: Array<{min: number; max: number}>;
  };
}

// GET /api/admin/shipping/analytics
interface ShippingAnalyticsResponse {
  totalCalculations: number;
  averageShippingValue: number;
  freeShippingRate: number;
  topPerformingZones: Array<{
    zoneId: string;
    zoneName: string;
    orderCount: number;
    revenue: number;
  }>;
  weightDistribution: Array<{
    weightBand: string;
    orderCount: number;
    percentage: number;
  }>;
}
```

This zone-based shipping design provides a robust, flexible foundation that can scale with business growth while maintaining operational efficiency and customer satisfaction.