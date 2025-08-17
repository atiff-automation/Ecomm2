/**
 * EasyParcel Monitoring Service
 * Comprehensive monitoring, alerting, and performance tracking
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 7.2
 */

import { prisma } from '@/lib/db/prisma';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  metadata?: any;
}

export interface AlertConfig {
  errorRateThreshold: number;      // Alert if error rate > 10%
  responseTimeThreshold: number;   // Alert if avg response time > 5000ms
  failedShipmentThreshold: number; // Alert if failed shipments > 5
  webhookFailureThreshold: number; // Alert if webhook failures > 3
  checkInterval: number;           // Check every 5 minutes
}

export interface MonitoringStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  averageResponseTime: number;
  recentErrors: string[];
  performance: {
    rateCalculation: PerformanceStats;
    shipmentBooking: PerformanceStats;
    labelGeneration: PerformanceStats;
    tracking: PerformanceStats;
  };
}

export interface PerformanceStats {
  totalCalls: number;
  averageDuration: number;
  successRate: number;
  lastError?: string;
}

export interface Alert {
  id: string;
  type: 'error_rate' | 'response_time' | 'failed_shipment' | 'webhook_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  metadata?: any;
}

export class EasyParcelMonitor {
  private static instance: EasyParcelMonitor;
  private metrics: PerformanceMetric[] = [];
  private alerts: Alert[] = [];
  private config: AlertConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<AlertConfig>) {
    this.config = {
      errorRateThreshold: 0.10,      // 10%
      responseTimeThreshold: 5000,   // 5 seconds
      failedShipmentThreshold: 5,    // 5 failed shipments
      webhookFailureThreshold: 3,    // 3 webhook failures
      checkInterval: 5 * 60 * 1000,  // 5 minutes
      ...config
    };

    this.startMonitoring();
  }

  public static getInstance(config?: Partial<AlertConfig>): EasyParcelMonitor {
    if (!this.instance) {
      this.instance = new EasyParcelMonitor(config);
    }
    return this.instance;
  }

  /**
   * Record performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    };

    this.metrics.push(fullMetric);
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Store in database for persistence
    this.storeMetricInDatabase(fullMetric).catch(error => {
      console.error('[EasyParcel Monitor] Error storing metric:', error);
    });

    console.log(`[EasyParcel Monitor] Recorded ${metric.operation}: ${metric.duration}ms (${metric.success ? 'success' : 'failed'})`);
  }

  /**
   * Record API response time
   */
  recordAPICall(operation: string, startTime: number, success: boolean, error?: any, metadata?: any): void {
    const duration = Date.now() - startTime;
    
    this.recordMetric({
      operation,
      duration,
      success,
      errorCode: error?.code,
      errorMessage: error?.message,
      metadata
    });
  }

  /**
   * Record failed shipment
   */
  recordFailedShipment(shipmentId: string, reason: string, metadata?: any): void {
    this.recordMetric({
      operation: 'failed_shipment',
      duration: 0,
      success: false,
      errorMessage: reason,
      metadata: { shipmentId, ...metadata }
    });

    // Check if we need to trigger an alert
    this.checkFailedShipmentAlert();
  }

  /**
   * Record webhook failure
   */
  recordWebhookFailure(webhookData: any, error: string): void {
    this.recordMetric({
      operation: 'webhook_failure',
      duration: 0,
      success: false,
      errorMessage: error,
      metadata: webhookData
    });

    // Check if we need to trigger an alert
    this.checkWebhookFailureAlert();
  }

  /**
   * Get current monitoring statistics
   */
  getStats(timeRange: number = 60 * 60 * 1000): MonitoringStats {
    const cutoffTime = Date.now() - timeRange;
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);

    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
    
    const responseTimes = recentMetrics.filter(m => m.duration > 0).map(m => m.duration);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const recentErrors = recentMetrics
      .filter(m => !m.success && m.errorMessage)
      .slice(-10)
      .map(m => m.errorMessage || 'Unknown error');

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRate,
      averageResponseTime,
      recentErrors,
      performance: {
        rateCalculation: this.getOperationStats('rate_calculation', recentMetrics),
        shipmentBooking: this.getOperationStats('shipment_booking', recentMetrics),
        labelGeneration: this.getOperationStats('label_generation', recentMetrics),
        tracking: this.getOperationStats('tracking', recentMetrics)
      }
    };
  }

  /**
   * Get operation-specific statistics
   */
  private getOperationStats(operation: string, metrics: PerformanceMetric[]): PerformanceStats {
    const operationMetrics = metrics.filter(m => m.operation === operation);
    
    if (operationMetrics.length === 0) {
      return {
        totalCalls: 0,
        averageDuration: 0,
        successRate: 0
      };
    }

    const totalCalls = operationMetrics.length;
    const successfulCalls = operationMetrics.filter(m => m.success).length;
    const successRate = successfulCalls / totalCalls;
    
    const durations = operationMetrics.filter(m => m.duration > 0).map(m => m.duration);
    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0;

    const lastError = operationMetrics
      .filter(m => !m.success && m.errorMessage)
      .pop()?.errorMessage;

    return {
      totalCalls,
      averageDuration,
      successRate,
      lastError
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(limit: number = 50): Alert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`[EasyParcel Monitor] Alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * Start monitoring checks
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.runHealthChecks();
    }, this.config.checkInterval);

    console.log(`[EasyParcel Monitor] Monitoring started (check interval: ${this.config.checkInterval}ms)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('[EasyParcel Monitor] Monitoring stopped');
    }
  }

  /**
   * Run comprehensive health checks
   */
  private runHealthChecks(): void {
    const stats = this.getStats();

    // Check error rate
    if (stats.errorRate > this.config.errorRateThreshold) {
      this.createAlert('error_rate', 'high', 
        `Error rate (${(stats.errorRate * 100).toFixed(1)}%) exceeds threshold (${(this.config.errorRateThreshold * 100).toFixed(1)}%)`,
        { errorRate: stats.errorRate, threshold: this.config.errorRateThreshold }
      );
    }

    // Check response time
    if (stats.averageResponseTime > this.config.responseTimeThreshold) {
      this.createAlert('response_time', 'medium',
        `Average response time (${stats.averageResponseTime.toFixed(0)}ms) exceeds threshold (${this.config.responseTimeThreshold}ms)`,
        { responseTime: stats.averageResponseTime, threshold: this.config.responseTimeThreshold }
      );
    }

    console.log(`[EasyParcel Monitor] Health check completed - Error rate: ${(stats.errorRate * 100).toFixed(1)}%, Avg response: ${stats.averageResponseTime.toFixed(0)}ms`);
  }

  /**
   * Check for failed shipment alerts
   */
  private checkFailedShipmentAlert(): void {
    const recentFailedShipments = this.metrics.filter(m => 
      m.operation === 'failed_shipment' && 
      m.timestamp >= Date.now() - (60 * 60 * 1000) // Last hour
    );

    if (recentFailedShipments.length >= this.config.failedShipmentThreshold) {
      this.createAlert('failed_shipment', 'high',
        `${recentFailedShipments.length} shipments failed in the last hour`,
        { failedCount: recentFailedShipments.length, threshold: this.config.failedShipmentThreshold }
      );
    }
  }

  /**
   * Check for webhook failure alerts
   */
  private checkWebhookFailureAlert(): void {
    const recentWebhookFailures = this.metrics.filter(m => 
      m.operation === 'webhook_failure' && 
      m.timestamp >= Date.now() - (30 * 60 * 1000) // Last 30 minutes
    );

    if (recentWebhookFailures.length >= this.config.webhookFailureThreshold) {
      this.createAlert('webhook_failure', 'medium',
        `${recentWebhookFailures.length} webhook failures in the last 30 minutes`,
        { failureCount: recentWebhookFailures.length, threshold: this.config.webhookFailureThreshold }
      );
    }
  }

  /**
   * Create new alert
   */
  private createAlert(type: Alert['type'], severity: Alert['severity'], message: string, metadata?: any): void {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(a => 
      a.type === type && 
      !a.resolved && 
      a.timestamp >= Date.now() - (60 * 60 * 1000) // Within last hour
    );

    if (existingAlert) {
      console.log(`[EasyParcel Monitor] Similar alert already exists: ${type}`);
      return;
    }

    const alert: Alert = {
      id: `${type}_${Date.now()}`,
      type,
      severity,
      message,
      timestamp: Date.now(),
      resolved: false,
      metadata
    };

    this.alerts.push(alert);
    
    // Keep only last 100 alerts in memory
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    console.log(`[EasyParcel Monitor] ALERT [${severity.toUpperCase()}] ${type}: ${message}`);

    // Store alert in database
    this.storeAlertInDatabase(alert).catch(error => {
      console.error('[EasyParcel Monitor] Error storing alert:', error);
    });

    // Send notifications for high/critical alerts
    if (severity === 'high' || severity === 'critical') {
      this.sendAlertNotification(alert);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      // In a real implementation, this would send emails, Slack messages, etc.
      console.log(`[EasyParcel Monitor] NOTIFICATION: ${alert.severity.toUpperCase()} alert - ${alert.message}`);
      
      // Example: Send webhook to monitoring service
      if (process.env.MONITORING_WEBHOOK_URL) {
        await fetch(process.env.MONITORING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'EasyParcel',
            alert,
            timestamp: new Date().toISOString()
          })
        });
      }
    } catch (error) {
      console.error('[EasyParcel Monitor] Error sending alert notification:', error);
    }
  }

  /**
   * Store metric in database
   */
  private async storeMetricInDatabase(metric: PerformanceMetric): Promise<void> {
    try {
      await prisma.systemConfig.create({
        data: {
          key: `easyparcel_metric_${metric.timestamp}`,
          value: JSON.stringify(metric),
          type: 'JSON'
        }
      });
    } catch (error) {
      // Silent fail for metrics - don't spam logs
    }
  }

  /**
   * Store alert in database
   */
  private async storeAlertInDatabase(alert: Alert): Promise<void> {
    try {
      await prisma.systemConfig.create({
        data: {
          key: `easyparcel_alert_${alert.id}`,
          value: JSON.stringify(alert),
          type: 'JSON'
        }
      });
    } catch (error) {
      console.error('[EasyParcel Monitor] Error storing alert in database:', error);
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboardData(): Promise<{
    currentStats: MonitoringStats;
    activeAlerts: Alert[];
    recentAlerts: Alert[];
    systemHealth: {
      status: 'healthy' | 'warning' | 'critical';
      uptime: number;
      lastCheck: number;
    };
  }> {
    const currentStats = this.getStats();
    const activeAlerts = this.getActiveAlerts();
    const recentAlerts = this.getAllAlerts(20);

    // Determine system health
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (activeAlerts.some(a => a.severity === 'critical')) {
      status = 'critical';
    } else if (activeAlerts.length > 0 || currentStats.errorRate > 0.05) {
      status = 'warning';
    }

    return {
      currentStats,
      activeAlerts,
      recentAlerts,
      systemHealth: {
        status,
        uptime: process.uptime(),
        lastCheck: Date.now()
      }
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(timeRange: number = 24 * 60 * 60 * 1000): PerformanceMetric[] {
    const cutoffTime = Date.now() - timeRange;
    return this.metrics.filter(m => m.timestamp >= cutoffTime);
  }
}

// Helper function to create monitoring wrapper
export function withMonitoring<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const monitor = EasyParcelMonitor.getInstance();
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      monitor.recordAPICall(operation, startTime, true, undefined, { args: args.length });
      return result;
    } catch (error) {
      monitor.recordAPICall(operation, startTime, false, error);
      throw error;
    }
  };
}