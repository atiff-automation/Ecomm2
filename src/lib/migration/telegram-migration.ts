/**
 * Telegram Multi-Tenant Migration Scripts
 * SYSTEMATIC migration from global to user-based configuration
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { prisma } from '@/lib/db/prisma';
import { telegramConfigService } from '@/lib/services/telegram-config.service';
import { TelegramServiceFactory } from '@/lib/services/telegram-service-factory';

// TYPES: Migration interfaces
interface MigrationResult {
  success: boolean;
  message: string;
  details?: any;
}

interface LegacyGlobalConfig {
  botToken: string | null;
  ordersChatId: string | null;
  inventoryChatId: string | null;
  ordersEnabled: boolean;
  inventoryEnabled: boolean;
}

export class TelegramMigrationService {
  
  /**
   * Check if migration is needed
   * ASSESSMENT: Determine if system needs migration
   */
  static async needsMigration(): Promise<{
    needed: boolean;
    reason: string;
    globalConfigExists: boolean;
    userConfigsExist: boolean;
  }> {
    try {
      // CHECK: Global configuration (.env or SystemConfig)
      const envToken = process.env.TELEGRAM_BOT_TOKEN;
      const globalConfigExists = !!envToken;
      
      // CHECK: Existing user configurations
      const userConfigs = await prisma.telegramConfig.count();
      const userConfigsExist = userConfigs > 0;
      
      // ASSESSMENT: Determine migration necessity
      if (globalConfigExists && !userConfigsExist) {
        return {
          needed: true,
          reason: 'Global configuration found, but no user configurations exist. Migration recommended.',
          globalConfigExists,
          userConfigsExist
        };
      }
      
      if (globalConfigExists && userConfigsExist) {
        return {
          needed: false,
          reason: 'Both global and user configurations exist. System is in hybrid mode.',
          globalConfigExists,
          userConfigsExist
        };
      }
      
      if (!globalConfigExists && !userConfigsExist) {
        return {
          needed: false,
          reason: 'No configurations found. Fresh installation.',
          globalConfigExists,
          userConfigsExist
        };
      }
      
      return {
        needed: false,
        reason: 'Only user configurations exist. Migration already completed.',
        globalConfigExists,
        userConfigsExist
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return {
        needed: false,
        reason: `Error checking migration status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        globalConfigExists: false,
        userConfigsExist: false
      };
    }
  }
  
  /**
   * Extract global configuration
   * CENTRALIZED: Single source for global config extraction
   */
  static async extractGlobalConfig(): Promise<LegacyGlobalConfig> {
    try {
      // PRIMARY: Environment variables
      const envConfig = {
        botToken: process.env.TELEGRAM_BOT_TOKEN || null,
        ordersChatId: process.env.TELEGRAM_ORDERS_CHAT_ID || null,
        inventoryChatId: process.env.TELEGRAM_INVENTORY_CHAT_ID || null,
        ordersEnabled: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ORDERS_CHAT_ID),
        inventoryEnabled: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_INVENTORY_CHAT_ID)
      };
      
      if (envConfig.botToken) {
        return envConfig;
      }
      
      // FALLBACK: SystemConfig database (legacy)
      const systemConfigs = await prisma.systemConfig.findMany({
        where: {
          key: {
            in: [
              'TELEGRAM_BOT_TOKEN',
              'TELEGRAM_ORDERS_CHAT_ID', 
              'TELEGRAM_INVENTORY_CHAT_ID',
              'TELEGRAM_ORDERS_ENABLED',
              'TELEGRAM_INVENTORY_ENABLED'
            ]
          }
        }
      });
      
      const configMap = systemConfigs.reduce((acc, config) => {
        acc[config.key] = config.value;
        return acc;
      }, {} as Record<string, string>);
      
      return {
        botToken: configMap.TELEGRAM_BOT_TOKEN || null,
        ordersChatId: configMap.TELEGRAM_ORDERS_CHAT_ID || null,
        inventoryChatId: configMap.TELEGRAM_INVENTORY_CHAT_ID || null,
        ordersEnabled: configMap.TELEGRAM_ORDERS_ENABLED === 'true',
        inventoryEnabled: configMap.TELEGRAM_INVENTORY_ENABLED === 'true'
      };
    } catch (error) {
      console.error('Error extracting global config:', error);
      return {
        botToken: null,
        ordersChatId: null,
        inventoryChatId: null,
        ordersEnabled: false,
        inventoryEnabled: false
      };
    }
  }
  
  /**
   * Migrate global configuration to specific user
   * TARGETED: Convert global config to user-specific config
   */
  static async migrateToUser(userId: string): Promise<MigrationResult> {
    try {
      // VALIDATION: Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      });
      
      if (!user) {
        return {
          success: false,
          message: `User with ID ${userId} not found`
        };
      }
      
      // CHECK: If user already has configuration
      const existingConfig = await telegramConfigService.getUserConfig(userId);
      if (existingConfig?.botToken) {
        return {
          success: false,
          message: `User ${user.name || user.email} already has Telegram configuration`
        };
      }
      
      // EXTRACT: Global configuration
      const globalConfig = await this.extractGlobalConfig();
      
      if (!globalConfig.botToken) {
        return {
          success: false,
          message: 'No global Telegram configuration found to migrate'
        };
      }
      
      // MIGRATE: Create user configuration
      const userConfig = await telegramConfigService.updateUserConfig(userId, {
        botToken: globalConfig.botToken,
        ordersEnabled: globalConfig.ordersEnabled,
        ordersChatId: globalConfig.ordersChatId,
        inventoryEnabled: globalConfig.inventoryEnabled,
        inventoryChatId: globalConfig.inventoryChatId,
        dailySummaryEnabled: false, // Default value for new field
        summaryTime: '09:00', // Default summary time
        timezone: 'Asia/Kuala_Lumpur'
      });
      
      return {
        success: true,
        message: `Successfully migrated global configuration to user ${user.name || user.email}`,
        details: {
          userId,
          userName: user.name,
          userEmail: user.email,
          migratedConfig: {
            ordersEnabled: userConfig.ordersEnabled,
            inventoryEnabled: userConfig.inventoryEnabled,
            dailySummaryEnabled: userConfig.dailySummaryEnabled
          }
        }
      };
    } catch (error) {
      console.error('Error migrating to user:', error);
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Migrate global configuration to all admin users
   * BULK: Mass migration for admin users
   */
  static async migrateToAllAdmins(): Promise<MigrationResult> {
    try {
      // FIND: All admin users
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true }
      });
      
      if (adminUsers.length === 0) {
        return {
          success: false,
          message: 'No admin users found to migrate configuration to'
        };
      }
      
      // MIGRATE: Each admin user
      const results = [];
      for (const admin of adminUsers) {
        const result = await this.migrateToUser(admin.id);
        results.push({
          userId: admin.id,
          userName: admin.name,
          userEmail: admin.email,
          success: result.success,
          message: result.message
        });
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      return {
        success: successCount > 0,
        message: `Migration completed: ${successCount} successful, ${failureCount} failed`,
        details: {
          totalAdmins: adminUsers.length,
          successful: successCount,
          failed: failureCount,
          results
        }
      };
    } catch (error) {
      console.error('Error migrating to all admins:', error);
      return {
        success: false,
        message: `Bulk migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Create global fallback configuration
   * BACKWARD COMPATIBILITY: Maintain global config as fallback
   */
  static async createGlobalFallback(): Promise<MigrationResult> {
    try {
      const globalConfig = await this.extractGlobalConfig();
      
      if (!globalConfig.botToken) {
        return {
          success: false,
          message: 'No global configuration found to preserve as fallback'
        };
      }
      
      // PRESERVE: Global configuration in SystemConfig for fallback
      const configEntries = [
        { key: 'TELEGRAM_BOT_TOKEN', value: globalConfig.botToken },
        { key: 'TELEGRAM_ORDERS_CHAT_ID', value: globalConfig.ordersChatId || '' },
        { key: 'TELEGRAM_INVENTORY_CHAT_ID', value: globalConfig.inventoryChatId || '' },
        { key: 'TELEGRAM_ORDERS_ENABLED', value: globalConfig.ordersEnabled.toString() },
        { key: 'TELEGRAM_INVENTORY_ENABLED', value: globalConfig.inventoryEnabled.toString() }
      ];
      
      for (const entry of configEntries) {
        await prisma.systemConfig.upsert({
          where: { key: entry.key },
          update: { value: entry.value },
          create: { key: entry.key, value: entry.value }
        });
      }
      
      return {
        success: true,
        message: 'Global fallback configuration created successfully',
        details: {
          configEntries: configEntries.length,
          ordersEnabled: globalConfig.ordersEnabled,
          inventoryEnabled: globalConfig.inventoryEnabled
        }
      };
    } catch (error) {
      console.error('Error creating global fallback:', error);
      return {
        success: false,
        message: `Failed to create global fallback: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Validate migration result
   * VERIFICATION: Ensure migration was successful
   */
  static async validateMigration(userId: string): Promise<MigrationResult> {
    try {
      // CHECK: User configuration exists and is valid
      const userConfig = await telegramConfigService.getUserConfig(userId);
      
      if (!userConfig || !userConfig.botToken) {
        return {
          success: false,
          message: 'User configuration not found or invalid'
        };
      }
      
      // TEST: Service functionality
      const service = await TelegramServiceFactory.getServiceForUser(userId);
      const isConfigured = await service.isConfigured();
      
      if (!isConfigured) {
        return {
          success: false,
          message: 'User service is not properly configured'
        };
      }
      
      // SUCCESS: Migration validation passed
      return {
        success: true,
        message: 'Migration validation successful',
        details: {
          userId,
          configured: isConfigured,
          ordersEnabled: userConfig.ordersEnabled,
          inventoryEnabled: userConfig.inventoryEnabled,
          dailySummaryEnabled: userConfig.dailySummaryEnabled,
          verified: userConfig.verified
        }
      };
    } catch (error) {
      console.error('Error validating migration:', error);
      return {
        success: false,
        message: `Migration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Full migration workflow
   * COMPREHENSIVE: Complete migration process with validation
   */
  static async runFullMigration(targetUserId?: string): Promise<MigrationResult> {
    try {
      // STEP 1: Check if migration is needed
      const migrationCheck = await this.needsMigration();
      
      if (!migrationCheck.needed) {
        return {
          success: false,
          message: `Migration not needed: ${migrationCheck.reason}`
        };
      }
      
      // STEP 2: Create global fallback
      const fallbackResult = await this.createGlobalFallback();
      if (!fallbackResult.success) {
        return {
          success: false,
          message: `Failed to create global fallback: ${fallbackResult.message}`
        };
      }
      
      // STEP 3: Perform migration
      const migrationResult = targetUserId 
        ? await this.migrateToUser(targetUserId)
        : await this.migrateToAllAdmins();
      
      if (!migrationResult.success) {
        return {
          success: false,
          message: `Migration failed: ${migrationResult.message}`,
          details: migrationResult.details
        };
      }
      
      // STEP 4: Validate migration (if single user)
      if (targetUserId) {
        const validationResult = await this.validateMigration(targetUserId);
        if (!validationResult.success) {
          return {
            success: false,
            message: `Migration succeeded but validation failed: ${validationResult.message}`
          };
        }
      }
      
      return {
        success: true,
        message: 'Full migration completed successfully',
        details: {
          fallback: fallbackResult.details,
          migration: migrationResult.details
        }
      };
    } catch (error) {
      console.error('Error in full migration:', error);
      return {
        success: false,
        message: `Full migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}