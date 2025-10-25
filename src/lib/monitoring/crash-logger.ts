/**
 * Crash Logger - Comprehensive Error and Crash Detection
 * Captures all uncaught exceptions, unhandled rejections, and system events
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface CrashLog {
  timestamp: string;
  type: 'uncaught_exception' | 'unhandled_rejection' | 'sigterm' | 'sigint' | 'warning' | 'memory_snapshot';
  message: string;
  stack?: string;
  memory?: NodeJS.MemoryUsage;
  uptime?: number;
  metadata?: Record<string, any>;
}

class CrashLogger {
  private logDir: string;
  private logFile: string;
  private memorySnapshotInterval?: NodeJS.Timeout;

  constructor() {
    // Use /tmp for ephemeral logging (survives longer than process)
    // Railway mounts /tmp as writable
    this.logDir = process.env.CRASH_LOG_DIR || '/tmp/crash-logs';
    this.logFile = join(this.logDir, 'crashes.jsonl');

    this.ensureLogDirectory();
    this.logEvent('memory_snapshot', 'Crash logger initialized');
  }

  private ensureLogDirectory(): void {
    try {
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create crash log directory:', error);
    }
  }

  private logEvent(
    type: CrashLog['type'],
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const logEntry: CrashLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      stack: error?.stack,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      metadata: {
        ...metadata,
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    // Write to console (captured by Railway logs)
    console.error('🚨 CRASH LOGGER:', JSON.stringify(logEntry, null, 2));

    // Write to file system (survives slightly longer)
    try {
      appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write crash log to file:', error);
    }

    // TODO: In production, send to external logging service (Sentry, LogDNA, etc.)
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(logEntry);
    }
  }

  private sendToExternalService(logEntry: CrashLog): void {
    // Placeholder for external logging integration
    // Options: Sentry, LogDNA, Datadog, CloudWatch, etc.
    // For now, just console log
    console.log('📤 Would send to external logging service:', {
      type: logEntry.type,
      timestamp: logEntry.timestamp,
    });
  }

  /**
   * Start monitoring for crashes
   */
  public initialize(): void {
    console.log('🔍 Crash logger initialized');
    this.logEvent('memory_snapshot', 'Starting crash monitoring');

    // 1. Catch uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error('💥 UNCAUGHT EXCEPTION DETECTED!');
      this.logEvent('uncaught_exception', 'Uncaught exception occurred', error, {
        errorName: error.name,
        errorMessage: error.message,
      });

      // Give logger time to write before exiting
      setTimeout(() => {
        console.error('💀 Process exiting due to uncaught exception');
        process.exit(1);
      }, 1000);
    });

    // 2. Catch unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('💥 UNHANDLED PROMISE REJECTION DETECTED!');

      const error = reason instanceof Error ? reason : new Error(String(reason));

      this.logEvent('unhandled_rejection', 'Unhandled promise rejection', error, {
        reason: String(reason),
        promiseString: promise.toString(),
      });

      // Don't exit immediately for unhandled rejections
      // But log them for investigation
    });

    // 3. Catch warnings
    process.on('warning', (warning: Error) => {
      this.logEvent('warning', 'Node.js warning', warning, {
        warningName: warning.name,
        warningMessage: warning.message,
      });
    });

    // 4. Catch SIGTERM (Railway shutdown signal)
    process.on('SIGTERM', () => {
      console.log('📴 SIGTERM RECEIVED - Railway is shutting down the container');
      this.logEvent('sigterm', 'SIGTERM signal received - graceful shutdown initiated', undefined, {
        reason: 'Railway container shutdown',
      });

      // Log final memory state
      this.stopMemorySnapshots();

      console.log('⏳ Allowing 5 seconds for cleanup...');
      // Let the main process handle cleanup
    });

    // 5. Catch SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('📴 SIGINT RECEIVED - User interrupted process');
      this.logEvent('sigint', 'SIGINT signal received - user interruption');
      this.stopMemorySnapshots();
    });

    // 6. Start periodic memory snapshots (every 2 minutes)
    this.startMemorySnapshots();

    console.log('✅ Crash logger fully initialized with all handlers');
  }

  /**
   * Start taking periodic memory snapshots
   */
  private startMemorySnapshots(): void {
    if (this.memorySnapshotInterval) {
      return; // Already running
    }

    this.memorySnapshotInterval = setInterval(() => {
      const mem = process.memoryUsage();
      const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
      const rssMB = Math.round(mem.rss / 1024 / 1024);
      const heapPercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);

      this.logEvent('memory_snapshot', `Memory snapshot: ${heapUsedMB}MB/${heapTotalMB}MB (${heapPercent}%)`, undefined, {
        heapUsedMB,
        heapTotalMB,
        rssMB,
        heapPercent,
        external: Math.round(mem.external / 1024 / 1024),
        arrayBuffers: Math.round(mem.arrayBuffers / 1024 / 1024),
      });
    }, 2 * 60 * 1000); // Every 2 minutes
  }

  /**
   * Stop memory snapshots and cleanup
   */
  private stopMemorySnapshots(): void {
    if (this.memorySnapshotInterval) {
      clearInterval(this.memorySnapshotInterval);
      this.memorySnapshotInterval = undefined;

      // Take final snapshot
      this.logEvent('memory_snapshot', 'Final memory snapshot before shutdown');
    }
  }

  /**
   * Manually log a custom event
   */
  public logCustomEvent(message: string, metadata?: Record<string, any>): void {
    this.logEvent('warning', message, undefined, metadata);
  }

  /**
   * Read crash logs from file
   */
  public readCrashLogs(): CrashLog[] {
    try {
      const fs = require('fs');
      if (!existsSync(this.logFile)) {
        return [];
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      return content
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => JSON.parse(line));
    } catch (error) {
      console.error('Failed to read crash logs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const crashLogger = new CrashLogger();
