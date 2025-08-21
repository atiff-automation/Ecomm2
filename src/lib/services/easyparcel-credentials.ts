/**
 * EasyParcel Credentials Management Service
 * Secure handling of EasyParcel API credentials with encryption
 */

import { prisma } from '@/lib/db/prisma';
import { encryptData, decryptData } from '@/lib/utils/security';
import crypto from 'crypto';

export interface EasyParcelCredentials {
  apiKey: string;
  apiSecret: string;
  environment: 'sandbox' | 'production';
  lastUpdated?: Date;
  updatedBy?: string;
}

export interface CredentialStatus {
  hasCredentials: boolean;
  environment: 'sandbox' | 'production';
  apiKeyMasked?: string;
  lastUpdated?: Date;
  updatedBy?: string;
  isUsingEnvFallback: boolean;
}

export interface EncryptedCredential {
  encrypted: string;
  iv: string;
  tag: string;
}

export class EasyParcelCredentialsService {
  private static instance: EasyParcelCredentialsService;
  private masterKey: string;
  private credentialCache: Map<string, { data: EasyParcelCredentials; expires: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Derive master key from NEXTAUTH_SECRET for consistent encryption/decryption
    this.masterKey = this.deriveMasterKey();
  }

  public static getInstance(): EasyParcelCredentialsService {
    if (!EasyParcelCredentialsService.instance) {
      EasyParcelCredentialsService.instance = new EasyParcelCredentialsService();
    }
    return EasyParcelCredentialsService.instance;
  }

  /**
   * Derive a consistent master key from environment secrets
   */
  private deriveMasterKey(): string {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret';
    const salt = 'easyparcel-credentials-salt';
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
    credentials: Pick<EasyParcelCredentials, 'apiKey' | 'apiSecret' | 'environment'>,
    updatedBy: string
  ): Promise<void> {
    try {
      // Encrypt the credentials
      const encryptedApiKey = this.encryptCredential(credentials.apiKey);
      const encryptedApiSecret = this.encryptCredential(credentials.apiSecret);

      // Store in database using upsert pattern
      await Promise.all([
        // API Key
        prisma.systemConfig.upsert({
          where: { key: 'easyparcel_api_key_encrypted' },
          update: {
            value: JSON.stringify(encryptedApiKey),
            updatedAt: new Date()
          },
          create: {
            key: 'easyparcel_api_key_encrypted',
            value: JSON.stringify(encryptedApiKey),
            type: 'json'
          }
        }),

        // API Secret
        prisma.systemConfig.upsert({
          where: { key: 'easyparcel_api_secret_encrypted' },
          update: {
            value: JSON.stringify(encryptedApiSecret),
            updatedAt: new Date()
          },
          create: {
            key: 'easyparcel_api_secret_encrypted',
            value: JSON.stringify(encryptedApiSecret),
            type: 'json'
          }
        }),

        // Environment
        prisma.systemConfig.upsert({
          where: { key: 'easyparcel_environment' },
          update: {
            value: credentials.environment,
            updatedAt: new Date()
          },
          create: {
            key: 'easyparcel_environment',
            value: credentials.environment,
            type: 'string'
          }
        }),

        // Metadata
        prisma.systemConfig.upsert({
          where: { key: 'easyparcel_credentials_updated_by' },
          update: {
            value: updatedBy,
            updatedAt: new Date()
          },
          create: {
            key: 'easyparcel_credentials_updated_by',
            value: updatedBy,
            type: 'string'
          }
        }),

        // Enable flag
        prisma.systemConfig.upsert({
          where: { key: 'easyparcel_credentials_enabled' },
          update: {
            value: 'true',
            updatedAt: new Date()
          },
          create: {
            key: 'easyparcel_credentials_enabled',
            value: 'true',
            type: 'boolean'
          }
        })
      ]);

      // Clear cache to force refresh
      this.clearCache();

      console.log('EasyParcel credentials stored successfully');
    } catch (error) {
      console.error('Error storing EasyParcel credentials:', error);
      throw new Error('Failed to store credentials securely');
    }
  }

  /**
   * Retrieve and decrypt credentials from database
   */
  async getCredentials(): Promise<EasyParcelCredentials | null> {
    try {
      // Check cache first
      const cacheKey = 'easyparcel_credentials';
      const cached = this.credentialCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }

      // Fetch from database
      const configs = await prisma.systemConfig.findMany({
        where: {
          key: {
            in: [
              'easyparcel_api_key_encrypted',
              'easyparcel_api_secret_encrypted',
              'easyparcel_environment',
              'easyparcel_credentials_updated_by',
              'easyparcel_credentials_enabled'
            ]
          }
        }
      });

      const configMap = new Map(configs.map(c => [c.key, c]));

      // Check if credentials are enabled
      const enabledConfig = configMap.get('easyparcel_credentials_enabled');
      console.log(`🔍 Credentials enabled check:`, enabledConfig?.value);
      if (!enabledConfig || enabledConfig.value !== 'true') {
        console.log(`❌ Database credentials disabled, falling back to environment variables`);
        return null; // Fall back to environment variables
      }

      const apiKeyConfig = configMap.get('easyparcel_api_key_encrypted');
      const apiSecretConfig = configMap.get('easyparcel_api_secret_encrypted');
      const environmentConfig = configMap.get('easyparcel_environment');
      const updatedByConfig = configMap.get('easyparcel_credentials_updated_by');

      console.log(`🔍 Database credential check:`, {
        hasApiKey: !!apiKeyConfig,
        hasApiSecret: !!apiSecretConfig,
        environment: environmentConfig?.value
      });

      if (!apiKeyConfig || !apiSecretConfig) {
        console.log(`❌ No encrypted credentials in database, falling back to environment variables`);
        return null; // No credentials stored
      }

      // Decrypt credentials
      const encryptedApiKey: EncryptedCredential = JSON.parse(apiKeyConfig.value);
      const encryptedApiSecret: EncryptedCredential = JSON.parse(apiSecretConfig.value);

      const apiKey = this.decryptCredential(encryptedApiKey);
      const apiSecret = this.decryptCredential(encryptedApiSecret);
      const environment = (environmentConfig?.value as 'sandbox' | 'production') || 'sandbox';

      const credentials: EasyParcelCredentials = {
        apiKey,
        apiSecret,
        environment,
        lastUpdated: apiKeyConfig.updatedAt,
        updatedBy: updatedByConfig?.value
      };

      // Cache the result
      this.credentialCache.set(cacheKey, {
        data: credentials,
        expires: Date.now() + this.CACHE_DURATION
      });

      return credentials;
    } catch (error) {
      console.error('Error retrieving EasyParcel credentials:', error);
      return null; // Fall back to environment variables
    }
  }

  /**
   * Get credential status without exposing sensitive data
   */
  async getCredentialStatus(): Promise<CredentialStatus> {
    try {
      const credentials = await this.getCredentials();
      
      if (credentials) {
        return {
          hasCredentials: true,
          environment: credentials.environment,
          apiKeyMasked: this.maskApiKey(credentials.apiKey),
          lastUpdated: credentials.lastUpdated,
          updatedBy: credentials.updatedBy,
          isUsingEnvFallback: false
        };
      }

      // Check if environment variables are available as fallback
      const hasEnvCredentials = !!(process.env.EASYPARCEL_API_KEY && process.env.EASYPARCEL_API_SECRET);
      const envEnvironment = process.env.EASYPARCEL_SANDBOX === 'true' ? 'sandbox' : 'production';

      return {
        hasCredentials: hasEnvCredentials,
        environment: envEnvironment,
        apiKeyMasked: hasEnvCredentials ? this.maskApiKey(process.env.EASYPARCEL_API_KEY!) : undefined,
        isUsingEnvFallback: hasEnvCredentials
      };
    } catch (error) {
      console.error('Error getting credential status:', error);
      return {
        hasCredentials: false,
        environment: 'sandbox',
        isUsingEnvFallback: false
      };
    }
  }

  /**
   * Switch between sandbox and production environments
   */
  async switchEnvironment(environment: 'sandbox' | 'production', updatedBy: string): Promise<void> {
    try {
      // CRITICAL: Check if we have stored credentials first
      const currentCredentials = await this.getCredentials();
      if (!currentCredentials) {
        throw new Error('No stored credentials found. Please configure API credentials first before switching environments.');
      }

      await prisma.systemConfig.upsert({
        where: { key: 'easyparcel_environment' },
        update: {
          value: environment,
          updatedAt: new Date()
        },
        create: {
          key: 'easyparcel_environment',
          value: environment,
          type: 'string'
        }
      });

      await prisma.systemConfig.upsert({
        where: { key: 'easyparcel_credentials_updated_by' },
        update: {
          value: updatedBy,
          updatedAt: new Date()
        },
        create: {
          key: 'easyparcel_credentials_updated_by',
          value: updatedBy,
          type: 'string'
        }
      });

      // Clear cache to force refresh
      this.clearCache();

      console.log(`EasyParcel environment switched to: ${environment}`);
    } catch (error) {
      console.error('Error switching environment:', error);
      throw error; // Re-throw the original error
    }
  }

  /**
   * Clear stored credentials and fallback to environment variables
   */
  async clearCredentials(): Promise<void> {
    try {
      await prisma.systemConfig.updateMany({
        where: {
          key: {
            in: [
              'easyparcel_api_key_encrypted',
              'easyparcel_api_secret_encrypted',
              'easyparcel_credentials_enabled'
            ]
          }
        },
        data: {
          value: 'false' // This will effectively disable database credentials
        }
      });

      // Clear cache
      this.clearCache();

      console.log('EasyParcel credentials cleared, falling back to environment variables');
    } catch (error) {
      console.error('Error clearing credentials:', error);
      throw new Error('Failed to clear credentials');
    }
  }

  /**
   * Get credentials for EasyParcel service (with fallback to env vars)
   */
  async getCredentialsForService(): Promise<{
    apiKey: string;
    apiSecret: string;
    isSandbox: boolean;
    source: 'database' | 'environment';
  } | null> {
    // Try database first
    const dbCredentials = await this.getCredentials();
    if (dbCredentials) {
      return {
        apiKey: dbCredentials.apiKey,
        apiSecret: dbCredentials.apiSecret,
        isSandbox: dbCredentials.environment === 'sandbox',
        source: 'database'
      };
    }

    // Fallback to environment variables
    const envApiKey = process.env.EASYPARCEL_API_KEY;
    const envApiSecret = process.env.EASYPARCEL_API_SECRET;
    const envSandbox = process.env.EASYPARCEL_SANDBOX === 'true';

    if (envApiKey && envApiSecret) {
      return {
        apiKey: envApiKey,
        apiSecret: envApiSecret,
        isSandbox: envSandbox,
        source: 'environment'
      };
    }

    return null; // No credentials available
  }

  /**
   * Validate API credentials by making a test call
   */
  async validateCredentials(apiKey: string, apiSecret: string, environment: 'sandbox' | 'production'): Promise<{
    isValid: boolean;
    error?: string;
    responseTime?: number;
    servicesFound?: number;
    endpoint?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // STRICT: Use URL based on environment setting only
      const baseUrl = environment === 'sandbox' 
        ? 'http://demo.connect.easyparcel.my'  // Sandbox URL
        : 'https://connect.easyparcel.my';     // Production URL
      
      console.log(`🔍 Testing EasyParcel API - Environment: ${environment}, URL: ${baseUrl}`);

      // Use the same API format as the working EasyParcel service
      const formData = new URLSearchParams();
      formData.append('api', apiKey);

      const response = await fetch(`${baseUrl}/?ac=EPCheckCreditBalance`, {
        method: 'POST',
        body: formData.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-API-SECRET': apiSecret,
        }
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          isValid: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }

      const responseText = await response.text();
      console.log(`🔍 API Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      
      // Handle EasyParcel sandbox behavior - may return empty/minimal response
      if (!responseText || responseText.trim().length === 0) {
        // For sandbox, empty response with 200 status indicates successful authentication
        if (environment === 'sandbox') {
          return {
            isValid: true,
            responseTime,
            servicesFound: 0, // Sandbox may return no services
            endpoint: baseUrl
          };
        } else {
          return {
            isValid: false,
            error: 'Empty response from API',
            responseTime,
            endpoint: baseUrl
          };
        }
      }

      // Try to parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // For EasyParcel API, sometimes HTML errors are returned
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
      
      // Check EasyParcel API response format
      if (data.api_status === 'Success') {
        return {
          isValid: true,
          responseTime,
          servicesFound: data.result ? 1 : 0,
          endpoint: baseUrl
        };
      } else if (data.api_status === 'Fail' || data.error_remark) {
        return {
          isValid: false,
          error: data.error_remark || 'API authentication failed',
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
        ? 'http://demo.connect.easyparcel.my'
        : 'https://connect.easyparcel.my';
      
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        endpoint: baseUrl
      };
    }
  }

  /**
   * Mask API key for display purposes
   */
  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 6) {
      return '***';
    }
    return apiKey.substring(0, 3) + '*'.repeat(Math.max(6, apiKey.length - 3));
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
          action: `EASYPARCEL_CREDENTIALS_${operation.toUpperCase()}`,
          resource: 'EASYPARCEL_CREDENTIALS',
          details: {
            operation,
            timestamp: new Date().toISOString(),
            ...details
          }
        }
      });
    } catch (error) {
      console.error('Error logging credential operation:', error);
      // Don't throw here as it's logging, not critical
    }
  }
}

// Export singleton instance
export const easyParcelCredentialsService = EasyParcelCredentialsService.getInstance();