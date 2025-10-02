/**

export const dynamic = 'force-dynamic';

 * Chat Bot Icon Upload API - JRM E-commerce Platform
 * Handles secure bot icon uploads for chat configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');
const CHAT_ICONS_DIR = path.join(UPLOAD_DIR, 'chat', 'icons');

/**
 * Ensure upload directories exist
 */
async function ensureUploadDirs() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
    if (!existsSync(CHAT_ICONS_DIR)) {
      await mkdir(CHAT_ICONS_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw new Error('Failed to create upload directories');
  }
}

/**
 * Validate uploaded file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 2MB limit' };
  }

  return { valid: true };
}

/**
 * Generate unique filename
 */
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 20);
  const uuid = uuidv4().substring(0, 8);
  return `bot-icon-${sanitizedName}-${uuid}.webp`;
}

/**
 * Process bot icon image
 */
async function processImage(buffer: Buffer): Promise<{
  buffer: Buffer;
  metadata: { width: number; height: number; size: number };
}> {
  // Resize to standard bot icon size and convert to WebP
  const processedBuffer = await sharp(buffer)
    .resize(64, 64, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 90 })
    .toBuffer();

  const metadata = await sharp(processedBuffer).metadata();

  return {
    buffer: processedBuffer,
    metadata: {
      width: metadata.width!,
      height: metadata.height!,
      size: processedBuffer.length,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['SUPERADMIN', 'ADMIN'].includes((session.user as any)?.role)
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

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error || 'Validation failed' },
        { status: 400 }
      );
    }

    // Ensure directories exist
    await ensureUploadDirs();

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image
    const processed = await processImage(buffer);
    const filename = generateFilename(file.name);
    const filepath = path.join(CHAT_ICONS_DIR, filename);

    // Save processed image
    await writeFile(filepath, processed.buffer);

    const publicUrl = `/uploads/chat/icons/${filename}`;

    // Return success response
    return NextResponse.json({
      message: 'Bot icon uploaded successfully',
      data: {
        url: publicUrl,
        filename,
        width: processed.metadata.width,
        height: processed.metadata.height,
        size: processed.metadata.size,
      },
    });
  } catch (error) {
    console.error('Bot icon upload error:', error);
    return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['SUPERADMIN', 'ADMIN'].includes((session.user as any)?.role)
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

    // Delete icon file
    const filepath = path.join(CHAT_ICONS_DIR, filename);
    if (existsSync(filepath)) {
      await import('fs/promises').then(fs => fs.unlink(filepath));
    }

    return NextResponse.json({
      message: 'Bot icon deleted successfully',
    });
  } catch (error) {
    console.error('Bot icon delete error:', error);
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
  }
}
