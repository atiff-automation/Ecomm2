/**
 * Tax-Inclusive Shipping Calculator
 * Enhanced shipping calculator with Malaysian tax integration
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 6.1
 */

import { EasyParcelService } from './easyparcel-service';
import { MalaysianTaxService, ServiceTaxCategory } from '../tax/malaysian-tax-service';
import { businessShippingConfig } from '@/lib/config/business-shipping-config';

interface TaxInclusiveShippingRate {
  // Basic rate information
  courierId: string;
  courierName: string;
  serviceName: string;
  serviceType: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT';
  
  // Pricing breakdown
  basePrice: number;              // Price before tax
  taxAmount: number;              // Tax amount (SST)
  finalPrice: number;             // Total price including tax
  taxRate: number;                // Applied tax rate
  
  // Additional information
  estimatedDeliveryDays: number;
  deliveryGuarantee: boolean;
  insuranceIncluded: boolean;
  codAvailable: boolean;
  
  // Tax details
  taxBreakdown: {
    taxableAmount: number;
    taxDescription: string;
    taxCategory: ServiceTaxCategory;
  };
}

interface TaxInclusiveRateRequest {
  pickupAddress: {
    postcode: string;
    state: string;
    city: string;
  };
  deliveryAddress: {
    postcode: string;
    state: string;
    city: string;
  };
  parcel: {
    weight: number;
    length?: number;
    width?: number;
    height?: number;
    value: number;
  };
  serviceTypes?: string[];
  includeInsurance?: boolean;
  includeCOD?: boolean;
  displayTaxInclusive?: boolean;  // Whether to show tax-inclusive prices
}

export class TaxInclusiveShippingCalculator {
  private easyParcelService: EasyParcelService;
  private taxService: MalaysianTaxService;

  constructor() {
    this.easyParcelService = new EasyParcelService();
    this.taxService = MalaysianTaxService.getInstance();
  }

  /**
   * Calculate shipping rates with Malaysian tax inclusion
   */
  async calculateTaxInclusiveRates(request: TaxInclusiveRateRequest): Promise<TaxInclusiveShippingRate[]> {
    try {
      // Get business pickup address
      const businessPickupAddress = await businessShippingConfig.getPickupAddress();
      
      // Get base rates from EasyParcel using business pickup address
      const baseRates = await this.easyParcelService.calculateRates({
        pickup_address: {
          name: businessPickupAddress.name,
          phone: businessPickupAddress.phone,
          address_line_1: businessPickupAddress.address_line_1,
          address_line_2: businessPickupAddress.address_line_2,
          city: businessPickupAddress.city,
          state: businessPickupAddress.state,
          postcode: businessPickupAddress.postcode,
          country: businessPickupAddress.country
        },
        delivery_address: {
          name: 'Customer',
          phone: '+60123456789',
          address_line_1: 'Customer Address',
          city: request.deliveryAddress.city,
          state: request.deliveryAddress.state as any,
          postcode: request.deliveryAddress.postcode,
          country: 'MY'
        },
        parcel: {
          weight: request.parcel.weight,
          length: request.parcel.length,
          width: request.parcel.width,
          height: request.parcel.height,
          content: 'General merchandise',
          value: request.parcel.value,
          quantity: 1
        },
        service_types: request.serviceTypes,
        insurance: request.includeInsurance,
        cod: request.includeCOD
      });

      // Process each rate with tax calculations
      const taxInclusiveRates: TaxInclusiveShippingRate[] = [];

      for (const rate of baseRates.rates || []) {
        try {
          // Determine service tax category based on service type
          const taxCategory = this.determineServiceTaxCategory(rate.service_name, rate.courier_name);
          
          // Calculate tax for this shipping rate
          const taxCalculation = await this.taxService.calculateShippingTax(
            rate.price,
            false // Assume EasyParcel rates are tax-exclusive
          );

          // Determine service type
          const serviceType = this.determineServiceType(rate.service_name);

          // Build tax-inclusive rate
          const taxInclusiveRate: TaxInclusiveShippingRate = {
            courierId: rate.courier_id,
            courierName: rate.courier_name,
            serviceName: rate.service_name,
            serviceType,
            
            basePrice: taxCalculation.taxExclusiveAmount,
            taxAmount: taxCalculation.taxAmount,
            finalPrice: request.displayTaxInclusive !== false 
              ? taxCalculation.taxInclusiveAmount 
              : taxCalculation.taxExclusiveAmount,
            taxRate: taxCalculation.taxRate,
            
            estimatedDeliveryDays: rate.estimated_delivery_days || this.getEstimatedDeliveryDays(serviceType),
            deliveryGuarantee: rate.delivery_guarantee || false,
            insuranceIncluded: rate.insurance_included || false,
            codAvailable: rate.cod_available || false,
            
            taxBreakdown: {
              taxableAmount: taxCalculation.taxExclusiveAmount,
              taxDescription: `Service Tax (${(taxCalculation.taxRate * 100).toFixed(0)}%)`,
              taxCategory
            }
          };

          taxInclusiveRates.push(taxInclusiveRate);

        } catch (error) {
          console.error(`Error processing rate for ${rate.courier_name}:`, error);
          // Continue with other rates even if one fails
        }
      }

      // Sort by final price (ascending)
      taxInclusiveRates.sort((a, b) => a.finalPrice - b.finalPrice);

      return taxInclusiveRates;

    } catch (error) {
      console.error('Error calculating tax-inclusive shipping rates:', error);
      throw new Error('Failed to calculate shipping rates with tax');
    }
  }

  /**
   * Get recommended shipping option with tax breakdown
   */
  async getRecommendedOptionWithTax(request: TaxInclusiveRateRequest): Promise<{
    economy: TaxInclusiveShippingRate | null;
    standard: TaxInclusiveShippingRate | null;
    express: TaxInclusiveShippingRate | null;
    taxSummary: {
      averageTaxRate: number;
      totalTaxAmount: number;
      taxDescription: string;
    };
  }> {
    const rates = await this.calculateTaxInclusiveRates(request);

    if (rates.length === 0) {
      return {
        economy: null,
        standard: null,
        express: null,
        taxSummary: {
          averageTaxRate: 0,
          totalTaxAmount: 0,
          taxDescription: 'No rates available'
        }
      };
    }

    // Find best options by service type
    const economy = rates.find(r => r.serviceType === 'STANDARD') || rates[0];
    const standard = rates.find(r => r.serviceType === 'EXPRESS') || 
                    rates.find(r => r.estimatedDeliveryDays <= 3) || 
                    rates[Math.floor(rates.length / 2)];
    const express = rates.find(r => r.serviceType === 'OVERNIGHT') || 
                    rates.find(r => r.estimatedDeliveryDays <= 1) || 
                    rates[rates.length - 1];

    // Calculate tax summary
    const totalTaxAmount = rates.reduce((sum, rate) => sum + rate.taxAmount, 0);
    const averageTaxRate = totalTaxAmount > 0 
      ? rates.reduce((sum, rate) => sum + rate.taxRate, 0) / rates.length 
      : 0;

    return {
      economy,
      standard: standard !== economy ? standard : null,
      express: express !== standard && express !== economy ? express : null,
      taxSummary: {
        averageTaxRate,
        totalTaxAmount,
        taxDescription: `Malaysian Service Tax (${(averageTaxRate * 100).toFixed(1)}% average)`
      }
    };
  }

  /**
   * Calculate complete order shipping cost with tax
   */
  async calculateOrderShippingCost(params: {
    selectedRate: TaxInclusiveShippingRate;
    orderValue: number;
    freeShippingThreshold?: number;
  }): Promise<{
    shippingCost: number;
    taxAmount: number;
    totalCost: number;
    isFreeShipping: boolean;
    taxBreakdown: string;
  }> {
    const { selectedRate, orderValue, freeShippingThreshold = 0 } = params;

    // Check for free shipping
    const isFreeShipping = freeShippingThreshold > 0 && orderValue >= freeShippingThreshold;

    if (isFreeShipping) {
      return {
        shippingCost: 0,
        taxAmount: 0,
        totalCost: 0,
        isFreeShipping: true,
        taxBreakdown: 'Free shipping applied'
      };
    }

    return {
      shippingCost: selectedRate.basePrice,
      taxAmount: selectedRate.taxAmount,
      totalCost: selectedRate.finalPrice,
      isFreeShipping: false,
      taxBreakdown: selectedRate.taxBreakdown.taxDescription
    };
  }

  /**
   * Determine service tax category based on courier and service
   */
  private determineServiceTaxCategory(serviceName: string, courierName: string): ServiceTaxCategory {
    const service = serviceName.toLowerCase();
    const courier = courierName.toLowerCase();

    // Check for specific service types
    if (service.includes('insurance') || service.includes('protection')) {
      return ServiceTaxCategory.INSURANCE;
    }

    if (service.includes('warehouse') || service.includes('storage')) {
      return ServiceTaxCategory.WAREHOUSING;
    }

    if (service.includes('freight') || service.includes('cargo')) {
      return ServiceTaxCategory.FREIGHT;
    }

    // Default for most courier services
    return ServiceTaxCategory.LOGISTICS;
  }

  /**
   * Determine service type from service name
   */
  private determineServiceType(serviceName: string): 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' {
    const service = serviceName.toLowerCase();

    if (service.includes('overnight') || service.includes('next day') || service.includes('same day')) {
      return 'OVERNIGHT';
    }

    if (service.includes('express') || service.includes('priority') || service.includes('fast')) {
      return 'EXPRESS';
    }

    return 'STANDARD';
  }

  /**
   * Get estimated delivery days based on service type
   */
  private getEstimatedDeliveryDays(serviceType: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT'): number {
    switch (serviceType) {
      case 'OVERNIGHT':
        return 1;
      case 'EXPRESS':
        return 2;
      case 'STANDARD':
      default:
        return 5;
    }
  }

  /**
   * Format rate for display with tax information
   */
  formatRateDisplay(rate: TaxInclusiveShippingRate, showTaxBreakdown: boolean = true): {
    title: string;
    price: string;
    estimatedDelivery: string;
    taxInfo?: string;
  } {
    const title = `${rate.courierName} - ${rate.serviceName}`;
    const price = `RM ${rate.finalPrice.toFixed(2)}`;
    const estimatedDelivery = `${rate.estimatedDeliveryDays} ${rate.estimatedDeliveryDays === 1 ? 'day' : 'days'}`;
    
    let taxInfo;
    if (showTaxBreakdown && rate.taxAmount > 0) {
      taxInfo = `Includes RM ${rate.taxAmount.toFixed(2)} ${rate.taxBreakdown.taxDescription}`;
    }

    return {
      title,
      price,
      estimatedDelivery,
      taxInfo
    };
  }
}