/**
 * Payment Gateway Configuration Service
 * Centralized management of payment gateway settings and status
 */

import { prisma } from '@/lib/db/prisma';
import {
  Smartphone,
  LucideIcon,
} from 'lucide-react';

export interface PaymentGateway {
  id: string;
  name: string;
  type: 'toyyibpay';
  status: 'active' | 'inactive' | 'configured' | 'pending';
  description: string;
  icon?: LucideIcon; // Optional for API responses
  configPath: string;
  features: string[];
  isEnabled?: boolean;
  credentials?: {
    hasApiKey: boolean;
    hasSecretKey: boolean;
    hasUserKey?: boolean;
    hasCategoryCode?: boolean;
  };
}

/**
 * Payment Gateway Service - Single source of truth for gateway configuration
 */
export class PaymentGatewayService {
  private static readonly GATEWAY_DEFINITIONS: Omit<PaymentGateway, 'status' | 'isEnabled' | 'credentials'>[] = [
    {
      id: 'toyyibpay',
      name: 'toyyibPay',
      type: 'toyyibpay',
      description: 'Malaysian payment gateway supporting FPX, Credit Cards, and e-wallets',
      icon: Smartphone,
      configPath: '/admin/payments/toyyibpay',
      features: [
        'FPX Online Banking',
        'Credit/Debit Cards',
        'E-wallets',
        'QR Code',
      ],
    },
  ];

  /**
   * Get all payment gateways with their current configuration status
   */
  static async getPaymentGateways(): Promise<PaymentGateway[]> {
    const gateways = await Promise.all(
      this.GATEWAY_DEFINITIONS.map(async (gateway) => {
        const status = await this.getGatewayStatus(gateway.id);
        const credentials = await this.getGatewayCredentials(gateway.id);
        
        return {
          ...gateway,
          status,
          isEnabled: status === 'active',
          credentials,
          // Remove icon function for API serialization
          icon: undefined,
        };
      })
    );

    return gateways;
  }

  /**
   * Get configuration status for a specific payment gateway
   */
  static async getGatewayStatus(gatewayId: string): Promise<PaymentGateway['status']> {
    try {
      const config = await this.getGatewayConfig(gatewayId);
      
      if (!config) {
        return 'pending';
      }

      // Check if gateway has required credentials
      const hasCredentials = await this.validateGatewayCredentials(gatewayId);
      
      if (!hasCredentials) {
        return 'inactive';
      }

      // Check if gateway is enabled
      const isEnabled = config.enabled === true || config.enabled === 'true';
      
      return isEnabled ? 'active' : 'configured';
      
    } catch (error) {
      console.error(`Error checking gateway status for ${gatewayId}:`, error);
      return 'pending';
    }
  }

  /**
   * Get gateway credentials status (without exposing actual values)
   */
  private static async getGatewayCredentials(gatewayId: string): Promise<PaymentGateway['credentials']> {
    try {
      if (gatewayId === 'toyyibpay') {
        const [userKey, secretKey, categoryCode] = await Promise.all([
          prisma.systemConfig.findUnique({ where: { key: 'toyyibpay_user_key' } }),
          prisma.systemConfig.findUnique({ where: { key: 'toyyibpay_secret_key' } }),
          prisma.systemConfig.findUnique({ where: { key: 'toyyibpay_category_code' } }),
        ]);

        return {
          hasApiKey: false, // ToyyibPay doesn't use API key
          hasSecretKey: !!secretKey?.value,
          hasUserKey: !!userKey?.value,
          hasCategoryCode: !!categoryCode?.value,
        };
      }

      return {
        hasApiKey: false,
        hasSecretKey: false,
      };

    } catch (error) {
      console.error(`Error checking credentials for ${gatewayId}:`, error);
      return {
        hasApiKey: false,
        hasSecretKey: false,
      };
    }
  }

  /**
   * Get gateway configuration from database
   */
  private static async getGatewayConfig(gatewayId: string) {
    const config = await prisma.systemConfig.findUnique({
      where: { key: `${gatewayId}_config` },
    });

    return config?.value ? JSON.parse(config.value) : null;
  }

  /**
   * Validate that gateway has required credentials
   */
  private static async validateGatewayCredentials(gatewayId: string): Promise<boolean> {
    const credentials = await this.getGatewayCredentials(gatewayId);

    switch (gatewayId) {
      case 'toyyibpay':
        return !!(credentials?.hasSecretKey && credentials?.hasUserKey && credentials?.hasCategoryCode);
      default:
        return false;
    }
  }

  /**
   * Get active payment gateways only
   */
  static async getActivePaymentGateways(): Promise<PaymentGateway[]> {
    const allGateways = await this.getPaymentGateways();
    return allGateways.filter(gateway => gateway.status === 'active');
  }

  /**
   * Check if specific gateway is available and configured
   */
  static async isGatewayAvailable(gatewayId: string): Promise<boolean> {
    const status = await this.getGatewayStatus(gatewayId);
    return status === 'active';
  }

  /**
   * Get payment gateway statistics (usage, transaction counts, etc.)
   */
  static async getGatewayStats(startDate?: Date, endDate?: Date) {
    const whereClause: any = {};
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const stats = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        ...whereClause,
        paymentMethod: { not: null },
      },
      _count: { paymentMethod: true },
      _sum: { total: true },
    });

    return stats.map(stat => ({
      gateway: stat.paymentMethod || 'Unknown',
      transactionCount: stat._count.paymentMethod,
      totalRevenue: Number(stat._sum.total || 0),
    }));
  }
}