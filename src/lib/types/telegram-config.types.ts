/**
 * Telegram Configuration System - Type Definitions
 * Centralized type definitions for Telegram configuration system
 */

export interface TelegramBotInfo {
  id: number;
  username: string;
  firstName: string;
  canJoinGroups: boolean;
  canReadAllGroupMessages: boolean;
  supportsInlineQueries: boolean;
}

export interface TelegramChannelInfo {
  id: string;
  name: string;
  type: 'group' | 'supergroup' | 'channel';
  memberCount?: number;
  botIsAdmin: boolean;
  botPermissions: string[];
}

export interface TelegramConfiguration {
  // Bot Configuration
  botToken: string | null;
  botUsername: string | null;
  botFirstName: string | null;
  
  // Channel Configuration
  ordersChatId: string | null;
  ordersChatName: string | null;
  inventoryChatId: string | null;
  inventoryChatName: string | null;
  
  // Feature Toggles
  ordersEnabled: boolean;
  inventoryEnabled: boolean;
  dailySummaryEnabled: boolean;
  
  // Advanced Settings
  retryAttempts: number;
  timeoutMs: number;
  healthCheckInterval: number;
  
  // Security & Audit
  configVersion: number;
  lastConfiguredBy: string | null;
  lastConfiguredAt: string | null;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  data?: any;
}

export interface BotTokenValidation extends ValidationResult {
  botInfo?: TelegramBotInfo;
}

export interface ChatIdValidation extends ValidationResult {
  channelInfo?: TelegramChannelInfo;
}

export interface ConfigurationChange {
  key: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: Date;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
}

export interface ConfigurationHistory {
  id: string;
  changes: ConfigurationChange[];
  timestamp: Date;
  userId: string;
  userEmail?: string;
  summary: string;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  algorithm: string;
}

export interface TelegramTestResult {
  success: boolean;
  message: string;
  timestamp: Date;
  details?: {
    messageId?: number;
    chatId?: string;
    responseTime?: number;
    error?: string;
  };
}

export interface TelegramHealthStatus {
  configured: boolean;
  healthy: boolean;
  lastCheck: Date | null;
  queuedMessages: number;
  status: 'not_configured' | 'healthy' | 'unhealthy';
  botInfo?: TelegramBotInfo;
  channels: {
    orders: TelegramChannelInfo | null;
    inventory: TelegramChannelInfo | null;
  };
}

// Configuration Keys Constants (Single Source of Truth)
export const TELEGRAM_CONFIG_KEYS = {
  // Bot Configuration
  BOT_TOKEN: 'TELEGRAM_BOT_TOKEN',
  BOT_USERNAME: 'TELEGRAM_BOT_USERNAME', 
  BOT_FIRST_NAME: 'TELEGRAM_BOT_FIRST_NAME',
  
  // Channel Configuration
  ORDERS_CHAT_ID: 'TELEGRAM_ORDERS_CHAT_ID',
  ORDERS_CHAT_NAME: 'TELEGRAM_ORDERS_CHAT_NAME',
  INVENTORY_CHAT_ID: 'TELEGRAM_INVENTORY_CHAT_ID',
  INVENTORY_CHAT_NAME: 'TELEGRAM_INVENTORY_CHAT_NAME',
  
  // Feature Toggles
  ORDERS_ENABLED: 'TELEGRAM_ORDERS_ENABLED',
  INVENTORY_ENABLED: 'TELEGRAM_INVENTORY_ENABLED',
  DAILY_SUMMARY_ENABLED: 'TELEGRAM_DAILY_SUMMARY_ENABLED',
  
  // Advanced Settings
  RETRY_ATTEMPTS: 'TELEGRAM_RETRY_ATTEMPTS',
  TIMEOUT_MS: 'TELEGRAM_TIMEOUT_MS',
  HEALTH_CHECK_INTERVAL: 'TELEGRAM_HEALTH_CHECK_INTERVAL',
  
  // Security & Audit
  CONFIG_VERSION: 'TELEGRAM_CONFIG_VERSION',
  LAST_CONFIGURED_BY: 'TELEGRAM_LAST_CONFIGURED_BY',
  LAST_CONFIGURED_AT: 'TELEGRAM_LAST_CONFIGURED_AT',
} as const;

// Default Configuration Values (Single Source of Truth)
export const TELEGRAM_CONFIG_DEFAULTS = {
  ORDERS_ENABLED: true,
  INVENTORY_ENABLED: true,
  DAILY_SUMMARY_ENABLED: true,
  RETRY_ATTEMPTS: 3,
  TIMEOUT_MS: 30000,
  HEALTH_CHECK_INTERVAL: 300000, // 5 minutes
  CONFIG_VERSION: 1,
} as const;

// Validation Patterns (Single Source of Truth)
export const TELEGRAM_VALIDATION = {
  BOT_TOKEN_PATTERN: /^\d+:[A-Za-z0-9_-]{35}$/,
  CHAT_ID_PATTERN: /^-?[0-9]+$/,
  USERNAME_PATTERN: /^[a-zA-Z0-9_]{5,32}$/,
  TIMEOUT_RANGE: [5000, 120000], // 5s to 2min
  RETRY_RANGE: [1, 10],
  HEALTH_CHECK_RANGE: [60000, 3600000], // 1min to 1hour
} as const;

export type TelegramConfigKey = keyof typeof TELEGRAM_CONFIG_KEYS;
export type TelegramChannel = 'orders' | 'inventory';

/**
 * Configuration service interface for dependency injection
 * Following SOLID principles
 */
export interface ITelegramConfigService {
  // Core configuration methods
  getBotToken(): Promise<string | null>;
  setBotToken(token: string, userId: string): Promise<void>;
  getChatId(channel: TelegramChannel): Promise<string | null>;
  setChatId(channel: TelegramChannel, chatId: string, userId: string): Promise<void>;
  
  // Validation methods
  validateBotToken(token: string): Promise<BotTokenValidation>;
  validateChatId(chatId: string, botToken: string): Promise<ChatIdValidation>;
  
  // Configuration management
  getFullConfiguration(): Promise<TelegramConfiguration>;
  updateConfiguration(config: Partial<TelegramConfiguration>, userId: string): Promise<void>;
  resetConfiguration(userId: string): Promise<void>;
  
  // Feature management
  isFeatureEnabled(feature: 'orders' | 'inventory' | 'dailySummary'): Promise<boolean>;
  setFeatureEnabled(feature: 'orders' | 'inventory' | 'dailySummary', enabled: boolean, userId: string): Promise<void>;
  
  // Health and testing
  getHealthStatus(): Promise<TelegramHealthStatus>;
  testConfiguration(): Promise<TelegramTestResult>;
  
  // Audit and history
  getConfigurationHistory(limit?: number): Promise<ConfigurationHistory[]>;
}