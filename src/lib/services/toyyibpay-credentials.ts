/**
 * toyyibPay Credentials Management Service
 * Secure handling of toyyibPay API credentials with encryption
 * Following the same pattern as EasyParcel credentials for consistency
 */

import { prisma } from '@/lib/db/prisma';
import { encryptData, decryptData } from '@/lib/utils/security';
import crypto from 'crypto';

export interface ToyyibPayCredentials {
  userSecretKey: string;
  environment: 'sandbox' | 'production';
  categoryCode?: string;
  lastUpdated?: Date;
  updatedBy?: string;
}

export interface ToyyibPayCredentialStatus {
  hasCredentials: boolean;
  environment: 'sandbox' | 'production';
  userSecretKeyMasked?: string;
  categoryCode?: string;
  lastUpdated?: Date;
  updatedBy?: string;
  isConfigured: boolean;
}

export interface EncryptedCredential {
  encrypted: string;
  iv: string;
  tag: string;
}

export class ToyyibPayCredentialsService {
  private static instance: ToyyibPayCredentialsService;
  private masterKey: string;
  private credentialCache: Map<string, { data: ToyyibPayCredentials; expires: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Derive master key from NEXTAUTH_SECRET for consistent encryption/decryption
    this.masterKey = this.deriveMasterKey();
  }

  public static getInstance(): ToyyibPayCredentialsService {
    if (!ToyyibPayCredentialsService.instance) {
      ToyyibPayCredentialsService.instance = new ToyyibPayCredentialsService();
    }
    return ToyyibPayCredentialsService.instance;
  }

  /**
   * Derive a consistent master key from environment secrets
   */
  private deriveMasterKey(): string {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret';
    const salt = 'toyyibpay-credentials-salt';
    return crypto.pbkdf2Sync(secret, salt, 10000, 32, 'sha256').toString('hex');
  }

  /**
   * Encrypt credential data
   */
  private encryptCredential(data: string): EncryptedCredential {
    const result = encryptData(data, this.masterKey);
    return {
      encrypted: result.encrypted,
      iv: result.iv,
      tag: result.tag
    };
  }

  /**
   * Decrypt credential data
   */
  private decryptCredential(encryptedData: EncryptedCredential): string {
    return decryptData(
      encryptedData.encrypted,
      this.masterKey,
      encryptedData.iv,
      encryptedData.tag
    );
  }

  /**
   * Store encrypted credentials in database
   */
  async storeCredentials(
    credentials: Pick<ToyyibPayCredentials, 'userSecretKey' | 'environment' | 'categoryCode'>,
    updatedBy: string
  ): Promise<void> {
    try {
      // Encrypt the user secret key
      const encryptedUserSecretKey = this.encryptCredential(credentials.userSecretKey);

      // Store in database using upsert pattern
      await Promise.all([
        // User Secret Key
        prisma.systemConfig.upsert({
          where: { key: 'toyyibpay_user_secret_key_encrypted' },
          update: {
            value: JSON.stringify(encryptedUserSecretKey),
            updatedAt: new Date()
          },
          create: {
            key: 'toyyibpay_user_secret_key_encrypted',
            value: JSON.stringify(encryptedUserSecretKey),
            type: 'json'
          }
        }),

        // Environment
        prisma.systemConfig.upsert({
          where: { key: 'toyyibpay_environment' },
          update: {
            value: credentials.environment,
            updatedAt: new Date()
          },
          create: {
            key: 'toyyibpay_environment',
            value: credentials.environment,
            type: 'string'
          }
        }),

        // Category Code (optional)
        prisma.systemConfig.upsert({
          where: { key: 'toyyibpay_category_code' },
          update: {
            value: credentials.categoryCode || '',
            updatedAt: new Date()
          },
          create: {
            key: 'toyyibpay_category_code',
            value: credentials.categoryCode || '',
            type: 'string'
          }
        }),

        // Metadata
        prisma.systemConfig.upsert({
          where: { key: 'toyyibpay_credentials_updated_by' },
          update: {
            value: updatedBy,
            updatedAt: new Date()
          },
          create: {
            key: 'toyyibpay_credentials_updated_by',
            value: updatedBy,
            type: 'string'
          }
        }),

        // Enable flag
        prisma.systemConfig.upsert({
          where: { key: 'toyyibpay_credentials_enabled' },
          update: {
            value: 'true',
            updatedAt: new Date()
          },
          create: {
            key: 'toyyibpay_credentials_enabled',
            value: 'true',
            type: 'boolean'
          }
        })
      ]);

      // Clear cache to force refresh
      this.clearCache();

      console.log('toyyibPay credentials stored successfully');
    } catch (error) {
      console.error('Error storing toyyibPay credentials:', error);
      throw new Error('Failed to store credentials securely');
    }
  }

  /**
   * Retrieve and decrypt credentials from database
   */
  async getCredentials(): Promise<ToyyibPayCredentials | null> {
    try {
      // Check cache first
      const cacheKey = 'toyyibpay_credentials';
      const cached = this.credentialCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }

      // Fetch from database
      const configs = await prisma.systemConfig.findMany({
        where: {
          key: {
            in: [
              'toyyibpay_user_secret_key_encrypted',
              'toyyibpay_environment',
              'toyyibpay_category_code',
              'toyyibpay_credentials_updated_by',
              'toyyibpay_credentials_enabled'
            ]
          }
        }
      });

      const configMap = new Map(configs.map(c => [c.key, c]));

      // Check if credentials are enabled
      const enabledConfig = configMap.get('toyyibpay_credentials_enabled');
      console.log(`🔍 toyyibPay credentials enabled check:`, enabledConfig?.value);
      if (!enabledConfig || enabledConfig.value !== 'true') {
        console.log(`❌ toyyibPay database credentials disabled`);
        return null;
      }

      const userSecretKeyConfig = configMap.get('toyyibpay_user_secret_key_encrypted');
      const environmentConfig = configMap.get('toyyibpay_environment');
      const categoryCodeConfig = configMap.get('toyyibpay_category_code');
      const updatedByConfig = configMap.get('toyyibpay_credentials_updated_by');

      console.log(`🔍 toyyibPay database credential check:`, {
        hasUserSecretKey: !!userSecretKeyConfig,
        environment: environmentConfig?.value,
        categoryCode: categoryCodeConfig?.value
      });

      if (!userSecretKeyConfig) {
        console.log(`❌ No encrypted toyyibPay credentials in database`);
        return null;
      }

      // Decrypt credentials
      const encryptedUserSecretKey: EncryptedCredential = JSON.parse(userSecretKeyConfig.value);
      const userSecretKey = this.decryptCredential(encryptedUserSecretKey);
      const environment = (environmentConfig?.value as 'sandbox' | 'production') || 'sandbox';
      
      console.log(`🔍 Decrypted toyyibPay credentials:`, {
        userSecretKey: userSecretKey ? `${userSecretKey.substring(0, 8)}...` : 'MISSING',
        environment,
        categoryCode: categoryCodeConfig?.value || 'Not set'
      });

      const credentials: ToyyibPayCredentials = {
        userSecretKey,
        environment,
        categoryCode: categoryCodeConfig?.value || undefined,
        lastUpdated: userSecretKeyConfig.updatedAt,
        updatedBy: updatedByConfig?.value
      };

      // Cache the result
      this.credentialCache.set(cacheKey, {
        data: credentials,
        expires: Date.now() + this.CACHE_DURATION
      });

      return credentials;
    } catch (error) {
      console.error('Error retrieving toyyibPay credentials:', error);
      return null;
    }
  }

  /**
   * Get credential status without exposing sensitive data
   */
  async getCredentialStatus(): Promise<ToyyibPayCredentialStatus> {
    try {
      const credentials = await this.getCredentials();
      
      if (credentials) {
        return {
          hasCredentials: true,
          environment: credentials.environment,
          userSecretKeyMasked: this.maskUserSecretKey(credentials.userSecretKey),
          categoryCode: credentials.categoryCode,
          lastUpdated: credentials.lastUpdated,
          updatedBy: credentials.updatedBy,
          isConfigured: true
        };
      }

      return {
        hasCredentials: false,
        environment: 'sandbox',
        isConfigured: false
      };
    } catch (error) {
      console.error('Error getting toyyibPay credential status:', error);
      return {
        hasCredentials: false,
        environment: 'sandbox',
        isConfigured: false
      };
    }
  }

  /**
   * Switch between sandbox and production environments
   */
  async switchEnvironment(environment: 'sandbox' | 'production', updatedBy: string): Promise<void> {
    try {
      // Check if we have stored credentials first
      const currentCredentials = await this.getCredentials();
      if (!currentCredentials) {
        throw new Error('No stored credentials found. Please configure toyyibPay API credentials first before switching environments.');
      }

      await prisma.systemConfig.upsert({
        where: { key: 'toyyibpay_environment' },
        update: {
          value: environment,
          updatedAt: new Date()
        },
        create: {
          key: 'toyyibpay_environment',
          value: environment,
          type: 'string'
        }
      });

      await prisma.systemConfig.upsert({
        where: { key: 'toyyibpay_credentials_updated_by' },
        update: {
          value: updatedBy,
          updatedAt: new Date()
        },
        create: {
          key: 'toyyibpay_credentials_updated_by',
          value: updatedBy,
          type: 'string'
        }
      });

      // Clear cache to force refresh
      this.clearCache();

      console.log(`toyyibPay environment switched to: ${environment}`);
    } catch (error) {
      console.error('Error switching toyyibPay environment:', error);
      throw error;
    }
  }

  /**
   * Clear stored credentials
   */
  async clearCredentials(): Promise<void> {
    try {
      await prisma.systemConfig.updateMany({
        where: {
          key: {
            in: [
              'toyyibpay_user_secret_key_encrypted',
              'toyyibpay_credentials_enabled'
            ]
          }
        },
        data: {
          value: 'false'
        }
      });

      // Clear cache
      this.clearCache();

      console.log('toyyibPay credentials cleared');
    } catch (error) {
      console.error('Error clearing toyyibPay credentials:', error);
      throw new Error('Failed to clear credentials');
    }
  }

  /**
   * Get credentials for toyyibPay service
   */
  async getCredentialsForService(): Promise<{
    userSecretKey: string;
    environment: 'sandbox' | 'production';
    categoryCode?: string;
    isSandbox: boolean;
  } | null> {
    const credentials = await this.getCredentials();
    if (!credentials) {
      return null;
    }

    return {
      userSecretKey: credentials.userSecretKey,
      environment: credentials.environment,
      categoryCode: credentials.categoryCode,
      isSandbox: credentials.environment === 'sandbox'
    };
  }

  /**
   * Validate API credentials by making a test call to toyyibPay
   */
  async validateCredentials(userSecretKey: string, environment: 'sandbox' | 'production'): Promise<{
    isValid: boolean;
    error?: string;
    responseTime?: number;
    endpoint?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Use different URLs based on environment
      const baseUrl = environment === 'sandbox' 
        ? process.env.TOYYIBPAY_SANDBOX_URL || 'https://dev.toyyibpay.com'
        : process.env.TOYYIBPAY_PRODUCTION_URL || 'https://toyyibpay.com';
      
      console.log(`🔍 Testing toyyibPay API - Environment: ${environment}, URL: ${baseUrl}`);

      // Test with createCategory endpoint to validate credentials
      const formData = new FormData();
      formData.append('userSecretKey', userSecretKey);
      formData.append('catname', 'TEST_CATEGORY_' + Date.now());
      formData.append('catdescription', 'Test category for credential validation');

      const response = await fetch(`${baseUrl}/index.php/api/createCategory`, {
        method: 'POST',
        body: formData,
        timeout: 15000 // 15 second timeout
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          isValid: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
          endpoint: baseUrl
        };
      }

      const responseText = await response.text();
      console.log(`🔍 toyyibPay API Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      
      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
          return {
            isValid: false,
            error: 'Server error - HTML response received',
            responseTime,
            endpoint: baseUrl
          };
        }
        return {
          isValid: false,
          error: 'Invalid JSON response',
          responseTime,
          endpoint: baseUrl
        };
      }

      // Check toyyibPay API response format
      // toyyibPay returns different status codes:
      // 0 = Success, 1 = Error/Invalid
      if (data[0]?.CategoryCode) {
        // Success - category was created
        return {
          isValid: true,
          responseTime,
          endpoint: baseUrl
        };
      } else if (data[0]?.msg && data[0]?.msg.includes('Category already exist')) {
        // Also success - means API key is valid but category name exists
        return {
          isValid: true,
          responseTime,
          endpoint: baseUrl
        };
      } else if (data[0]?.msg) {
        // Error message from toyyibPay
        return {
          isValid: false,
          error: data[0].msg,
          responseTime,
          endpoint: baseUrl
        };
      }

      // Fallback for unexpected response format
      return {
        isValid: false,
        error: 'Unexpected API response format',
        responseTime,
        endpoint: baseUrl
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const baseUrl = environment === 'sandbox' 
        ? process.env.TOYYIBPAY_SANDBOX_URL || 'https://dev.toyyibpay.com'
        : process.env.TOYYIBPAY_PRODUCTION_URL || 'https://toyyibpay.com';
      
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        endpoint: baseUrl
      };
    }
  }

  /**
   * Mask user secret key for display purposes
   */
  private maskUserSecretKey(userSecretKey: string): string {
    if (!userSecretKey || userSecretKey.length < 6) {
      return '***';
    }
    return userSecretKey.substring(0, 3) + '*'.repeat(Math.max(6, userSecretKey.length - 3));
  }

  /**
   * Clear credential cache
   */
  private clearCache(): void {
    this.credentialCache.clear();
  }

  /**
   * Create audit log entry for credential operations
   */
  async logCredentialOperation(
    operation: string,
    userId: string,
    details?: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: `TOYYIBPAY_CREDENTIALS_${operation.toUpperCase()}`,
          resource: 'TOYYIBPAY_CREDENTIALS',
          details: {
            operation,
            timestamp: new Date().toISOString(),
            ...details
          }
        }
      });
    } catch (error) {
      console.error('Error logging toyyibPay credential operation:', error);
      // Don't throw here as it's logging, not critical
    }
  }
}

// Export singleton instance
export const toyyibPayCredentialsService = ToyyibPayCredentialsService.getInstance();