/**
 * Chat Data Cleanup Service
 * Systematic data deletion following retention policy
 */

import { PrismaClient } from '@prisma/client';
import {
  DeletionResult,
  getDataManagementConfig,
  getCutoffDate,
  logDataOperation,
} from './data-management';

export class ChatCleanupService {
  private static instance: ChatCleanupService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): ChatCleanupService {
    if (!ChatCleanupService.instance) {
      ChatCleanupService.instance = new ChatCleanupService();
    }
    return ChatCleanupService.instance;
  }

  async performScheduledCleanup(): Promise<DeletionResult> {
    const config = getDataManagementConfig();

    if (!config.autoDeleteEnabled) {
      logDataOperation('cleanup_disabled', { reason: 'Auto delete is disabled' });
      return { success: true, deletedSessionsCount: 0, deletedMessagesCount: 0 };
    }

    logDataOperation('cleanup_started', { config });

    try {
      const cutoffDate = getCutoffDate(config.retentionDays, config.gracePeriodDays);

      logDataOperation('cleanup_cutoff_calculated', {
        cutoffDate: cutoffDate.toISOString(),
        retentionDays: config.retentionDays,
        gracePeriodDays: config.gracePeriodDays,
      });

      // Find sessions to be deleted
      const sessionsToDelete = await this.prisma.chatSession.findMany({
        where: {
          lastActivity: {
            lt: cutoffDate,
          },
        },
        select: {
          id: true,
          sessionId: true,
          createdAt: true,
          lastActivity: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

      if (sessionsToDelete.length === 0) {
        logDataOperation('cleanup_no_data_to_delete', { cutoffDate: cutoffDate.toISOString() });
        return { success: true, deletedSessionsCount: 0, deletedMessagesCount: 0 };
      }

      const totalMessagesToDelete = sessionsToDelete.reduce(
        (acc, session) => acc + session._count.messages,
        0
      );

      logDataOperation('cleanup_sessions_identified', {
        sessionCount: sessionsToDelete.length,
        messageCount: totalMessagesToDelete,
        oldestSession: sessionsToDelete[0]?.lastActivity.toISOString(),
      });

      // Perform deletion in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Delete messages first (due to foreign key constraints)
        const deletedMessages = await tx.chatMessage.deleteMany({
          where: {
            sessionId: {
              in: sessionsToDelete.map(session => session.id),
            },
          },
        });

        // Delete chat webhook queue entries
        await tx.chatWebhookQueue.deleteMany({
          where: {
            message: {
              sessionId: {
                in: sessionsToDelete.map(session => session.id),
              },
            },
          },
        });

        // Delete sessions
        const deletedSessions = await tx.chatSession.deleteMany({
          where: {
            id: {
              in: sessionsToDelete.map(session => session.id),
            },
          },
        });

        return {
          deletedSessionsCount: deletedSessions.count,
          deletedMessagesCount: deletedMessages.count,
        };
      });

      logDataOperation('cleanup_completed', {
        deletedSessionsCount: result.deletedSessionsCount,
        deletedMessagesCount: result.deletedMessagesCount,
        cutoffDate: cutoffDate.toISOString(),
      });

      return {
        success: true,
        deletedSessionsCount: result.deletedSessionsCount,
        deletedMessagesCount: result.deletedMessagesCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logDataOperation('cleanup_failed', { error: errorMessage }, 'error');

      return {
        success: false,
        deletedSessionsCount: 0,
        deletedMessagesCount: 0,
        error: errorMessage,
      };
    }
  }

  async getCleanupPreview(): Promise<{
    sessionCount: number;
    messageCount: number;
    cutoffDate: Date;
    oldestSessionDate?: Date;
    newestSessionDate?: Date;
  }> {
    const config = getDataManagementConfig();
    const cutoffDate = getCutoffDate(config.retentionDays, config.gracePeriodDays);

    try {
      const result = await this.prisma.chatSession.aggregate({
        where: {
          lastActivity: {
            lt: cutoffDate,
          },
        },
        _count: {
          id: true,
        },
        _min: {
          lastActivity: true,
        },
        _max: {
          lastActivity: true,
        },
      });

      const messageCount = await this.prisma.chatMessage.count({
        where: {
          session: {
            lastActivity: {
              lt: cutoffDate,
            },
          },
        },
      });

      return {
        sessionCount: result._count.id,
        messageCount,
        cutoffDate,
        oldestSessionDate: result._min.lastActivity || undefined,
        newestSessionDate: result._max.lastActivity || undefined,
      };
    } catch (error) {
      logDataOperation('cleanup_preview_failed', { error: error instanceof Error ? error.message : 'Unknown error' }, 'error');
      throw error;
    }
  }

  async forceCleanupBefore(beforeDate: Date): Promise<DeletionResult> {
    logDataOperation('force_cleanup_started', { beforeDate: beforeDate.toISOString() });

    try {
      // Find sessions to be deleted
      const sessionsToDelete = await this.prisma.chatSession.findMany({
        where: {
          lastActivity: {
            lt: beforeDate,
          },
        },
        select: {
          id: true,
          sessionId: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

      if (sessionsToDelete.length === 0) {
        return { success: true, deletedSessionsCount: 0, deletedMessagesCount: 0 };
      }

      // Perform deletion in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Delete messages first
        const deletedMessages = await tx.chatMessage.deleteMany({
          where: {
            sessionId: {
              in: sessionsToDelete.map(session => session.id),
            },
          },
        });

        // Delete webhook queue entries
        await tx.chatWebhookQueue.deleteMany({
          where: {
            message: {
              sessionId: {
                in: sessionsToDelete.map(session => session.id),
              },
            },
          },
        });

        // Delete sessions
        const deletedSessions = await tx.chatSession.deleteMany({
          where: {
            id: {
              in: sessionsToDelete.map(session => session.id),
            },
          },
        });

        return {
          deletedSessionsCount: deletedSessions.count,
          deletedMessagesCount: deletedMessages.count,
        };
      });

      logDataOperation('force_cleanup_completed', {
        deletedSessionsCount: result.deletedSessionsCount,
        deletedMessagesCount: result.deletedMessagesCount,
        beforeDate: beforeDate.toISOString(),
      });

      return {
        success: true,
        deletedSessionsCount: result.deletedSessionsCount,
        deletedMessagesCount: result.deletedMessagesCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logDataOperation('force_cleanup_failed', { error: errorMessage }, 'error');

      return {
        success: false,
        deletedSessionsCount: 0,
        deletedMessagesCount: 0,
        error: errorMessage,
      };
    }
  }

  async getRetentionStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    sessionsAtRisk: number;
    messagesAtRisk: number;
    nextCleanupDate?: Date;
    config: ReturnType<typeof getDataManagementConfig>;
  }> {
    const config = getDataManagementConfig();

    try {
      const [totalSessions, totalMessages] = await Promise.all([
        this.prisma.chatSession.count(),
        this.prisma.chatMessage.count(),
      ]);

      let sessionsAtRisk = 0;
      let messagesAtRisk = 0;
      let nextCleanupDate: Date | undefined;

      if (config.autoDeleteEnabled) {
        const cutoffDate = getCutoffDate(config.retentionDays, config.gracePeriodDays);

        [sessionsAtRisk, messagesAtRisk] = await Promise.all([
          this.prisma.chatSession.count({
            where: {
              lastActivity: {
                lt: cutoffDate,
              },
            },
          }),
          this.prisma.chatMessage.count({
            where: {
              session: {
                lastActivity: {
                  lt: cutoffDate,
                },
              },
            },
          }),
        ]);

        // Calculate next cleanup date (assuming daily cleanup)
        nextCleanupDate = new Date();
        nextCleanupDate.setDate(nextCleanupDate.getDate() + 1);
        nextCleanupDate.setHours(3, 0, 0, 0); // 3 AM next day
      }

      return {
        totalSessions,
        totalMessages,
        sessionsAtRisk,
        messagesAtRisk,
        nextCleanupDate,
        config,
      };
    } catch (error) {
      logDataOperation('retention_stats_failed', { error: error instanceof Error ? error.message : 'Unknown error' }, 'error');
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}