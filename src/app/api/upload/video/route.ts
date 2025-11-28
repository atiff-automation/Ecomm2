/**
 * Video Upload API - JRM E-commerce Platform
 * Handles secure video uploads for click pages
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Use Railway Volume in production, local filesystem in development
const isProduction = process.env.NODE_ENV === 'production';
const UPLOAD_DIR = isProduction
  ? join('/data', 'uploads', 'videos')
  : join(process.cwd(), 'public', 'uploads', 'videos');

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime', // .mov files
];

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

    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message: `Invalid file type. Allowed types: MP4, WebM, OGG, MOV. Received: ${file.type}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      const maxSizeMB = MAX_VIDEO_SIZE / (1024 * 1024);
      return NextResponse.json(
        { message: `File size exceeds ${maxSizeMB}MB limit` },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'mp4';
    const filename = `video-${timestamp}-${randomString}.${extension}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL - use API route in production, static path in development
    const url = isProduction
      ? `/api/media/videos/${filename}`
      : `/uploads/videos/${filename}`;

    return NextResponse.json({
      message: 'Video uploaded successfully',
      data: {
        url,
        filename,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { message: 'Upload failed', error: String(error) },
      { status: 500 }
    );
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

    // Security: Ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json(
        { message: 'Invalid filename' },
        { status: 400 }
      );
    }

    const filepath = join(UPLOAD_DIR, filename);

    // Check if file exists
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      );
    }

    // Delete file
    await unlink(filepath);

    return NextResponse.json({
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Video delete error:', error);
    return NextResponse.json(
      { message: 'Delete failed', error: String(error) },
      { status: 500 }
    );
  }
}
