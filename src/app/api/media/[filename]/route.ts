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
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      return NextResponse.json(
        { message: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Try to read from Railway Volume first (production), fallback to public/uploads
    // Check both hero and site-customization directories
    const volumeHeroPath = path.join('/data', 'uploads', 'hero', filename);
    const volumeSitePath = path.join(
      '/data',
      'uploads',
      'site-customization',
      filename
    );
    const publicHeroPath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'hero',
      filename
    );
    const publicSitePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'site-customization',
      filename
    );

    let filePath: string;
    let fileBuffer: Buffer;

    // Try all possible paths in order
    if (existsSync(volumeHeroPath)) {
      filePath = volumeHeroPath;
      fileBuffer = await readFile(volumeHeroPath);
    } else if (existsSync(volumeSitePath)) {
      filePath = volumeSitePath;
      fileBuffer = await readFile(volumeSitePath);
    } else if (existsSync(publicHeroPath)) {
      filePath = publicHeroPath;
      fileBuffer = await readFile(publicHeroPath);
    } else if (existsSync(publicSitePath)) {
      filePath = publicSitePath;
      fileBuffer = await readFile(publicSitePath);
    } else {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
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
