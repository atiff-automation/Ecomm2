/**
 * Chat Export Service
 * Centralized export functionality following DRY principles
 */

import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import {
  ExportOptions,
  ChatSessionData,
  validateExportOptions,
  validateDateRange,
  generateExportFilename,
  logDataOperation,
  getDataManagementConfig,
} from './data-management';

export class ChatExportService {
  private static instance: ChatExportService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): ChatExportService {
    if (!ChatExportService.instance) {
      ChatExportService.instance = new ChatExportService();
    }
    return ChatExportService.instance;
  }

  async exportByDateRange(options: ExportOptions): Promise<Buffer> {
    logDataOperation('export_started', { options });

    // Validate options
    const validation = validateExportOptions(options);
    if (!validation.isValid) {
      throw new Error(`Invalid export options: ${validation.errors.join(', ')}`);
    }

    const dateValidation = validateDateRange(options.startDate, options.endDate);
    if (!dateValidation.isValid) {
      throw new Error(`Invalid date range: ${dateValidation.errors.join(', ')}`);
    }

    try {
      // Fetch data from database
      const sessions = await this.fetchSessionsInDateRange(options.startDate, options.endDate, options.includeMessages);

      logDataOperation('export_data_fetched', {
        sessionCount: sessions.length,
        messageCount: sessions.reduce((acc, session) => acc + (session.messages?.length || 0), 0),
      });

      // Generate export based on format
      let buffer: Buffer;
      switch (options.format) {
        case 'json':
          buffer = await this.generateJSONExport(sessions);
          break;
        case 'csv':
          buffer = await this.generateCSVExport(sessions, options.includeMessages);
          break;
        case 'pdf':
          buffer = await this.generatePDFExport(sessions, options.includeMessages);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      logDataOperation('export_completed', {
        format: options.format,
        fileSize: buffer.length,
        sessionCount: sessions.length,
      });

      return buffer;
    } catch (error) {
      logDataOperation('export_failed', { error: error instanceof Error ? error.message : 'Unknown error' }, 'error');
      throw error;
    }
  }

  async generateFilename(options: ExportOptions): string {
    return generateExportFilename(options);
  }

  private async fetchSessionsInDateRange(
    startDate: Date,
    endDate: Date,
    includeMessages: boolean
  ): Promise<ChatSessionData[]> {
    const sessions = await this.prisma.chatSession.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        messages: includeMessages,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId || undefined,
      guestEmail: session.guestEmail || undefined,
      status: session.status,
      metadata: session.metadata,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      endedAt: session.endedAt || undefined,
      guestPhone: session.guestPhone || undefined,
      ipAddress: session.ipAddress || undefined,
      lastActivity: session.lastActivity,
      sessionId: session.sessionId,
      userAgent: session.userAgent || undefined,
      messages: (session.messages || []).map(message => ({
        id: message.id,
        sessionId: message.sessionId,
        senderType: message.senderType,
        content: message.content,
        messageType: message.messageType,
        metadata: message.metadata,
        status: message.status,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      })),
    }));
  }

  private async generateJSONExport(sessions: ChatSessionData[]): Promise<Buffer> {
    const config = getDataManagementConfig();
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        sessionCount: sessions.length,
        messageCount: sessions.reduce((acc, session) => acc + (session.messages?.length || 0), 0),
        retentionPolicy: config,
      },
      sessions,
    };

    return Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8');
  }

  private async generateCSVExport(sessions: ChatSessionData[], includeMessages: boolean): Promise<Buffer> {
    let csvContent = '';

    if (includeMessages) {
      // Combined sessions and messages CSV
      csvContent = 'Session ID,User ID,Guest Email,Guest Phone,Status,Session Created,Message ID,Sender Type,Content,Message Type,Message Created\n';

      for (const session of sessions) {
        if (session.messages && session.messages.length > 0) {
          for (const message of session.messages) {
            const row = [
              this.escapeCsvValue(session.sessionId),
              this.escapeCsvValue(session.userId || ''),
              this.escapeCsvValue(session.guestEmail || ''),
              this.escapeCsvValue(session.guestPhone || ''),
              this.escapeCsvValue(session.status),
              this.escapeCsvValue(session.createdAt.toISOString()),
              this.escapeCsvValue(message.id),
              this.escapeCsvValue(message.senderType),
              this.escapeCsvValue(message.content),
              this.escapeCsvValue(message.messageType),
              this.escapeCsvValue(message.createdAt.toISOString()),
            ].join(',');
            csvContent += row + '\n';
          }
        } else {
          // Session without messages
          const row = [
            this.escapeCsvValue(session.sessionId),
            this.escapeCsvValue(session.userId || ''),
            this.escapeCsvValue(session.guestEmail || ''),
            this.escapeCsvValue(session.guestPhone || ''),
            this.escapeCsvValue(session.status),
            this.escapeCsvValue(session.createdAt.toISOString()),
            '', '', '', '', '',
          ].join(',');
          csvContent += row + '\n';
        }
      }
    } else {
      // Sessions only CSV
      csvContent = 'Session ID,User ID,Guest Email,Guest Phone,Status,IP Address,User Agent,Created At,Last Activity,Ended At\n';

      for (const session of sessions) {
        const row = [
          this.escapeCsvValue(session.sessionId),
          this.escapeCsvValue(session.userId || ''),
          this.escapeCsvValue(session.guestEmail || ''),
          this.escapeCsvValue(session.guestPhone || ''),
          this.escapeCsvValue(session.status),
          this.escapeCsvValue(session.ipAddress || ''),
          this.escapeCsvValue(session.userAgent || ''),
          this.escapeCsvValue(session.createdAt.toISOString()),
          this.escapeCsvValue(session.lastActivity.toISOString()),
          this.escapeCsvValue(session.endedAt?.toISOString() || ''),
        ].join(',');
        csvContent += row + '\n';
      }
    }

    return Buffer.from(csvContent, 'utf-8');
  }

  private async generatePDFExport(sessions: ChatSessionData[], includeMessages: boolean): Promise<Buffer> {
    // Using puppeteer for PDF generation since pdfkit has font path issues in Next.js
    const puppeteer = require('puppeteer');

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Generate HTML content
      const htmlContent = this.generatePDFHTMLContent(sessions, includeMessages);

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return pdfBuffer;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private generatePDFHTMLContent(sessions: ChatSessionData[], includeMessages: boolean): string {
    const totalMessages = sessions.reduce((acc, session) => acc + (session.messages?.length || 0), 0);

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Chat Sessions Export Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .metadata { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          .session { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          .session-header { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .session-info { margin-bottom: 15px; }
          .session-info div { margin: 3px 0; }
          .messages { margin-top: 15px; }
          .messages h4 { margin-bottom: 10px; text-decoration: underline; }
          .message { margin: 8px 0; padding: 8px; border-radius: 8px; }
          .message.user { background: #eff6ff; border-left: 3px solid #2563eb; }
          .message.bot { background: #f0fdf4; border-left: 3px solid #16a34a; }
          .message.system { background: #fff7ed; border-left: 3px solid #ea580c; }
          .message-meta { font-size: 12px; color: #666; margin-bottom: 5px; }
          .message-content { font-size: 14px; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Chat Sessions Export Report</h1>
        </div>

        <div class="metadata">
          <div><strong>Export Date:</strong> ${new Date().toISOString()}</div>
          <div><strong>Total Sessions:</strong> ${sessions.length}</div>
          <div><strong>Total Messages:</strong> ${totalMessages}</div>
        </div>
    `;

    sessions.forEach((session, index) => {
      if (index > 0 && index % 5 === 0) {
        html += '<div class="page-break"></div>';
      }

      html += `
        <div class="session">
          <div class="session-header">Session: ${session.sessionId}</div>
          <div class="session-info">
            <div><strong>Status:</strong> ${session.status}</div>
            <div><strong>Created:</strong> ${session.createdAt.toISOString()}</div>
            ${session.userId ? `<div><strong>User ID:</strong> ${session.userId}</div>` : ''}
            ${session.guestEmail ? `<div><strong>Guest Email:</strong> ${session.guestEmail}</div>` : ''}
            ${session.guestPhone ? `<div><strong>Guest Phone:</strong> ${session.guestPhone}</div>` : ''}
            ${session.lastActivity ? `<div><strong>Last Activity:</strong> ${session.lastActivity.toISOString()}</div>` : ''}
          </div>
      `;

      if (includeMessages && session.messages && session.messages.length > 0) {
        html += `
          <div class="messages">
            <h4>Messages:</h4>
        `;

        session.messages.forEach(message => {
          html += `
            <div class="message ${message.senderType}">
              <div class="message-meta">[${message.createdAt.toISOString()}] ${message.senderType}</div>
              <div class="message-content">${this.escapeHtml(message.content)}</div>
            </div>
          `;
        });

        html += '</div>';
      }

      html += '</div>';
    });

    html += `
      </body>
      </html>
    `;

    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}