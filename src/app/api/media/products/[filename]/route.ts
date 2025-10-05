/**
 * Media File Serving API - Product Images
 * Serves uploaded product images from Railway Volume
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;

    // Security: Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { message: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Try to read from /data first (production), fallback to public/uploads
    const volumePath = path.join('/data', 'uploads', 'products', filename);
    const publicPath = path.join(process.cwd(), 'public', 'uploads', 'products', filename);

    let filePath: string;
    let fileBuffer: Buffer;

    if (existsSync(volumePath)) {
      filePath = volumePath;
      fileBuffer = await readFile(volumePath);
    } else if (existsSync(publicPath)) {
      filePath = publicPath;
      fileBuffer = await readFile(publicPath);
    } else {
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      );
    }

    // Determine content type from file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving product image:', error);
    return NextResponse.json(
      { message: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
