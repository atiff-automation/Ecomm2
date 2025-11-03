/**
 * PDF Generation Utility using PDFKit
 * Generates receipts and invoices without requiring browser rendering
 * Eliminates Puppeteer dependency and system library issues
 */

import PDFDocument from 'pdfkit';
import { ReceiptData } from '@/lib/invoices/invoice-service';
import { TaxReceiptData } from '@/lib/receipts/receipt-service';

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
 * Generates professional receipt/invoice PDF without browser rendering
 */
export function generateReceiptPDF(receiptData: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
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

      // ========== HEADER SECTION ==========
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('RECEIPT', { align: 'center' });

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(order.orderNumber, { align: 'center' })
        .fontSize(10)
        .font('Helvetica')
        .text(`Date: ${formatDate(order.createdAt)}`, { align: 'center' })
        .text(`Status: ${order.paymentStatus}`, { align: 'center' });

      doc
        .moveTo(40, doc.y + 5)
        .lineTo(555, doc.y + 5)
        .stroke();
      doc.moveDown();

      // ========== COMPANY INFO ==========
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('JRM E-commerce Sdn Bhd', 40, doc.y);
      doc
        .fontSize(9)
        .font('Helvetica')
        .text('Reg: ' + (process.env.COMPANY_REGISTRATION || '202301234567'))
        .text('SST: ' + (process.env.COMPANY_SST_NO || 'A12-3456-78901234'))
        .text(process.env.COMPANY_ADDRESS || 'Kuala Lumpur, Malaysia')
        .text('Phone: ' + (process.env.COMPANY_PHONE || '+60 3-1234 5678'))
        .text(
          'Email: ' + (process.env.COMPANY_EMAIL || 'info@jrmecommerce.com')
        );

      doc.moveDown();

      // ========== BILLING & SHIPPING SECTION ==========
      const y = doc.y;

      // Billing Address
      doc.fontSize(10).font('Helvetica-Bold').text('BILL TO:', 40, y);

      if (billingAddress) {
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(
            `${billingAddress.firstName} ${billingAddress.lastName}`,
            40,
            doc.y
          )
          .text(billingAddress.addressLine1)
          .text(
            billingAddress.addressLine2 || '',
            billingAddress.addressLine2 ? {} : { height: 0 }
          )
          .text(
            `${billingAddress.city}, ${billingAddress.state} ${billingAddress.postalCode}`
          )
          .text(billingAddress.country);
      } else {
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(`${customer.firstName || ''} ${customer.lastName || ''}`, 40)
          .text(`Email: ${customer.email}`)
          .text(customer.phone ? `Phone: ${customer.phone}` : '');
      }

      // Shipping Address (on right side)
      if (shippingAddress) {
        const shippingY = y;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('SHIP TO:', 320, shippingY);

        doc
          .fontSize(9)
          .font('Helvetica')
          .text(
            `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            320,
            doc.y
          )
          .text(shippingAddress.addressLine1)
          .text(
            shippingAddress.addressLine2 || '',
            shippingAddress.addressLine2 ? {} : { height: 0 }
          )
          .text(
            `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`
          )
          .text(shippingAddress.country);
      }

      doc.moveDown();

      // ========== ITEMS TABLE ==========
      const tableTop = doc.y + 10;
      const col1 = 40;
      const col2 = 380;
      const col3 = 450;
      const col4 = 540;
      const rowHeight = 20;

      // Table header
      doc.rect(col1 - 5, tableTop, 510, rowHeight).fillAndStroke('#f0f0f0');
      doc.fillColor('#000000');

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Item Description', col1, tableTop + 5)
        .text('Qty', col2, tableTop + 5, { width: 60, align: 'right' })
        .text('Price', col3, tableTop + 5, { width: 60, align: 'right' })
        .text('Total', col4, tableTop + 5, { width: 60, align: 'right' });

      let tableY = tableTop + rowHeight;

      // Table rows
      doc.fontSize(9).font('Helvetica');

      orderItems.forEach(item => {
        // Draw row separator
        doc
          .moveTo(col1 - 5, tableY)
          .lineTo(col4 + 60, tableY)
          .stroke();

        const itemText = `${item.productName}${item.productSku ? ` (SKU: ${item.productSku})` : ''}`;

        // Check if we need a new page
        if (tableY + rowHeight > 750) {
          doc.addPage();
          tableY = 40;
        }

        doc
          .text(itemText, col1, tableY + 5, { width: 340, fontSize: 9 })
          .text(item.quantity.toString(), col2, tableY + 5, {
            width: 60,
            align: 'right',
          })
          .text(formatCurrency(item.appliedPrice), col3, tableY + 5, {
            width: 60,
            align: 'right',
          })
          .text(formatCurrency(item.totalPrice), col4, tableY + 5, {
            width: 60,
            align: 'right',
          });

        tableY += rowHeight;
      });

      // Final table border
      doc
        .moveTo(col1 - 5, tableY)
        .lineTo(col4 + 60, tableY)
        .stroke();

      tableY += 10;

      // ========== TOTALS SECTION ==========
      const totalRowY = tableY;
      const totalLabelX = col3 - 5;

      doc.fontSize(9).font('Helvetica');

      doc.text('Subtotal:', totalLabelX, totalRowY, {
        width: 60,
        align: 'right',
      });
      doc.text(formatCurrency(order.subtotal), col4, totalRowY, {
        width: 60,
        align: 'right',
      });

      let currentY = totalRowY + rowHeight;

      if (order.discountAmount > 0) {
        doc
          .fillColor('#10b981')
          .text('Discount:', totalLabelX, currentY, {
            width: 60,
            align: 'right',
          })
          .fillColor('#000000')
          .text(`-${formatCurrency(order.discountAmount)}`, col4, currentY, {
            width: 60,
            align: 'right',
          });
        currentY += rowHeight;
      }

      doc.text('Shipping:', totalLabelX, currentY, {
        width: 60,
        align: 'right',
      });
      doc.text(formatCurrency(order.shippingCost), col4, currentY, {
        width: 60,
        align: 'right',
      });

      currentY += rowHeight;

      doc.text('Tax (SST 6%):', totalLabelX, currentY, {
        width: 60,
        align: 'right',
      });
      doc.text(formatCurrency(order.taxAmount), col4, currentY, {
        width: 60,
        align: 'right',
      });

      currentY += rowHeight + 5;

      // Total border
      doc
        .moveTo(totalLabelX, currentY)
        .lineTo(col4 + 60, currentY)
        .stroke();

      currentY += 8;

      // Grand total
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('TOTAL:', totalLabelX, currentY, { width: 60, align: 'right' })
        .text(formatCurrency(order.total), col4, currentY, {
          width: 60,
          align: 'right',
        });

      doc.moveDown(3);

      // ========== TAX BREAKDOWN SECTION ==========
      if (taxBreakdown) {
        doc.rect(40, doc.y, 515, 2).fillAndStroke('#e5e7eb');

        doc.moveDown();

        doc.fontSize(10).font('Helvetica-Bold').text('Tax Breakdown', 40);

        doc.fontSize(9).font('Helvetica');

        const taxLabelX = 40;
        const taxValueX = col4;

        doc.text('Taxable Amount:', taxLabelX, doc.y, {
          width: taxValueX - taxLabelX - 10,
          align: 'left',
        });
        doc.text(
          formatCurrency(taxBreakdown.taxableAmount),
          taxValueX,
          doc.y - (doc.heightOfString('Taxable Amount:') || 0),
          { width: 60, align: 'right' }
        );

        doc.moveDown();

        doc.text('SST (6%):', taxLabelX, doc.y, {
          width: taxValueX - taxLabelX - 10,
          align: 'left',
        });
        doc.text(
          formatCurrency(taxBreakdown.sstAmount),
          taxValueX,
          doc.y - (doc.heightOfString('SST (6%):') || 0),
          { width: 60, align: 'right' }
        );

        doc.moveDown();

        doc.text('Total Tax:', taxLabelX, doc.y, {
          width: taxValueX - taxLabelX - 10,
          align: 'left',
        });
        doc.text(
          formatCurrency(taxBreakdown.totalTax),
          taxValueX,
          doc.y - (doc.heightOfString('Total Tax:') || 0),
          { width: 60, align: 'right' }
        );

        doc.moveDown();
      }

      // ========== FOOTER SECTION ==========
      doc.moveDown(2);
      doc.rect(40, doc.y, 515, 2).fillAndStroke('#e5e7eb');

      doc.moveDown();

      doc.fontSize(9).font('Helvetica-Bold').text('Payment Information', 40);

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`Payment Method: ${order.paymentMethod}`)
        .text(`Status: ${order.paymentStatus}`)
        .text(`Order Date: ${formatDate(order.createdAt)}`);

      if (order.customerNotes) {
        doc.moveDown();
        doc.fontSize(9).font('Helvetica-Bold').text('Notes:');
        doc.fontSize(9).font('Helvetica').text(order.customerNotes);
      }

      doc.moveDown(2);

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text(
          'This receipt is computer generated and does not require a physical signature.',
          { align: 'center' }
        )
        .text(
          'Thank you for your business! Please retain this receipt for your records.',
          { align: 'center' }
        );

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
export function generateTaxReceiptPDF(
  receiptData: TaxReceiptData
): Promise<Buffer> {
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
      doc.fontSize(10).font('Helvetica-Bold').text('JRM E-commerce Sdn Bhd');

      doc
        .fontSize(9)
        .font('Helvetica')
        .text('Reg: ' + (process.env.COMPANY_REGISTRATION || '202301234567'))
        .text('SST: ' + (process.env.COMPANY_SST_NO || 'A12-3456-78901234'))
        .text(process.env.COMPANY_ADDRESS || 'Kuala Lumpur, Malaysia')
        .text('Phone: ' + (process.env.COMPANY_PHONE || '+60 3-1234 5678'))
        .text(
          'Email: ' + (process.env.COMPANY_EMAIL || 'info@jrmecommerce.com')
        );

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
