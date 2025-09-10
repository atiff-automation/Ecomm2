/**
 * Chat Validation Utility
 * Client-side validation functions for chat components
 */

import type { ChatMessage, ChatConfig, QuickReply } from '../types';
import { CHAT_CONSTANTS, DEFAULT_CHAT_CONFIG } from '../types';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

interface MessageValidationOptions {
  maxLength?: number;
  allowEmpty?: boolean;
  sanitize?: boolean;
}

class ChatValidation {
  /**
   * Validate message content
   */
  validateMessage(
    content: string, 
    options: MessageValidationOptions = {}
  ): ValidationResult {
    const {
      maxLength = CHAT_CONSTANTS.MESSAGE_BATCH_SIZE,
      allowEmpty = false,
      sanitize = true
    } = options;

    const warnings: string[] = [];

    // Check if content is provided
    if (!content || typeof content !== 'string') {
      return {
        isValid: false,
        error: 'Message content must be a string'
      };
    }

    const trimmedContent = content.trim();

    // Check for empty content
    if (!allowEmpty && trimmedContent.length === 0) {
      return {
        isValid: false,
        error: 'Message cannot be empty'
      };
    }

    // Check length
    if (trimmedContent.length > maxLength) {
      return {
        isValid: false,
        error: `Message cannot exceed ${maxLength} characters (current: ${trimmedContent.length})`
      };
    }

    // Check for potentially harmful content
    if (sanitize) {
      const suspiciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi
      ];

      const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(content));
      
      if (hasSuspiciousContent) {
        warnings.push('Message contains potentially unsafe content that will be sanitized');
      }
    }

    // Check for very long words (might break layout)
    const words = trimmedContent.split(/\s+/);
    const longWords = words.filter(word => word.length > 50);
    
    if (longWords.length > 0) {
      warnings.push('Message contains very long words that might affect display');
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate session ID
   */
  validateSessionId(sessionId: string): ValidationResult {
    if (!sessionId || typeof sessionId !== 'string') {
      return {
        isValid: false,
        error: 'Session ID must be a non-empty string'
      };
    }

    if (sessionId.trim().length === 0) {
      return {
        isValid: false,
        error: 'Session ID cannot be empty'
      };
    }

    // Check for valid cuid format (basic check)
    if (!/^c[0-9a-z]{24}$/.test(sessionId) && !sessionId.startsWith('temp_')) {
      return {
        isValid: true,
        warnings: ['Session ID format appears unusual']
      };
    }

    return { isValid: true };
  }

  /**
   * Validate chat configuration
   */
  validateConfig(config: Partial<ChatConfig>): ValidationResult {
    const warnings: string[] = [];

    if (!config || typeof config !== 'object') {
      return {
        isValid: false,
        error: 'Configuration must be an object'
      };
    }

    // Validate position
    if (config.position) {
      const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
      if (!validPositions.includes(config.position)) {
        return {
          isValid: false,
          error: `Position must be one of: ${validPositions.join(', ')}`
        };
      }
    }

    // Validate theme
    if (config.theme) {
      const validThemes = ['light', 'dark', 'auto'];
      if (!validThemes.includes(config.theme)) {
        return {
          isValid: false,
          error: `Theme must be one of: ${validThemes.join(', ')}`
        };
      }
    }

    // Validate primary color (basic CSS color validation)
    if (config.primaryColor) {
      const colorPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(|^rgba\(|^hsl\(|^hsla\(/;
      if (!colorPattern.test(config.primaryColor)) {
        warnings.push('Primary color format may not be valid CSS');
      }
    }

    // Validate max message length
    if (config.maxMessageLength !== undefined) {
      if (typeof config.maxMessageLength !== 'number' || config.maxMessageLength <= 0) {
        return {
          isValid: false,
          error: 'Max message length must be a positive number'
        };
      }
      
      if (config.maxMessageLength > 10000) {
        warnings.push('Max message length is very high, consider a lower value');
      }
    }

    // Validate boolean fields
    const booleanFields = ['enableFileUpload', 'enableTypingIndicator', 'enableSound', 'autoExpand', 'showTimestamp'];
    
    for (const field of booleanFields) {
      if (config[field as keyof ChatConfig] !== undefined && typeof config[field as keyof ChatConfig] !== 'boolean') {
        return {
          isValid: false,
          error: `${field} must be a boolean value`
        };
      }
    }

    // Validate placeholder
    if (config.placeholder !== undefined) {
      if (typeof config.placeholder !== 'string') {
        return {
          isValid: false,
          error: 'Placeholder must be a string'
        };
      }
      
      if (config.placeholder.length > 100) {
        warnings.push('Placeholder is very long, consider shortening it');
      }
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate user email
   */
  validateEmail(email: string): ValidationResult {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        error: 'Email must be a non-empty string'
      };
    }

    const trimmedEmail = email.trim();
    
    if (trimmedEmail.length === 0) {
      return {
        isValid: false,
        error: 'Email cannot be empty'
      };
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailPattern.test(trimmedEmail)) {
      return {
        isValid: false,
        error: 'Email format is invalid'
      };
    }

    if (trimmedEmail.length > 254) {
      return {
        isValid: false,
        error: 'Email is too long'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate quick reply
   */
  validateQuickReply(reply: QuickReply): ValidationResult {
    if (!reply || typeof reply !== 'object') {
      return {
        isValid: false,
        error: 'Quick reply must be an object'
      };
    }

    if (!reply.id || typeof reply.id !== 'string') {
      return {
        isValid: false,
        error: 'Quick reply must have a valid ID'
      };
    }

    if (!reply.text || typeof reply.text !== 'string') {
      return {
        isValid: false,
        error: 'Quick reply must have text'
      };
    }

    if (reply.text.trim().length === 0) {
      return {
        isValid: false,
        error: 'Quick reply text cannot be empty'
      };
    }

    if (reply.text.length > 50) {
      return {
        isValid: false,
        error: 'Quick reply text is too long (max 50 characters)'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate chat message object
   */
  validateChatMessage(message: ChatMessage): ValidationResult {
    const warnings: string[] = [];

    if (!message || typeof message !== 'object') {
      return {
        isValid: false,
        error: 'Message must be an object'
      };
    }

    // Validate required fields
    const requiredFields = ['id', 'sessionId', 'senderType', 'content', 'messageType', 'status', 'createdAt'];
    
    for (const field of requiredFields) {
      if (!message[field as keyof ChatMessage]) {
        return {
          isValid: false,
          error: `Message is missing required field: ${field}`
        };
      }
    }

    // Validate sender type
    if (!['user', 'bot'].includes(message.senderType)) {
      return {
        isValid: false,
        error: 'Sender type must be either "user" or "bot"'
      };
    }

    // Validate message type
    const validMessageTypes = ['text', 'quick_reply', 'rich_content'];
    if (!validMessageTypes.includes(message.messageType)) {
      return {
        isValid: false,
        error: `Message type must be one of: ${validMessageTypes.join(', ')}`
      };
    }

    // Validate status
    const validStatuses = ['pending', 'sent', 'delivered', 'failed'];
    if (!validStatuses.includes(message.status)) {
      return {
        isValid: false,
        error: `Message status must be one of: ${validStatuses.join(', ')}`
      };
    }

    // Validate content
    const contentValidation = this.validateMessage(message.content, { allowEmpty: false });
    if (!contentValidation.isValid) {
      return contentValidation;
    }

    if (contentValidation.warnings) {
      warnings.push(...contentValidation.warnings);
    }

    // Validate session ID
    const sessionValidation = this.validateSessionId(message.sessionId);
    if (!sessionValidation.isValid) {
      return sessionValidation;
    }

    if (sessionValidation.warnings) {
      warnings.push(...sessionValidation.warnings);
    }

    // Validate timestamps
    try {
      new Date(message.createdAt);
    } catch {
      return {
        isValid: false,
        error: 'createdAt must be a valid date string'
      };
    }

    if (message.updatedAt) {
      try {
        new Date(message.updatedAt);
      } catch {
        return {
          isValid: false,
          error: 'updatedAt must be a valid date string'
        };
      }
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Sanitize and validate configuration with defaults
   */
  sanitizeConfig(config: Partial<ChatConfig>): ChatConfig {
    const validation = this.validateConfig(config);
    
    if (!validation.isValid) {
      console.warn('Invalid chat config provided, using defaults:', validation.error);
      return { ...DEFAULT_CHAT_CONFIG };
    }

    // Merge with defaults
    return {
      ...DEFAULT_CHAT_CONFIG,
      ...config
    };
  }

  /**
   * Check if message content needs sanitization
   */
  needsSanitization(content: string): boolean {
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Sanitize message content
   */
  sanitizeMessage(content: string): string {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe[^>]*>/gi, '')
      .replace(/<object[^>]*>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .trim();
  }

  /**
   * Validate file upload (if enabled)
   */
  validateFileUpload(file: File): ValidationResult {
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided'
      };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds 5MB limit'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not allowed. Supported types: JPEG, PNG, GIF, TXT, PDF'
      };
    }

    return { isValid: true };
  }
}

// Export singleton instance
export const chatValidation = new ChatValidation();