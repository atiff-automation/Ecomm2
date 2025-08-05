import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { systemHealthMonitor } from '@/lib/monitoring/system-health';
import { handleApiError } from '@/lib/error-handler';

/**
 * Detailed health endpoint for admin users
 * Returns comprehensive system health information
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (
      !token ||
      (token.role !== UserRole.ADMIN && token.role !== UserRole.SUPERADMIN)
    ) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const [healthStatus, healthChecks] = await Promise.all([
      systemHealthMonitor.getHealthStatus(),
      systemHealthMonitor.performHealthChecks(),
    ]);

    return NextResponse.json({
      ...healthStatus,
      healthChecks,
      details: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error('Admin health check error:', error);
    return handleApiError(error);
  }
}
