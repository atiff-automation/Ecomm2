/**
 * Malaysian Tax Service
 * Handles GST/SST calculation for shipping costs and products
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 6.1
 * Malaysian Tax Guidelines: https://gst.customs.gov.my/
 */

import { prisma } from '@/lib/db/prisma';

// Malaysian tax types
export enum TaxType {
  GST = 'GST', // Goods and Services Tax (replaced by SST in 2018)
  SST = 'SST', // Sales and Service Tax (current)
  EXEMPT = 'EXEMPT',
}

// Service tax categories for shipping
export enum ServiceTaxCategory {
  LOGISTICS = 'LOGISTICS', // 6% SST
  COURIER = 'COURIER', // 6% SST
  FREIGHT = 'FREIGHT', // 6% SST
  WAREHOUSING = 'WAREHOUSING', // 6% SST
  INSURANCE = 'INSURANCE', // 6% SST
  EXEMPT = 'EXEMPT', // 0% SST
}

// Product tax categories
export enum ProductTaxCategory {
  STANDARD = 'STANDARD', // 10% Sales Tax (most products)
  LUXURY = 'LUXURY', // 10% Sales Tax
  ESSENTIAL = 'ESSENTIAL', // 0% (basic necessities)
  MEDICAL = 'MEDICAL', // 0% (medical equipment/medicines)
  FOOD = 'FOOD', // 0% (basic food items)
  BOOKS = 'BOOKS', // 0% (educational materials)
  EXEMPT = 'EXEMPT', // 0%
}

interface TaxBreakdown {
  subtotal: number;
  salesTax: number;
  serviceTax: number;
  totalTax: number;
  total: number;
  taxInclusive: boolean;
  breakdown: {
    productTax: {
      taxableAmount: number;
      taxRate: number;
      taxAmount: number;
    };
    shippingTax: {
      taxableAmount: number;
      taxRate: number;
      taxAmount: number;
    };
  };
}

interface TaxConfiguration {
  salesTaxRate: number; // Current: 10%
  serviceTaxRate: number; // Current: 6%
  threshold: number; // Registration threshold: RM500,000
  isActive: boolean;
  effectiveDate: Date;
}

export class MalaysianTaxService {
  private static instance: MalaysianTaxService;
  private taxConfig: TaxConfiguration | null = null;

  private constructor() {}

  public static getInstance(): MalaysianTaxService {
    if (!MalaysianTaxService.instance) {
      MalaysianTaxService.instance = new MalaysianTaxService();
    }
    return MalaysianTaxService.instance;
  }

  /**
   * Get current tax configuration from database or defaults
   */
  private async getTaxConfiguration(): Promise<TaxConfiguration> {
    if (this.taxConfig) {
      return this.taxConfig;
    }

    try {
      const config = await prisma.systemConfig.findFirst({
        where: { key: 'malaysian_tax_config' },
      });

      if (config?.value) {
        this.taxConfig = JSON.parse(config.value as string);
      } else {
        // Default Malaysian SST rates
        this.taxConfig = {
          salesTaxRate: 0.1, // 10% Sales Tax
          serviceTaxRate: 0.06, // 6% Service Tax
          threshold: 500000, // RM500,000 registration threshold
          isActive: true,
          effectiveDate: new Date('2018-09-01'), // SST reintroduction date
        };
      }

      return this.taxConfig;
    } catch (error) {
      console.error('Error loading tax configuration:', error);
      // Return default configuration
      return {
        salesTaxRate: 0.1,
        serviceTaxRate: 0.06,
        threshold: 500000,
        isActive: true,
        effectiveDate: new Date('2018-09-01'),
      };
    }
  }

  /**
   * Calculate comprehensive tax breakdown for order
   */
  async calculateTaxBreakdown(params: {
    productSubtotal: number;
    shippingCost: number;
    productTaxCategory?: ProductTaxCategory;
    shippingTaxCategory?: ServiceTaxCategory;
    taxInclusive?: boolean;
  }): Promise<TaxBreakdown> {
    const config = await this.getTaxConfiguration();
    const {
      productSubtotal,
      shippingCost,
      productTaxCategory = ProductTaxCategory.STANDARD,
      shippingTaxCategory = ServiceTaxCategory.LOGISTICS,
      taxInclusive = false,
    } = params;

    if (!config.isActive) {
      return {
        subtotal: productSubtotal + shippingCost,
        salesTax: 0,
        serviceTax: 0,
        totalTax: 0,
        total: productSubtotal + shippingCost,
        taxInclusive,
        breakdown: {
          productTax: {
            taxableAmount: productSubtotal,
            taxRate: 0,
            taxAmount: 0,
          },
          shippingTax: {
            taxableAmount: shippingCost,
            taxRate: 0,
            taxAmount: 0,
          },
        },
      };
    }

    // Determine tax rates based on categories
    const productTaxRate = this.getProductTaxRate(productTaxCategory, config);
    const shippingTaxRate = this.getShippingTaxRate(
      shippingTaxCategory,
      config
    );

    let productTaxAmount = 0;
    let shippingTaxAmount = 0;
    let taxableProductAmount = productSubtotal;
    let taxableShippingAmount = shippingCost;

    if (taxInclusive) {
      // Tax is already included in the prices
      taxableProductAmount = productSubtotal / (1 + productTaxRate);
      productTaxAmount = productSubtotal - taxableProductAmount;

      taxableShippingAmount = shippingCost / (1 + shippingTaxRate);
      shippingTaxAmount = shippingCost - taxableShippingAmount;
    } else {
      // Tax needs to be added
      productTaxAmount = taxableProductAmount * productTaxRate;
      shippingTaxAmount = taxableShippingAmount * shippingTaxRate;
    }

    const totalTax = productTaxAmount + shippingTaxAmount;
    const subtotal = taxableProductAmount + taxableShippingAmount;
    const total = taxInclusive ? subtotal + totalTax : subtotal + totalTax;

    return {
      subtotal,
      salesTax: productTaxAmount,
      serviceTax: shippingTaxAmount,
      totalTax,
      total,
      taxInclusive,
      breakdown: {
        productTax: {
          taxableAmount: taxableProductAmount,
          taxRate: productTaxRate,
          taxAmount: productTaxAmount,
        },
        shippingTax: {
          taxableAmount: taxableShippingAmount,
          taxRate: shippingTaxRate,
          taxAmount: shippingTaxAmount,
        },
      },
    };
  }

  /**
   * Get product tax rate based on category
   */
  private getProductTaxRate(
    category: ProductTaxCategory,
    config: TaxConfiguration
  ): number {
    switch (category) {
      case ProductTaxCategory.STANDARD:
      case ProductTaxCategory.LUXURY:
        return config.salesTaxRate;
      case ProductTaxCategory.ESSENTIAL:
      case ProductTaxCategory.MEDICAL:
      case ProductTaxCategory.FOOD:
      case ProductTaxCategory.BOOKS:
      case ProductTaxCategory.EXEMPT:
        return 0;
      default:
        return config.salesTaxRate;
    }
  }

  /**
   * Get shipping service tax rate based on category
   */
  private getShippingTaxRate(
    category: ServiceTaxCategory,
    config: TaxConfiguration
  ): number {
    switch (category) {
      case ServiceTaxCategory.LOGISTICS:
      case ServiceTaxCategory.COURIER:
      case ServiceTaxCategory.FREIGHT:
      case ServiceTaxCategory.WAREHOUSING:
      case ServiceTaxCategory.INSURANCE:
        return config.serviceTaxRate;
      case ServiceTaxCategory.EXEMPT:
        return 0;
      default:
        return config.serviceTaxRate;
    }
  }

  /**
   * Calculate shipping tax for EasyParcel rates
   */
  async calculateShippingTax(
    shippingCost: number,
    inclusive: boolean = false
  ): Promise<{
    taxExclusiveAmount: number;
    taxAmount: number;
    taxInclusiveAmount: number;
    taxRate: number;
  }> {
    const config = await this.getTaxConfiguration();
    const taxRate = config.serviceTaxRate;

    if (!config.isActive) {
      return {
        taxExclusiveAmount: shippingCost,
        taxAmount: 0,
        taxInclusiveAmount: shippingCost,
        taxRate: 0,
      };
    }

    if (inclusive) {
      // Tax is already included in shipping cost
      const taxExclusiveAmount = shippingCost / (1 + taxRate);
      const taxAmount = shippingCost - taxExclusiveAmount;

      return {
        taxExclusiveAmount,
        taxAmount,
        taxInclusiveAmount: shippingCost,
        taxRate,
      };
    } else {
      // Tax needs to be added
      const taxAmount = shippingCost * taxRate;

      return {
        taxExclusiveAmount: shippingCost,
        taxAmount,
        taxInclusiveAmount: shippingCost + taxAmount,
        taxRate,
      };
    }
  }

  /**
   * Format tax amount for Malaysian currency
   */
  formatTaxAmount(amount: number): string {
    return `RM ${amount.toFixed(2)}`;
  }

  /**
   * Generate tax invoice line items
   */
  generateTaxInvoiceItems(breakdown: TaxBreakdown): Array<{
    description: string;
    amount: number;
    taxRate: number;
    taxAmount: number;
  }> {
    const items = [];

    if (breakdown.breakdown.productTax.taxableAmount > 0) {
      items.push({
        description: 'Products (Sales Tax)',
        amount: breakdown.breakdown.productTax.taxableAmount,
        taxRate: breakdown.breakdown.productTax.taxRate,
        taxAmount: breakdown.breakdown.productTax.taxAmount,
      });
    }

    if (breakdown.breakdown.shippingTax.taxableAmount > 0) {
      items.push({
        description: 'Shipping (Service Tax)',
        amount: breakdown.breakdown.shippingTax.taxableAmount,
        taxRate: breakdown.breakdown.shippingTax.taxRate,
        taxAmount: breakdown.breakdown.shippingTax.taxAmount,
      });
    }

    return items;
  }

  /**
   * Validate if business needs to register for SST
   */
  async shouldRegisterForSST(annualRevenue: number): Promise<boolean> {
    const config = await this.getTaxConfiguration();
    return annualRevenue >= config.threshold;
  }

  /**
   * Get tax registration requirements
   */
  getTaxRegistrationInfo(): {
    salesTaxThreshold: number;
    serviceTaxThreshold: number;
    registrationRequired: boolean;
    authority: string;
    website: string;
  } {
    return {
      salesTaxThreshold: 500000, // RM500,000 for sales tax
      serviceTaxThreshold: 500000, // RM500,000 for service tax
      registrationRequired: true,
      authority: 'Royal Malaysian Customs Department',
      website: 'https://gst.customs.gov.my/',
    };
  }

  /**
   * Update tax configuration
   */
  async updateTaxConfiguration(
    config: Partial<TaxConfiguration>
  ): Promise<void> {
    const currentConfig = await this.getTaxConfiguration();
    const updatedConfig = { ...currentConfig, ...config };

    await prisma.systemConfig.upsert({
      where: { key: 'malaysian_tax_config' },
      update: { value: JSON.stringify(updatedConfig) },
      create: {
        key: 'malaysian_tax_config',
        value: JSON.stringify(updatedConfig),
        type: 'JSON',
      },
    });

    // Clear cache
    this.taxConfig = null;
  }
}
