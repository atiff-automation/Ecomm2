/**
 * Encryption Utilities for Sensitive Data
 * Centralized encryption service following security best practices
 */

import crypto from 'crypto';
import { EncryptedData } from '@/lib/types/telegram-config.types';

// Encryption configuration (Single Source of Truth)
const ENCRYPTION_CONFIG = {
  ALGORITHM: 'aes-256-gcm' as const,
  KEY_LENGTH: 32,
  IV_LENGTH: 16,
  TAG_LENGTH: 16,
  SALT_LENGTH: 32,
  PBKDF2_ITERATIONS: 100000,
} as const;

/**
 * Get encryption key from environment
 * Centralizes key management and validation
 */
function getEncryptionKey(): string {
  const key = process.env.TELEGRAM_CONFIG_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'TELEGRAM_CONFIG_ENCRYPTION_KEY environment variable is required for secure token storage'
    );
  }
  
  // Validate key format (should be base64 encoded)
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(key)) {
    throw new Error(
      'TELEGRAM_CONFIG_ENCRYPTION_KEY must be a valid base64 encoded key'
    );
  }
  
  const keyBuffer = Buffer.from(key, 'base64');
  
  if (keyBuffer.length !== ENCRYPTION_CONFIG.KEY_LENGTH) {
    throw new Error(
      `TELEGRAM_CONFIG_ENCRYPTION_KEY must be ${ENCRYPTION_CONFIG.KEY_LENGTH} bytes when decoded from base64`
    );
  }
  
  return key;
}

/**
 * Generate a secure encryption key (for setup/deployment)
 * Used for generating new encryption keys
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(ENCRYPTION_CONFIG.KEY_LENGTH);
  return key.toString('base64');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Provides authenticated encryption with associated data
 */
export function encryptSensitiveData(plaintext: string): EncryptedData {
  try {
    // Get encryption key
    const keyBase64 = getEncryptionKey();
    const key = Buffer.from(keyBase64, 'base64');
    
    // Generate random IV
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.IV_LENGTH);
    
    // Create cipher with proper GCM method
    const cipher = crypto.createCipherGCM(ENCRYPTION_CONFIG.ALGORITHM, key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Get authentication tag for GCM mode
    const tag = cipher.getAuthTag();
    
    // Combine encrypted data and tag
    const encryptedWithTag = Buffer.concat([encrypted, tag]);
    
    return {
      encrypted: encryptedWithTag.toString('base64'),
      iv: iv.toString('base64'),
      algorithm: ENCRYPTION_CONFIG.ALGORITHM,
    };
  } catch (error) {
    throw new Error(`Failed to encrypt sensitive data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * Verifies authentication tag before decryption
 */
export function decryptSensitiveData(encryptedData: EncryptedData): string {
  try {
    // Validate input
    if (!encryptedData.encrypted || !encryptedData.iv || !encryptedData.algorithm) {
      throw new Error('Invalid encrypted data format');
    }
    
    if (encryptedData.algorithm !== ENCRYPTION_CONFIG.ALGORITHM) {
      throw new Error(`Unsupported encryption algorithm: ${encryptedData.algorithm}`);
    }
    
    // Get encryption key
    const keyBase64 = getEncryptionKey();
    const key = Buffer.from(keyBase64, 'base64');
    
    // Parse encrypted data and tag
    const encryptedBuffer = Buffer.from(encryptedData.encrypted, 'base64');
    const encrypted = encryptedBuffer.subarray(0, encryptedBuffer.length - ENCRYPTION_CONFIG.TAG_LENGTH);
    const tag = encryptedBuffer.subarray(encryptedBuffer.length - ENCRYPTION_CONFIG.TAG_LENGTH);
    
    // Parse IV
    const iv = Buffer.from(encryptedData.iv, 'base64');
    
    // Create decipher with proper GCM method
    const decipher = crypto.createDecipherGCM(ENCRYPTION_CONFIG.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt sensitive data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if data appears to be encrypted
 * Utility for determining if stored value needs decryption
 */
export function isEncryptedData(value: any): value is EncryptedData {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.encrypted === 'string' &&
    typeof value.iv === 'string' &&
    typeof value.algorithm === 'string'
  );
}

/**
 * Safe encryption wrapper that handles errors gracefully
 * Returns null instead of throwing for invalid inputs
 */
export function safeEncrypt(plaintext: string | null): EncryptedData | null {
  if (!plaintext) return null;
  
  try {
    return encryptSensitiveData(plaintext);
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

/**
 * Safe decryption wrapper that handles errors gracefully
 * Returns null instead of throwing for invalid inputs
 */
export function safeDecrypt(encryptedData: EncryptedData | null): string | null {
  if (!encryptedData) return null;
  
  try {
    return decryptSensitiveData(encryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

/**
 * Hash sensitive data for comparison purposes
 * Used for change detection without storing plaintext
 */
export function hashSensitiveData(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Validate encryption key strength
 * Ensures key meets security requirements
 */
export function validateEncryptionKey(key: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check format
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(key)) {
    errors.push('Key must be valid base64 encoded string');
  } else {
    const keyBuffer = Buffer.from(key, 'base64');
    
    // Check length
    if (keyBuffer.length !== ENCRYPTION_CONFIG.KEY_LENGTH) {
      errors.push(`Key must be ${ENCRYPTION_CONFIG.KEY_LENGTH} bytes when decoded`);
    }
    
    // Check entropy (basic)
    const uniqueBytes = new Set(keyBuffer).size;
    if (uniqueBytes < 16) {
      warnings.push('Key appears to have low entropy - consider regenerating');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Environment setup helper
 * Provides guidance for encryption key setup
 */
export function getEncryptionSetupInstructions(): {
  keyGenerated: string;
  instructions: string[];
} {
  const newKey = generateEncryptionKey();
  
  return {
    keyGenerated: newKey,
    instructions: [
      'Add the following to your .env file:',
      `TELEGRAM_CONFIG_ENCRYPTION_KEY="${newKey}"`,
      '',
      'Keep this key secure and never commit it to version control.',
      'Use different keys for development, staging, and production.',
      'Store production keys in secure environment variable services.',
      'If you lose this key, all encrypted data will be unrecoverable.',
    ],
  };
}