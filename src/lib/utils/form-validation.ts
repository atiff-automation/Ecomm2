/**
 * Form Validation Utilities - Malaysian E-commerce Platform
 * Comprehensive form validation with error handling
 */

import { z } from 'zod';

// Common validation patterns
export const ValidationPatterns = {
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  phone: /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/, // Malaysian phone format
  postalCode: /^[0-9]{5}$/, // Malaysian postal code
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  currency: /^\d+(\.\d{1,2})?$/,
  positiveNumber: /^\d*\.?\d+$/,
  integer: /^\d+$/,
} as const;

// Error messages
export const ValidationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid Malaysian phone number (e.g., 01X-XXXXXXX)',
  postalCode: 'Please enter a valid 5-digit postal code',
  password: 'Password must be at least 8 characters with uppercase, lowercase, number and special character',
  passwordConfirm: 'Passwords do not match',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  min: (min: number) => `Must be at least ${min}`,
  max: (max: number) => `Must be no more than ${max}`,
  slug: 'Only lowercase letters, numbers and hyphens allowed',
  currency: 'Please enter a valid amount (e.g., 99.99)',
  positiveNumber: 'Must be a positive number',
  integer: 'Must be a whole number',
  url: 'Please enter a valid URL',
  date: 'Please enter a valid date',
  future: 'Date must be in the future',
  past: 'Date must be in the past',
  fileSize: (maxMB: number) => `File must be smaller than ${maxMB}MB`,
  fileType: (types: string[]) => `File must be one of: ${types.join(', ')}`,
} as const;

// Validation functions
export function validateEmail(email: string): boolean {
  return ValidationPatterns.email.test(email);
}

export function validatePhone(phone: string): boolean {
  return ValidationPatterns.phone.test(phone);
}

export function validatePassword(password: string): boolean {
  return ValidationPatterns.password.test(password);
}

export function validatePostalCode(code: string): boolean {
  return ValidationPatterns.postalCode.test(code);
}

export function validateSlug(slug: string): boolean {
  return ValidationPatterns.slug.test(slug);
}

export function validateCurrency(amount: string): boolean {
  return ValidationPatterns.currency.test(amount);
}

export function validateRequired(value: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== null && value !== undefined;
}

export function validateMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

export function validateMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

export function validateMin(value: number, min: number): boolean {
  return value >= min;
}

export function validateMax(value: number, max: number): boolean {
  return value <= max;
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateFutureDate(date: Date): boolean {
  return date > new Date();
}

export function validatePastDate(date: Date): boolean {
  return date < new Date();
}

export function validateFileSize(file: File, maxSizeMB: number): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Field validation result
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  value?: any;
}

// Form validation result
export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  validatedData?: Record<string, any>;
}

// Validation rule type
export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'password' | 'minLength' | 'maxLength' | 'min' | 'max' | 'slug' | 'currency' | 'url' | 'date' | 'future' | 'past' | 'custom';
  message?: string;
  value?: any;
  validator?: (value: any) => boolean;
}

// Field validator class
export class FieldValidator {
  private rules: ValidationRule[] = [];

  required(message?: string): FieldValidator {
    this.rules.push({
      type: 'required',
      message: message || ValidationMessages.required,
    });
    return this;
  }

  email(message?: string): FieldValidator {
    this.rules.push({
      type: 'email',
      message: message || ValidationMessages.email,
    });
    return this;
  }

  phone(message?: string): FieldValidator {
    this.rules.push({
      type: 'phone',
      message: message || ValidationMessages.phone,
    });
    return this;
  }

  password(message?: string): FieldValidator {
    this.rules.push({
      type: 'password',
      message: message || ValidationMessages.password,
    });
    return this;
  }

  minLength(min: number, message?: string): FieldValidator {
    this.rules.push({
      type: 'minLength',
      value: min,
      message: message || ValidationMessages.minLength(min),
    });
    return this;
  }

  maxLength(max: number, message?: string): FieldValidator {
    this.rules.push({
      type: 'maxLength',
      value: max,
      message: message || ValidationMessages.maxLength(max),
    });
    return this;
  }

  min(min: number, message?: string): FieldValidator {
    this.rules.push({
      type: 'min',
      value: min,
      message: message || ValidationMessages.min(min),
    });
    return this;
  }

  max(max: number, message?: string): FieldValidator {
    this.rules.push({
      type: 'max',
      value: max,
      message: message || ValidationMessages.max(max),
    });
    return this;
  }

  slug(message?: string): FieldValidator {
    this.rules.push({
      type: 'slug',
      message: message || ValidationMessages.slug,
    });
    return this;
  }

  currency(message?: string): FieldValidator {
    this.rules.push({
      type: 'currency',
      message: message || ValidationMessages.currency,
    });
    return this;
  }

  url(message?: string): FieldValidator {
    this.rules.push({
      type: 'url',
      message: message || ValidationMessages.url,
    });
    return this;
  }

  future(message?: string): FieldValidator {
    this.rules.push({
      type: 'future',
      message: message || ValidationMessages.future,
    });
    return this;
  }

  past(message?: string): FieldValidator {
    this.rules.push({
      type: 'past',
      message: message || ValidationMessages.past,
    });
    return this;
  }

  custom(validator: (value: any) => boolean, message: string): FieldValidator {
    this.rules.push({
      type: 'custom',
      validator,
      message,
    });
    return this;
  }

  validate(value: any): FieldValidationResult {
    for (const rule of this.rules) {
      let isValid = false;

      switch (rule.type) {
        case 'required':
          isValid = validateRequired(value);
          break;
        case 'email':
          isValid = !value || validateEmail(value);
          break;
        case 'phone':
          isValid = !value || validatePhone(value);
          break;
        case 'password':
          isValid = !value || validatePassword(value);
          break;
        case 'minLength':
          isValid = !value || validateMinLength(value, rule.value);
          break;
        case 'maxLength':
          isValid = !value || validateMaxLength(value, rule.value);
          break;
        case 'min':
          isValid = value === null || value === undefined || validateMin(Number(value), rule.value);
          break;
        case 'max':
          isValid = value === null || value === undefined || validateMax(Number(value), rule.value);
          break;
        case 'slug':
          isValid = !value || validateSlug(value);
          break;
        case 'currency':
          isValid = !value || validateCurrency(value);
          break;
        case 'url':
          isValid = !value || validateUrl(value);
          break;
        case 'future':
          isValid = !value || validateFutureDate(new Date(value));
          break;
        case 'past':
          isValid = !value || validatePastDate(new Date(value));
          break;
        case 'custom':
          isValid = !rule.validator || rule.validator(value);
          break;
      }

      if (!isValid) {
        return {
          isValid: false,
          error: rule.message,
          value,
        };
      }
    }

    return {
      isValid: true,
      value,
    };
  }
}

// Form validator class
export class FormValidator {
  private fields: Record<string, FieldValidator> = {};

  field(name: string): FieldValidator {
    this.fields[name] = new FieldValidator();
    return this.fields[name];
  }

  validate(data: Record<string, any>): FormValidationResult {
    const errors: ValidationError[] = [];
    const validatedData: Record<string, any> = {};

    for (const [fieldName, validator] of Object.entries(this.fields)) {
      const result = validator.validate(data[fieldName]);
      
      if (result.isValid) {
        validatedData[fieldName] = result.value;
      } else {
        errors.push({
          field: fieldName,
          message: result.error || 'Validation failed',
          value: result.value,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData: errors.length === 0 ? validatedData : undefined,
    };
  }
}

// Pre-built validators for common forms
export const CommonValidators = {
  // Contact/Profile forms
  contactForm: () => {
    const validator = new FormValidator();
    validator.field('name').required().minLength(2).maxLength(100);
    validator.field('email').required().email();
    validator.field('phone').phone();
    validator.field('message').required().minLength(10).maxLength(1000);
    return validator;
  },

  // User registration
  registrationForm: () => {
    const validator = new FormValidator();
    validator.field('name').required().minLength(2).maxLength(100);
    validator.field('email').required().email();
    validator.field('password').required().password();
    validator.field('passwordConfirm').required();
    return validator;
  },

  // Address forms
  addressForm: () => {
    const validator = new FormValidator();
    validator.field('name').required().minLength(2).maxLength(100);
    validator.field('addressLine1').required().minLength(5).maxLength(200);
    validator.field('addressLine2').maxLength(200);
    validator.field('city').required().minLength(2).maxLength(100);
    validator.field('state').required().minLength(2).maxLength(100);
    validator.field('postalCode').required().custom(
      (value) => ValidationPatterns.postalCode.test(value),
      ValidationMessages.postalCode
    );
    validator.field('phone').required().phone();
    return validator;
  },

  // Product forms
  productForm: () => {
    const validator = new FormValidator();
    validator.field('name').required().minLength(2).maxLength(200);
    validator.field('slug').required().slug();
    validator.field('shortDescription').maxLength(500);
    validator.field('description').required().minLength(10);
    validator.field('regularPrice').required().currency().min(0.01);
    validator.field('memberPrice').currency().min(0.01);
    validator.field('stockQuantity').required().custom(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 0,
      'Must be a non-negative integer'
    );
    return validator;
  },

  // Discount code forms
  discountCodeForm: () => {
    const validator = new FormValidator();
    validator.field('code').required().minLength(3).maxLength(50);
    validator.field('name').required().minLength(3).maxLength(100);
    validator.field('description').maxLength(500);
    validator.field('discountValue').required().min(0.01);
    validator.field('minimumOrderValue').min(0);
    validator.field('maximumDiscount').min(0);
    validator.field('usageLimit').custom(
      (value) => !value || (Number.isInteger(Number(value)) && Number(value) > 0),
      'Must be a positive integer'
    );
    return validator;
  },

  // Payment forms
  paymentForm: () => {
    const validator = new FormValidator();
    validator.field('amount').required().currency().min(1);
    validator.field('paymentMethod').required();
    return validator;
  },
};

// Utility functions for form handling
export function getFieldErrors(errors: ValidationError[], fieldName: string): string[] {
  return errors
    .filter(error => error.field === fieldName)
    .map(error => error.message);
}

export function hasFieldError(errors: ValidationError[], fieldName: string): boolean {
  return errors.some(error => error.field === fieldName);
}

export function getFirstFieldError(errors: ValidationError[], fieldName: string): string | undefined {
  const fieldErrors = getFieldErrors(errors, fieldName);
  return fieldErrors.length > 0 ? fieldErrors[0] : undefined;
}

export function clearFieldErrors(errors: ValidationError[], fieldName: string): ValidationError[] {
  return errors.filter(error => error.field !== fieldName);
}

// Real-time validation hook helper
export function createFieldValidator(rules: ValidationRule[]) {
  return (value: any): FieldValidationResult => {
    const validator = new FieldValidator();
    
    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          validator.required(rule.message);
          break;
        case 'email':
          validator.email(rule.message);
          break;
        case 'phone':
          validator.phone(rule.message);
          break;
        case 'password':
          validator.password(rule.message);
          break;
        case 'minLength':
          validator.minLength(rule.value, rule.message);
          break;
        case 'maxLength':
          validator.maxLength(rule.value, rule.message);
          break;
        case 'min':
          validator.min(rule.value, rule.message);
          break;
        case 'max':
          validator.max(rule.value, rule.message);
          break;
        case 'custom':
          if (rule.validator) {
            validator.custom(rule.validator, rule.message || 'Validation failed');
          }
          break;
      }
    }
    
    return validator.validate(value);
  };
}