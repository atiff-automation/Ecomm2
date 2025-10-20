/**
 * Webhook Logging Utility
 * Simple file-based logging for webhook evidence without database changes
 */

import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs', 'webhooks');

// Ensure log directory exists
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

interface WebhookLogEntry {
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: any;
  query?: any;
  clientIp?: string;
  processed: boolean;
  result?: {
    success: boolean;
    orderNumber?: string;
    billCode?: string;
    status?: string;
    error?: string;
  };
}

/**
 * Log webhook request to file
 */
export function logWebhookRequest(entry: WebhookLogEntry): void {
  try {
    ensureLogDir();

    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(LOG_DIR, `toyyibpay-${date}.json`);

    // Read existing logs
    let logs: WebhookLogEntry[] = [];
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf-8');
      logs = JSON.parse(content);
    }

    // Append new log
    logs.push(entry);

    // Write back to file
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf-8');

    console.log(`✅ Webhook logged to: ${logFile}`);
  } catch (error) {
    console.error('❌ Failed to log webhook:', error);
  }
}

/**
 * Get all webhook logs for a specific date
 */
export function getWebhookLogs(date: string): WebhookLogEntry[] {
  try {
    const logFile = path.join(LOG_DIR, `toyyibpay-${date}.json`);
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf-8');
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error('Failed to read webhook logs:', error);
    return [];
  }
}

/**
 * Get recent webhook logs (last N days)
 */
export function getRecentWebhookLogs(days: number = 7): WebhookLogEntry[] {
  const logs: WebhookLogEntry[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = getWebhookLogs(dateStr);
    logs.push(...dayLogs);
  }

  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
