/**
 * Verification Script: Test Rounded Property Fix
 *
 * PURPOSE:
 * Verify that all click pages can be loaded and validated without errors
 * after the rounded property migration.
 *
 * USAGE:
 *   npx tsx scripts/verify-rounded-fix.ts
 */

import { PrismaClient } from '@prisma/client';
import { blockSchema } from '@/lib/validation/click-page-schemas';

const prisma = new PrismaClient();

interface VerificationResult {
  success: boolean;
  clickPageId: string;
  clickPageTitle: string;
  totalBlocks: number;
  validatedBlocks: number;
  errors: string[];
}

async function verifyRoundedFix(): Promise<void> {
  console.log('\n🔍 Click Page Rounded Property Verification');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Fetch all click pages
    const clickPages = await prisma.clickPage.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        blocks: true,
      },
    });

    console.log(`Found ${clickPages.length} click pages to verify\n`);

    const results: VerificationResult[] = [];
    let totalErrors = 0;

    // Verify each click page
    for (const clickPage of clickPages) {
      const result: VerificationResult = {
        success: true,
        clickPageId: clickPage.id,
        clickPageTitle: clickPage.title,
        totalBlocks: 0,
        validatedBlocks: 0,
        errors: [],
      };

      try {
        const blocks = clickPage.blocks as unknown as Array<unknown>;

        if (!Array.isArray(blocks)) {
          result.success = false;
          result.errors.push('Blocks is not an array');
          results.push(result);
          continue;
        }

        result.totalBlocks = blocks.length;

        console.log(`📄 ${clickPage.title} (${clickPage.slug})`);
        console.log(`   Blocks: ${blocks.length}`);

        // Validate each block
        for (const block of blocks) {
          try {
            const validated = blockSchema.parse(block);
            result.validatedBlocks++;

            // Check if IMAGE, VIDEO, or IMAGE_GALLERY blocks have explicit rounded property
            if (['IMAGE', 'VIDEO', 'IMAGE_GALLERY'].includes(validated.type)) {
              const settings = validated.settings as { rounded?: boolean };
              const roundedValue = settings.rounded;

              if (roundedValue !== false && roundedValue !== true) {
                result.errors.push(
                  `Block ${validated.id} (${validated.type}) has invalid rounded value: ${roundedValue}`
                );
                result.success = false;
              }
            }
          } catch (error) {
            result.success = false;
            const errorMsg = error instanceof Error ? error.message : String(error);
            result.errors.push(`Block validation failed: ${errorMsg}`);
          }
        }

        if (result.success) {
          console.log(`   ✅ All blocks validated successfully`);
        } else {
          console.log(`   ❌ Validation errors found:`);
          result.errors.forEach((err) => console.log(`      - ${err}`));
          totalErrors += result.errors.length;
        }

        console.log('');

      } catch (error) {
        result.success = false;
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Page validation failed: ${errorMsg}`);
        console.log(`   ❌ ${errorMsg}\n`);
      }

      results.push(result);
    }

    // Print summary
    console.log('='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));

    const successfulPages = results.filter((r) => r.success).length;
    const failedPages = results.filter((r) => !r.success).length;
    const totalBlocks = results.reduce((sum, r) => sum + r.totalBlocks, 0);
    const validatedBlocks = results.reduce((sum, r) => sum + r.validatedBlocks, 0);

    console.log(`Total Click Pages:     ${clickPages.length}`);
    console.log(`Successful:            ${successfulPages} ✅`);
    console.log(`Failed:                ${failedPages} ${failedPages > 0 ? '❌' : ''}`);
    console.log(`Total Blocks:          ${totalBlocks}`);
    console.log(`Validated Blocks:      ${validatedBlocks}`);
    console.log(`Total Errors:          ${totalErrors}`);
    console.log('='.repeat(60));

    if (failedPages === 0 && totalErrors === 0) {
      console.log('\n✅ All click pages validated successfully!');
      console.log('   Rounded property fix is working correctly.\n');
      process.exit(0);
    } else {
      console.log('\n❌ Validation failed for some click pages.');
      console.log('   Please review the errors above.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal error during verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
verifyRoundedFix();
