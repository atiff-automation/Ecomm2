/**
 * Billplz Payment Service for Malaysian E-commerce
 * Handles payment processing, bill creation, and webhook verification
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

export interface BillplzBillData {
  collection_id: string;
  description: string;
  email: string;
  name: string;
  amount: number; // Amount in cents (e.g., RM 1.00 = 100)
  callback_url?: string;
  redirect_url?: string;
  reference_1_label?: string;
  reference_1?: string;
  reference_2_label?: string;
  reference_2?: string;
}

export interface BillplzBill {
  id: string;
  collection_id: string;
  paid: boolean;
  state: 'due' | 'paid' | 'deleted';
  amount: number;
  paid_amount: number;
  due_at: string;
  email: string;
  mobile: string | null;
  name: string;
  url: string;
  reference_1_label: string | null;
  reference_1: string | null;
  reference_2_label: string | null;
  reference_2: string | null;
  redirect_url: string | null;
  callback_url: string | null;
  description: string;
}

export interface BillplzWebhook {
  id: string;
  collection_id: string;
  paid: boolean;
  state: 'due' | 'paid' | 'deleted';
  amount: number;
  paid_amount: number;
  paid_at: string;
  x_signature: string;
}

export interface PaymentResult {
  success: boolean;
  bill?: BillplzBill;
  error?: string;
  bill_id?: string;
  payment_url?: string;
}

export class BillplzService {
  private api: AxiosInstance;
  private apiKey: string;
  private webhookSecret: string;
  private isSandbox: boolean;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.BILLPLZ_API_KEY || '';
    this.webhookSecret = process.env.BILLPLZ_WEBHOOK_SECRET || '';
    this.isSandbox = process.env.BILLPLZ_SANDBOX === 'true';
    
    // Use sandbox URL for testing
    this.baseURL = this.isSandbox 
      ? 'https://www.billplz-sandbox.com/api/v3'
      : 'https://www.billplz.com/api/v3';

    if (!this.apiKey) {
      throw new Error('Billplz API key is required');
    }

    // Setup axios instance with basic auth
    this.api = axios.create({
      baseURL: this.baseURL,
      auth: {
        username: this.apiKey,
        password: ''
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  /**
   * Create a new bill for payment
   */
  async createBill(billData: BillplzBillData): Promise<PaymentResult> {
    try {
      // Validate required fields
      if (!billData.collection_id || !billData.email || !billData.amount) {
        return {
          success: false,
          error: 'Missing required fields: collection_id, email, amount'
        };
      }

      // Convert amount to cents if it's in ringgit
      const amountInCents = Math.round(billData.amount * 100);

      const params = new URLSearchParams({
        collection_id: billData.collection_id,
        description: billData.description,
        email: billData.email,
        name: billData.name,
        amount: amountInCents.toString(),
      });

      // Add optional parameters
      if (billData.callback_url) {
        params.append('callback_url', billData.callback_url);
      }
      
      if (billData.redirect_url) {
        params.append('redirect_url', billData.redirect_url);
      }

      if (billData.reference_1_label && billData.reference_1) {
        params.append('reference_1_label', billData.reference_1_label);
        params.append('reference_1', billData.reference_1);
      }

      if (billData.reference_2_label && billData.reference_2) {
        params.append('reference_2_label', billData.reference_2_label);
        params.append('reference_2', billData.reference_2);
      }

      const response = await this.api.post('/bills', params);

      if (response.status === 200) {
        const bill: BillplzBill = response.data;
        return {
          success: true,
          bill,
          bill_id: bill.id,
          payment_url: bill.url
        };
      }

      return {
        success: false,
        error: 'Failed to create bill'
      };

    } catch (error) {
      console.error('Billplz createBill error:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred while creating bill'
      };
    }
  }

  /**
   * Get bill information
   */
  async getBill(billId: string): Promise<PaymentResult> {
    try {
      const response = await this.api.get(`/bills/${billId}`);

      if (response.status === 200) {
        const bill: BillplzBill = response.data;
        return {
          success: true,
          bill
        };
      }

      return {
        success: false,
        error: 'Bill not found'
      };

    } catch (error) {
      console.error('Billplz getBill error:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred while fetching bill'
      };
    }
  }

  /**
   * Delete a bill (only for unpaid bills)
   */
  async deleteBill(billId: string): Promise<PaymentResult> {
    try {
      const response = await this.api.delete(`/bills/${billId}`);

      if (response.status === 200) {
        return {
          success: true
        };
      }

      return {
        success: false,
        error: 'Failed to delete bill'
      };

    } catch (error) {
      console.error('Billplz deleteBill error:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred while deleting bill'
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(webhookData: Record<string, string>, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('Webhook secret not configured, skipping verification');
      return true; // Allow in development
    }

    try {
      // Sort the data keys
      const keys = Object.keys(webhookData).sort();
      
      // Create the signature string
      let signatureString = '';
      keys.forEach(key => {
        if (key !== 'x_signature') {
          signatureString += `${key}${webhookData[key]}`;
        }
      });

      // Generate the expected signature
      const expectedSignature = crypto.HmacSHA256(signatureString, this.webhookSecret).toString();

      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Process webhook notification
   */
  processWebhook(webhookData: Record<string, string>): BillplzWebhook | null {
    try {
      const webhook: BillplzWebhook = {
        id: webhookData.id,
        collection_id: webhookData.collection_id,
        paid: webhookData.paid === 'true',
        state: webhookData.state as 'due' | 'paid' | 'deleted',
        amount: parseInt(webhookData.amount) || 0,
        paid_amount: parseInt(webhookData.paid_amount) || 0,
        paid_at: webhookData.paid_at,
        x_signature: webhookData.x_signature
      };

      return webhook;
    } catch (error) {
      console.error('Webhook processing error:', error);
      return null;
    }
  }

  /**
   * Format amount from cents to ringgit
   */
  formatAmount(amountInCents: number): string {
    const amount = amountInCents / 100;
    return `RM ${amount.toFixed(2)}`;
  }

  /**
   * Generate collection ID for different purposes
   */
  generateCollectionId(): string {
    // In production, you would have predefined collection IDs
    // For development, we'll generate a UUID
    return this.isSandbox ? uuidv4() : process.env.BILLPLZ_COLLECTION_ID || '';
  }

  /**
   * Get payment methods available
   */
  getAvailablePaymentMethods(): string[] {
    return [
      'fpx', // Online Banking
      'boost', // Boost Wallet
      'grabpay', // GrabPay
      'tng', // Touch 'n Go eWallet
      'shopeepay', // ShopeePay
      'credit_card' // Credit/Debit Cards
    ];
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && (this.isSandbox || this.webhookSecret));
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus() {
    return {
      hasApiKey: !!this.apiKey,
      hasWebhookSecret: !!this.webhookSecret,
      isSandbox: this.isSandbox,
      baseURL: this.baseURL
    };
  }
}

// Export singleton instance
export const billplzService = new BillplzService();