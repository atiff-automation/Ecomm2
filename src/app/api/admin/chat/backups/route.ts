/**
 * Chat Backup Management API
 * CRUD operations for backup files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { ChatBackupService } from '@/lib/chat/backup-service';
import { UserRole } from '@prisma/client';

export async function GET() {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user || ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get available backups
    const backupService = ChatBackupService.getInstance();
    const backups = await backupService.getAvailableBackups();

    // Convert BigInt to string for JSON serialization
    const serializedBackups = backups.map(backup => ({
      ...backup,
      fileSize: backup.fileSize.toString(),
    }));

    return NextResponse.json({
      success: true,
      backups: serializedBackups,
    });
  } catch (error) {
    console.error('Get backups API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user || ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { year, month } = body;

    // Validate input
    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
    }

    if (typeof year !== 'number' || typeof month !== 'number') {
      return NextResponse.json(
        { error: 'Year and month must be numbers' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1 and 12' },
        { status: 400 }
      );
    }

    if (year < 2020 || year > new Date().getFullYear()) {
      return NextResponse.json(
        { error: 'Invalid year' },
        { status: 400 }
      );
    }

    // Create backup
    const backupService = ChatBackupService.getInstance();
    const result = await backupService.createMonthlyBackup(year, month);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      backup: {
        filename: result.filename,
        fileSize: result.fileSize?.toString(),
        sessionCount: result.sessionCount,
      },
    });
  } catch (error) {
    console.error('Create backup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user || ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get('id');

    if (!backupId) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      );
    }

    // Delete backup
    const backupService = ChatBackupService.getInstance();
    const success = await backupService.deleteBackup(backupId);

    if (!success) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully',
    });
  } catch (error) {
    console.error('Delete backup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}