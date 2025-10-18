/**
 * Simplified Admin Telegram Service - Malaysian E-commerce Platform
 * CENTRALIZED admin-only telegram notifications
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH | CENTRALIZED
 */

import { prisma } from '@/lib/db/prisma';
import { adminTelegramConfigService } from '@/lib/services/admin-telegram-config.service';
import { AdminTelegramConfig } from '@prisma/client';

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

export class SimplifiedTelegramService {
  // SINGLE SOURCE OF TRUTH: Configuration loaded from admin config
  private config: AdminTelegramConfig | null = null;
  private apiUrl: string = '';
  private configLoaded: boolean = false;

  // DRY: Health monitoring (same pattern as before but simplified)
  private lastHealthCheck: Date | null = null;
  private isHealthy: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  // DRY: Message retry queue (same reliability pattern)
  private retryQueue: Array<{
    message: TelegramMessage;
    retries: number;
    timestamp: Date;
  }> = [];

  /**
   * CENTRALIZED: Initialize service with admin configuration only
   * NO HARDCODE: All configuration from database
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConfiguration();
      this.startHealthCheck();
      this.initializeCronJobs();

      console.log('🤖 Simplified TelegramService initialized (admin-only)');
    } catch (error) {
      console.error('Failed to initialize SimplifiedTelegramService:', error);
      throw error;
    }
  }

  /**
   * DRY: Same cron job initialization (no changes needed)
   */
  private initializeCronJobs(): void {
    if (typeof window === 'undefined') {
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
   * SINGLE SOURCE OF TRUTH: Load configuration from AdminTelegramConfig only
   * CENTRALIZED: No multi-user complexity, no fallback to per-user configs
   */
  private async loadConfiguration(): Promise<void> {
    try {
      // SINGLE SOURCE: Get active admin configuration
      this.config = await adminTelegramConfigService.getActiveConfig();

      if (this.config?.botToken) {
        this.apiUrl = `https://api.telegram.org/bot${this.config.botToken}`;
        this.configLoaded = true;
        console.log('✅ Admin telegram configuration loaded successfully');
        return;
      }

      // NO CONFIGURATION: Clear state (no .env fallback for simplified admin-only system)
      this.config = null;
      this.apiUrl = '';
      this.configLoaded = true;
      console.log('❌ No telegram configuration found');
    } catch (error) {
      console.error('Failed to load telegram configuration:', error);
      this.config = null;
      this.apiUrl = '';
      this.configLoaded = true;
    }
  }

  /**
   * DRY: Same health check logic (no changes needed)
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(
      async () => {
        await this.performHealthCheck();
      },
      5 * 60 * 1000
    );

    setTimeout(async () => {
      if (await this.isConfigured()) {
        this.isHealthy = true;
      }
      await this.performHealthCheck();
    }, 2000);
  }

  /**
   * DRY: Same health check implementation
   */
  private async performHealthCheck(): Promise<void> {
    if (!(await this.isConfigured())) {
      this.isHealthy = false;
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/getMe`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      this.isHealthy = response.ok;
      this.lastHealthCheck = new Date();

      console.log('🔍 Health check completed at:', new Date().toISOString());

      if (!this.isHealthy) {
        console.warn('⚠️ Telegram health check failed:', response.status);
      } else {
        console.log('✅ Telegram connection healthy');
        await this.processRetryQueue();
      }
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = new Date();
      console.log('🔍 Health check completed at:', new Date().toISOString());
      console.error('❌ Telegram health check error:', error);
    }
  }

  /**
   * DRY: Same retry queue processing
   */
  private async processRetryQueue(): Promise<void> {
    const failedMessages = [...this.retryQueue];
    this.retryQueue = [];

    for (const queueItem of failedMessages) {
      if (queueItem.retries < 3) {
        const success = await this.sendMessage(queueItem.message, false);
        if (!success) {
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
   * SINGLE SOURCE OF TRUTH: Check if telegram is configured
   * CENTRALIZED: Only check admin config
   */
  async isConfigured(): Promise<boolean> {
    if (!this.configLoaded) {
      await this.loadConfiguration();
    }
    return !!(
      this.config?.botToken &&
      (this.config?.ordersChatId || this.config?.inventoryChatId)
    );
  }

  /**
   * CENTRALIZED: Check specific channel configurations
   */
  async isOrdersChannelConfigured(): Promise<boolean> {
    if (!this.configLoaded) {
      await this.loadConfiguration();
    }
    return !!(
      this.config?.botToken &&
      this.config?.ordersChatId &&
      this.config?.ordersEnabled
    );
  }

  async isInventoryChannelConfigured(): Promise<boolean> {
    if (!this.configLoaded) {
      await this.loadConfiguration();
    }
    return !!(
      this.config?.botToken &&
      this.config?.inventoryChatId &&
      this.config?.inventoryEnabled
    );
  }

  async isChatManagementChannelConfigured(): Promise<boolean> {
    if (!this.configLoaded) {
      await this.loadConfiguration();
    }
    return !!(
      this.config?.botToken &&
      this.config?.chatManagementChatId &&
      this.config?.chatManagementEnabled
    );
  }

  async isSystemAlertsChannelConfigured(): Promise<boolean> {
    if (!this.configLoaded) {
      await this.loadConfiguration();
    }
    return !!(
      this.config?.botToken &&
      this.config?.systemAlertsChatId &&
      this.config?.systemAlertsEnabled
    );
  }

  /**
   * CENTRALIZED: Reload configuration when admin updates settings
   */
  async reloadConfiguration(): Promise<void> {
    this.configLoaded = false;
    await this.loadConfiguration();
    await this.performHealthCheck();
  }

  /**
   * DRY: Same health status method
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
   * DRY: Same cleanup method
   */
  public cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * DRY: Same message sending logic with retry capability
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(30000),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.text();
        console.error(
          'Failed to send Telegram message:',
          response.status,
          error
        );
        console.log(
          `📈 Message send failed (${responseTime}ms):`,
          response.status,
          error
        );

        if (allowQueue && this.shouldRetry(response.status)) {
          this.retryQueue.push({
            message,
            retries: 0,
            timestamp: new Date(),
          });
          console.log('📝 Telegram message queued for retry');
        }
        return false;
      }

      console.log(`📈 Message sent successfully (${responseTime}ms)`);
      console.log('✅ Telegram notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      const responseTime = Date.now() - startTime;
      console.log(`📈 Message send failed (${responseTime}ms):`, error);

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
   * DRY: Same retry logic
   */
  private shouldRetry(status: number): boolean {
    return status >= 500 || status === 429;
  }

  /**
   * CENTRALIZED: Send order notification using admin config
   * DRY: Same notification format and logic
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
      chat_id: this.config!.ordersChatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  }

  /**
   * DRY: Same payment notification logic
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
      chat_id: this.config!.ordersChatId,
      text: message,
      parse_mode: 'HTML',
    });
  }

  /**
   * DRY: Same daily summary logic
   */
  async sendDailySummary(date: Date): Promise<boolean> {
    if (!(await this.isOrdersChannelConfigured())) {
      console.log('Orders channel not configured, skipping daily summary');
      return false;
    }

    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

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
        chat_id: this.config!.ordersChatId,
        text: message,
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error('Failed to send daily summary:', error);
      return false;
    }
  }

  /**
   * DRY: Same daily summary data logic
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
      totalRevenue: Number(totalRevenue),
      completedOrders,
      failedOrders,
    };
  }

  /**
   * CENTRALIZED: Send low stock alert using admin config
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
      chat_id: this.config!.inventoryChatId!,
      text: message,
      parse_mode: 'HTML',
    });
  }

  /**
   * DRY: Same general notification logic
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
      chat_id: this.config!.ordersChatId,
      text: formattedMessage,
      parse_mode: 'HTML',
    });
  }

  /**
   * CENTRALIZED: Send chat management notifications
   */
  async sendChatManagementNotification(
    title: string,
    message: string
  ): Promise<boolean> {
    if (!(await this.isChatManagementChannelConfigured())) {
      console.log(
        'Chat management channel not configured, skipping notification'
      );
      return false;
    }

    const formattedMessage = `
🗣️ <b>${title}</b>

${message}

Time: ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
`.trim();

    return await this.sendMessage({
      chat_id: this.config!.chatManagementChatId!,
      text: formattedMessage,
      parse_mode: 'HTML',
    });
  }

  /**
   * CENTRALIZED: Send system alerts notifications
   */
  async sendSystemAlertNotification(
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'error' = 'info'
  ): Promise<boolean> {
    if (!(await this.isSystemAlertsChannelConfigured())) {
      console.log(
        'System alerts channel not configured, skipping notification'
      );
      return false;
    }

    const emoji =
      severity === 'error' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
    const formattedMessage = `
${emoji} <b>${title}</b>

${message}

Time: ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
`.trim();

    return await this.sendMessage({
      chat_id: this.config!.systemAlertsChatId!,
      text: formattedMessage,
      parse_mode: 'HTML',
    });
  }

  /**
   * DRY: Same test connection logic
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

      const chatId = this.config!.ordersChatId || this.config!.inventoryChatId;
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

// SINGLE SOURCE OF TRUTH: Global singleton instance following @CLAUDE.md
let globalSimplifiedServiceInstance: SimplifiedTelegramService | null = null;

export const simplifiedTelegramService = {
  async getInstance(): Promise<SimplifiedTelegramService> {
    if (!globalSimplifiedServiceInstance) {
      globalSimplifiedServiceInstance = new SimplifiedTelegramService();
      await globalSimplifiedServiceInstance.initialize();
    }
    return globalSimplifiedServiceInstance;
  },

  // DRY: Same convenience methods but using simplified service
  async sendNewOrderNotification(
    ...args: Parameters<SimplifiedTelegramService['sendNewOrderNotification']>
  ) {
    const instance = await this.getInstance();
    return instance.sendNewOrderNotification(...args);
  },

  async sendPaymentStatusNotification(
    ...args: Parameters<
      SimplifiedTelegramService['sendPaymentStatusNotification']
    >
  ) {
    const instance = await this.getInstance();
    return instance.sendPaymentStatusNotification(...args);
  },

  async sendDailySummary(
    ...args: Parameters<SimplifiedTelegramService['sendDailySummary']>
  ) {
    const instance = await this.getInstance();
    return instance.sendDailySummary(...args);
  },

  async sendLowStockAlert(
    ...args: Parameters<SimplifiedTelegramService['sendLowStockAlert']>
  ) {
    const instance = await this.getInstance();
    return instance.sendLowStockAlert(...args);
  },

  async sendGeneralNotification(
    ...args: Parameters<SimplifiedTelegramService['sendGeneralNotification']>
  ) {
    const instance = await this.getInstance();
    return instance.sendGeneralNotification(...args);
  },

  async testConnection(
    ...args: Parameters<SimplifiedTelegramService['testConnection']>
  ) {
    const instance = await this.getInstance();
    return instance.testConnection(...args);
  },

  async isConfigured(
    ...args: Parameters<SimplifiedTelegramService['isConfigured']>
  ) {
    const instance = await this.getInstance();
    return instance.isConfigured(...args);
  },

  async isOrdersChannelConfigured(
    ...args: Parameters<SimplifiedTelegramService['isOrdersChannelConfigured']>
  ) {
    const instance = await this.getInstance();
    return instance.isOrdersChannelConfigured(...args);
  },

  async isInventoryChannelConfigured(
    ...args: Parameters<
      SimplifiedTelegramService['isInventoryChannelConfigured']
    >
  ) {
    const instance = await this.getInstance();
    return instance.isInventoryChannelConfigured(...args);
  },

  async isChatManagementChannelConfigured(
    ...args: Parameters<
      SimplifiedTelegramService['isChatManagementChannelConfigured']
    >
  ) {
    const instance = await this.getInstance();
    return instance.isChatManagementChannelConfigured(...args);
  },

  async isSystemAlertsChannelConfigured(
    ...args: Parameters<
      SimplifiedTelegramService['isSystemAlertsChannelConfigured']
    >
  ) {
    const instance = await this.getInstance();
    return instance.isSystemAlertsChannelConfigured(...args);
  },

  async sendChatManagementNotification(
    ...args: Parameters<
      SimplifiedTelegramService['sendChatManagementNotification']
    >
  ) {
    const instance = await this.getInstance();
    return instance.sendChatManagementNotification(...args);
  },

  async sendSystemAlertNotification(
    ...args: Parameters<
      SimplifiedTelegramService['sendSystemAlertNotification']
    >
  ) {
    const instance = await this.getInstance();
    return instance.sendSystemAlertNotification(...args);
  },

  async reloadConfiguration(
    ...args: Parameters<SimplifiedTelegramService['reloadConfiguration']>
  ) {
    const instance = await this.getInstance();
    return instance.reloadConfiguration(...args);
  },

  getHealthStatus() {
    if (!globalSimplifiedServiceInstance) {
      return { healthy: false, lastCheck: null, queuedMessages: 0 };
    }
    return globalSimplifiedServiceInstance.getHealthStatus();
  },
};
