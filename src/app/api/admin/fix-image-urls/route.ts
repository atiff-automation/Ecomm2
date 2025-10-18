/**
 * Fix Product Image URLs API - Update from medium to hero size
 * Admin-only endpoint to fix blurry images by updating URLs from -md to -hero
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    console.log('Starting product image URL fix...');

    // Get all product images with medium size URLs
    const images = await prisma.productImage.findMany({
      where: {
        url: {
          contains: '-md.webp',
        },
      },
      select: {
        id: true,
        url: true,
        productId: true,
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    console.log(`Found ${images.length} images with medium size URLs`);

    if (images.length === 0) {
      return NextResponse.json({
        message: 'No images to update',
        data: {
          total: 0,
          updated: 0,
          errors: 0,
        },
      });
    }

    const updatedImages = [];
    const errors = [];

    // Update each image URL from -md.webp to -hero.webp
    for (const image of images) {
      const newUrl = image.url.replace('-md.webp', '-hero.webp');

      try {
        await prisma.productImage.update({
          where: { id: image.id },
          data: { url: newUrl },
        });

        updatedImages.push({
          productName: image.product.name,
          oldUrl: image.url,
          newUrl: newUrl,
        });

        console.log(`✓ Updated: ${image.product.name}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          productName: image.product.name,
          error: errorMessage,
        });
        console.error(
          `✗ Error updating image for ${image.product.name}:`,
          error
        );
      }
    }

    return NextResponse.json({
      message: 'Product image URLs updated successfully',
      data: {
        total: images.length,
        updated: updatedImages.length,
        errors: errors.length,
        updatedImages,
        errorDetails: errors,
      },
    });
  } catch (error) {
    console.error('Error fixing image URLs:', error);
    return NextResponse.json(
      {
        message: 'Failed to fix image URLs',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
