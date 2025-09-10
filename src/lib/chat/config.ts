import { prisma } from '@/lib/prisma';

export interface ChatConfigData {
  webhookUrl: string | null;
  webhookSecret: string | null;
  apiKey: string | null;
  sessionTimeoutMinutes: number;
  maxMessageLength: number;
  rateLimitMessages: number;
  rateLimitWindowMs: number;
  queueEnabled: boolean;
  queueMaxRetries: number;
  queueRetryDelayMs: number;
  queueBatchSize: number;
  websocketEnabled: boolean;
  websocketPort: number;
  isActive: boolean;
  verified: boolean;
  healthStatus: string;
}

// Cache for configuration to avoid database hits on every request
let configCache: ChatConfigData | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get active chat configuration from database with caching
 */
export async function getChatConfig(): Promise<ChatConfigData> {
  // Return cached config if still valid
  if (configCache && Date.now() < cacheExpiry) {
    return configCache;
  }

  try {
    const config = await prisma.chatConfig.findFirst({
      where: { isActive: true },
      select: {
        webhookUrl: true,
        webhookSecret: true,
        apiKey: true,
        sessionTimeoutMinutes: true,
        maxMessageLength: true,
        rateLimitMessages: true,
        rateLimitWindowMs: true,
        queueEnabled: true,
        queueMaxRetries: true,
        queueRetryDelayMs: true,
        queueBatchSize: true,
        websocketEnabled: true,
        websocketPort: true,
        isActive: true,
        verified: true,
        healthStatus: true,
      },
    });

    if (config) {
      configCache = config;
      cacheExpiry = Date.now() + CACHE_DURATION;
      return config;
    }

    // Return default configuration if none exists
    const defaultConfig: ChatConfigData = {
      webhookUrl: null,
      webhookSecret: null,
      apiKey: null,
      sessionTimeoutMinutes: 30,
      maxMessageLength: 4000,
      rateLimitMessages: 20,
      rateLimitWindowMs: 60000,
      queueEnabled: true,
      queueMaxRetries: 3,
      queueRetryDelayMs: 5000,
      queueBatchSize: 10,
      websocketEnabled: true,
      websocketPort: 3001,
      isActive: false,
      verified: false,
      healthStatus: 'NOT_CONFIGURED',
    };

    return defaultConfig;
  } catch (error) {
    console.error('Failed to get chat config:', error);
    
    // Return fallback configuration on error
    const fallbackConfig: ChatConfigData = {
      webhookUrl: null,
      webhookSecret: null,
      apiKey: null,
      sessionTimeoutMinutes: 30,
      maxMessageLength: 4000,
      rateLimitMessages: 20,
      rateLimitWindowMs: 60000,
      queueEnabled: false, // Disable queue on error
      queueMaxRetries: 3,
      queueRetryDelayMs: 5000,
      queueBatchSize: 10,
      websocketEnabled: false, // Disable websocket on error
      websocketPort: 3001,
      isActive: false,
      verified: false,
      healthStatus: 'ERROR',
    };

    return fallbackConfig;
  }
}

/**
 * Clear configuration cache (useful when config is updated)
 */
export function clearConfigCache(): void {
  configCache = null;
  cacheExpiry = 0;
}

/**
 * Check if chat system is properly configured and healthy
 */
export async function isChatSystemHealthy(): Promise<boolean> {
  const config = await getChatConfig();
  return config.isActive && config.verified && config.webhookUrl !== null && config.healthStatus === 'HEALTHY';
}

/**
 * Get session timeout in milliseconds
 */
export async function getSessionTimeoutMs(): Promise<number> {
  const config = await getChatConfig();
  return config.sessionTimeoutMinutes * 60 * 1000;
}

/**
 * Get webhook configuration
 */
export async function getWebhookConfig(): Promise<{ url: string | null; secret: string | null; apiKey: string | null }> {
  const config = await getChatConfig();
  return {
    url: config.webhookUrl,
    secret: config.webhookSecret,
    apiKey: config.apiKey,
  };
}

/**
 * Get rate limiting configuration
 */
export async function getRateLimitConfig(): Promise<{ messages: number; windowMs: number }> {
  const config = await getChatConfig();
  return {
    messages: config.rateLimitMessages,
    windowMs: config.rateLimitWindowMs,
  };
}

/**
 * Get queue configuration
 */
export async function getQueueConfig(): Promise<{
  enabled: boolean;
  maxRetries: number;
  retryDelayMs: number;
  batchSize: number;
}> {
  const config = await getChatConfig();
  return {
    enabled: config.queueEnabled,
    maxRetries: config.queueMaxRetries,
    retryDelayMs: config.queueRetryDelayMs,
    batchSize: config.queueBatchSize,
  };
}

/**
 * Get WebSocket configuration
 */
export async function getWebSocketConfig(): Promise<{ enabled: boolean; port: number }> {
  const config = await getChatConfig();
  return {
    enabled: config.websocketEnabled,
    port: config.websocketPort,
  };
}