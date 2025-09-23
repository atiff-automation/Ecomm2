/**
 * Chat Backup Service
 * Monthly backup functionality following centralized approach
 */

import { PrismaClient, ChatBackup } from '@prisma/client';
import { writeFile, access, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import {
  BackupResult,
  getDataManagementConfig,
  generateBackupFilename,
  getMonthRange,
  createBackupMetadata,
  createErrorResult,
  createSuccessResult,
  logDataOperation,
  ChatSessionData,
} from './data-management';

export class ChatBackupService {
  private static instance: ChatBackupService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): ChatBackupService {
    if (!ChatBackupService.instance) {
      ChatBackupService.instance = new ChatBackupService();
    }
    return ChatBackupService.instance;
  }

  async createMonthlyBackup(year: number, month: number): Promise<BackupResult> {
    const config = getDataManagementConfig();

    if (!config.backupEnabled) {
      return createErrorResult('Backup is disabled in configuration');
    }

    logDataOperation('monthly_backup_started', { year, month });

    try {
      // Check if backup already exists
      const existingBackup = await this.prisma.chatBackup.findUnique({
        where: { month_year: { month, year } },
      });

      if (existingBackup && existingBackup.status === 'completed') {
        logDataOperation('monthly_backup_already_exists', { year, month }, 'warn');
        return createErrorResult(`Backup for ${year}-${month} already exists`);
      }

      try {
        // Fetch data for the month first to get session count
        const { start, end } = getMonthRange(year, month);
        const sessions = await this.fetchSessionsForBackup(start, end);

        // Generate filename with session count
        const filename = generateBackupFilename(year, month, sessions.length);
        const filePath = join(process.cwd(), config.backupDirectory, filename);

        // Create backup record in database
        const backupRecord = await this.prisma.chatBackup.upsert({
          where: { month_year: { month, year } },
          update: {
            status: 'in_progress',
            filename,
          },
          create: {
            filename,
            month,
            year,
            status: 'in_progress',
            fileSize: 0,
            sessionCount: 0,
          },
        });

        try {
          // Create backup data
          const backupData = {
            metadata: createBackupMetadata(sessions.length, 0),
            period: { year, month, start: start.toISOString(), end: end.toISOString() },
            sessions,
          };

          // Ensure backup directory exists
          await this.ensureBackupDirectory(config.backupDirectory);

          // Write backup file
          const backupContent = JSON.stringify(backupData, null, 2);
          await writeFile(filePath, backupContent, 'utf-8');

          // Get file size
          const fileStats = await stat(filePath);
          const fileSize = fileStats.size;

          // Update backup record
          await this.prisma.chatBackup.update({
            where: { id: backupRecord.id },
            data: {
              status: 'completed',
              fileSize: BigInt(fileSize),
              sessionCount: sessions.length,
            },
          });

          logDataOperation('monthly_backup_completed', {
            year,
            month,
            filename,
            fileSize,
            sessionCount: sessions.length,
          });

          return createSuccessResult(filename, fileSize, sessions.length);
        } catch (error) {
          // Update backup record to failed
          await this.prisma.chatBackup.update({
            where: { id: backupRecord.id },
            data: {
              status: 'failed',
            },
          });

          throw error;
        }
      } catch (error) {
        // Handle error from the outer try block
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logDataOperation('monthly_backup_failed', { year, month, error: errorMessage }, 'error');
      return createErrorResult(errorMessage);
    }
  }

  async getAvailableBackups(): Promise<ChatBackup[]> {
    try {
      const backups = await this.prisma.chatBackup.findMany({
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });

      return backups;
    } catch (error) {
      logDataOperation('get_backups_failed', { error: error instanceof Error ? error.message : 'Unknown error' }, 'error');
      throw error;
    }
  }

  async getBackupById(id: string): Promise<ChatBackup | null> {
    try {
      return await this.prisma.chatBackup.findUnique({
        where: { id },
      });
    } catch (error) {
      logDataOperation('get_backup_failed', { id, error: error instanceof Error ? error.message : 'Unknown error' }, 'error');
      throw error;
    }
  }

  async getBackupByFilename(filename: string): Promise<ChatBackup | null> {
    try {
      return await this.prisma.chatBackup.findUnique({
        where: { filename },
      });
    } catch (error) {
      logDataOperation('get_backup_by_filename_failed', { filename, error: error instanceof Error ? error.message : 'Unknown error' }, 'error');
      throw error;
    }
  }

  async deleteBackup(id: string): Promise<boolean> {
    try {
      const backup = await this.prisma.chatBackup.findUnique({
        where: { id },
      });

      if (!backup) {
        return false;
      }

      const config = getDataManagementConfig();
      const filePath = join(process.cwd(), config.backupDirectory, backup.filename);

      // Try to delete the file (don't fail if file doesn't exist)
      try {
        await access(filePath);
        // File exists, you might want to implement file deletion here
        // For now, we'll just log it
        logDataOperation('backup_file_deletion_needed', { filePath });
      } catch {
        // File doesn't exist, that's okay
      }

      // Delete the database record
      await this.prisma.chatBackup.delete({
        where: { id },
      });

      logDataOperation('backup_deleted', { id, filename: backup.filename });
      return true;
    } catch (error) {
      logDataOperation('delete_backup_failed', { id, error: error instanceof Error ? error.message : 'Unknown error' }, 'error');
      throw error;
    }
  }

  async getBackupFilePath(filename: string): Promise<string> {
    const config = getDataManagementConfig();
    return join(process.cwd(), config.backupDirectory, filename);
  }

  async validateBackupIntegrity(backup: ChatBackup): Promise<boolean> {
    try {
      const filePath = await this.getBackupFilePath(backup.filename);
      await access(filePath);

      const fileStats = await stat(filePath);
      const currentFileSize = fileStats.size;

      // Check if file size matches
      if (BigInt(currentFileSize) !== backup.fileSize) {
        logDataOperation('backup_integrity_check_failed', {
          filename: backup.filename,
          expectedSize: backup.fileSize.toString(),
          actualSize: currentFileSize,
        }, 'warn');
        return false;
      }

      return true;
    } catch (error) {
      logDataOperation('backup_integrity_check_error', {
        filename: backup.filename,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'error');
      return false;
    }
  }

  private async fetchSessionsForBackup(startDate: Date, endDate: Date): Promise<ChatSessionData[]> {
    const sessions = await this.prisma.chatSession.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        messages: true,
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
        createdAt: 'asc',
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

  private async ensureBackupDirectory(backupDirectory: string): Promise<void> {
    const fullPath = join(process.cwd(), backupDirectory);

    try {
      await access(fullPath);
    } catch {
      // Directory doesn't exist, create it
      await mkdir(fullPath, { recursive: true });
      logDataOperation('backup_directory_created', { path: fullPath });
    }
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}