/**
 * PDF Generation Utility using PDFKit
 * Generates receipts and invoices without requiring browser rendering
 * Eliminates Puppeteer dependency and system library issues
 */

import PDFDocument from 'pdfkit';
import { ReceiptData } from '@/lib/invoices/invoice-service';
import { TaxReceiptData } from '@/lib/receipts/receipt-service';
import { businessProfileService } from '@/lib/receipts/business-profile-service';

/**
 * Format currency to Malaysian Ringgit
 */
function formatCurrency(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

/**
 * Format date to Malaysian locale
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate receipt PDF using PDFKit
 * Simple, clean design inspired by modern SaaS receipts
 */
export async function generateReceiptPDF(
  receiptData: ReceiptData
): Promise<Buffer> {
  // Fetch company info from centralized service
  const companyInfo = await businessProfileService.getLegacyCompanyInfo();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const {
        order,
        customer,
        orderItems,
        shippingAddress,
        billingAddress,
        taxBreakdown,
      } = receiptData;

      // ========== SIMPLE HEADER ==========
      doc
        .fillColor('#000000')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Receipt', 50, 50);

      // Add business logo in top right if available
      if (companyInfo.logo && companyInfo.logo.url) {
        try {
          // Convert relative path to absolute path if needed
          const logoPath = companyInfo.logo.url.startsWith('http')
            ? companyInfo.logo.url
            : `${process.cwd()}/public${companyInfo.logo.url}`;

          doc.image(logoPath, 450, 45, {
            fit: [100, 50],
            align: 'right',
          });
        } catch (error) {
          console.error('Error adding logo to PDF:', error);
          // Continue without logo if there's an error
        }
      }

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Invoice number: ${order.orderNumber}`, { continued: false })
        .text(`Date paid: ${formatDate(order.createdAt)}`)
        .moveDown(1.5);

      // ========== TWO-COLUMN LAYOUT: COMPANY INFO & BILL TO ==========
      const leftColX = 50;
      const rightColX = 320;
      const startY = doc.y;

      // Left column - Company Info
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(companyInfo.name, leftColX, startY, { width: 250 });

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text(companyInfo.address, leftColX, doc.y + 5, { width: 250 })
        .text(companyInfo.phone, leftColX, doc.y + 2, { width: 250 })
        .text(companyInfo.email, leftColX, doc.y + 2, { width: 250 });

      // Right column - Bill To
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Bill to', rightColX, startY);

      if (billingAddress) {
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#666666')
          .text(
            `${billingAddress.firstName} ${billingAddress.lastName}`,
            rightColX,
            startY + 15,
            { width: 225 }
          )
          .text(billingAddress.addressLine1, rightColX, doc.y + 2, { width: 225 });

        if (billingAddress.addressLine2) {
          doc.text(billingAddress.addressLine2, rightColX, doc.y + 2, { width: 225 });
        }

        doc.text(
          `${billingAddress.city}, ${billingAddress.state} ${billingAddress.postalCode}`,
          rightColX,
          doc.y + 2,
          { width: 225 }
        );
      } else {
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#666666')
          .text(
            `${customer.firstName || ''} ${customer.lastName || ''}`,
            rightColX,
            startY + 15,
            { width: 225 }
          )
          .text(customer.email, rightColX, doc.y + 2, { width: 225 });
      }

      // Move down after two-column section
      doc.y = Math.max(doc.y, startY + 100);
      doc.moveDown(2);

      // ========== PAYMENT AMOUNT HIGHLIGHT ==========
      doc
        .fillColor('#000000')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(
          `${formatCurrency(order.total)} paid on ${formatDate(order.createdAt)}`,
          50,
          doc.y
        );

      doc.moveDown(2);

      // ========== SIMPLE TABLE ==========
      const tableTop = doc.y;
      const descCol = 50;
      const qtyCol = 370;
      const priceCol = 430;
      const amountCol = 495;

      // Table header with bottom border
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Description', descCol, tableTop)
        .text('Qty', qtyCol, tableTop, { align: 'right', width: 50 })
        .text('Unit price', priceCol, tableTop, { align: 'right', width: 60 })
        .text('Amount', amountCol, tableTop, { align: 'right', width: 60 });

      // Horizontal line below header
      doc
        .moveTo(50, doc.y + 5)
        .lineTo(555, doc.y + 5)
        .strokeColor('#e0e0e0')
        .lineWidth(1)
        .stroke();

      doc.moveDown(1);

      // Table rows
      orderItems.forEach(item => {
        const itemY = doc.y;

        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#000000')
          .text(item.productName, descCol, itemY, { width: 300 });

        if (item.productSku) {
          doc
            .fontSize(8)
            .fillColor('#666666')
            .text(item.productSku, descCol, doc.y + 3);
        }

        doc
          .fontSize(9)
          .fillColor('#000000')
          .text(item.quantity.toString(), qtyCol, itemY, {
            align: 'right',
            width: 50,
          })
          .text(formatCurrency(item.appliedPrice), priceCol, itemY, {
            align: 'right',
            width: 60,
          })
          .text(formatCurrency(item.totalPrice), amountCol, itemY, {
            align: 'right',
            width: 60,
          });

        doc.moveDown(1.2);
      });

      doc.moveDown(1);

      // ========== TOTALS SECTION ==========
      const totalsX = 380;
      const totalsValueX = 495;

      // Subtotal
      let totalLineY = doc.y;
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Subtotal', totalsX, totalLineY);
      doc
        .fillColor('#000000')
        .text(formatCurrency(order.subtotal), totalsValueX, totalLineY, {
          align: 'right',
          width: 60,
        });

      doc.moveDown(0.5);

      // Discount (if applicable)
      if (order.discountAmount > 0) {
        totalLineY = doc.y;
        doc
          .fillColor('#666666')
          .text('Discount', totalsX, totalLineY);
        doc
          .fillColor('#000000')
          .text(`-${formatCurrency(order.discountAmount)}`, totalsValueX, totalLineY, {
            align: 'right',
            width: 60,
          });
        doc.moveDown(0.5);
      }

      // Shipping
      totalLineY = doc.y;
      doc.fillColor('#666666').text('Shipping', totalsX, totalLineY);
      doc
        .fillColor('#000000')
        .text(formatCurrency(order.shippingCost), totalsValueX, totalLineY, {
          align: 'right',
          width: 60,
        });

      doc.moveDown(0.5);

      // Tax
      totalLineY = doc.y;
      doc.fillColor('#666666').text('Tax (SST 6%)', totalsX, totalLineY);
      doc
        .fillColor('#000000')
        .text(formatCurrency(order.taxAmount), totalsValueX, totalLineY, {
          align: 'right',
          width: 60,
        });

      doc.moveDown(1);

      // Horizontal line before total
      doc
        .moveTo(totalsX, doc.y)
        .lineTo(555, doc.y)
        .strokeColor('#000000')
        .lineWidth(1)
        .stroke();

      doc.moveDown(0.5);

      // Grand Total
      totalLineY = doc.y;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Total', totalsX, totalLineY);
      doc
        .fontSize(11)
        .text(formatCurrency(order.total), totalsValueX, totalLineY, {
          align: 'right',
          width: 60,
        });

      doc.moveDown(0.5);

      // Amount Paid
      totalLineY = doc.y;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Amount paid', totalsX, totalLineY);
      doc
        .fontSize(11)
        .text(formatCurrency(order.total), totalsValueX, totalLineY, {
          align: 'right',
          width: 60,
        });

      doc.moveDown(2);

      // ========== PAYMENT HISTORY TABLE ==========
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Payment history', 50, doc.y);

      doc.moveDown(1);

      const paymentTableY = doc.y;

      // Payment table header
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Payment method', 50, paymentTableY)
        .text('Date', 220, paymentTableY)
        .text('Amount paid', 370, paymentTableY)
        .text('Receipt number', 470, paymentTableY);

      // Horizontal line below header
      doc
        .moveTo(50, doc.y + 5)
        .lineTo(555, doc.y + 5)
        .strokeColor('#e0e0e0')
        .lineWidth(1)
        .stroke();

      doc.moveDown(1);

      // Payment row
      const paymentMethod =
        order.paymentMethod === 'ONLINE_BANKING'
          ? 'Online Banking'
          : order.paymentMethod;

      const paymentRowY = doc.y;
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(paymentMethod, 50, paymentRowY)
        .text(formatDate(order.createdAt), 220, paymentRowY)
        .text(formatCurrency(order.total), 370, paymentRowY)
        .text(order.orderNumber, 470, paymentRowY);

      doc.moveDown(3);

      // ========== FOOTER ==========
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text(
          `Your order with ${companyInfo.name} is complete.`,
          50,
          doc.y,
          { align: 'left', width: 505 }
        );

      if (shippingAddress) {
        doc
          .moveDown(0.5)
          .text(
            `Shipping to: ${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`,
            50,
            doc.y,
            { align: 'left', width: 505 }
          );
      }

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate tax receipt PDF using PDFKit
 * Generates Malaysian tax-compliant tax receipts
 */
export async function generateTaxReceiptPDF(
  receiptData: TaxReceiptData
): Promise<Buffer> {
  // Fetch company info from centralized service
  const companyInfo = await businessProfileService.getLegacyCompanyInfo();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const { order, customer, orderItems, taxBreakdown } = receiptData;

      const receiptNumber = `RCP-${order.orderNumber.replace('ORD-', '')}`;

      // ========== HEADER ==========
      doc.fontSize(20).font('Helvetica-Bold').text('TAX RECEIPT', {
        align: 'center',
      });

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(receiptNumber, { align: 'center' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Date: ${formatDate(order.createdAt)}`, { align: 'center' })
        .text('Malaysian Tax Compliance Document', { align: 'center' });

      doc
        .moveTo(30, doc.y + 5)
        .lineTo(565, doc.y + 5)
        .stroke();
      doc.moveDown();

      // ========== COMPANY INFO ==========
      doc.fontSize(10).font('Helvetica-Bold').text(companyInfo.name);

      doc
        .fontSize(9)
        .font('Helvetica')
        .text('Reg: ' + companyInfo.registrationNo)
        .text('SST: ' + companyInfo.sstNo)
        .text(companyInfo.address)
        .text('Phone: ' + companyInfo.phone)
        .text('Email: ' + companyInfo.email);

      doc.moveDown();

      // ========== CUSTOMER INFO ==========
      doc.fontSize(10).font('Helvetica-Bold').text('Customer Details:');

      doc.fontSize(9).font('Helvetica');
      doc.text(
        `${customer.firstName || ''} ${customer.lastName || ''}${customer.isMember ? ' [MEMBER]' : ''}`
      );
      doc.text(`Email: ${customer.email}`);
      if (customer.phone) {
        doc.text(`Phone: ${customer.phone}`);
      }
      doc.text(`Order: ${order.orderNumber}`);

      doc.moveDown();

      // ========== ITEMS ==========
      doc.fontSize(10).font('Helvetica-Bold').text('Items Purchased:');
      doc.fontSize(9).font('Helvetica');

      orderItems.forEach(item => {
        doc.text(
          `• ${item.productName}${item.productSku ? ` (SKU: ${item.productSku})` : ''}`
        );
        doc.text(
          `  ${item.quantity} × ${formatCurrency(item.appliedPrice)} = ${formatCurrency(item.totalPrice)}`,
          { indent: 20 }
        );
      });

      doc.moveDown();

      // ========== TOTALS ==========
      const totalStartX = 350;

      doc.fontSize(9).font('Helvetica');
      doc.text(`Subtotal: ${formatCurrency(order.subtotal)}`, totalStartX);
      if (order.discountAmount > 0) {
        doc.text(
          `Discount: -${formatCurrency(order.discountAmount)}`,
          totalStartX
        );
      }
      doc.text(`Shipping: ${formatCurrency(order.shippingCost)}`, totalStartX);

      doc
        .moveTo(totalStartX - 10, doc.y)
        .lineTo(595, doc.y)
        .stroke();

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`TOTAL: ${formatCurrency(order.total)}`, totalStartX);

      doc.moveDown();

      // ========== TAX SECTION ==========
      doc.rect(30, doc.y, 535, 2).fillAndStroke('#2563eb');

      doc.moveDown();

      doc.fontSize(11).font('Helvetica-Bold').text('Malaysian Tax Details');

      doc.fontSize(9).font('Helvetica');

      const taxStartX = 50;

      doc.text(
        `Taxable Amount: ${formatCurrency(taxBreakdown.taxableAmount)}`,
        taxStartX
      );
      doc.text(
        `SST (${taxBreakdown.taxRate}): ${formatCurrency(taxBreakdown.sstAmount)}`,
        taxStartX
      );
      doc.text(
        `GST: ${formatCurrency(taxBreakdown.gstAmount)} (Suspended)`,
        taxStartX
      );

      doc
        .moveTo(taxStartX - 10, doc.y)
        .lineTo(545, doc.y)
        .stroke();

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Total Tax: ${formatCurrency(taxBreakdown.totalTax)}`, taxStartX);

      doc.moveDown(2);

      // ========== FOOTER ==========
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text('This is an official tax receipt for Malaysian tax purposes.', {
          align: 'center',
        })
        .text(
          'GST is suspended in Malaysia. SST (Sales and Service Tax) is applicable.',
          { align: 'center' }
        )
        .text(
          'Please retain this receipt for your tax records and warranty purposes.',
          { align: 'center' }
        )
        .text(`Generated: ${formatDate(new Date())}`, { align: 'center' });

      // Finalize
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
