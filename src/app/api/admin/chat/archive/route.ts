import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';
import { ArchiveManager } from '@/lib/archive/archive-manager';
import { PaginationUtils } from '@/lib/shared/pagination-utils';

/**
 * Archive Management API Endpoint
 * Centralized archive operations following DRY principles
 * @CLAUDE.md - Systematic approach with comprehensive archive management
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin access
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    const allowedRoles = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = PaginationUtils.parsePaginationParams({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') as 'archivedAt' | 'retentionUntil' | 'sessionId' || 'archivedAt';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    // Parse date range if provided
    let dateRange;
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    if (fromDate && toDate) {
      dateRange = {
        from: new Date(fromDate),
        to: new Date(toDate),
      };
    }

    // Get archived sessions with stats
    const result = await ArchiveManager.getArchivedSessions({
      page,
      limit: pageSize,
      search,
      dateRange,
      sortBy,
      sortOrder,
    });

    // Create pagination metadata
    const paginationInfo = PaginationUtils.calculatePagination(page, pageSize, result.total);

    return NextResponse.json({
      success: true,
      sessions: result.sessions,
      stats: result.stats,
      pagination: {
        currentPage: paginationInfo.currentPage,
        pageSize: paginationInfo.pageSize,
        totalItems: paginationInfo.totalItems,
        totalPages: paginationInfo.totalPages,
        hasNext: paginationInfo.hasNext,
        hasPrevious: paginationInfo.hasPrevious,
      },
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Archive API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archived sessions' },
      { status: 500 }
    );
  }
}

/**
 * Archive sessions manually
 * POST endpoint for manual archiving operations
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin access
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    const allowedRoles = [UserRole.SUPERADMIN, UserRole.ADMIN];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Admin access required for archive operations' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { sessionIds, reason, scheduledPurgeDate } = body;

    // Validate request
    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'Session IDs are required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Prepare archive operation
    const operation = {
      sessionIds,
      reason: reason || 'Manual archive operation',
      scheduledPurgeDate: scheduledPurgeDate ? new Date(scheduledPurgeDate) : undefined,
    };

    // Validate archive operation
    const validationErrors = ArchiveManager.validateArchiveOperation(operation);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid archive operation', details: validationErrors },
        { status: 400 }
      );
    }

    // Execute archive operation
    const result = await ArchiveManager.archiveSessions(operation);

    return NextResponse.json({
      success: result.success,
      archivedCount: result.archivedCount,
      errors: result.errors,
      operation: {
        sessionIds: operation.sessionIds,
        reason: operation.reason,
        executedAt: new Date().toISOString(),
        executedBy: (session.user as any)?.email || 'Unknown',
      },
    });

  } catch (error) {
    console.error('Archive operation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to archive sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}