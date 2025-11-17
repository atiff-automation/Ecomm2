/**
 * Error Logging API - Malaysian E-commerce Platform
 * Accepts frontend error logs for monitoring and debugging
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Error log schema for validation
const errorLogSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
  level: z.enum(['error', 'warn', 'info']).default('error'),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/errors - Log frontend errors
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const errorData = errorLogSchema.parse(body);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Frontend Error]', {
        ...errorData,
        ip: request.ip || 'unknown',
        headers: {
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
        },
      });
    }

    // In production, you might want to send to a logging service like:
    // - Sentry
    // - LogRocket
    // - CloudWatch
    // - Custom logging service
    //
    // Example:
    // if (process.env.NODE_ENV === 'production') {
    //   await sendToLoggingService(errorData);
    // }

    // For now, just acknowledge receipt
    return NextResponse.json(
      {
        message: 'Error logged successfully',
        received: true,
      },
      { status: 200 }
    );
  } catch (error) {
    // Don't fail the frontend if error logging fails
    console.error('Error logging endpoint failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Invalid error data',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Failed to log error',
        received: false,
      },
      { status: 500 }
    );
  }
}
