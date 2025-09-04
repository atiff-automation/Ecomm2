/**
 * Multi-Tenant Telegram Service - Malaysian E-commerce Platform  
 * USER-AWARE service with systematic fallback to global configuration
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { prisma } from '@/lib/db/prisma';
import { telegramMonitoringService } from '@/lib/monitoring/telegram-monitoring';
import { telegramConfigService } from '@/lib/services/telegram-config.service';
import { TelegramConfig } from '@prisma/client';

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  total: number;
  items: OrderItem[];
  paymentMethod: string;
  createdAt: Date;
}

export class TelegramService {
  // MULTI-TENANT: User context for scoped configuration
  private userId: string | null = null;
  
  // CONFIGURATION: Loaded dynamically per user/global
  private botToken: string | null = null;
  private ordersChatId: string | null = null;
  private inventoryChatId: string | null = null;
  private apiUrl: string = '';
  private configLoaded: boolean = false;
  
  // HEALTH MONITORING: Per-service instance
  private lastHealthCheck: Date | null = null;
  private isHealthy: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  // RELIABILITY: Message retry queue
  private retryQueue: Array<{
    message: TelegramMessage;
    retries: number;
    timestamp: Date;
  }> = [];

  constructor(userId?: string) {
    // MULTI-TENANT: Set user context for scoped configuration
    this.userId = userId || null;
    
    // SYSTEMATIC: Delayed initialization to allow proper configuration loading
    // loadConfiguration() and startHealthCheck() will be called by initialize()
  }

  /**
   * Initialize service - CENTRALIZED initialization pattern
   * SYSTEMATIC: Async initialization with proper error handling
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConfiguration();
      this.startHealthCheck();

      // Initialize cron jobs (only for global service)
      if (!this.userId) {
        this.initializeCronJobs();
      }

      if (this.userId) {
        console.log(`🤖 TelegramService initialized for user: ${this.userId}`);
      } else {
        console.log('🤖 TelegramService global instance initialized');
      }
    } catch (error) {
      console.error('Failed to initialize TelegramService:', error);
      throw error;
    }
  }

  /**
   * Initialize cron jobs for automated tasks
   */
  private initializeCronJobs(): void {
    // Avoid importing at module level to prevent import issues
    if (typeof window === 'undefined') {
      // Only run on server side
      import('@/lib/cron/index')
        .then(({ initializeCronJobs }) => {
          initializeCronJobs();
        })
        .catch(error => {
          console.error('Failed to initialize cron jobs:', error);
        });
    }
  }

  /**
   * Start periodic health check to ensure Telegram connection is working
   */
  private startHealthCheck(): void {
    // Check every 5 minutes
    this.healthCheckInterval = setInterval(
      async () => {
        await this.performHealthCheck();
      },
      5 * 60 * 1000
    );

    // Initial health check - run sooner and assume healthy if configured
    setTimeout(async () => {
      if (await this.isConfigured()) {
        this.isHealthy = true; // Start optimistic for faster UI response
      }
      await this.performHealthCheck();
    }, 2000); // 2 seconds after startup instead of 10
  }

  /**
   * Perform health check by sending a lightweight request to Telegram API
   */
  private async performHealthCheck(): Promise<void> {
    if (!(await this.isConfigured())) {
      this.isHealthy = false;
      return;
    }

    try {
      // Use getMe API call which is lightweight and doesn't send messages
      const response = await fetch(`${this.apiUrl}/getMe`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.isHealthy = response.ok;
      this.lastHealthCheck = new Date();
      
      // Update monitoring service
      telegramMonitoringService.updateHealthCheck();

      if (!this.isHealthy) {
        console.warn('⚠️ Telegram health check failed:', response.status);
      } else {
        console.log('✅ Telegram connection healthy');
        // Process any queued messages
        await this.processRetryQueue();
      }
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = new Date();
      
      // Update monitoring service even on error
      telegramMonitoringService.updateHealthCheck();
      
      console.error('❌ Telegram health check error:', error);
    }
  }

  /**
   * Process retry queue for failed messages
   */
  private async processRetryQueue(): Promise<void> {
    const failedMessages = [...this.retryQueue];
    this.retryQueue = [];

    for (const queueItem of failedMessages) {
      if (queueItem.retries < 3) {
        // Max 3 retries
        const success = await this.sendMessage(queueItem.message, false); // Don't queue again
        if (!success) {
          // Re-queue with incremented retry count
          this.retryQueue.push({
            ...queueItem,
            retries: queueItem.retries + 1,
          });
        }
      } else {
        console.error(
          '❌ Telegram message failed after 3 retries, discarding:',
          queueItem.message
        );
      }
    }
  }

  /**
   * Get connection health status
   */
  public getHealthStatus(): {
    healthy: boolean;
    lastCheck: Date | null;
    queuedMessages: number;
  } {
    return {
      healthy: this.isHealthy,
      lastCheck: this.lastHealthCheck,
      queuedMessages: this.retryQueue.length,
    };
  }

  /**
   * Load Telegram configuration - MULTI-TENANT with systematic fallback
   * SINGLE SOURCE OF TRUTH: User config → Global config → .env fallback
   */
  private async loadConfiguration(): Promise<void> {
    try {
      let config: TelegramConfig | null = null;
      
      // PRIMARY: Load user-specific configuration
      if (this.userId) {
        config = await telegramConfigService.getUserConfig(this.userId);
        if (config?.botToken) {
          this.applyConfiguration(config);
          this.configLoaded = true;
          return;
        }
      }
      
      // SECONDARY: Load global configuration  
      const globalConfig = await telegramConfigService.getGlobalConfiguration();
      if (globalConfig.botToken) {
        this.applyGlobalConfiguration(globalConfig);
        this.configLoaded = true;
        return;
      }
      
      // FALLBACK: Environment variables (backward compatibility)
      const envToken = process.env.TELEGRAM_BOT_TOKEN;
      const envOrdersChatId = process.env.TELEGRAM_ORDERS_CHAT_ID;
      const envInventoryChatId = process.env.TELEGRAM_INVENTORY_CHAT_ID;

      if (envToken && envOrdersChatId) {
        this.botToken = envToken;
        this.ordersChatId = envOrdersChatId;
        this.inventoryChatId = envInventoryChatId || null;
        this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
        this.configLoaded = true;
        return;
      }
      
      // NO CONFIGURATION: Clear state
      this.clearConfiguration();
      this.configLoaded = true;
    } catch (error) {
      console.error('Failed to load Telegram configuration:', error);
      this.clearConfiguration();
      this.configLoaded = true; // Don't block forever
    }
  }
  
  /**
   * Apply user/database configuration - CENTRALIZED configuration logic
   * SYSTEMATIC: Single method for applying TelegramConfig
   */
  private applyConfiguration(config: TelegramConfig): void {
    this.botToken = config.botToken;
    this.ordersChatId = config.ordersEnabled ? config.ordersChatId : null;
    this.inventoryChatId = config.inventoryEnabled ? config.inventoryChatId : null;
    
    if (this.botToken) {
      this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    }
  }
  
  /**
   * Apply global configuration - BACKWARD COMPATIBILITY
   * SYSTEMATIC: Handle global config format
   */
  private applyGlobalConfiguration(config: any): void {
    this.botToken = config.botToken;
    this.ordersChatId = config.ordersChatId;
    this.inventoryChatId = config.inventoryChatId;
    
    if (this.botToken) {
      this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    }
  }
  
  /**
   * Clear configuration state - SYSTEMATIC cleanup
   */
  private clearConfiguration(): void {
    this.botToken = null;
    this.ordersChatId = null;
    this.inventoryChatId = null;
    this.apiUrl = '';
  }

  /**
   * Check if Telegram is properly configured for any channel
   */
  async isConfigured(): Promise<boolean> {
    if (!this.configLoaded) {
      await this.loadConfiguration();
    }
    return !!(this.botToken && (this.ordersChatId || this.inventoryChatId));
  }

  /**
   * Check if orders channel is configured
   */
  async isOrdersChannelConfigured(): Promise<boolean> {
    if (!this.configLoaded) {
      await this.loadConfiguration();
    }
    return !!(this.botToken && this.ordersChatId);
  }

  /**
   * Check if inventory channel is configured
   */
  async isInventoryChannelConfigured(): Promise<boolean> {
    if (!this.configLoaded) {
      await this.loadConfiguration();
    }
    return !!(this.botToken && this.inventoryChatId);
  }

  /**
   * Reload configuration - SYSTEMATIC configuration refresh
   * CENTRALIZED: Works for both user and global configurations
   */
  async reloadConfiguration(): Promise<void> {
    this.configLoaded = false;
    await this.loadConfiguration();
    // Trigger immediate health check after config reload
    await this.performHealthCheck();
  }
  
  /**
   * Get user context - MULTI-TENANT identification
   */
  public getUserId(): string | null {
    return this.userId;
  }
  
  /**
   * Check if service is user-scoped - SYSTEMATIC context checking
   */
  public isUserScoped(): boolean {
    return !!this.userId;
  }

  /**
   * Cleanup resources (for graceful shutdown)
   */
  public cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Send a raw message to Telegram with retry capability
   */
  private async sendMessage(
    message: TelegramMessage,
    allowQueue: boolean = true
  ): Promise<boolean> {
    if (!(await this.isConfigured())) {
      console.log('Telegram not configured, skipping notification');
      return false;
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
      
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.text();
        console.error(
          'Failed to send Telegram message:',
          response.status,
          error
        );

        // Record failed message in monitoring
        telegramMonitoringService.recordMessageSent(false, responseTime);
        
        // Queue for retry if it's a temporary failure and queueing is allowed
        if (allowQueue && this.shouldRetry(response.status)) {
          this.retryQueue.push({
            message,
            retries: 0,
            timestamp: new Date(),
          });
          console.log('📝 Telegram message queued for retry');
          return false;
        }

        return false;
      }

      // Record successful message in monitoring
      telegramMonitoringService.recordMessageSent(true, responseTime);
      
      console.log('✅ Telegram notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      
      // Record failed message in monitoring (network errors, timeouts, etc.)
      const responseTime = Date.now() - startTime;
      telegramMonitoringService.recordMessageSent(false, responseTime);

      // Queue for retry if queueing is allowed (network errors, timeouts, etc.)
      if (allowQueue) {
        this.retryQueue.push({
          message,
          retries: 0,
          timestamp: new Date(),
        });
        console.log('📝 Telegram message queued for retry due to error');
      }

      return false;
    }
  }

  /**
   * Determine if an HTTP status code should trigger a retry
   */
  private shouldRetry(status: number): boolean {
    // Retry on temporary failures, not on client errors like 400, 401, 403
    return status >= 500 || status === 429; // Server errors or rate limiting
  }

  /**
   * Send new order notification
   */
  async sendNewOrderNotification(
    orderData: OrderNotificationData
  ): Promise<boolean> {
    if (!(await this.isOrdersChannelConfigured())) {
      console.log('Orders channel not configured, skipping order notification');
      return false;
    }

    const formattedTotal = `RM ${orderData.total.toFixed(2)}`;
    const formattedDate = orderData.createdAt.toLocaleString('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Format items list
    const itemsList = orderData.items
      .map(item => {
        const itemTotal = item.quantity * item.price;
        return `• ${item.name} (${item.quantity}x) - RM ${itemTotal.toFixed(2)}`;
      })
      .join('\n');

    const message = `
🛒 <b>NEW ORDER #${orderData.orderNumber}</b>

📦 <b>Items Ordered:</b>
${itemsList}

💰 <b>Total:</b> ${formattedTotal}
👤 <b>Customer:</b> ${orderData.customerName}
💳 <b>Payment:</b> ${orderData.paymentMethod} ✅

📍 ${formattedDate}
`.trim();

    return await this.sendMessage({
      chat_id: this.ordersChatId!,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  }

  /**
   * Send payment status update notification
   */
  async sendPaymentStatusNotification(
    orderNumber: string,
    status: string,
    amount: number
  ): Promise<boolean> {
    if (!(await this.isOrdersChannelConfigured())) {
      console.log(
        'Orders channel not configured, skipping payment notification'
      );
      return false;
    }

    const statusEmoji =
      status === 'COMPLETED' ? '✅' : status === 'FAILED' ? '❌' : '⏳';
    const formattedAmount = `RM ${amount.toFixed(2)}`;

    const message = `
${statusEmoji} <b>PAYMENT UPDATE</b>

📋 Order #: <code>${orderNumber}</code>
💰 Amount: <b>${formattedAmount}</b>
🔄 Status: <b>${status}</b>

Time: ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
`.trim();

    return await this.sendMessage({
      chat_id: this.ordersChatId!,
      text: message,
      parse_mode: 'HTML',
    });
  }

  /**
   * Send daily summary notification
   */
  async sendDailySummary(date: Date): Promise<boolean> {
    if (!(await this.isOrdersChannelConfigured())) {
      console.log('Orders channel not configured, skipping daily summary');
      return false;
    }

    try {
      // Get orders for the specified date (Malaysian timezone)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch daily order statistics from database
      const { totalOrders, totalRevenue, completedOrders, failedOrders } =
        await this.getDailySummaryData(startOfDay, endOfDay);

      const formattedDate = date.toLocaleDateString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const message = `
━━━━━ END OF DAY ✨ ━━━━━
📅 ${formattedDate} - Daily Summary

📊 Performance:
• Total Orders: ${totalOrders} orders
• Total Revenue: RM ${(totalRevenue || 0).toFixed(2)}

💳 Payment Status:
• Complete Payment: ${completedOrders} orders
• Incomplete/Issues: ${failedOrders} orders

━━━━━━━━━━━━━━━━━━━━━
`.trim();

      return await this.sendMessage({
        chat_id: this.ordersChatId!,
        text: message,
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error('Failed to send daily summary:', error);
      return false;
    }
  }

  /**
   * Get daily summary data from database
   */
  private async getDailySummaryData(startOfDay: Date, endOfDay: Date) {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        total: true,
        paymentStatus: true,
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
      const orderTotal = Number(order.total) || 0;
      return sum + orderTotal;
    }, 0);
    const completedOrders = orders.filter(
      order =>
        order.paymentStatus === 'COMPLETED' || order.paymentStatus === 'PAID'
    ).length;
    const failedOrders = totalOrders - completedOrders;

    return {
      totalOrders,
      totalRevenue: Number(totalRevenue), // Ensure it's a proper number
      completedOrders,
      failedOrders,
    };
  }

  /**
   * Send low stock alert to inventory channel
   */
  async sendLowStockAlert(
    productName: string,
    currentStock: number,
    sku: string
  ): Promise<boolean> {
    if (!(await this.isInventoryChannelConfigured())) {
      console.log('Inventory channel not configured, skipping low stock alert');
      return false;
    }

    const message = `
⚠️ <b>LOW STOCK ALERT!</b>

📦 <b>Product:</b> ${productName}
🏷️ <b>SKU:</b> <code>${sku}</code>
📊 <b>Current Stock:</b> ${currentStock} units

Please restock soon to avoid out-of-stock issues.

Time: ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
`.trim();

    return await this.sendMessage({
      chat_id: this.inventoryChatId!,
      text: message,
      parse_mode: 'HTML',
    });
  }

  /**
   * Send general notification
   */
  async sendGeneralNotification(
    title: string,
    message: string
  ): Promise<boolean> {
    if (!(await this.isOrdersChannelConfigured())) {
      console.log(
        'Orders channel not configured, skipping general notification'
      );
      return false;
    }

    const formattedMessage = `
🔔 <b>${title}</b>

${message}

Time: ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
`.trim();

    return await this.sendMessage({
      chat_id: this.ordersChatId!,
      text: formattedMessage,
      parse_mode: 'HTML',
    });
  }

  /**
   * Test the Telegram connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!(await this.isConfigured())) {
      return {
        success: false,
        message:
          'Telegram not configured. Please configure your bot token and chat ID in the admin settings.',
      };
    }

    try {
      const testMessage = `
🧪 <b>TEST MESSAGE</b>

This is a test message from JRM E-commerce platform.

If you receive this message, your Telegram notifications are working correctly! ✅

Time: ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
`.trim();

      // Test with orders channel if available, otherwise inventory channel
      const chatId = this.ordersChatId || this.inventoryChatId;
      if (!chatId) {
        return {
          success: false,
          message: 'No chat channels configured',
        };
      }

      const success = await this.sendMessage({
        chat_id: chatId,
        text: testMessage,
        parse_mode: 'HTML',
      });

      return {
        success,
        message: success
          ? 'Test message sent successfully!'
          : 'Failed to send test message. Please check your bot token and chat ID.',
      };
    } catch (error) {
      return {
        success: false,
        message: `Error testing connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// BACKWARD COMPATIBILITY: Global singleton instance
// SYSTEMATIC: Use factory for proper initialization
let globalServiceInstance: TelegramService | null = null;

export const telegramService = {
  async getInstance(): Promise<TelegramService> {
    if (!globalServiceInstance) {
      globalServiceInstance = new TelegramService();
      await globalServiceInstance.initialize();
    }
    return globalServiceInstance;
  },
  
  // LEGACY SUPPORT: Direct method access (deprecated)
  async sendNewOrderNotification(...args: Parameters<TelegramService['sendNewOrderNotification']>) {
    const instance = await this.getInstance();
    return instance.sendNewOrderNotification(...args);
  },
  
  async sendPaymentStatusNotification(...args: Parameters<TelegramService['sendPaymentStatusNotification']>) {
    const instance = await this.getInstance();
    return instance.sendPaymentStatusNotification(...args);
  },
  
  async sendDailySummary(...args: Parameters<TelegramService['sendDailySummary']>) {
    const instance = await this.getInstance();
    return instance.sendDailySummary(...args);
  },
  
  async sendLowStockAlert(...args: Parameters<TelegramService['sendLowStockAlert']>) {
    const instance = await this.getInstance();
    return instance.sendLowStockAlert(...args);
  },
  
  async sendGeneralNotification(...args: Parameters<TelegramService['sendGeneralNotification']>) {
    const instance = await this.getInstance();
    return instance.sendGeneralNotification(...args);
  },
  
  async testConnection(...args: Parameters<TelegramService['testConnection']>) {
    const instance = await this.getInstance();
    return instance.testConnection(...args);
  },
  
  async isConfigured(...args: Parameters<TelegramService['isConfigured']>) {
    const instance = await this.getInstance();
    return instance.isConfigured(...args);
  },
  
  async isOrdersChannelConfigured(...args: Parameters<TelegramService['isOrdersChannelConfigured']>) {
    const instance = await this.getInstance();
    return instance.isOrdersChannelConfigured(...args);
  },
  
  async isInventoryChannelConfigured(...args: Parameters<TelegramService['isInventoryChannelConfigured']>) {
    const instance = await this.getInstance();
    return instance.isInventoryChannelConfigured(...args);
  },
  
  async reloadConfiguration(...args: Parameters<TelegramService['reloadConfiguration']>) {
    const instance = await this.getInstance();
    return instance.reloadConfiguration(...args);
  },
  
  getHealthStatus() {
    if (!globalServiceInstance) {
      return { healthy: false, lastCheck: null, queuedMessages: 0 };
    }
    return globalServiceInstance.getHealthStatus();
  }
};
