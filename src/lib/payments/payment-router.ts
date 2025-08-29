/**
 * Payment Method Router Service
 * Routes payment requests to the appropriate payment gateway service
 * Provides fallback mechanisms and unified payment interface
 */

import { toyyibPayService } from './toyyibpay-service';
import { generateExternalReference } from '@/lib/config/toyyibpay-config';

export type PaymentMethod = 'BILLPLZ' | 'TOYYIBPAY';

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
  billplz: {
    available: boolean;
    configured: boolean;
    error?: string;
  };
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
      billplz: {
        available: false,
        configured: false,
      },
      toyyibpay: {
        available: false,
        configured: false,
      },
    };

    try {
      // Check Billplz availability
      try {
        // Safely check if Billplz is configured without throwing
        const apiKey = process.env.BILLPLZ_API_KEY;
        if (apiKey) {
          // Dynamically import billplz service to avoid module-level errors
          const { billplzService } = await import('./billplz-service');
          results.billplz.configured = billplzService.isConfigured();
          results.billplz.available = results.billplz.configured;
        } else {
          results.billplz.configured = false;
          results.billplz.available = false;
          results.billplz.error =
            'Billplz API key not configured in environment';
        }

        if (!results.billplz.configured) {
          results.billplz.error =
            results.billplz.error || 'Billplz not configured';
        }
      } catch (error) {
        results.billplz.configured = false;
        results.billplz.available = false;
        results.billplz.error =
          error instanceof Error ? error.message : 'Unknown error';
      }

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

    // Prefer toyyibPay if available (as per business requirements)
    if (availability.toyyibpay.available) {
      return 'TOYYIBPAY';
    }

    // Fallback to Billplz
    if (availability.billplz.available) {
      return 'BILLPLZ';
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
      {
        id: 'BILLPLZ',
        name: 'Billplz',
        description: 'Malaysian payment gateway with multiple options',
        features: [
          'FPX (Online Banking)',
          'Boost Wallet',
          'GrabPay',
          "Touch 'n Go eWallet",
        ],
        processingTime: 'Instant',
        available: availability.billplz.available,
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
            paymentMethod: 'BILLPLZ', // Default for error response
            error: 'No payment gateways are available',
          };
        }
        console.log(`🔄 Auto-selected payment method: ${paymentMethod}`);
      }

      // Validate the selected payment method is available
      const availability = await this.getGatewayAvailability();
      const methodKey = paymentMethod.toLowerCase() as 'billplz' | 'toyyibpay';

      if (!availability[methodKey]?.available) {
        // Try fallback
        const fallbackMethod =
          paymentMethod === 'TOYYIBPAY' ? 'BILLPLZ' : 'TOYYIBPAY';
        const fallbackKey = fallbackMethod.toLowerCase() as
          | 'billplz'
          | 'toyyibpay';

        if (availability[fallbackKey]?.available) {
          console.log(
            `⚠️ ${paymentMethod} unavailable, falling back to ${fallbackMethod}`
          );
          paymentMethod = fallbackMethod;
        } else {
          return {
            success: false,
            paymentMethod,
            error: `${paymentMethod} is not available: ${availability[methodKey]?.error}`,
          };
        }
      }

      // Route to appropriate service
      if (paymentMethod === 'TOYYIBPAY') {
        return await this.createToyyibPayPayment(request);
      } else {
        return await this.createBillplzPayment(request);
      }
    } catch (error) {
      console.error('Error in payment routing:', error);
      return {
        success: false,
        paymentMethod: request.paymentMethod || 'BILLPLZ',
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
   * Create payment via Billplz
   */
  private async createBillplzPayment(
    request: PaymentRequest
  ): Promise<PaymentResult> {
    try {
      console.log('🔄 Creating Billplz payment');

      // Dynamically import billplz service
      const { billplzService } = await import('./billplz-service');

      const billData = {
        collection_id: billplzService.generateCollectionId(),
        description: request.description,
        email: request.customerInfo.email,
        name: request.customerInfo.name,
        amount: request.amount, // Billplz service will convert to cents
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        reference_1_label: 'Order Number',
        reference_1: request.orderNumber,
        reference_2_label: 'Customer Email',
        reference_2: request.customerInfo.email,
      };

      const result = await billplzService.createBill(billData);

      if (result.success && result.bill_id && result.payment_url) {
        console.log(`✅ Billplz payment created: ${result.bill_id}`);

        return {
          success: true,
          paymentMethod: 'BILLPLZ',
          billId: result.bill_id,
          paymentUrl: result.payment_url,
        };
      } else {
        console.log(`❌ Billplz payment failed: ${result.error}`);

        return {
          success: false,
          paymentMethod: 'BILLPLZ',
          error: result.error || 'Failed to create Billplz payment',
        };
      }
    } catch (error) {
      console.error('Error creating Billplz payment:', error);
      return {
        success: false,
        paymentMethod: 'BILLPLZ',
        error: error instanceof Error ? error.message : 'Unknown Billplz error',
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
      } else if (paymentMethod === 'BILLPLZ') {
        // Dynamically import billplz service
        const { billplzService } = await import('./billplz-service');
        const result = await billplzService.getBill(identifier);

        if (result.success && result.bill) {
          const status = result.bill.paid
            ? 'paid'
            : result.bill.state === 'deleted'
              ? 'failed'
              : 'pending';

          return {
            success: true,
            status,
            amount: result.bill.amount / 100, // Convert from cents to ringgit
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
