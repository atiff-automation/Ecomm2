/**
 * Archive Management Utilities
 * Centralized archive operations following DRY principles
 * @CLAUDE.md - Systematic approach with data retention management
 */

import { prisma } from '@/lib/db/prisma';
import { PerformanceMonitor } from '@/lib/db/performance-utils';

export interface ArchiveSession {
  id: string;
  sessionId: string;
  status: string;
  originalStatus: string;
  startedAt: string;
  endedAt?: string;
  lastActivity: string;
  archivedAt: string;
  archiveReason?: string;
  retentionUntil: string;
  messageCount: number;
  userId?: string;
  userEmail?: string;
  userName?: string;
  guestEmail?: string;
  guestPhone?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: any;
  canRestore: boolean;
  daysUntilPurge: number;
}

export interface ArchiveStats {
  totalArchived: number;
  archivedToday: number;
  scheduledForPurge: number;
  storageUsed: number;
  averageRetentionDays: number;
  oldestArchive?: string;
  newestArchive?: string;
}

export interface ArchiveOperation {
  sessionIds: string[];
  reason?: string;
  scheduledPurgeDate?: Date;
}

export interface RestoreOperation {
  sessionIds: string[];
  reason?: string;
  restoreToStatus?: string;
}

/**
 * Centralized archive management engine
 * Following performance-utils pattern for consistency
 */
export class ArchiveManager {
  /**
   * Archive configuration - centralized settings
   * @CLAUDE.md - No hardcoded values, centralized configuration
   */
  static readonly ARCHIVE_CONFIG = {
    // Auto-archive sessions older than 90 days
    AUTO_ARCHIVE_DAYS: 90,
    // Purge archived data after 1 year (365 days)
    RETENTION_DAYS: 365,
    // Batch size for bulk operations
    BATCH_SIZE: 100,
    // Archive statuses
    ARCHIVE_STATUS: 'archived' as const,
    // Restorable statuses (not purged)
    RESTORABLE_STATUSES: ['archived'] as const,
  };

  /**
   * Get archived sessions with pagination and filtering
   * Optimized query with proper indexing
   */
  static async getArchivedSessions(options: {
    page?: number;
    limit?: number;
    search?: string;
    dateRange?: { from: Date; to: Date };
    sortBy?: 'archivedAt' | 'retentionUntil' | 'sessionId';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ sessions: ArchiveSession[]; total: number; stats: ArchiveStats }> {
    const {
      page = 1,
      limit = 50,
      search = '',
      dateRange,
      sortBy = 'archivedAt',
      sortOrder = 'desc',
    } = options;

    const offset = (page - 1) * limit;

    // Build where clause for archived sessions
    const whereClause: any = {
      status: this.ARCHIVE_CONFIG.ARCHIVE_STATUS,
      archivedAt: { not: null },
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { sessionId: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Add date range filter
    if (dateRange) {
      whereClause.archivedAt = {
        gte: dateRange.from,
        lte: dateRange.to,
      };
    }

    // Execute parallel queries for performance
    const [sessions, total, stats] = await Promise.all([
      PerformanceMonitor.measureQueryTime(
        'archive-sessions-fetch',
        () => prisma.chatSession.findMany({
          where: whereClause,
          select: {
            id: true,
            sessionId: true,
            status: true,
            createdAt: true,
            endedAt: true,
            lastActivity: true,
            archivedAt: true,
            archiveReason: true,
            retentionUntil: true,
            guestEmail: true,
            guestPhone: true,
            userAgent: true,
            ipAddress: true,
            metadata: true,
            userId: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: { messages: true },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          take: limit,
          skip: offset,
        })
      ),
      PerformanceMonitor.measureQueryTime(
        'archive-sessions-count',
        () => prisma.chatSession.count({ where: whereClause })
      ),
      this.getArchiveStats(),
    ]);

    // Transform sessions with retention calculations
    const transformedSessions = sessions.map(session => 
      this.transformArchiveSession(session)
    );

    return {
      sessions: transformedSessions,
      total,
      stats,
    };
  }

  /**
   * Transform database session to archive session format
   * Centralized transformation with retention calculations
   */
  private static transformArchiveSession(session: any): ArchiveSession {
    const now = new Date();
    const archivedAt = new Date(session.archivedAt);
    const retentionUntil = new Date(session.retentionUntil || 
      new Date(archivedAt.getTime() + this.ARCHIVE_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000)
    );
    
    const daysUntilPurge = Math.max(0, Math.ceil((retentionUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const canRestore = daysUntilPurge > 0 && this.ARCHIVE_CONFIG.RESTORABLE_STATUSES.includes(session.status);

    return {
      id: session.id,
      sessionId: session.sessionId,
      status: session.status,
      originalStatus: session.metadata?.originalStatus || 'ended',
      startedAt: session.createdAt.toISOString(),
      endedAt: session.endedAt?.toISOString(),
      lastActivity: session.lastActivity.toISOString(),
      archivedAt: session.archivedAt.toISOString(),
      archiveReason: session.archiveReason,
      retentionUntil: retentionUntil.toISOString(),
      messageCount: session._count.messages,
      userId: session.user?.id,
      userEmail: session.user?.email,
      userName: session.user ? `${session.user.firstName} ${session.user.lastName}`.trim() : undefined,
      guestEmail: session.guestEmail,
      guestPhone: session.guestPhone,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      metadata: session.metadata,
      canRestore,
      daysUntilPurge,
    };
  }

  /**
   * Get archive statistics
   * Centralized stats calculation with performance optimization
   */
  static async getArchiveStats(): Promise<ArchiveStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const purgeDate = new Date(now.getTime() - this.ARCHIVE_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const [
      totalArchived,
      archivedToday,
      scheduledForPurge,
      storageData,
      oldestArchive,
      newestArchive,
    ] = await Promise.all([
      prisma.chatSession.count({
        where: { status: this.ARCHIVE_CONFIG.ARCHIVE_STATUS },
      }),
      prisma.chatSession.count({
        where: {
          status: this.ARCHIVE_CONFIG.ARCHIVE_STATUS,
          archivedAt: { gte: todayStart },
        },
      }),
      prisma.chatSession.count({
        where: {
          status: this.ARCHIVE_CONFIG.ARCHIVE_STATUS,
          archivedAt: { lte: purgeDate },
        },
      }),
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as archived_count,
          AVG(EXTRACT(EPOCH FROM (NOW() - "archivedAt"))/86400) as avg_retention_days
        FROM "chat_sessions" 
        WHERE "status" = ${this.ARCHIVE_CONFIG.ARCHIVE_STATUS}
          AND "archivedAt" IS NOT NULL
      `,
      prisma.chatSession.findFirst({
        where: { status: this.ARCHIVE_CONFIG.ARCHIVE_STATUS },
        orderBy: { archivedAt: 'asc' },
        select: { archivedAt: true },
      }),
      prisma.chatSession.findFirst({
        where: { status: this.ARCHIVE_CONFIG.ARCHIVE_STATUS },
        orderBy: { archivedAt: 'desc' },
        select: { archivedAt: true },
      }),
    ]);

    const storageResult = storageData[0] as any;
    const averageRetentionDays = Number(storageResult?.avg_retention_days) || 0;

    return {
      totalArchived,
      archivedToday,
      scheduledForPurge,
      storageUsed: totalArchived * 1024, // Estimated storage in bytes
      averageRetentionDays: Math.round(averageRetentionDays),
      oldestArchive: oldestArchive?.archivedAt?.toISOString(),
      newestArchive: newestArchive?.archivedAt?.toISOString(),
    };
  }

  /**
   * Archive sessions manually or automatically
   * Centralized archiving with transaction safety
   */
  static async archiveSessions(operation: ArchiveOperation): Promise<{
    success: boolean;
    archivedCount: number;
    errors: string[];
  }> {
    const { sessionIds, reason = 'Manual archive', scheduledPurgeDate } = operation;
    const now = new Date();
    const retentionUntil = scheduledPurgeDate || 
      new Date(now.getTime() + this.ARCHIVE_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000);

    let archivedCount = 0;
    const errors: string[] = [];

    // Process in batches for performance
    for (let i = 0; i < sessionIds.length; i += this.ARCHIVE_CONFIG.BATCH_SIZE) {
      const batch = sessionIds.slice(i, i + this.ARCHIVE_CONFIG.BATCH_SIZE);
      
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Get sessions to archive
          const sessions = await tx.chatSession.findMany({
            where: {
              sessionId: { in: batch },
              status: { not: this.ARCHIVE_CONFIG.ARCHIVE_STATUS },
            },
            select: { id: true, sessionId: true, status: true, metadata: true },
          });

          if (sessions.length === 0) {
            return 0;
          }

          // Update sessions to archived status
          const updateResult = await tx.chatSession.updateMany({
            where: { id: { in: sessions.map(s => s.id) } },
            data: {
              status: this.ARCHIVE_CONFIG.ARCHIVE_STATUS,
              archivedAt: now,
              archiveReason: reason,
              retentionUntil,
              metadata: {
                ...sessions[0].metadata,
                originalStatus: sessions[0].status,
                archivedBy: 'system',
                archiveTimestamp: now.toISOString(),
              },
            },
          });

          return updateResult.count;
        });

        archivedCount += result;
      } catch (error) {
        console.error(`Error archiving batch ${i}-${i + batch.length}:`, error);
        errors.push(`Batch ${i}-${i + batch.length}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      archivedCount,
      errors,
    };
  }

  /**
   * Restore archived sessions
   * Centralized restoration with validation
   */
  static async restoreSessions(operation: RestoreOperation): Promise<{
    success: boolean;
    restoredCount: number;
    errors: string[];
  }> {
    const { sessionIds, reason = 'Manual restore', restoreToStatus = 'ended' } = operation;
    
    let restoredCount = 0;
    const errors: string[] = [];

    // Process in batches for performance
    for (let i = 0; i < sessionIds.length; i += this.ARCHIVE_CONFIG.BATCH_SIZE) {
      const batch = sessionIds.slice(i, i + this.ARCHIVE_CONFIG.BATCH_SIZE);
      
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Get archived sessions that can be restored
          const sessions = await tx.chatSession.findMany({
            where: {
              sessionId: { in: batch },
              status: this.ARCHIVE_CONFIG.ARCHIVE_STATUS,
              archivedAt: { not: null },
            },
            select: { id: true, sessionId: true, metadata: true, retentionUntil: true },
          });

          if (sessions.length === 0) {
            return 0;
          }

          // Check if sessions are still within retention period
          const now = new Date();
          const restorableSessions = sessions.filter(session => {
            const retentionUntil = new Date(session.retentionUntil || now);
            return retentionUntil > now;
          });

          if (restorableSessions.length === 0) {
            throw new Error('Sessions are past retention period and cannot be restored');
          }

          // Restore sessions
          const updateResult = await tx.chatSession.updateMany({
            where: { id: { in: restorableSessions.map(s => s.id) } },
            data: {
              status: restoreToStatus,
              archivedAt: null,
              archiveReason: null,
              retentionUntil: null,
              metadata: {
                ...restorableSessions[0].metadata,
                restoredAt: now.toISOString(),
                restoreReason: reason,
                restoredBy: 'system',
              },
            },
          });

          return updateResult.count;
        });

        restoredCount += result;
      } catch (error) {
        console.error(`Error restoring batch ${i}-${i + batch.length}:`, error);
        errors.push(`Batch ${i}-${i + batch.length}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      restoredCount,
      errors,
    };
  }

  /**
   * Purge old archived sessions permanently
   * Careful deletion with retention policy enforcement
   */
  static async purgeOldArchives(): Promise<{
    success: boolean;
    purgedCount: number;
    errors: string[];
  }> {
    const now = new Date();
    const purgeDate = new Date(now.getTime() - this.ARCHIVE_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    
    let purgedCount = 0;
    const errors: string[] = [];

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Find sessions to purge
        const sessionsToPurge = await tx.chatSession.findMany({
          where: {
            status: this.ARCHIVE_CONFIG.ARCHIVE_STATUS,
            archivedAt: { lte: purgeDate },
          },
          select: { id: true, sessionId: true },
          take: this.ARCHIVE_CONFIG.BATCH_SIZE,
        });

        if (sessionsToPurge.length === 0) {
          return 0;
        }

        // Delete related messages first (cascade)
        await tx.chatMessage.deleteMany({
          where: {
            sessionId: { in: sessionsToPurge.map(s => s.sessionId) },
          },
        });

        // Delete sessions
        const deleteResult = await tx.chatSession.deleteMany({
          where: {
            id: { in: sessionsToPurge.map(s => s.id) },
          },
        });

        return deleteResult.count;
      });

      purgedCount = result;
    } catch (error) {
      console.error('Error purging old archives:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return {
      success: errors.length === 0,
      purgedCount,
      errors,
    };
  }

  /**
   * Auto-archive old sessions
   * Automated archiving based on age criteria
   */
  static async autoArchiveOldSessions(): Promise<{
    success: boolean;
    archivedCount: number;
    errors: string[];
  }> {
    const cutoffDate = new Date(
      Date.now() - this.ARCHIVE_CONFIG.AUTO_ARCHIVE_DAYS * 24 * 60 * 60 * 1000
    );

    try {
      // Find sessions to auto-archive
      const sessionsToArchive = await prisma.chatSession.findMany({
        where: {
          lastActivity: { lte: cutoffDate },
          status: { notIn: [this.ARCHIVE_CONFIG.ARCHIVE_STATUS, 'active'] },
          archivedAt: null,
        },
        select: { sessionId: true },
        take: this.ARCHIVE_CONFIG.BATCH_SIZE * 10, // Larger batch for auto-archiving
      });

      if (sessionsToArchive.length === 0) {
        return { success: true, archivedCount: 0, errors: [] };
      }

      const sessionIds = sessionsToArchive.map(s => s.sessionId);
      
      return await this.archiveSessions({
        sessionIds,
        reason: `Auto-archived: inactive for ${this.ARCHIVE_CONFIG.AUTO_ARCHIVE_DAYS} days`,
      });
    } catch (error) {
      console.error('Error in auto-archive process:', error);
      return {
        success: false,
        archivedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get archive retention policy information
   * Centralized policy documentation
   */
  static getRetentionPolicy(): {
    autoArchiveDays: number;
    retentionDays: number;
    description: string;
    warningThreshold: number;
  } {
    return {
      autoArchiveDays: this.ARCHIVE_CONFIG.AUTO_ARCHIVE_DAYS,
      retentionDays: this.ARCHIVE_CONFIG.RETENTION_DAYS,
      description: `Sessions are automatically archived after ${this.ARCHIVE_CONFIG.AUTO_ARCHIVE_DAYS} days of inactivity and permanently deleted after ${this.ARCHIVE_CONFIG.RETENTION_DAYS} days in archive.`,
      warningThreshold: 30, // Warn when 30 days until purge
    };
  }

  /**
   * Validate archive operations
   * Centralized validation logic
   */
  static validateArchiveOperation(operation: ArchiveOperation): string[] {
    const errors: string[] = [];

    if (!operation.sessionIds || operation.sessionIds.length === 0) {
      errors.push('No session IDs provided');
    }

    if (operation.sessionIds && operation.sessionIds.length > this.ARCHIVE_CONFIG.BATCH_SIZE * 10) {
      errors.push(`Too many sessions selected. Maximum: ${this.ARCHIVE_CONFIG.BATCH_SIZE * 10}`);
    }

    if (operation.scheduledPurgeDate) {
      const maxRetention = new Date(Date.now() + this.ARCHIVE_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000);
      if (operation.scheduledPurgeDate > maxRetention) {
        errors.push(`Scheduled purge date cannot exceed maximum retention period of ${this.ARCHIVE_CONFIG.RETENTION_DAYS} days`);
      }
    }

    return errors;
  }

  /**
   * Validate restore operations
   * Centralized restore validation
   */
  static validateRestoreOperation(operation: RestoreOperation): string[] {
    const errors: string[] = [];

    if (!operation.sessionIds || operation.sessionIds.length === 0) {
      errors.push('No session IDs provided');
    }

    if (operation.sessionIds && operation.sessionIds.length > this.ARCHIVE_CONFIG.BATCH_SIZE * 5) {
      errors.push(`Too many sessions selected for restore. Maximum: ${this.ARCHIVE_CONFIG.BATCH_SIZE * 5}`);
    }

    const validStatuses = ['ended', 'completed', 'inactive'];
    if (operation.restoreToStatus && !validStatuses.includes(operation.restoreToStatus)) {
      errors.push(`Invalid restore status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return errors;
  }
}