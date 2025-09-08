/**
 * Template Engine for Receipt Rendering
 * Centralized template rendering system with variable injection and compilation
 */

import { ReceiptTemplate, TemplateRenderOptions, ReceiptTemplateContent } from '@/types/receipt-templates';
import { TaxReceiptData } from './receipt-service';
import { businessProfileService } from './business-profile-service';

export class TemplateEngine {
  /**
   * Get company info from business profile
   */
  private async getCompanyInfo() {
    return await businessProfileService.getLegacyCompanyInfo();
  }

  /**
   * Render template with receipt data
   */
  async renderTemplate(
    template: ReceiptTemplate,
    receiptData: TaxReceiptData,
    options: TemplateRenderOptions = {
      format: 'html',
      includeStyles: true,
      inlineStyles: true
    }
  ): Promise<string> {
    try {
      const { templateContent } = template;
      
      switch (templateContent.templateType) {
        case 'THERMAL_RECEIPT':
          return await this.renderThermalReceipt(templateContent, receiptData, options);
        case 'BUSINESS_INVOICE':
          return await this.renderBusinessInvoice(templateContent, receiptData, options);
        case 'MINIMAL_RECEIPT':
          return this.renderMinimalReceipt(templateContent, receiptData, options);
        case 'DETAILED_INVOICE':
          return await this.renderDetailedInvoice(templateContent, receiptData, options);
        default:
          throw new Error(`Unsupported template type: ${templateContent.templateType}`);
      }
    } catch (error) {
      console.error('Template rendering error:', error);
      throw new Error('Failed to render template');
    }
  }

  /**
   * Render Thermal Receipt Template
   */
  private async renderThermalReceipt(
    config: ReceiptTemplateContent,
    data: TaxReceiptData,
    options: TemplateRenderOptions
  ): Promise<string> {
    const { order, customer, orderItems, shippingAddress, taxBreakdown } = data;
    const receiptNumber = `RCP-${order.orderNumber.replace('ORD-', '')}`;
    
    const styles = this.generateThermalStyles(config);
    
    const headerHtml = config.sections.header.enabled ? await this.renderThermalHeader(config, receiptNumber) : '';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt - ${receiptNumber}</title>
        ${options.includeStyles ? `<style>${styles}</style>` : ''}
      </head>
      <body>
        <div class="receipt thermal-receipt">
          ${headerHtml}
          
          <div class="customer-info">
            <strong>Customer:</strong><br>
            ${customer.firstName || ''} ${customer.lastName || ''}
            ${customer.isMember ? '<span class="member-badge">MEMBER</span>' : ''}<br>
            ${customer.email}<br>
            ${customer.phone ? `${customer.phone}<br>` : ''}
            Order: ${order.orderNumber}<br>
            Payment: ${order.paymentMethod || 'N/A'}
          </div>

          ${config.sections.items.enabled ? this.renderThermalItems(config, orderItems) : ''}
          ${config.sections.totals.enabled ? this.renderThermalTotals(config, order, taxBreakdown) : ''}
          ${shippingAddress && this.renderThermalShipping(config, shippingAddress)}
          ${config.sections.footer.enabled ? this.renderThermalFooter(config) : ''}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Render Business Invoice Template
   */
  private async renderBusinessInvoice(
    config: ReceiptTemplateContent,
    data: TaxReceiptData,
    options: TemplateRenderOptions
  ): Promise<string> {
    const { order, customer, orderItems, shippingAddress, billingAddress, taxBreakdown } = data;
    const invoiceNumber = `INV-${order.orderNumber.replace('ORD-', '')}`;
    
    const styles = this.generateBusinessStyles(config);
    
    const headerHtml = config.sections.header.enabled ? await this.renderBusinessHeader(config, invoiceNumber) : '';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${invoiceNumber}</title>
        ${options.includeStyles ? `<style>${styles}</style>` : ''}
      </head>
      <body>
        <div class="invoice business-invoice">
          ${headerHtml}
          
          <div class="invoice-details">
            <div class="customer-section">
              <h3>Bill To:</h3>
              <div class="customer-info">
                ${customer.firstName || ''} ${customer.lastName || ''}
                ${customer.isMember ? '<span class="member-badge">MEMBER</span>' : ''}<br>
                ${customer.email}<br>
                ${customer.phone ? `${customer.phone}<br>` : ''}
                ${billingAddress ? this.renderAddress(billingAddress) : ''}
              </div>
            </div>
            
            ${shippingAddress ? `
            <div class="shipping-section">
              <h3>Ship To:</h3>
              <div class="shipping-info">
                ${this.renderAddress(shippingAddress)}
              </div>
            </div>
            ` : ''}
          </div>

          ${config.sections.items.enabled ? this.renderBusinessItems(config, orderItems) : ''}
          ${config.sections.totals.enabled ? this.renderBusinessTotals(config, order, taxBreakdown) : ''}
          ${config.sections.footer.enabled ? this.renderBusinessFooter(config) : ''}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Render Minimal Receipt Template
   */
  private renderMinimalReceipt(
    config: ReceiptTemplateContent,
    data: TaxReceiptData,
    options: TemplateRenderOptions
  ): string {
    const { order, customer, orderItems, taxBreakdown } = data;
    const receiptNumber = `RCP-${order.orderNumber.replace('ORD-', '')}`;
    
    const styles = this.generateMinimalStyles(config);
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt - ${receiptNumber}</title>
        ${options.includeStyles ? `<style>${styles}</style>` : ''}
      </head>
      <body>
        <div class="receipt minimal-receipt">
          ${config.sections.header.enabled ? this.renderMinimalHeader(config, receiptNumber) : ''}
          
          <div class="customer-section">
            <p><strong>${customer.firstName || ''} ${customer.lastName || ''}</strong></p>
            <p>${customer.email}</p>
            <p>Order: ${order.orderNumber} | ${this.formatDate(order.createdAt)}</p>
          </div>

          ${config.sections.items.enabled ? this.renderMinimalItems(config, orderItems) : ''}
          ${config.sections.totals.enabled ? this.renderMinimalTotals(config, order) : ''}
          ${config.sections.footer.enabled ? this.renderMinimalFooter(config) : ''}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Render Detailed Invoice Template
   */
  private async renderDetailedInvoice(
    config: ReceiptTemplateContent,
    data: TaxReceiptData,
    options: TemplateRenderOptions
  ): Promise<string> {
    const { order, customer, orderItems, shippingAddress, billingAddress, taxBreakdown } = data;
    const invoiceNumber = `INV-${order.orderNumber.replace('ORD-', '')}`;
    
    const styles = this.generateDetailedStyles(config);
    
    const headerHtml = config.sections.header.enabled ? await this.renderDetailedHeader(config, invoiceNumber) : '';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${invoiceNumber}</title>
        ${options.includeStyles ? `<style>${styles}</style>` : ''}
      </head>
      <body>
        <div class="invoice detailed-invoice">
          ${headerHtml}
          
          <div class="invoice-meta">
            <div class="invoice-info">
              <h3>Invoice Details</h3>
              <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
              <p><strong>Date:</strong> ${this.formatDate(order.createdAt)}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
              <p><strong>Status:</strong> ${order.paymentStatus}</p>
            </div>
          </div>

          <div class="parties">
            <div class="customer-details">
              <h3>Bill To:</h3>
              <div class="customer-info">
                ${customer.firstName || ''} ${customer.lastName || ''}
                ${customer.isMember ? '<span class="member-badge">MEMBER</span>' : ''}<br>
                ${customer.email}<br>
                ${customer.phone ? `${customer.phone}<br>` : ''}
                ${billingAddress ? this.renderAddress(billingAddress) : ''}
              </div>
            </div>
            
            ${shippingAddress ? `
            <div class="shipping-details">
              <h3>Ship To:</h3>
              <div class="shipping-info">
                ${this.renderAddress(shippingAddress)}
              </div>
            </div>
            ` : ''}
          </div>

          ${config.sections.items.enabled ? this.renderDetailedItems(config, orderItems) : ''}
          ${config.sections.totals.enabled ? this.renderDetailedTotals(config, order, taxBreakdown) : ''}
          ${config.sections.footer.enabled ? this.renderDetailedFooter(config) : ''}
        </div>
      </body>
      </html>
    `;
  }

  // Style generators for each template type
  private generateThermalStyles(config: ReceiptTemplateContent): string {
    const { colors, typography, layout } = config;
    
    return `
      body {
        font-family: ${typography.fontFamily};
        font-size: ${typography.fontSize.normal}px;
        line-height: 1.4;
        color: ${colors.text};
        margin: 0;
        padding: 0;
        background: ${colors.background};
      }
      
      .thermal-receipt {
        max-width: ${layout.width || 400}px;
        margin: 0 auto;
        padding: ${layout.margins.top}px ${layout.margins.right}px ${layout.margins.bottom}px ${layout.margins.left}px;
        background: white;
        border: 2px dashed ${colors.primary};
      }
      
      .receipt-header {
        text-align: center;
        border-bottom: 1px solid ${colors.primary};
        padding-bottom: 15px;
        margin-bottom: 20px;
      }
      
      .receipt-title {
        font-size: ${typography.fontSize.title}px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin: 10px 0;
      }
      
      .company-info {
        font-size: ${typography.fontSize.small}px;
        line-height: 1.3;
      }
      
      .customer-info {
        margin: 15px 0;
        padding: 10px 0;
        border-top: 1px dashed ${colors.secondary};
        border-bottom: 1px dashed ${colors.secondary};
      }
      
      .member-badge {
        background-color: ${colors.accent};
        color: white;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: ${typography.fontSize.small}px;
        font-weight: bold;
      }
      
      .items-section {
        margin: 15px 0;
      }
      
      .item {
        margin: 8px 0;
        padding: 5px 0;
        border-bottom: 1px dotted ${colors.secondary};
      }
      
      .totals {
        margin-top: 15px;
        padding-top: 10px;
        border-top: 2px solid ${colors.primary};
      }
      
      .total-line {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
      }
      
      .footer {
        margin-top: 20px;
        text-align: center;
        font-size: ${typography.fontSize.small}px;
        color: ${colors.secondary};
        border-top: 1px dashed ${colors.secondary};
        padding-top: 15px;
      }
      
      @media print {
        body { 
          background: white;
          margin: 0; 
          padding: 10px; 
        }
        .thermal-receipt {
          border: 2px solid ${colors.primary};
        }
      }
    `;
  }

  private generateBusinessStyles(config: ReceiptTemplateContent): string {
    const { colors, typography, layout } = config;
    
    return `
      body {
        font-family: ${typography.fontFamily};
        font-size: ${typography.fontSize.normal}px;
        line-height: 1.6;
        color: ${colors.text};
        margin: 0;
        padding: 0;
        background: ${colors.background};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .business-invoice {
        max-width: 210mm;
        margin: 0 auto;
        padding: ${layout.margins.top}px ${layout.margins.right}px ${layout.margins.bottom}px ${layout.margins.left}px;
        background: white;
      }
      
      .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid ${colors.secondary};
        padding-bottom: 32px;
        margin-bottom: 48px;
      }
      
      .company-section h1 {
        color: ${colors.primary};
        font-size: ${typography.fontSize.title}px;
        font-weight: 700;
        margin: 0 0 8px 0;
        letter-spacing: -0.025em;
      }
      
      .company-info {
        color: ${colors.accent};
        font-size: ${typography.fontSize.small}px;
        line-height: 1.5;
      }
      
      .invoice-section {
        text-align: right;
      }
      
      .invoice-section h2 {
        color: ${colors.primary};
        font-size: ${typography.fontSize.large}px;
        font-weight: 300;
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      
      .invoice-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 48px;
        margin-bottom: 48px;
      }
      
      .customer-section h3, .shipping-section h3 {
        color: ${colors.primary};
        font-size: ${typography.fontSize.normal}px;
        font-weight: 600;
        margin: 0 0 16px 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .customer-info, .shipping-info {
        color: ${colors.text};
        font-size: ${typography.fontSize.normal}px;
        line-height: 1.6;
      }
      
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 32px;
        border: 1px solid ${colors.secondary};
        border-radius: 8px;
        overflow: hidden;
      }
      
      .items-table th {
        background-color: ${colors.secondary};
        color: ${colors.primary};
        padding: 16px 20px;
        text-align: left;
        font-weight: 600;
        font-size: ${typography.fontSize.small}px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .items-table td {
        padding: 16px 20px;
        border-bottom: 1px solid ${colors.secondary};
        vertical-align: top;
      }
      
      .items-table tr:last-child td {
        border-bottom: none;
      }
      
      .totals-section {
        max-width: 360px;
        margin-left: auto;
        margin-top: 32px;
      }
      
      .total-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid ${colors.secondary};
        font-size: ${typography.fontSize.normal}px;
      }
      
      .total-line:last-child {
        border-bottom: none;
      }
      
      .total-line.final {
        font-weight: 700;
        font-size: ${typography.fontSize.large}px;
        color: ${colors.primary};
        background-color: ${colors.secondary};
        padding: 16px 20px;
        margin-top: 16px;
        border-radius: 8px;
      }
      
      @media print {
        body { 
          background: white;
          margin: 0; 
          padding: 0; 
        }
        .business-invoice {
          box-shadow: none;
        }
      }
    `;
  }

  private generateMinimalStyles(config: ReceiptTemplateContent): string {
    const { colors, typography, layout } = config;
    
    return `
      body {
        font-family: ${typography.fontFamily};
        font-size: ${typography.fontSize.normal}px;
        line-height: 1.6;
        color: ${colors.text};
        margin: 0;
        padding: 0;
        background: ${colors.background};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .minimal-receipt {
        max-width: 600px;
        margin: 0 auto;
        padding: ${layout.margins.top}px ${layout.margins.right}px ${layout.margins.bottom}px ${layout.margins.left}px;
        background: white;
      }
      
      .receipt-header {
        text-align: center;
        border-bottom: 1px solid ${colors.secondary};
        padding-bottom: 32px;
        margin-bottom: 40px;
      }
      
      .receipt-title {
        font-size: ${typography.fontSize.title}px;
        font-weight: 600;
        margin: 0;
        color: ${colors.primary};
        letter-spacing: -0.025em;
      }
      
      .customer-section {
        margin-bottom: 40px;
        text-align: center;
        padding: 24px;
        background: ${colors.secondary};
        border-radius: 8px;
      }
      
      .items-list {
        margin-bottom: 40px;
      }
      
      .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 0;
        border-bottom: 1px solid ${colors.secondary};
      }
      
      .item:last-child {
        border-bottom: none;
      }
      
      .item-name {
        font-weight: 500;
        color: ${colors.primary};
      }
      
      .item-details {
        font-size: ${typography.fontSize.small}px;
        color: ${colors.accent};
        margin-top: 4px;
      }
      
      .item-price {
        font-weight: 600;
        color: ${colors.primary};
      }
      
      .totals-minimal {
        border-top: 1px solid ${colors.secondary};
        padding-top: 32px;
      }
      
      .total-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        font-size: ${typography.fontSize.normal}px;
      }
      
      .total-line.final {
        font-weight: 700;
        font-size: ${typography.fontSize.large}px;
        color: ${colors.primary};
        background: ${colors.secondary};
        padding: 20px;
        margin: 20px 0 0 0;
        border-radius: 8px;
      }
      
      @media print {
        body { 
          background: white;
          margin: 0; 
          padding: 0; 
        }
        .minimal-receipt {
          box-shadow: none;
        }
      }
    `;
  }

  private generateDetailedStyles(config: ReceiptTemplateContent): string {
    const { colors, typography, layout } = config;
    
    return `
      body {
        font-family: ${typography.fontFamily};
        font-size: ${typography.fontSize.normal}px;
        line-height: 1.6;
        color: ${colors.text};
        margin: 0;
        padding: 0;
        background: ${colors.background};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .detailed-invoice {
        max-width: 210mm;
        margin: 0 auto;
        padding: ${layout.margins.top}px ${layout.margins.right}px ${layout.margins.bottom}px ${layout.margins.left}px;
        background: white;
      }
      
      .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid ${colors.secondary};
        padding-bottom: 40px;
        margin-bottom: 56px;
      }
      
      .company-section h1 {
        color: ${colors.primary};
        font-size: ${typography.fontSize.title}px;
        font-weight: 800;
        margin: 0 0 12px 0;
        letter-spacing: -0.025em;
      }
      
      .company-details {
        color: ${colors.accent};
        font-size: ${typography.fontSize.small}px;
        line-height: 1.6;
      }
      
      .invoice-section h2 {
        color: ${colors.primary};
        font-size: ${typography.fontSize.large}px;
        font-weight: 300;
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.15em;
      }
      
      .invoice-meta {
        background: ${colors.secondary};
        padding: 24px;
        margin-bottom: 48px;
        border-radius: 8px;
        border-left: 4px solid ${colors.primary};
      }
      
      .invoice-meta h3 {
        color: ${colors.primary};
        font-size: ${typography.fontSize.normal}px;
        font-weight: 600;
        margin: 0 0 12px 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .parties {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 56px;
        margin-bottom: 56px;
      }
      
      .customer-details h3, .shipping-details h3 {
        color: ${colors.primary};
        font-size: ${typography.fontSize.normal}px;
        font-weight: 600;
        margin: 0 0 20px 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 2px solid ${colors.secondary};
        padding-bottom: 8px;
      }
      
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 40px;
        border: 1px solid ${colors.secondary};
        border-radius: 12px;
        overflow: hidden;
      }
      
      .items-table th {
        background-color: ${colors.secondary};
        color: ${colors.primary};
        padding: 20px 24px;
        text-align: left;
        font-weight: 600;
        font-size: ${typography.fontSize.small}px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .items-table td {
        padding: 20px 24px;
        border-bottom: 1px solid ${colors.secondary};
        vertical-align: top;
      }
      
      .items-table tr:last-child td {
        border-bottom: none;
      }
      
      .tax-section {
        background: ${colors.secondary};
        padding: 24px;
        margin: 32px 0;
        border-radius: 8px;
        border-left: 4px solid ${colors.primary};
      }
      
      .tax-section h4 {
        color: ${colors.primary};
        font-size: ${typography.fontSize.normal}px;
        font-weight: 600;
        margin: 0 0 16px 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .totals-detailed {
        max-width: 420px;
        margin-left: auto;
        margin-top: 40px;
        background: white;
        border: 1px solid ${colors.secondary};
        border-radius: 12px;
        padding: 32px;
      }
      
      .totals-detailed h3 {
        color: ${colors.primary};
        font-size: ${typography.fontSize.large}px;
        font-weight: 700;
        margin: 0 0 24px 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .total-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid ${colors.secondary};
        font-size: ${typography.fontSize.normal}px;
      }
      
      .total-line:last-child {
        border-bottom: none;
      }
      
      .total-line.final {
        font-weight: 800;
        font-size: ${typography.fontSize.large}px;
        color: ${colors.primary};
        background: ${colors.secondary};
        padding: 24px;
        margin: 20px -32px -32px -32px;
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 12px;
      }
      
      @media print {
        body { 
          background: white;
          margin: 0; 
          padding: 0; 
        }
        .detailed-invoice {
          box-shadow: none;
        }
        .totals-detailed {
          border: 1px solid ${colors.secondary};
        }
      }
    `;
  }

  // Helper methods for rendering different sections
  private async renderThermalHeader(config: ReceiptTemplateContent, receiptNumber: string): Promise<string> {
    const companyInfo = await this.getCompanyInfo();
    return `
      <div class="receipt-header">
        <div class="receipt-title">Tax Receipt</div>
        <div class="company-info">
          <div><strong>${companyInfo.name}</strong></div>
          <div>Reg: ${companyInfo.registrationNo}</div>
          <div>SST: ${companyInfo.sstNo}</div>
          <div>${companyInfo.address}</div>
          <div>${companyInfo.phone}</div>
        </div>
        <div style="margin: 10px 0; font-weight: bold;">${receiptNumber}</div>
      </div>
    `;
  }

  private renderThermalItems(config: ReceiptTemplateContent, items: any[]): string {
    const itemsHtml = items.map(item => `
      <div class="item">
        <div style="font-weight: bold;">${item.productName}</div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 3px;">
          <span>${item.quantity} x ${this.formatCurrency(item.appliedPrice)}</span>
          <span>${this.formatCurrency(item.totalPrice)}</span>
        </div>
        ${config.sections.items.showSKU && item.productSku ? `<div style="font-size: 10px; color: #666;">SKU: ${item.productSku}</div>` : ''}
      </div>
    `).join('');

    return `
      <div class="items-section">
        <strong>Items:</strong>
        ${itemsHtml}
      </div>
    `;
  }

  private renderThermalTotals(config: ReceiptTemplateContent, order: any, taxBreakdown: any): string {
    return `
      <div class="totals">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>${this.formatCurrency(order.subtotal)}</span>
        </div>
        ${order.discountAmount > 0 ? `
        <div class="total-line">
          <span>Discount:</span>
          <span>-${this.formatCurrency(order.discountAmount)}</span>
        </div>
        ` : ''}
        <div class="total-line">
          <span>Shipping:</span>
          <span>${this.formatCurrency(order.shippingCost)}</span>
        </div>
        ${config.sections.totals.showTaxBreakdown ? `
        <div class="total-line">
          <span>Tax (${taxBreakdown.taxRate}):</span>
          <span>${this.formatCurrency(taxBreakdown.totalTax)}</span>
        </div>
        ` : ''}
        <div class="total-line" style="font-weight: bold; border-top: 1px solid #333; margin-top: 5px; padding-top: 5px;">
          <span>Total:</span>
          <span>${this.formatCurrency(order.total)}</span>
        </div>
      </div>
    `;
  }

  private renderThermalShipping(config: ReceiptTemplateContent, address: any): string {
    return `
      <div style="margin: 15px 0; font-size: 11px; border-top: 1px dashed #666; padding-top: 10px;">
        <strong>Delivery Address:</strong><br>
        ${address.firstName} ${address.lastName}<br>
        ${address.addressLine1}<br>
        ${address.addressLine2 ? `${address.addressLine2}<br>` : ''}
        ${address.city}, ${address.state} ${address.postalCode}<br>
        ${address.country}
      </div>
    `;
  }

  private renderThermalFooter(config: ReceiptTemplateContent): string {
    return `
      <div class="footer">
        <p><strong>OFFICIAL TAX RECEIPT</strong></p>
        ${config.sections.footer.message ? `<p>${config.sections.footer.message}</p>` : ''}
        ${config.sections.footer.showGeneratedDate ? `<p>Generated: ${this.formatDate(new Date())}</p>` : ''}
      </div>
    `;
  }

  // Business Invoice specific renderers
  private async renderBusinessHeader(config: ReceiptTemplateContent, invoiceNumber: string): Promise<string> {
    const companyInfo = await this.getCompanyInfo();
    return `
      <div class="invoice-header">
        <div class="company-section">
          <h1>${companyInfo.name}</h1>
          <p>Reg: ${companyInfo.registrationNo}<br>
          SST: ${companyInfo.sstNo}<br>
          ${companyInfo.address}<br>
          ${companyInfo.phone}</p>
        </div>
        <div class="invoice-section">
          <h2>INVOICE</h2>
          <p><strong>${invoiceNumber}</strong></p>
          <p>${this.formatDate(new Date())}</p>
        </div>
      </div>
    `;
  }

  private renderBusinessItems(config: ReceiptTemplateContent, items: any[]): string {
    const itemsRows = items.map(item => `
      <tr>
        <td>
          ${item.productName}
          ${config.sections.items.showSKU && item.productSku ? `<br><small>SKU: ${item.productSku}</small>` : ''}
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${this.formatCurrency(item.appliedPrice)}</td>
        <td style="text-align: right;">${this.formatCurrency(item.totalPrice)}</td>
      </tr>
    `).join('');

    return `
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    `;
  }

  private renderBusinessTotals(config: ReceiptTemplateContent, order: any, taxBreakdown: any): string {
    return `
      <div class="totals-section">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>${this.formatCurrency(order.subtotal)}</span>
        </div>
        ${order.discountAmount > 0 ? `
        <div class="total-line">
          <span>Discount:</span>
          <span>-${this.formatCurrency(order.discountAmount)}</span>
        </div>
        ` : ''}
        <div class="total-line">
          <span>Shipping:</span>
          <span>${this.formatCurrency(order.shippingCost)}</span>
        </div>
        ${config.sections.totals.showTaxBreakdown ? `
        <div class="total-line">
          <span>Tax (${taxBreakdown.taxRate}):</span>
          <span>${this.formatCurrency(taxBreakdown.totalTax)}</span>
        </div>
        ` : ''}
        <div class="total-line final">
          <span>TOTAL:</span>
          <span>${this.formatCurrency(order.total)}</span>
        </div>
        <div style="clear: both;"></div>
      </div>
    `;
  }

  private renderBusinessFooter(config: ReceiptTemplateContent): string {
    return `
      <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center;">
        ${config.sections.footer.message ? `<p><strong>${config.sections.footer.message}</strong></p>` : ''}
        ${config.sections.footer.showGeneratedDate ? `<p><small>Generated: ${this.formatDate(new Date())}</small></p>` : ''}
      </div>
    `;
  }

  // Similar methods for minimal and detailed templates...
  private renderMinimalHeader(config: ReceiptTemplateContent, receiptNumber: string): string {
    return `
      <div class="receipt-header">
        <h1 class="receipt-title">Receipt</h1>
        <p>${receiptNumber}</p>
      </div>
    `;
  }

  private renderMinimalItems(config: ReceiptTemplateContent, items: any[]): string {
    const itemsHtml = items.map(item => `
      <div class="item">
        <div>
          <strong>${item.productName}</strong><br>
          <small>${item.quantity} × ${this.formatCurrency(item.appliedPrice)}</small>
        </div>
        <div><strong>${this.formatCurrency(item.totalPrice)}</strong></div>
      </div>
    `).join('');

    return `
      <div class="items-list">
        ${itemsHtml}
      </div>
    `;
  }

  private renderMinimalTotals(config: ReceiptTemplateContent, order: any): string {
    return `
      <div class="totals-minimal">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>${this.formatCurrency(order.subtotal)}</span>
        </div>
        ${order.discountAmount > 0 ? `
        <div class="total-line">
          <span>Discount:</span>
          <span>-${this.formatCurrency(order.discountAmount)}</span>
        </div>
        ` : ''}
        <div class="total-line">
          <span>Shipping:</span>
          <span>${this.formatCurrency(order.shippingCost)}</span>
        </div>
        <div class="total-line final">
          <span>Total:</span>
          <span>${this.formatCurrency(order.total)}</span>
        </div>
      </div>
    `;
  }

  private renderMinimalFooter(config: ReceiptTemplateContent): string {
    return `
      <div style="text-align: center; margin-top: 30px; color: #666;">
        ${config.sections.footer.message ? `<p>${config.sections.footer.message}</p>` : ''}
        ${config.sections.footer.showGeneratedDate ? `<p><small>${this.formatDate(new Date())}</small></p>` : ''}
      </div>
    `;
  }

  // Detailed invoice renderers (similar pattern)
  private async renderDetailedHeader(config: ReceiptTemplateContent, invoiceNumber: string): Promise<string> {
    const companyInfo = await this.getCompanyInfo();
    return `
      <div class="invoice-header">
        <div class="company-section">
          <h1>${companyInfo.name}</h1>
          <div class="company-details">
            <p>${companyInfo.address}<br>
            Phone: ${companyInfo.phone}<br>
            Email: ${companyInfo.email}</p>
            <p><strong>Registration:</strong> ${companyInfo.registrationNo}<br>
            <strong>SST Number:</strong> ${companyInfo.sstNo}</p>
          </div>
        </div>
        <div class="invoice-section">
          <h2 style="color: #1E40AF; font-size: 28px; margin: 0;">INVOICE</h2>
          <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${invoiceNumber}</p>
        </div>
      </div>
    `;
  }

  private renderDetailedItems(config: ReceiptTemplateContent, items: any[]): string {
    const itemsRows = items.map(item => `
      <tr>
        <td>
          <strong>${item.productName}</strong>
          ${config.sections.items.showSKU && item.productSku ? `<br><span style="color: #666; font-size: 12px;">SKU: ${item.productSku}</span>` : ''}
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${this.formatCurrency(item.regularPrice)}</td>
        <td style="text-align: right;">${this.formatCurrency(item.appliedPrice)}</td>
        <td style="text-align: right; font-weight: bold;">${this.formatCurrency(item.totalPrice)}</td>
      </tr>
    `).join('');

    return `
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Regular Price</th>
            <th style="text-align: right;">Applied Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    `;
  }

  private renderDetailedTotals(config: ReceiptTemplateContent, order: any, taxBreakdown: any): string {
    return `
      <div class="totals-detailed">
        <h3 style="margin-top: 0; color: #1E40AF;">Summary</h3>
        <div class="total-line">
          <span>Subtotal:</span>
          <span>${this.formatCurrency(order.subtotal)}</span>
        </div>
        ${order.discountAmount > 0 ? `
        <div class="total-line">
          <span>Discount:</span>
          <span>-${this.formatCurrency(order.discountAmount)}</span>
        </div>
        ` : ''}
        <div class="total-line">
          <span>Shipping & Handling:</span>
          <span>${this.formatCurrency(order.shippingCost)}</span>
        </div>
        ${config.sections.totals.showTaxBreakdown ? `
        <div class="tax-section">
          <h4 style="margin: 0 0 10px 0;">Tax Details</h4>
          <div class="total-line">
            <span>Taxable Amount:</span>
            <span>${this.formatCurrency(taxBreakdown.taxableAmount)}</span>
          </div>
          <div class="total-line">
            <span>SST (${taxBreakdown.taxRate}):</span>
            <span>${this.formatCurrency(taxBreakdown.totalTax)}</span>
          </div>
        </div>
        ` : ''}
        <div class="total-line final">
          <span>TOTAL AMOUNT:</span>
          <span>${this.formatCurrency(order.total)}</span>
        </div>
        <div style="clear: both;"></div>
      </div>
    `;
  }

  private renderDetailedFooter(config: ReceiptTemplateContent): string {
    return `
      <div style="margin-top: 60px; padding: 30px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px;">
        <h3 style="color: #1E40AF; margin-top: 0;">Important Information</h3>
        ${config.sections.footer.message ? `<p><strong>${config.sections.footer.message}</strong></p>` : ''}
        <p><small>This is a computer generated invoice and serves as an official tax receipt for Malaysian tax purposes. Please retain this document for your records.</small></p>
        ${config.sections.footer.showGeneratedDate ? `<p><small><strong>Generated:</strong> ${this.formatDate(new Date())}</small></p>` : ''}
      </div>
    `;
  }

  // Utility methods
  private renderAddress(address: any): string {
    return `
      ${address.firstName} ${address.lastName}<br>
      ${address.addressLine1}<br>
      ${address.addressLine2 ? `${address.addressLine2}<br>` : ''}
      ${address.city}, ${address.state} ${address.postalCode}<br>
      ${address.country}
      ${address.phone ? `<br>Phone: ${address.phone}` : ''}
    `;
  }

  private formatCurrency(amount: number): string {
    return `RM ${amount.toFixed(2)}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}