/**
 * Performance Monitoring API - Malaysian E-commerce Platform
 * Endpoint for receiving and processing performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

interface PerformanceReport {
  type: 'page-performance' | 'slow-resource';
  timestamp: string;
  url: string;
  metric?: string;
  value?: number;
  metrics?: PerformanceMetrics;
  resource?: {
    name: string;
    type: string;
    duration: number;
    size?: number;
  };
  context?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  // DISABLED: Performance monitoring is temporarily disabled to fix feedback loop issues
  return NextResponse.json({
    success: true,
    message: 'Performance monitoring disabled',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Process and analyze performance report
 */
async function processPerformanceReport(report: PerformanceReport) {
  try {
    switch (report.type) {
      case 'page-performance':
        await processPagePerformance(report);
        break;
      case 'slow-resource':
        await processSlowResource(report);
        break;
      default:
        await processGenericMetric(report);
    }

    // Update performance statistics
    await updatePerformanceStats(report);
  } catch (error) {
    console.error('Failed to process performance report:', error);
    throw error;
  }
}

/**
 * Process page performance metrics
 */
async function processPagePerformance(report: PerformanceReport) {
  if (!report.metrics) {
    return;
  }

  const metrics = report.metrics;
  const alerts: string[] = [];

  // Check Core Web Vitals thresholds
  if (metrics.largestContentfulPaint > 2500) {
    alerts.push(
      `LCP too slow: ${metrics.largestContentfulPaint}ms (should be < 2500ms)`
    );
  }

  if (metrics.firstInputDelay > 100) {
    alerts.push(
      `FID too slow: ${metrics.firstInputDelay}ms (should be < 100ms)`
    );
  }

  if (metrics.cumulativeLayoutShift > 0.1) {
    alerts.push(
      `CLS too high: ${metrics.cumulativeLayoutShift} (should be < 0.1)`
    );
  }

  if (metrics.pageLoadTime > 3000) {
    alerts.push(
      `Page load too slow: ${metrics.pageLoadTime}ms (should be < 3000ms)`
    );
  }

  // Log performance metrics
  if (process.env.NODE_ENV === 'development') {
    console.group(`📊 Performance Report: ${report.url}`);
    console.log('Page Load Time:', metrics.pageLoadTime + 'ms');
    console.log('LCP:', metrics.largestContentfulPaint + 'ms');
    console.log('FID:', metrics.firstInputDelay + 'ms');
    console.log('CLS:', metrics.cumulativeLayoutShift);

    if (alerts.length > 0) {
      console.warn('Performance Alerts:', alerts);
    }
    console.groupEnd();
  }

  // Send alerts for critical performance issues
  if (alerts.length > 0) {
    await sendPerformanceAlert(report.url, alerts);
  }

  // Store performance data
  await storePerformanceData({
    url: report.url,
    timestamp: report.timestamp,
    metrics,
    alerts,
  });
}

/**
 * Process slow resource reports
 */
async function processSlowResource(report: PerformanceReport) {
  if (!report.resource) {
    return;
  }

  const resource = report.resource;

  // Log slow resource
  console.warn(`🐌 Slow Resource Detected:`, {
    name: resource.name,
    type: resource.type,
    duration: resource.duration + 'ms',
    size: resource.size ? formatBytes(resource.size) : 'unknown',
    url: report.url,
  });

  // Store slow resource data
  await storeSlowResourceData({
    url: report.url,
    timestamp: report.timestamp,
    resource,
  });

  // Alert if resource is extremely slow
  if (resource.duration > 5000) {
    // > 5 seconds
    await sendSlowResourceAlert(report.url, resource);
  }
}

/**
 * Process generic performance metric
 */
async function processGenericMetric(report: PerformanceReport) {
  if (!report.metric || report.value === undefined) {
    return;
  }

  console.log(`📈 Performance Metric: ${report.metric} = ${report.value}`, {
    url: report.url,
    context: report.context,
  });

  // Store generic metric
  await storeGenericMetric({
    url: report.url,
    timestamp: report.timestamp,
    metric: report.metric,
    value: report.value,
    context: report.context,
  });
}

/**
 * Update performance statistics
 */
async function updatePerformanceStats(report: PerformanceReport) {
  const date = new Date().toISOString().split('T')[0];
  const statsKey = `performance_stats:${date}`;

  try {
    // In a real implementation, this would use Redis or a time-series database
    console.log(`Updating performance stats for ${statsKey}:`, {
      type: report.type,
      url: report.url,
      timestamp: report.timestamp,
    });
  } catch (error) {
    console.error('Failed to update performance stats:', error);
  }
}

/**
 * Send performance alert
 */
async function sendPerformanceAlert(url: string, alerts: string[]) {
  const alertMessage = `
⚠️ PERFORMANCE ALERT ⚠️

URL: ${url}
Issues Detected:
${alerts.map(alert => `• ${alert}`).join('\n')}

Timestamp: ${new Date().toISOString()}
  `;

  console.warn('PERFORMANCE ALERT:', alertMessage);

  // Here you would integrate with your notification system
  // Example: await slackNotifier.send(alertMessage);
}

/**
 * Send slow resource alert
 */
async function sendSlowResourceAlert(url: string, resource: any) {
  const alertMessage = `
🐌 SLOW RESOURCE ALERT 🐌

URL: ${url}
Resource: ${resource.name}
Type: ${resource.type}
Duration: ${resource.duration}ms
Size: ${resource.size ? formatBytes(resource.size) : 'unknown'}

Timestamp: ${new Date().toISOString()}
  `;

  console.warn('SLOW RESOURCE ALERT:', alertMessage);
}

/**
 * Store performance data in database
 */
async function storePerformanceData(data: any) {
  // This would integrate with your database
  console.log('Storing performance data:', data);
}

/**
 * Store slow resource data in database
 */
async function storeSlowResourceData(data: any) {
  // This would integrate with your database
  console.log('Storing slow resource data:', data);
}

/**
 * Store generic metric in database
 */
async function storeGenericMetric(data: any) {
  // This would integrate with your database
  console.log('Storing generic metric:', data);
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'performance-monitoring',
  });
}
