/**
 * Crash Logs API - Read crash detection logs
 * GET /api/debug/crash-logs
 *
 * Access logs via:
 * 1. Railway Dashboard: https://your-app.railway.app/api/debug/crash-logs
 * 2. Railway CLI: railway ssh -- "curl localhost:8080/api/debug/crash-logs"
 * 3. Local SSH: ssh into container and curl localhost:8080/api/debug/crash-logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { crashLogger } from '@/lib/monitoring/crash-logger';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Read crash logs
    const logs = crashLogger.readCrashLogs();

    // Also try to read directly from file as backup
    const logDir = process.env.CRASH_LOG_DIR || '/tmp/crash-logs';
    const logFile = join(logDir, 'crashes.jsonl');

    let rawLogs: string | null = null;
    if (existsSync(logFile)) {
      rawLogs = readFileSync(logFile, 'utf8');
    }

    // Get current memory state
    const mem = process.memoryUsage();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      currentMemory: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
        external: Math.round(mem.external / 1024 / 1024) + 'MB',
        heapPercent: Math.round((mem.heapUsed / mem.heapTotal) * 100) + '%',
      },
      crashLogs: {
        count: logs.length,
        logs: logs,
      },
      rawLogFile: rawLogs,
      logFileLocation: logFile,
      instructions: {
        'Via Railway Dashboard': 'Access this URL in browser: https://your-app.railway.app/api/debug/crash-logs',
        'Via Railway CLI SSH': 'railway ssh -- "curl localhost:8080/api/debug/crash-logs"',
        'View log file directly': 'railway ssh -- "cat /tmp/crash-logs/crashes.jsonl"',
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error reading crash logs:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to read crash logs',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
    });
  }
}

// POST endpoint to manually trigger a test crash log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message || 'Manual test log entry';

    crashLogger.logCustomEvent(message, {
      triggeredBy: 'manual_api_call',
      ...body.metadata,
    });

    return NextResponse.json({
      success: true,
      message: 'Test crash log entry created',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create test log entry',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 500,
    });
  }
}
