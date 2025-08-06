/**
 * Email Service for JRM E-commerce
 * Handles transactional and promotional emails using Resend
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';
import React from 'react';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface MemberWelcomeData {
  memberName: string;
  memberEmail: string;
  memberSince: string;
  benefits: string[];
  firstOrderDiscount?: string;
}

export class EmailService {
  private resend: Resend | null = null;
  private isConfigured: boolean = false;
  private defaultFrom: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.defaultFrom =
      process.env.EMAIL_FROM || 'JRM E-commerce <noreply@jrmecommerce.com>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.isConfigured = true;
    } else {
      console.warn(
        'Resend API key not configured. Email service will use mock mode.'
      );
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(
    options: EmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.isConfigured || !this.resend) {
        console.log('Mock email sent:', {
          to: options.to,
          subject: options.subject,
          from: options.from || this.defaultFrom,
        });
        return { success: true, messageId: 'mock-email-id' };
      }

      let html = options.html;

      // If React component provided, render it to HTML
      if (options.react && !html) {
        html = await render(options.react);
      }

      const result = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: html || options.text || '',
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
      });

      if (result.error) {
        console.error('Resend API error:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    orderData: OrderEmailData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = `Order Confirmation - ${orderData.orderNumber}`;

      const html = this.generateOrderConfirmationHTML(orderData);

      const result = await this.sendEmail({
        to: orderData.customerEmail,
        subject,
        html,
      });

      return result;
    } catch (error) {
      console.error('Order confirmation email error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send order confirmation',
      };
    }
  }

  /**
   * Send shipping notification email
   */
  async sendShippingNotification(
    orderData: OrderEmailData
  ): Promise<{ success: boolean; error?: string }> {
    if (!orderData.trackingNumber) {
      return {
        success: false,
        error: 'Tracking number is required for shipping notifications',
      };
    }

    try {
      const subject = `Your Order is On the Way - ${orderData.orderNumber}`;

      const html = this.generateShippingNotificationHTML(orderData);

      const result = await this.sendEmail({
        to: orderData.customerEmail,
        subject,
        html,
      });

      return result;
    } catch (error) {
      console.error('Shipping notification email error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send shipping notification',
      };
    }
  }

  /**
   * Send member welcome email
   */
  async sendMemberWelcome(
    memberData: MemberWelcomeData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = 'Welcome to JRM E-commerce Membership! 🎉';

      const html = this.generateMemberWelcomeHTML(memberData);

      const result = await this.sendEmail({
        to: memberData.memberEmail,
        subject,
        html,
      });

      return result;
    } catch (error) {
      console.error('Member welcome email error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send member welcome email',
      };
    }
  }

  /**
   * Send payment failure notification
   */
  async sendPaymentFailure(
    orderData: OrderEmailData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = `Payment Issue - Order ${orderData.orderNumber}`;

      const html = this.generatePaymentFailureHTML(orderData);

      const result = await this.sendEmail({
        to: orderData.customerEmail,
        subject,
        html,
      });

      return result;
    } catch (error) {
      console.error('Payment failure email error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send payment failure notification',
      };
    }
  }

  /**
   * Generate HTML for order confirmation email
   */
  private generateOrderConfirmationHTML(orderData: OrderEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          .items-table th { background-color: #f8f9fa; }
          .total-row { font-weight: bold; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Order Confirmation</h1>
          <p>Thank you for your purchase!</p>
        </div>
        
        <div class="content">
          <p>Dear ${orderData.customerName},</p>
          <p>We're excited to confirm that we've received your order. Here are your order details:</p>
          
          <div class="order-details">
            <h3>Order Information</h3>
            <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
            <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
            ${
              orderData.shippingAddress
                ? `
              <h4>Shipping Address</h4>
              <p>
                ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}<br>
                ${orderData.shippingAddress.addressLine1}<br>
                ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.postalCode}
              </p>
            `
                : ''
            }
          </div>
          
          <h3>Order Items</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items
                .map(
                  item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>RM ${item.price.toFixed(2)}</td>
                  <td>RM ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          
          <table class="items-table">
            <tr>
              <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
              <td><strong>RM ${orderData.subtotal.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right;"><strong>Tax:</strong></td>
              <td><strong>RM ${orderData.taxAmount.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right;"><strong>Shipping:</strong></td>
              <td><strong>RM ${orderData.shippingCost.toFixed(2)}</strong></td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
              <td><strong>RM ${orderData.total.toFixed(2)}</strong></td>
            </tr>
          </table>
          
          <p>We'll send you another email when your order ships with tracking information.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        
        <div class="footer">
          <p>&copy; 2024 JRM E-commerce. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for shipping notification email
   */
  private generateShippingNotificationHTML(orderData: OrderEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Order is On the Way</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .tracking-box { background-color: #f0f9ff; border: 2px solid #0ea5e9; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
          .tracking-number { font-size: 24px; font-weight: bold; color: #0ea5e9; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📦 Your Order is On the Way!</h1>
        </div>
        
        <div class="content">
          <p>Dear ${orderData.customerName},</p>
          <p>Great news! Your order <strong>${orderData.orderNumber}</strong> has been shipped and is on its way to you.</p>
          
          <div class="tracking-box">
            <h3>Tracking Information</h3>
            <div class="tracking-number">${orderData.trackingNumber}</div>
            ${orderData.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>` : ''}
            <p>You can track your package using the tracking number above.</p>
          </div>
          
          <p>Your order will be delivered to:</p>
          ${
            orderData.shippingAddress
              ? `
            <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}<br>
              ${orderData.shippingAddress.addressLine1}<br>
              ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.postalCode}
            </p>
          `
              : ''
          }
          
          <p>If you have any questions or concerns about your delivery, please don't hesitate to contact us.</p>
        </div>
        
        <div class="footer">
          <p>&copy; 2024 JRM E-commerce. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for member welcome email
   */
  private generateMemberWelcomeHTML(memberData: MemberWelcomeData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to JRM Membership</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #7c3aed; color: white; padding: 30px; text-align: center; }
          .content { padding: 20px; }
          .benefits-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; }
          .benefit-item { margin: 10px 0; padding-left: 20px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to JRM Membership!</h1>
          <p>You're now part of our exclusive member community</p>
        </div>
        
        <div class="content">
          <p>Dear ${memberData.memberName},</p>
          <p>Congratulations! You've successfully become a JRM E-commerce member as of ${memberData.memberSince}.</p>
          
          <div class="benefits-box">
            <h3>Your Exclusive Member Benefits:</h3>
            ${memberData.benefits.map(benefit => `<div class="benefit-item">✅ ${benefit}</div>`).join('')}
          </div>
          
          ${
            memberData.firstOrderDiscount
              ? `
            <div style="background-color: #dcfce7; border: 2px solid #16a34a; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <h3 style="color: #16a34a;">Special Welcome Offer!</h3>
              <p style="font-size: 18px; font-weight: bold;">Get ${memberData.firstOrderDiscount} off your next purchase</p>
              <p>Use this exclusive member discount on your next order!</p>
            </div>
          `
              : ''
          }
          
          <p>Start enjoying your member benefits right away by browsing our exclusive member prices throughout our store.</p>
          <p>Thank you for choosing JRM E-commerce. We're excited to serve you as a valued member!</p>
        </div>
        
        <div class="footer">
          <p>&copy; 2024 JRM E-commerce. All rights reserved.</p>
          <p>You're receiving this email because you became a JRM member.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for payment failure email
   */
  private generatePaymentFailureHTML(orderData: OrderEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Issue</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .retry-box { background-color: #fef2f2; border: 2px solid #ef4444; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Payment Issue with Your Order</h1>
        </div>
        
        <div class="content">
          <p>Dear ${orderData.customerName},</p>
          <p>We encountered an issue processing the payment for your order <strong>${orderData.orderNumber}</strong>.</p>
          
          <div class="retry-box">
            <h3>What happens next?</h3>
            <p>Don't worry - your order is still reserved for you. You can retry the payment or choose a different payment method.</p>
            <p><strong>Order Total: RM ${orderData.total.toFixed(2)}</strong></p>
          </div>
          
          <p>Common reasons for payment issues:</p>
          <ul>
            <li>Insufficient funds in your account</li>
            <li>Card expired or blocked</li>
            <li>Incorrect billing information</li>
            <li>Bank security restrictions</li>
          </ul>
          
          <p>If you continue to experience issues, please contact your bank or try a different payment method.</p>
          <p>If you need assistance, please don't hesitate to contact us.</p>
        </div>
        
        <div class="footer">
          <p>&copy; 2024 JRM E-commerce. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Check if email service is properly configured
   */
  isEmailServiceConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Get configuration status for debugging
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      hasApiKey: !!process.env.RESEND_API_KEY,
      defaultFrom: this.defaultFrom,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
