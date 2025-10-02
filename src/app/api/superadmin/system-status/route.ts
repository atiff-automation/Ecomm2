import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { systemHealthMonitor } from '@/lib/monitoring/system-health';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    // Verify SuperAdmin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token || token.role !== UserRole.SUPERADMIN) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Get comprehensive health status
    const healthStatus = await systemHealthMonitor.getHealthStatus();

    // Check maintenance mode (stored in environment variable for now)
    const maintenanceMode = process.env.MAINTENANCE_MODE === 'true' || false;

    const systemStatus = {
      uptime: healthStatus.uptime,
      errorCount: healthStatus.errors.last24Hours,
      maintenanceMode,
      status: healthStatus.status,
      database: healthStatus.database,
    };

    return NextResponse.json(systemStatus);
  } catch (error) {
    console.error('SuperAdmin system status error:', error);
    return handleApiError(error);
  }
}
