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
    // Using a simple text-based PDF generation for now
    // In production, you might want to use a library like puppeteer or pdfkit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Chat Sessions Export Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12);
      doc.text(`Export Date: ${new Date().toISOString()}`);
      doc.text(`Total Sessions: ${sessions.length}`);
      doc.text(`Total Messages: ${sessions.reduce((acc, session) => acc + (session.messages?.length || 0), 0)}`);
      doc.moveDown();

      // Sessions
      for (const session of sessions) {
        doc.fontSize(14).text(`Session: ${session.sessionId}`, { underline: true });
        doc.fontSize(10);
        doc.text(`Status: ${session.status}`);
        doc.text(`Created: ${session.createdAt.toISOString()}`);
        if (session.userId) doc.text(`User ID: ${session.userId}`);
        if (session.guestEmail) doc.text(`Guest Email: ${session.guestEmail}`);
        if (session.guestPhone) doc.text(`Guest Phone: ${session.guestPhone}`);

        if (includeMessages && session.messages && session.messages.length > 0) {
          doc.moveDown(0.5);
          doc.text('Messages:', { underline: true });

          for (const message of session.messages) {
            doc.text(`[${message.createdAt.toISOString()}] ${message.senderType}: ${message.content}`);
          }
        }

        doc.moveDown();

        // Add page break if needed
        if (doc.y > 700) {
          doc.addPage();
        }
      }

      doc.end();
    });
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