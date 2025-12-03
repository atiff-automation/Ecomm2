/**
 * Admin Telegram Configuration Service - Malaysian E-commerce Platform
 * CENTRALIZED admin telegram configuration management
 * Follows @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH | CENTRALIZED
 */

import { prisma } from '@/lib/db/prisma';
import { AdminTelegramConfig } from '@prisma/client';

export interface AdminTelegramConfigData {
  botToken: string;
  ordersChatId: string;
  inventoryChatId?: string;
  chatManagementChatId?: string;
  systemAlertsChatId?: string;
  formSubmissionsChatId?: string;
  ordersEnabled?: boolean;
  inventoryEnabled?: boolean;
  chatManagementEnabled?: boolean;
  systemAlertsEnabled?: boolean;
  formSubmissionsEnabled?: boolean;
  dailySummaryEnabled?: boolean;
  timezone?: string;
}

export class AdminTelegramConfigService {
  /**
   * SINGLE SOURCE OF TRUTH: Get active admin telegram configuration
   * CENTRALIZED: Only one active config allowed
   */
  static async getActiveConfig(): Promise<AdminTelegramConfig | null> {
    try {
      return await prisma.adminTelegramConfig.findFirst({
        where: { isActive: true },
      });
    } catch (error) {
      console.error('Failed to get active admin telegram config:', error);
      return null;
    }
  }

  /**
   * CENTRALIZED: Create or update admin telegram configuration
   * NO HARDCODE: All values from admin input
   * DRY: Single method for create/update
   */
  static async upsertConfig(
    data: AdminTelegramConfigData,
    adminUserId?: string
  ): Promise<AdminTelegramConfig> {
    try {
      // SINGLE SOURCE OF TRUTH: Use transaction to safely update/create
      return await prisma.$transaction(async tx => {
        // Check if active config exists
        const existingConfig = await tx.adminTelegramConfig.findFirst({
          where: { isActive: true },
        });

        if (existingConfig) {
          // Update existing active config
          return await tx.adminTelegramConfig.update({
            where: { id: existingConfig.id },
            data: {
              botToken: data.botToken,
              ordersChatId: data.ordersChatId,
              inventoryChatId: data.inventoryChatId,
              chatManagementChatId: data.chatManagementChatId,
              systemAlertsChatId: data.systemAlertsChatId,
              formSubmissionsChatId: data.formSubmissionsChatId,
              ordersEnabled: data.ordersEnabled ?? true,
              inventoryEnabled: data.inventoryEnabled ?? true,
              chatManagementEnabled: data.chatManagementEnabled ?? true,
              systemAlertsEnabled: data.systemAlertsEnabled ?? true,
              formSubmissionsEnabled: data.formSubmissionsEnabled ?? true,
              dailySummaryEnabled: data.dailySummaryEnabled ?? true,
              timezone: data.timezone ?? 'Asia/Kuala_Lumpur',
              updatedBy: null,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new active config
          return await tx.adminTelegramConfig.create({
            data: {
              botToken: data.botToken,
              ordersChatId: data.ordersChatId,
              inventoryChatId: data.inventoryChatId,
              chatManagementChatId: data.chatManagementChatId,
              systemAlertsChatId: data.systemAlertsChatId,
              formSubmissionsChatId: data.formSubmissionsChatId,
              ordersEnabled: data.ordersEnabled ?? true,
              inventoryEnabled: data.inventoryEnabled ?? true,
              chatManagementEnabled: data.chatManagementEnabled ?? true,
              systemAlertsEnabled: data.systemAlertsEnabled ?? true,
              formSubmissionsEnabled: data.formSubmissionsEnabled ?? true,
              dailySummaryEnabled: data.dailySummaryEnabled ?? true,
              timezone: data.timezone ?? 'Asia/Kuala_Lumpur',
              isActive: true,
              createdBy: null,
              updatedBy: null,
            },
          });
        }
      });
    } catch (error) {
      console.error('Failed to upsert admin telegram config:', error);
      throw new Error('Failed to save telegram configuration');
    }
  }

  /**
   * DRY: Update existing configuration
   * CENTRALIZED: Only active config can be updated
   */
  static async updateConfig(
    data: Partial<AdminTelegramConfigData>,
    adminUserId?: string
  ): Promise<AdminTelegramConfig | null> {
    try {
      const activeConfig = await this.getActiveConfig();
      if (!activeConfig) {
        throw new Error('No active telegram configuration found');
      }

      return await prisma.adminTelegramConfig.update({
        where: { id: activeConfig.id },
        data: {
          ...data,
          updatedBy: null,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to update admin telegram config:', error);
      throw new Error('Failed to update telegram configuration');
    }
  }

  /**
   * CENTRALIZED: Delete configuration (admin only)
   */
  static async deleteConfig(configId: string): Promise<boolean> {
    try {
      await prisma.adminTelegramConfig.delete({
        where: { id: configId },
      });
      return true;
    } catch (error) {
      console.error('Failed to delete admin telegram config:', error);
      return false;
    }
  }

  /**
   * DRY: Test configuration validity
   * NO HARDCODE: Use actual config values
   */
  static async testConfig(config: AdminTelegramConfigData): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Test bot token validity
      const botTestResponse = await fetch(
        `https://api.telegram.org/bot${config.botToken}/getMe`,
        { method: 'GET', signal: AbortSignal.timeout(10000) }
      );

      if (!botTestResponse.ok) {
        return {
          success: false,
          message: 'Invalid bot token - unable to connect to Telegram API',
        };
      }

      // Test orders chat ID if provided
      if (config.ordersChatId) {
        const ordersTestResponse = await fetch(
          `https://api.telegram.org/bot${config.botToken}/getChat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: config.ordersChatId }),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!ordersTestResponse.ok) {
          return {
            success: false,
            message: 'Invalid orders chat ID - bot cannot access this group',
          };
        }
      }

      // Test inventory chat ID if provided
      if (config.inventoryChatId) {
        const inventoryTestResponse = await fetch(
          `https://api.telegram.org/bot${config.botToken}/getChat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: config.inventoryChatId }),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!inventoryTestResponse.ok) {
          return {
            success: false,
            message: 'Invalid inventory chat ID - bot cannot access this group',
          };
        }
      }

      // Test chat management chat ID if provided
      if (config.chatManagementChatId) {
        const chatMgmtTestResponse = await fetch(
          `https://api.telegram.org/bot${config.botToken}/getChat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: config.chatManagementChatId }),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!chatMgmtTestResponse.ok) {
          return {
            success: false,
            message:
              'Invalid chat management chat ID - bot cannot access this group',
          };
        }
      }

      // Test system alerts chat ID if provided
      if (config.systemAlertsChatId) {
        const systemAlertsTestResponse = await fetch(
          `https://api.telegram.org/bot${config.botToken}/getChat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: config.systemAlertsChatId }),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!systemAlertsTestResponse.ok) {
          return {
            success: false,
            message:
              'Invalid system alerts chat ID - bot cannot access this group',
          };
        }
      }

      // Test form submissions chat ID if provided
      if (config.formSubmissionsChatId) {
        const formSubmissionsTestResponse = await fetch(
          `https://api.telegram.org/bot${config.botToken}/getChat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: config.formSubmissionsChatId }),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!formSubmissionsTestResponse.ok) {
          return {
            success: false,
            message:
              'Invalid form submissions chat ID - bot cannot access this group',
          };
        }
      }

      return {
        success: true,
        message: 'Configuration validated successfully',
      };
    } catch (error) {
      console.error('Config test failed:', error);
      return {
        success: false,
        message: 'Configuration test failed - please check your settings',
      };
    }
  }

  /**
   * SINGLE SOURCE OF TRUTH: Check if admin telegram is configured
   */
  static async isConfigured(): Promise<boolean> {
    try {
      const config = await this.getActiveConfig();
      return !!(config?.botToken && config?.ordersChatId);
    } catch (error) {
      console.error('Failed to check admin telegram config status:', error);
      return false;
    }
  }

  /**
   * DRY: Get configuration for specific features
   */
  static async isOrdersEnabled(): Promise<boolean> {
    try {
      const config = await this.getActiveConfig();
      return !!(
        config?.botToken &&
        config?.ordersChatId &&
        config?.ordersEnabled
      );
    } catch (error) {
      return false;
    }
  }

  static async isInventoryEnabled(): Promise<boolean> {
    try {
      const config = await this.getActiveConfig();
      return !!(
        config?.botToken &&
        config?.inventoryChatId &&
        config?.inventoryEnabled
      );
    } catch (error) {
      return false;
    }
  }

  static async isChatManagementEnabled(): Promise<boolean> {
    try {
      const config = await this.getActiveConfig();
      return !!(
        config?.botToken &&
        config?.chatManagementChatId &&
        config?.chatManagementEnabled
      );
    } catch (error) {
      return false;
    }
  }

  static async isSystemAlertsEnabled(): Promise<boolean> {
    try {
      const config = await this.getActiveConfig();
      return !!(
        config?.botToken &&
        config?.systemAlertsChatId &&
        config?.systemAlertsEnabled
      );
    } catch (error) {
      return false;
    }
  }

  static async isFormSubmissionsEnabled(): Promise<boolean> {
    try {
      const config = await this.getActiveConfig();
      return !!(
        config?.botToken &&
        config?.formSubmissionsChatId &&
        config?.formSubmissionsEnabled
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * CENTRALIZED: Get all telegram configs for admin management
   */
  static async getAllConfigs(): Promise<AdminTelegramConfig[]> {
    try {
      return await prisma.adminTelegramConfig.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Failed to get all admin telegram configs:', error);
      return [];
    }
  }
}

// SINGLE SOURCE OF TRUTH: Export singleton instance following @CLAUDE.md
export const adminTelegramConfigService = AdminTelegramConfigService;
