/**
 * Crash Detection and Process Monitoring System
 * Tracks application lifecycle, errors, and crashes with detailed logging
 * FOLLOWS @CLAUDE.md: DRY | NO HARDCODE | SINGLE SOURCE OF TRUTH
 */

// Database logging disabled for now - using console only
// import { prisma } from '@/lib/db/prisma';

// SINGLE SOURCE OF TRUTH: Log levels and categories
export const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL',
} as const;

export const LOG_CATEGORIES = {
  STARTUP: 'STARTUP',
  SHUTDOWN: 'SHUTDOWN',
  CRASH: 'CRASH',
  ERROR: 'ERROR',
  MEMORY: 'MEMORY',
  PERFORMANCE: 'PERFORMANCE',
  DEPLOYMENT: 'DEPLOYMENT',
} as const;

type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];
type LogCategory = typeof LOG_CATEGORIES[keyof typeof LOG_CATEGORIES];

interface CrashLog {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

class CrashDetector {
  private startupTime: Date;
  private isShuttingDown: boolean = false;
  private logs: CrashLog[] = [];
  private maxLogsInMemory: number = 100;

  constructor() {
    this.startupTime = new Date();
    this.setupProcessMonitoring();
  }

  /**
   * Setup comprehensive process monitoring
   */
  private setupProcessMonitoring(): void {
    // Track startup
    this.log(LOG_LEVELS.INFO, LOG_CATEGORIES.STARTUP, 'Application starting', {
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
      env: process.env.NODE_ENV,
      railway: process.env.RAILWAY_ENVIRONMENT || 'local',
    });

    // Unhandled Promise Rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.log(LOG_LEVELS.FATAL, LOG_CATEGORIES.CRASH, 'Unhandled Promise Rejection', {
        reason: String(reason),
        promise: String(promise),
        uptime: this.getUptime(),
      }, reason instanceof Error ? reason.stack : undefined);
    });

    // Uncaught Exceptions
    process.on('uncaughtException', (error) => {
      this.log(LOG_LEVELS.FATAL, LOG_CATEGORIES.CRASH, 'Uncaught Exception', {
        error: error.message,
        name: error.name,
        uptime: this.getUptime(),
      }, error.stack);

      // Give time to flush logs before crashing
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // SIGTERM - Railway shutdown signal
    process.on('SIGTERM', () => {
      this.isShuttingDown = true;
      this.log(LOG_LEVELS.INFO, LOG_CATEGORIES.SHUTDOWN, 'SIGTERM received - Graceful shutdown initiated', {
        uptime: this.getUptime(),
        reason: 'Railway deployment or scaling event',
        memoryUsage: this.getMemoryStats(),
      });

      // Flush logs to console before shutdown
      this.flushLogs();
    });

    // SIGINT - Manual interrupt
    process.on('SIGINT', () => {
      this.isShuttingDown = true;
      this.log(LOG_LEVELS.INFO, LOG_CATEGORIES.SHUTDOWN, 'SIGINT received - Manual shutdown', {
        uptime: this.getUptime(),
        memoryUsage: this.getMemoryStats(),
      });

      this.flushLogs();
    });

    // Process warnings
    process.on('warning', (warning) => {
      this.log(LOG_LEVELS.WARN, LOG_CATEGORIES.ERROR, 'Process Warning', {
        name: warning.name,
        message: warning.message,
        uptime: this.getUptime(),
      }, warning.stack);
    });

    // Memory monitoring (every 5 minutes)
    setInterval(() => {
      const memStats = this.getMemoryStats();
      const heapPercent = Math.round((memStats.heapUsed / memStats.heapTotal) * 100);

      if (heapPercent > 80) {
        this.log(LOG_LEVELS.WARN, LOG_CATEGORIES.MEMORY, 'High memory usage detected', {
          ...memStats,
          heapPercent,
          uptime: this.getUptime(),
        });
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Log an event
   */
  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    stackTrace?: string
  ): void {
    const logEntry: CrashLog = {
      timestamp: new Date(),
      level,
      category,
      message,
      metadata,
      stackTrace,
    };

    // Add to in-memory logs
    this.logs.push(logEntry);

    // Keep only last N logs in memory
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift();
    }

    // Format and output to console
    const emoji = this.getLevelEmoji(level);
    const categoryTag = `[${category}]`;
    const timestamp = logEntry.timestamp.toISOString();

    console.log(`${emoji} ${timestamp} ${categoryTag} ${message}`);

    if (metadata) {
      console.log('   Metadata:', JSON.stringify(metadata, null, 2));
    }

    if (stackTrace) {
      console.log('   Stack:', stackTrace);
    }

    // Database logging disabled - using console only for now
    // Future: Enable database logging when MonitoringEvent model is added to Prisma schema
    // if (level === LOG_LEVELS.FATAL || level === LOG_LEVELS.ERROR) {
    //   this.saveToDatabase(logEntry).catch(err => {
    //     console.error('   Failed to save log to database:', err.message);
    //   });
    // }
  }

  /**
   * Save critical logs to database (DISABLED FOR NOW)
   * TODO: Add MonitoringEvent model to Prisma schema
   */
  // private async saveToDatabase(log: CrashLog): Promise<void> {
  //   try {
  //     // Save to monitoring_events table
  //     await prisma.monitoringEvent.create({
  //       data: {
  //         type: log.category,
  //         severity: log.level.toLowerCase() as any,
  //         message: log.message,
  //         metadata: log.metadata ? JSON.stringify(log.metadata) : null,
  //         stackTrace: log.stackTrace,
  //         occurredAt: log.timestamp,
  //       },
  //     });
  //   } catch (error) {
  //     // Silent fail - don't crash the crash detector
  //     console.error('Database logging failed:', error);
  //   }
  // }

  /**
   * Track deployment lifecycle
   */
  public trackDeployment(event: 'start' | 'success' | 'failure', details?: Record<string, any>): void {
    const messages = {
      start: 'Deployment started',
      success: 'Deployment completed successfully',
      failure: 'Deployment failed',
    };

    this.log(
      event === 'failure' ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO,
      LOG_CATEGORIES.DEPLOYMENT,
      messages[event],
      {
        deploymentEvent: event,
        uptime: this.getUptime(),
        ...details,
      }
    );
  }

  /**
   * Track API errors
   */
  public trackError(error: Error, context?: Record<string, any>): void {
    this.log(
      LOG_LEVELS.ERROR,
      LOG_CATEGORIES.ERROR,
      error.message,
      {
        errorName: error.name,
        ...context,
        uptime: this.getUptime(),
      },
      error.stack
    );
  }

  /**
   * Flush all logs to console
   */
  public flushLogs(): void {
    console.log('\n🔍 ========== CRASH DETECTOR LOG DUMP ==========');
    console.log(`Total logs: ${this.logs.length}`);
    console.log(`Application uptime: ${this.getUptime()}`);
    console.log(`Memory usage: ${JSON.stringify(this.getMemoryStats(), null, 2)}`);
    console.log('\n📋 Recent logs:');

    this.logs.forEach(log => {
      console.log(`\n${this.getLevelEmoji(log.level)} [${log.category}] ${log.timestamp.toISOString()}`);
      console.log(`   ${log.message}`);
      if (log.metadata) {
        console.log(`   Metadata: ${JSON.stringify(log.metadata, null, 2)}`);
      }
      if (log.stackTrace) {
        console.log(`   Stack: ${log.stackTrace}`);
      }
    });

    console.log('\n==============================================\n');
  }

  /**
   * Get application uptime in human-readable format
   */
  private getUptime(): string {
    const uptimeMs = Date.now() - this.startupTime.getTime();
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get memory statistics
   */
  private getMemoryStats(): {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  } {
    const mem = process.memoryUsage();
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
      external: mem.external,
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
    };
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LOG_LEVELS.INFO:
        return '✅';
      case LOG_LEVELS.WARN:
        return '⚠️';
      case LOG_LEVELS.ERROR:
        return '❌';
      case LOG_LEVELS.FATAL:
        return '💥';
      default:
        return '📝';
    }
  }

  /**
   * Get all logs for debugging
   */
  public getLogs(): CrashLog[] {
    return [...this.logs];
  }

  /**
   * Check if application is shutting down
   */
  public isShutdown(): boolean {
    return this.isShuttingDown;
  }
}

// SINGLE SOURCE OF TRUTH: Global crash detector instance
export const crashDetector = new CrashDetector();
