/**
 * Input Validation & Sanitization Utilities - Malaysian E-commerce Platform
 * Centralized validation functions for security and data integrity
 */

import { ValidationResult, FieldValidation, ValidationSchema } from '@/lib/types/api';

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    // Remove null bytes
    .replace(/\x00/g, '')
    // Remove potentially dangerous HTML/script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Limit length to prevent DoS
    .substring(0, 1000);
}

/**
 * Sanitize HTML content by allowing only safe tags
 */
export function sanitizeHtml(html: string, allowedTags: string[] = []): string {
  if (typeof html !== 'string') {
    return '';
  }

  const defaultAllowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'];
  const allowed = [...defaultAllowedTags, ...allowedTags];
  const tagRegex = new RegExp(`<(?!\/?(${allowed.join('|')})\s*\/?>)[^>]+>`, 'gi');
  
  return html.replace(tagRegex, '');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate Malaysian phone number
 */
export function isValidMalaysianPhone(phone: string): boolean {
  // Malaysian phone formats: +60xxxxxxxxx, 60xxxxxxxxx, 01xxxxxxxx, etc.
  const phoneRegex = /^(\+?6?0)?(1[0-9]{8,9}|[3-9][0-9]{7,8})$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
}

/**
 * Validate Malaysian postal code
 */
export function isValidMalaysianPostalCode(postalCode: string): boolean {
  const postalCodeRegex = /^[0-9]{5}$/;
  return postalCodeRegex.test(postalCode);
}

/**
 * Validate order number format
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  const orderRegex = /^ORD-\d{8}-[A-Z0-9]{4,8}$/;
  return orderRegex.test(orderNumber);
}

/**
 * Validate product SKU format
 */
export function isValidSku(sku: string): boolean {
  const skuRegex = /^[A-Z0-9]{3,20}$/;
  return skuRegex.test(sku);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate field based on validation rules
 */
export function validateField(value: any, validation: FieldValidation): string | null {
  // Required validation
  if (validation.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'This field is required';
  }
  
  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  
  const stringValue = String(value);
  
  // Length validations
  if (validation.minLength && stringValue.length < validation.minLength) {
    return `Must be at least ${validation.minLength} characters`;
  }
  
  if (validation.maxLength && stringValue.length > validation.maxLength) {
    return `Must be no more than ${validation.maxLength} characters`;
  }
  
  // Pattern validation
  if (validation.pattern && !validation.pattern.test(stringValue)) {
    return 'Invalid format';
  }
  
  // Custom validation
  if (validation.custom) {
    return validation.custom(value);
  }
  
  return null;
}

/**
 * Validate object against schema
 */
export function validateSchema(data: any, schema: ValidationSchema): ValidationResult {
  const errors: Record<string, string[]> = {};
  
  for (const [field, validation] of Object.entries(schema)) {
    const fieldError = validateField(data[field], validation);
    if (fieldError) {
      errors[field] = [fieldError];
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Common validation schemas
 */
export const validationSchemas = {
  email: {
    required: true,
    maxLength: 254,
    custom: (value: string) => isValidEmail(value) ? null : 'Invalid email format',
  },
  
  password: {
    required: true,
    custom: (value: string) => {
      const result = validatePassword(value);
      return result.isValid ? null : result.errors.join(', ');
    },
  },
  
  malaysianPhone: {
    required: true,
    custom: (value: string) => isValidMalaysianPhone(value) ? null : 'Invalid Malaysian phone number',
  },
  
  postalCode: {
    required: true,
    custom: (value: string) => isValidMalaysianPostalCode(value) ? null : 'Invalid postal code',
  },
  
  orderNumber: {
    required: true,
    custom: (value: string) => isValidOrderNumber(value) ? null : 'Invalid order number format',
  },
  
  productSku: {
    required: true,
    custom: (value: string) => isValidSku(value) ? null : 'Invalid SKU format',
  },
} as const;

/**
 * Escape special characters for safe output
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Check if string contains potentially malicious content
 */
export function containsMaliciousContent(input: string): boolean {
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\(/i,
    /document\.cookie/i,
    /window\.location/i,
    /alert\(/i,
  ];
  
  return maliciousPatterns.some(pattern => pattern.test(input));
}