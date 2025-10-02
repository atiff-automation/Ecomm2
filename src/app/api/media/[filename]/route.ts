/**
 * Media File Serving API - For Railway Production
 * Serves uploaded files from /tmp directory
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

    // Try to read from /tmp first (production), fallback to public/uploads
    const tmpPath = path.join('/tmp', 'uploads', 'hero', filename);
    const publicPath = path.join(process.cwd(), 'public', 'uploads', 'hero', filename);

    let filePath: string;
    let fileBuffer: Buffer;

    if (existsSync(tmpPath)) {
      filePath = tmpPath;
      fileBuffer = await readFile(tmpPath);
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
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.avi': 'video/avi',
      '.mov': 'video/quicktime',
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
    console.error('Error serving media file:', error);
    return NextResponse.json(
      { message: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
