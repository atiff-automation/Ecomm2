/**
 * Centralized Notification Logging and Monitoring Service
 * SINGLE SOURCE OF TRUTH for all notification system logging and metrics
 * NO HARDCODE - All logging configuration centralized and environment-driven
 */

import { prisma } from '@/lib/db/prisma';

// CENTRALIZED CONFIGURATION - Single source of truth
const LOGGING_CONFIG = {
  LEVEL: process.env.LOG_LEVEL || 'info', // error, warn, info, debug, verbose
  ENABLE_DATABASE_LOGGING: process.env.ENABLE_DATABASE_LOGGING !== 'false',
  ENABLE_CONSOLE_LOGGING: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
  ENABLE_METRICS: process.env.ENABLE_METRICS !== 'false',
  RETENTION_DAYS: parseInt(process.env.LOG_RETENTION_DAYS || '30'),
  BATCH_SIZE: parseInt(process.env.LOG_BATCH_SIZE || '100'),
  ALERT_THRESHOLD: parseInt(process.env.LOG_ALERT_THRESHOLD || '10'),
  PERFORMANCE_THRESHOLD_MS: parseInt(
    process.env.PERFORMANCE_THRESHOLD_MS || '5000'
  ),
  ERROR_ESCALATION_COUNT: parseInt(process.env.ERROR_ESCALATION_COUNT || '5'),
} as const;

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

enum NotificationEvent {
  SENT = 'SENT',
  FAILED = 'FAILED',
  RETRIED = 'RETRIED',
  DELIVERED = 'DELIVERED',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  PERFORMANCE_WARNING = 'PERFORMANCE_WARNING',
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
  DEAD_LETTER_QUEUED = 'DEAD_LETTER_QUEUED',
}

interface NotificationLogEntry {
  timestamp: Date;
  level: LogLevel;
  event: NotificationEvent;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'TELEGRAM' | 'IN_APP';
  userId?: string;
  notificationId?: string;
  message: string;
  metadata?: Record<string, any>;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  context?: {
    ip?: string;
    userAgent?: string;
    endpoint?: string;
    sessionId?: string;
  };
}

interface LogMetrics {
  totalNotifications: number;
  successfulNotifications: number;
  failedNotifications: number;
  averageDeliveryTime: number;
  errorRate: number;
  channelBreakdown: Record<string, number>;
  topErrors: Array<{ error: string; count: number }>;
  performanceIssues: number;
  securityViolations: number;
}

interface AlertCondition {
  type: 'ERROR_RATE' | 'PERFORMANCE' | 'SECURITY' | 'VOLUME';
  threshold: number;
  timeWindow: number; // minutes
  escalate: boolean;
}

/**
 * CENTRALIZED Notification Logger Class - Single Source of Truth
 */
export class NotificationLogger {
  private static logBuffer: NotificationLogEntry[] = [];
  private static metricsCache: LogMetrics | null = null;
  private static lastFlush: number = Date.now();

  /**
   * SYSTEMATIC logging method - NO HARDCODE
   */
  static async log(
    level: keyof typeof LogLevel,
    event: NotificationEvent,
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'TELEGRAM' | 'IN_APP',
    message: string,
    options: {
      userId?: string;
      notificationId?: string;
      metadata?: Record<string, any>;
      duration?: number;
      error?: Error;
      context?: {
        ip?: string;
        userAgent?: string;
        endpoint?: string;
        sessionId?: string;
      };
    } = {}
  ): Promise<void> {
    const logLevel = LogLevel[level];
    const configLevel =
      LogLevel[LOGGING_CONFIG.LEVEL.toUpperCase() as keyof typeof LogLevel] ||
      LogLevel.INFO;

    // CENTRALIZED level filtering
    if (logLevel > configLevel) {
      return; // Skip logging if below configured level
    }

    // SYSTEMATIC log entry creation
    const logEntry: NotificationLogEntry = {
      timestamp: new Date(),
      level: logLevel,
      event,
      channel,
      userId: options.userId,
      notificationId: options.notificationId,
      message,
      metadata: options.metadata,
      duration: options.duration,
      error: options.error
        ? {
            name: options.error.name,
            message: options.error.message,
            stack: options.error.stack,
            code: (options.error as any).code,
          }
        : undefined,
      context: options.context,
    };

    // CENTRALIZED logging dispatch
    await Promise.all([
      this.logToConsole(logEntry),
      this.bufferForDatabase(logEntry),
      this.updateMetrics(logEntry),
      this.checkAlertConditions(logEntry),
    ]);
  }

  /**
   * SYSTEMATIC console logging - DRY PRINCIPLE
   */
  private static async logToConsole(
    entry: NotificationLogEntry
  ): Promise<void> {
    if (!LOGGING_CONFIG.ENABLE_CONSOLE_LOGGING) return;

    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] ${levelName} [${entry.channel}] ${entry.event}`;

    // CENTRALIZED console output by level
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(`🔴 ${prefix}: ${entry.message}`, entry.error || '');
        break;
      case LogLevel.WARN:
        console.warn(`🟡 ${prefix}: ${entry.message}`);
        break;
      case LogLevel.INFO:
        console.log(`🟢 ${prefix}: ${entry.message}`);
        break;
      case LogLevel.DEBUG:
        console.debug(`🔵 ${prefix}: ${entry.message}`, entry.metadata || '');
        break;
      case LogLevel.VERBOSE:
        console.log(`⚪ ${prefix}: ${entry.message}`, { entry });
        break;
    }
  }

  /**
   * CENTRALIZED database logging buffer - Performance optimized
   */
  private static async bufferForDatabase(
    entry: NotificationLogEntry
  ): Promise<void> {
    if (!LOGGING_CONFIG.ENABLE_DATABASE_LOGGING) return;

    this.logBuffer.push(entry);

    // SYSTEMATIC batch flushing
    if (
      this.logBuffer.length >= LOGGING_CONFIG.BATCH_SIZE ||
      Date.now() - this.lastFlush > 60000 // 1 minute
    ) {
      await this.flushToDatabase();
    }
  }

  /**
   * SYSTEMATIC database flushing - DRY PRINCIPLE
   */
  private static async flushToDatabase(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];
    this.lastFlush = Date.now();

    try {
      await prisma.notificationLog.createMany({
        data: logsToFlush.map(entry => ({
          timestamp: entry.timestamp,
          level: LogLevel[entry.level],
          event: entry.event,
          channel: entry.channel,
          userId: entry.userId,
          notificationId: entry.notificationId,
          message: entry.message,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          duration: entry.duration,
          errorName: entry.error?.name,
          errorMessage: entry.error?.message,
          errorStack: entry.error?.stack,
          errorCode: entry.error?.code,
          contextIp: entry.context?.ip,
          contextUserAgent: entry.context?.userAgent,
          contextEndpoint: entry.context?.endpoint,
          contextSessionId: entry.context?.sessionId,
        })),
      });

      console.log(
        `📊 Flushed ${logsToFlush.length} notification logs to database`
      );
    } catch (error) {
      console.error('❌ Failed to flush logs to database:', error);
      // Re-add failed logs to buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  /**
   * CENTRALIZED metrics collection - Single source of truth
   */
  private static async updateMetrics(
    entry: NotificationLogEntry
  ): Promise<void> {
    if (!LOGGING_CONFIG.ENABLE_METRICS) return;

    // Invalidate cache on new events to ensure fresh metrics
    this.metricsCache = null;
  }

  /**
   * SYSTEMATIC alert condition checking - NO HARDCODE
   */
  private static async checkAlertConditions(
    entry: NotificationLogEntry
  ): Promise<void> {
    // CENTRALIZED alert conditions
    const alertConditions: AlertCondition[] = [
      {
        type: 'ERROR_RATE',
        threshold: 0.1, // 10% error rate
        timeWindow: 5, // 5 minutes
        escalate: true,
      },
      {
        type: 'PERFORMANCE',
        threshold: LOGGING_CONFIG.PERFORMANCE_THRESHOLD_MS,
        timeWindow: 1, // 1 minute
        escalate: false,
      },
      {
        type: 'SECURITY',
        threshold: 1, // Any security violation
        timeWindow: 1, // 1 minute
        escalate: true,
      },
      {
        type: 'VOLUME',
        threshold: 1000, // 1000 notifications per minute
        timeWindow: 1, // 1 minute
        escalate: false,
      },
    ];

    for (const condition of alertConditions) {
      await this.evaluateAlertCondition(entry, condition);
    }
  }

  /**
   * CENTRALIZED alert evaluation - DRY PRINCIPLE
   */
  private static async evaluateAlertCondition(
    entry: NotificationLogEntry,
    condition: AlertCondition
  ): Promise<void> {
    try {
      const timeWindow = new Date(
        Date.now() - condition.timeWindow * 60 * 1000
      );

      switch (condition.type) {
        case 'ERROR_RATE':
          await this.checkErrorRate(timeWindow, condition);
          break;
        case 'PERFORMANCE':
          await this.checkPerformance(entry, condition);
          break;
        case 'SECURITY':
          await this.checkSecurity(entry, condition);
          break;
        case 'VOLUME':
          await this.checkVolume(timeWindow, condition);
          break;
      }
    } catch (error) {
      console.error(`Alert evaluation failed for ${condition.type}:`, error);
    }
  }

  /**
   * SYSTEMATIC error rate monitoring - Single source of truth
   */
  private static async checkErrorRate(
    timeWindow: Date,
    condition: AlertCondition
  ): Promise<void> {
    const recentLogs = await prisma.notificationLog.findMany({
      where: {
        timestamp: { gte: timeWindow },
      },
      select: {
        level: true,
      },
    });

    if (recentLogs.length === 0) return;

    const errorCount = recentLogs.filter(log => log.level === 'ERROR').length;
    const errorRate = errorCount / recentLogs.length;

    if (errorRate >= condition.threshold) {
      await this.triggerAlert(
        'ERROR_RATE',
        {
          errorRate: (errorRate * 100).toFixed(2),
          errorCount,
          totalLogs: recentLogs.length,
          timeWindow: condition.timeWindow,
        },
        condition.escalate
      );
    }
  }

  /**
   * CENTRALIZED performance monitoring - DRY PRINCIPLE
   */
  private static async checkPerformance(
    entry: NotificationLogEntry,
    condition: AlertCondition
  ): Promise<void> {
    if (entry.duration && entry.duration > condition.threshold) {
      await this.triggerAlert(
        'PERFORMANCE',
        {
          duration: entry.duration,
          threshold: condition.threshold,
          channel: entry.channel,
          event: entry.event,
          notificationId: entry.notificationId,
        },
        condition.escalate
      );
    }
  }

  /**
   * SYSTEMATIC security violation monitoring - Single source of truth
   */
  private static async checkSecurity(
    entry: NotificationLogEntry,
    condition: AlertCondition
  ): Promise<void> {
    if (entry.event === NotificationEvent.SECURITY_VIOLATION) {
      await this.triggerAlert(
        'SECURITY',
        {
          event: entry.event,
          message: entry.message,
          userId: entry.userId,
          context: entry.context,
          metadata: entry.metadata,
        },
        condition.escalate
      );
    }
  }

  /**
   * CENTRALIZED volume monitoring - DRY PRINCIPLE
   */
  private static async checkVolume(
    timeWindow: Date,
    condition: AlertCondition
  ): Promise<void> {
    const volumeCount = await prisma.notificationLog.count({
      where: {
        timestamp: { gte: timeWindow },
      },
    });

    if (volumeCount >= condition.threshold) {
      await this.triggerAlert(
        'VOLUME',
        {
          count: volumeCount,
          threshold: condition.threshold,
          timeWindow: condition.timeWindow,
        },
        condition.escalate
      );
    }
  }

  /**
   * SYSTEMATIC alert triggering - Single source of truth
   */
  private static async triggerAlert(
    type: string,
    data: Record<string, any>,
    escalate: boolean
  ): Promise<void> {
    const alertMessage = `🚨 NOTIFICATION SYSTEM ALERT: ${type}`;

    console.error(alertMessage, data);

    // CENTRALIZED alert logging
    await this.log(
      'ERROR',
      NotificationEvent.SECURITY_VIOLATION,
      'IN_APP',
      alertMessage,
      {
        metadata: { alertType: type, alertData: data, escalate },
      }
    );

    // SYSTEMATIC alert escalation
    if (escalate) {
      try {
        const { simplifiedTelegramService } = await import(
          '@/lib/telegram/simplified-telegram-service'
        );
        await simplifiedTelegramService.sendSystemAlertNotification(
          alertMessage,
          JSON.stringify(data, null, 2),
          'error'
        );
      } catch (error) {
        console.error('Failed to send alert notification:', error);
      }
    }
  }

  /**
   * CENTRALIZED metrics collection - Single source of truth
   */
  static async getMetrics(
    timeWindow: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)
  ): Promise<LogMetrics> {
    if (this.metricsCache && Date.now() - this.lastFlush < 60000) {
      return this.metricsCache;
    }

    try {
      const [totalLogs, errorLogs, performanceLogs, channelStats, topErrors] =
        await Promise.all([
          prisma.notificationLog.count({
            where: { timestamp: { gte: timeWindow } },
          }),
          prisma.notificationLog.count({
            where: {
              timestamp: { gte: timeWindow },
              level: 'ERROR',
            },
          }),
          prisma.notificationLog.count({
            where: {
              timestamp: { gte: timeWindow },
              duration: { gt: LOGGING_CONFIG.PERFORMANCE_THRESHOLD_MS },
            },
          }),
          prisma.notificationLog.groupBy({
            by: ['channel'],
            where: { timestamp: { gte: timeWindow } },
            _count: true,
          }),
          prisma.notificationLog.groupBy({
            by: ['errorMessage'],
            where: {
              timestamp: { gte: timeWindow },
              level: 'ERROR',
              errorMessage: { not: null },
            },
            _count: true,
            orderBy: { _count: { errorMessage: 'desc' } },
            take: 10,
          }),
        ]);

      const avgDuration = await prisma.notificationLog.aggregate({
        where: {
          timestamp: { gte: timeWindow },
          duration: { not: null },
        },
        _avg: { duration: true },
      });

      const securityViolations = await prisma.notificationLog.count({
        where: {
          timestamp: { gte: timeWindow },
          event: NotificationEvent.SECURITY_VIOLATION,
        },
      });

      this.metricsCache = {
        totalNotifications: totalLogs,
        successfulNotifications: totalLogs - errorLogs,
        failedNotifications: errorLogs,
        averageDeliveryTime: avgDuration._avg.duration || 0,
        errorRate: totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0,
        channelBreakdown: channelStats.reduce(
          (acc, stat) => {
            acc[stat.channel] = stat._count;
            return acc;
          },
          {} as Record<string, number>
        ),
        topErrors: topErrors.map(error => ({
          error: error.errorMessage || 'Unknown Error',
          count: error._count,
        })),
        performanceIssues: performanceLogs,
        securityViolations,
      };

      return this.metricsCache;
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      throw error;
    }
  }

  /**
   * SYSTEMATIC log cleanup - DRY PRINCIPLE
   */
  static async cleanup(): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - LOGGING_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000
    );

    const deletedCount = await prisma.notificationLog.deleteMany({
      where: {
        timestamp: { lte: cutoffDate },
      },
    });

    console.log(
      `🧹 Notification logs cleanup: removed ${deletedCount.count} old records`
    );
    return deletedCount.count;
  }

  /**
   * CENTRALIZED log search - Single source of truth
   */
  static async searchLogs(criteria: {
    level?: string;
    event?: NotificationEvent;
    channel?: string;
    userId?: string;
    timeFrom?: Date;
    timeTo?: Date;
    errorMessage?: string;
    limit?: number;
  }) {
    const where: any = {};

    if (criteria.level) where.level = criteria.level;
    if (criteria.event) where.event = criteria.event;
    if (criteria.channel) where.channel = criteria.channel;
    if (criteria.userId) where.userId = criteria.userId;
    if (criteria.errorMessage)
      where.errorMessage = { contains: criteria.errorMessage };
    if (criteria.timeFrom || criteria.timeTo) {
      where.timestamp = {};
      if (criteria.timeFrom) where.timestamp.gte = criteria.timeFrom;
      if (criteria.timeTo) where.timestamp.lte = criteria.timeTo;
    }

    return await prisma.notificationLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: criteria.limit || 100,
    });
  }

  /**
   * SYSTEMATIC forced flush for immediate logging
   */
  static async flush(): Promise<void> {
    await this.flushToDatabase();
  }
}

/**
 * CENTRALIZED convenience logging methods - DRY PRINCIPLE
 */
export class NotificationEvents {
  /**
   * SYSTEMATIC notification success logging
   */
  static async logSuccess(
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'TELEGRAM' | 'IN_APP',
    notificationId: string,
    userId?: string,
    duration?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await NotificationLogger.log(
      'INFO',
      NotificationEvent.SENT,
      channel,
      'Notification sent successfully',
      { notificationId, userId, duration, metadata }
    );
  }

  /**
   * SYSTEMATIC notification failure logging
   */
  static async logFailure(
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'TELEGRAM' | 'IN_APP',
    error: Error,
    notificationId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await NotificationLogger.log(
      'ERROR',
      NotificationEvent.FAILED,
      channel,
      'Notification failed to send',
      { notificationId, userId, error, metadata }
    );
  }

  /**
   * CENTRALIZED rate limit logging
   */
  static async logRateLimit(
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'TELEGRAM' | 'IN_APP',
    userId: string,
    context?: { ip?: string; endpoint?: string }
  ): Promise<void> {
    await NotificationLogger.log(
      'WARN',
      NotificationEvent.RATE_LIMITED,
      channel,
      'Notification rate limited',
      { userId, context }
    );
  }

  /**
   * SYSTEMATIC security violation logging
   */
  static async logSecurityViolation(
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'TELEGRAM' | 'IN_APP',
    violation: string,
    userId?: string,
    context?: { ip?: string; userAgent?: string; endpoint?: string }
  ): Promise<void> {
    await NotificationLogger.log(
      'ERROR',
      NotificationEvent.SECURITY_VIOLATION,
      channel,
      `Security violation: ${violation}`,
      { userId, context }
    );
  }
}

/**
 * EXPORT centralized configuration and types
 */
export { LOGGING_CONFIG, LogLevel, NotificationEvent };
export type { NotificationLogEntry, LogMetrics, AlertCondition };
