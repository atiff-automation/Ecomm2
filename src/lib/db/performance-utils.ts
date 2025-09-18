/**
 * Database Performance Utilities
 * Centralized performance optimization following DRY principles
 * @CLAUDE.md - Systematic approach with one source of truth
 */

import { prisma } from './prisma';

/**
 * Performance-optimized chat session queries with proper indexing
 * Centralized approach to avoid query duplication
 */
export class ChatPerformanceUtils {
  /**
   * Get optimized chat sessions with minimal joins
   * Using direct database optimization strategies
   */
  static async getOptimizedChatSessions(options: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const { status, limit = 50, offset = 0 } = options;

    // Build optimized where clause
    const whereClause: any = {};
    if (status && status !== 'all') {
      switch (status) {
        case 'active':
          whereClause.status = { in: ['active', 'inactive'] };
          break;
        case 'ended':
          whereClause.status = { in: ['expired', 'ended', 'archived'] };
          break;
        case 'idle':
          whereClause.status = 'idle';
          break;
        default:
          whereClause.status = status;
      }
    }

    // Use optimized query with minimal data selection
    const sessions = await prisma.chatSession.findMany({
      where: whereClause,
      select: {
        id: true,
        sessionId: true,
        status: true,
        createdAt: true,
        lastActivity: true,
        guestEmail: true,
        guestPhone: true,
        userAgent: true,
        ipAddress: true,
        metadata: true,
        userId: true,
        // Optimized user selection - only essential fields
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        // Use aggregate count instead of loading all messages
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        lastActivity: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return sessions;
  }

  /**
   * Get optimized total count with proper indexing
   */
  static async getOptimizedSessionCount(whereClause: any) {
    return await prisma.chatSession.count({
      where: whereClause,
    });
  }

  /**
   * Map database status to frontend status - centralized logic
   */
  static mapDatabaseStatus(dbStatus: string): 'active' | 'idle' | 'ended' {
    switch (dbStatus) {
      case 'active':
      case 'inactive':
        return 'active';
      case 'expired':
      case 'ended':
      case 'archived':
        return 'ended';
      default:
        return 'idle';
    }
  }

  /**
   * Transform session data for frontend - centralized transformation
   */
  static transformSessionData(sessions: any[]) {
    return sessions.map(session => ({
      id: session.id,
      sessionId: session.sessionId,
      status: this.mapDatabaseStatus(session.status),
      startedAt: session.createdAt.toISOString(),
      lastActivity: session.lastActivity.toISOString(),
      messageCount: session._count.messages,
      userId: session.user?.id,
      userEmail: session.user?.email,
      userName: session.user
        ? `${session.user.firstName} ${session.user.lastName}`.trim()
        : null,
      guestEmail: session.guestEmail,
      guestPhone: session.guestPhone,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      metadata: session.metadata,
    }));
  }

  /**
   * Optimized metrics calculation with parallel processing
   * Using database aggregations with proper timeout-based active session calculation
   */
  static async getOptimizedMetrics(timeRange: string = '24h') {
    const now = new Date();
    const ranges = {
      '1h': new Date(now.getTime() - 1 * 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    };

    const startDate = ranges[timeRange as keyof typeof ranges] || ranges['24h'];
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get timeout configuration for accurate active session calculation
    const timeouts = await this.getSessionTimeouts();
    const guestCutoff = new Date(now.getTime() - timeouts.guestTimeoutMs);
    const authenticatedCutoff = new Date(now.getTime() - timeouts.authenticatedTimeoutMs);

    // Execute all queries in parallel - key performance optimization
    const [
      totalSessions,
      activeSessions,
      totalMessages,
      todaysSessions,
      sessionsByStatus,
    ] = await Promise.all([
      // Optimized session count
      prisma.chatSession.count({
        where: { createdAt: { gte: startDate } }
      }),

      // FIXED: Active sessions count based on timeout rules, not just database status
      prisma.chatSession.count({
        where: {
          OR: [
            // Explicitly active sessions (regardless of timeout)
            { status: 'active' },
            // Guest sessions within timeout window
            {
              AND: [
                { status: { in: ['inactive'] } },
                { userId: null }, // Guest sessions
                { lastActivity: { gte: guestCutoff } }
              ]
            },
            // Authenticated sessions within timeout window
            {
              AND: [
                { status: { in: ['inactive'] } },
                { userId: { not: null } }, // Authenticated sessions
                { lastActivity: { gte: authenticatedCutoff } }
              ]
            }
          ]
        }
      }),

      // Optimized message count
      prisma.chatMessage.count({
        where: { createdAt: { gte: startDate } }
      }),

      // Today's sessions count
      prisma.chatSession.count({
        where: { createdAt: { gte: todayStart } }
      }),

      // Session status distribution
      prisma.chatSession.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: { status: true },
      }),
    ]);

    // Transform status distribution
    const statusDistribution = sessionsByStatus.reduce((acc, item) => {
      const mappedStatus = this.mapDatabaseStatus(item.status);
      acc[mappedStatus] = (acc[mappedStatus] || 0) + item._count.status;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSessions,
      activeSessions,
      totalMessages,
      todaysSessions,
      statusDistribution,
      averageSessionDuration: 0, // Simplified for performance
      responseTime: 0, // Simplified for performance
      messagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0,
    };
  }

  /**
   * Get session timeout configuration
   * Centralized timeout access for metrics calculation
   */
  static async getSessionTimeouts(): Promise<{
    guestTimeoutMs: number;
    authenticatedTimeoutMs: number;
  }> {
    const config = await prisma.chatConfig.findFirst({
      where: { isActive: true },
      select: {
        guestSessionTimeoutMinutes: true,
        authenticatedSessionTimeoutMinutes: true,
      },
    });

    if (config) {
      return {
        guestTimeoutMs: config.guestSessionTimeoutMinutes * 60 * 1000,
        authenticatedTimeoutMs: config.authenticatedSessionTimeoutMinutes * 60 * 1000,
      };
    }

    // Default timeouts if no config found
    return {
      guestTimeoutMs: 13 * 60 * 1000, // 13 minutes
      authenticatedTimeoutMs: 19 * 60 * 1000, // 19 minutes
    };
  }

  /**
   * Database optimization suggestions
   * Following @CLAUDE.md systematic approach
   */
  static getDatabaseOptimizationSuggestions() {
    return [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_last_activity ON chat_sessions(last_activity DESC);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);',
    ];
  }
}

/**
 * Performance monitoring utilities
 * Centralized performance tracking
 */
export class PerformanceMonitor {
  static async measureQueryTime<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log slow queries (over 1 second)
      if (duration > 1000) {
        console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(`❌ Query failed: ${queryName} failed after ${duration}ms`, error);
      throw error;
    }
  }
}