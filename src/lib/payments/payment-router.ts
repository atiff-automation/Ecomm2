/**
 * Payment Method Router Service
 * Routes payment requests to the appropriate payment gateway service
 * Provides fallback mechanisms and unified payment interface
 */

import { toyyibPayService } from './toyyibpay-service';
import { generateExternalReference } from '@/lib/config/toyyibpay-config';

export type PaymentMethod = 'TOYYIBPAY';

export interface PaymentRequest {
  orderNumber: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  amount: number; // Amount in Ringgit
  description: string;
  paymentMethod?: PaymentMethod;
}

export interface PaymentResult {
  success: boolean;
  paymentMethod: PaymentMethod;
  billId?: string;
  billCode?: string; // For toyyibPay
  paymentUrl?: string;
  error?: string;
  externalReference?: string;
}

export interface PaymentGatewayAvailability {
  toyyibpay: {
    available: boolean;
    configured: boolean;
    error?: string;
  };
}

export class PaymentRouterService {
  private static instance: PaymentRouterService;

  private constructor() {}

  public static getInstance(): PaymentRouterService {
    if (!PaymentRouterService.instance) {
      PaymentRouterService.instance = new PaymentRouterService();
    }
    return PaymentRouterService.instance;
  }

  /**
   * Get availability status of all payment gateways
   */
  async getGatewayAvailability(): Promise<PaymentGatewayAvailability> {
    const results: PaymentGatewayAvailability = {
      toyyibpay: {
        available: false,
        configured: false,
      },
    };

    try {
      // Check toyyibPay availability
      try {
        results.toyyibpay.configured =
          await toyyibPayService.isServiceConfigured();
        results.toyyibpay.available = results.toyyibpay.configured;

        if (!results.toyyibpay.configured) {
          results.toyyibpay.error = 'toyyibPay not configured';
        }
      } catch (error) {
        results.toyyibpay.error =
          error instanceof Error ? error.message : 'Unknown error';
      }

      console.log('🔍 Payment gateway availability:', results);
      return results;
    } catch (error) {
      console.error('Error checking gateway availability:', error);
      return results;
    }
  }

  /**
   * Get the default payment method based on availability
   */
  async getDefaultPaymentMethod(): Promise<PaymentMethod | null> {
    const availability = await this.getGatewayAvailability();

    // Use toyyibPay as the only available payment method
    if (availability.toyyibpay.available) {
      return 'TOYYIBPAY';
    }

    return null;
  }

  /**
   * Get available payment methods for customer selection
   */
  async getAvailablePaymentMethods(): Promise<
    Array<{
      id: PaymentMethod;
      name: string;
      description: string;
      features: string[];
      processingTime: string;
      available: boolean;
    }>
  > {
    const availability = await this.getGatewayAvailability();

    return [
      {
        id: 'TOYYIBPAY',
        name: 'toyyibPay',
        description: 'FPX & Credit Card payments via toyyibPay',
        features: [
          'FPX (Malaysian Banks)',
          'Credit/Debit Cards',
          'Instant processing',
          'Local Malaysian gateway',
        ],
        processingTime: 'Instant',
        available: availability.toyyibpay.available,
      },
    ];
  }

  /**
   * Route payment request to appropriate gateway
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      console.log(`🔄 Processing payment for order ${request.orderNumber}`);
      console.log(
        `💰 Amount: RM ${request.amount}, Method: ${request.paymentMethod || 'AUTO'}`
      );

      // Determine payment method
      let paymentMethod = request.paymentMethod;

      if (!paymentMethod) {
        paymentMethod = await this.getDefaultPaymentMethod();
        if (!paymentMethod) {
          return {
            success: false,
            paymentMethod: 'TOYYIBPAY', // Default for error response
            error: 'No payment gateways are available',
          };
        }
        console.log(`🔄 Auto-selected payment method: ${paymentMethod}`);
      }

      // Validate the selected payment method is available
      const availability = await this.getGatewayAvailability();
      const methodKey = paymentMethod.toLowerCase() as 'toyyibpay';

      if (!availability[methodKey]?.available) {
        return {
          success: false,
          paymentMethod,
          error: `${paymentMethod} is not available: ${availability[methodKey]?.error}`,
        };
      }

      // Route to appropriate service
      return await this.createToyyibPayPayment(request);
    } catch (error) {
      console.error('Error in payment routing:', error);
      return {
        success: false,
        paymentMethod: request.paymentMethod || 'TOYYIBPAY',
        error: error instanceof Error ? error.message : 'Unknown payment error',
      };
    }
  }

  /**
   * Create payment via toyyibPay
   */
  private async createToyyibPayPayment(
    request: PaymentRequest
  ): Promise<PaymentResult> {
    try {
      console.log('🔄 Creating toyyibPay payment');

      const externalReference = generateExternalReference(request.orderNumber);

      const result = await toyyibPayService.createBill({
        billName: `Order_${request.orderNumber}`,
        billDescription: request.description,
        billAmount: request.amount,
        billTo: request.customerInfo.name,
        billEmail: request.customerInfo.email,
        billPhone: request.customerInfo.phone,
        externalReferenceNo: externalReference,
        paymentChannel: '2', // Both FPX and Credit Card
      });

      if (result.success && result.billCode && result.paymentUrl) {
        console.log(`✅ toyyibPay payment created: ${result.billCode}`);

        return {
          success: true,
          paymentMethod: 'TOYYIBPAY',
          billCode: result.billCode,
          paymentUrl: result.paymentUrl,
          externalReference: result.externalReference,
        };
      } else {
        console.log(`❌ toyyibPay payment failed: ${result.error}`);

        return {
          success: false,
          paymentMethod: 'TOYYIBPAY',
          error: result.error || 'Failed to create toyyibPay payment',
        };
      }
    } catch (error) {
      console.error('Error creating toyyibPay payment:', error);
      return {
        success: false,
        paymentMethod: 'TOYYIBPAY',
        error:
          error instanceof Error ? error.message : 'Unknown toyyibPay error',
      };
    }
  }


  /**
   * Check payment status for any payment method
   */
  async checkPaymentStatus(
    paymentMethod: PaymentMethod,
    identifier: string
  ): Promise<{
    success: boolean;
    status?: 'pending' | 'paid' | 'failed';
    amount?: number;
    error?: string;
  }> {
    try {
      if (paymentMethod === 'TOYYIBPAY') {
        const result = await toyyibPayService.getBillTransactions(identifier);

        if (result.success) {
          return {
            success: true,
            status: result.status,
            amount: result.amount,
          };
        } else {
          return {
            success: false,
            error: result.error,
          };
        }
      } else {
        return {
          success: false,
          error: 'Unsupported payment method',
        };
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const paymentRouter = PaymentRouterService.getInstance();
