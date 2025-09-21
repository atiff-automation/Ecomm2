import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';
import { RestoreUtils } from '@/lib/archive/restore-utils';

/**
 * Archive Restoration API Endpoint
 * Centralized session restoration operations following DRY principles
 * @CLAUDE.md - Systematic approach with comprehensive restoration management
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
        { error: 'Admin access required for restore operations' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { sessionIds, reason, restoreToStatus, validateFirst, preserveArchiveRecord } = body;

    // Validate request
    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'Session IDs are required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Prepare restore operation
    const operation = {
      sessionIds,
      reason: reason || 'Manual restoration',
      restoreToStatus: restoreToStatus || 'ended',
    };

    // Validate restore operation
    const validationErrors = RestoreUtils.validateRestoreOperation(operation);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid restore operation', details: validationErrors },
        { status: 400 }
      );
    }

    // Execute restore operation
    const transaction = await RestoreUtils.restoreSessions(sessionIds, {
      restoreToStatus: operation.restoreToStatus,
      reason: operation.reason,
      validateFirst: validateFirst !== false,
      preserveArchiveRecord: preserveArchiveRecord !== false,
    });

    return NextResponse.json({
      success: transaction.status === 'completed',
      transaction: {
        id: transaction.id,
        status: transaction.status,
        startedAt: transaction.startedAt.toISOString(),
        completedAt: transaction.completedAt?.toISOString(),
        summary: transaction.summary,
      },
      results: transaction.results,
      executedBy: (session.user as any)?.email || 'Unknown',
    });

  } catch (error) {
    console.error('Restore operation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to restore sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get restore validation and preview
 * GET endpoint for restore validation and preview
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
    const sessionIdsParam = searchParams.get('sessionIds');
    const action = searchParams.get('action') || 'validate';

    if (!sessionIdsParam) {
      return NextResponse.json(
        { error: 'Session IDs parameter is required' },
        { status: 400 }
      );
    }

    const sessionIds = sessionIdsParam.split(',').filter(id => id.trim());

    if (sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one session ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'validate':
        // Get validation results
        const validations = await RestoreUtils.validateRestoreSessions(sessionIds);
        
        return NextResponse.json({
          success: true,
          validations,
          summary: {
            total: validations.length,
            canRestore: validations.filter(v => v.canRestore).length,
            blocked: validations.filter(v => !v.canRestore).length,
            warnings: validations.reduce((sum, v) => sum + v.warnings.length, 0),
          },
        });

      case 'preview':
        // Get restore preview
        const previews = await RestoreUtils.generateRestorePreview(sessionIds);
        
        return NextResponse.json({
          success: true,
          previews,
          summary: {
            total: previews.length,
            totalMessages: previews.reduce((sum, p) => sum + p.messageCount, 0),
            estimatedTime: previews.reduce((sum, p) => sum + p.estimatedRestoreTime, 0),
            integrityChecks: {
              allMessagesIntact: previews.every(p => p.dataIntegrityChecks.messagesIntact),
              allMetadataIntact: previews.every(p => p.dataIntegrityChecks.metadataIntact),
              allUserLinksIntact: previews.every(p => p.dataIntegrityChecks.userLinksIntact),
            },
          },
        });

      case 'history':
        // Get restoration history for a single session
        if (sessionIds.length !== 1) {
          return NextResponse.json(
            { error: 'History action requires exactly one session ID' },
            { status: 400 }
          );
        }

        const history = await RestoreUtils.getRestorationHistory(sessionIds[0]);
        
        return NextResponse.json({
          success: true,
          sessionId: sessionIds[0],
          history,
        });

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Must be one of: validate, preview, history` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Restore validation/preview error:', error);
    return NextResponse.json(
      { error: 'Failed to process restore request' },
      { status: 500 }
    );
  }
}