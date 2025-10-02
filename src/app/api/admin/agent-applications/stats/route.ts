/**

export const dynamic = 'force-dynamic';

 * Admin Agent Application Statistics API Route
 * Provide dashboard statistics for admin
 * Following CLAUDE.md principles: Centralized data aggregation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AgentApplicationService } from '@/lib/services/agent-application.service';

/**
 * GET /api/admin/agent-applications/stats
 * Get application statistics for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession();
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Akses tidak dibenarkan' },
        { status: 403 }
      );
    }

    // Get statistics
    const stats = await AgentApplicationService.getApplicationStats();

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Admin get stats error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ralat sistem berlaku';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}