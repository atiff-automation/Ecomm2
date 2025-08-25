/**
 * Admin Media Upload API - Malaysian E-commerce Platform
 * Handles image and video uploads for hero section backgrounds
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max file size
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/avi',
  'video/mov',
];

/**
 * POST /api/admin/site-customization/media/upload - Upload media files
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const usage = (formData.get('usage') as string) || 'hero_background';

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File size too large. Maximum size is 50MB' },
        { status: 400 }
      );
    }

    // Determine media type and validate
    let mediaType: 'IMAGE' | 'VIDEO';
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      mediaType = 'IMAGE';
    } else if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
      mediaType = 'VIDEO';
    } else {
      return NextResponse.json(
        {
          message:
            'Invalid file type. Allowed types: ' +
            [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(', '),
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueId = uuidv4();
    const filename = `${uniqueId}${fileExtension}`;

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'hero');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file to disk
    const filePath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Check if the user exists before creating the upload record
    let uploaderId: string | null = null;
    try {
      const userExists = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      });
      if (userExists) {
        uploaderId = session.user.id;
      }
    } catch (error) {
      console.log('User not found, continuing without uploader reference');
    }

    // Create media upload record in database
    const mediaUpload = await prisma.mediaUpload.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: `/uploads/hero/${filename}`,
        mediaType,
        usage,
        uploadedBy: uploaderId,
      },
      include: {
        uploader: uploaderId ? {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        } : undefined,
      },
    });

    // Create audit log if user exists
    if (uploaderId) {
      await prisma.auditLog.create({
        data: {
          userId: uploaderId,
          action: 'MEDIA_UPLOADED',
          resource: 'SITE_CUSTOMIZATION',
          details: {
            mediaId: mediaUpload.id,
            filename: mediaUpload.filename,
          originalName: mediaUpload.originalName,
          mediaType: mediaUpload.mediaType,
          size: mediaUpload.size,
          usage,
          performedBy: session.user.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });
    }

    return NextResponse.json({
      mediaUpload,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { message: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/site-customization/media/upload - Get uploaded media files
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mediaType = searchParams.get('mediaType') as 'IMAGE' | 'VIDEO' | null;
    const usage = searchParams.get('usage') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Build where clause
    const whereClause: any = {};
    if (mediaType) {
      whereClause.mediaType = mediaType;
    }
    if (usage) {
      whereClause.usage = usage;
    }

    const mediaUploads = await prisma.mediaUpload.findMany({
      where: whereClause,
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const totalCount = await prisma.mediaUpload.count({
      where: whereClause,
    });

    return NextResponse.json({
      mediaUploads,
      totalCount,
      message: 'Media files retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching media uploads:', error);
    return NextResponse.json(
      { message: 'Failed to fetch media files' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/site-customization/media/upload - Delete uploaded media file
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('id');

    if (!mediaId) {
      return NextResponse.json(
        { message: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Get media upload record
    const mediaUpload = await prisma.mediaUpload.findUnique({
      where: { id: mediaId },
    });

    if (!mediaUpload) {
      return NextResponse.json(
        { message: 'Media file not found' },
        { status: 404 }
      );
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'public', mediaUpload.url);
    try {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.warn('Could not delete file from disk:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.mediaUpload.delete({
      where: { id: mediaId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MEDIA_DELETED',
        resource: 'SITE_CUSTOMIZATION',
        details: {
          mediaId: mediaUpload.id,
          filename: mediaUpload.filename,
          originalName: mediaUpload.originalName,
          performedBy: session.user.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Media file deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { message: 'Failed to delete media file' },
      { status: 500 }
    );
  }
}
