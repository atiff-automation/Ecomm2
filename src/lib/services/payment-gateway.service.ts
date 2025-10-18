/**
 * Payment Gateway Configuration Service
 * Centralized management of payment gateway settings and status
 */

import { prisma } from '@/lib/db/prisma';
import { Smartphone, LucideIcon } from 'lucide-react';

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
 * Payment Gateway Status Hierarchy (Priority Order):
 *
 * 1. 'active' - All required credentials present AND enabled=true
 * 2. 'configured' - All required credentials present BUT enabled=false/unset
 * 3. 'inactive' - Some credentials present but missing required ones
 * 4. 'pending' - No credentials configured at all
 *
 * This ensures proper status determination without hardcoded fallbacks.
 */

/**
 * Payment Gateway Service - Single source of truth for gateway configuration
 */
export class PaymentGatewayService {
  private static readonly GATEWAY_DEFINITIONS: Omit<
    PaymentGateway,
    'status' | 'isEnabled' | 'credentials'
  >[] = [
    {
      id: 'toyyibpay',
      name: 'toyyibPay',
      type: 'toyyibpay',
      description:
        'Malaysian payment gateway supporting FPX, Credit Cards, and e-wallets',
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
      this.GATEWAY_DEFINITIONS.map(async gateway => {
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
   * Priority: credentials -> enabled status -> config existence
   */
  static async getGatewayStatus(
    gatewayId: string
  ): Promise<PaymentGateway['status']> {
    try {
      // First, check if gateway has required credentials (most important)
      const hasCredentials = await this.validateGatewayCredentials(gatewayId);
      const credentials = await this.getGatewayCredentials(gatewayId);

      // If no credentials at all, status is pending
      if (!hasCredentials) {
        // Check if there are partial credentials (inactive) vs no credentials at all (pending)
        const hasAnyCredential = this.hasPartialCredentials(
          credentials,
          gatewayId
        );
        return hasAnyCredential ? 'inactive' : 'pending';
      }

      // If we have all required credentials, check configuration and enabled status
      const config = await this.getGatewayConfig(gatewayId);

      // Default to configured if no explicit config found but credentials exist
      const isEnabled = config?.enabled === true || config?.enabled === 'true';

      return isEnabled ? 'active' : 'configured';
    } catch (error) {
      console.error(`Error checking gateway status for ${gatewayId}:`, error);

      // On error, try to determine status based on credentials only
      try {
        const hasCredentials = await this.validateGatewayCredentials(gatewayId);
        return hasCredentials ? 'configured' : 'pending';
      } catch (credentialError) {
        console.error(
          `Error checking credentials for ${gatewayId}:`,
          credentialError
        );
        return 'inactive'; // Conservative fallback - indicates needs attention
      }
    }
  }

  /**
   * Get gateway credentials status (without exposing actual values)
   */
  private static async getGatewayCredentials(
    gatewayId: string
  ): Promise<PaymentGateway['credentials']> {
    try {
      if (gatewayId === 'toyyibpay') {
        const [userSecretKey, categoryCode, enabled] = await Promise.all([
          prisma.systemConfig.findUnique({
            where: { key: 'toyyibpay_user_secret_key_encrypted' },
          }),
          prisma.systemConfig.findUnique({
            where: { key: 'toyyibpay_category_code' },
          }),
          prisma.systemConfig.findUnique({
            where: { key: 'toyyibpay_credentials_enabled' },
          }),
        ]);

        // Check if credentials are enabled and exist
        const isEnabled = enabled?.value === 'true';
        const hasUserSecretKey = !!(userSecretKey?.value && isEnabled);
        const hasCategoryCode = !!(
          categoryCode?.value && categoryCode.value.trim()
        );

        return {
          hasApiKey: false, // ToyyibPay doesn't use API key
          hasSecretKey: hasUserSecretKey, // Using userSecretKey for consistency with ToyyibPay API
          hasUserKey: hasUserSecretKey,
          hasCategoryCode: hasCategoryCode,
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
  private static async validateGatewayCredentials(
    gatewayId: string
  ): Promise<boolean> {
    const credentials = await this.getGatewayCredentials(gatewayId);

    switch (gatewayId) {
      case 'toyyibpay':
        return !!(
          credentials?.hasSecretKey &&
          credentials?.hasUserKey &&
          credentials?.hasCategoryCode
        );
      default:
        return false;
    }
  }

  /**
   * Check if gateway has any partial credentials (not all required but some exist)
   */
  private static hasPartialCredentials(
    credentials: PaymentGateway['credentials'],
    gatewayId: string
  ): boolean {
    if (!credentials) return false;

    switch (gatewayId) {
      case 'toyyibpay':
        // Has some credentials but not all required ones
        const hasAnyToyyibCredential = !!(
          credentials.hasSecretKey ||
          credentials.hasUserKey ||
          credentials.hasCategoryCode
        );
        const hasAllToyyibCredentials = !!(
          credentials.hasSecretKey &&
          credentials.hasUserKey &&
          credentials.hasCategoryCode
        );
        return hasAnyToyyibCredential && !hasAllToyyibCredentials;
      default:
        return !!(credentials.hasApiKey || credentials.hasSecretKey);
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
