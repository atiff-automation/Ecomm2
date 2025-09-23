/**
 * Centralized Input Sanitization Service
 * SINGLE SOURCE OF TRUTH for all input sanitization across the application
 * NO HARDCODE - All sanitization rules centralized and configurable
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// CENTRALIZED CONFIGURATION - Single source of truth
const SANITIZATION_CONFIG = {
  HTML: {
    ALLOWED_TAGS: (process.env.ALLOWED_HTML_TAGS || 'b,i,em,strong,p,br,ul,ol,li,a').split(','),
    ALLOWED_ATTRIBUTES: (process.env.ALLOWED_HTML_ATTRIBUTES || 'href,title,alt').split(','),
    MAX_LENGTH: parseInt(process.env.HTML_MAX_LENGTH || '10000'),
  },
  TEXT: {
    MAX_LENGTH: parseInt(process.env.TEXT_MAX_LENGTH || '5000'),
    ALLOW_UNICODE: process.env.ALLOW_UNICODE === 'true',
    STRIP_CONTROL_CHARS: process.env.STRIP_CONTROL_CHARS !== 'false',
  },
  TELEGRAM: {
    MAX_MESSAGE_LENGTH: parseInt(process.env.TELEGRAM_MAX_MESSAGE_LENGTH || '4096'),
    ALLOWED_ENTITIES: (process.env.TELEGRAM_ALLOWED_ENTITIES || 'bold,italic,code,pre').split(','),
  },
  NOTIFICATION: {
    MAX_TITLE_LENGTH: parseInt(process.env.NOTIFICATION_TITLE_MAX_LENGTH || '200'),
    MAX_BODY_LENGTH: parseInt(process.env.NOTIFICATION_BODY_MAX_LENGTH || '1000'),
  },
} as const;

interface SanitizationResult<T = any> {
  sanitized: T;
  wasModified: boolean;
  violations: string[];
}

interface SanitizationOptions {
  maxLength?: number;
  allowHTML?: boolean;
  stripWhitespace?: boolean;
  customRules?: ((input: string) => string)[];
}

/**
 * CENTRALIZED Input Sanitizer Class - Single Source of Truth
 */
export class InputSanitizer {
  /**
   * SYSTEMATIC HTML sanitization - NO HARDCODE
   */
  static sanitizeHTML(
    input: string,
    options: SanitizationOptions = {}
  ): SanitizationResult<string> {
    const violations: string[] = [];
    const originalInput = input;

    if (!input || typeof input !== 'string') {
      return {
        sanitized: '',
        wasModified: !!input,
        violations: input ? ['Invalid input type'] : [],
      };
    }

    // CENTRALIZED LENGTH CHECK
    const maxLength = options.maxLength || SANITIZATION_CONFIG.HTML.MAX_LENGTH;
    if (input.length > maxLength) {
      input = input.substring(0, maxLength);
      violations.push(`Input truncated to ${maxLength} characters`);
    }

    // CENTRALIZED HTML SANITIZATION
    const config = {
      ALLOWED_TAGS: SANITIZATION_CONFIG.HTML.ALLOWED_TAGS,
      ALLOWED_ATTR: SANITIZATION_CONFIG.HTML.ALLOWED_ATTRIBUTES,
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
    };

    const sanitized = DOMPurify.sanitize(input, config);

    // Check if content was modified
    const wasModified = sanitized !== originalInput;
    if (wasModified && !violations.length) {
      violations.push('HTML content was sanitized');
    }

    return {
      sanitized,
      wasModified,
      violations,
    };
  }

  /**
   * SYSTEMATIC text sanitization - DRY PRINCIPLE
   */
  static sanitizeText(
    input: string,
    options: SanitizationOptions = {}
  ): SanitizationResult<string> {
    const violations: string[] = [];
    const originalInput = input;

    if (!input || typeof input !== 'string') {
      return {
        sanitized: '',
        wasModified: !!input,
        violations: input ? ['Invalid input type'] : [],
      };
    }

    let sanitized = input;

    // CENTRALIZED LENGTH CHECK
    const maxLength = options.maxLength || SANITIZATION_CONFIG.TEXT.MAX_LENGTH;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      violations.push(`Text truncated to ${maxLength} characters`);
    }

    // SYSTEMATIC control character removal
    if (SANITIZATION_CONFIG.TEXT.STRIP_CONTROL_CHARS) {
      const beforeStripControlChars = sanitized;
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      if (sanitized !== beforeStripControlChars) {
        violations.push('Control characters removed');
      }
    }

    // CENTRALIZED Unicode handling
    if (!SANITIZATION_CONFIG.TEXT.ALLOW_UNICODE) {
      const beforeUnicodeFilter = sanitized;
      sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');
      if (sanitized !== beforeUnicodeFilter) {
        violations.push('Non-ASCII characters removed');
      }
    }

    // SYSTEMATIC whitespace handling
    if (options.stripWhitespace !== false) {
      sanitized = sanitized.trim();
      sanitized = sanitized.replace(/\s+/g, ' ');
    }

    // Apply custom sanitization rules - EXTENSIBLE APPROACH
    if (options.customRules) {
      for (const rule of options.customRules) {
        const beforeCustomRule = sanitized;
        sanitized = rule(sanitized);
        if (sanitized !== beforeCustomRule) {
          violations.push('Custom sanitization rule applied');
        }
      }
    }

    return {
      sanitized,
      wasModified: sanitized !== originalInput,
      violations,
    };
  }

  /**
   * CENTRALIZED notification sanitization - Single source of truth
   */
  static sanitizeNotification(notification: {
    title?: string;
    body?: string;
    type?: string;
  }): SanitizationResult<typeof notification> {
    const violations: string[] = [];
    const sanitized = { ...notification };

    // SYSTEMATIC title sanitization
    if (sanitized.title) {
      const titleResult = this.sanitizeText(sanitized.title, {
        maxLength: SANITIZATION_CONFIG.NOTIFICATION.MAX_TITLE_LENGTH,
        stripWhitespace: true,
      });
      sanitized.title = titleResult.sanitized;
      violations.push(...titleResult.violations.map(v => `Title: ${v}`));
    }

    // SYSTEMATIC body sanitization
    if (sanitized.body) {
      const bodyResult = this.sanitizeHTML(sanitized.body, {
        maxLength: SANITIZATION_CONFIG.NOTIFICATION.MAX_BODY_LENGTH,
        allowHTML: true,
      });
      sanitized.body = bodyResult.sanitized;
      violations.push(...bodyResult.violations.map(v => `Body: ${v}`));
    }

    // CENTRALIZED type validation
    if (sanitized.type) {
      const allowedTypes = [
        'ORDER_CONFIRMATION',
        'ORDER_STATUS_UPDATE',
        'SHIPPING_UPDATE',
        'DELIVERY_UPDATE',
        'PAYMENT_CONFIRMATION',
        'PROMOTIONAL_OFFERS',
        'MEMBER_BENEFITS',
        'STOCK_ALERTS',
        'PRICE_DROP_ALERTS',
        'NEW_ARRIVALS',
        'NEWSLETTER',
        'SYSTEM_UPDATES',
      ];

      if (!allowedTypes.includes(sanitized.type)) {
        sanitized.type = 'SYSTEM_UPDATES';
        violations.push('Invalid notification type, defaulted to SYSTEM_UPDATES');
      }
    }

    return {
      sanitized,
      wasModified: violations.length > 0,
      violations,
    };
  }

  /**
   * SYSTEMATIC Telegram message sanitization - DRY PRINCIPLE
   */
  static sanitizeTelegramMessage(
    message: string,
    options: { allowFormatting?: boolean } = {}
  ): SanitizationResult<string> {
    const violations: string[] = [];
    const originalMessage = message;

    if (!message || typeof message !== 'string') {
      return {
        sanitized: '',
        wasModified: !!message,
        violations: message ? ['Invalid message type'] : [],
      };
    }

    let sanitized = message;

    // CENTRALIZED length check for Telegram API limits
    if (sanitized.length > SANITIZATION_CONFIG.TELEGRAM.MAX_MESSAGE_LENGTH) {
      sanitized = sanitized.substring(0, SANITIZATION_CONFIG.TELEGRAM.MAX_MESSAGE_LENGTH);
      violations.push(`Message truncated to ${SANITIZATION_CONFIG.TELEGRAM.MAX_MESSAGE_LENGTH} characters`);
    }

    // SYSTEMATIC Telegram-specific sanitization
    if (options.allowFormatting) {
      // Preserve allowed Telegram formatting entities
      const allowedEntities = SANITIZATION_CONFIG.TELEGRAM.ALLOWED_ENTITIES;

      // Remove unsupported HTML tags while preserving content
      sanitized = sanitized.replace(/<(?!\/?(?:b|i|strong|em|code|pre)\b)[^>]*>/gi, '');

      // Convert HTML to Telegram markdown where appropriate
      sanitized = sanitized
        .replace(/<strong>/gi, '*')
        .replace(/<\/strong>/gi, '*')
        .replace(/<b>/gi, '*')
        .replace(/<\/b>/gi, '*')
        .replace(/<em>/gi, '_')
        .replace(/<\/em>/gi, '_')
        .replace(/<i>/gi, '_')
        .replace(/<\/i>/gi, '_')
        .replace(/<code>/gi, '`')
        .replace(/<\/code>/gi, '`');

      violations.push('Message formatted for Telegram');
    } else {
      // Strip all HTML/markdown formatting
      sanitized = sanitized
        .replace(/<[^>]*>/g, '')
        .replace(/[*_`]/g, '');

      if (sanitized !== message) {
        violations.push('Formatting removed from message');
      }
    }

    // CENTRALIZED character sanitization
    const textResult = this.sanitizeText(sanitized, {
      maxLength: SANITIZATION_CONFIG.TELEGRAM.MAX_MESSAGE_LENGTH,
      stripWhitespace: false, // Preserve whitespace for readability
    });

    return {
      sanitized: textResult.sanitized,
      wasModified: textResult.sanitized !== originalMessage,
      violations: [...violations, ...textResult.violations],
    };
  }

  /**
   * SYSTEMATIC Zod schema sanitization - CENTRALIZED VALIDATION
   */
  static sanitizeWithSchema<T>(
    input: unknown,
    schema: z.ZodSchema<T>,
    sanitizationFn?: (data: T) => SanitizationResult<T>
  ): SanitizationResult<T> {
    const violations: string[] = [];

    try {
      // CENTRALIZED schema validation
      const validated = schema.parse(input);

      // Apply additional sanitization if provided
      if (sanitizationFn) {
        const sanitizationResult = sanitizationFn(validated);
        return {
          sanitized: sanitizationResult.sanitized,
          wasModified: sanitizationResult.wasModified,
          violations: [...violations, ...sanitizationResult.violations],
        };
      }

      return {
        sanitized: validated,
        wasModified: false,
        violations,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
        violations.push(...errorMessages);
      }

      throw new Error(`Schema validation failed: ${violations.join(', ')}`);
    }
  }

  /**
   * CENTRALIZED batch sanitization - DRY for multiple inputs
   */
  static sanitizeBatch<T extends Record<string, any>>(
    inputs: T,
    rules: Record<keyof T, (value: any) => SanitizationResult<any>>
  ): SanitizationResult<T> {
    const sanitized = { ...inputs };
    const allViolations: string[] = [];
    let wasModified = false;

    for (const [key, rule] of Object.entries(rules)) {
      if (key in inputs && inputs[key] !== undefined) {
        const result = rule(inputs[key]);
        sanitized[key] = result.sanitized;
        wasModified = wasModified || result.wasModified;
        allViolations.push(...result.violations.map(v => `${key}: ${v}`));
      }
    }

    return {
      sanitized,
      wasModified,
      violations: allViolations,
    };
  }
}

/**
 * EXPORT centralized configuration and types
 */
export { SANITIZATION_CONFIG };
export type { SanitizationResult, SanitizationOptions };