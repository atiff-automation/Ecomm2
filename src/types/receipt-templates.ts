/**
 * Receipt Template Types and Interfaces
 * Centralized type definitions for the receipt template system
 */

export type ReceiptTemplateType =
  | 'THERMAL_RECEIPT'
  | 'BUSINESS_INVOICE'
  | 'MINIMAL_RECEIPT'
  | 'DETAILED_INVOICE';

export interface TemplateLayoutConfig {
  pageSize: 'A4' | 'THERMAL' | 'LETTER';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  width?: number; // For thermal receipts
}

export interface TemplateColorConfig {
  primary: string;
  secondary: string;
  text: string;
  accent: string;
  background: string;
}

export interface TemplateTypographyConfig {
  fontFamily: string;
  fontSize: {
    normal: number;
    small: number;
    large: number;
    title: number;
  };
}

export interface TemplateSectionConfig {
  header: {
    enabled: boolean;
    showLogo: boolean;
    showCompanyInfo: boolean;
    alignment: 'left' | 'center' | 'right';
  };
  customer: {
    enabled: boolean;
    showMemberBadge: boolean;
    showBillingAddress: boolean;
  };
  items: {
    enabled: boolean;
    showSKU: boolean;
    showDescription: boolean;
  };
  totals: {
    enabled: boolean;
    showTaxBreakdown: boolean;
    showDiscount: boolean;
  };
  footer: {
    enabled: boolean;
    message: string;
    showGeneratedDate: boolean;
  };
}

export interface ReceiptTemplateContent {
  templateType: ReceiptTemplateType;
  layout: TemplateLayoutConfig;
  colors: TemplateColorConfig;
  typography: TemplateTypographyConfig;
  sections: TemplateSectionConfig;
  customCSS?: string;
  variables?: Record<string, any>;
}

export interface ReceiptTemplate {
  id: string;
  name: string;
  description?: string;
  templateType: ReceiptTemplateType;
  templateContent: ReceiptTemplateContent;
  isDefault: boolean;
  isActive: boolean;
  previewImage?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface CreateReceiptTemplateInput {
  name: string;
  description?: string;
  templateType: ReceiptTemplateType;
  templateContent: ReceiptTemplateContent;
  isDefault?: boolean;
  isActive?: boolean;
  previewImage?: string;
}

export interface UpdateReceiptTemplateInput {
  name?: string;
  description?: string;
  templateContent?: ReceiptTemplateContent;
  isDefault?: boolean;
  isActive?: boolean;
  previewImage?: string;
}

export interface TemplateRenderOptions {
  format: 'html' | 'pdf';
  includeStyles: boolean;
  inlineStyles: boolean;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

export interface SystemConfigKeys {
  RECEIPT_DEFAULT_TEMPLATE_ID: string;
  RECEIPT_COMPANY_LOGO_ENABLED: string;
  RECEIPT_FOOTER_MESSAGE: string;
}

export const TEMPLATE_TYPE_LABELS: Record<ReceiptTemplateType, string> = {
  THERMAL_RECEIPT: 'Thermal Receipt',
  BUSINESS_INVOICE: 'Business Invoice',
  MINIMAL_RECEIPT: 'Minimal Receipt',
  DETAILED_INVOICE: 'Detailed Invoice',
};

export const DEFAULT_TEMPLATE_CONFIGS: Record<
  ReceiptTemplateType,
  ReceiptTemplateContent
> = {
  THERMAL_RECEIPT: {
    templateType: 'THERMAL_RECEIPT',
    layout: {
      pageSize: 'THERMAL',
      width: 400,
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    colors: {
      primary: '#000000',
      secondary: '#666666',
      text: '#333333',
      accent: '#000000',
      background: '#ffffff',
    },
    typography: {
      fontFamily: 'Courier New, monospace',
      fontSize: { normal: 12, small: 10, large: 14, title: 16 },
    },
    sections: {
      header: {
        enabled: true,
        showLogo: false,
        showCompanyInfo: true,
        alignment: 'center',
      },
      customer: {
        enabled: true,
        showMemberBadge: true,
        showBillingAddress: false,
      },
      items: { enabled: true, showSKU: true, showDescription: false },
      totals: { enabled: true, showTaxBreakdown: true, showDiscount: true },
      footer: {
        enabled: true,
        message: 'Thank you for your business!',
        showGeneratedDate: true,
      },
    },
  },
  BUSINESS_INVOICE: {
    templateType: 'BUSINESS_INVOICE',
    layout: {
      pageSize: 'A4',
      margins: { top: 48, right: 48, bottom: 48, left: 48 },
    },
    colors: {
      primary: '#1F2937',
      secondary: '#F9FAFB',
      text: '#374151',
      accent: '#6B7280',
      background: '#ffffff',
    },
    typography: {
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: { normal: 14, small: 12, large: 16, title: 24 },
    },
    sections: {
      header: {
        enabled: true,
        showLogo: true,
        showCompanyInfo: true,
        alignment: 'left',
      },
      customer: {
        enabled: true,
        showMemberBadge: true,
        showBillingAddress: true,
      },
      items: { enabled: true, showSKU: true, showDescription: true },
      totals: { enabled: true, showTaxBreakdown: true, showDiscount: true },
      footer: {
        enabled: true,
        message: 'Thank you for your business',
        showGeneratedDate: true,
      },
    },
  },
  MINIMAL_RECEIPT: {
    templateType: 'MINIMAL_RECEIPT',
    layout: {
      pageSize: 'A4',
      margins: { top: 40, right: 40, bottom: 40, left: 40 },
    },
    colors: {
      primary: '#111827',
      secondary: '#F3F4F6',
      text: '#4B5563',
      accent: '#9CA3AF',
      background: '#ffffff',
    },
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: { normal: 14, small: 12, large: 16, title: 20 },
    },
    sections: {
      header: {
        enabled: true,
        showLogo: true,
        showCompanyInfo: true,
        alignment: 'center',
      },
      customer: {
        enabled: true,
        showMemberBadge: false,
        showBillingAddress: false,
      },
      items: { enabled: true, showSKU: false, showDescription: false },
      totals: { enabled: true, showTaxBreakdown: false, showDiscount: true },
      footer: { enabled: true, message: 'Thank you', showGeneratedDate: false },
    },
  },
  DETAILED_INVOICE: {
    templateType: 'DETAILED_INVOICE',
    layout: {
      pageSize: 'A4',
      margins: { top: 56, right: 56, bottom: 56, left: 56 },
    },
    colors: {
      primary: '#1E293B',
      secondary: '#F8FAFC',
      text: '#475569',
      accent: '#64748B',
      background: '#ffffff',
    },
    typography: {
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: { normal: 14, small: 12, large: 16, title: 26 },
    },
    sections: {
      header: {
        enabled: true,
        showLogo: true,
        showCompanyInfo: true,
        alignment: 'left',
      },
      customer: {
        enabled: true,
        showMemberBadge: true,
        showBillingAddress: true,
      },
      items: { enabled: true, showSKU: true, showDescription: true },
      totals: { enabled: true, showTaxBreakdown: true, showDiscount: true },
      footer: {
        enabled: true,
        message: 'Please retain this invoice for your records',
        showGeneratedDate: true,
      },
    },
  },
};
