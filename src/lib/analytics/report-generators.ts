/**
 * Report Generation Utilities
 * Centralized report creation following DRY principles
 * @CLAUDE.md - Systematic approach with export functionality
 */

import { AnalyticsData, ChartData } from './chat-analytics';
import { ChartUtils } from './chart-utils';

export interface ReportConfig {
  title: string;
  subtitle?: string;
  timeRange: string;
  includeCharts: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
  format: 'json' | 'csv' | 'pdf';
  branding?: {
    logo?: string;
    companyName?: string;
    companyAddress?: string;
  };
}

export interface ExportData {
  filename: string;
  content: string | Buffer;
  mimeType: string;
  size: number;
}

/**
 * Centralized report generation engine
 * Following performance-utils pattern for consistency
 */
export class ReportGenerator {
  /**
   * Generate comprehensive analytics report
   * Centralized report creation with multiple format support
   */
  static async generateReport(
    analytics: AnalyticsData,
    config: ReportConfig
  ): Promise<ExportData> {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedTitle = config.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    switch (config.format) {
      case 'json':
        return this.generateJSONReport(analytics, config, timestamp, sanitizedTitle);
      case 'csv':
        return this.generateCSVReport(analytics, config, timestamp, sanitizedTitle);
      case 'pdf':
        return this.generatePDFReport(analytics, config, timestamp, sanitizedTitle);
      default:
        throw new Error(`Unsupported report format: ${config.format}`);
    }
  }

  /**
   * Generate JSON format report
   * Complete data export with metadata
   */
  private static generateJSONReport(
    analytics: AnalyticsData,
    config: ReportConfig,
    timestamp: string,
    sanitizedTitle: string
  ): ExportData {
    const reportData = {
      metadata: {
        title: config.title,
        subtitle: config.subtitle,
        timeRange: analytics.timeRange,
        generatedAt: analytics.generatedAt,
        exportedAt: new Date().toISOString(),
        format: 'json',
        version: '1.0',
      },
      summary: {
        totalSessions: analytics.sessionMetrics.totalSessions,
        activeSessions: analytics.sessionMetrics.activeSessions,
        totalMessages: analytics.messageMetrics.totalMessages,
        averageSessionDuration: analytics.sessionMetrics.averageSessionDuration,
        successRate: analytics.performanceMetrics.successRate,
        averageResponseTime: analytics.performanceMetrics.averageResponseTime,
      },
      ...(config.includeDetails && {
        detailedMetrics: {
          sessionMetrics: analytics.sessionMetrics,
          messageMetrics: analytics.messageMetrics,
          performanceMetrics: analytics.performanceMetrics,
          engagementMetrics: analytics.engagementMetrics,
        },
      }),
      ...(config.includeCharts && {
        chartData: analytics.trendData,
      }),
      ...(analytics.periodComparison && {
        periodComparison: analytics.periodComparison,
      }),
    };

    const content = JSON.stringify(reportData, null, 2);
    const filename = `${sanitizedTitle}-${timestamp}.json`;

    return {
      filename,
      content,
      mimeType: 'application/json',
      size: Buffer.byteLength(content, 'utf8'),
    };
  }

  /**
   * Generate CSV format report
   * Tabular data export for spreadsheet analysis
   */
  private static generateCSVReport(
    analytics: AnalyticsData,
    config: ReportConfig,
    timestamp: string,
    sanitizedTitle: string
  ): ExportData {
    const csvRows: string[] = [];
    
    // Header with metadata
    csvRows.push(`# ${config.title}`);
    if (config.subtitle) csvRows.push(`# ${config.subtitle}`);
    csvRows.push(`# Time Range: ${analytics.timeRange}`);
    csvRows.push(`# Generated: ${analytics.generatedAt}`);
    csvRows.push('');

    // Summary metrics
    if (config.includeSummary) {
      csvRows.push('SUMMARY METRICS');
      csvRows.push('Metric,Value,Unit');
      csvRows.push(`Total Sessions,${analytics.sessionMetrics.totalSessions},sessions`);
      csvRows.push(`Active Sessions,${analytics.sessionMetrics.activeSessions},sessions`);
      csvRows.push(`Total Messages,${analytics.messageMetrics.totalMessages},messages`);
      csvRows.push(`Average Session Duration,${analytics.sessionMetrics.averageSessionDuration},seconds`);
      csvRows.push(`Messages Per Session,${analytics.messageMetrics.messagesPerSession},messages`);
      csvRows.push(`Success Rate,${analytics.performanceMetrics.successRate.toFixed(2)},percent`);
      csvRows.push(`Average Response Time,${analytics.performanceMetrics.averageResponseTime.toFixed(2)},seconds`);
      csvRows.push('');
    }

    // Sessions over time
    if (config.includeCharts && analytics.trendData.sessionsOverTime.length > 0) {
      csvRows.push('SESSIONS OVER TIME');
      csvRows.push('Date,Sessions,Messages');
      analytics.trendData.sessionsOverTime.forEach(item => {
        csvRows.push(`${item.date},${item.sessions},${item.messages}`);
      });
      csvRows.push('');
    }

    // Hourly distribution
    if (config.includeCharts && analytics.trendData.hourlyDistribution.length > 0) {
      csvRows.push('HOURLY DISTRIBUTION');
      csvRows.push('Hour,Sessions');
      analytics.trendData.hourlyDistribution.forEach(item => {
        csvRows.push(`${item.hour}:00,${item.count}`);
      });
      csvRows.push('');
    }

    // User types
    csvRows.push('USER TYPES');
    csvRows.push('Type,Count');
    csvRows.push(`Authenticated,${analytics.engagementMetrics.userTypes.authenticated}`);
    csvRows.push(`Guest,${analytics.engagementMetrics.userTypes.guest}`);
    csvRows.push('');

    // Session length distribution
    if (analytics.engagementMetrics.sessionLengthDistribution.length > 0) {
      csvRows.push('SESSION LENGTH DISTRIBUTION');
      csvRows.push('Duration Range,Count');
      analytics.engagementMetrics.sessionLengthDistribution.forEach(item => {
        csvRows.push(`${item.range},${item.count}`);
      });
      csvRows.push('');
    }

    // Period comparison if available
    if (analytics.periodComparison) {
      csvRows.push('PERIOD COMPARISON');
      csvRows.push('Metric,Growth Percentage');
      csvRows.push(`Sessions,${analytics.periodComparison.growth.sessions.toFixed(2)}%`);
      csvRows.push(`Messages,${analytics.periodComparison.growth.messages.toFixed(2)}%`);
      csvRows.push(`Average Duration,${analytics.periodComparison.growth.avgDuration.toFixed(2)}%`);
    }

    const content = csvRows.join('\n');
    const filename = `${sanitizedTitle}-${timestamp}.csv`;

    return {
      filename,
      content,
      mimeType: 'text/csv',
      size: Buffer.byteLength(content, 'utf8'),
    };
  }

  /**
   * Generate PDF format report
   * Formatted report with charts and branding
   */
  private static generatePDFReport(
    analytics: AnalyticsData,
    config: ReportConfig,
    timestamp: string,
    sanitizedTitle: string
  ): ExportData {
    // Note: This is a simplified PDF generation
    // In a full implementation, you would use a library like puppeteer, jsPDF, or PDFKit
    
    const htmlContent = this.generateHTMLReport(analytics, config);
    
    // For now, return HTML content that can be converted to PDF on the frontend
    // In production, implement server-side PDF generation
    const filename = `${sanitizedTitle}-${timestamp}.html`;

    return {
      filename,
      content: htmlContent,
      mimeType: 'text/html',
      size: Buffer.byteLength(htmlContent, 'utf8'),
    };
  }

  /**
   * Generate HTML report content for PDF conversion
   * Structured HTML with inline CSS for PDF generation
   */
  private static generateHTMLReport(analytics: AnalyticsData, config: ReportConfig): string {
    const timeRangeLabel = this.getTimeRangeLabel(analytics.timeRange);
    const generatedDate = new Date(analytics.generatedAt).toLocaleDateString();

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${config.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
        }
        .subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        .meta {
            font-size: 14px;
            color: #9ca3af;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .metric-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .metric-value {
            font-size: 32px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 8px;
        }
        .metric-label {
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 16px;
            border-left: 4px solid #3b82f6;
            padding-left: 12px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .data-table th,
        .data-table td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: left;
        }
        .data-table th {
            background: #f1f5f9;
            font-weight: 600;
            color: #334155;
        }
        .data-table tr:nth-child(even) {
            background: #f8fafc;
        }
        .growth-positive {
            color: #10b981;
            font-weight: 600;
        }
        .growth-negative {
            color: #ef4444;
            font-weight: 600;
        }
        .footer {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid #e2e8f0;
            color: #9ca3af;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .summary-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${config.title}</div>
        ${config.subtitle ? `<div class="subtitle">${config.subtitle}</div>` : ''}
        <div class="meta">
            Time Range: ${timeRangeLabel} | Generated: ${generatedDate}
        </div>
    </div>

    ${config.includeSummary ? `
    <div class="section">
        <div class="section-title">Summary Metrics</div>
        <div class="summary-grid">
            <div class="metric-card">
                <div class="metric-value">${analytics.sessionMetrics.totalSessions.toLocaleString()}</div>
                <div class="metric-label">Total Sessions</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analytics.sessionMetrics.activeSessions.toLocaleString()}</div>
                <div class="metric-label">Active Sessions</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analytics.messageMetrics.totalMessages.toLocaleString()}</div>
                <div class="metric-label">Total Messages</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${ChartUtils.formatDuration(analytics.sessionMetrics.averageSessionDuration)}</div>
                <div class="metric-label">Avg Duration</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analytics.messageMetrics.messagesPerSession}</div>
                <div class="metric-label">Messages/Session</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analytics.performanceMetrics.successRate.toFixed(1)}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
        </div>
    </div>
    ` : ''}

    ${config.includeDetails ? `
    <div class="section">
        <div class="section-title">User Engagement</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>User Type</th>
                    <th>Count</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Authenticated Users</td>
                    <td>${analytics.engagementMetrics.userTypes.authenticated.toLocaleString()}</td>
                    <td>${this.calculatePercentage(analytics.engagementMetrics.userTypes.authenticated, analytics.engagementMetrics.userTypes.authenticated + analytics.engagementMetrics.userTypes.guest)}%</td>
                </tr>
                <tr>
                    <td>Guest Users</td>
                    <td>${analytics.engagementMetrics.userTypes.guest.toLocaleString()}</td>
                    <td>${this.calculatePercentage(analytics.engagementMetrics.userTypes.guest, analytics.engagementMetrics.userTypes.authenticated + analytics.engagementMetrics.userTypes.guest)}%</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Session Length Distribution</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Duration Range</th>
                    <th>Sessions</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${analytics.engagementMetrics.sessionLengthDistribution.map(item => {
                  const total = analytics.engagementMetrics.sessionLengthDistribution.reduce((sum, i) => sum + i.count, 0);
                  const percentage = this.calculatePercentage(item.count, total);
                  return `
                    <tr>
                        <td>${item.range}</td>
                        <td>${item.count.toLocaleString()}</td>
                        <td>${percentage}%</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${analytics.periodComparison ? `
    <div class="section">
        <div class="section-title">Period Comparison</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Growth</th>
                    <th>Trend</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Sessions</td>
                    <td class="${analytics.periodComparison.growth.sessions >= 0 ? 'growth-positive' : 'growth-negative'}">
                        ${analytics.periodComparison.growth.sessions >= 0 ? '+' : ''}${analytics.periodComparison.growth.sessions.toFixed(1)}%
                    </td>
                    <td>${analytics.periodComparison.growth.sessions >= 0 ? '↗️' : '↘️'}</td>
                </tr>
                <tr>
                    <td>Messages</td>
                    <td class="${analytics.periodComparison.growth.messages >= 0 ? 'growth-positive' : 'growth-negative'}">
                        ${analytics.periodComparison.growth.messages >= 0 ? '+' : ''}${analytics.periodComparison.growth.messages.toFixed(1)}%
                    </td>
                    <td>${analytics.periodComparison.growth.messages >= 0 ? '↗️' : '↘️'}</td>
                </tr>
                <tr>
                    <td>Average Duration</td>
                    <td class="${analytics.periodComparison.growth.avgDuration >= 0 ? 'growth-positive' : 'growth-negative'}">
                        ${analytics.periodComparison.growth.avgDuration >= 0 ? '+' : ''}${analytics.periodComparison.growth.avgDuration.toFixed(1)}%
                    </td>
                    <td>${analytics.periodComparison.growth.avgDuration >= 0 ? '↗️' : '↘️'}</td>
                </tr>
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="footer">
        ${config.branding?.companyName || 'Chat Analytics'} | 
        Report generated on ${new Date().toLocaleString()}
    </div>
</body>
</html>`;
  }

  /**
   * Get human-readable time range label
   */
  private static getTimeRangeLabel(timeRange: string): string {
    const labels = {
      '1h': 'Last Hour',
      '24h': 'Last 24 Hours',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      'all': 'All Time',
    };
    return labels[timeRange as keyof typeof labels] || 'Last 24 Hours';
  }

  /**
   * Calculate percentage with proper rounding
   */
  private static calculatePercentage(value: number, total: number): string {
    if (total === 0) return '0.0';
    return ((value / total) * 100).toFixed(1);
  }

  /**
   * Generate quick summary export for basic reporting
   */
  static generateQuickSummary(analytics: AnalyticsData): string {
    const timeRangeLabel = this.getTimeRangeLabel(analytics.timeRange);
    const generatedDate = new Date(analytics.generatedAt).toLocaleDateString();

    return `Chat Analytics Summary - ${timeRangeLabel}
Generated: ${generatedDate}

Key Metrics:
• Total Sessions: ${analytics.sessionMetrics.totalSessions.toLocaleString()}
• Active Sessions: ${analytics.sessionMetrics.activeSessions.toLocaleString()}
• Total Messages: ${analytics.messageMetrics.totalMessages.toLocaleString()}
• Average Duration: ${ChartUtils.formatDuration(analytics.sessionMetrics.averageSessionDuration)}
• Success Rate: ${analytics.performanceMetrics.successRate.toFixed(1)}%

User Distribution:
• Authenticated: ${analytics.engagementMetrics.userTypes.authenticated.toLocaleString()}
• Guest: ${analytics.engagementMetrics.userTypes.guest.toLocaleString()}

${analytics.periodComparison ? `
Growth vs Previous Period:
• Sessions: ${analytics.periodComparison.growth.sessions >= 0 ? '+' : ''}${analytics.periodComparison.growth.sessions.toFixed(1)}%
• Messages: ${analytics.periodComparison.growth.messages >= 0 ? '+' : ''}${analytics.periodComparison.growth.messages.toFixed(1)}%
• Duration: ${analytics.periodComparison.growth.avgDuration >= 0 ? '+' : ''}${analytics.periodComparison.growth.avgDuration.toFixed(1)}%
` : ''}`;
  }
}

/**
 * Export utilities for different file formats
 */
export class ExportUtils {
  /**
   * Create download blob for browser download
   */
  static createDownloadBlob(exportData: ExportData): { blob: Blob; url: string } {
    const blob = new Blob([exportData.content], { type: exportData.mimeType });
    const url = URL.createObjectURL(blob);
    
    return { blob, url };
  }

  /**
   * Trigger browser download
   */
  static triggerDownload(exportData: ExportData): void {
    const { url } = this.createDownloadBlob(exportData);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = exportData.filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Validate export data before processing
   */
  static validateExportData(exportData: ExportData): boolean {
    return !!(
      exportData.filename &&
      exportData.content &&
      exportData.mimeType &&
      exportData.size > 0
    );
  }
}