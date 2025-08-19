/**
 * EasyParcel CSV Validation Utility
 * Validates CSV exports against EasyParcel requirements
 */

import { easyParcelCSVExporter, type OrderForExport } from './easyparcel-csv-exporter';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    requiredFieldsComplete: boolean;
    estimatedSuccessRate: number;
  };
}

export interface CSVValidationOptions {
  strictMode: boolean;
  checkBusinessProfile: boolean;
  validatePhoneFormat: boolean;
  validatePostalCodes: boolean;
  maxErrors: number;
}

export class EasyParcelCSVValidator {
  
  /**
   * Validate CSV export against EasyParcel requirements
   */
  static async validateCSVExport(
    orders: OrderForExport[],
    options: Partial<CSVValidationOptions> = {}
  ): Promise<ValidationResult> {
    const config: CSVValidationOptions = {
      strictMode: false,
      checkBusinessProfile: true,
      validatePhoneFormat: true,
      validatePostalCodes: true,
      maxErrors: 50,
      ...options
    };

    const errors: string[] = [];
    const warnings: string[] = [];
    let validRows = 0;
    let invalidRows = 0;

    // Check business profile configuration
    if (config.checkBusinessProfile) {
      try {
        const businessProfile = await easyParcelCSVExporter['businessProfile'];
        if (!businessProfile) {
          errors.push('Business profile not configured - required for sender information');
        }
      } catch (error) {
        errors.push('Failed to load business profile configuration');
      }
    }

    // Validate each order
    for (let i = 0; i < orders.length && errors.length < config.maxErrors; i++) {
      const order = orders[i];
      const orderErrors = this.validateSingleOrder(order, config);
      
      if (orderErrors.length > 0) {
        invalidRows++;
        errors.push(...orderErrors.map(err => `Order ${order.orderNumber}: ${err}`));
      } else {
        validRows++;
      }
    }

    // Generate warnings
    if (!config.strictMode && invalidRows > 0) {
      warnings.push(`${invalidRows} orders have validation issues but may still be processable`);
    }

    if (orders.length > 500) {
      warnings.push('Large export - consider splitting into smaller batches for better processing');
    }

    const totalRows = orders.length;
    const estimatedSuccessRate = totalRows > 0 ? (validRows / totalRows) * 100 : 0;
    const requiredFieldsComplete = invalidRows === 0;

    return {
      valid: config.strictMode ? requiredFieldsComplete : validRows > 0,
      errors,
      warnings,
      summary: {
        totalRows,
        validRows,
        invalidRows,
        requiredFieldsComplete,
        estimatedSuccessRate
      }
    };
  }

  /**
   * Validate a single order for CSV export
   */
  private static validateSingleOrder(order: OrderForExport, config: CSVValidationOptions): string[] {
    const errors: string[] = [];

    // Check required order fields
    if (!order.orderNumber) {
      errors.push('Order number is required');
    }

    if (!order.total || order.total <= 0) {
      errors.push('Order total must be greater than 0');
    }

    if (!order.orderItems || order.orderItems.length === 0) {
      errors.push('Order must have at least one item');
    }

    // Check shipping address
    if (!order.shippingAddress) {
      errors.push('Shipping address is required');
    } else {
      const addressErrors = this.validateAddress(order.shippingAddress, 'delivery', config);
      errors.push(...addressErrors);
    }

    // Check customer information
    const customerName = order.user?.name || 
                        (order.user?.firstName && order.user?.lastName ? 
                         `${order.user.firstName} ${order.user.lastName}` : '') ||
                        order.shippingAddress?.name;
    
    if (!customerName) {
      errors.push('Customer name is required');
    }

    const customerPhone = order.user?.phone || order.guestPhone;
    if (!customerPhone) {
      errors.push('Customer phone number is required');
    } else if (config.validatePhoneFormat) {
      const phoneErrors = this.validatePhoneNumber(customerPhone);
      errors.push(...phoneErrors);
    }

    // Check order items
    if (order.orderItems) {
      let totalWeight = 0;
      let hasValidItems = false;

      for (const item of order.orderItems) {
        if (!item.productName) {
          errors.push(`Item missing product name`);
        }

        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Invalid quantity for item ${item.productName}`);
        }

        if (!item.appliedPrice || item.appliedPrice <= 0) {
          errors.push(`Invalid price for item ${item.productName}`);
        }

        const itemWeight = (item.product.weight || 0.5) * item.quantity;
        totalWeight += itemWeight;
        hasValidItems = true;
      }

      if (!hasValidItems) {
        errors.push('No valid items found in order');
      }

      if (totalWeight > 70) {
        errors.push(`Total weight ${totalWeight}kg exceeds EasyParcel limit of 70kg`);
      }

      if (totalWeight <= 0) {
        errors.push('Total parcel weight must be greater than 0');
      }
    }

    return errors;
  }

  /**
   * Validate address information
   */
  private static validateAddress(
    address: OrderForExport['shippingAddress'], 
    type: string, 
    config: CSVValidationOptions
  ): string[] {
    const errors: string[] = [];

    if (!address) {
      errors.push(`${type} address is required`);
      return errors;
    }

    if (!address.addressLine1) {
      errors.push(`${type} address line 1 is required`);
    }

    if (!address.city) {
      errors.push(`${type} city is required`);
    }

    if (!address.state) {
      errors.push(`${type} state is required`);
    }

    if (!address.postalCode) {
      errors.push(`${type} postal code is required`);
    } else if (config.validatePostalCodes) {
      const postcodeErrors = this.validatePostalCode(address.postalCode);
      errors.push(...postcodeErrors.map(err => `${type} ${err}`));
    }

    // Validate Malaysian states
    if (address.state) {
      const validStates = [
        'Johor', 'JOH', 'Kedah', 'KDH', 'Kelantan', 'KTN',
        'Melaka', 'Malacca', 'MLK', 'Negeri Sembilan', 'NSN',
        'Pahang', 'PHG', 'Perak', 'PRK', 'Perlis', 'PLS',
        'Pulau Pinang', 'Penang', 'PNG', 'Kuala Lumpur', 'KUL',
        'Terengganu', 'TRG', 'Selangor', 'SEL', 'Sabah', 'SBH',
        'Sarawak', 'SWK', 'Labuan', 'LBN'
      ];

      if (!validStates.includes(address.state)) {
        errors.push(`${type} state "${address.state}" is not a valid Malaysian state`);
      }
    }

    return errors;
  }

  /**
   * Validate phone number format
   */
  private static validatePhoneNumber(phone: string): string[] {
    const errors: string[] = [];
    
    if (!phone) {
      errors.push('Phone number is required');
      return errors;
    }

    // Remove spaces and dashes for validation
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    // Malaysian phone number patterns
    const validPatterns = [
      /^(\+60|60)[0-9]{8,10}$/, // +60 or 60 prefix
      /^0[0-9]{8,10}$/, // Local format starting with 0
    ];

    const isValid = validPatterns.some(pattern => pattern.test(cleanPhone));
    
    if (!isValid) {
      errors.push('Invalid Malaysian phone number format (should be +60XXXXXXXXX or 0XXXXXXXXX)');
    }

    return errors;
  }

  /**
   * Validate postal code format
   */
  private static validatePostalCode(postcode: string): string[] {
    const errors: string[] = [];
    
    if (!postcode) {
      errors.push('postal code is required');
      return errors;
    }

    // Malaysian postal code should be 5 digits
    const postcodeRegex = /^\d{5}$/;
    
    if (!postcodeRegex.test(postcode)) {
      errors.push('postal code must be exactly 5 digits');
    }

    return errors;
  }

  /**
   * Generate validation report summary
   */
  static generateValidationReport(result: ValidationResult): string {
    const lines: string[] = [];
    
    lines.push('=== EasyParcel CSV Validation Report ===');
    lines.push('');
    lines.push(`Total Orders: ${result.summary.totalRows}`);
    lines.push(`Valid Orders: ${result.summary.validRows}`);
    lines.push(`Invalid Orders: ${result.summary.invalidRows}`);
    lines.push(`Success Rate: ${result.summary.estimatedSuccessRate.toFixed(1)}%`);
    lines.push(`Overall Status: ${result.valid ? 'PASS' : 'FAIL'}`);
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('ERRORS:');
      result.errors.forEach((error, index) => {
        lines.push(`${index + 1}. ${error}`);
      });
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('WARNINGS:');
      result.warnings.forEach((warning, index) => {
        lines.push(`${index + 1}. ${warning}`);
      });
      lines.push('');
    }

    if (result.valid) {
      lines.push('✅ CSV export is ready for EasyParcel bulk upload');
    } else {
      lines.push('❌ CSV export has issues that must be resolved');
      lines.push('   Please fix the errors above before uploading to EasyParcel');
    }

    return lines.join('\n');
  }

  /**
   * Quick validation for UI preview
   */
  static async quickValidate(orders: OrderForExport[]): Promise<{
    canExport: boolean;
    criticalIssues: number;
    warnings: number;
    message: string;
  }> {
    const result = await this.validateCSVExport(orders, {
      strictMode: false,
      maxErrors: 10
    });

    const criticalIssues = result.errors.length;
    const warnings = result.warnings.length;
    const canExport = result.summary.validRows > 0;

    let message = '';
    if (canExport) {
      if (criticalIssues === 0) {
        message = `Ready to export ${result.summary.totalRows} orders`;
      } else {
        message = `${result.summary.validRows}/${result.summary.totalRows} orders are valid`;
      }
    } else {
      message = 'Cannot export - critical issues found';
    }

    return {
      canExport,
      criticalIssues,
      warnings,
      message
    };
  }
}

// Export the validator
export const csvValidator = EasyParcelCSVValidator;