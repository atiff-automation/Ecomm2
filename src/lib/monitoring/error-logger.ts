/**
 * Error Logging and Monitoring System
 * Provides centralized error handling and logging for the application
 */

import { prisma } from '@/lib/db';

export interface ErrorLogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: Error;
  context?: Record<string, any>;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  url?: string;
  method?: string;
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log error to database and console
   */
  async logError(entry: ErrorLogEntry): Promise<void> {
    try {
      // Console logging for development
      if (this.isDevelopment) {
        this.logToConsole(entry);
      }

      // Database logging for all environments
      await this.logToDatabase(entry);

      // In production, you might want to send to external services like Sentry
      if (!this.isDevelopment) {
        await this.sendToExternalService(entry);
      }
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Failed to log error:', error);
      console.error('Original error:', entry);
    }
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    switch (entry.level) {
      case 'error':
        console.error(prefix, entry.message, entry.error);
        break;
      case 'warn':
        console.warn(prefix, entry.message);
        break;
      case 'info':
        console.info(prefix, entry.message);
        break;
      case 'debug':
        console.debug(prefix, entry.message);
        break;
    }

    if (entry.context) {
      console.log('Context:', entry.context);
    }
  }

  /**
   * Log to database via audit log
   */
  private async logToDatabase(entry: ErrorLogEntry): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId || null,
        action: 'ERROR',
        resource: 'APPLICATION',
        details: {
          level: entry.level,
          message: entry.message,
          error: entry.error
            ? {
                name: entry.error.name,
                message: entry.error.message,
                stack: entry.error.stack,
              }
            : null,
          context: entry.context,
          url: entry.url,
          method: entry.method,
        },
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    });
  }

  /**
   * Send to external monitoring service (placeholder for Sentry, etc.)
   */
  private async sendToExternalService(entry: ErrorLogEntry): Promise<void> {
    // TODO: Implement Sentry or other external service integration
    // This is where you would send errors to services like:
    // - Sentry
    // - LogRocket
    // - Bugsnag
    // - Custom monitoring services

    // For now, just log that we would send it externally
    if (entry.level === 'error') {
      console.log('Would send to external monitoring service:', entry.message);
    }
  }

  /**
   * Convenience methods for different log levels
   */
  async error(
    message: string,
    error?: Error,
    context?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const logEntry: ErrorLogEntry = {
      level: 'error',
      message,
    };

    if (error) {
      logEntry.error = error;
    }

    if (context) {
      logEntry.context = context;
    }

    if (userId) {
      logEntry.userId = userId;
    }

    await this.logError(logEntry);
  }

  async warn(
    message: string,
    context?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const logEntry: ErrorLogEntry = { level: 'warn', message };
    if (context) {
      logEntry.context = context;
    }
    if (userId) {
      logEntry.userId = userId;
    }
    await this.logError(logEntry);
  }

  async info(
    message: string,
    context?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const logEntry: ErrorLogEntry = { level: 'info', message };
    if (context) {
      logEntry.context = context;
    }
    if (userId) {
      logEntry.userId = userId;
    }
    await this.logError(logEntry);
  }

  async debug(
    message: string,
    context?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    if (this.isDevelopment) {
      const logEntry: ErrorLogEntry = { level: 'debug', message };
      if (context) {
        logEntry.context = context;
      }
      if (userId) {
        logEntry.userId = userId;
      }
      await this.logError(logEntry);
    }
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

/**
 * Helper function to extract request details for logging
 */
export function extractRequestDetails(request: Request) {
  return {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent') || 'unknown',
    ipAddress:
      // @ts-expect-error - ip property exists on NextRequest
      request.ip ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown',
  };
}

/**
 * Async error wrapper for API routes
 */
export function withErrorLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await errorLogger.error(
        `API Error: ${errorMessage}`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  };
}
