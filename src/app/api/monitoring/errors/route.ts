/**
 * Error Monitoring API - Malaysian E-commerce Platform
 * Endpoint for receiving and processing error reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { errorMonitor } from '@/lib/monitoring/error-monitor';

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  retryCount: number;
  environment: string;
  buildId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  breadcrumbs: string[];
  user?: {
    id: string;
    role: string;
    isMember: boolean;
  } | null;
  performance?: {
    loadTime?: number;
    renderTime?: number;
    memory?: number;
  };
  context?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip || 'anonymous';
    const { success } = await rateLimit.limit(identifier, {
      limit: 100,
      window: '1h',
      key: 'error-reporting',
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const errorReport: ErrorReport = await request.json();

    // Validate required fields
    if (
      !errorReport.errorId ||
      !errorReport.message ||
      !errorReport.timestamp
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: errorId, message, timestamp' },
        { status: 400 }
      );
    }

    // Additional security validation
    const headersList = headers();
    const userAgent = headersList.get('user-agent');
    const referer = headersList.get('referer');

    // Basic security checks
    if (userAgent && userAgent.includes('bot')) {
      return NextResponse.json(
        { error: 'Bot requests not allowed' },
        { status: 403 }
      );
    }

    // Process the error report
    await processErrorReport(errorReport);

    return NextResponse.json({
      success: true,
      errorId: errorReport.errorId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing error report:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Process and store error report
 */
async function processErrorReport(errorReport: ErrorReport) {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Report: ${errorReport.errorId}`);
      console.error('Message:', errorReport.message);
      console.error('Severity:', errorReport.severity);
      console.error('URL:', errorReport.url);
      console.error('Stack:', errorReport.stack);
      if (errorReport.breadcrumbs.length > 0) {
        console.log('Breadcrumbs:', errorReport.breadcrumbs.join(' → '));
      }
      console.groupEnd();
    }

    // Store in database (implement based on your database choice)
    await storeErrorInDatabase(errorReport);

    // Send alerts for critical errors
    if (errorReport.severity === 'critical') {
      await sendCriticalErrorAlert(errorReport);
    }

    // Update error statistics
    await updateErrorStats(errorReport);
  } catch (error) {
    console.error('Failed to process error report:', error);
    throw error;
  }
}

/**
 * Store error in database
 */
async function storeErrorInDatabase(errorReport: ErrorReport) {
  // This would integrate with your database
  // For now, we'll store in a simple log format
  const errorLogEntry = {
    ...errorReport,
    processedAt: new Date().toISOString(),
  };

  // In production, you might use Prisma, MongoDB, or another database
  console.log('Storing error in database:', errorLogEntry);
}

/**
 * Send alert for critical errors
 */
async function sendCriticalErrorAlert(errorReport: ErrorReport) {
  try {
    // Integration with notification services
    // This could be Slack, email, SMS, or monitoring services

    const alertMessage = `
🚨 CRITICAL ERROR ALERT 🚨

Error ID: ${errorReport.errorId}
Message: ${errorReport.message}
URL: ${errorReport.url}
User: ${errorReport.user?.id || 'Anonymous'}
Timestamp: ${errorReport.timestamp}

Stack Trace:
${errorReport.stack || 'No stack trace available'}

Environment: ${errorReport.environment}
Build ID: ${errorReport.buildId}
    `;

    console.error('CRITICAL ERROR ALERT:', alertMessage);

    // Here you would integrate with your notification system
    // Example: await slackNotifier.send(alertMessage);
    // Example: await emailService.sendAlert(alertMessage);
  } catch (error) {
    console.error('Failed to send critical error alert:', error);
  }
}

/**
 * Update error statistics
 */
async function updateErrorStats(errorReport: ErrorReport) {
  // Update error counters, rates, and trends
  // This could be stored in Redis or a time-series database

  const statsKey = `error_stats:${new Date().toISOString().split('T')[0]}`;

  try {
    // Increment error counts by severity
    // In a real implementation, this might use Redis INCR commands
    console.log(`Updating error stats for ${statsKey}:`, {
      severity: errorReport.severity,
      errorType: errorReport.context?.type || 'unknown',
      url: errorReport.url,
    });
  } catch (error) {
    console.error('Failed to update error stats:', error);
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'error-monitoring',
  });
}
