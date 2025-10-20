/**
 * Audit Queue Status Endpoint
 * Allows admins to monitor audit log health
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';
import { getAuditQueueStatus } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error, session } = await requireAdminRole();
  if (error) {
    return error;
  }

  const status = getAuditQueueStatus();

  return NextResponse.json({
    success: true,
    data: {
      ...status,
      message: status.healthy
        ? 'Audit system operating normally'
        : 'Audit queue has accumulated logs - check system health',
      timestamp: new Date().toISOString(),
    },
  });
}
