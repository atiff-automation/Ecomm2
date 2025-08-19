/**
 * EasyParcel CSV Export Service
 * Converts order data to EasyParcel bulk upload CSV format
 * Reference: EasyParcel_Bulk_Template[MY_9.12].xlsx specifications
 * 
 * DATA SOURCE MAPPING:
 * - SENDER INFO: Business Profile (Owner Data)
 * - RECEIVER INFO: Customer Order Data  
 * - PARCEL INFO: System Calculated from Order Items
 * - SERVICE OPTIONS: Business Courier Preferences
 * 
 * See: EASYPARCEL_CSV_HEADER_MAPPING.md for complete field mapping
 */

import { businessShippingConfig } from '@/lib/config/business-shipping-config';
import type { BusinessProfile } from '@/lib/config/business-shipping-config';
import { 
  getEasyParcelCategory, 
  getEasyParcelCourier, 
  getDefaultEasyParcelValues,
  type EasyParcelCategory,
  type EasyParcelCourier,
  type EasyParcelBooleanOption 
} from './easyparcel-dropdown-mappings';

// EasyParcel CSV field structure based on bulk template v9.12
export interface EasyParcelCSVRow {
  // Row identification
  no: number;
  category?: string;
  
  // Parcel Information
  parcel_content: string;
  parcel_value: number;
  weight: number;
  pick_up_date?: string;
  
  // Sender Information (Pickup Address)
  sender_name: string;
  sender_company?: string;
  sender_contact: string;
  sender_alt_contact?: string;
  sender_email?: string;
  sender_address: string;
  sender_postcode: string;
  sender_city: string;
  
  // Receiver Information (Delivery Address)
  receiver_name: string;
  receiver_company?: string;
  receiver_contact: string;
  receiver_alt_contact?: string;
  receiver_email?: string;
  receiver_address: string;
  receiver_postcode: string;
  receiver_city: string;
  
  // Service Options
  courier_company?: string;
  alternative_courier_company?: string;
  tracking_sms?: string;
  drop_off_at_courier_branch?: string;
  reference?: string;
  tracking_whatsapp?: string;
}

export interface OrderForExport {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  guestEmail?: string;
  guestPhone?: string;
  deliveryInstructions?: string;
  selectedCourierId?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  shippingAddress?: {
    name?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  orderItems: Array<{
    id: string;
    productName: string;
    productSku?: string;
    quantity: number;
    appliedPrice: number;
    product: {
      name: string;
      weight?: number;
      dimensions?: {
        length?: number;
        width?: number;
        height?: number;
      };
    };
  }>;
}

export interface CSVExportOptions {
  includeHeaders: boolean;
  filterByStatus?: string[];
  courierFilter?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  validateRequired: boolean;
}

export class EasyParcelCSVExporter {
  private businessProfile: BusinessProfile | null = null;

  constructor() {
    // Initialize with default profile immediately
    this.businessProfile = this.getDefaultBusinessProfile();
  }

  private async initializeBusinessProfile(): Promise<void> {
    try {
      console.log('[CSV Export] Initializing business profile...');
      const profile = await businessShippingConfig.getBusinessProfile();
      
      if (profile) {
        console.log('[CSV Export] Business profile loaded from config');
        this.businessProfile = profile;
      } else {
        console.log('[CSV Export] No business profile found, using default');
        this.businessProfile = this.getDefaultBusinessProfile();
      }
      
      console.log('[CSV Export] Business profile initialized:', {
        name: this.businessProfile?.businessName,
        hasPickupAddress: !!this.businessProfile?.pickupAddress
      });
    } catch (error) {
      console.error('[CSV Export] Error loading business profile:', error);
      this.businessProfile = this.getDefaultBusinessProfile();
    }
  }

  /**
   * Get default business profile for testing
   */
  private getDefaultBusinessProfile(): any {
    return {
      businessName: 'EcomJRM Store',
      contactPerson: 'Store Manager',
      contactPhone: '+60123456789',
      contactEmail: 'store@ecomjrm.com',
      pickupAddress: {
        name: 'EcomJRM Store',
        company: 'EcomJRM Sdn Bhd',
        phone: '+60123456789',
        email: 'store@ecomjrm.com',
        address_line_1: 'No. 123, Jalan Technology',
        address_line_2: 'Level 5, Tech Plaza',
        city: 'Kuala Lumpur',
        state: 'KUL',
        postcode: '50000',
        country: 'MY'
      },
      courierPreferences: {
        preferredCouriers: ['citylink'],
        defaultServiceType: 'STANDARD'
      },
      shippingPolicies: {
        freeShippingThreshold: 150
      },
      serviceSettings: {
        insuranceRequired: false,
        codEnabled: true
      }
    };
  }

  /**
   * Convert orders to EasyParcel CSV format
   */
  async exportOrdersToCSV(
    orders: OrderForExport[],
    options: CSVExportOptions = {
      includeHeaders: true,
      validateRequired: true
    }
  ): Promise<string> {
    // Ensure business profile is loaded
    await this.initializeBusinessProfile();

    if (!this.businessProfile) {
      throw new Error('Business profile not configured. Please set up business information first.');
    }

    const csvRows: EasyParcelCSVRow[] = [];
    const errors: string[] = [];
    let rowNumber = 1; // Start from 1 for proper sequence

    for (const order of orders) {
      try {
        const csvRow = await this.transformOrderToCSVRow(order, rowNumber);
        
        if (options.validateRequired) {
          const validation = this.validateCSVRow(csvRow, order.orderNumber);
          if (validation.errors.length > 0) {
            errors.push(...validation.errors);
            continue;
          }
        }
        
        csvRows.push(csvRow);
        rowNumber++; // Increment only for successful rows
      } catch (error) {
        errors.push(`Order ${order.orderNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0 && options.validateRequired) {
      throw new Error(`CSV Export validation failed:\n${errors.join('\n')}`);
    }

    return this.generateCSVString(csvRows, options.includeHeaders);
  }

  /**
   * Transform a single order to EasyParcel CSV row format
   */
  private async transformOrderToCSVRow(order: OrderForExport, rowNumber: number): Promise<EasyParcelCSVRow> {
    if (!this.businessProfile) {
      throw new Error('Business profile not available');
    }

    // Calculate parcel details from order items
    const parcelDetails = this.calculateParcelDetails(order.orderItems);
    
    // Get customer information
    const customerName = (order.user?.firstName && order.user?.lastName ? 
                         `${order.user.firstName} ${order.user.lastName}` : '') ||
                        order.shippingAddress?.name ||
                        'Customer';
    
    const customerPhone = order.user?.phone || order.guestPhone || '+60123456789'; // Default phone for testing
    const customerEmail = order.user?.email || order.guestEmail || '';
    
    // Build delivery address
    const deliveryAddress = order.shippingAddress;
    if (!deliveryAddress) {
      throw new Error('Shipping address is required');
    }

    // Map Malaysian state codes
    const deliveryState = this.mapToEasyParcelState(deliveryAddress.state);
    const pickupState = this.mapToEasyParcelState(this.businessProfile.pickupAddress.state);

    // Get EasyParcel category from order items
    const category = this.getOrderCategory(order.orderItems);
    
    // Get default EasyParcel values
    const defaults = getDefaultEasyParcelValues();

    const csvRow: EasyParcelCSVRow = {
      // Row identification - Sequential numbering
      no: rowNumber,
      category: category,
      
      // Parcel Information
      parcel_content: parcelDetails.content,
      parcel_value: parcelDetails.value,
      weight: parcelDetails.weight,
      pick_up_date: this.getPickupDate(),
      
      // Sender Information (from business profile)
      sender_name: this.businessProfile.pickupAddress.name,
      sender_company: this.businessProfile.businessName,
      sender_contact: this.businessProfile.pickupAddress.phone,
      sender_alt_contact: this.businessProfile.contactPhone,
      sender_email: this.businessProfile.contactEmail,
      sender_address: this.buildFullAddress(
        this.businessProfile.pickupAddress.address_line_1,
        this.businessProfile.pickupAddress.address_line_2
      ),
      sender_postcode: this.businessProfile.pickupAddress.postcode,
      sender_city: this.businessProfile.pickupAddress.city,
      
      // Receiver Information
      receiver_name: customerName,
      receiver_company: order.shippingAddress?.name !== customerName ? order.shippingAddress?.name : undefined,
      receiver_contact: customerPhone,
      receiver_alt_contact: undefined,
      receiver_email: customerEmail,
      receiver_address: this.buildFullAddress(deliveryAddress.addressLine1, deliveryAddress.addressLine2),
      receiver_postcode: deliveryAddress.postalCode,
      receiver_city: deliveryAddress.city,
      
      // Service Options - Using EasyParcel official dropdown values
      courier_company: this.getEasyParcelCourierName(order.selectedCourierId),
      alternative_courier_company: this.getAlternativeCourier(),
      tracking_sms: defaults.trackingSms,
      drop_off_at_courier_branch: defaults.dropOffAtBranch,
      reference: order.orderNumber,
      tracking_whatsapp: defaults.trackingWhatsapp
    };

    return csvRow;
  }

  /**
   * Calculate parcel details from order items
   */
  private calculateParcelDetails(orderItems: OrderForExport['orderItems']) {
    let totalWeight = 0;
    let totalValue = 0;
    const contents: string[] = [];
    let maxDimensions = { length: 0, width: 0, height: 0 };

    for (const item of orderItems) {
      // Calculate weight
      const itemWeight = (item.product.weight || 0.5) * item.quantity; // Default 0.5kg if not specified
      totalWeight += itemWeight;

      // Calculate value
      totalValue += item.appliedPrice * item.quantity;

      // Collect content descriptions
      contents.push(`${item.productName} x${item.quantity}`);

      // Calculate maximum dimensions
      if (item.product.dimensions) {
        const dims = item.product.dimensions;
        maxDimensions.length = Math.max(maxDimensions.length, dims.length || 0);
        maxDimensions.width = Math.max(maxDimensions.width, dims.width || 0);
        maxDimensions.height = Math.max(maxDimensions.height, dims.height || 0);
      }
    }

    return {
      weight: Math.max(0.1, totalWeight), // Minimum 0.1kg
      dimensions: maxDimensions.length > 0 ? maxDimensions : undefined,
      content: contents.join(', ').substring(0, 100), // EasyParcel content limit
      value: totalValue
    };
  }

  /**
   * Map Malaysian state names to EasyParcel state codes
   */
  private mapToEasyParcelState(state: string): string {
    const stateMapping: Record<string, string> = {
      'Johor': 'joh', 'JOH': 'joh',
      'Kedah': 'kdh', 'KDH': 'kdh',
      'Kelantan': 'ktn', 'KTN': 'ktn',
      'Melaka': 'mlk', 'Malacca': 'mlk', 'MLK': 'mlk',
      'Negeri Sembilan': 'nsn', 'NSN': 'nsn',
      'Pahang': 'phg', 'PHG': 'phg',
      'Perak': 'prk', 'PRK': 'prk',
      'Perlis': 'pls', 'PLS': 'pls',
      'Pulau Pinang': 'png', 'Penang': 'png', 'PNG': 'png',
      'Kuala Lumpur': 'kul', 'KUL': 'kul',
      'Terengganu': 'trg', 'TRG': 'trg',
      'Selangor': 'sel', 'SEL': 'sel',
      'Sabah': 'sbh', 'SBH': 'sbh',
      'Sarawak': 'swk', 'SWK': 'swk',
      'Labuan': 'lbn', 'LBN': 'lbn'
    };

    return stateMapping[state] || state.toLowerCase();
  }

  /**
   * Build full address string
   */
  private buildFullAddress(line1: string, line2?: string): string {
    return line2 ? `${line1}, ${line2}` : line1;
  }

  /**
   * Get EasyParcel category from order items
   */
  private getOrderCategory(orderItems: OrderForExport['orderItems']): EasyParcelCategory {
    if (!orderItems || orderItems.length === 0) {
      return getDefaultEasyParcelValues().category;
    }

    // Try to determine category from first product
    const firstProduct = orderItems[0];
    return getEasyParcelCategory(
      undefined, // We don't have product category in the current schema
      firstProduct.productName,
      getDefaultEasyParcelValues().category
    );
  }

  /**
   * Get EasyParcel courier name from courier ID or business preferences
   */
  private getEasyParcelCourierName(selectedCourierId?: string): EasyParcelCourier {
    // If order has specific courier selected
    if (selectedCourierId) {
      return getEasyParcelCourier(selectedCourierId);
    }

    // Use business preferred courier
    if (this.businessProfile?.courierPreferences.preferredCouriers.length) {
      const preferredCourier = this.businessProfile.courierPreferences.preferredCouriers[0];
      return getEasyParcelCourier(preferredCourier);
    }

    // Default fallback
    return getDefaultEasyParcelValues().courier;
  }

  /**
   * Get alternative courier from business preferences
   */
  private getAlternativeCourier(): EasyParcelCourier | undefined {
    if (this.businessProfile?.courierPreferences.preferredCouriers.length > 1) {
      const alternateCourier = this.businessProfile.courierPreferences.preferredCouriers[1];
      return getEasyParcelCourier(alternateCourier);
    }
    return undefined;
  }

  /**
   * Get courier preference from business settings (deprecated - kept for compatibility)
   */
  private getCourierPreference(selectedCourierId?: string): string {
    return this.getEasyParcelCourierName(selectedCourierId);
  }

  /**
   * Get pickup date (next business day)
   */
  private getPickupDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Skip weekends if it's a weekend
    if (tomorrow.getDay() === 0) { // Sunday
      tomorrow.setDate(tomorrow.getDate() + 1);
    } else if (tomorrow.getDay() === 6) { // Saturday
      tomorrow.setDate(tomorrow.getDate() + 2);
    }
    
    return tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Get service type from business settings
   */
  private getServiceType(): string {
    if (this.businessProfile?.courierPreferences.defaultServiceType) {
      return this.businessProfile.courierPreferences.defaultServiceType.toLowerCase();
    }
    return 'standard';
  }

  /**
   * Get insurance option
   */
  private getInsuranceOption(value: number): string {
    if (this.businessProfile?.serviceSettings.insuranceRequired) {
      return 'yes';
    }
    return value > 100 ? 'yes' : 'no'; // Auto-insure if value > RM100
  }

  /**
   * Get COD amount if applicable
   */
  private getCODAmount(order: OrderForExport): number | undefined {
    if (order.paymentStatus === 'PENDING' && this.businessProfile?.serviceSettings.codEnabled) {
      return parseFloat(order.total.toString());
    }
    return undefined;
  }

  /**
   * Build remarks field
   */
  private buildRemarks(order: OrderForExport): string {
    const remarks: string[] = [];
    
    if (order.deliveryInstructions) {
      remarks.push(order.deliveryInstructions);
    }
    
    remarks.push(`Order: ${order.orderNumber}`);
    
    if (order.user) {
      remarks.push(`Customer: ${order.user.email}`);
    } else if (order.guestEmail) {
      remarks.push(`Guest: ${order.guestEmail}`);
    }

    return remarks.join(' | ').substring(0, 200); // Limit length
  }

  /**
   * Validate CSV row for required fields
   */
  private validateCSVRow(row: EasyParcelCSVRow, orderRef: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required sender fields
    if (!row.sender_name) errors.push(`${orderRef}: Sender name is required`);
    if (!row.sender_contact) errors.push(`${orderRef}: Sender mobile is required`);
    if (!row.sender_address) errors.push(`${orderRef}: Sender address is required`);
    if (!row.sender_city) errors.push(`${orderRef}: Sender city is required`);
    if (!row.sender_postcode) errors.push(`${orderRef}: Sender postal code is required`);

    // Required receiver fields
    if (!row.receiver_name) errors.push(`${orderRef}: Receiver name is required`);
    if (!row.receiver_contact) errors.push(`${orderRef}: Receiver mobile is required`);
    if (!row.receiver_address) errors.push(`${orderRef}: Receiver address is required`);
    if (!row.receiver_city) errors.push(`${orderRef}: Receiver city is required`);
    if (!row.receiver_postcode) errors.push(`${orderRef}: Receiver postal code is required`);

    // Required parcel fields
    if (!row.weight || row.weight <= 0) errors.push(`${orderRef}: Parcel weight is required and must be > 0`);
    if (!row.parcel_content) errors.push(`${orderRef}: Parcel content description is required`);
    if (!row.parcel_value || row.parcel_value <= 0) errors.push(`${orderRef}: Parcel value is required and must be > 0`);
    if (!row.reference) errors.push(`${orderRef}: Reference number is required`);

    // Validate phone number format
    const phoneRegex = /^(\+60|60|0)[0-9]{8,10}$/;
    if (row.sender_contact && !phoneRegex.test(row.sender_contact.replace(/[\s-]/g, ''))) {
      errors.push(`${orderRef}: Invalid sender phone format`);
    }
    if (row.receiver_contact && !phoneRegex.test(row.receiver_contact.replace(/[\s-]/g, ''))) {
      errors.push(`${orderRef}: Invalid receiver phone format`);
    }

    // Validate postal codes (5 digits)
    const postcodeRegex = /^\d{5}$/;
    if (row.sender_postcode && !postcodeRegex.test(row.sender_postcode)) {
      errors.push(`${orderRef}: Invalid sender postal code format`);
    }
    if (row.receiver_postcode && !postcodeRegex.test(row.receiver_postcode)) {
      errors.push(`${orderRef}: Invalid receiver postal code format`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate CSV string from rows
   */
  private generateCSVString(rows: EasyParcelCSVRow[], includeHeaders: boolean = true): string {
    // Headers exactly matching EasyParcel_Bulk_Template[MY_9.12].xlsx
    const headers = [
      'No*', 'Category', 'Parcel Content*', 'Parcel Value (RM)*', 'Weight (kg)*', 'Pick Up Date*',
      'Sender Name*', 'Sender Company', 'Sender Contact*', 'Sender Alt Contact', 'Sender Email', 
      'Sender Address*', 'Sender Postcode*', 'Sender City*',
      'Receiver Name*', 'Receiver Company', 'Receiver Contact*', 'Receiver Alt Contact', 'Receiver Email',
      'Receiver Address*', 'Receiver Postcode*', 'Receiver City*',
      'Courier Company', 'Alternative Courier Company', 'Tracking SMS', 'Drop Off At Courier Branch',
      'Reference', 'Tracking Whatsapp'
    ];

    const csvLines: string[] = [];

    if (includeHeaders) {
      csvLines.push(headers.join(','));
    }

    // Mapping between user-friendly headers and data properties
    const headerMapping = [
      'no', 'category', 'parcel_content', 'parcel_value', 'weight', 'pick_up_date',
      'sender_name', 'sender_company', 'sender_contact', 'sender_alt_contact', 'sender_email',
      'sender_address', 'sender_postcode', 'sender_city',
      'receiver_name', 'receiver_company', 'receiver_contact', 'receiver_alt_contact', 'receiver_email',
      'receiver_address', 'receiver_postcode', 'receiver_city',
      'courier_company', 'alternative_courier_company', 'tracking_sms', 'drop_off_at_courier_branch',
      'reference', 'tracking_whatsapp'
    ];

    for (const row of rows) {
      const values = headerMapping.map(propertyName => {
        const value = row[propertyName as keyof EasyParcelCSVRow];
        
        if (value === undefined || value === null) {
          return '';
        }
        
        // Handle string values that might contain commas, quotes, or newlines
        if (typeof value === 'string') {
          const stringValue = value.toString();
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }
        
        return value.toString();
      });

      csvLines.push(values.join(','));
    }

    return csvLines.join('\n');
  }

  /**
   * Get CSV headers for reference - matches EasyParcel_Bulk_Template[MY_9.12].xlsx exactly
   */
  static getCSVHeaders(): string[] {
    return [
      'No*', 'Category', 'Parcel Content*', 'Parcel Value (RM)*', 'Weight (kg)*', 'Pick Up Date*',
      'Sender Name*', 'Sender Company', 'Sender Contact*', 'Sender Alt Contact', 'Sender Email', 
      'Sender Address*', 'Sender Postcode*', 'Sender City*',
      'Receiver Name*', 'Receiver Company', 'Receiver Contact*', 'Receiver Alt Contact', 'Receiver Email',
      'Receiver Address*', 'Receiver Postcode*', 'Receiver City*',
      'Courier Company', 'Alternative Courier Company', 'Tracking SMS', 'Drop Off At Courier Branch',
      'Reference', 'Tracking Whatsapp'
    ];
  }

  /**
   * Preview CSV data without generating full CSV
   */
  async previewCSVData(orders: OrderForExport[], limit: number = 5): Promise<{
    preview: EasyParcelCSVRow[];
    totalOrders: number;
    estimatedSize: string;
    validationIssues: string[];
  }> {
    await this.initializeBusinessProfile();
    
    const previewOrders = orders.slice(0, limit);
    const previewRows: EasyParcelCSVRow[] = [];
    const validationIssues: string[] = [];

    let rowNumber = 1;
    for (const order of previewOrders) {
      try {
        const row = await this.transformOrderToCSVRow(order, rowNumber);
        const validation = this.validateCSVRow(row, order.orderNumber);
        
        if (validation.errors.length > 0) {
          validationIssues.push(...validation.errors);
        }
        
        previewRows.push(row);
        rowNumber++;
      } catch (error) {
        validationIssues.push(`Order ${order.orderNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Estimate total CSV size
    const sampleCSV = this.generateCSVString(previewRows, true);
    const avgRowSize = sampleCSV.length / (previewRows.length + 1); // +1 for header
    const estimatedTotalSize = (avgRowSize * (orders.length + 1)) / 1024; // KB

    return {
      preview: previewRows,
      totalOrders: orders.length,
      estimatedSize: estimatedTotalSize > 1024 
        ? `${(estimatedTotalSize / 1024).toFixed(2)} MB`
        : `${estimatedTotalSize.toFixed(2)} KB`,
      validationIssues
    };
  }
}

// Export singleton instance
export const easyParcelCSVExporter = new EasyParcelCSVExporter();