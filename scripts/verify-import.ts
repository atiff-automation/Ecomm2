#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyImport() {
  console.log('🔍 Verifying Malaysian Postcode Import...');
  console.log('=====================================');

  try {
    // Count states
    const stateCount = await prisma.malaysianState.count();
    console.log(`📍 States: ${stateCount}`);

    // Count postcodes
    const postcodeCount = await prisma.malaysianPostcode.count();
    console.log(`📮 Postcodes: ${postcodeCount}`);

    // Sample states
    const states = await prisma.malaysianState.findMany({
      take: 5,
      orderBy: { id: 'asc' }
    });
    console.log('\n📋 Sample States:');
    states.forEach(state => {
      console.log(`  ${state.id}: ${state.name}`);
    });

    // Sample postcodes
    const postcodes = await prisma.malaysianPostcode.findMany({
      take: 5,
      include: { state: true },
      orderBy: { postcode: 'asc' }
    });
    console.log('\n📋 Sample Postcodes:');
    postcodes.forEach(pc => {
      console.log(`  ${pc.postcode}: ${pc.district}, ${pc.state.name}`);
    });

    // Validation checks
    console.log('\n✅ Validation Results:');
    console.log(`States imported: ${stateCount === 16 ? '✅' : '❌'} (${stateCount}/16 expected)`);
    console.log(`Postcodes imported: ${postcodeCount > 2700 ? '✅' : '❌'} (${postcodeCount}/2782+ expected)`);

    console.log('\n🎉 Import verification complete!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyImport();