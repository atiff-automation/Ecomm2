/**
 * Receipt Generation Service for Malaysian E-commerce
 * Generates PDF receipts with Malaysian tax compliance
 */

import { prisma } from '@/lib/db/prisma';
import { malaysianTaxService } from '@/lib/tax/malaysian-tax';
import { businessProfileService } from '@/lib/receipts/business-profile-service';
import { siteCustomizationService } from '@/lib/services/site-customization.service';
import { imageUrlToBase64 } from '@/lib/utils/image-utils';

export interface ReceiptData {
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
  taxBreakdown?: {
    taxableAmount: number;
    sstAmount: number;
    gstAmount: number;
    totalTax: number;
  };
}

export class ReceiptService {
  /**
   * Get company info with logo from site customization
   * Falls back to business profile if site customization doesn't have a logo
   */
  private async getCompanyInfo() {
    // Get business profile info (company name, address, etc.)
    const businessInfo = await businessProfileService.getLegacyCompanyInfo();

    // Get logo from site customization
    const siteCustomization = await siteCustomizationService.getConfiguration();

    // Use site customization logo if available, otherwise use business profile logo
    const logo = siteCustomization.branding?.logo || businessInfo.logo;

    console.log('📋 Company Info Source:');
    console.log('- Using site customization logo:', !!siteCustomization.branding?.logo);
    console.log('- Fallback to business profile logo:', !siteCustomization.branding?.logo && !!businessInfo.logo);

    return {
      ...businessInfo,
      logo: logo
    };
  }

  /**
   * Get receipt data for an order
   */
  async getReceiptData(
    orderId: string,
    userId?: string
  ): Promise<ReceiptData | null> {
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

      const receiptData: ReceiptData = {
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
        },
      };

      return receiptData;
    } catch (error) {
      console.error('Error fetching receipt data:', error);
      return null;
    }
  }

  /**
   * Generate HTML receipt template
   */
  async generateReceiptHTML(receiptData: ReceiptData): Promise<string> {
    const { order, customer, orderItems, shippingAddress, billingAddress, taxBreakdown } =
      receiptData;

    // Get company info from business profile
    const companyInfo = await this.getCompanyInfo();

    // Convert logo to base64 for PDF embedding
    let logoDataUri: string | null = null;
    if (companyInfo.logo) {
      logoDataUri = await imageUrlToBase64(companyInfo.logo.url);
    }

    // Debug logging
    console.log('📄 Invoice Generation Debug:');
    console.log('- Has billingAddress:', !!billingAddress);
    console.log('- Has logo:', !!companyInfo.logo);
    console.log('- Logo converted to base64:', !!logoDataUri);
    if (companyInfo.logo) {
      console.log('- Logo URL:', companyInfo.logo.url);
      console.log('- Logo dimensions:', `${companyInfo.logo.width}x${companyInfo.logo.height}`);
    }
    if (billingAddress) {
      console.log('- Billing address:', `${billingAddress.firstName} ${billingAddress.lastName}, ${billingAddress.city}`);
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

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt - ${order.orderNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .receipt-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
          }
          .company-info {
            flex: 1;
          }
          .company-info h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .company-info p {
            margin: 2px 0;
            font-size: 14px;
            color: #666;
          }
          .receipt-details {
            text-align: right;
            flex: 1;
          }
          .receipt-number {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin: 0;
          }
          .receipt-date {
            font-size: 14px;
            color: #666;
            margin: 5px 0;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            background-color: #10b981;
            color: white;
            margin-top: 10px;
          }
          .billing-shipping {
            display: flex;
            gap: 40px;
            margin: 30px 0;
          }
          .address-section {
            flex: 1;
          }
          .address-section h3 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 16px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .address-section p {
            margin: 2px 0;
            font-size: 14px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
          }
          .items-table th,
          .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          .items-table th {
            background-color: #f8fafc;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .items-table td {
            font-size: 14px;
          }
          .text-right {
            text-align: right;
          }
          .total-section {
            margin-top: 30px;
            border-top: 2px solid #e5e7eb;
            padding-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          .total-row.final {
            border-top: 1px solid #e5e7eb;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
          }
          .tax-details {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .tax-details h4 {
            margin: 0 0 15px 0;
            color: #374151;
            font-size: 16px;
          }
          .tax-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 14px;
          }
          .footer-notes {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #666;
          }
          .member-badge {
            background-color: #7c3aed;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .receipt-header { page-break-after: avoid; }
            .items-table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <div class="company-info">
            ${
              logoDataUri && companyInfo.logo
                ? `<img src="${logoDataUri}" alt="${companyInfo.name}" style="max-width: ${companyInfo.logo.width}px; max-height: ${companyInfo.logo.height}px; margin-bottom: 10px;" />`
                : ''
            }
            <h1>${companyInfo.name}</h1>
            <p>Registration No: ${companyInfo.registrationNo}</p>
            <p>SST No: ${companyInfo.sstNo}</p>
            <p>${companyInfo.address}</p>
            <p>Phone: ${companyInfo.phone}</p>
            <p>Email: ${companyInfo.email}</p>
          </div>
          <div class="receipt-details">
            <div class="receipt-number">RECEIPT</div>
            <div class="receipt-number" style="font-size: 18px; margin-top: 5px;">${order.orderNumber}</div>
            <div class="receipt-date">Date: ${formatDate(order.createdAt)}</div>
            <div class="status-badge">${order.paymentStatus}</div>
          </div>
        </div>

        <div class="billing-shipping">
          ${
            billingAddress
              ? `
          <div class="address-section">
            <h3>Bill To</h3>
            <p><strong>${billingAddress.firstName} ${billingAddress.lastName}</strong>
            ${customer.isMember ? '<span class="member-badge">MEMBER</span>' : ''}</p>
            <p>${billingAddress.addressLine1}</p>
            ${billingAddress.addressLine2 ? `<p>${billingAddress.addressLine2}</p>` : ''}
            <p>${billingAddress.city}, ${billingAddress.state} ${billingAddress.postalCode}</p>
            <p>${billingAddress.country}</p>
            <p>Email: ${customer.email}</p>
            ${billingAddress.phone ? `<p>Phone: ${billingAddress.phone}</p>` : ''}
          </div>
          `
              : `
          <div class="address-section">
            <h3>Bill To</h3>
            <p><strong>${customer.firstName || ''} ${customer.lastName || ''}</strong>
            ${customer.isMember ? '<span class="member-badge">MEMBER</span>' : ''}</p>
            <p>Email: ${customer.email}</p>
            ${customer.phone ? `<p>Phone: ${customer.phone}</p>` : ''}
          </div>
          `
          }
          ${
            shippingAddress
              ? `
          <div class="address-section">
            <h3>Ship To</h3>
            <p><strong>${shippingAddress.firstName} ${shippingAddress.lastName}</strong></p>
            <p>${shippingAddress.addressLine1}</p>
            ${shippingAddress.addressLine2 ? `<p>${shippingAddress.addressLine2}</p>` : ''}
            <p>${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}</p>
            <p>${shippingAddress.country}</p>
            ${shippingAddress.phone ? `<p>Phone: ${shippingAddress.phone}</p>` : ''}
          </div>
          `
              : ''
          }
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems
              .map(
                item => `
            <tr>
              <td>
                <strong>${item.productName}</strong>
                ${item.productSku ? `<br><small>SKU: ${item.productSku}</small>` : ''}
                ${
                  customer.isMember && item.appliedPrice !== item.regularPrice
                    ? `<br><small style="color: #7c3aed;">Member Price Applied</small>`
                    : ''
                }
              </td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.appliedPrice)}</td>
              <td class="text-right"><strong>${formatCurrency(item.totalPrice)}</strong></td>
            </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(order.subtotal)}</span>
          </div>
          ${
            order.discountAmount > 0
              ? `
          <div class="total-row" style="color: #10b981;">
            <span>Discount:</span>
            <span>-${formatCurrency(order.discountAmount)}</span>
          </div>
          `
              : ''
          }
          <div class="total-row">
            <span>Shipping:</span>
            <span>${formatCurrency(order.shippingCost)}</span>
          </div>
          <div class="total-row">
            <span>Tax (SST 6%):</span>
            <span>${formatCurrency(order.taxAmount)}</span>
          </div>
          <div class="total-row final">
            <span>Total Amount:</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
        </div>

        ${
          taxBreakdown
            ? `
        <div class="tax-details">
          <h4>Tax Breakdown</h4>
          <div class="tax-row">
            <span>Taxable Amount:</span>
            <span>${formatCurrency(taxBreakdown.taxableAmount)}</span>
          </div>
          <div class="tax-row">
            <span>SST (6%):</span>
            <span>${formatCurrency(taxBreakdown.sstAmount)}</span>
          </div>
          <div class="tax-row">
            <span><strong>Total Tax:</strong></span>
            <span><strong>${formatCurrency(taxBreakdown.totalTax)}</strong></span>
          </div>
        </div>
        `
            : ''
        }

        <div class="footer-notes">
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          ${order.customerNotes ? `<p><strong>Notes:</strong> ${order.customerNotes}</p>` : ''}
          <br>
          <p><strong>Terms & Conditions:</strong></p>
          <p>• This receipt is computer generated and does not require a physical signature.</p>
          <p>• Payment has been successfully completed for this order.</p>
          <p>• Goods sold are not returnable unless defective.</p>
          <p>• All prices include applicable taxes as per Malaysian tax regulations.</p>
          <br>
          <p style="text-align: center; color: #666;">
            Thank you for your business!<br>
            Generated on ${formatDate(new Date())}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get receipt filename for download
   */
  getReceiptFilename(orderNumber: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `Receipt_${orderNumber}_${date}.pdf`;
  }

  /**
   * Generate receipt number (for future use)
   */
  generateReceiptNumber(orderNumber: string): string {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    return `INV-${year}${month.toString().padStart(2, '0')}-${orderNumber}`;
  }
}

// Export singleton instance
export const receiptService = new ReceiptService();

// Keep backward compatibility
export const invoiceService = receiptService;
