/**
 * Migration Script: Fix Rounded Property for Click Page Blocks
 *
 * PURPOSE:
 * Adds `rounded: false` to all IMAGE, VIDEO, and IMAGE_GALLERY blocks
 * that don't have this property defined. This prevents React hydration
 * errors (#185) when saving click pages.
 *
 * BACKGROUND:
 * The rounded property was added in commits e224dc0, dbea934, f9b698a, cbcac67
 * but existing blocks in the database were never migrated, causing:
 * - Inconsistent rendering (some blocks undefined, others false/true)
 * - React hydration errors when saving
 * - Toggle switch not working reliably
 *
 * USAGE:
 *   npx tsx scripts/fix-rounded-property.ts [--dry-run] [--verbose]
 *
 * OPTIONS:
 *   --dry-run    Preview changes without applying them
 *   --verbose    Show detailed logging
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  totalClickPages: number;
  totalBlocksUpdated: number;
  imageBlocksFixed: number;
  videoBlocksFixed: number;
  imageGalleryBlocksFixed: number;
  clickPagesModified: number;
  errors: string[];
}

interface Block {
  id: string;
  type: string;
  sortOrder: number;
  settings: {
    rounded?: boolean | null;
    [key: string]: unknown;
  };
}

const BLOCK_TYPES_WITH_ROUNDED = ['IMAGE', 'VIDEO', 'IMAGE_GALLERY'];

async function fixRoundedProperty(dryRun = false, verbose = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalClickPages: 0,
    totalBlocksUpdated: 0,
    imageBlocksFixed: 0,
    videoBlocksFixed: 0,
    imageGalleryBlocksFixed: 0,
    clickPagesModified: 0,
    errors: [],
  };

  try {
    console.log('🔍 Fetching all click pages...\n');

    // Fetch all click pages
    const clickPages = await prisma.clickPage.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        blocks: true,
      },
    });

    stats.totalClickPages = clickPages.length;
    console.log(`Found ${stats.totalClickPages} click pages\n`);

    if (stats.totalClickPages === 0) {
      console.log('✅ No click pages found. Nothing to migrate.');
      return stats;
    }

    // Process each click page
    for (const clickPage of clickPages) {
      try {
        let modified = false;
        const blocks = clickPage.blocks as unknown as Block[];

        if (!Array.isArray(blocks)) {
          stats.errors.push(`Click page ${clickPage.id} has invalid blocks structure`);
          continue;
        }

        if (verbose) {
          console.log(`\n📄 Processing: ${clickPage.title} (${clickPage.slug})`);
          console.log(`   Total blocks: ${blocks.length}`);
        }

        // Fix each block
        const updatedBlocks = blocks.map((block) => {
          if (!BLOCK_TYPES_WITH_ROUNDED.includes(block.type)) {
            return block;
          }

          // Check if rounded property needs fixing
          const needsFix =
            block.settings.rounded === undefined ||
            block.settings.rounded === null;

          if (needsFix) {
            modified = true;
            stats.totalBlocksUpdated++;

            // Track by block type
            if (block.type === 'IMAGE') stats.imageBlocksFixed++;
            if (block.type === 'VIDEO') stats.videoBlocksFixed++;
            if (block.type === 'IMAGE_GALLERY') stats.imageGalleryBlocksFixed++;

            if (verbose) {
              console.log(`   ✓ Fixed ${block.type} block (ID: ${block.id})`);
              console.log(`     Before: rounded = ${block.settings.rounded}`);
              console.log(`     After:  rounded = false`);
            }

            return {
              ...block,
              settings: {
                ...block.settings,
                rounded: false,
              },
            };
          }

          return block;
        });

        // Update click page if modified
        if (modified) {
          stats.clickPagesModified++;

          if (!dryRun) {
            await prisma.clickPage.update({
              where: { id: clickPage.id },
              data: { blocks: updatedBlocks as never },
            });

            if (verbose) {
              console.log(`   💾 Saved changes to database`);
            }
          } else {
            if (verbose) {
              console.log(`   🔍 [DRY RUN] Would update this click page`);
            }
          }
        } else if (verbose) {
          console.log(`   ⏭️  No changes needed`);
        }

      } catch (error) {
        const errorMsg = `Error processing click page ${clickPage.id}: ${error instanceof Error ? error.message : String(error)}`;
        stats.errors.push(errorMsg);
        console.error(`\n❌ ${errorMsg}`);
      }
    }

    return stats;

  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function printSummary(stats: MigrationStats, dryRun: boolean) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Click Pages:        ${stats.totalClickPages}`);
  console.log(`Click Pages Modified:     ${stats.clickPagesModified}`);
  console.log(`Total Blocks Updated:     ${stats.totalBlocksUpdated}`);
  console.log(`  - IMAGE blocks:         ${stats.imageBlocksFixed}`);
  console.log(`  - VIDEO blocks:         ${stats.videoBlocksFixed}`);
  console.log(`  - IMAGE_GALLERY blocks: ${stats.imageGalleryBlocksFixed}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors Encountered:    ${stats.errors.length}`);
    stats.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log('='.repeat(60));

  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No changes were made to the database');
    console.log('   Remove --dry-run flag to apply changes');
  } else {
    console.log('\n✅ Migration completed successfully!');
    console.log('   All blocks now have explicit rounded property');
  }
  console.log('');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  console.log('\n🚀 Click Page Rounded Property Migration');
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
  }

  console.log('');

  try {
    const stats = await fixRoundedProperty(dryRun, verbose);
    printSummary(stats, dryRun);

    if (stats.errors.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
