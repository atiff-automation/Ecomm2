/**
 * Production-Ready Logging System
 * Following @CLAUDE.md centralized architecture and DRY principles
 * Structured logging with proper levels and sanitization
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class ProductionLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Sanitize sensitive data from log context
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'authorization',
    ];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Format log entry for structured logging
   */
  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) {
      entry.context = this.sanitizeContext(context);
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    return entry;
  }

  /**
   * Output log entry based on environment
   */
  private output(entry: LogEntry): void {
    if (this.isProduction) {
      // In production, output structured JSON for log aggregation
      console.log(JSON.stringify(entry));
    } else {
      // In development, output human-readable format
      const contextStr = entry.context
        ? ` | Context: ${JSON.stringify(entry.context)}`
        : '';
      const errorStr = entry.error ? ` | Error: ${entry.error.message}` : '';
      console.log(
        `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}${errorStr}`
      );
    }
  }

  /**
   * Log error with context
   */
  error(message: string, context?: LogContext, error?: Error): void {
    const entry = this.formatLogEntry(LogLevel.ERROR, message, context, error);
    this.output(entry);
  }

  /**
   * Log warning with context
   */
  warn(message: string, context?: LogContext): void {
    const entry = this.formatLogEntry(LogLevel.WARN, message, context);
    this.output(entry);
  }

  /**
   * Log info with context
   */
  info(message: string, context?: LogContext): void {
    const entry = this.formatLogEntry(LogLevel.INFO, message, context);
    this.output(entry);
  }

  /**
   * Log debug (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const entry = this.formatLogEntry(LogLevel.DEBUG, message, context);
      this.output(entry);
    }
  }

  /**
   * Log API errors with standardized format
   */
  apiError(
    operation: string,
    status: number,
    statusText: string,
    context?: LogContext
  ): void {
    this.error(`API operation failed: ${operation}`, {
      ...context,
      status,
      statusText,
      component: 'api-client',
    });
  }

  /**
   * Log session events
   */
  sessionEvent(event: string, sessionId: string, context?: LogContext): void {
    this.info(`Session event: ${event}`, {
      ...context,
      sessionId,
      component: 'chat-session',
    });
  }

  /**
   * Log user actions
   */
  userAction(action: string, userId?: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      userId,
      component: 'user-interaction',
    });
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      ...context,
      duration,
      component: 'performance',
    });
  }

  /**
   * Log health check results
   */
  healthCheck(
    service: string,
    status: 'healthy' | 'degraded' | 'critical',
    context?: LogContext
  ): void {
    const level =
      status === 'healthy'
        ? LogLevel.INFO
        : status === 'degraded'
          ? LogLevel.WARN
          : LogLevel.ERROR;
    const message = `Health check: ${service} is ${status}`;

    const entry = this.formatLogEntry(level, message, {
      ...context,
      service,
      status,
      component: 'health-check',
    });
    this.output(entry);
  }
}

// Export singleton instance
export const logger = new ProductionLogger();

// Export convenience functions for backward compatibility
export const logError = (
  message: string,
  context?: LogContext,
  error?: Error
) => logger.error(message, context, error);

export const logWarn = (message: string, context?: LogContext) =>
  logger.warn(message, context);

export const logInfo = (message: string, context?: LogContext) =>
  logger.info(message, context);

export const logDebug = (message: string, context?: LogContext) =>
  logger.debug(message, context);
