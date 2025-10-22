/**
 * Safe Logging Utility
 *
 * Prevents accidental logging of sensitive data like passwords, tokens, and credentials.
 * Use this instead of console.log for any operations involving sensitive data.
 */

type SensitiveField =
  | 'password'
  | 'currentPassword'
  | 'newPassword'
  | 'confirmPassword'
  | 'token'
  | 'accessToken'
  | 'refreshToken'
  | 'apiKey'
  | 'secret'
  | 'secretKey'
  | 'privateKey'
  | 'creditCard'
  | 'cvv'
  | 'ssn';

const SENSITIVE_FIELDS: Set<string> = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'oldPassword',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'secret',
  'secretKey',
  'secret_key',
  'privateKey',
  'private_key',
  'creditCard',
  'credit_card',
  'cvv',
  'ssn',
  'authorization',
  'x-api-key',
  'x-csrf-token',
]);

/**
 * Redacts sensitive fields from an object for safe logging
 */
export function redactSensitiveData<T extends Record<string, any>>(
  data: T,
  additionalFields: string[] = []
): Record<string, any> {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = new Set([...SENSITIVE_FIELDS, ...additionalFields]);
  const redacted: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if this field is sensitive
    if (sensitiveFields.has(key) || sensitiveFields.has(lowerKey)) {
      // For sensitive fields, show presence but not value
      redacted[key] = value ? '[REDACTED]' : undefined;
    } else if (value && typeof value === 'object') {
      // Recursively redact nested objects
      redacted[key] = Array.isArray(value)
        ? value.map(item =>
            typeof item === 'object' ? redactSensitiveData(item, additionalFields) : item
          )
        : redactSensitiveData(value, additionalFields);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Safe console.log that automatically redacts sensitive fields
 */
export function safeLog(message: string, data?: Record<string, any>, additionalFields?: string[]): void {
  if (!data) {
    console.log(message);
    return;
  }

  const redacted = redactSensitiveData(data, additionalFields);
  console.log(message, redacted);
}

/**
 * Safe console.error that automatically redacts sensitive fields
 */
export function safeError(message: string, error?: any, data?: Record<string, any>): void {
  const redactedData = data ? redactSensitiveData(data) : undefined;

  if (error instanceof Error) {
    console.error(message, {
      error: error.message,
      stack: error.stack,
      ...(redactedData && { data: redactedData }),
    });
  } else {
    console.error(message, error, redactedData);
  }
}

/**
 * Safe console.warn that automatically redacts sensitive fields
 */
export function safeWarn(message: string, data?: Record<string, any>, additionalFields?: string[]): void {
  if (!data) {
    console.warn(message);
    return;
  }

  const redacted = redactSensitiveData(data, additionalFields);
  console.warn(message, redacted);
}

/**
 * Check if a value contains sensitive data (for validation)
 */
export function hasSensitiveField(key: string): boolean {
  return SENSITIVE_FIELDS.has(key) || SENSITIVE_FIELDS.has(key.toLowerCase());
}

/**
 * Create a safe logger instance with custom sensitive fields
 */
export function createSafeLogger(additionalFields: string[] = []) {
  return {
    log: (message: string, data?: Record<string, any>) =>
      safeLog(message, data, additionalFields),
    error: (message: string, error?: any, data?: Record<string, any>) =>
      safeError(message, error, data),
    warn: (message: string, data?: Record<string, any>) =>
      safeWarn(message, data, additionalFields),
  };
}

// Example usage:
// import { safeLog, safeError } from '@/lib/utils/safe-logger';
//
// ❌ DON'T: console.log('User data:', { password: '123' })
// ✅ DO: safeLog('User data:', { password: '123' })
// Output: User data: { password: '[REDACTED]' }
