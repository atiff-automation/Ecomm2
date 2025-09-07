/**
 * Form Validation Hook - Malaysian E-commerce Platform
 * React hook for comprehensive form validation with real-time feedback
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  FormValidator,
  ValidationError,
  FormValidationResult,
  FieldValidationResult,
  ValidationRule,
  createFieldValidator,
  getFieldErrors,
  hasFieldError,
  getFirstFieldError,
} from '@/lib/utils/form-validation';

export interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export interface FormField {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface UseFormValidationReturn {
  // Form state
  values: Record<string, any>;
  errors: ValidationError[];
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;

  // Field helpers
  getFieldProps: (name: string) => {
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
    error?: string;
    hasError: boolean;
  };
  getFieldError: (name: string) => string | undefined;
  hasFieldError: (name: string) => boolean;
  isFieldTouched: (name: string) => boolean;
  isFieldDirty: (name: string) => boolean;

  // Form actions
  setValue: (name: string, value: any) => void;
  setValues: (values: Record<string, any>) => void;
  setFieldError: (name: string, error: string) => void;
  setFieldTouched: (name: string, touched?: boolean) => void;
  clearFieldError: (name: string) => void;
  clearAllErrors: () => void;
  validateField: (name: string) => FieldValidationResult;
  validateForm: () => FormValidationResult;
  resetForm: (initialValues?: Record<string, any>) => void;
  submitForm: (onSubmit: (values: Record<string, any>) => Promise<void> | void) => Promise<void>;

  // Field registration for advanced validation
  registerField: (name: string, rules: ValidationRule[]) => void;
  unregisterField: (name: string) => void;
}

export function useFormValidation(
  initialValues: Record<string, any> = {},
  validator?: FormValidator,
  options: UseFormValidationOptions = {}
): UseFormValidationReturn {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
  } = options;

  // Form state
  const [values, setValuesState] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldValidators, setFieldValidators] = useState<Record<string, (value: any) => FieldValidationResult>>({});

  // Debounced validation timeout
  const [validationTimeouts, setValidationTimeouts] = useState<Record<string, NodeJS.Timeout>>({});

  // Computed properties
  const isValid = errors.length === 0;

  // Clear timeout for field
  const clearValidationTimeout = useCallback((fieldName: string) => {
    if (validationTimeouts[fieldName]) {
      clearTimeout(validationTimeouts[fieldName]);
      setValidationTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[fieldName];
        return newTimeouts;
      });
    }
  }, [validationTimeouts]);

  // Set field value
  const setValue = useCallback((name: string, value: any) => {
    setValuesState(prev => ({
      ...prev,
      [name]: value,
    }));

    // Mark field as dirty
    setDirty(prev => ({
      ...prev,
      [name]: true,
    }));

    // Validate on change if enabled
    if (validateOnChange) {
      clearValidationTimeout(name);
      
      const timeoutId = setTimeout(() => {
        validateField(name);
      }, debounceMs);

      setValidationTimeouts(prev => ({
        ...prev,
        [name]: timeoutId,
      }));
    }
  }, [validateOnChange, debounceMs, clearValidationTimeout]);

  // Set multiple values
  const setValues = useCallback((newValues: Record<string, any>) => {
    setValuesState(prev => ({
      ...prev,
      ...newValues,
    }));

    // Mark fields as dirty
    setDirty(prev => ({
      ...prev,
      ...Object.keys(newValues).reduce((acc, key) => ({
        ...acc,
        [key]: true,
      }), {}),
    }));
  }, []);

  // Set field touched
  const setFieldTouched = useCallback((name: string, isTouched = true) => {
    setTouched(prev => ({
      ...prev,
      [name]: isTouched,
    }));

    // Validate on blur if enabled and field is touched
    if (validateOnBlur && isTouched) {
      validateField(name);
    }
  }, [validateOnBlur]);

  // Set field error
  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => [
      ...prev.filter(err => err.field !== name),
      { field: name, message: error, value: values[name] },
    ]);
  }, [values]);

  // Clear field error
  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => prev.filter(err => err.field !== name));
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Validate single field
  const validateField = useCallback((name: string): FieldValidationResult => {
    const value = values[name];
    let result: FieldValidationResult = { isValid: true, value };

    // Use field-specific validator if available
    if (fieldValidators[name]) {
      result = fieldValidators[name](value);
    }
    // Fall back to form validator
    else if (validator) {
      // Create a temporary validator for this field
      const tempValidator = new FormValidator();
      // This would need to be implemented based on the original validator's field rules
      // For now, we'll just return valid
      result = { isValid: true, value };
    }

    // Update errors
    if (result.isValid) {
      clearFieldError(name);
    } else {
      setFieldError(name, result.error || 'Validation failed');
    }

    return result;
  }, [values, fieldValidators, validator, clearFieldError, setFieldError]);

  // Validate entire form
  const validateForm = useCallback(() => {
    if (!validator) {
      return { isValid: true, errors: [] };
    }

    const result = validator.validate(values);
    setErrors(result.errors);
    return result;
  }, [validator, values]);

  // Reset form
  const resetForm = useCallback((newInitialValues?: Record<string, any>) => {
    const resetValues = newInitialValues || initialValues;
    setValuesState(resetValues);
    setErrors([]);
    setTouched({});
    setDirty({});
    setIsSubmitting(false);
    
    // Clear all validation timeouts
    Object.values(validationTimeouts).forEach(timeout => clearTimeout(timeout));
    setValidationTimeouts({});
  }, [initialValues, validationTimeouts]);

  // Submit form
  const submitForm = useCallback(async (onSubmit: (values: Record<string, any>) => Promise<void> | void) => {
    setIsSubmitting(true);
    
    try {
      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => ({
        ...acc,
        [key]: true,
      }), {});
      setTouched(allTouched);

      // Validate form
      const result = validateForm();
      
      if (result.isValid) {
        await onSubmit(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm]);

  // Register field with specific validation rules
  const registerField = useCallback((name: string, rules: ValidationRule[]) => {
    const fieldValidator = createFieldValidator(rules);
    setFieldValidators(prev => ({
      ...prev,
      [name]: fieldValidator,
    }));
  }, []);

  // Unregister field
  const unregisterField = useCallback((name: string) => {
    setFieldValidators(prev => {
      const newValidators = { ...prev };
      delete newValidators[name];
      return newValidators;
    });
    clearFieldError(name);
  }, [clearFieldError]);

  // Get field props for easy integration with form controls
  const getFieldProps = useCallback((name: string) => {
    return {
      value: values[name] || '',
      onChange: (value: any) => setValue(name, value),
      onBlur: () => setFieldTouched(name, true),
      error: getFirstFieldError(errors, name),
      hasError: hasFieldError(errors, name),
    };
  }, [values, errors, setValue, setFieldTouched]);

  // Field helper functions
  const getFieldError = useCallback((name: string) => {
    return getFirstFieldError(errors, name);
  }, [errors]);

  const hasFieldErrorFn = useCallback((name: string) => {
    return hasFieldError(errors, name);
  }, [errors]);

  const isFieldTouched = useCallback((name: string) => {
    return touched[name] || false;
  }, [touched]);

  const isFieldDirty = useCallback((name: string) => {
    return dirty[name] || false;
  }, [dirty]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [validationTimeouts]);

  return {
    // Form state
    values,
    errors,
    touched,
    dirty,
    isValid,
    isSubmitting,

    // Field helpers
    getFieldProps,
    getFieldError,
    hasFieldError: hasFieldErrorFn,
    isFieldTouched,
    isFieldDirty,

    // Form actions
    setValue,
    setValues,
    setFieldError,
    setFieldTouched,
    clearFieldError,
    clearAllErrors,
    validateField,
    validateForm,
    resetForm,
    submitForm,

    // Field registration
    registerField,
    unregisterField,
  };
}

// Helper hook for simple field validation without full form setup
export function useFieldValidation(
  initialValue: any = '',
  rules: ValidationRule[] = [],
  options: Pick<UseFormValidationOptions, 'validateOnChange' | 'debounceMs'> = {}
) {
  const validator = createFieldValidator(rules);
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout>();

  const validateField = useCallback((val: any) => {
    const result = validator(val);
    setError(result.isValid ? undefined : result.error);
    return result;
  }, [validator]);

  const handleChange = useCallback((newValue: any) => {
    setValue(newValue);

    if (options.validateOnChange) {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }

      const timeout = setTimeout(() => {
        validateField(newValue);
      }, options.debounceMs || 300);

      setValidationTimeout(timeout);
    }
  }, [options.validateOnChange, options.debounceMs, validationTimeout, validateField]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    validateField(value);
  }, [validateField, value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  return {
    value,
    error,
    touched,
    isValid: !error,
    onChange: handleChange,
    onBlur: handleBlur,
    validate: () => validateField(value),
    reset: (newValue: any = initialValue) => {
      setValue(newValue);
      setError(undefined);
      setTouched(false);
    },
  };
}