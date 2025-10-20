import { prisma } from '@/lib/prisma';

/**
 * Audit Logging Service
 * Following @CLAUDE.md principles - centralized, systematic, no hardcoding
 */

export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
  details?: Record<string, any>;
}

export class AuditLogger {
  /**
   * Log a general change/action
   * @param entry Audit log entry data
   */
  static async logChange(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          details: {
            oldValues: entry.oldValues,
            newValues: entry.newValues,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            ...entry.details,
          },
          createdAt: entry.timestamp || new Date(),
        },
      });
    } catch (error) {
      // Don't throw - audit logging failure shouldn't break the main operation
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Log business profile changes with specific handling
   * @param userId User making the change
   * @param oldProfile Previous business profile data
   * @param newProfile New business profile data
   * @param request HTTP request for metadata
   * @param reason Optional reason for change
   */
  static async logBusinessProfileChange(
    userId: string,
    oldProfile: any,
    newProfile: any,
    request: Request,
    reason?: string
  ): Promise<void> {
    const ip = this.extractIpAddress(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create audit log entry
    await this.logChange({
      userId,
      action: 'UPDATE_BUSINESS_PROFILE',
      resource: 'business_profile',
      resourceId: newProfile?.id,
      oldValues: this.sanitizeProfileData(oldProfile),
      newValues: this.sanitizeProfileData(newProfile),
      ipAddress: ip,
      userAgent,
      timestamp: new Date(),
      details: reason ? { changeReason: reason } : undefined,
    });

    // Also create business profile history entry
    if (newProfile?.id) {
      try {
        await prisma.businessProfileHistory.create({
          data: {
            businessProfileId: newProfile.id,
            operation: oldProfile ? 'UPDATE' : 'CREATE',
            oldValues: oldProfile ? this.sanitizeProfileData(oldProfile) : null,
            newValues: this.sanitizeProfileData(newProfile),
            changedBy: userId,
            changeReason: reason,
            createdAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Business profile history logging failed:', error);
      }
    }
  }

  /**
   * Log tax configuration changes
   * @param userId User making the change
   * @param oldConfig Previous tax configuration
   * @param newConfig New tax configuration
   * @param request HTTP request for metadata
   * @param reason Optional reason for change
   */
  static async logTaxConfigurationChange(
    userId: string,
    oldConfig: any,
    newConfig: any,
    request: Request,
    reason?: string
  ): Promise<void> {
    const ip = this.extractIpAddress(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await this.logChange({
      userId,
      action: 'UPDATE_TAX_CONFIGURATION',
      resource: 'tax_configuration',
      resourceId: newConfig?.id,
      oldValues: oldConfig,
      newValues: newConfig,
      ipAddress: ip,
      userAgent,
      timestamp: new Date(),
      details: reason ? { changeReason: reason } : undefined,
    });
  }

  /**
   * Log user settings changes
   * @param userId User making the change
   * @param settingType Type of setting changed
   * @param oldValues Previous values
   * @param newValues New values
   * @param request HTTP request for metadata
   */
  static async logUserSettingsChange(
    userId: string,
    settingType: string,
    oldValues: any,
    newValues: any,
    request: Request
  ): Promise<void> {
    const ip = this.extractIpAddress(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await this.logChange({
      userId,
      action: `UPDATE_USER_SETTINGS_${settingType.toUpperCase()}`,
      resource: 'user_settings',
      resourceId: userId,
      oldValues,
      newValues,
      ipAddress: ip,
      userAgent,
      timestamp: new Date(),
    });
  }

  /**
   * Log admin account management actions
   * @param adminUserId Admin performing the action
   * @param targetUserId User being managed
   * @param action Action performed
   * @param request HTTP request for metadata
   * @param details Additional details
   */
  static async logAdminAccountAction(
    adminUserId: string,
    targetUserId: string,
    action: string,
    request: Request,
    details?: Record<string, any>
  ): Promise<void> {
    const ip = this.extractIpAddress(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await this.logChange({
      userId: adminUserId,
      action: `ADMIN_${action.toUpperCase()}`,
      resource: 'admin_management',
      resourceId: targetUserId,
      ipAddress: ip,
      userAgent,
      timestamp: new Date(),
      details: {
        targetUserId,
        ...details,
      },
    });
  }

  /**
   * Get audit logs with filtering and pagination
   * @param filters Filter options
   * @returns Paginated audit logs
   */
  static async getAuditLogs(filters: {
    userId?: string;
    resource?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      resource,
      action,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }
    if (resource) {
      where.resource = resource;
    }
    if (action) {
      where.action = action;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Extract IP address from request headers
   * @param request HTTP request
   * @returns IP address string
   */
  private static extractIpAddress(request: Request): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-client-ip') ||
      'unknown'
    );
  }

  /**
   * Sanitize business profile data for logging (remove/mask sensitive data)
   * @param profile Business profile data
   * @returns Sanitized profile data
   */
  private static sanitizeProfileData(profile: any): any {
    if (!profile) {
      return null;
    }

    const sanitized = { ...profile };

    // Mask sensitive banking information
    if (sanitized.bankAccountNumber) {
      const accountNumber = sanitized.bankAccountNumber;
      if (typeof accountNumber === 'string' && accountNumber.length > 4) {
        sanitized.bankAccountNumber =
          accountNumber.slice(0, 4) + '*'.repeat(accountNumber.length - 4);
      }
    }

    // Remove any encrypted fields that shouldn't be logged
    delete sanitized.encryptedFields;

    return sanitized;
  }

  /**
   * Get recent business profile changes for dashboard
   * @param limit Number of recent changes to return
   * @returns Recent business profile changes
   */
  static async getRecentBusinessProfileChanges(limit: number = 10) {
    return await prisma.businessProfileHistory.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        businessProfile: {
          select: {
            id: true,
            legalName: true,
          },
        },
      },
    });
  }
}
