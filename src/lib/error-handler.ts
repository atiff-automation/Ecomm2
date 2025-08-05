import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { errorLogger } from '@/lib/monitoring/error-logger';

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  field?: string;
}

/**
 * Standard error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error using the centralized error logger (fire and forget)
  if (error instanceof Error) {
    errorLogger.error('API Error', error).catch(console.error);
  } else {
    errorLogger
      .error('Unknown API Error', new Error(String(error)))
      .catch(console.error);
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        return NextResponse.json(
          {
            message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
            field,
            code: 'DUPLICATE_ENTRY',
          },
          { status: 409 }
        );
      }

      case 'P2025':
        // Record not found
        return NextResponse.json(
          { message: 'Record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );

      case 'P2003':
        // Foreign key constraint violation
        return NextResponse.json(
          {
            message: 'Invalid reference to related record',
            code: 'INVALID_REFERENCE',
          },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          { message: 'Database error', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
    }
  }

  // Validation errors
  if (error instanceof Error && error.message.includes('validation')) {
    return NextResponse.json(
      { message: error.message, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  // Generic errors
  if (error instanceof Error) {
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { message: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: error.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }

  // Unknown error
  return NextResponse.json(
    { message: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' },
    { status: 500 }
  );
}

/**
 * Create a standardized API error
 */
export function createApiError(
  message: string,
  status: number = 500,
  code?: string,
  field?: string
): NextResponse {
  return NextResponse.json({ message, code, field }, { status });
}

/**
 * Validation error helper
 */
export function validationError(message: string, field?: string): NextResponse {
  return createApiError(message, 400, 'VALIDATION_ERROR', field);
}

/**
 * Authentication error helper
 */
export function authError(
  message: string = 'Authentication required'
): NextResponse {
  return createApiError(message, 401, 'AUTH_ERROR');
}

/**
 * Authorization error helper
 */
export function forbiddenError(
  message: string = 'Access denied'
): NextResponse {
  return createApiError(message, 403, 'FORBIDDEN');
}

/**
 * Not found error helper
 */
export function notFoundError(
  message: string = 'Resource not found'
): NextResponse {
  return createApiError(message, 404, 'NOT_FOUND');
}

/**
 * Rate limit error helper
 */
export function rateLimitError(retryAfter?: number): NextResponse {
  const headers: Record<string, string> = {};
  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }

  return new NextResponse(
    JSON.stringify({ message: 'Too many requests', code: 'RATE_LIMIT' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}
