/**
 * Payment Method Router - Best Practice Implementation
 * Routes payment confirmations through appropriate channels based on payment method
 */

import { updateOrderStatus } from '@/lib/notifications/order-status-handler';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export enum PaymentMethodType {
  WEBHOOK_AUTOMATED = 'webhook_automated', // Real-time webhooks
  API_POLLING = 'api_polling', // API polling every few minutes
  MANUAL_CONFIRMATION = 'manual_confirmation', // Admin manual confirmation
}

export interface PaymentMethodConfig {
  type: PaymentMethodType;
  displayName: string;
  description: string;
  autoConfirm: boolean;
  maxProcessingTime: number; // hours
  requiresVerification: boolean;
}

export const PAYMENT_METHODS: Record<string, PaymentMethodConfig> = {
  // Tier 1: Automated Webhooks (Best UX)
  billplz: {
    type: PaymentMethodType.WEBHOOK_AUTOMATED,
    displayName: 'Billplz',
    description: 'Instant confirmation via webhook',
    autoConfirm: true,
    maxProcessingTime: 0.5, // 30 minutes max
    requiresVerification: false,
  },

  stripe: {
    type: PaymentMethodType.WEBHOOK_AUTOMATED,
    displayName: 'Credit/Debit Card',
    description: 'Instant confirmation via Stripe',
    autoConfirm: true,
    maxProcessingTime: 0.5,
    requiresVerification: false,
  },

  // Tier 2: API Polling (Good UX)
  fpx: {
    type: PaymentMethodType.API_POLLING,
    displayName: 'FPX Online Banking',
    description: 'Confirmation within 5 minutes',
    autoConfirm: true,
    maxProcessingTime: 2, // 2 hours max
    requiresVerification: false,
  },

  // Tier 3: Manual Confirmation (Acceptable UX)
  'bank-transfer': {
    type: PaymentMethodType.MANUAL_CONFIRMATION,
    displayName: 'Bank Transfer',
    description: 'Manual confirmation required (business hours)',
    autoConfirm: false,
    maxProcessingTime: 24, // 24 hours
    requiresVerification: true,
  },

  'cash-deposit': {
    type: PaymentMethodType.MANUAL_CONFIRMATION,
    displayName: 'Cash Deposit',
    description: 'Manual confirmation required',
    autoConfirm: false,
    maxProcessingTime: 48,
    requiresVerification: true,
  },

  'cash-on-delivery': {
    type: PaymentMethodType.MANUAL_CONFIRMATION,
    displayName: 'Cash on Delivery',
    description: 'Confirmed upon delivery',
    autoConfirm: false,
    maxProcessingTime: 168, // 1 week
    requiresVerification: true,
  },
};

export class PaymentMethodRouter {
  /**
   * Route payment confirmation through appropriate channel
   */
  static async processPaymentConfirmation(
    orderId: string,
    paymentMethod: string,
    confirmationData: {
      transactionId?: string;
      amount?: number;
      reference?: string;
      verificationData?: any;
      triggeredBy: string;
    }
  ) {
    const methodConfig = PAYMENT_METHODS[paymentMethod];

    if (!methodConfig) {
      console.warn(`Unknown payment method: ${paymentMethod}`);
      // Default to manual confirmation for unknown methods
      return this.processManualConfirmation(
        orderId,
        paymentMethod,
        confirmationData
      );
    }

    switch (methodConfig.type) {
      case PaymentMethodType.WEBHOOK_AUTOMATED:
        return this.processWebhookConfirmation(
          orderId,
          paymentMethod,
          confirmationData
        );

      case PaymentMethodType.API_POLLING:
        return this.processApiPollingConfirmation(
          orderId,
          paymentMethod,
          confirmationData
        );

      case PaymentMethodType.MANUAL_CONFIRMATION:
        return this.processManualConfirmation(
          orderId,
          paymentMethod,
          confirmationData
        );

      default:
        throw new Error(
          `Unsupported payment method type: ${methodConfig.type}`
        );
    }
  }

  /**
   * Process webhook-based confirmation (Tier 1)
   */
  private static async processWebhookConfirmation(
    orderId: string,
    paymentMethod: string,
    data: any
  ) {
    console.log('🚀 Processing webhook confirmation:', {
      orderId,
      paymentMethod,
    });

    return updateOrderStatus(
      orderId,
      'CONFIRMED',
      'PAID',
      `${paymentMethod}-webhook`,
      {
        paymentMethod,
        transactionId: data.transactionId,
        amount: data.amount,
        confirmationType: 'webhook_automated',
        processingTime: 'instant',
        ...data.verificationData,
      }
    );
  }

  /**
   * Process API polling confirmation (Tier 2)
   */
  private static async processApiPollingConfirmation(
    orderId: string,
    paymentMethod: string,
    data: any
  ) {
    console.log('⏱️ Processing API polling confirmation:', {
      orderId,
      paymentMethod,
    });

    return updateOrderStatus(
      orderId,
      'CONFIRMED',
      'PAID',
      `${paymentMethod}-api-poll`,
      {
        paymentMethod,
        transactionId: data.transactionId,
        amount: data.amount,
        confirmationType: 'api_polling',
        processingTime: '1-5 minutes',
        polledAt: new Date().toISOString(),
        ...data.verificationData,
      }
    );
  }

  /**
   * Process manual confirmation (Tier 3)
   */
  private static async processManualConfirmation(
    orderId: string,
    paymentMethod: string,
    data: any
  ) {
    console.log('👤 Processing manual confirmation:', {
      orderId,
      paymentMethod,
    });

    // For manual confirmations, we might want different status initially
    const requiresApproval =
      PAYMENT_METHODS[paymentMethod]?.requiresVerification;

    return updateOrderStatus(
      orderId,
      requiresApproval ? 'PROCESSING' : 'CONFIRMED',
      'PAID',
      data.triggeredBy || `${paymentMethod}-manual`,
      {
        paymentMethod,
        reference: data.reference,
        amount: data.amount,
        confirmationType: 'manual_confirmation',
        processingTime: 'manual',
        requiresVerification: requiresApproval,
        confirmedAt: new Date().toISOString(),
        ...data.verificationData,
      }
    );
  }

  /**
   * Get payment method configuration
   */
  static getPaymentMethodConfig(
    paymentMethod: string
  ): PaymentMethodConfig | null {
    return PAYMENT_METHODS[paymentMethod] || null;
  }

  /**
   * Get all payment methods by type
   */
  static getPaymentMethodsByType(type: PaymentMethodType): string[] {
    return Object.entries(PAYMENT_METHODS)
      .filter(([, config]) => config.type === type)
      .map(([method]) => method);
  }

  /**
   * Check if payment method requires manual confirmation
   */
  static requiresManualConfirmation(paymentMethod: string): boolean {
    const config = PAYMENT_METHODS[paymentMethod];
    return config?.type === PaymentMethodType.MANUAL_CONFIRMATION || false;
  }
}
