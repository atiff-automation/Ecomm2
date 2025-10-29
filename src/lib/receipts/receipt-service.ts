/**
 * Tax Receipt Generation Service for Malaysian E-commerce
 * Generates official tax receipts with Malaysian tax compliance
 */

import { prisma } from '@/lib/db/prisma';
import { malaysianTaxService } from '@/lib/tax/malaysian-tax';
import { businessProfileService } from './business-profile-service';
import { imageUrlToBase64 } from '@/lib/utils/image-utils';

export interface TaxReceiptData {
  order: {
    id: string;
    orderNumber: string;
    createdAt: Date;
    status: string;
    paymentStatus: string;
    subtotal: number;
    taxAmount: number;
    shippingCost: number;
    discountAmount: number;
    total: number;
    paymentMethod: string;
    customerNotes: string | undefined;
  };
  customer: {
    firstName: string | undefined;
    lastName: string | undefined;
    email: string;
    phone: string | undefined;
    isMember: boolean;
  };
  orderItems: Array<{
    id: string;
    productName: string;
    productSku?: string;
    quantity: number;
    regularPrice: number;
    memberPrice: number;
    appliedPrice: number;
    totalPrice: number;
  }>;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    phone: string | undefined;
    addressLine1: string;
    addressLine2: string | undefined;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    phone: string | undefined;
    addressLine1: string;
    addressLine2: string | undefined;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  taxBreakdown: {
    taxableAmount: number;
    sstAmount: number;
    gstAmount: number;
    totalTax: number;
    taxRate: string;
  };
}

export class TaxReceiptService {
  /**
   * Get company info from business profile
   */
  private async getCompanyInfo() {
    return await businessProfileService.getLegacyCompanyInfo();
  }

  /**
   * Get tax receipt data for an order
   */
  async getTaxReceiptData(
    orderId: string,
    userId?: string
  ): Promise<TaxReceiptData | null> {
    try {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          ...(userId && { userId }), // If userId provided, ensure order belongs to user
        },
        include: {
          orderItems: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isMember: true,
            },
          },
          shippingAddress: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              addressLine1: true,
              addressLine2: true,
              city: true,
              state: true,
              postalCode: true,
              country: true,
            },
          },
        },
      });

      if (!order) {
        return null;
      }

      // Fetch billing address separately if exists
      let billingAddress = null;
      if (order.billingAddressId) {
        billingAddress = await prisma.address.findUnique({
          where: { id: order.billingAddressId },
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
          },
        });
      }

      // Calculate tax breakdown
      const taxProducts = order.orderItems.map((item: any) => ({
        id: item.productId,
        name: item.productName,
        price: item.appliedPrice,
        quantity: item.quantity,
        taxCategory: 'STANDARD' as const,
        isGstApplicable: false, // GST suspended
        isSstApplicable: true, // SST active
      }));

      const taxBreakdown = await malaysianTaxService.calculateTax(taxProducts);

      const receiptData: TaxReceiptData = {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          status: order.status as string,
          paymentStatus: order.paymentStatus as string,
          subtotal: Number(order.subtotal),
          taxAmount: Number(order.taxAmount),
          shippingCost: Number(order.shippingCost),
          discountAmount: Number(order.discountAmount),
          total: Number(order.total),
          paymentMethod: order.paymentMethod ?? 'Unknown',
          customerNotes: order.customerNotes ?? undefined,
        },
        customer: {
          firstName: order.user?.firstName ?? undefined,
          lastName: order.user?.lastName ?? undefined,
          email: order.user?.email ?? 'guest@customer.com',
          phone: order.user?.phone ?? undefined,
          isMember: order.user?.isMember ?? false,
        },
        orderItems: order.orderItems.map((item: any) => ({
          id: item.id,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          regularPrice: Number(item.regularPrice),
          memberPrice: Number(item.memberPrice),
          appliedPrice: Number(item.appliedPrice),
          totalPrice: Number(item.totalPrice),
        })),
        ...(order.shippingAddress
          ? {
              shippingAddress: {
                firstName: order.shippingAddress.firstName,
                lastName: order.shippingAddress.lastName,
                phone: order.shippingAddress.phone ?? undefined,
                addressLine1: order.shippingAddress.addressLine1,
                addressLine2: order.shippingAddress.addressLine2 ?? undefined,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                postalCode: order.shippingAddress.postalCode,
                country: order.shippingAddress.country,
              },
            }
          : {}),
        ...(billingAddress
          ? {
              billingAddress: {
                firstName: billingAddress.firstName,
                lastName: billingAddress.lastName,
                phone: billingAddress.phone ?? undefined,
                addressLine1: billingAddress.addressLine1,
                addressLine2: billingAddress.addressLine2 ?? undefined,
                city: billingAddress.city,
                state: billingAddress.state,
                postalCode: billingAddress.postalCode,
                country: billingAddress.country,
              },
            }
          : {}),
        taxBreakdown: {
          taxableAmount: taxBreakdown.subtotal,
          sstAmount: taxBreakdown.taxAmount || 0, // SST amount is the tax amount
          gstAmount: 0, // GST is suspended in Malaysia
          totalTax: taxBreakdown.taxAmount,
          taxRate: '6%', // Current Malaysian SST rate
        },
      };

      return receiptData;
    } catch (error) {
      console.error('Error fetching tax receipt data:', error);
      return null;
    }
  }

  /**
   * Generate HTML tax receipt
   */
  async generateTaxReceiptHTML(
    receiptData: TaxReceiptData
  ): Promise<string> {
    const { order, customer, orderItems, shippingAddress, taxBreakdown } =
      receiptData;

    // Get company info from business profile
    const companyInfo = await this.getCompanyInfo();

    // Convert logo to base64 for PDF embedding
    let logoDataUri: string | null = null;
    if (companyInfo.logo) {
      logoDataUri = await imageUrlToBase64(companyInfo.logo.url);
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatCurrency = (amount: number) => {
      return `RM ${amount.toFixed(2)}`;
    };

    const receiptNumber = `RCP-${order.orderNumber.replace('ORD-', '')}`;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tax Receipt - ${receiptNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            line-height: 1.4;
            color: #333;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background: #f9f9f9;
          }
          .receipt {
            background: white;
            padding: 20px;
            border: 2px dashed #666;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #666;
            padding-bottom: 15px;
          }
          .receipt-title {
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 10px 0;
          }
          .company-info {
            font-size: 12px;
            line-height: 1.3;
          }
          .receipt-number {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
            text-align: center;
            background: #f0f0f0;
            padding: 8px;
            border: 1px solid #ccc;
          }
          .customer-info {
            margin: 15px 0;
            padding: 10px 0;
            border-top: 1px dashed #666;
            border-bottom: 1px dashed #666;
          }
          .items-section {
            margin: 15px 0;
          }
          .item {
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
          }
          .item-name {
            font-weight: bold;
          }
          .item-details {
            font-size: 11px;
            display: flex;
            justify-content: space-between;
            margin-top: 3px;
          }
          .totals {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #666;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .total-final {
            font-weight: bold;
            font-size: 16px;
            border-top: 1px solid #666;
            border-bottom: 2px solid #666;
            padding: 8px 0;
            margin: 10px 0;
          }
          .tax-section {
            background: #f8f8f8;
            padding: 10px;
            margin: 15px 0;
            border: 1px solid #ddd;
          }
          .tax-title {
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
            text-transform: uppercase;
            font-size: 14px;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px dashed #666;
            padding-top: 15px;
          }
          .member-badge {
            background-color: #7c3aed;
            color: white;
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: bold;
          }
          @media print {
            body { 
              background: white;
              margin: 0; 
              padding: 10px; 
            }
            .receipt {
              box-shadow: none;
              border: 2px solid #333;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            ${
              logoDataUri && companyInfo.logo
                ? `<img src="${logoDataUri}" alt="${companyInfo.name}" style="max-width: ${companyInfo.logo.width}px; max-height: ${companyInfo.logo.height}px; margin: 0 auto 10px; display: block;" />`
                : ''
            }
            <div class="receipt-title">Tax Receipt</div>
            <div class="company-info">
              <div><strong>${companyInfo.name}</strong></div>
              <div>Reg: ${companyInfo.registrationNo}</div>
              <div>SST: ${companyInfo.sstNo}</div>
              <div>${companyInfo.address}</div>
              <div>${companyInfo.phone}</div>
              <div>${companyInfo.email}</div>
            </div>
          </div>

          <div class="receipt-number">
            ${receiptNumber}
          </div>

          <div style="text-align: center; font-size: 12px; margin: 10px 0;">
            Date: ${formatDate(order.createdAt)}
          </div>

          <div class="customer-info">
            <strong>Customer Details:</strong><br>
            ${customer.firstName || ''} ${customer.lastName || ''}
            ${customer.isMember ? '<span class="member-badge">MEMBER</span>' : ''}<br>
            Email: ${customer.email}<br>
            ${customer.phone ? `Phone: ${customer.phone}<br>` : ''}
            Order: ${order.orderNumber}<br>
            Payment: ${order.paymentMethod}
          </div>

          <div class="items-section">
            <strong>Items Purchased:</strong>
            ${orderItems
              .map(
                item => `
            <div class="item">
              <div class="item-name">${item.productName}</div>
              <div class="item-details">
                <span>${item.quantity} x ${formatCurrency(item.appliedPrice)}</span>
                <span>${formatCurrency(item.totalPrice)}</span>
              </div>
              ${item.productSku ? `<div style="font-size: 10px; color: #666;">SKU: ${item.productSku}</div>` : ''}
            </div>
            `
              )
              .join('')}
          </div>

          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>${formatCurrency(order.subtotal)}</span>
            </div>
            ${
              order.discountAmount > 0
                ? `
            <div class="total-line" style="color: #666;">
              <span>Discount:</span>
              <span>-${formatCurrency(order.discountAmount)}</span>
            </div>
            `
                : ''
            }
            <div class="total-line">
              <span>Shipping:</span>
              <span>${formatCurrency(order.shippingCost)}</span>
            </div>
            <div class="total-line final">
              <span>Total Amount:</span>
              <span>${formatCurrency(order.total)}</span>
            </div>
          </div>

          <div class="tax-section">
            <div class="tax-title">Malaysian Tax Details</div>
            <div class="total-line">
              <span>Taxable Amount:</span>
              <span>${formatCurrency(taxBreakdown.taxableAmount)}</span>
            </div>
            <div class="total-line">
              <span>SST (${taxBreakdown.taxRate}):</span>
              <span>${formatCurrency(taxBreakdown.sstAmount)}</span>
            </div>
            <div class="total-line" style="font-weight: bold;">
              <span>Total Tax:</span>
              <span>${formatCurrency(taxBreakdown.totalTax)}</span>
            </div>
            <div style="font-size: 10px; text-align: center; margin-top: 8px; color: #666;">
              GST Suspended | SST Applicable
            </div>
          </div>

          ${
            shippingAddress
              ? `
          <div style="margin: 15px 0; font-size: 11px; border-top: 1px dashed #666; padding-top: 10px;">
            <strong>Delivery Address:</strong><br>
            ${shippingAddress.firstName} ${shippingAddress.lastName}<br>
            ${shippingAddress.addressLine1}<br>
            ${shippingAddress.addressLine2 ? `${shippingAddress.addressLine2}<br>` : ''}
            ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br>
            ${shippingAddress.country}
          </div>
          `
              : ''
          }

          <div class="footer">
            <p><strong>OFFICIAL TAX RECEIPT</strong></p>
            <p>This receipt is issued for tax purposes and serves as proof of SST payment.</p>
            <p>Please retain this receipt for your records.</p>
            <p style="margin-top: 10px;">
              Generated: ${formatDate(new Date())}<br>
              Status: ${order.paymentStatus}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get tax receipt filename for download
   */
  getTaxReceiptFilename(orderNumber: string): string {
    const date = new Date().toISOString().split('T')[0];
    const receiptNumber = orderNumber.replace('ORD-', 'RCP-');
    return `TaxReceipt_${receiptNumber}_${date}.pdf`;
  }

  /**
   * Generate receipt number from order number
   */
  generateReceiptNumber(orderNumber: string): string {
    return `RCP-${orderNumber.replace('ORD-', '')}`;
  }
}

// Export singleton instance
export const taxReceiptService = new TaxReceiptService();
