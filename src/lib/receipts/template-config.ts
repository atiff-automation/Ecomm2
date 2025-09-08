/**
 * Centralized Template Configuration
 * Single source of truth for all template display metadata
 */

import { ReceiptTemplateType } from '@/types/receipt-templates';

export interface TemplateDisplayConfig {
  icon: string;
  gradient: string;
  description: string;
  useCase: string;
  features: string[];
  category: 'retail' | 'business' | 'minimal' | 'detailed';
  popularityRank: number;
}

export const TEMPLATE_DISPLAY_CONFIG: Record<ReceiptTemplateType, TemplateDisplayConfig> = {
  THERMAL_RECEIPT: {
    icon: 'Receipt',
    gradient: 'bg-gray-100',
    description: 'Compact format optimized for thermal printers',
    useCase: 'Perfect for retail stores, cafes, and POS systems',
    features: ['Thermal printer optimized', 'Compact layout', 'Essential info only'],
    category: 'retail',
    popularityRank: 2
  },
  BUSINESS_INVOICE: {
    icon: 'FileText',
    gradient: 'bg-blue-50',
    description: 'Professional invoice format for business documentation',
    useCase: 'Ideal for B2B transactions and service providers',
    features: ['Professional branding', 'Detailed billing', 'Tax compliance'],
    category: 'business',
    popularityRank: 1
  },
  MINIMAL_RECEIPT: {
    icon: 'FileCheck',
    gradient: 'bg-green-50',
    description: 'Clean and modern design with essential information',
    useCase: 'Best for modern retail and mobile commerce',
    features: ['Modern design', 'Mobile optimized', 'Clean layout'],
    category: 'minimal',
    popularityRank: 3
  },
  DETAILED_INVOICE: {
    icon: 'FileBarChart',
    gradient: 'bg-purple-50',
    description: 'Comprehensive invoice with full tax and billing details',
    useCase: 'Perfect for tax compliance and detailed billing',
    features: ['Full tax breakdown', 'Detailed billing', 'Compliance ready'],
    category: 'detailed',
    popularityRank: 4
  }
};

export const TEMPLATE_CATEGORIES = {
  retail: {
    name: 'Retail & POS',
    description: 'Quick transactions and customer receipts',
    color: 'text-slate-600'
  },
  business: {
    name: 'Business & B2B',
    description: 'Professional invoicing and documentation',
    color: 'text-blue-600'
  },
  minimal: {
    name: 'Modern & Clean',
    description: 'Contemporary design for modern businesses',
    color: 'text-green-600'
  },
  detailed: {
    name: 'Comprehensive',
    description: 'Full-featured with complete information',
    color: 'text-purple-600'
  }
} as const;

/**
 * Get template display configuration
 */
export function getTemplateConfig(templateType: ReceiptTemplateType): TemplateDisplayConfig {
  return TEMPLATE_DISPLAY_CONFIG[templateType];
}

/**
 * Get all templates sorted by popularity
 */
export function getTemplatesByPopularity(): Array<{ type: ReceiptTemplateType; config: TemplateDisplayConfig }> {
  return Object.entries(TEMPLATE_DISPLAY_CONFIG)
    .map(([type, config]) => ({ type: type as ReceiptTemplateType, config }))
    .sort((a, b) => a.config.popularityRank - b.config.popularityRank);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string) {
  return Object.entries(TEMPLATE_DISPLAY_CONFIG)
    .filter(([_, config]) => config.category === category)
    .map(([type, config]) => ({ type: type as ReceiptTemplateType, config }));
}