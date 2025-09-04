/**
 * Multi-Tenant Telegram Configuration Service
 * Centralized configuration management with encryption and validation
 * Implements Single Source of Truth pattern for all Telegram settings
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | CENTRALIZED APPROACH
 */

import { prisma } from '@/lib/db/prisma';
import { TelegramConfig } from '@prisma/client';
import {
  TelegramConfiguration,
  TelegramChannel,
  ValidationResult,
  BotTokenValidation,
  ChatIdValidation,
  ConfigurationHistory,
  ConfigurationChange,
  TelegramTestResult,
  TelegramHealthStatus,
  TelegramBotInfo,
  TelegramChannelInfo,
  ITelegramConfigService,
  TELEGRAM_CONFIG_KEYS,
  TELEGRAM_CONFIG_DEFAULTS,
  TELEGRAM_VALIDATION,
} from '@/lib/types/telegram-config.types';
import {
  encryptSensitiveData,
  decryptSensitiveData,
  isEncryptedData,
  safeEncrypt,
  safeDecrypt,
} from '@/lib/utils/encryption';

/**
 * Telegram Configuration Service Implementation
 * Follows SOLID principles and centralized configuration management
 */
export class TelegramConfigService implements ITelegramConfigService {
  private static instance: TelegramConfigService;
  private configCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Singleton pattern for consistent configuration access
  public static getInstance(): TelegramConfigService {
    if (!TelegramConfigService.instance) {
      TelegramConfigService.instance = new TelegramConfigService();
    }
    return TelegramConfigService.instance;
  }

  /**
   * Get configuration value from database with caching
   * Centralized database access with encryption handling
   */
  private async getConfigValue(key: string, encrypted = false): Promise<string | null> {
    const cacheKey = `config_${key}`;
    const now = Date.now();
    
    // Check cache validity
    if (this.configCache.has(cacheKey) && 
        this.cacheExpiry.has(cacheKey) && 
        this.cacheExpiry.get(cacheKey)! > now) {
      return this.configCache.get(cacheKey);
    }

    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key },
      });

      let value: string | null = null;

      if (config) {
        if (encrypted && config.value) {
          try {
            const encryptedData = JSON.parse(config.value);
            if (isEncryptedData(encryptedData)) {
              value = decryptSensitiveData(encryptedData);
            } else {
              // Handle legacy unencrypted values
              value = config.value;
            }
          } catch {
            // If JSON parsing fails, treat as plain text (legacy)
            value = config.value;
          }
        } else {
          value = config.value;
        }
      }

      // Cache the result
      this.configCache.set(cacheKey, value);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);

      return value;
    } catch (error) {
      console.error(`Failed to get config value for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set configuration value in database with encryption
   * Handles encryption for sensitive data and cache invalidation
   */
  private async setConfigValue(
    key: string, 
    value: string | null, 
    userId: string,
    encrypted = false,
    type = 'string'
  ): Promise<void> {
    try {
      // Get old value for change tracking
      const oldValue = await this.getConfigValue(key, encrypted);

      let storedValue: string | null = null;

      if (value !== null) {
        if (encrypted) {
          const encryptedData = encryptSensitiveData(value);
          storedValue = JSON.stringify(encryptedData);
        } else {
          storedValue = value;
        }
      }

      // Update database
      if (storedValue !== null) {
        await prisma.systemConfig.upsert({
          where: { key },
          update: {
            value: storedValue,
            type,
            updatedAt: new Date(),
          },
          create: {
            key,
            value: storedValue,
            type,
          },
        });
      } else {
        // Delete if value is null
        await prisma.systemConfig.deleteMany({
          where: { key },
        });
      }

      // Update metadata
      await this.updateConfigurationMetadata(userId);

      // Log change
      await this.logConfigurationChange(userId, [{
        key,
        oldValue,
        newValue: value,
        timestamp: new Date(),
        userId,
        action: value === null ? 'DELETE' : oldValue === null ? 'CREATE' : 'UPDATE',
      }]);

      // Invalidate cache
      this.configCache.delete(`config_${key}`);
      this.cacheExpiry.delete(`config_${key}`);
      
    } catch (error) {
      console.error(`Failed to set config value for key ${key}:`, error);
      throw new Error(`Configuration update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update configuration metadata (version, timestamp, user)
   */
  private async updateConfigurationMetadata(userId: string): Promise<void> {
    const currentVersion = parseInt(await this.getConfigValue(TELEGRAM_CONFIG_KEYS.CONFIG_VERSION) || '1');
    
    await Promise.all([
      this.setConfigValue(TELEGRAM_CONFIG_KEYS.CONFIG_VERSION, (currentVersion + 1).toString(), userId, false, 'number'),
      this.setConfigValue(TELEGRAM_CONFIG_KEYS.LAST_CONFIGURED_BY, userId, userId, false),
      this.setConfigValue(TELEGRAM_CONFIG_KEYS.LAST_CONFIGURED_AT, new Date().toISOString(), userId, false),
    ]);
  }

  /**
   * Get bot token (encrypted)
   */
  async getBotToken(): Promise<string | null> {
    // Try database first, fallback to environment
    let token = await this.getConfigValue(TELEGRAM_CONFIG_KEYS.BOT_TOKEN, true);
    
    if (!token) {
      token = process.env.TELEGRAM_BOT_TOKEN || null;
    }
    
    return token;
  }

  /**
   * Set bot token (encrypted)
   */
  async setBotToken(token: string, userId: string): Promise<void> {
    // Validate token format
    const validation = await this.validateBotToken(token);
    if (!validation.valid) {
      throw new Error(`Invalid bot token: ${validation.error}`);
    }

    await this.setConfigValue(TELEGRAM_CONFIG_KEYS.BOT_TOKEN, token, userId, true);
    
    // Store bot info if available
    if (validation.botInfo) {
      await Promise.all([
        this.setConfigValue(TELEGRAM_CONFIG_KEYS.BOT_USERNAME, validation.botInfo.username, userId),
        this.setConfigValue(TELEGRAM_CONFIG_KEYS.BOT_FIRST_NAME, validation.botInfo.firstName, userId),
      ]);
    }
  }

  /**
   * Get chat ID for specific channel
   */
  async getChatId(channel: TelegramChannel): Promise<string | null> {
    const key = channel === 'orders' 
      ? TELEGRAM_CONFIG_KEYS.ORDERS_CHAT_ID 
      : TELEGRAM_CONFIG_KEYS.INVENTORY_CHAT_ID;
    
    // Try database first, fallback to environment
    let chatId = await this.getConfigValue(key);
    
    if (!chatId) {
      const envKey = channel === 'orders' 
        ? 'TELEGRAM_ORDERS_CHAT_ID' 
        : 'TELEGRAM_INVENTORY_CHAT_ID';
      chatId = process.env[envKey] || null;
    }
    
    return chatId;
  }

  /**
   * Set chat ID for specific channel
   */
  async setChatId(channel: TelegramChannel, chatId: string, userId: string): Promise<void> {
    const botToken = await this.getBotToken();
    if (!botToken) {
      throw new Error('Bot token must be configured before setting chat IDs');
    }

    // Validate chat ID
    const validation = await this.validateChatId(chatId, botToken);
    if (!validation.valid) {
      throw new Error(`Invalid chat ID: ${validation.error}`);
    }

    const chatIdKey = channel === 'orders' 
      ? TELEGRAM_CONFIG_KEYS.ORDERS_CHAT_ID 
      : TELEGRAM_CONFIG_KEYS.INVENTORY_CHAT_ID;
    
    const chatNameKey = channel === 'orders'
      ? TELEGRAM_CONFIG_KEYS.ORDERS_CHAT_NAME
      : TELEGRAM_CONFIG_KEYS.INVENTORY_CHAT_NAME;

    await Promise.all([
      this.setConfigValue(chatIdKey, chatId, userId),
      this.setConfigValue(chatNameKey, validation.channelInfo?.name || 'Unknown', userId),
    ]);
  }

  /**
   * Validate bot token format and connectivity
   */
  async validateBotToken(token: string): Promise<BotTokenValidation> {
    // Format validation
    if (!TELEGRAM_VALIDATION.BOT_TOKEN_PATTERN.test(token)) {
      return {
        valid: false,
        error: 'Invalid bot token format. Expected format: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
      };
    }

    try {
      // Test API connectivity
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(TELEGRAM_CONFIG_DEFAULTS.TIMEOUT_MS),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          valid: false,
          error: `Bot token validation failed: ${error}`,
        };
      }

      const data = await response.json();
      
      if (!data.ok) {
        return {
          valid: false,
          error: `Bot API error: ${data.description || 'Unknown error'}`,
        };
      }

      const botInfo: TelegramBotInfo = {
        id: data.result.id,
        username: data.result.username,
        firstName: data.result.first_name,
        canJoinGroups: data.result.can_join_groups || false,
        canReadAllGroupMessages: data.result.can_read_all_group_messages || false,
        supportsInlineQueries: data.result.supports_inline_queries || false,
      };

      return {
        valid: true,
        botInfo,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Connection test failed: ${error instanceof Error ? error.message : 'Network error'}`,
      };
    }
  }

  /**
   * Validate chat ID and bot access
   */
  async validateChatId(chatId: string, botToken: string): Promise<ChatIdValidation> {
    // Format validation
    if (!TELEGRAM_VALIDATION.CHAT_ID_PATTERN.test(chatId)) {
      return {
        valid: false,
        error: 'Invalid chat ID format. Expected format: -1001234567890 or 123456789',
      };
    }

    try {
      // Test bot access to chat
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
        signal: AbortSignal.timeout(TELEGRAM_CONFIG_DEFAULTS.TIMEOUT_MS),
      });

      if (!response.ok) {
        return {
          valid: false,
          error: `Chat access test failed: ${response.statusText}`,
        };
      }

      const data = await response.json();
      
      if (!data.ok) {
        return {
          valid: false,
          error: `Chat API error: ${data.description || 'Bot cannot access this chat'}`,
        };
      }

      const chat = data.result;
      const channelInfo: TelegramChannelInfo = {
        id: chat.id.toString(),
        name: chat.title || chat.first_name || 'Unknown',
        type: chat.type,
        memberCount: chat.member_count,
        botIsAdmin: false, // Will be checked separately
        botPermissions: [],
      };

      // Check if bot is admin (optional - depends on chat type)
      if (chat.type === 'group' || chat.type === 'supergroup') {
        try {
          const adminResponse = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              chat_id: chatId, 
              user_id: (await this.validateBotToken(botToken)).botInfo?.id 
            }),
            signal: AbortSignal.timeout(TELEGRAM_CONFIG_DEFAULTS.TIMEOUT_MS),
          });

          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            if (adminData.ok) {
              channelInfo.botIsAdmin = ['administrator', 'creator'].includes(adminData.result.status);
            }
          }
        } catch {
          // Admin check failed, but chat access works
        }
      }

      return {
        valid: true,
        channelInfo,
        warnings: channelInfo.botIsAdmin ? [] : ['Bot is not an admin in this chat - some features may not work'],
      };
    } catch (error) {
      return {
        valid: false,
        error: `Chat validation failed: ${error instanceof Error ? error.message : 'Network error'}`,
      };
    }
  }

  /**
   * Get full configuration
   */
  async getFullConfiguration(): Promise<TelegramConfiguration> {
    const [
      botToken,
      botUsername,
      botFirstName,
      ordersChatId,
      ordersChatName,
      inventoryChatId,
      inventoryChatName,
      ordersEnabled,
      inventoryEnabled,
      dailySummaryEnabled,
      retryAttempts,
      timeoutMs,
      healthCheckInterval,
      configVersion,
      lastConfiguredBy,
      lastConfiguredAt,
    ] = await Promise.all([
      this.getBotToken(),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.BOT_USERNAME),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.BOT_FIRST_NAME),
      this.getChatId('orders'),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.ORDERS_CHAT_NAME),
      this.getChatId('inventory'),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.INVENTORY_CHAT_NAME),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.ORDERS_ENABLED),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.INVENTORY_ENABLED),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.DAILY_SUMMARY_ENABLED),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.RETRY_ATTEMPTS),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.TIMEOUT_MS),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.HEALTH_CHECK_INTERVAL),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.CONFIG_VERSION),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.LAST_CONFIGURED_BY),
      this.getConfigValue(TELEGRAM_CONFIG_KEYS.LAST_CONFIGURED_AT),
    ]);

    return {
      botToken,
      botUsername,
      botFirstName,
      ordersChatId,
      ordersChatName,
      inventoryChatId,
      inventoryChatName,
      ordersEnabled: ordersEnabled === 'true' || TELEGRAM_CONFIG_DEFAULTS.ORDERS_ENABLED,
      inventoryEnabled: inventoryEnabled === 'true' || TELEGRAM_CONFIG_DEFAULTS.INVENTORY_ENABLED,
      dailySummaryEnabled: dailySummaryEnabled === 'true' || TELEGRAM_CONFIG_DEFAULTS.DAILY_SUMMARY_ENABLED,
      retryAttempts: parseInt(retryAttempts || TELEGRAM_CONFIG_DEFAULTS.RETRY_ATTEMPTS.toString()),
      timeoutMs: parseInt(timeoutMs || TELEGRAM_CONFIG_DEFAULTS.TIMEOUT_MS.toString()),
      healthCheckInterval: parseInt(healthCheckInterval || TELEGRAM_CONFIG_DEFAULTS.HEALTH_CHECK_INTERVAL.toString()),
      configVersion: parseInt(configVersion || TELEGRAM_CONFIG_DEFAULTS.CONFIG_VERSION.toString()),
      lastConfiguredBy,
      lastConfiguredAt,
    };
  }

  /**
   * Update configuration (partial update)
   */
  async updateConfiguration(config: Partial<TelegramConfiguration>, userId: string): Promise<void> {
    const updates: Promise<void>[] = [];

    if (config.botToken !== undefined) {
      updates.push(this.setBotToken(config.botToken, userId));
    }

    if (config.ordersChatId !== undefined) {
      updates.push(this.setChatId('orders', config.ordersChatId, userId));
    }

    if (config.inventoryChatId !== undefined) {
      updates.push(this.setChatId('inventory', config.inventoryChatId, userId));
    }

    if (config.ordersEnabled !== undefined) {
      updates.push(this.setConfigValue(TELEGRAM_CONFIG_KEYS.ORDERS_ENABLED, config.ordersEnabled.toString(), userId, false, 'boolean'));
    }

    if (config.inventoryEnabled !== undefined) {
      updates.push(this.setConfigValue(TELEGRAM_CONFIG_KEYS.INVENTORY_ENABLED, config.inventoryEnabled.toString(), userId, false, 'boolean'));
    }

    if (config.dailySummaryEnabled !== undefined) {
      updates.push(this.setConfigValue(TELEGRAM_CONFIG_KEYS.DAILY_SUMMARY_ENABLED, config.dailySummaryEnabled.toString(), userId, false, 'boolean'));
    }

    if (config.retryAttempts !== undefined) {
      updates.push(this.setConfigValue(TELEGRAM_CONFIG_KEYS.RETRY_ATTEMPTS, config.retryAttempts.toString(), userId, false, 'number'));
    }

    if (config.timeoutMs !== undefined) {
      updates.push(this.setConfigValue(TELEGRAM_CONFIG_KEYS.TIMEOUT_MS, config.timeoutMs.toString(), userId, false, 'number'));
    }

    if (config.healthCheckInterval !== undefined) {
      updates.push(this.setConfigValue(TELEGRAM_CONFIG_KEYS.HEALTH_CHECK_INTERVAL, config.healthCheckInterval.toString(), userId, false, 'number'));
    }

    await Promise.all(updates);
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfiguration(userId: string): Promise<void> {
    const keys = Object.values(TELEGRAM_CONFIG_KEYS);
    
    await Promise.all(
      keys.map(key => 
        prisma.systemConfig.deleteMany({ where: { key } })
      )
    );

    // Clear cache
    this.configCache.clear();
    this.cacheExpiry.clear();

    // Set default values
    await this.updateConfiguration({
      ordersEnabled: TELEGRAM_CONFIG_DEFAULTS.ORDERS_ENABLED,
      inventoryEnabled: TELEGRAM_CONFIG_DEFAULTS.INVENTORY_ENABLED,
      dailySummaryEnabled: TELEGRAM_CONFIG_DEFAULTS.DAILY_SUMMARY_ENABLED,
      retryAttempts: TELEGRAM_CONFIG_DEFAULTS.RETRY_ATTEMPTS,
      timeoutMs: TELEGRAM_CONFIG_DEFAULTS.TIMEOUT_MS,
      healthCheckInterval: TELEGRAM_CONFIG_DEFAULTS.HEALTH_CHECK_INTERVAL,
    }, userId);
  }

  /**
   * Check if feature is enabled
   */
  async isFeatureEnabled(feature: 'orders' | 'inventory' | 'dailySummary'): Promise<boolean> {
    const key = {
      orders: TELEGRAM_CONFIG_KEYS.ORDERS_ENABLED,
      inventory: TELEGRAM_CONFIG_KEYS.INVENTORY_ENABLED,
      dailySummary: TELEGRAM_CONFIG_KEYS.DAILY_SUMMARY_ENABLED,
    }[feature];

    const value = await this.getConfigValue(key);
    return value === 'true' || TELEGRAM_CONFIG_DEFAULTS.ORDERS_ENABLED;
  }

  /**
   * Set feature enabled state
   */
  async setFeatureEnabled(
    feature: 'orders' | 'inventory' | 'dailySummary', 
    enabled: boolean, 
    userId: string
  ): Promise<void> {
    const key = {
      orders: TELEGRAM_CONFIG_KEYS.ORDERS_ENABLED,
      inventory: TELEGRAM_CONFIG_KEYS.INVENTORY_ENABLED,
      dailySummary: TELEGRAM_CONFIG_KEYS.DAILY_SUMMARY_ENABLED,
    }[feature];

    await this.setConfigValue(key, enabled.toString(), userId, false, 'boolean');
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<TelegramHealthStatus> {
    const config = await this.getFullConfiguration();
    
    // Basic configuration check
    const configured = !!(config.botToken && (config.ordersChatId || config.inventoryChatId));
    
    if (!configured) {
      return {
        configured: false,
        healthy: false,
        lastCheck: null,
        queuedMessages: 0,
        status: 'not_configured',
        channels: {
          orders: null,
          inventory: null,
        },
      };
    }

    // Test bot connection
    let botInfo: TelegramBotInfo | undefined;
    let healthy = false;

    if (config.botToken) {
      const validation = await this.validateBotToken(config.botToken);
      healthy = validation.valid;
      botInfo = validation.botInfo;
    }

    // Test channel access
    const channels = {
      orders: null as TelegramChannelInfo | null,
      inventory: null as TelegramChannelInfo | null,
    };

    if (healthy && config.botToken) {
      if (config.ordersChatId) {
        const validation = await this.validateChatId(config.ordersChatId, config.botToken);
        if (validation.valid) {
          channels.orders = validation.channelInfo || null;
        }
      }

      if (config.inventoryChatId) {
        const validation = await this.validateChatId(config.inventoryChatId, config.botToken);
        if (validation.valid) {
          channels.inventory = validation.channelInfo || null;
        }
      }
    }

    return {
      configured: true,
      healthy,
      lastCheck: new Date(),
      queuedMessages: 0, // Would be implemented with queue system
      status: healthy ? 'healthy' : 'unhealthy',
      botInfo,
      channels,
    };
  }

  /**
   * Test configuration
   */
  async testConfiguration(): Promise<TelegramTestResult> {
    const config = await this.getFullConfiguration();
    
    if (!config.botToken) {
      return {
        success: false,
        message: 'Bot token not configured',
        timestamp: new Date(),
      };
    }

    const botValidation = await this.validateBotToken(config.botToken);
    if (!botValidation.valid) {
      return {
        success: false,
        message: `Bot token invalid: ${botValidation.error}`,
        timestamp: new Date(),
      };
    }

    // Test at least one channel
    const testChatId = config.ordersChatId || config.inventoryChatId;
    if (!testChatId) {
      return {
        success: false,
        message: 'No channels configured for testing',
        timestamp: new Date(),
      };
    }

    const chatValidation = await this.validateChatId(testChatId, config.botToken);
    if (!chatValidation.valid) {
      return {
        success: false,
        message: `Channel access failed: ${chatValidation.error}`,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      message: 'Configuration test successful',
      timestamp: new Date(),
      details: {
        chatId: testChatId,
        responseTime: 0, // Would measure actual response time
      },
    };
  }

  /**
   * Log configuration change
   */
  async logConfigurationChange(userId: string, changes: ConfigurationChange[]): Promise<void> {
    // For now, we'll use console logging
    // In production, this would go to audit log table
    console.log('Configuration change:', {
      userId,
      timestamp: new Date(),
      changes: changes.map(c => ({
        key: c.key,
        action: c.action,
        hasOldValue: !!c.oldValue,
        hasNewValue: !!c.newValue,
      })),
    });
  }

  /**
   * Get configuration history
   */
  async getConfigurationHistory(limit = 50): Promise<ConfigurationHistory[]> {
    // Placeholder implementation
    // In production, this would query audit log table
    return [];
  }

  // ==================== MULTI-TENANT METHODS ====================
  // Following @CLAUDE.md: CENTRALIZED APPROACH | DRY | NO HARDCODE

  /**
   * Get user's Telegram configuration with fallback to global
   * CENTRALIZED configuration loading with systematic fallback
   */
  async getUserConfig(userId: string): Promise<TelegramConfig | null> {
    try {
      // PRIMARY: User-specific configuration
      const userConfig = await prisma.telegramConfig.findUnique({
        where: { userId },
        include: { user: true }
      });
      
      if (userConfig?.botToken) {
        // DECRYPT sensitive data before returning
        if (userConfig.botToken) {
          try {
            const encryptedData = JSON.parse(userConfig.botToken);
            if (isEncryptedData(encryptedData)) {
              userConfig.botToken = decryptSensitiveData(encryptedData);
            }
          } catch {
            // Handle legacy unencrypted values - keep as is
          }
        }
        return userConfig;
      }
      
      // FALLBACK: Check global configuration (SystemConfig or .env)
      const globalConfig = await this.getGlobalConfiguration();
      
      // SYSTEMATIC: Convert global to user format if exists
      if (globalConfig.botToken) {
        return this.convertGlobalToUserConfig(globalConfig, userId);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get user Telegram config:', error);
      return null;
    }
  }

  /**
   * Update user's Telegram configuration
   * CENTRALIZED update with validation and encryption
   */
  async updateUserConfig(
    userId: string, 
    config: Partial<Omit<TelegramConfig, 'id' | 'userId' | 'user'>>
  ): Promise<TelegramConfig> {
    // SYSTEMATIC validation
    const validationResult = await this.validateUserConfig(config);
    if (!validationResult.isValid) {
      throw new Error(`Invalid configuration: ${validationResult.errors.join(', ')}`);
    }
    
    // ENCRYPTION: Secure sensitive data
    const processedConfig = await this.encryptSensitiveFields(config);
    
    // SINGLE SOURCE OF TRUTH: Upsert operation
    const result = await prisma.telegramConfig.upsert({
      where: { userId },
      create: { 
        userId, 
        ...processedConfig,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      update: { 
        ...processedConfig, 
        updatedAt: new Date() 
      },
      include: { user: true }
    });

    // DECRYPT for return (service contract expects decrypted data)
    if (result.botToken) {
      try {
        const encryptedData = JSON.parse(result.botToken);
        if (isEncryptedData(encryptedData)) {
          result.botToken = decryptSensitiveData(encryptedData);
        }
      } catch {
        // Handle legacy unencrypted values
      }
    }

    return result;
  }

  /**
   * Delete user's Telegram configuration
   * SYSTEMATIC cleanup with cascade handling
   */
  async deleteUserConfig(userId: string): Promise<void> {
    try {
      await prisma.telegramConfig.delete({
        where: { userId }
      });
    } catch (error) {
      console.error('Failed to delete user Telegram config:', error);
      throw new Error('Failed to delete user configuration');
    }
  }

  /**
   * Get all users with Telegram configurations (Admin use)
   * CENTRALIZED user management
   */
  async getAllUserConfigs(): Promise<Array<TelegramConfig & { user: { id: string; email: string; name: string } }>> {
    try {
      const configs = await prisma.telegramConfig.findMany({
        include: {
          user: {
            select: { 
              id: true, 
              email: true, 
              firstName: true, 
              lastName: true 
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // DECRYPT sensitive data for admin view
      return configs.map(config => ({
        ...config,
        user: {
          id: config.user.id,
          email: config.user.email,
          name: `${config.user.firstName} ${config.user.lastName}`.trim()
        },
        // Keep botToken encrypted for security in list view
        botToken: config.botToken ? '***ENCRYPTED***' : null
      }));
    } catch (error) {
      console.error('Failed to get all user configs:', error);
      throw new Error('Failed to retrieve user configurations');
    }
  }

  /**
   * Validate user bot token and channels
   * NO HARDCODED validation rules - all from centralized config
   */
  async validateUserBotToken(userId: string, botToken: string): Promise<ValidationResult> {
    // SYSTEMATIC validation following existing patterns
    return this.validateBotTokenWithTelegram(botToken);
  }

  /**
   * Get global configuration for fallback
   * CENTRALIZED global config access
   */
  private async getGlobalConfiguration(): Promise<any> {
    try {
      // Check environment variables first
      const envConfig = {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        ordersChatId: process.env.TELEGRAM_ORDERS_CHAT_ID,
        inventoryChatId: process.env.TELEGRAM_INVENTORY_CHAT_ID
      };

      if (envConfig.botToken) {
        return {
          botToken: envConfig.botToken,
          ordersEnabled: !!envConfig.ordersChatId,
          ordersChatId: envConfig.ordersChatId,
          inventoryEnabled: !!envConfig.inventoryChatId,
          inventoryChatId: envConfig.inventoryChatId,
          dailySummaryEnabled: true,
          timezone: 'Asia/Kuala_Lumpur',
          verified: false
        };
      }

      // FALLBACK: Check SystemConfig
      const globalConfigs = await prisma.systemConfig.findMany({
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

      if (globalConfigs.length > 0) {
        return this.convertSystemConfigToStructured(globalConfigs);
      }

      return { botToken: null };
    } catch (error) {
      console.error('Failed to get global configuration:', error);
      return { botToken: null };
    }
  }

  /**
   * Convert global configuration to user format
   * SYSTEMATIC data transformation
   */
  private convertGlobalToUserConfig(globalConfig: any, userId: string): TelegramConfig {
    return {
      id: '', // Will be set by database
      userId,
      botToken: globalConfig.botToken,
      botUsername: null,
      ordersEnabled: globalConfig.ordersEnabled || false,
      ordersChatId: globalConfig.ordersChatId || null,
      inventoryEnabled: globalConfig.inventoryEnabled || false,
      inventoryChatId: globalConfig.inventoryChatId || null,
      dailySummaryEnabled: globalConfig.dailySummaryEnabled || false,
      summaryTime: null,
      timezone: globalConfig.timezone || 'Asia/Kuala_Lumpur',
      verified: globalConfig.verified || false,
      lastHealthCheck: null,
      healthStatus: 'UNKNOWN',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Convert SystemConfig array to structured format
   * SYSTEMATIC data transformation
   */
  private convertSystemConfigToStructured(configs: any[]): any {
    const configMap = configs.reduce((acc, config) => {
      let value = config.value;
      // Handle encrypted values
      if (config.key === 'TELEGRAM_BOT_TOKEN' && config.value) {
        try {
          const encryptedData = JSON.parse(config.value);
          if (isEncryptedData(encryptedData)) {
            value = decryptSensitiveData(encryptedData);
          }
        } catch {
          // Legacy unencrypted value
        }
      }
      acc[config.key] = value;
      return acc;
    }, {} as Record<string, string>);

    return {
      botToken: configMap.TELEGRAM_BOT_TOKEN || null,
      ordersEnabled: configMap.TELEGRAM_ORDERS_ENABLED === 'true',
      ordersChatId: configMap.TELEGRAM_ORDERS_CHAT_ID || null,
      inventoryEnabled: configMap.TELEGRAM_INVENTORY_ENABLED === 'true',
      inventoryChatId: configMap.TELEGRAM_INVENTORY_CHAT_ID || null,
      dailySummaryEnabled: true,
      timezone: 'Asia/Kuala_Lumpur',
      verified: false
    };
  }

  /**
   * Validate user configuration data
   * CENTRALIZED validation logic
   */
  private async validateUserConfig(config: any): Promise<ValidationResult> {
    const errors: string[] = [];

    // Bot token validation
    if (config.botToken) {
      if (!config.botToken.startsWith('bot') && !config.botToken.includes(':')) {
        errors.push('Invalid bot token format');
      }
    }

    // Chat ID validation
    if (config.ordersChatId && !config.ordersChatId.startsWith('-')) {
      errors.push('Orders chat ID must be a negative number (group/channel ID)');
    }

    if (config.inventoryChatId && !config.inventoryChatId.startsWith('-')) {
      errors.push('Inventory chat ID must be a negative number (group/channel ID)');
    }

    // Timezone validation
    if (config.timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: config.timezone });
      } catch {
        errors.push('Invalid timezone');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Encrypt sensitive fields in configuration
   * SYSTEMATIC encryption handling
   */
  private async encryptSensitiveFields(config: any): Promise<any> {
    const processed = { ...config };

    // Encrypt bot token if provided
    if (processed.botToken && processed.botToken !== '***ENCRYPTED***') {
      const encryptedData = encryptSensitiveData(processed.botToken);
      processed.botToken = JSON.stringify(encryptedData);
    }

    return processed;
  }
}

// Export singleton instance
export const telegramConfigService = TelegramConfigService.getInstance();