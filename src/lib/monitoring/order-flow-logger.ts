/**
 * Order Flow Debug Logger
 * Logs all API calls, payloads, and responses for manual testing
 *
 * Usage:
 *   import { orderFlowLogger } from '@/lib/monitoring/order-flow-logger';
 *   orderFlowLogger.logRequest('Step Name', '/api/endpoint', payload);
 *   orderFlowLogger.logResponse('Step Name', '/api/endpoint', response);
 *   orderFlowLogger.logError('Step Name', error, context);
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOG_DIR = join(process.cwd(), 'logs', 'order-flow');
const SESSION_FILE = join(LOG_DIR, `session-${Date.now()}.log`);

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

export interface LogEntry {
  timestamp: string;
  step: string;
  type: 'REQUEST' | 'RESPONSE' | 'ERROR' | 'INFO';
  data: any;
  orderNumber?: string;
  orderId?: string;
}

class OrderFlowLogger {
  private sessionId: string;
  private logs: LogEntry[] = [];
  private isEnabled: boolean;

  constructor() {
    this.sessionId = `SESSION-${Date.now()}`;
    this.isEnabled = process.env.DEBUG === 'order-flow' ||
                     process.env.NODE_ENV === 'development';

    if (this.isEnabled) {
      this.log('INFO', 'Session Started', {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
    }
  }

  /**
   * Log API request
   */
  logRequest(step: string, endpoint: string, payload: any, orderId?: string) {
    if (!this.isEnabled) return;

    this.log('REQUEST', step, {
      endpoint,
      payload: this.sanitizePayload(payload),
      orderId
    });
  }

  /**
   * Log API response
   */
  logResponse(step: string, endpoint: string, response: any, orderId?: string) {
    if (!this.isEnabled) return;

    this.log('RESPONSE', step, {
      endpoint,
      response: this.sanitizePayload(response),
      orderId
    });
  }

  /**
   * Log error
   */
  logError(step: string, error: any, context?: any) {
    if (!this.isEnabled) return;

    this.log('ERROR', step, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      context
    });
  }

  /**
   * Log info
   */
  logInfo(step: string, message: string, data?: any) {
    if (!this.isEnabled) return;

    this.log('INFO', step, { message, ...data });
  }

  /**
   * Core logging function
   */
  private log(type: LogEntry['type'], step: string, data: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      step,
      type,
      data,
      orderNumber: data?.orderNumber || data?.orderId
    };

    this.logs.push(entry);

    // Console output with color coding
    const color = {
      REQUEST: '\x1b[36m',  // Cyan
      RESPONSE: '\x1b[32m', // Green
      ERROR: '\x1b[31m',    // Red
      INFO: '\x1b[33m'      // Yellow
    }[type];

    console.log(`\n${color}[${type}]\x1b[0m ${step}`);
    console.log(JSON.stringify(data, null, 2));
    console.log('─'.repeat(60));

    // Write to file
    this.writeToFile(entry);
  }

  /**
   * Write log entry to file
   */
  private writeToFile(entry: LogEntry) {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      appendFileSync(SESSION_FILE, logLine);
    } catch (error) {
      // Silently fail if can't write to file
      console.error('Failed to write log file:', error);
    }
  }

  /**
   * Sanitize sensitive data from payloads
   */
  private sanitizePayload(payload: any): any {
    if (!payload) return payload;

    const sanitized = { ...payload };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'apiKey',
      'api_key',
      'api',
      'token',
      'secret',
      'creditCard',
      'cvv',
      'cardNumber',
      'securityCode'
    ];

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      const sanitizedObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitizedObj[key] = '***REDACTED***';
        } else {
          sanitizedObj[key] = sanitizeObject(value);
        }
      }
      return sanitizedObj;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Generate summary report
   */
  generateSummary() {
    const summary = {
      sessionId: this.sessionId,
      totalLogs: this.logs.length,
      requests: this.logs.filter(l => l.type === 'REQUEST').length,
      responses: this.logs.filter(l => l.type === 'RESPONSE').length,
      errors: this.logs.filter(l => l.type === 'ERROR').length,
      steps: [...new Set(this.logs.map(l => l.step))],
      errorSteps: this.logs
        .filter(l => l.type === 'ERROR')
        .map(l => ({ step: l.step, error: l.data }))
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 SESSION SUMMARY');
    console.log('='.repeat(60));
    console.log(JSON.stringify(summary, null, 2));
    console.log('='.repeat(60));

    // Write summary file
    try {
      const summaryFile = join(LOG_DIR, `summary-${Date.now()}.json`);
      writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    } catch (error) {
      console.error('Failed to write summary file:', error);
    }

    return summary;
  }

  /**
   * Export logs as JSON
   */
  exportLogs(filename?: string) {
    const file = filename || join(LOG_DIR, `export-${Date.now()}.json`);

    try {
      writeFileSync(file, JSON.stringify(this.logs, null, 2));
      console.log(`✅ Logs exported to: ${file}`);
      return file;
    } catch (error) {
      console.error('Failed to export logs:', error);
      return null;
    }
  }

  /**
   * Get current session ID
   */
  getSessionId() {
    return this.sessionId;
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs;
  }
}

// Singleton instance
export const orderFlowLogger = new OrderFlowLogger();
