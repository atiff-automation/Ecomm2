/**
 * Multi-Tenant Telegram Service Factory
 * CENTRALIZED service management with user isolation
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { TelegramService } from '@/lib/telegram/telegram-service';
import { telegramConfigService } from './telegram-config.service';
import { TelegramConfig } from '@prisma/client';

/**
 * Factory for managing user-scoped Telegram services
 * SYSTEMATIC approach: One service per user with caching
 */
export class TelegramServiceFactory {
  private static userServices = new Map<string, TelegramService>();
  private static globalService: TelegramService | null = null;
  
  /**
   * Get TelegramService instance for specific user
   * SINGLE SOURCE OF TRUTH: One service per user with caching
   */
  static async getServiceForUser(userId: string): Promise<TelegramService> {
    if (!this.userServices.has(userId)) {
      const service = new TelegramService(userId);
      await service.initialize();
      this.userServices.set(userId, service);
    }
    return this.userServices.get(userId)!;
  }
  
  /**
   * Get global TelegramService (fallback)
   * BACKWARD COMPATIBILITY: Support existing .env approach
   */
  static async getGlobalService(): Promise<TelegramService> {
    if (!this.globalService) {
      this.globalService = new TelegramService();
      await this.globalService.initialize();
    }
    return this.globalService;
  }

  /**
   * Clear cached service for user (useful after config changes)
   * CACHE MANAGEMENT: Force service reinitialization
   */
  static clearUserService(userId: string): void {
    this.userServices.delete(userId);
  }

  /**
   * Clear all cached services
   * CACHE MANAGEMENT: System-wide service reset
   */
  static clearAllServices(): void {
    this.userServices.clear();
    this.globalService = null;
  }

  /**
   * Get service based on context (user or global)
   * CENTRALIZED service resolution
   */
  static async getService(userId?: string): Promise<TelegramService> {
    if (userId) {
      return this.getServiceForUser(userId);
    }
    return this.getGlobalService();
  }

  /**
   * Check if user has configured service
   * SYSTEMATIC configuration checking
   */
  static async isUserConfigured(userId: string): Promise<boolean> {
    try {
      const config = await telegramConfigService.getUserConfig(userId);
      return !!(config?.botToken);
    } catch (error) {
      console.error('Error checking user configuration:', error);
      return false;
    }
  }

  /**
   * Get all configured users (Admin use)
   * CENTRALIZED user management
   */
  static async getConfiguredUsers(): Promise<Array<{ userId: string; configured: boolean; verified: boolean }>> {
    try {
      const allConfigs = await telegramConfigService.getAllUserConfigs();
      return allConfigs.map(config => ({
        userId: config.userId,
        configured: !!config.botToken,
        verified: config.verified
      }));
    } catch (error) {
      console.error('Error getting configured users:', error);
      return [];
    }
  }

  /**
   * Health check for all user services
   * SYSTEMATIC health monitoring
   */
  static async performHealthCheck(): Promise<{
    global: { healthy: boolean; error?: string };
    users: Array<{ userId: string; healthy: boolean; error?: string }>;
  }> {
    const results = {
      global: { healthy: false, error: undefined as string | undefined },
      users: [] as Array<{ userId: string; healthy: boolean; error?: string }>
    };

    try {
      // Check global service
      const globalService = await this.getGlobalService();
      if (await globalService.isConfigured()) {
        const healthStatus = globalService.getHealthStatus();
        results.global.healthy = healthStatus.healthy;
        if (!healthStatus.healthy) {
          results.global.error = 'Global service unhealthy';
        }
      } else {
        results.global.error = 'Global service not configured';
      }
    } catch (error) {
      results.global.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check all user services
    const configuredUsers = await this.getConfiguredUsers();
    for (const userInfo of configuredUsers) {
      try {
        const service = await this.getServiceForUser(userInfo.userId);
        if (await service.isConfigured()) {
          const healthStatus = service.getHealthStatus();
          results.users.push({
            userId: userInfo.userId,
            healthy: healthStatus.healthy,
            error: healthStatus.healthy ? undefined : 'Service unhealthy'
          });
        } else {
          results.users.push({
            userId: userInfo.userId,
            healthy: false,
            error: 'Service not configured'
          });
        }
      } catch (error) {
        results.users.push({
          userId: userInfo.userId,
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
}