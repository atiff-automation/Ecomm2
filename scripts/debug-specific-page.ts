/**
 * Debug Specific Click Page
 * Check the blocks data for a specific click page
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugClickPage() {
  const clickPageId = 'cmiiagy020001qj3soguiir1m';

  console.log('\n🔍 Debugging Click Page');
  console.log('='.repeat(60));
  console.log(`Page ID: ${clickPageId}\n`);

  try {
    // Fetch the click page
    const clickPage = await prisma.clickPage.findUnique({
      where: { id: clickPageId },
    });

    if (!clickPage) {
      console.log('❌ Click page not found!');
      return;
    }

    console.log('✅ Click Page Found:');
    console.log(`  Title: ${clickPage.title}`);
    console.log(`  Slug: ${clickPage.slug}`);
    console.log(`  Status: ${clickPage.status}`);
    console.log(`  Total Blocks: ${(clickPage.blocks as any[]).length}\n`);

    const blocks = clickPage.blocks as Array<{
      id: string;
      type: string;
      sortOrder: number;
      settings: Record<string, any>;
    }>;

    // Check for IMAGE, VIDEO, IMAGE_GALLERY blocks
    const mediaBlocks = blocks.filter((b) =>
      ['IMAGE', 'VIDEO', 'IMAGE_GALLERY'].includes(b.type)
    );

    if (mediaBlocks.length === 0) {
      console.log('ℹ️  No media blocks (IMAGE/VIDEO/IMAGE_GALLERY) found');
      return;
    }

    console.log(`📷 Media Blocks Found: ${mediaBlocks.length}\n`);
    console.log('='.repeat(60));

    // Analyze each media block
    mediaBlocks.forEach((block, index) => {
      console.log(`\n${index + 1}. ${block.type} Block`);
      console.log(`   ID: ${block.id}`);
      console.log(`   Sort Order: ${block.sortOrder}`);
      console.log(`   Settings:`, JSON.stringify(block.settings, null, 2));

      // Check rounded property specifically
      const rounded = block.settings.rounded;
      console.log(`   🔘 Rounded Property:`);
      console.log(`      Value: ${rounded}`);
      console.log(`      Type: ${typeof rounded}`);
      console.log(`      Is undefined: ${rounded === undefined}`);
      console.log(`      Is null: ${rounded === null}`);
      console.log(`      Is boolean: ${typeof rounded === 'boolean'}`);

      // Flag problematic blocks
      if (rounded === undefined || rounded === null) {
        console.log(`   ⚠️  PROBLEM: rounded is ${rounded === undefined ? 'undefined' : 'null'}!`);
      } else if (typeof rounded === 'boolean') {
        console.log(`   ✅ OK: rounded is properly set to ${rounded}`);
      } else {
        console.log(`   ⚠️  UNEXPECTED: rounded has unexpected type ${typeof rounded}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));

    const hasUndefined = mediaBlocks.some((b) => b.settings.rounded === undefined);
    const hasNull = mediaBlocks.some((b) => b.settings.rounded === null);
    const hasBoolean = mediaBlocks.some((b) => typeof b.settings.rounded === 'boolean');

    console.log(`Blocks with undefined rounded: ${hasUndefined ? 'YES ⚠️' : 'NO ✅'}`);
    console.log(`Blocks with null rounded: ${hasNull ? 'YES ⚠️' : 'NO ✅'}`);
    console.log(`Blocks with boolean rounded: ${hasBoolean ? 'YES ✅' : 'NO ⚠️'}`);

    if (hasUndefined || hasNull) {
      console.log('\n💡 These blocks need to be fixed!');
      console.log('   Run: npx tsx scripts/fix-rounded-property.ts');
    } else {
      console.log('\n✅ All media blocks have proper rounded property!');
      console.log('   The error must be caused by something else.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugClickPage();
