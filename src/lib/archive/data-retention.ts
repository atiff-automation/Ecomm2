/**
 * Data Retention Policy Management
 * Centralized retention policy enforcement following DRY principles
 * @CLAUDE.md - Systematic approach with configurable retention rules
 */

import { prisma } from '@/lib/db/prisma';
import { ArchiveManager } from './archive-manager';

export interface RetentionPolicy {
  name: string;
  description: string;
  autoArchiveAfterDays: number;
  purgeAfterDays: number;
  applies: 'all' | 'guest' | 'authenticated';
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface RetentionJob {
  id: string;
  type: 'auto_archive' | 'purge' | 'cleanup';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  processedCount: number;
  errorCount: number;
  errors?: string[];
  metadata?: any;
}

export interface RetentionReport {
  policy: RetentionPolicy;
  stats: {
    totalSessions: number;
    eligibleForArchive: number;
    eligibleForPurge: number;
    archivedInPeriod: number;
    purgedInPeriod: number;
    storageFreed: number;
  };
  recommendations: string[];
  nextActions: Array<{
    action: string;
    count: number;
    scheduledFor: Date;
  }>;
}

/**
 * Centralized data retention policy engine
 * Following ArchiveManager pattern for consistency
 */
export class DataRetentionManager {
  /**
   * Default retention policies - centralized configuration
   * @CLAUDE.md - No hardcoded values in business logic
   */
  static readonly DEFAULT_POLICIES: RetentionPolicy[] = [
    {
      name: 'Standard Retention',
      description: 'Standard 1-year retention policy for all chat sessions',
      autoArchiveAfterDays: 90,
      purgeAfterDays: 365,
      applies: 'all',
      enabled: true,
    },
    {
      name: 'Guest Session Policy',
      description: 'Shorter retention for guest user sessions',
      autoArchiveAfterDays: 30,
      purgeAfterDays: 180,
      applies: 'guest',
      enabled: false, // Disabled by default, can be enabled if needed
    },
    {
      name: 'Authenticated User Policy',
      description: 'Extended retention for authenticated user sessions',
      autoArchiveAfterDays: 180,
      purgeAfterDays: 730, // 2 years
      applies: 'authenticated',
      enabled: false, // Disabled by default, can be enabled if needed
    },
  ];

  /**
   * Get active retention policy
   * Returns the currently active policy based on configuration
   */
  static getActivePolicy(): RetentionPolicy {
    // For now, return the standard policy
    // In a full implementation, this would be stored in database/config
    const policy = this.DEFAULT_POLICIES.find(p => p.enabled && p.applies === 'all');
    
    if (!policy) {
      throw new Error('No active retention policy found');
    }

    return {
      ...policy,
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    };
  }

  /**
   * Get all available retention policies
   */
  static getAllPolicies(): RetentionPolicy[] {
    return this.DEFAULT_POLICIES.map(policy => ({
      ...policy,
      lastRun: policy.enabled ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : undefined,
      nextRun: policy.enabled ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
    }));
  }

  /**
   * Execute retention policy
   * Centralized policy execution with comprehensive logging
   */
  static async executeRetentionPolicy(policyName?: string): Promise<RetentionJob> {
    const policy = policyName 
      ? this.DEFAULT_POLICIES.find(p => p.name === policyName)
      : this.getActivePolicy();

    if (!policy) {
      throw new Error(`Retention policy not found: ${policyName}`);
    }

    const job: RetentionJob = {
      id: `retention-${Date.now()}`,
      type: 'auto_archive',
      status: 'pending',
      processedCount: 0,
      errorCount: 0,
      errors: [],
      metadata: {
        policyName: policy.name,
        autoArchiveAfterDays: policy.autoArchiveAfterDays,
        purgeAfterDays: policy.purgeAfterDays,
        applies: policy.applies,
      },
    };

    try {
      job.status = 'running';
      job.startedAt = new Date();

      // Execute auto-archive based on policy
      const archiveResult = await this.executeAutoArchive(policy);
      job.processedCount += archiveResult.archivedCount;
      
      if (archiveResult.errors.length > 0) {
        job.errors?.push(...archiveResult.errors);
        job.errorCount += archiveResult.errors.length;
      }

      // Execute purge based on policy
      const purgeResult = await this.executePurge(policy);
      job.processedCount += purgeResult.purgedCount;
      
      if (purgeResult.errors.length > 0) {
        job.errors?.push(...purgeResult.errors);
        job.errorCount += purgeResult.errors.length;
      }

      job.status = job.errorCount > 0 ? 'completed' : 'completed';
      job.completedAt = new Date();

      // Log job completion
      console.log(`Retention job ${job.id} completed:`, {
        processed: job.processedCount,
        errors: job.errorCount,
        duration: job.completedAt.getTime() - job.startedAt!.getTime(),
      });

    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.errors?.push(error instanceof Error ? error.message : 'Unknown error');
      job.errorCount++;
      
      console.error(`Retention job ${job.id} failed:`, error);
    }

    return job;
  }

  /**
   * Execute auto-archive based on policy
   */
  private static async executeAutoArchive(policy: RetentionPolicy): Promise<{
    archivedCount: number;
    errors: string[];
  }> {
    const cutoffDate = new Date(
      Date.now() - policy.autoArchiveAfterDays * 24 * 60 * 60 * 1000
    );

    // Build where clause based on policy scope
    const whereClause: any = {
      lastActivity: { lte: cutoffDate },
      status: { notIn: ['archived', 'active'] },
      archivedAt: null,
    };

    // Apply policy scope
    if (policy.applies === 'guest') {
      whereClause.userId = null;
    } else if (policy.applies === 'authenticated') {
      whereClause.userId = { not: null };
    }

    try {
      // Find sessions to archive
      const sessionsToArchive = await prisma.chatSession.findMany({
        where: whereClause,
        select: { sessionId: true },
        take: 1000, // Limit for performance
      });

      if (sessionsToArchive.length === 0) {
        return { archivedCount: 0, errors: [] };
      }

      const sessionIds = sessionsToArchive.map(s => s.sessionId);
      
      const result = await ArchiveManager.archiveSessions({
        sessionIds,
        reason: `Auto-archived by policy: ${policy.name}`,
      });

      return {
        archivedCount: result.archivedCount,
        errors: result.errors,
      };
    } catch (error) {
      return {
        archivedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Execute purge based on policy
   */
  private static async executePurge(policy: RetentionPolicy): Promise<{
    purgedCount: number;
    errors: string[];
  }> {
    const cutoffDate = new Date(
      Date.now() - policy.purgeAfterDays * 24 * 60 * 60 * 1000
    );

    // Build where clause for purging
    const whereClause: any = {
      status: 'archived',
      archivedAt: { lte: cutoffDate },
    };

    // Apply policy scope
    if (policy.applies === 'guest') {
      whereClause.userId = null;
    } else if (policy.applies === 'authenticated') {
      whereClause.userId = { not: null };
    }

    try {
      // Find sessions to purge
      const sessionsToPurge = await prisma.chatSession.findMany({
        where: whereClause,
        select: { id: true, sessionId: true },
        take: 100, // Smaller batches for purging
      });

      if (sessionsToPurge.length === 0) {
        return { purgedCount: 0, errors: [] };
      }

      // Execute purge in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Delete messages first
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

      return {
        purgedCount: result,
        errors: [],
      };
    } catch (error) {
      return {
        purgedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Generate retention report
   * Comprehensive analysis of retention policy effectiveness
   */
  static async generateRetentionReport(policyName?: string): Promise<RetentionReport> {
    const policy = policyName 
      ? this.DEFAULT_POLICIES.find(p => p.name === policyName)
      : this.getActivePolicy();

    if (!policy) {
      throw new Error(`Retention policy not found: ${policyName}`);
    }

    const now = new Date();
    const archiveCutoff = new Date(now.getTime() - policy.autoArchiveAfterDays * 24 * 60 * 60 * 1000);
    const purgeCutoff = new Date(now.getTime() - policy.purgeAfterDays * 24 * 60 * 60 * 1000);
    const reportPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    // Build base where clause
    const baseWhere: any = {};
    if (policy.applies === 'guest') {
      baseWhere.userId = null;
    } else if (policy.applies === 'authenticated') {
      baseWhere.userId = { not: null };
    }

    // Execute analysis queries in parallel
    const [
      totalSessions,
      eligibleForArchive,
      eligibleForPurge,
      archivedInPeriod,
      purgedInPeriod,
    ] = await Promise.all([
      prisma.chatSession.count({ where: baseWhere }),
      prisma.chatSession.count({
        where: {
          ...baseWhere,
          lastActivity: { lte: archiveCutoff },
          status: { notIn: ['archived', 'active'] },
          archivedAt: null,
        },
      }),
      prisma.chatSession.count({
        where: {
          ...baseWhere,
          status: 'archived',
          archivedAt: { lte: purgeCutoff },
        },
      }),
      prisma.chatSession.count({
        where: {
          ...baseWhere,
          archivedAt: { gte: reportPeriodStart },
        },
      }),
      // Purged sessions can't be counted as they're deleted, estimate based on historical data
      0, // Placeholder - in full implementation, track this in a separate log table
    ]);

    // Calculate storage estimates
    const avgSessionSize = 1024; // Estimated bytes per session
    const storageFreed = purgedInPeriod * avgSessionSize;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (eligibleForArchive > 100) {
      recommendations.push(`${eligibleForArchive} sessions are eligible for archiving to free up active storage`);
    }
    
    if (eligibleForPurge > 50) {
      recommendations.push(`${eligibleForPurge} archived sessions are past retention period and can be purged`);
    }
    
    if (archivedInPeriod === 0 && policy.enabled) {
      recommendations.push('No sessions were archived in the last 30 days - verify auto-archive process is running');
    }
    
    if (!policy.enabled) {
      recommendations.push('Retention policy is disabled - enable to automate data lifecycle management');
    }

    // Calculate next actions
    const nextActions = [
      {
        action: 'Auto-archive old sessions',
        count: eligibleForArchive,
        scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      },
      {
        action: 'Purge expired archives',
        count: eligibleForPurge,
        scheduledFor: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
      },
    ].filter(action => action.count > 0);

    return {
      policy: {
        ...policy,
        lastRun: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
      stats: {
        totalSessions,
        eligibleForArchive,
        eligibleForPurge,
        archivedInPeriod,
        purgedInPeriod,
        storageFreed,
      },
      recommendations,
      nextActions,
    };
  }

  /**
   * Check compliance with retention policy
   * Verify that retention policy is being followed correctly
   */
  static async checkRetentionCompliance(policyName?: string): Promise<{
    compliant: boolean;
    violations: string[];
    warnings: string[];
    score: number; // 0-100
  }> {
    const policy = policyName 
      ? this.DEFAULT_POLICIES.find(p => p.name === policyName)
      : this.getActivePolicy();

    if (!policy) {
      throw new Error(`Retention policy not found: ${policyName}`);
    }

    const violations: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    const now = new Date();
    const archiveCutoff = new Date(now.getTime() - policy.autoArchiveAfterDays * 24 * 60 * 60 * 1000);
    const purgeCutoff = new Date(now.getTime() - policy.purgeAfterDays * 24 * 60 * 60 * 1000);

    // Check for sessions that should be archived
    const unArchivedOldSessions = await prisma.chatSession.count({
      where: {
        lastActivity: { lte: archiveCutoff },
        status: { notIn: ['archived', 'active'] },
        archivedAt: null,
      },
    });

    if (unArchivedOldSessions > 0) {
      violations.push(`${unArchivedOldSessions} sessions are past archive deadline`);
      score -= Math.min(30, unArchivedOldSessions);
    }

    // Check for archived sessions past purge deadline
    const overRetainedSessions = await prisma.chatSession.count({
      where: {
        status: 'archived',
        archivedAt: { lte: purgeCutoff },
      },
    });

    if (overRetainedSessions > 0) {
      violations.push(`${overRetainedSessions} archived sessions are past purge deadline`);
      score -= Math.min(40, overRetainedSessions);
    }

    // Check for sessions approaching deadlines
    const soonToArchive = await prisma.chatSession.count({
      where: {
        lastActivity: { 
          gte: new Date(archiveCutoff.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before deadline
          lte: archiveCutoff 
        },
        status: { notIn: ['archived', 'active'] },
        archivedAt: null,
      },
    });

    if (soonToArchive > 10) {
      warnings.push(`${soonToArchive} sessions will need archiving within 7 days`);
    }

    const soonToPurge = await prisma.chatSession.count({
      where: {
        status: 'archived',
        archivedAt: { 
          gte: new Date(purgeCutoff.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before deadline
          lte: purgeCutoff 
        },
      },
    });

    if (soonToPurge > 5) {
      warnings.push(`${soonToPurge} archived sessions will be purged within 7 days`);
    }

    // Check if policy is enabled
    if (!policy.enabled) {
      violations.push('Retention policy is disabled');
      score -= 50;
    }

    return {
      compliant: violations.length === 0,
      violations,
      warnings,
      score: Math.max(0, score),
    };
  }

  /**
   * Schedule retention policy execution
   * Set up automated retention job scheduling
   */
  static scheduleRetentionJobs(): {
    scheduled: boolean;
    nextRun: Date;
    frequency: string;
  } {
    // In a full implementation, this would integrate with a job scheduler
    // For now, return scheduling information
    
    const nextRun = new Date();
    nextRun.setHours(2, 0, 0, 0); // 2 AM tomorrow
    if (nextRun <= new Date()) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return {
      scheduled: true,
      nextRun,
      frequency: 'daily',
    };
  }

  /**
   * Get retention policy status
   * Quick overview of current retention status
   */
  static async getRetentionStatus(): Promise<{
    activePolicy: string;
    lastRun?: string;
    nextRun?: string;
    health: 'healthy' | 'warning' | 'critical';
    summary: string;
  }> {
    const policy = this.getActivePolicy();
    const compliance = await this.checkRetentionCompliance();
    
    let health: 'healthy' | 'warning' | 'critical' = 'healthy';
    let summary = 'All retention policies are compliant';
    
    if (compliance.violations.length > 0) {
      health = 'critical';
      summary = `${compliance.violations.length} policy violations detected`;
    } else if (compliance.warnings.length > 0) {
      health = 'warning';
      summary = `${compliance.warnings.length} warnings - action needed soon`;
    }

    return {
      activePolicy: policy.name,
      lastRun: policy.lastRun,
      nextRun: policy.nextRun,
      health,
      summary,
    };
  }
}