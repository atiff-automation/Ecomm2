/**
 * Airway Bill Service
 * Single Responsibility: Generate and manage airway bills for orders
 * Centralized logic for airway bill operations following DRY principles
 */

import { prisma } from '@/lib/db/prisma';
import { AirwayBillConfig } from '@/lib/config/airway-bill.config';
import { easyParcelCredentialsService } from '@/lib/services/easyparcel-credentials';
import axios, { AxiosInstance } from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { Order, OrderStatus, PaymentStatus } from '@prisma/client';

// Types for airway bill operations
export interface AirwayBillResult {
  success: boolean;
  awbNumber?: string;
  awbPdfUrl?: string;
  trackingUrl?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}


/**
 * AirwayBillService Class
 * Follows Single Responsibility Principle - handles only airway bill operations
 */
export class AirwayBillService {
  private static axiosInstance: AxiosInstance | null = null;

  /**
   * Initialize axios instance with proper configuration using database credentials
   */
  private static async getAxiosInstance(): Promise<AxiosInstance> {
    if (!this.axiosInstance) {
      const credentials = await easyParcelCredentialsService.getCredentials();

      this.axiosInstance = axios.create({
        baseURL: credentials.endpoint,
        timeout: AirwayBillConfig.generation.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
      });
    }
    return this.axiosInstance;
  }

  /**
   * ✅ NEW: Process EasyParcel payment and extract AWB data
   * This is the correct implementation based on EasyParcel API documentation
   */
  static async processPaymentAndExtractAWB(orderNumber: string): Promise<AirwayBillResult> {
    try {
      const credentials = await easyParcelCredentialsService.getCredentials();
      const axiosInstance = await this.getAxiosInstance();

      // Call EasyParcel payment API
      const response = await axiosInstance.post('/?ac=EPPayOrderBulk', {
        api: credentials.apiKey,
        bulk: [{
          order_no: orderNumber
        }]
      });

      console.log('🎯 EasyParcel payment API response:', response.data);

      if (response.data.api_status === 'Success' && response.data.result[0]?.parcel[0]) {
        const parcelData = response.data.result[0].parcel[0];

        return {
          success: true,
          awbNumber: parcelData.awb,
          awbPdfUrl: parcelData.awb_id_link,
          trackingUrl: parcelData.tracking_url,
        };
      }

      return {
        success: false,
        error: {
          code: 'PAYMENT_PROCESSING_FAILED',
          message: 'EasyParcel payment processing failed',
          details: response.data.result[0]?.messagenow || 'Unknown error',
        },
      };
    } catch (error: any) {
      console.error('EasyParcel payment processing error:', error);
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to process EasyParcel payment',
          details: error.response?.data || error.message,
        },
      };
    }
  }

  /**
   * Helper: Check if airway bill is already generated
   */
  static async isGenerated(orderId: string): Promise<boolean> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { airwayBillGenerated: true },
      });

      return order?.airwayBillGenerated ?? false;
    } catch (error) {
      console.error('Error checking airway bill generation status:', error);
      return false;
    }
  }

  /**
   * Helper: Get download URL for order airway bill
   */
  static async getDownloadUrl(orderId: string): Promise<string | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          airwayBillUrl: true,
          airwayBillGenerated: true,
        },
      });

      if (!order?.airwayBillGenerated || !order?.airwayBillUrl) {
        return null;
      }

      return order.airwayBillUrl;
    } catch (error) {
      console.error('Error getting airway bill download URL:', error);
      return null;
    }
  }


  /**
   * Helper: Validate order for airway bill generation
   */
  static async validateOrder(orderId: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          shipment: true,
        },
      });

      if (!order) {
        return { valid: false, reason: 'Order not found' };
      }

      if (!AirwayBillConfig.validation.requiredOrderStatus.includes(order.status as any)) {
        return { valid: false, reason: `Invalid order status: ${order.status}` };
      }

      if (!AirwayBillConfig.validation.requiredPaymentStatus.includes(order.paymentStatus as any)) {
        return { valid: false, reason: `Payment not confirmed: ${order.paymentStatus}` };
      }

      if (!order.shipment) {
        return { valid: false, reason: 'No shipment found for order' };
      }

      if (!order.shipment.easyParcelShipmentId) {
        return { valid: false, reason: 'No EasyParcel shipment ID found' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating order for airway bill:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Helper: Get airway bill information for order
   */
  static async getAirwayBillInfo(orderId: string): Promise<{
    generated: boolean;
    airwayBillNumber?: string;
    airwayBillUrl?: string;
    generatedAt?: Date;
  }> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          airwayBillGenerated: true,
          airwayBillNumber: true,
          airwayBillUrl: true,
          airwayBillGeneratedAt: true,
        },
      });

      if (!order) {
        return { generated: false };
      }

      return {
        generated: order.airwayBillGenerated,
        airwayBillNumber: order.airwayBillNumber || undefined,
        airwayBillUrl: order.airwayBillUrl || undefined,
        generatedAt: order.airwayBillGeneratedAt || undefined,
      };
    } catch (error) {
      console.error('Error getting airway bill info:', error);
      return { generated: false };
    }
  }
}

// Export singleton instance for easy access
export const airwayBillService = new AirwayBillService();