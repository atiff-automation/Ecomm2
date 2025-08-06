/**
 * Malaysian Tax Service
 * Handles GST, SST, and other Malaysian tax calculations
 */

import { prisma } from '@/lib/db';

export interface TaxCalculation {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  taxRate: number;
  taxType: 'GST' | 'SST' | 'NONE';
  breakdown: TaxBreakdown[];
}

export interface TaxBreakdown {
  description: string;
  amount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
}

export interface TaxConfiguration {
  gstRate: number;
  sstRate: number;
  serviceTaxRate: number;
  taxExemptThreshold: number;
  isGstActive: boolean;
  isSstActive: boolean;
  defaultTaxType: 'GST' | 'SST';
}

export interface ProductTaxInfo {
  id: string;
  name: string;
  price: number;
  quantity: number;
  taxCategory: 'STANDARD' | 'EXEMPT' | 'ZERO_RATED' | 'SERVICE';
  isGstApplicable: boolean;
  isSstApplicable: boolean;
  customTaxRate?: number;
}

export class MalaysianTaxService {
  private static instance: MalaysianTaxService;

  private constructor() {}

  public static getInstance(): MalaysianTaxService {
    if (!MalaysianTaxService.instance) {
      MalaysianTaxService.instance = new MalaysianTaxService();
    }
    return MalaysianTaxService.instance;
  }

  /**
   * Get current tax configuration from database
   */
  async getTaxConfiguration(): Promise<TaxConfiguration> {
    try {
      const taxRates = await prisma.taxRate.findMany({
        where: { isActive: true },
      });

      const gstRate =
        taxRates.find(rate => rate.name.toUpperCase().includes('GST'))?.rate ||
        0;
      const sstRate =
        taxRates.find(rate => rate.name.toUpperCase().includes('SST'))?.rate ||
        0;
      const serviceTaxRate =
        taxRates.find(rate => rate.name.toUpperCase().includes('SERVICE'))
          ?.rate || 0;

      return {
        gstRate: Number(gstRate),
        sstRate: Number(sstRate),
        serviceTaxRate: Number(serviceTaxRate),
        taxExemptThreshold: 0, // No threshold for Malaysian taxes
        isGstActive: gstRate > 0,
        isSstActive: sstRate > 0,
        defaultTaxType: gstRate > 0 ? 'GST' : 'SST',
      };
    } catch (error) {
      console.error('Error fetching tax configuration:', error);

      // Return default Malaysian tax rates
      return {
        gstRate: 0.06, // 6% GST (currently suspended but keeping for future)
        sstRate: 0.06, // 6% SST (currently active)
        serviceTaxRate: 0.06, // 6% Service Tax
        taxExemptThreshold: 0,
        isGstActive: false, // GST is currently suspended in Malaysia
        isSstActive: true, // SST is currently active
        defaultTaxType: 'SST',
      };
    }
  }

  /**
   * Calculate tax for a list of products
   */
  async calculateTax(products: ProductTaxInfo[]): Promise<TaxCalculation> {
    const config = await this.getTaxConfiguration();
    let subtotal = 0;
    let totalTaxAmount = 0;
    const breakdown: TaxBreakdown[] = [];

    for (const product of products) {
      const productTotal = product.price * product.quantity;
      subtotal += productTotal;

      const taxInfo = this.calculateProductTax(product, productTotal, config);
      totalTaxAmount += taxInfo.taxAmount;

      if (taxInfo.taxAmount > 0) {
        breakdown.push({
          description: `${product.name} (${this.getTaxTypeForProduct(product, config)})`,
          amount: productTotal,
          taxableAmount: taxInfo.taxableAmount,
          taxRate: taxInfo.taxRate,
          taxAmount: taxInfo.taxAmount,
        });
      }
    }

    return {
      subtotal,
      taxAmount: totalTaxAmount,
      totalAmount: subtotal + totalTaxAmount,
      taxRate: subtotal > 0 ? totalTaxAmount / subtotal : 0,
      taxType: config.defaultTaxType,
      breakdown,
    };
  }

  /**
   * Calculate tax for a single product
   */
  private calculateProductTax(
    product: ProductTaxInfo,
    productTotal: number,
    config: TaxConfiguration
  ): { taxableAmount: number; taxRate: number; taxAmount: number } {
    // Check if product is tax exempt
    if (product.taxCategory === 'EXEMPT') {
      return { taxableAmount: 0, taxRate: 0, taxAmount: 0 };
    }

    // Check if product is zero-rated (0% tax but still GST/SST registered)
    if (product.taxCategory === 'ZERO_RATED') {
      return { taxableAmount: productTotal, taxRate: 0, taxAmount: 0 };
    }

    // Use custom tax rate if specified
    if (product.customTaxRate !== undefined) {
      return {
        taxableAmount: productTotal,
        taxRate: product.customTaxRate,
        taxAmount: productTotal * product.customTaxRate,
      };
    }

    // Determine which tax applies
    let taxRate = 0;

    if (product.taxCategory === 'SERVICE') {
      taxRate = config.serviceTaxRate;
    } else if (product.isGstApplicable && config.isGstActive) {
      taxRate = config.gstRate;
    } else if (product.isSstApplicable && config.isSstActive) {
      taxRate = config.sstRate;
    } else if (config.defaultTaxType === 'GST' && config.isGstActive) {
      taxRate = config.gstRate;
    } else if (config.defaultTaxType === 'SST' && config.isSstActive) {
      taxRate = config.sstRate;
    }

    return {
      taxableAmount: productTotal,
      taxRate,
      taxAmount: productTotal * taxRate,
    };
  }

  /**
   * Get tax type for a product based on configuration
   */
  private getTaxTypeForProduct(
    product: ProductTaxInfo,
    config: TaxConfiguration
  ): string {
    if (product.taxCategory === 'EXEMPT') {
      return 'TAX_EXEMPT';
    }
    if (product.taxCategory === 'ZERO_RATED') {
      return 'ZERO_RATED';
    }
    if (product.taxCategory === 'SERVICE') {
      return 'SERVICE_TAX';
    }

    if (product.isGstApplicable && config.isGstActive) {
      return 'GST';
    }
    if (product.isSstApplicable && config.isSstActive) {
      return 'SST';
    }

    return config.defaultTaxType;
  }

  /**
   * Calculate tax inclusive pricing (tax already included in price)
   */
  calculateTaxInclusive(
    priceIncludingTax: number,
    taxRate: number
  ): {
    priceExcludingTax: number;
    taxAmount: number;
    priceIncludingTax: number;
  } {
    const priceExcludingTax = priceIncludingTax / (1 + taxRate);
    const taxAmount = priceIncludingTax - priceExcludingTax;

    return {
      priceExcludingTax: Math.round(priceExcludingTax * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      priceIncludingTax: Math.round(priceIncludingTax * 100) / 100,
    };
  }

  /**
   * Calculate tax exclusive pricing (tax to be added to price)
   */
  calculateTaxExclusive(
    priceExcludingTax: number,
    taxRate: number
  ): {
    priceExcludingTax: number;
    taxAmount: number;
    priceIncludingTax: number;
  } {
    const taxAmount = priceExcludingTax * taxRate;
    const priceIncludingTax = priceExcludingTax + taxAmount;

    return {
      priceExcludingTax: Math.round(priceExcludingTax * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      priceIncludingTax: Math.round(priceIncludingTax * 100) / 100,
    };
  }

  /**
   * Format tax amount for display
   */
  formatTaxAmount(amount: number, currency = 'RM'): string {
    return `${currency} ${amount.toFixed(2)}`;
  }

  /**
   * Get tax registration numbers from environment
   */
  getTaxRegistrationNumbers(): {
    gstNumber?: string;
    sstNumber?: string;
    businessRegistrationNumber?: string;
  } {
    return {
      gstNumber: process.env.GST_NUMBER,
      sstNumber: process.env.SST_NUMBER,
      businessRegistrationNumber: process.env.BUSINESS_REGISTRATION_NUMBER,
    };
  }

  /**
   * Generate tax report data for compliance
   */
  async generateTaxReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSales: number;
    totalTaxCollected: number;
    totalTaxExempt: number;
    gstSales: number;
    sstSales: number;
    serviceTaxSales: number;
    reportPeriod: string;
  }> {
    try {
      // This would typically query your orders/sales data
      // For now, returning placeholder structure
      const reportPeriod = `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`;

      return {
        totalSales: 0,
        totalTaxCollected: 0,
        totalTaxExempt: 0,
        gstSales: 0,
        sstSales: 0,
        serviceTaxSales: 0,
        reportPeriod,
      };
    } catch (error) {
      console.error('Error generating tax report:', error);
      throw new Error('Failed to generate tax report');
    }
  }

  /**
   * Validate tax configuration
   */
  async validateTaxConfiguration(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const config = await this.getTaxConfiguration();

      // Check for basic validation
      if (!config.isGstActive && !config.isSstActive) {
        warnings.push('Neither GST nor SST is active');
      }

      if (config.gstRate < 0 || config.gstRate > 1) {
        errors.push('GST rate must be between 0 and 1 (0% to 100%)');
      }

      if (config.sstRate < 0 || config.sstRate > 1) {
        errors.push('SST rate must be between 0 and 1 (0% to 100%)');
      }

      // Check tax registration numbers
      const registration = this.getTaxRegistrationNumbers();

      if (config.isGstActive && !registration.gstNumber) {
        warnings.push(
          'GST is active but GST registration number is not configured'
        );
      }

      if (config.isSstActive && !registration.sstNumber) {
        warnings.push(
          'SST is active but SST registration number is not configured'
        );
      }

      if (!registration.businessRegistrationNumber) {
        warnings.push('Business registration number is not configured');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Failed to validate tax configuration'],
        warnings: [],
      };
    }
  }
}

// Export singleton instance
export const malaysianTaxService = MalaysianTaxService.getInstance();

// Helper functions for common tax scenarios
export function isGstSuspended(): boolean {
  // GST was suspended in Malaysia and replaced with SST
  return true;
}

export function getCurrentMalaysianTaxSystem(): 'GST' | 'SST' {
  return isGstSuspended() ? 'SST' : 'GST';
}

export function getMalaysianTaxRate(): number {
  // Current SST rate in Malaysia
  return 0.06; // 6%
}
