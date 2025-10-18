import crypto from 'crypto';

/**
 * Encryption Service for sensitive business data
 * Following @CLAUDE.md principles - centralized, secure, no hardcoding
 */
export class EncryptionService {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32; // 256 bits
  private static readonly ivLength = 16; // 128 bits
  private static readonly tagLength = 16; // 128 bits

  private static get secretKey(): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    if (key.length !== 64) {
      // 32 bytes = 64 hex chars
      throw new Error(
        'ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)'
      );
    }
    return key;
  }

  /**
   * Encrypt sensitive text data
   * @param text Plain text to encrypt
   * @returns Encrypted data as hex string (iv:tag:encrypted)
   */
  static encrypt(text: string): string {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text to encrypt must be a non-empty string');
      }

      const key = Buffer.from(this.secretKey, 'hex');
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key, iv);

      // Additional authentication data for integrity
      const aad = Buffer.from('business-sensitive-data', 'utf8');
      cipher.setAAD(aad);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Format: iv:tag:encrypted (all in hex)
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt encrypted data
   * @param encryptedData Encrypted data in format (iv:tag:encrypted)
   * @returns Decrypted plain text
   */
  static decrypt(encryptedData: string): string {
    try {
      if (!encryptedData || typeof encryptedData !== 'string') {
        throw new Error('Encrypted data must be a non-empty string');
      }

      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, tagHex, encrypted] = parts;
      const key = Buffer.from(this.secretKey, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      const decipher = crypto.createDecipher(this.algorithm, key, iv);

      // Set additional authentication data
      const aad = Buffer.from('business-sensitive-data', 'utf8');
      decipher.setAAD(aad);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Generate a new encryption key (for setup/rotation)
   * @returns New encryption key as hex string
   */
  static generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Validate if data is encrypted (basic format check)
   * @param data Data to check
   * @returns True if data appears to be encrypted
   */
  static isEncrypted(data: string): boolean {
    if (!data || typeof data !== 'string') {
      return false;
    }

    const parts = data.split(':');
    if (parts.length !== 3) {
      return false;
    }

    // Check if parts are valid hex strings of expected lengths
    const [iv, tag, encrypted] = parts;
    const hexRegex = /^[0-9a-fA-F]+$/;

    return (
      hexRegex.test(iv) &&
      iv.length === this.ivLength * 2 &&
      hexRegex.test(tag) &&
      tag.length === this.tagLength * 2 &&
      hexRegex.test(encrypted) &&
      encrypted.length > 0
    );
  }

  /**
   * Hash sensitive data for comparison (one-way)
   * @param data Data to hash
   * @param salt Optional salt (generates random if not provided)
   * @returns Hash in format salt:hash
   */
  static hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verify hashed data
   * @param data Plain data to verify
   * @param hashedData Hashed data in format salt:hash
   * @returns True if data matches hash
   */
  static verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      const verifyHash = this.hash(data, salt);
      return verifyHash === hashedData;
    } catch (error) {
      console.error('Hash verification failed:', error);
      return false;
    }
  }
}
