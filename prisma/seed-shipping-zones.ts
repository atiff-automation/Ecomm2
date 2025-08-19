/**
 * Seed Script: Zone-Based Shipping System
 * 
 * This script seeds the database with:
 * 1. Malaysian shipping zones (Peninsular & East Malaysia)
 * 2. Default rule set for standard rates
 * 3. Weight-based shipping rules for each zone
 * 4. Fulfillment system configuration
 * 
 * Reference: DATABASE_SCHEMA.md - Data Migration Strategy
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Zone-Based Shipping System Seed...');

  try {
    // 1. Create default zones based on Malaysian geography
    console.log('📍 Creating Malaysian shipping zones...');
    
    const peninsularZone = await prisma.shippingZone.upsert({
      where: { code: 'PENINSULAR' },
      update: {},
      create: {
        name: 'Peninsular Malaysia',
        code: 'PENINSULAR',
        description: 'West Malaysia including Kuala Lumpur and surrounding states',
        states: ['JOH', 'KDH', 'KTN', 'MLK', 'NSN', 'PHG', 'PRK', 'PLS', 'PNG', 'KUL', 'TRG', 'SEL'],
        postcodeRanges: ['01xxx', '02xxx', '05xxx', '06xxx', '07xxx', '08xxx', '09xxx', '10xxx', '11xxx', '12xxx', '13xxx', '14xxx', '15xxx', '16xxx', '17xxx', '18xxx', '19xxx', '20xxx', '21xxx', '22xxx', '23xxx', '24xxx', '25xxx', '26xxx', '27xxx', '28xxx', '30xxx', '31xxx', '32xxx', '33xxx', '34xxx', '35xxx', '36xxx', '40xxx', '41xxx', '42xxx', '43xxx', '44xxx', '45xxx', '46xxx', '47xxx', '48xxx', '50xxx', '51xxx', '52xxx', '53xxx', '54xxx', '55xxx', '56xxx', '57xxx', '58xxx', '59xxx', '60xxx', '61xxx', '62xxx', '63xxx', '64xxx', '65xxx', '66xxx', '67xxx', '68xxx', '69xxx', '70xxx', '71xxx', '72xxx', '73xxx', '74xxx', '75xxx', '76xxx', '77xxx', '78xxx', '79xxx', '80xxx', '81xxx', '82xxx', '83xxx', '84xxx', '85xxx', '86xxx'],
        multiplier: 1.0, // Base rate - no multiplier
        deliveryTimeMin: 1,
        deliveryTimeMax: 3,
        isActive: true,
        sortOrder: 1,
        features: {
          same_day: true,
          cod: true,
          insurance: true,
          signature_required: true,
          pickup_available: true
        }
      }
    });

    const eastMalaysiaZone = await prisma.shippingZone.upsert({
      where: { code: 'EAST_MALAYSIA' },
      update: {},
      create: {
        name: 'East Malaysia',
        code: 'EAST_MALAYSIA',
        description: 'Sabah, Sarawak, and Labuan with longer delivery times',
        states: ['SBH', 'SWK', 'LBN'],
        postcodeRanges: ['87xxx', '88xxx', '89xxx', '90xxx', '91xxx', '92xxx', '93xxx', '94xxx', '95xxx', '96xxx', '97xxx', '98xxx'],
        multiplier: 1.875, // 15/8 = 1.875 multiplier (current system: RM15 vs RM8)
        deliveryTimeMin: 3,
        deliveryTimeMax: 7,
        isActive: true,
        sortOrder: 2,
        features: {
          same_day: false,
          cod: true,
          insurance: true,
          signature_required: true,
          pickup_available: false
        }
      }
    });

    console.log(`✅ Created zones: ${peninsularZone.name} (${peninsularZone.code}) and ${eastMalaysiaZone.name} (${eastMalaysiaZone.code})`);

    // 2. Create default rule set
    console.log('📋 Creating default shipping rule set...');
    
    const defaultRuleSet = await prisma.shippingRuleSet.upsert({
      where: { id: 'standard-rates-ruleset' },
      update: {},
      create: {
        id: 'standard-rates-ruleset',
        name: 'Standard Rates',
        description: 'Default shipping rates for standard delivery service',
        ruleType: 'STANDARD',
        isDefault: true,
        isActive: true,
        priority: 0,
        validFrom: new Date(),
        validTo: null, // No expiry
        conditions: {
          applies_to: 'all_orders',
          minimum_order_value: 0,
          maximum_order_value: null,
          customer_types: ['GUEST', 'MEMBER', 'VIP'],
          service_types: ['STANDARD']
        }
      }
    });

    console.log(`✅ Created rule set: ${defaultRuleSet.name} (ID: ${defaultRuleSet.id})`);

    // 3. Create weight-based shipping rules for each zone
    console.log('⚖️ Creating weight-based shipping rules...');

    const weightBands = [
      { min: 0, max: 1, peninsularPrice: 5.00, eastPrice: 8.00, description: 'Light items (0-1kg)' },
      { min: 1, max: 2, peninsularPrice: 7.00, eastPrice: 10.67, description: 'Small packages (1-2kg)' },
      { min: 2, max: 3, peninsularPrice: 9.00, eastPrice: 13.33, description: 'Medium packages (2-3kg)' },
      { min: 3, max: 5, peninsularPrice: 12.00, eastPrice: 16.00, description: 'Large packages (3-5kg)' },
      { min: 5, max: 999, peninsularPrice: 15.00, eastPrice: 20.00, description: 'Heavy packages (5kg+)' }
    ];

    const zones = [
      { zone: peninsularZone, priceKey: 'peninsularPrice' as const },
      { zone: eastMalaysiaZone, priceKey: 'eastPrice' as const }
    ];

    let totalRulesCreated = 0;

    for (const { zone, priceKey } of zones) {
      for (const band of weightBands) {
        const rule = await prisma.shippingRule.upsert({
          where: {
            zoneId_ruleSetId_weightMin_weightMax_serviceType: {
              zoneId: zone.id,
              ruleSetId: defaultRuleSet.id,
              weightMin: band.min,
              weightMax: band.max,
              serviceType: 'STANDARD'
            }
          },
          update: {},
          create: {
            zoneId: zone.id,
            ruleSetId: defaultRuleSet.id,
            weightMin: band.min,
            weightMax: band.max,
            price: band[priceKey],
            currency: 'MYR',
            serviceType: 'STANDARD',
            description: `${band.description} for ${zone.name}`,
            isActive: true,
            effectiveFrom: new Date(),
            effectiveTo: null,
            metadata: {
              zone_multiplier_applied: false, // Base prices, multiplier applied at calculation time
              original_flat_rate: band[priceKey],
              weight_band: `${band.min}-${band.max}kg`,
              migration_source: 'current_flat_rate_system'
            }
          }
        });

        console.log(`  ✅ ${zone.code}: ${band.min}-${band.max}kg = RM ${band[priceKey].toFixed(2)}`);
        totalRulesCreated++;
      }
    }

    console.log(`✅ Created ${totalRulesCreated} shipping rules across ${zones.length} zones`);

    // 4. Create fulfillment system settings
    console.log('⚙️ Creating fulfillment system configuration...');

    const fulfillmentSettings = [
      {
        settingName: 'api_health_thresholds',
        settingValue: {
          response_time_warning: 5000,
          response_time_critical: 10000,
          success_rate_warning: 90,
          success_rate_critical: 80,
          consecutive_failures_limit: 5,
          health_check_interval_seconds: 300
        },
        settingType: 'API_CONFIG' as const,
        description: 'EasyParcel API health monitoring thresholds and parameters'
      },
      {
        settingName: 'csv_batch_settings',
        settingValue: {
          max_orders_per_batch: 100,
          batch_timeout_minutes: 30,
          auto_notification: true,
          priority_processing: ['EXPRESS', 'VIP'],
          max_batch_size_mb: 10,
          batch_processing_hours: ['09:00-11:00', '14:00-16:00'],
          emergency_processing: true
        },
        settingType: 'CSV_CONFIG' as const,
        description: 'CSV batch processing configuration and limits'
      },
      {
        settingName: 'cost_management',
        settingValue: {
          monthly_api_budget: 1000,
          cost_per_api_call: 0.50,
          budget_warning_percentage: 80,
          budget_critical_percentage: 95,
          auto_switch_to_csv_on_budget_exceeded: true,
          cost_tracking_enabled: true
        },
        settingType: 'COST_LIMITS' as const,
        description: 'API cost management and budget control settings'
      },
      {
        settingName: 'decision_rules',
        settingValue: {
          default_mode: 'auto',
          api_priority_order_types: ['EXPRESS', 'HIGH_VALUE', 'VIP'],
          csv_bulk_threshold: 50,
          peak_hour_csv_mode: true,
          peak_hours: ['09:00-11:00', '14:00-16:00'],
          emergency_csv_only: false,
          admin_override_enabled: true
        },
        settingType: 'DECISION_RULES' as const,
        description: 'Smart decision engine rules for API vs CSV routing'
      },
      {
        settingName: 'alert_settings',
        settingValue: {
          email_notifications: true,
          sms_notifications: false,
          slack_webhook_enabled: false,
          alert_recipients: ['admin@ecomjrm.com'],
          alert_levels: ['WARNING', 'CRITICAL'],
          notification_frequency_minutes: 15,
          escalation_enabled: true
        },
        settingType: 'ALERT_SETTINGS' as const,
        description: 'Notification and alerting configuration for system monitoring'
      }
    ];

    for (const setting of fulfillmentSettings) {
      await prisma.fulfillmentSetting.upsert({
        where: { settingName: setting.settingName },
        update: {
          settingValue: setting.settingValue,
          description: setting.description,
          updatedAt: new Date()
        },
        create: {
          settingName: setting.settingName,
          settingValue: setting.settingValue,
          settingType: setting.settingType,
          description: setting.description,
          isActive: true,
          effectiveFrom: new Date(),
          effectiveTo: null
        }
      });

      console.log(`  ✅ ${setting.settingName} (${setting.settingType})`);
    }

    console.log(`✅ Created ${fulfillmentSettings.length} fulfillment system settings`);

    // 5. Create free shipping threshold configuration
    console.log('🎁 Setting up free shipping threshold...');
    
    // This should be integrated with existing SystemConfig if present
    await prisma.systemConfig.upsert({
      where: { key: 'free_shipping_threshold' },
      update: {},
      create: {
        key: 'free_shipping_threshold',
        value: '150',
        type: 'number'
      }
    });

    await prisma.systemConfig.upsert({
      where: { key: 'shipping_calculation_method' },
      update: {},
      create: {
        key: 'shipping_calculation_method',
        value: 'zone_based',
        type: 'string'
      }
    });

    console.log('✅ Free shipping threshold and calculation method configured');

    // 6. Summary and validation
    console.log('\n📊 Seed Summary:');
    
    const zoneCount = await prisma.shippingZone.count();
    const ruleSetCount = await prisma.shippingRuleSet.count();
    const ruleCount = await prisma.shippingRule.count();
    const settingCount = await prisma.fulfillmentSetting.count();

    console.log(`  📍 Shipping Zones: ${zoneCount}`);
    console.log(`  📋 Rule Sets: ${ruleSetCount}`);
    console.log(`  ⚖️ Shipping Rules: ${ruleCount}`);
    console.log(`  ⚙️ Fulfillment Settings: ${settingCount}`);

    // Test calculation for validation
    console.log('\n🧪 Testing shipping calculation...');
    
    const testRulePeninsular = await prisma.shippingRule.findFirst({
      where: {
        zone: { code: 'PENINSULAR' },
        weightMin: { lte: 1.5 },
        weightMax: { gte: 1.5 },
        isActive: true
      },
      include: { zone: true, ruleSet: true }
    });

    const testRuleEast = await prisma.shippingRule.findFirst({
      where: {
        zone: { code: 'EAST_MALAYSIA' },
        weightMin: { lte: 1.5 },
        weightMax: { gte: 1.5 },
        isActive: true
      },
      include: { zone: true, ruleSet: true }
    });

    if (testRulePeninsular && testRuleEast) {
      const peninsularFinalPrice = testRulePeninsular.price.toNumber() * testRulePeninsular.zone.multiplier.toNumber();
      const eastFinalPrice = testRuleEast.price.toNumber() * testRuleEast.zone.multiplier.toNumber();
      
      console.log(`  Peninsular (1.5kg): RM ${testRulePeninsular.price} × ${testRulePeninsular.zone.multiplier} = RM ${peninsularFinalPrice.toFixed(2)}`);
      console.log(`  East Malaysia (1.5kg): RM ${testRuleEast.price} × ${testRuleEast.zone.multiplier} = RM ${eastFinalPrice.toFixed(2)}`);
      
      // Validate that East Malaysia is more expensive (as expected)
      if (eastFinalPrice > peninsularFinalPrice) {
        console.log('  ✅ Validation passed: East Malaysia pricing is higher than Peninsular');
      } else {
        console.log('  ⚠️ Validation warning: East Malaysia pricing may be incorrect');
      }
    }

    console.log('\n🎉 Zone-Based Shipping System seed completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('  1. Update shipping calculation API to use new zone-based system');
    console.log('  2. Implement smart fulfillment decision engine');
    console.log('  3. Create admin interface for zone and rule management');
    console.log('  4. Set up API health monitoring and alerting');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });