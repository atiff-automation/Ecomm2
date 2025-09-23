/**
 * Individual Backup Download API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { ChatBackupService } from '@/lib/chat/backup-service';
import { UserRole } from '@prisma/client';
import { readFile, access } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = params;

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Security check: ensure filename doesn't contain path traversal
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Verify backup exists in database
    const backupService = ChatBackupService.getInstance();
    const backup = await backupService.getBackupByFilename(filename);

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    // Verify backup integrity
    const isValid = await backupService.validateBackupIntegrity(backup);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Backup file is corrupted or missing' },
        { status: 404 }
      );
    }

    // Get file path and read file
    const filePath = await backupService.getBackupFilePath(filename);

    try {
      await access(filePath);
      const fileBuffer = await readFile(filePath);

      // Return file as download
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    } catch (fileError) {
      console.error('File access error:', fileError);
      return NextResponse.json(
        { error: 'Backup file not accessible' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Download backup API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
