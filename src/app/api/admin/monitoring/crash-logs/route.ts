/**
 * Crash Logs API Endpoint
 * Provides access to in-memory crash detector logs for debugging
 * FOLLOWS @CLAUDE.md: Security | Admin Only | DRY
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { crashDetector } from '../../../../../../lib/monitoring/crash-detector';
import { requireAdminRole } from '@/lib/auth/authorization';

export async function GET() {
  // SECURITY: Admin authentication required
  const { error } = await requireAdminRole();
  if (error) return error;

  try {
    const logs = crashDetector.getLogs();
    const isShutdown = crashDetector.isShutdown();

    // Get process stats
    const mem = process.memoryUsage();
    const uptime = process.uptime();

    return NextResponse.json({
      success: true,
      data: {
        totalLogs: logs.length,
        isShutdown,
        processStats: {
          uptime: {
            seconds: Math.floor(uptime),
            formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
          },
          memory: {
            heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
            rssMB: Math.round(mem.rss / 1024 / 1024),
            externalMB: Math.round(mem.external / 1024 / 1024),
            heapPercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
          },
          process: {
            pid: process.pid,
            nodeVersion: process.version,
            platform: process.platform,
            env: process.env.NODE_ENV,
            railway: process.env.RAILWAY_ENVIRONMENT || 'local',
          },
        },
        logs: logs.map(log => ({
          timestamp: log.timestamp.toISOString(),
          level: log.level,
          category: log.category,
          message: log.message,
          metadata: log.metadata,
          stackTrace: log.stackTrace,
        })),
      },
    });
  } catch (error) {
    console.error('❌ Crash logs API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve crash logs',
      },
      { status: 500 }
    );
  }
}

/**
 * Flush logs (trigger log dump to console)
 */
export async function POST() {
  // SECURITY: Admin authentication required
  const { error } = await requireAdminRole();
  if (error) return error;

  try {
    crashDetector.flushLogs();

    return NextResponse.json({
      success: true,
      message: 'Logs flushed to console - check Railway logs',
    });
  } catch (error) {
    console.error('❌ Crash logs flush error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to flush crash logs',
      },
      { status: 500 }
    );
  }
}
