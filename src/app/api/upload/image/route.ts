/**
 * Image Upload API - JRM E-commerce Platform
 * Handles secure image uploads for products
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import {
  uploadProductImage,
  type ImageProcessingOptions,
} from '@/lib/upload/image-upload';

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

    // Parse upload options
    const options: ImageProcessingOptions = {
      maxWidth: parseInt(formData.get('maxWidth') as string) || 1200,
      maxHeight: parseInt(formData.get('maxHeight') as string) || 1200,
      quality: parseInt(formData.get('quality') as string) || 85,
      format: (formData.get('format') as 'webp' | 'jpeg' | 'png') || 'webp',
      thumbnail: formData.get('thumbnail') === 'true',
      thumbnailSize: parseInt(formData.get('thumbnailSize') as string) || 300,
    };

    // Upload and process image
    const result = await uploadProductImage(file, options);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error || 'Upload failed' },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json({
      message: 'Image uploaded successfully',
      data: {
        url: result.url,
        filename: result.filename,
        width: result.width,
        height: result.height,
        size: result.size,
      },
    });
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

    if (!filename) {
      return NextResponse.json(
        { message: 'Filename is required' },
        { status: 400 }
      );
    }

    // Delete image
    const { deleteProductImage } = await import('@/lib/upload/image-upload');
    const success = await deleteProductImage(filename);

    if (!success) {
      return NextResponse.json(
        { message: 'Failed to delete image' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
  }
}
