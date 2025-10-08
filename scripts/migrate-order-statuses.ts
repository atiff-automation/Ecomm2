/**
 * Pre-migration script: Temporarily update order statuses to safe values
 *
 * This script updates orders to temporary safe values (PENDING)
 * before the enum is changed, then we'll manually update them after.
 *
 * Strategy:
 * 1. Move CONFIRMED/PROCESSING/SHIPPED to PENDING temporarily
 * 2. Apply schema changes with new enum values
 * 3. Manually update PENDING orders back to correct statuses
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateOrderStatuses() {
  console.log('🔄 Starting order status pre-migration...\n');

  try {
    // Check current status distribution
    const currentStatuses = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    console.log('📊 Current order status distribution:');
    currentStatuses.forEach((item) => {
      console.log(`   ${item.status}: ${item._count} orders`);
    });
    console.log();

    // Migrate CONFIRMED → PENDING (temporarily)
    const confirmedOrders = await prisma.order.findMany({
      where: { status: 'CONFIRMED' as any },
      select: { id: true, orderNumber: true },
    });

    if (confirmedOrders.length > 0) {
      console.log(`📝 Moving ${confirmedOrders.length} CONFIRMED orders to PENDING (temporary)...`);

      for (const order of confirmedOrders) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'PENDING' as any,
            adminNotes: `[PRE-MIGRATION] Was CONFIRMED before schema change`
          },
        });
      }

      console.log('   ✅ CONFIRMED → PENDING migration complete');
    }

    // Migrate PROCESSING → PENDING (temporarily)
    const processingOrders = await prisma.order.findMany({
      where: { status: 'PROCESSING' as any },
      select: { id: true, orderNumber: true },
    });

    if (processingOrders.length > 0) {
      console.log(`📝 Moving ${processingOrders.length} PROCESSING orders to PENDING (temporary)...`);

      for (const order of processingOrders) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'PENDING' as any,
            adminNotes: `[PRE-MIGRATION] Was PROCESSING before schema change`
          },
        });
      }

      console.log('   ✅ PROCESSING → PENDING migration complete');
    }

    // Migrate SHIPPED → DELIVERED (already exists in both enums)
    const shippedOrders = await prisma.order.findMany({
      where: { status: 'SHIPPED' as any },
      select: { id: true, orderNumber: true },
    });

    if (shippedOrders.length > 0) {
      console.log(`📝 Moving ${shippedOrders.length} SHIPPED orders to DELIVERED...`);

      for (const order of shippedOrders) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'DELIVERED' as any,
            adminNotes: `[PRE-MIGRATION] Was SHIPPED before schema change`
          },
        });
      }

      console.log('   ✅ SHIPPED → DELIVERED migration complete');
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const newStatuses = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    console.log('📊 New order status distribution:');
    newStatuses.forEach((item) => {
      console.log(`   ${item.status}: ${item._count} orders`);
    });

    console.log('\n✅ Order status migration completed successfully!');
    console.log('🎯 You can now safely run: npx prisma db push --accept-data-loss');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateOrderStatuses()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
