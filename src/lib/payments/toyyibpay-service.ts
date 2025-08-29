/**
 * toyyibPay Payment Service
 * Core service for handling toyyibPay bill creation, status checking, and management
 * Following the same architectural pattern as EasyParcel service for consistency
 */

import { toyyibPayCredentialsService } from '@/lib/services/toyyibpay-credentials';
import { toyyibPayCategoryService } from '@/lib/services/toyyibpay-category';
import {
  toyyibPayConfig,
  getToyyibPayUrl,
  getToyyibPayTimeout,
  sanitizeBillName,
  sanitizeBillDescription,
  convertRinggitToCents,
  generateExternalReference,
  getWebhookUrls,
} from '@/lib/config/toyyibpay-config';

export interface ToyyibPayBillRequest {
  userSecretKey: string;
  categoryCode: string;
  billName: string; // Max 30 chars, alphanumeric + space + underscore
  billDescription: string; // Max 100 chars, alphanumeric + space + underscore
  billPriceSetting: 0 | 1; // 0=dynamic, 1=fixed
  billPayorInfo: 0 | 1; // 0=no info required, 1=info required
  billAmount: number; // In cents
  billReturnUrl: string;
  billCallbackUrl: string;
  billExternalReferenceNo: string;
  billTo: string;
  billEmail: string;
  billPhone?: string;
  billPaymentChannel: '0' | '1' | '2'; // 0=FPX, 1=CC, 2=Both
}

export interface ToyyibPayBillResponse {
  BillCode?: string;
  BillpaymentUrl?: string;
  msg?: string;
}

export interface ToyyibPayTransactionResponse {
  billpaymentStatus?: string; // '1'=success, '2'=pending, '3'=fail
  billpaymentAmount?: string;
  billpaymentInvoiceNo?: string;
  billpaymentDate?: string;
  billTo?: string;
  billEmail?: string;
  billExternalReferenceNo?: string;
  msg?: string;
}

export interface PaymentResult {
  success: boolean;
  billCode?: string;
  paymentUrl?: string;
  error?: string;
  externalReference?: string;
}

export interface TransactionStatus {
  success: boolean;
  status?: 'success' | 'pending' | 'failed';
  amount?: number;
  invoiceNo?: string;
  paymentDate?: string;
  externalReference?: string;
  error?: string;
}

export class ToyyibPayService {
  private static instance: ToyyibPayService;
  private credentials: any = null;
  private isConfigured: boolean = false;
  private isSandbox: boolean = true;
  private baseURL: string = '';
  private categoryCode: string | null = null;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): ToyyibPayService {
    if (!ToyyibPayService.instance) {
      ToyyibPayService.instance = new ToyyibPayService();
    }
    return ToyyibPayService.instance;
  }

  /**
   * Initialize the service with credentials and configuration
   */
  private async initializeService(): Promise<void> {
    try {
      await this.ensureCredentials();
    } catch (error) {
      console.error('Error initializing toyyibPay service:', error);
    }
  }

  /**
   * Ensure credentials are loaded and service is configured
   */
  private async ensureCredentials(): Promise<void> {
    try {
      this.credentials =
        await toyyibPayCredentialsService.getCredentialsForService();

      if (this.credentials) {
        this.isConfigured = true;
        this.isSandbox = this.credentials.isSandbox;
        this.baseURL = getToyyibPayUrl(this.isSandbox);
        this.categoryCode = this.credentials.categoryCode || null;

        console.log(`🔍 toyyibPay service initialized:`, {
          configured: this.isConfigured,
          environment: this.credentials.environment,
          baseURL: this.baseURL,
          hasCategoryCode: !!this.categoryCode,
        });
      } else {
        this.isConfigured = false;
        console.log(
          '❌ toyyibPay service not configured - no credentials available'
        );
      }
    } catch (error) {
      console.error('Error ensuring toyyibPay credentials:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Get or create category code for bills
   */
  private async ensureCategoryCode(): Promise<string> {
    if (this.categoryCode) {
      return this.categoryCode;
    }

    try {
      const categoryResult =
        await toyyibPayCategoryService.getOrCreateDefaultCategory();

      if (categoryResult.success && categoryResult.categoryCode) {
        this.categoryCode = categoryResult.categoryCode;
        return this.categoryCode;
      } else {
        throw new Error(
          categoryResult.error || 'Failed to get or create category'
        );
      }
    } catch (error) {
      console.error('Error ensuring category code:', error);
      throw new Error('Unable to get category code for toyyibPay bills');
    }
  }

  /**
   * Create a bill for payment
   */
  async createBill(billData: {
    billName: string;
    billDescription: string;
    billAmount: number; // Amount in Ringgit
    billTo: string;
    billEmail: string;
    billPhone?: string;
    externalReferenceNo: string;
    paymentChannel?: '0' | '1' | '2';
  }): Promise<PaymentResult> {
    try {
      console.log(
        `🔄 Creating toyyibPay bill for amount: RM ${billData.billAmount}`
      );

      // Ensure service is configured
      await this.ensureCredentials();
      if (!this.isConfigured || !this.credentials) {
        return {
          success: false,
          error:
            'toyyibPay service not configured. Please configure credentials first.',
        };
      }

      // Ensure we have a category code
      const categoryCode = await this.ensureCategoryCode();

      // Get webhook URLs for current environment
      const webhookUrls = getWebhookUrls(this.credentials.environment);

      // Prepare bill request data
      const billRequest: ToyyibPayBillRequest = {
        userSecretKey: this.credentials.userSecretKey,
        categoryCode: categoryCode,
        billName: sanitizeBillName(billData.billName),
        billDescription: sanitizeBillDescription(billData.billDescription),
        billPriceSetting: toyyibPayConfig.billSettings.defaultPriceSetting,
        billPayorInfo: toyyibPayConfig.billSettings.defaultPayorInfo,
        billAmount: convertRinggitToCents(billData.billAmount),
        billReturnUrl: webhookUrls.returnUrl,
        billCallbackUrl: webhookUrls.callbackUrl,
        billExternalReferenceNo: billData.externalReferenceNo,
        billTo: billData.billTo,
        billEmail: billData.billEmail,
        billPhone: billData.billPhone || '',
        billPaymentChannel:
          billData.paymentChannel ||
          toyyibPayConfig.billSettings.defaultPaymentChannel,
      };

      console.log(`🔍 Bill request data:`, {
        billName: billRequest.billName,
        billDescription: billRequest.billDescription,
        billAmount: `${billRequest.billAmount} cents (RM ${billData.billAmount})`,
        categoryCode: billRequest.categoryCode,
        externalReference: billRequest.billExternalReferenceNo,
        paymentChannel: billRequest.billPaymentChannel,
      });

      // Use FormData (matching the working credential validation)
      const formData = new FormData();
      Object.entries(billRequest).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      // Make API call
      const response = await fetch(`${this.baseURL}/index.php/api/createBill`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`🔍 toyyibPay createBill response: ${responseText}`);

      // Parse response
      let responseData: ToyyibPayBillResponse[];
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        return {
          success: false,
          error: 'Invalid JSON response from toyyibPay API',
        };
      }

      // Process response - According to documentation, API returns [{"BillCode":"gcbhict9"}]
      if (responseData && responseData.length > 0) {
        const result = responseData[0];

        if (result.BillCode) {
          console.log(`✅ Bill created successfully: ${result.BillCode}`);

          // Construct payment URL manually: https://toyyibpay.com/{BillCode} or https://dev.toyyibpay.com/{BillCode}
          const paymentUrl = `${this.baseURL}/${result.BillCode}`;

          return {
            success: true,
            billCode: result.BillCode,
            paymentUrl: paymentUrl,
            externalReference: billRequest.billExternalReferenceNo,
          };
        } else if (result.msg) {
          console.log(`❌ Bill creation failed: ${result.msg}`);
          return {
            success: false,
            error: result.msg,
          };
        }
      }

      return {
        success: false,
        error: 'Unexpected response format from toyyibPay API',
      };
    } catch (error) {
      console.error('Error creating toyyibPay bill:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get bill transaction status
   */
  async getBillTransactions(billCode: string): Promise<TransactionStatus> {
    try {
      console.log(`🔄 Getting toyyibPay bill transactions for: ${billCode}`);

      // Ensure service is configured
      await this.ensureCredentials();
      if (!this.isConfigured || !this.credentials) {
        return {
          success: false,
          error: 'toyyibPay service not configured',
        };
      }

      // Use FormData
      const formData = new FormData();
      formData.append('userSecretKey', this.credentials.userSecretKey);
      formData.append('billCode', billCode);

      // Make API call
      const response = await fetch(
        `${this.baseURL}/index.php/api/getBillTransactions`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`🔍 toyyibPay getBillTransactions response: ${responseText}`);

      // Parse response
      let responseData: ToyyibPayTransactionResponse[];
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        return {
          success: false,
          error: 'Invalid JSON response from toyyibPay API',
        };
      }

      // Process response
      if (responseData && responseData.length > 0) {
        const result = responseData[0];

        if (result.billpaymentStatus) {
          const status =
            result.billpaymentStatus === '1'
              ? 'success'
              : result.billpaymentStatus === '2'
                ? 'pending'
                : 'failed';

          return {
            success: true,
            status: status,
            amount: result.billpaymentAmount
              ? parseFloat(result.billpaymentAmount) / 100
              : undefined,
            invoiceNo: result.billpaymentInvoiceNo,
            paymentDate: result.billpaymentDate,
            externalReference: result.billExternalReferenceNo,
          };
        } else if (result.msg) {
          return {
            success: false,
            error: result.msg,
          };
        }
      }

      return {
        success: false,
        error: 'No transaction data found for this bill',
      };
    } catch (error) {
      console.error('Error getting toyyibPay bill transactions:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Inactivate a bill (cancel unpaid bill)
   */
  async inactiveBill(
    billCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Inactivating toyyibPay bill: ${billCode}`);

      // Ensure service is configured
      await this.ensureCredentials();
      if (!this.isConfigured || !this.credentials) {
        return {
          success: false,
          error: 'toyyibPay service not configured',
        };
      }

      // Use FormData
      const formData = new FormData();
      formData.append('userSecretKey', this.credentials.userSecretKey);
      formData.append('billCode', billCode);

      // Make API call
      const response = await fetch(
        `${this.baseURL}/index.php/api/inactiveBill`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`🔍 toyyibPay inactiveBill response: ${responseText}`);

      // Parse response
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        return {
          success: false,
          error: 'Invalid JSON response from toyyibPay API',
        };
      }

      // Process response
      if (responseData && responseData.length > 0) {
        const result = responseData[0];

        if (result.msg && result.msg.includes('successfully')) {
          console.log(`✅ Bill inactivated successfully: ${billCode}`);
          return { success: true };
        } else if (result.msg) {
          return {
            success: false,
            error: result.msg,
          };
        }
      }

      return {
        success: false,
        error: 'Unexpected response from toyyibPay API',
      };
    } catch (error) {
      console.error('Error inactivating toyyibPay bill:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if service is properly configured
   */
  async isServiceConfigured(): Promise<boolean> {
    await this.ensureCredentials();
    return this.isConfigured;
  }

  /**
   * Get service configuration status
   */
  async getConfigurationStatus(): Promise<{
    isConfigured: boolean;
    environment?: string;
    baseURL?: string;
    hasCategoryCode: boolean;
    error?: string;
  }> {
    try {
      await this.ensureCredentials();

      if (!this.isConfigured) {
        return {
          isConfigured: false,
          hasCategoryCode: false,
          error: 'No credentials configured',
        };
      }

      return {
        isConfigured: true,
        environment: this.credentials?.environment,
        baseURL: this.baseURL,
        hasCategoryCode: !!this.categoryCode,
      };
    } catch (error) {
      return {
        isConfigured: false,
        hasCategoryCode: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Refresh service configuration (reload credentials and category)
   */
  async refreshConfiguration(): Promise<void> {
    this.credentials = null;
    this.categoryCode = null;
    this.isConfigured = false;
    await this.ensureCredentials();
  }
}

// Export singleton instance
export const toyyibPayService = ToyyibPayService.getInstance();
