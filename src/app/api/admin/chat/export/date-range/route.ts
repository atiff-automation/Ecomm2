/**
 * Chat Date Range Export API
 * Enhanced export endpoint for date-based exports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { ChatExportService } from '@/lib/chat/export-service';
import { ExportOptions, validateExportOptions } from '@/lib/chat/data-management';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user || ![UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { startDate, endDate, format } = body;

    // Validate input
    if (!startDate || !endDate || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: startDate, endDate, format' },
        { status: 400 }
      );
    }

    const exportOptions: ExportOptions = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      format: format as 'json' | 'csv' | 'pdf',
      includeMessages: true,
    };

    // Validate export options
    const validation = validateExportOptions(exportOptions);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid export options', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate export
    const exportService = ChatExportService.getInstance();
    const exportBuffer = await exportService.exportByDateRange(exportOptions);

    // Get session count for filename
    const sessions = await exportService.fetchSessionsInDateRange(
      exportOptions.startDate,
      exportOptions.endDate,
      false
    );
    const filename = await exportService.generateFilename(exportOptions, sessions.length);

    // Determine content type
    let contentType = 'application/octet-stream';
    switch (format) {
      case 'json':
        contentType = 'application/json';
        break;
      case 'csv':
        contentType = 'text/csv';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
    }

    // Return file as download
    return new NextResponse(exportBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': exportBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Date range export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}