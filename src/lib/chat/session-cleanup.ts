/**
 * Chat Session Cleanup Service
 * Handles expiration and cleanup of chat sessions
 * Following existing cleanup patterns from pending-membership and tracking systems
 */

import { prisma } from '@/lib/db/prisma';
import { CHAT_CONFIG } from './validation';
import { getSessionTimeouts } from './config';

/**
 * Session cleanup result interface
 */
export interface SessionCleanupResult {
  expiredCount: number;
  inactiveCount: number;
  error?: string;
}

/**
 * Session expiration info interface
 */
export interface ExpiringSessionInfo {
  id: string;
  sessionId: string;
  userId?: string;
  guestEmail?: string;
  guestPhone?: string;
  expiresAt: Date;
  minutesUntilExpiry: number;
  lastActivity: Date;
}

/**
 * Update expired chat sessions to 'expired' status
 * This should be run periodically (e.g., every 15 minutes)
 */
export async function updateExpiredChatSessions(): Promise<SessionCleanupResult> {
  try {
    const now = new Date();

    // Find sessions that are expired but still marked as active
    const expiredSessions = await prisma.chatSession.findMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: now,
        },
      },
      select: {
        id: true,
        sessionId: true,
        userId: true,
        guestEmail: true,
        guestPhone: true,
        expiresAt: true,
        lastActivity: true,
      },
    });

    if (expiredSessions.length === 0) {
      return { expiredCount: 0, inactiveCount: 0 };
    }

    console.log(`Found ${expiredSessions.length} expired chat sessions`);

    // Update status to 'expired'
    const updateResult = await prisma.chatSession.updateMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'expired',
        endedAt: now,
      },
    });

    // Log cleanup activity
    if (updateResult.count > 0) {
      await prisma.auditLog.create({
        data: {
          userId: null, // System action
          action: 'UPDATE',
          resource: 'ChatSession',
          resourceId: 'batch-expiration',
          details: {
            cleanupType: 'expired_chat_sessions',
            expiredCount: updateResult.count,
            expiredSessions: expiredSessions.map(session => ({
              id: session.id,
              sessionId: session.sessionId,
              userId: session.userId,
              guestEmail: session.guestEmail,
              guestPhone: session.guestPhone,
              expiredAt: session.expiresAt?.toISOString(),
              lastActivity: session.lastActivity.toISOString(),
            })),
            cleanupAt: now.toISOString(),
          },
          ipAddress: 'system',
          userAgent: 'chat-session-cleanup',
        },
      });
    }

    return {
      expiredCount: updateResult.count,
      inactiveCount: 0,
    };
  } catch (error) {
    console.error('Error updating expired chat sessions:', error);
    return {
      expiredCount: 0,
      inactiveCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark inactive sessions as 'ended' (sessions that haven't had activity beyond timeout but no explicit expiry)
 * This handles sessions that might not have proper expiresAt set
 */
export async function updateInactiveChatSessions(): Promise<SessionCleanupResult> {
  try {
    const now = new Date();
    
    // Get separate session timeouts from admin settings
    const timeouts = await getSessionTimeouts();

    // Calculate cutoff times based on user type-specific timeouts
    const guestCutoff = new Date(now.getTime() - timeouts.guestTimeoutMs);
    const authenticatedCutoff = new Date(now.getTime() - timeouts.authenticatedTimeoutMs);

    // Find active sessions that are actually inactive based on lastActivity
    const inactiveSessions = await prisma.chatSession.findMany({
      where: {
        status: 'active',
        OR: [
          // Guest sessions inactive based on configured guest timeout
          {
            userId: null,
            lastActivity: {
              lt: guestCutoff,
            },
          },
          // Authenticated sessions inactive based on configured authenticated timeout
          {
            userId: {
              not: null,
            },
            lastActivity: {
              lt: authenticatedCutoff,
            },
          },
        ],
      },
      select: {
        id: true,
        sessionId: true,
        userId: true,
        guestEmail: true,
        guestPhone: true,
        lastActivity: true,
        expiresAt: true,
      },
    });

    if (inactiveSessions.length === 0) {
      return { expiredCount: 0, inactiveCount: 0 };
    }

    console.log(`Found ${inactiveSessions.length} inactive chat sessions`);

    // Update status to 'ended'
    const updateResult = await prisma.chatSession.updateMany({
      where: {
        status: 'active',
        OR: [
          {
            userId: null,
            lastActivity: {
              lt: guestCutoff,
            },
          },
          {
            userId: {
              not: null,
            },
            lastActivity: {
              lt: authenticatedCutoff,
            },
          },
        ],
      },
      data: {
        status: 'ended',
        endedAt: now,
      },
    });

    // Log cleanup activity
    if (updateResult.count > 0) {
      await prisma.auditLog.create({
        data: {
          userId: null, // System action
          action: 'UPDATE',
          resource: 'ChatSession',
          resourceId: 'batch-inactivity',
          details: {
            cleanupType: 'ended_chat_sessions',
            inactiveCount: updateResult.count,
            guestTimeoutMinutes: timeouts.guestTimeoutMs / (60 * 1000),
            authenticatedTimeoutMinutes: timeouts.authenticatedTimeoutMs / (60 * 1000),
            inactiveSessions: inactiveSessions.map(session => ({
              id: session.id,
              sessionId: session.sessionId,
              userId: session.userId,
              guestEmail: session.guestEmail,
              guestPhone: session.guestPhone,
              lastActivity: session.lastActivity.toISOString(),
              expiresAt: session.expiresAt?.toISOString(),
              inactiveForMinutes: Math.round((now.getTime() - session.lastActivity.getTime()) / (60 * 1000)),
            })),
            cleanupAt: now.toISOString(),
          },
          ipAddress: 'system',
          userAgent: 'chat-session-cleanup',
        },
      });
    }

    return {
      expiredCount: 0,
      inactiveCount: updateResult.count,
    };
  } catch (error) {
    console.error('Error updating ended chat sessions:', error);
    return {
      expiredCount: 0,
      inactiveCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Comprehensive session cleanup - handles both expired and ended sessions
 */
export async function cleanupChatSessions(): Promise<SessionCleanupResult> {
  try {
    console.log('🧹 Starting chat session cleanup...');

    // Run both cleanup operations
    const [expiredResult, inactiveResult] = await Promise.all([
      updateExpiredChatSessions(),
      updateInactiveChatSessions(),
    ]);

    // Combine results
    const totalResult: SessionCleanupResult = {
      expiredCount: expiredResult.expiredCount,
      inactiveCount: inactiveResult.inactiveCount,
      error: expiredResult.error || inactiveResult.error,
    };

    const totalProcessed = totalResult.expiredCount + totalResult.inactiveCount;
    if (totalProcessed > 0) {
      console.log(`✅ Chat session cleanup completed: ${totalResult.expiredCount} expired, ${totalResult.inactiveCount} ended`);
    } else {
      console.log('📦 No chat sessions needed cleanup');
    }

    return totalResult;
  } catch (error) {
    console.error('❌ Chat session cleanup failed:', error);
    return {
      expiredCount: 0,
      inactiveCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get chat sessions that will expire soon (within minutes)
 */
export async function getChatSessionsExpiringSoon(
  withinMinutes = 5
): Promise<ExpiringSessionInfo[]> {
  try {
    const now = new Date();
    const expiresWithin = new Date(now.getTime() + withinMinutes * 60 * 1000);

    const expiringSessions = await prisma.chatSession.findMany({
      where: {
        status: 'active',
        expiresAt: {
          gte: now,
          lte: expiresWithin,
        },
      },
      select: {
        id: true,
        sessionId: true,
        userId: true,
        guestEmail: true,
        guestPhone: true,
        expiresAt: true,
        lastActivity: true,
      },
    });

    return expiringSessions.map(session => ({
      id: session.id,
      sessionId: session.sessionId,
      userId: session.userId,
      guestEmail: session.guestEmail,
      guestPhone: session.guestPhone,
      expiresAt: session.expiresAt!,
      lastActivity: session.lastActivity,
      minutesUntilExpiry: Math.round(
        (session.expiresAt!.getTime() - now.getTime()) / (60 * 1000)
      ),
    }));
  } catch (error) {
    console.error('Error getting chat sessions expiring soon:', error);
    return [];
  }
}

/**
 * Get session cleanup statistics for monitoring
 */
export async function getSessionCleanupStatistics() {
  try {
    const [activeCount, expiredCount, endedCount, totalCount] = await Promise.all([
      prisma.chatSession.count({ where: { status: 'active' } }),
      prisma.chatSession.count({ where: { status: 'expired' } }),
      prisma.chatSession.count({ where: { status: 'ended' } }),
      prisma.chatSession.count(),
    ]);

    // Get separate session timeouts from admin settings
    const timeouts = await getSessionTimeouts();

    const now = new Date();
    const guestCutoff = new Date(now.getTime() - timeouts.guestTimeoutMs);
    const authenticatedCutoff = new Date(now.getTime() - timeouts.authenticatedTimeoutMs);

    // Count sessions that need cleanup
    const [expiredNeedingCleanup, endedNeedingCleanup] = await Promise.all([
      prisma.chatSession.count({
        where: {
          status: 'active',
          expiresAt: { lt: now },
        },
      }),
      prisma.chatSession.count({
        where: {
          status: 'active',
          OR: [
            { userId: null, lastActivity: { lt: guestCutoff } },
            { userId: { not: null }, lastActivity: { lt: authenticatedCutoff } },
          ],
        },
      }),
    ]);

    return {
      sessions: {
        total: totalCount,
        active: activeCount,
        expired: expiredCount,
        ended: endedCount,
      },
      cleanup: {
        expiredNeedingCleanup,
        endedNeedingCleanup,
        totalNeedingCleanup: expiredNeedingCleanup + endedNeedingCleanup,
      },
      timeouts: {
        guestTimeoutMinutes: timeouts.guestTimeoutMs / (60 * 1000),
        authenticatedTimeoutMinutes: timeouts.authenticatedTimeoutMs / (60 * 1000),
      },
    };
  } catch (error) {
    console.error('Error getting session cleanup statistics:', error);
    return null;
  }
}

/**
 * Extend session expiry time (useful for active conversations)
 */
export async function extendSessionExpiry(
  sessionId: string,
  additionalMinutes = 30
): Promise<{ success: boolean; newExpiryTime?: Date; error?: string }> {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { sessionId },
      select: { 
        id: true, 
        expiresAt: true, 
        userId: true,
        status: true,
      },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.status !== 'active') {
      return { success: false, error: 'Cannot extend expired or inactive session' };
    }

    // Calculate new expiry time based on current expiry or reasonable default
    const baseTime = session.expiresAt || new Date();
    const newExpiryTime = new Date(
      baseTime.getTime() + additionalMinutes * 60 * 1000
    );

    await prisma.chatSession.update({
      where: { sessionId },
      data: {
        expiresAt: newExpiryTime,
        lastActivity: new Date(), // Update last activity as well
      },
    });

    return { success: true, newExpiryTime };
  } catch (error) {
    console.error('Error extending session expiry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}