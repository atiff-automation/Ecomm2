/**
 * Invoice Generation Service for Malaysian E-commerce
 * Generates PDF invoices with Malaysian tax compliance
 */

import { prisma } from '@/lib/db/prisma';
import { malaysianTaxService } from '@/lib/tax/malaysian-tax';

export interface InvoiceData {
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

export class InvoiceService {
  private readonly COMPANY_INFO = {
    name: process.env.COMPANY_NAME || 'JRM E-commerce Sdn Bhd',
    address: process.env.COMPANY_ADDRESS || 'Kuala Lumpur, Malaysia',
    phone: process.env.COMPANY_PHONE || '+60 3-1234 5678',
    email: process.env.COMPANY_EMAIL || 'info@jrmecommerce.com',
    registrationNo: process.env.COMPANY_REGISTRATION || '202301234567',
    sstNo: process.env.COMPANY_SST_NO || 'A12-3456-78901234',
  };

  /**
   * Get invoice data for an order
   */
  async getInvoiceData(
    orderId: string,
    userId?: string
  ): Promise<InvoiceData | null> {
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

      const invoiceData: InvoiceData = {
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

      return invoiceData;
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      return null;
    }
  }

  /**
   * Generate HTML invoice template
   */
  generateInvoiceHTML(invoiceData: InvoiceData): string {
    const { order, customer, orderItems, shippingAddress, taxBreakdown } =
      invoiceData;

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
        <title>Invoice - ${order.orderNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .invoice-header {
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
          .invoice-details {
            text-align: right;
            flex: 1;
          }
          .invoice-number {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin: 0;
          }
          .invoice-date {
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
            .invoice-header { page-break-after: avoid; }
            .items-table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="company-info">
            <h1>${this.COMPANY_INFO.name}</h1>
            <p>Registration No: ${this.COMPANY_INFO.registrationNo}</p>
            <p>SST No: ${this.COMPANY_INFO.sstNo}</p>
            <p>${this.COMPANY_INFO.address}</p>
            <p>Phone: ${this.COMPANY_INFO.phone}</p>
            <p>Email: ${this.COMPANY_INFO.email}</p>
          </div>
          <div class="invoice-details">
            <div class="invoice-number">INVOICE</div>
            <div class="invoice-number" style="font-size: 18px; margin-top: 5px;">${order.orderNumber}</div>
            <div class="invoice-date">Date: ${formatDate(order.createdAt)}</div>
            <div class="status-badge">${order.paymentStatus}</div>
          </div>
        </div>

        <div class="billing-shipping">
          <div class="address-section">
            <h3>Bill To</h3>
            <p><strong>${customer.firstName || ''} ${customer.lastName || ''}</strong>
            ${customer.isMember ? '<span class="member-badge">MEMBER</span>' : ''}</p>
            <p>Email: ${customer.email}</p>
            ${customer.phone ? `<p>Phone: ${customer.phone}</p>` : ''}
          </div>
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
          <p>• This invoice is computer generated and does not require a physical signature.</p>
          <p>• Payment is due within 30 days from the invoice date.</p>
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
   * Get invoice filename for download
   */
  getInvoiceFilename(orderNumber: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `Invoice_${orderNumber}_${date}.pdf`;
  }

  /**
   * Generate invoice number (for future use)
   */
  generateInvoiceNumber(orderNumber: string): string {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    return `INV-${year}${month.toString().padStart(2, '0')}-${orderNumber}`;
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();
