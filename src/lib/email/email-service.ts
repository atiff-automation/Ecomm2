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
  membershipInfo?: {
    isNewMember: boolean;
    memberId: string; // Malaysia NRIC
    memberSince: Date | null;
  };
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

      const emailData: any = {
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: html || options.text || '',
      };

      // Only add optional fields if they have values
      if (options.text) {
        emailData.text = options.text;
      }
      if (options.replyTo) {
        emailData.replyTo = options.replyTo;
      }
      if (options.cc) {
        emailData.cc = options.cc;
      }
      if (options.bcc) {
        emailData.bcc = options.bcc;
      }
      if (options.react) {
        emailData.react = options.react;
      }

      const result = await this.resend.emails.send(emailData);

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
   * Send order ready to ship notification
   * Called when admin books shipment with EasyParcel
   */
  async sendOrderReadyToShipNotification(
    orderData: OrderEmailData
  ): Promise<{ success: boolean; error?: string }> {
    if (!orderData.trackingNumber) {
      return {
        success: false,
        error: 'Tracking number is required for ready to ship notifications',
      };
    }

    try {
      const subject = `Order Ready to Ship - ${orderData.orderNumber}`;

      const html = this.generateReadyToShipNotificationHTML(orderData);

      const result = await this.sendEmail({
        to: orderData.customerEmail,
        subject,
        html,
      });

      return result;
    } catch (error) {
      console.error('Ready to ship notification email error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send ready to ship notification',
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

          ${
            orderData.membershipInfo?.isNewMember
              ? `
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      border-radius: 8px;
                      padding: 24px;
                      margin: 24px 0;
                      color: white;
                      text-align: center;">
            <h2 style="margin: 0 0 16px 0;">🎉 Welcome to Membership!</h2>
            <div style="background: rgba(255,255,255,0.2);
                        border-radius: 8px;
                        padding: 16px;
                        margin: 16px 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px;">Your Member ID</p>
              <p style="margin: 0;
                         font-size: 28px;
                         font-weight: bold;
                         font-family: 'Courier New', monospace;">
                ${orderData.membershipInfo.memberId}
              </p>
            </div>
            <p style="margin: 16px 0 0 0;">✨ Enjoy member pricing on all future purchases!</p>
          </div>
        `
              : ''
          }

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
   * Generate HTML for ready to ship notification email
   */
  private generateReadyToShipNotificationHTML(
    orderData: OrderEmailData
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Ready to Ship</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .tracking-box { background-color: #f0f9ff; border: 2px solid #0ea5e9; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
          .tracking-number { font-size: 24px; font-weight: bold; color: #0ea5e9; font-family: monospace; letter-spacing: 2px; }
          .info-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📦 Your Order is Ready to Ship!</h1>
        </div>

        <div class="content">
          <p>Dear ${orderData.customerName},</p>
          <p>Great news! Your order <strong>${orderData.orderNumber}</strong> has been processed and is ready to be shipped.</p>

          <div class="tracking-box">
            <h3>Tracking Information</h3>
            <p style="margin: 10px 0;">Your tracking number is:</p>
            <div class="tracking-number">${orderData.trackingNumber}</div>
            ${orderData.estimatedDelivery ? `<p style="margin-top: 15px;"><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>` : ''}
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
              You can track your package using this number once it's picked up by the courier.
            </p>
          </div>

          <div class="info-box">
            <h3>What happens next?</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Our courier partner will pick up your package within 1-2 business days</li>
              <li>You'll receive another email once your package is in transit</li>
              <li>Tracking information will be updated regularly</li>
              <li>Expected delivery within ${orderData.estimatedDelivery || '3-5 business days'}</li>
            </ul>
          </div>

          <p><strong>Delivery Address:</strong></p>
          ${
            orderData.shippingAddress
              ? `
            <div class="info-box">
              ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}<br>
              ${orderData.shippingAddress.addressLine1}<br>
              ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.postalCode}
            </div>
          `
              : ''
          }

          <p>Thank you for shopping with us! If you have any questions, please don't hesitate to contact us.</p>
        </div>

        <div class="footer">
          <p>&copy; 2024 JRM E-commerce. All rights reserved.</p>
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            This is an automated email notification. Please do not reply to this email.
          </p>
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
   * Send agent application confirmation email
   */
  async sendAgentApplicationConfirmation(data: {
    applicationId: string;
    applicantName: string;
    applicantEmail: string;
    submissionDate: Date;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = 'Permohonan Agen JRM - Pengesahan Diterima';

      const html = this.generateAgentApplicationConfirmationHTML(data);

      const result = await this.sendEmail({
        to: data.applicantEmail,
        subject,
        html,
      });

      return result;
    } catch (error) {
      console.error('Agent application confirmation email error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send confirmation',
      };
    }
  }

  /**
   * Send agent application status update email
   */
  async sendAgentApplicationStatusUpdate(data: {
    applicationId: string;
    applicantName: string;
    applicantEmail: string;
    status: string;
    adminNotes?: string;
    reviewDate: Date;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = `Kemaskini Status Permohonan Agen JRM - ${data.status}`;

      const html = this.generateAgentApplicationStatusUpdateHTML(data);

      const result = await this.sendEmail({
        to: data.applicantEmail,
        subject,
        html,
      });

      return result;
    } catch (error) {
      console.error('Agent application status update email error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send status update',
      };
    }
  }

  /**
   * Notify admins of new agent application
   */
  async notifyAdminsOfNewAgentApplication(data: {
    applicationId: string;
    applicantName: string;
    applicantEmail: string;
    submissionDate: Date;
    adminEmails: string[];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = 'Permohonan Agen Baru - Memerlukan Semakan';

      const html = this.generateAdminAgentApplicationNotificationHTML(data);

      const result = await this.sendEmail({
        to: data.adminEmails,
        subject,
        html,
      });

      return result;
    } catch (error) {
      console.error('Admin notification email error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to notify admins',
      };
    }
  }

  /**
   * Generate agent application confirmation HTML
   */
  private generateAgentApplicationConfirmationHTML(data: {
    applicationId: string;
    applicantName: string;
    submissionDate: Date;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pengesahan Permohonan Agen JRM</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .highlight { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Permohonan Agen JRM Diterima</h1>
          </div>
          <div class="content">
            <p>Assalamualaikum dan Salam Sejahtera <strong>${data.applicantName}</strong>,</p>

            <p>Terima kasih kerana menghantar permohonan untuk menjadi agen JRM. Kami dengan sukacitanya mengesahkan bahawa permohonan anda telah diterima.</p>

            <div class="highlight">
              <h3>Maklumat Permohonan:</h3>
              <p><strong>ID Permohonan:</strong> ${data.applicationId}</p>
              <p><strong>Tarikh Hantar:</strong> ${data.submissionDate.toLocaleDateString('ms-MY')}</p>
              <p><strong>Status:</strong> Dihantar untuk semakan</p>
            </div>

            <h3>Langkah Seterusnya:</h3>
            <ul>
              <li>Permohonan anda akan disemak oleh pasukan kami</li>
              <li>Proses semakan mengambil masa 3-5 hari bekerja</li>
              <li>Kami akan menghubungi anda melalui email atau telefon</li>
              <li>Sila pastikan maklumat yang diberikan adalah tepat</li>
            </ul>

            <p>Jika anda mempunyai sebarang pertanyaan, sila hubungi kami di:</p>
            <ul>
              <li>Email: agent@jrm.com</li>
              <li>Telefon: +6012-345-6789</li>
              <li>WhatsApp: +6012-345-6789</li>
            </ul>

            <p>Sekali lagi, terima kasih atas minat anda untuk menyertai keluarga besar JRM!</p>

            <p>Wassalam,<br>
            <strong>Pasukan JRM</strong></p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 JRM E-commerce. Hak cipta terpelihara.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate agent application status update HTML
   */
  private generateAgentApplicationStatusUpdateHTML(data: {
    applicationId: string;
    applicantName: string;
    status: string;
    adminNotes?: string;
    reviewDate: Date;
  }): string {
    const statusLabels: Record<string, string> = {
      APPROVED: 'Diluluskan',
      REJECTED: 'Ditolak',
      UNDER_REVIEW: 'Dalam Semakan',
      NEEDS_MORE_INFO: 'Memerlukan Maklumat Tambahan',
    };

    const statusLabel = statusLabels[data.status] || data.status;
    const isApproved = data.status === 'APPROVED';
    const isRejected = data.status === 'REJECTED';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kemaskini Status Permohonan Agen JRM</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isApproved ? '#4CAF50' : isRejected ? '#f44336' : '#ff9800'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-box { background: ${isApproved ? '#e8f5e8' : isRejected ? '#ffebee' : '#fff3e0'}; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${isApproved ? '#4CAF50' : isRejected ? '#f44336' : '#ff9800'}; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kemaskini Status Permohonan</h1>
          </div>
          <div class="content">
            <p>Assalamualaikum dan Salam Sejahtera <strong>${data.applicantName}</strong>,</p>

            <p>Kami ingin memaklumkan kemaskini status permohonan agen JRM anda:</p>

            <div class="status-box">
              <h3>Status Terkini: ${statusLabel}</h3>
              <p><strong>ID Permohonan:</strong> ${data.applicationId}</p>
              <p><strong>Tarikh Semakan:</strong> ${data.reviewDate.toLocaleDateString('ms-MY')}</p>
            </div>

            ${
              data.adminNotes
                ? `
              <h3>Nota dari Pasukan Kami:</h3>
              <p style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-style: italic;">${data.adminNotes}</p>
            `
                : ''
            }

            ${
              isApproved
                ? `
              <h3>Tahniah! Permohonan Anda Diluluskan</h3>
              <p>Selamat datang ke keluarga besar JRM! Berikut adalah langkah-langkah seterusnya:</p>
              <ul>
                <li>Kami akan menghubungi anda dalam 2-3 hari untuk setup akaun</li>
                <li>Anda akan menerima pakej permulaan dan bahan marketing</li>
                <li>Training online akan dijadualkan untuk minggu depan</li>
                <li>Portal agen akan diaktifkan selepas training</li>
              </ul>
            `
                : isRejected
                  ? `
              <h3>Maaf, Permohonan Tidak Diluluskan</h3>
              <p>Walaupun permohonan anda tidak diluluskan pada kali ini, kami amat menghargai minat anda. Anda boleh memohon semula selepas 6 bulan.</p>
            `
                  : `
              <h3>Permohonan Sedang Diproses</h3>
              <p>Kami masih dalam proses menyemak permohonan anda. Kami akan menghubungi anda sekiranya memerlukan maklumat tambahan.</p>
            `
            }

            <p>Jika anda mempunyai sebarang pertanyaan, sila hubungi kami di agent@jrm.com atau +6012-345-6789.</p>

            <p>Wassalam,<br>
            <strong>Pasukan JRM</strong></p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 JRM E-commerce. Hak cipta terpelihara.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate admin notification HTML
   */
  private generateAdminAgentApplicationNotificationHTML(data: {
    applicationId: string;
    applicantName: string;
    applicantEmail: string;
    submissionDate: Date;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Permohonan Agen Baru</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .highlight { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Permohonan Agen Baru</h1>
          </div>
          <div class="content">
            <p>Permohonan agen baru telah diterima dan memerlukan semakan:</p>

            <div class="highlight">
              <h3>Maklumat Pemohon:</h3>
              <p><strong>Nama:</strong> ${data.applicantName}</p>
              <p><strong>Email:</strong> ${data.applicantEmail}</p>
              <p><strong>ID Permohonan:</strong> ${data.applicationId}</p>
              <p><strong>Tarikh Hantar:</strong> ${data.submissionDate.toLocaleDateString('ms-MY')}</p>
            </div>

            <p>Sila log masuk ke panel admin untuk menyemak permohonan ini:</p>
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/agents/applications/${data.applicationId}" class="btn">Semak Permohonan</a>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/agents/applications" class="btn">Panel Admin</a>
            </div>

            <p>Pastikan untuk menyemak dan membalas permohonan dalam masa 3-5 hari bekerja.</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 JRM E-commerce Admin System</p>
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
