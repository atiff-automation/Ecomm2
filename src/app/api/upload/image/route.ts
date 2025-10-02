/**

export const dynamic = 'force-dynamic';

 * Image Upload API - JRM E-commerce Platform
 * Handles secure image uploads for products
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import {
  uploadProductImage,
  uploadProductImageLegacy,
  deleteProductImagesByUuid,
  type ImageProcessingOptions,
} from '@/lib/upload/image-upload';
import { IMAGE_CONFIG } from '@/lib/config/image-config';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.STAFF &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Parse upload options from form data
    const useLegacyMode = formData.get('legacy') === 'true';
    const customSizes = formData.get('sizes')?.toString().split(',') || undefined;
    const customFormats = formData.get('formats')?.toString().split(',') || undefined;

    const options: ImageProcessingOptions = {
      sizes: customSizes || ['small', 'medium', 'large', 'hero'],
      formats: customFormats || ['webp', 'jpeg'],
      generateThumbnails: formData.get('thumbnails') !== 'false',
      preserveOriginal: formData.get('preserveOriginal') === 'true',
    };

    // Use legacy mode for backward compatibility or new optimized mode
    let result;
    if (useLegacyMode) {
      // Backward compatibility for existing integrations
      result = await uploadProductImageLegacy(file, options);
    } else {
      // New optimized multi-variant upload
      result = await uploadProductImage(file, options);
    }

    if (!result.success) {
      return NextResponse.json(
        { message: result.error || 'Upload failed' },
        { status: 400 }
      );
    }

    // Return response based on mode
    if (useLegacyMode) {
      // Legacy response format
      return NextResponse.json({
        message: 'Image uploaded successfully',
        data: {
          url: (result as any).url,
          filename: (result as any).filename,
          width: (result as any).width,
          height: (result as any).height,
          size: (result as any).size,
        },
      });
    } else {
      // New optimized response format
      return NextResponse.json({
        message: 'Images processed successfully',
        data: {
          uuid: result.metadata?.uuid,
          images: result.images,
          metadata: result.metadata,
          totalVariants: result.images?.length || 0,
        },
      });
    }
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.STAFF &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const uuid = searchParams.get('uuid');

    if (!filename && !uuid) {
      return NextResponse.json(
        { message: 'Filename or UUID is required' },
        { status: 400 }
      );
    }

    let success = false;

    if (uuid) {
      // Delete all variants of an image by UUID (new optimized approach)
      success = await deleteProductImagesByUuid(uuid);
    } else if (filename) {
      // Delete specific image file (legacy approach)
      const { deleteProductImage } = await import('@/lib/upload/image-upload');
      success = await deleteProductImage(filename);
    }

    if (!success) {
      return NextResponse.json(
        { message: 'Failed to delete image(s)' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: uuid
        ? 'All image variants deleted successfully'
        : 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
  }
}
