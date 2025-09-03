/**
 * Product Form Configuration - JRM E-commerce Platform
 * Centralized configuration for product creation form steps
 * Following @CLAUDE.md principles - single source of truth, no hardcoding
 */

import { 
  Package, 
  DollarSign, 
  Settings, 
  Image as ImageIcon, 
  Zap 
} from 'lucide-react';

export interface ProductFormStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredFields: string[];
  optionalFields: string[];
}

/**
 * Centralized product form steps configuration
 * Single source of truth for all product creation flows
 */
export const PRODUCT_FORM_STEPS: ProductFormStep[] = [
  {
    id: 'basic',
    label: 'Basic Info',
    icon: Package,
    requiredFields: ['name', 'slug', 'sku', 'categoryIds'],
    optionalFields: ['shortDescription', 'description', 'barcode', 'weight', 'dimensions']
  },
  {
    id: 'pricing',
    label: 'Pricing',
    icon: DollarSign,
    requiredFields: ['regularPrice'],
    optionalFields: ['memberPrice', 'promotionalPrice', 'promotionStartDate', 'promotionEndDate']
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Settings,
    requiredFields: ['stockQuantity'],
    optionalFields: ['lowStockAlert', 'status', 'featured']
  },
  {
    id: 'media',
    label: 'Images',
    icon: ImageIcon,
    requiredFields: [],
    optionalFields: ['images']
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: Zap,
    requiredFields: [],
    optionalFields: ['memberOnlyUntil', 'earlyAccessStart', 'isQualifyingForMembership']
  }
];

/**
 * Tab error field mapping for validation
 * Centralizes which fields belong to which tabs for error handling
 */
export const TAB_ERROR_FIELDS = {
  basic: ['name', 'slug', 'sku', 'categoryIds', 'description', 'shortDescription', 'barcode'],
  pricing: ['regularPrice', 'memberPrice', 'promotionalPrice', 'promotionStartDate', 'promotionEndDate'],
  inventory: ['stockQuantity', 'lowStockAlert', 'status', 'featured'],
  media: ['images'],
  advanced: ['memberOnlyUntil', 'earlyAccessStart', 'isQualifyingForMembership']
};

/**
 * Get step completion status based on form data and errors
 */
export function getStepStatus(
  stepId: string, 
  formData: any, 
  errors: Record<string, string>
): 'pending' | 'active' | 'completed' | 'error' {
  const step = PRODUCT_FORM_STEPS.find(s => s.id === stepId);
  if (!step) return 'pending';

  // Check for errors first
  const stepErrorFields = TAB_ERROR_FIELDS[stepId as keyof typeof TAB_ERROR_FIELDS] || [];
  const hasErrors = stepErrorFields.some(field => errors[field]);
  
  if (hasErrors) {
    return 'error';
  }

  // Check if required fields are completed
  const requiredFieldsCompleted = step.requiredFields.every(field => {
    const value = formData[field];
    
    // Special handling for arrays (like categoryIds)
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    
    // Special handling for numbers
    if (field === 'regularPrice' || field === 'stockQuantity') {
      return value && parseFloat(value.toString()) > 0;
    }
    
    // General string/value check
    return value && value.toString().trim() !== '';
  });

  return requiredFieldsCompleted ? 'completed' : 'pending';
}

/**
 * Get the tab that should be active when there are validation errors
 */
export function getErrorTab(errors: Record<string, string>): string | null {
  const errorFields = Object.keys(errors);
  if (errorFields.length === 0) return null;

  // Find the first tab that has errors, prioritizing in step order
  for (const step of PRODUCT_FORM_STEPS) {
    const stepFields = TAB_ERROR_FIELDS[step.id as keyof typeof TAB_ERROR_FIELDS] || [];
    if (stepFields.some(field => errorFields.includes(field))) {
      return step.id;
    }
  }

  return PRODUCT_FORM_STEPS[0].id; // Default to first step
}

/**
 * Calculate overall completion percentage
 */
export function calculateCompletionPercentage(
  formData: any,
  errors: Record<string, string>
): number {
  let totalWeight = 0;
  let completedWeight = 0;

  PRODUCT_FORM_STEPS.forEach(step => {
    const stepWeight = step.requiredFields.length + (step.optionalFields.length * 0.5);
    totalWeight += stepWeight;

    // Count completed required fields
    const completedRequired = step.requiredFields.filter(field => {
      const value = formData[field];
      
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      
      if (field === 'regularPrice' || field === 'stockQuantity') {
        return value && parseFloat(value.toString()) > 0;
      }
      
      return value && value.toString().trim() !== '';
    }).length;

    // Count completed optional fields
    const completedOptional = step.optionalFields.filter(field => {
      const value = formData[field];
      
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      
      if (typeof value === 'number') {
        return value > 0;
      }
      
      return value && value.toString().trim() !== '';
    }).length;

    completedWeight += completedRequired + (completedOptional * 0.5);
  });

  return Math.round((completedWeight / totalWeight) * 100);
}

/**
 * Navigation helper to determine if step navigation is allowed
 */
export function canNavigateToStep(
  targetStepId: string,
  currentStepId: string,
  formData: any,
  errors: Record<string, string>
): boolean {
  const targetIndex = PRODUCT_FORM_STEPS.findIndex(step => step.id === targetStepId);
  const currentIndex = PRODUCT_FORM_STEPS.findIndex(step => step.id === currentStepId);
  
  // Allow going backwards
  if (targetIndex <= currentIndex) {
    return true;
  }

  // Allow going forward only if current step is completed
  const currentStepStatus = getStepStatus(currentStepId, formData, errors);
  return currentStepStatus === 'completed';
}

export default PRODUCT_FORM_STEPS;