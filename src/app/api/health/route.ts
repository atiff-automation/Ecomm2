import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { systemHealthMonitor } from '@/lib/monitoring/system-health';

/**
 * Public health check endpoint
 * Returns basic system status without authentication
 */
export async function GET() {
  try {
    const healthStatus = await systemHealthMonitor.getHealthStatus();

    // Remove sensitive information for public endpoint
    const publicStatus = {
      status: healthStatus.status,
      uptime: healthStatus.uptime,
      database: {
        status: healthStatus.database.status,
      },
      timestamp: healthStatus.lastChecked,
    };

    // Set appropriate status code based on health
    const statusCode =
      healthStatus.status === 'healthy'
        ? 200
        : healthStatus.status === 'degraded'
          ? 200
          : 503;

    return NextResponse.json(publicStatus, { status: statusCode });
  } catch {
    return NextResponse.json(
      {
        status: 'down',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
