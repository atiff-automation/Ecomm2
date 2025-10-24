/**
 * Data Migration Script: Fix Product Dimensions (All Formats)
 *
 * This script fixes products with dimensions in any of these formats:
 * 1. Corrupted JSON strings: '{"length":20,"width":15,"height":10}' (from frontend bug)
 * 2. Legacy string format: "10x15x8" (from bulk import)
 * 3. Already correct: {length: 20, width: 15, height: 10} (current standard)
 *
 * Uses centralized dimension helpers from /src/lib/validation/product-dimensions.ts
 * following CLAUDE.md principles (Single Source of Truth, DRY, Type Safety).
 *
 * Background:
 * - Frontend bug caused JSON.stringify() → corrupted string storage
 * - Bulk import used different "LxWxH" format → inconsistency
 * - This script standardizes ALL products to use proper object format
 *
 * Usage: npx tsx scripts/fix-dimensions-data.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { normalizeDimensions, ProductDimensions } from '../src/lib/validation/product-dimensions';

const prisma = new PrismaClient();

async function fixCorruptedDimensions() {
  console.log('🔍 Starting dimension data migration...\n');

  try {
    // Fetch all products with dimension data
    const products = await prisma.product.findMany({
      where: {
        dimensions: {
          not: Prisma.DbNull,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        dimensions: true,
      },
    });

    console.log(`📦 Found ${products.length} products with dimension data\n`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    let skippedCount = 0;
    let errors: Array<{ sku: string; error: string; originalData?: any }> = [];

    for (const product of products) {
      try {
        const dimensions = product.dimensions as any;

        // Log original format for transparency
        console.log(`\n📦 Processing: ${product.name} (SKU: ${product.sku})`);
        console.log(`   Original data (type: ${typeof dimensions}): ${JSON.stringify(dimensions)}`);

        // Check if already in correct format (object with proper structure)
        if (
          dimensions &&
          typeof dimensions === 'object' &&
          !Array.isArray(dimensions) &&
          ('length' in dimensions || 'width' in dimensions || 'height' in dimensions)
        ) {
          // Verify it's not a corrupted string that looks like an object
          const testValue = dimensions.length;
          if (typeof testValue === 'number' || testValue === null) {
            console.log(`   ✓ Already correct format (object)`);
            console.log(`   Dimensions: ${JSON.stringify(dimensions)}`);
            alreadyCorrectCount++;
            continue;
          }
        }

        // Use centralized normalizer to handle all formats
        const normalized: ProductDimensions | null = normalizeDimensions(dimensions);

        if (normalized) {
          // Update the product with normalized dimensions
          await prisma.product.update({
            where: { id: product.id },
            data: {
              dimensions: normalized as Prisma.InputJsonValue,
            },
          });

          console.log(`   ✅ FIXED → ${JSON.stringify(normalized)}`);
          fixedCount++;
        } else {
          // Could not parse - dimensions may be null or invalid
          console.log(`   ⏭️  Skipped (null or invalid data)`);
          skippedCount++;
        }
      } catch (productError) {
        console.error(`   ❌ Error processing ${product.sku}:`, productError);
        errors.push({
          sku: product.sku,
          error: `Processing error: ${productError}`,
          originalData: product.dimensions
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total products processed:            ${products.length}`);
    console.log(`✅ Fixed (any format → standardized): ${fixedCount}`);
    console.log(`✓  Already correct (no change needed): ${alreadyCorrectCount}`);
    console.log(`⏭️  Skipped (null/invalid data):       ${skippedCount}`);
    console.log(`❌ Errors:                             ${errors.length}`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      errors.forEach(({ sku, error, originalData }) => {
        console.log(`   SKU ${sku}: ${error}`);
        if (originalData) {
          console.log(`   Original data: ${JSON.stringify(originalData)}`);
        }
      });
    }

    console.log('\n✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixCorruptedDimensions()
  .then(() => {
    console.log('✅ Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
