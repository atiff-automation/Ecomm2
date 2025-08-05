/**
 * System Health Monitoring
 * Provides system health checks and metrics collection
 */

import { prisma } from '@/lib/db';
import { errorLogger } from './error-logger';

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  uptime: string;
  database: {
    status: 'connected' | 'disconnected';
    latency?: number;
  };
  memory: {
    used: string;
    free: string;
    percentage: number;
  };
  errors: {
    last24Hours: number;
    lastHour: number;
  };
  lastChecked: string;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  latency?: number;
  error?: string;
}

export class SystemHealthMonitor {
  private static instance: SystemHealthMonitor;

  private constructor() {}

  public static getInstance(): SystemHealthMonitor {
    if (!SystemHealthMonitor.instance) {
      SystemHealthMonitor.instance = new SystemHealthMonitor();
    }
    return SystemHealthMonitor.instance;
  }

  /**
   * Get comprehensive system health status
   */
  async getHealthStatus(): Promise<SystemHealthStatus> {
    try {
      const [databaseHealth, memoryStats, errorCounts] = await Promise.all([
        this.checkDatabase(),
        this.getMemoryStats(),
        this.getErrorCounts(),
      ]);

      const uptime = this.formatUptime(process.uptime());

      // Determine overall status
      let status: SystemHealthStatus['status'] = 'healthy';
      if (databaseHealth.status === 'fail') {
        status = 'down';
      } else if (errorCounts.lastHour > 10 || memoryStats.percentage > 90) {
        status = 'degraded';
      }

      const databaseResult: {
        status: 'connected' | 'disconnected';
        latency?: number;
      } = {
        status: databaseHealth.status === 'pass' ? 'connected' : 'disconnected',
      };

      if (databaseHealth.latency !== undefined) {
        databaseResult.latency = databaseHealth.latency;
      }

      return {
        status,
        uptime,
        database: databaseResult,
        memory: memoryStats,
        errors: errorCounts,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      await errorLogger.error(
        'Failed to get system health status',
        error as Error
      );

      return {
        status: 'down',
        uptime: this.formatUptime(process.uptime()),
        database: {
          status: 'disconnected',
        },
        memory: {
          used: 'unknown',
          free: 'unknown',
          percentage: 0,
        },
        errors: {
          last24Hours: 0,
          lastHour: 0,
        },
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Perform basic health checks
   */
  async performHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Database connectivity check
    checks.push(await this.checkDatabase());

    // Memory usage check
    checks.push(await this.checkMemoryUsage());

    // Error rate check
    checks.push(await this.checkErrorRate());

    return checks;
  }

  /**
   * Check database connectivity and latency
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      return {
        name: 'database',
        status: 'pass',
        latency,
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'fail',
        error:
          error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemoryUsage(): Promise<HealthCheck> {
    try {
      const memoryStats = this.getMemoryStats();

      return {
        name: 'memory',
        status: memoryStats.percentage > 90 ? 'fail' : 'pass',
      };
    } catch {
      return {
        name: 'memory',
        status: 'fail',
        error: 'Unable to get memory stats',
      };
    }
  }

  /**
   * Check error rate
   */
  private async checkErrorRate(): Promise<HealthCheck> {
    try {
      const errorCounts = await this.getErrorCounts();

      return {
        name: 'error_rate',
        status: errorCounts.lastHour > 10 ? 'fail' : 'pass',
      };
    } catch {
      return {
        name: 'error_rate',
        status: 'fail',
        error: 'Unable to check error rate',
      };
    }
  }

  /**
   * Get memory statistics
   */
  private getMemoryStats() {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const freeMemory = totalMemory - usedMemory;
    const percentage = Math.round((usedMemory / totalMemory) * 100);

    return {
      used: this.formatBytes(usedMemory),
      free: this.formatBytes(freeMemory),
      percentage,
    };
  }

  /**
   * Get error counts for different time periods
   */
  private async getErrorCounts() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [lastHour, last24Hours] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: 'ERROR',
          createdAt: {
            gte: oneHourAgo,
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: 'ERROR',
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
      }),
    ]);

    return {
      lastHour,
      last24Hours,
    };
  }

  /**
   * Format uptime in human-readable format
   */
  private formatUptime(uptimeSeconds: number): string {
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Format bytes in human-readable format
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  }
}

// Export singleton instance
export const systemHealthMonitor = SystemHealthMonitor.getInstance();
