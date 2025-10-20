/**
 * Seed Malaysian Tax Rates
 * Sets up default tax configuration for Malaysian compliance
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTaxRates() {
  console.log('🌱 Seeding Malaysian tax rates...');

  try {
    // Create Malaysian tax rates
    await prisma.taxRate.upsert({
      where: { name: 'SST' },
      update: {},
      create: {
        name: 'SST',
        rate: 0.06, // 6% SST
        isActive: true,
        description: 'Sales and Service Tax - Currently active in Malaysia',
      },
    });

    await prisma.taxRate.upsert({
      where: { name: 'GST' },
      update: {},
      create: {
        name: 'GST',
        rate: 0.06, // 6% GST (suspended but keeping for reference)
        isActive: false,
        description:
          'Goods and Services Tax - Suspended since 2018, replaced by SST',
      },
    });

    await prisma.taxRate.upsert({
      where: { name: 'Service Tax' },
      update: {},
      create: {
        name: 'Service Tax',
        rate: 0.06, // 6% Service Tax
        isActive: true,
        description: 'Malaysian Service Tax for applicable services',
      },
    });

    // Create tax exempt rate
    await prisma.taxRate.upsert({
      where: { name: 'Tax Exempt' },
      update: {},
      create: {
        name: 'Tax Exempt',
        rate: 0.0,
        isActive: true,
        description:
          'Tax exempt items (essential goods, medical supplies, etc.)',
      },
    });

    // Create zero-rated tax
    await prisma.taxRate.upsert({
      where: { name: 'Zero Rated' },
      update: {},
      create: {
        name: 'Zero Rated',
        rate: 0.0,
        isActive: true,
        description: 'Zero-rated items (exports, basic food items, etc.)',
      },
    });

    console.log('✅ Malaysian tax rates seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding tax rates:', error);
    throw error;
  }
}

async function main() {
  await seedTaxRates();
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
