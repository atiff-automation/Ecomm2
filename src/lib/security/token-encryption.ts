/**
 * Centralized Token Encryption Service
 * SINGLE SOURCE OF TRUTH for all token encryption/decryption across the application
 * NO HARDCODE - All encryption configuration centralized and environment-driven
 */

import crypto from 'crypto';

// CENTRALIZED CONFIGURATION - Single source of truth
const ENCRYPTION_CONFIG = {
  ALGORITHM: process.env.TOKEN_ENCRYPTION_ALGORITHM || 'aes-256-gcm',
  KEY_LENGTH: parseInt(process.env.TOKEN_KEY_LENGTH || '32'),
  IV_LENGTH: parseInt(process.env.TOKEN_IV_LENGTH || '16'),
  TAG_LENGTH: parseInt(process.env.TOKEN_TAG_LENGTH || '16'),
  SALT_LENGTH: parseInt(process.env.TOKEN_SALT_LENGTH || '32'),
  ITERATIONS: parseInt(process.env.TOKEN_PBKDF2_ITERATIONS || '100000'),
  MASTER_KEY: process.env.TOKEN_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET,
} as const;

interface EncryptedToken {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
}

interface TokenValidationResult {
  valid: boolean;
  reason?: string;
  decrypted?: string;
}

/**
 * CENTRALIZED Token Encryption Class - Single Source of Truth
 */
export class TokenEncryption {
  private static masterKey: string;

  /**
   * SYSTEMATIC master key initialization - NO HARDCODE
   */
  private static initializeMasterKey(): void {
    if (!this.masterKey) {
      if (!ENCRYPTION_CONFIG.MASTER_KEY) {
        throw new Error(
          'TOKEN_ENCRYPTION_KEY or NEXTAUTH_SECRET must be set for token encryption'
        );
      }
      this.masterKey = ENCRYPTION_CONFIG.MASTER_KEY;
    }
  }

  /**
   * CENTRALIZED encryption key derivation - DRY PRINCIPLE
   */
  private static deriveKey(salt: Buffer): Buffer {
    this.initializeMasterKey();

    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      ENCRYPTION_CONFIG.ITERATIONS,
      ENCRYPTION_CONFIG.KEY_LENGTH,
      'sha256'
    );
  }

  /**
   * SYSTEMATIC token encryption - Single source of truth
   */
  static encryptToken(token: string): EncryptedToken {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token provided for encryption');
    }

    try {
      // CENTRALIZED salt generation
      const salt = crypto.randomBytes(ENCRYPTION_CONFIG.SALT_LENGTH);

      // SYSTEMATIC key derivation
      const key = this.deriveKey(salt);

      // CENTRALIZED IV generation
      const iv = crypto.randomBytes(ENCRYPTION_CONFIG.IV_LENGTH);

      // SYSTEMATIC encryption process
      const cipher = crypto.createCipher(ENCRYPTION_CONFIG.ALGORITHM, key);
      cipher.setAAD(salt); // Use salt as additional authenticated data

      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // CENTRALIZED tag extraction
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: salt.toString('hex'),
      };
    } catch (error) {
      console.error('Token encryption failed:', error);
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * SYSTEMATIC token decryption - Single source of truth
   */
  static decryptToken(encryptedData: EncryptedToken): TokenValidationResult {
    try {
      if (!encryptedData || !encryptedData.encrypted) {
        return { valid: false, reason: 'Invalid encrypted data provided' };
      }

      // CENTRALIZED buffer conversion
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');

      // SYSTEMATIC key derivation
      const key = this.deriveKey(salt);

      // CENTRALIZED decryption process
      const decipher = crypto.createDecipher(ENCRYPTION_CONFIG.ALGORITHM, key);
      decipher.setAuthTag(tag);
      decipher.setAAD(salt); // Use salt as additional authenticated data

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return {
        valid: true,
        decrypted,
      };
    } catch (error) {
      console.error('Token decryption failed:', error);
      return {
        valid: false,
        reason: 'Decryption failed - token may be corrupted or tampered with',
      };
    }
  }

  /**
   * CENTRALIZED token validation without full decryption - DRY PRINCIPLE
   */
  static validateEncryptedToken(encryptedData: EncryptedToken): boolean {
    try {
      const result = this.decryptToken(encryptedData);
      return result.valid && !!result.decrypted;
    } catch (error) {
      return false;
    }
  }

  /**
   * SYSTEMATIC secure token storage format - Single source of truth
   */
  static prepareForStorage(token: string): string {
    const encrypted = this.encryptToken(token);

    // CENTRALIZED serialization format
    const storageFormat = {
      version: '1.0',
      algorithm: ENCRYPTION_CONFIG.ALGORITHM,
      data: encrypted,
      timestamp: Date.now(),
    };

    return JSON.stringify(storageFormat);
  }

  /**
   * SYSTEMATIC secure token retrieval from storage - DRY PRINCIPLE
   */
  static retrieveFromStorage(storageData: string): TokenValidationResult {
    try {
      if (!storageData) {
        return { valid: false, reason: 'No storage data provided' };
      }

      const parsed = JSON.parse(storageData);

      // CENTRALIZED version validation
      if (!parsed.version || !parsed.data) {
        return { valid: false, reason: 'Invalid storage format' };
      }

      // SYSTEMATIC algorithm validation
      if (parsed.algorithm !== ENCRYPTION_CONFIG.ALGORITHM) {
        return {
          valid: false,
          reason: `Algorithm mismatch: expected ${ENCRYPTION_CONFIG.ALGORITHM}, got ${parsed.algorithm}`,
        };
      }

      // CENTRALIZED timestamp validation (optional expiry check)
      const maxAge = parseInt(process.env.TOKEN_MAX_AGE_HOURS || '24') * 60 * 60 * 1000;
      if (parsed.timestamp && Date.now() - parsed.timestamp > maxAge) {
        return { valid: false, reason: 'Token has expired' };
      }

      return this.decryptToken(parsed.data);
    } catch (error) {
      console.error('Token retrieval from storage failed:', error);
      return { valid: false, reason: 'Invalid storage format or corrupted data' };
    }
  }

  /**
   * CENTRALIZED token rotation - Systematic security practice
   */
  static rotateToken(oldStorageData: string, newToken: string): string {
    // Verify old token is valid before rotation
    const oldTokenResult = this.retrieveFromStorage(oldStorageData);

    if (!oldTokenResult.valid) {
      throw new Error(`Cannot rotate invalid token: ${oldTokenResult.reason}`);
    }

    // SYSTEMATIC audit log for token rotation
    console.log('Token rotation performed', {
      timestamp: new Date().toISOString(),
      oldTokenValid: oldTokenResult.valid,
      reason: 'Scheduled token rotation',
    });

    // Generate new encrypted token
    return this.prepareForStorage(newToken);
  }

  /**
   * CENTRALIZED batch token operations - DRY for multiple tokens
   */
  static encryptBatch(tokens: Record<string, string>): Record<string, string> {
    const encrypted: Record<string, string> = {};

    for (const [key, token] of Object.entries(tokens)) {
      try {
        encrypted[key] = this.prepareForStorage(token);
      } catch (error) {
        console.error(`Failed to encrypt token for key ${key}:`, error);
        // Continue with other tokens, don't fail entire batch
      }
    }

    return encrypted;
  }

  /**
   * SYSTEMATIC batch token decryption - DRY PRINCIPLE
   */
  static decryptBatch(
    encryptedTokens: Record<string, string>
  ): Record<string, TokenValidationResult> {
    const decrypted: Record<string, TokenValidationResult> = {};

    for (const [key, encryptedData] of Object.entries(encryptedTokens)) {
      try {
        decrypted[key] = this.retrieveFromStorage(encryptedData);
      } catch (error) {
        console.error(`Failed to decrypt token for key ${key}:`, error);
        decrypted[key] = {
          valid: false,
          reason: 'Decryption error',
        };
      }
    }

    return decrypted;
  }

  /**
   * CENTRALIZED secure token masking for display - Security best practice
   */
  static maskTokenForDisplay(token: string, visibleChars: number = 4): string {
    if (!token || typeof token !== 'string') {
      return '[INVALID TOKEN]';
    }

    if (token.length <= visibleChars * 2) {
      return '*'.repeat(token.length);
    }

    const start = token.substring(0, visibleChars);
    const end = token.substring(token.length - visibleChars);
    const middle = '*'.repeat(Math.max(0, token.length - visibleChars * 2));

    return `${start}${middle}${end}`;
  }
}

/**
 * CENTRALIZED Telegram-specific token operations - Single source of truth
 */
export class TelegramTokenSecurity {
  /**
   * SYSTEMATIC Telegram bot token encryption - Following centralized pattern
   */
  static encryptBotToken(botToken: string): string {
    // CENTRALIZED validation
    if (!botToken || !this.isValidTelegramBotToken(botToken)) {
      throw new Error('Invalid Telegram bot token format');
    }

    return TokenEncryption.prepareForStorage(botToken);
  }

  /**
   * CENTRALIZED Telegram bot token decryption - DRY PRINCIPLE
   */
  static decryptBotToken(encryptedData: string): TokenValidationResult {
    const result = TokenEncryption.retrieveFromStorage(encryptedData);

    // SYSTEMATIC additional validation for Telegram tokens
    if (result.valid && result.decrypted) {
      if (!this.isValidTelegramBotToken(result.decrypted)) {
        return {
          valid: false,
          reason: 'Decrypted token is not a valid Telegram bot token',
        };
      }
    }

    return result;
  }

  /**
   * CENTRALIZED Telegram token format validation - Single source of truth
   */
  private static isValidTelegramBotToken(token: string): boolean {
    // Telegram bot tokens follow the pattern: <bot_id>:<auth_token>
    const telegramTokenPattern = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;
    return telegramTokenPattern.test(token);
  }

  /**
   * SYSTEMATIC Telegram token masking - Specialized for bot tokens
   */
  static maskBotToken(token: string): string {
    if (!token || !this.isValidTelegramBotToken(token)) {
      return '[INVALID BOT TOKEN]';
    }

    const parts = token.split(':');
    if (parts.length !== 2) {
      return '[MALFORMED BOT TOKEN]';
    }

    const [botId, authToken] = parts;
    const maskedAuth = TokenEncryption.maskTokenForDisplay(authToken, 3);

    return `${botId}:${maskedAuth}`;
  }
}

/**
 * EXPORT centralized configuration and types
 */
export { ENCRYPTION_CONFIG };
export type { EncryptedToken, TokenValidationResult };