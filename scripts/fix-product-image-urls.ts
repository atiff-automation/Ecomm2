/**
 * Fix Product Image URLs - Update from medium to hero size
 *
 * This script updates all product image URLs in the database from medium size (-md.webp)
 * to hero size (-hero.webp) to fix blurry images on product detail pages.
 *
 * Usage: npx tsx scripts/fix-product-image-urls.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting product image URL fix...\n');

  try {
    // Get all product images with medium size URLs
    const images = await prisma.productImage.findMany({
      where: {
        url: {
          contains: '-md.webp'
        }
      },
      select: {
        id: true,
        url: true,
        productId: true,
        product: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    console.log(`Found ${images.length} images with medium size URLs\n`);

    if (images.length === 0) {
      console.log('No images to update. Exiting.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Update each image URL from -md.webp to -hero.webp
    for (const image of images) {
      const newUrl = image.url.replace('-md.webp', '-hero.webp');

      try {
        await prisma.productImage.update({
          where: { id: image.id },
          data: { url: newUrl }
        });

        console.log(`✓ Updated: ${image.product.name}`);
        console.log(`  Old: ${image.url}`);
        console.log(`  New: ${newUrl}\n`);

        successCount++;
      } catch (error) {
        console.error(`✗ Error updating image for ${image.product.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n========================================');
    console.log('Summary:');
    console.log(`Total images processed: ${images.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('========================================\n');

    if (successCount > 0) {
      console.log('✓ Product image URLs have been updated from medium to hero size.');
      console.log('  Images should now appear clearer on product detail pages.');
    }

  } catch (error) {
    console.error('Fatal error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
