/**
 * EasyParcel Credentials Management Service
 * Secure handling of EasyParcel API credentials with encryption
 */

import { prisma } from '@/lib/db/prisma';
import { encryptData, decryptData } from '@/lib/utils/security';
// TODO: Restore easyparcel-config import after new simple implementation
// import {
//   easyParcelConfig,
//   getEasyParcelUrl,
// } from '@/lib/config/easyparcel-config';
import crypto from 'crypto';

// Temporary inline config until new system is implemented
const easyParcelConfig = {
  production: {
    url: process.env.EASYPARCEL_PRODUCTION_URL || 'https://connect.easyparcel.my',
    timeout: parseInt(process.env.EASYPARCEL_PRODUCTION_TIMEOUT || '15000')
  },
  sandbox: {
    url: process.env.EASYPARCEL_SANDBOX_URL || 'http://demo.connect.easyparcel.my',
    timeout: parseInt(process.env.EASYPARCEL_SANDBOX_TIMEOUT || '60000')
  }
};

const getEasyParcelUrl = (isSandbox: boolean) => {
  return isSandbox ? easyParcelConfig.sandbox.url : easyParcelConfig.production.url;
};

export interface EasyParcelCredentials {
  apiKey: string;
  endpoint: string;
  lastUpdated?: Date;
  updatedBy?: string;
}

export interface CredentialStatus {
  hasCredentials: boolean;
  endpoint: string;
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
  private credentialCache: Map<
    string,
    { data: EasyParcelCredentials; expires: number }
  > = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Derive master key from NEXTAUTH_SECRET for consistent encryption/decryption
    this.masterKey = this.deriveMasterKey();
  }

  public static getInstance(): EasyParcelCredentialsService {
    if (!EasyParcelCredentialsService.instance) {
      EasyParcelCredentialsService.instance =
        new EasyParcelCredentialsService();
    }
    return EasyParcelCredentialsService.instance;
  }

  /**
   * Derive a consistent master key from environment secrets
   */
  private deriveMasterKey(): string {
    const secret =
      process.env.NEXTAUTH_SECRET ||
      process.env.JWT_SECRET ||
      'fallback-secret';
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
      tag: result.tag,
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
    credentials: Pick<
      EasyParcelCredentials,
      'apiKey' | 'endpoint'
    >,
    updatedBy: string
  ): Promise<void> {
    try {
      // Encrypt the credentials
      const encryptedApiKey = this.encryptCredential(credentials.apiKey);

      // Store in database using upsert pattern
      await Promise.all([
        // API Key
        prisma.systemConfig.upsert({
          where: { key: 'easyparcel_api_key_encrypted' },
          update: {
            value: JSON.stringify(encryptedApiKey),
            updatedAt: new Date(),
          },
          create: {
            key: 'easyparcel_api_key_encrypted',
            value: JSON.stringify(encryptedApiKey),
            type: 'json',
          },
        }),

        // Endpoint URL
        prisma.systemConfig.upsert({
          where: { key: 'easyparcel_endpoint' },
          update: {
            value: credentials.endpoint,
            updatedAt: new Date(),
          },
          create: {
            key: 'easyparcel_endpoint',
            value: credentials.endpoint,
            type: 'string',
          },
        }),

        // Metadata
        prisma.systemConfig.upsert({
          where: { key: 'easyparcel_credentials_updated_by' },
          update: {
            value: updatedBy,
            updatedAt: new Date(),
          },
          create: {
            key: 'easyparcel_credentials_updated_by',
            value: updatedBy,
            type: 'string',
          },
        }),

        // Enable flag
        prisma.systemConfig.upsert({
          where: { key: 'easyparcel_credentials_enabled' },
          update: {
            value: 'true',
            updatedAt: new Date(),
          },
          create: {
            key: 'easyparcel_credentials_enabled',
            value: 'true',
            type: 'boolean',
          },
        }),
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
              'easyparcel_endpoint',
              'easyparcel_credentials_updated_by',
              'easyparcel_credentials_enabled',
            ],
          },
        },
      });

      const configMap = new Map(configs.map(c => [c.key, c]));

      // Check if credentials are enabled
      const enabledConfig = configMap.get('easyparcel_credentials_enabled');
      console.log(`🔍 Credentials enabled check:`, enabledConfig?.value);
      if (!enabledConfig || enabledConfig.value !== 'true') {
        console.log(
          `❌ Database credentials disabled, falling back to environment variables`
        );
        return null; // Fall back to environment variables
      }

      const apiKeyConfig = configMap.get('easyparcel_api_key_encrypted');
      const endpointConfig = configMap.get('easyparcel_endpoint');
      const updatedByConfig = configMap.get(
        'easyparcel_credentials_updated_by'
      );

      console.log(`🔍 Database credential check:`, {
        hasApiKey: !!apiKeyConfig,
        endpoint: endpointConfig?.value,
      });

      if (!apiKeyConfig) {
        console.log(
          `❌ No encrypted API key in database, falling back to environment variables`
        );
        return null; // No credentials stored
      }

      // Decrypt credentials
      const encryptedApiKey: EncryptedCredential = JSON.parse(
        apiKeyConfig.value
      );

      const apiKey = this.decryptCredential(encryptedApiKey);
      // Remove hardcoded fallback - if no endpoint stored, return null
      const endpoint = endpointConfig?.value;
      if (!endpoint) {
        console.log('❌ No endpoint configured in database');
        return null;
      }

      console.log(`🔍 Decrypted credentials:`, {
        apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING',
        endpoint,
      });

      const credentials: EasyParcelCredentials = {
        apiKey,
        endpoint,
        lastUpdated: apiKeyConfig.updatedAt,
        updatedBy: updatedByConfig?.value,
      };

      // Cache the result
      this.credentialCache.set(cacheKey, {
        data: credentials,
        expires: Date.now() + this.CACHE_DURATION,
      });

      return credentials;
    } catch (error) {
      console.error('Error retrieving EasyParcel credentials:', error);
      return null; // Fall back to environment variables
    }
  }

  /**
   * Get credential status without exposing sensitive data
   * Follows @CLAUDE.md systematic approach with environment-aware behavior
   */
  async getCredentialStatus(): Promise<CredentialStatus> {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const isStrictMode = isProduction || process.env.EASYPARCEL_STRICT_MODE === 'true';

      const credentials = await this.getCredentials();

      if (credentials) {
        return {
          hasCredentials: true,
          endpoint: credentials.endpoint,
          apiKeyMasked: this.maskApiKey(credentials.apiKey),
          lastUpdated: credentials.lastUpdated,
          updatedBy: credentials.updatedBy,
          isUsingEnvFallback: false,
        };
      }

      // Production mode: no fallback status checking
      if (isStrictMode) {
        return {
          hasCredentials: false,
          endpoint: '', // Empty when no credentials configured
          isUsingEnvFallback: false,
        };
      }

      // Development mode only: check environment variable fallback
      const hasEnvCredentials = !!(
        process.env.EASYPARCEL_API_KEY && process.env.EASYPARCEL_API_SECRET
      );
      const envEndpoint = process.env.EASYPARCEL_ENDPOINT || '';

      return {
        hasCredentials: hasEnvCredentials,
        endpoint: envEndpoint,
        apiKeyMasked: hasEnvCredentials
          ? this.maskApiKey(process.env.EASYPARCEL_API_KEY!)
          : undefined,
        isUsingEnvFallback: hasEnvCredentials,
      };
    } catch (error) {
      console.error('Error getting credential status:', error);
      return {
        hasCredentials: false,
        endpoint: '', // Empty when error occurs
        isUsingEnvFallback: false,
      };
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
              'easyparcel_credentials_enabled',
            ],
          },
        },
        data: {
          value: 'false', // This will effectively disable database credentials
        },
      });

      // Clear cache
      this.clearCache();

      console.log(
        'EasyParcel credentials cleared, falling back to environment variables'
      );
    } catch (error) {
      console.error('Error clearing credentials:', error);
      throw new Error('Failed to clear credentials');
    }
  }

  /**
   * Get credentials for EasyParcel service (production-ready)
   * Follows @CLAUDE.md single source of truth principle
   */
  async getCredentialsForService(): Promise<{
    apiKey: string;
    endpoint: string;
    source: 'database' | 'environment';
  } | null> {
    const isProduction = process.env.NODE_ENV === 'production';
    const isStrictMode = isProduction || process.env.EASYPARCEL_STRICT_MODE === 'true';

    // Try database first - primary source of truth
    const dbCredentials = await this.getCredentials();
    if (dbCredentials) {
      return {
        apiKey: dbCredentials.apiKey,
        endpoint: dbCredentials.endpoint,
        source: 'database',
      };
    }

    // Production mode: NO fallbacks - database credentials required
    if (isStrictMode) {
      console.error('🚫 Production mode: EasyParcel credentials must be configured in database via System Settings');
      return null; // Force configuration through admin UI
    }

    // Development mode only: fallback to environment variables for developer convenience
    const envApiKey = process.env.EASYPARCEL_API_KEY;
    const envEndpoint = process.env.EASYPARCEL_ENDPOINT;

    if (!envEndpoint && envApiKey) {
      console.error('⚠️ Environment variable EASYPARCEL_ENDPOINT is required when using EASYPARCEL_API_KEY');
      return null;
    }

    if (envApiKey) {
      console.warn('⚠️ Development mode: Using environment variable fallback. Configure credentials in System Settings for production.');
      return {
        apiKey: envApiKey,
        endpoint: envEndpoint,
        source: 'environment',
      };
    }

    return null; // No credentials available
  }

  /**
   * Validate API credentials by making a test call
   */
  async validateCredentials(
    apiKey: string,
    endpoint: string
  ): Promise<{
    isValid: boolean;
    error?: string;
    responseTime?: number;
    servicesFound?: number;
    endpoint?: string;
  }> {
    const startTime = Date.now();

    try {
      console.log(
        `🔍 Testing EasyParcel API - Endpoint: ${endpoint}`
      );

      // Use the same API format as the working EasyParcel service
      const formData = new URLSearchParams();
      formData.append('api', apiKey);

      const response = await fetch(`${endpoint}/?ac=EPCheckCreditBalance`, {
        method: 'POST',
        body: formData.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return {
          isValid: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
          endpoint,
        };
      }

      const responseText = await response.text();
      console.log(
        `🔍 API Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`
      );

      // Handle EasyParcel empty response behavior
      if (!responseText || responseText.trim().length === 0) {
        // Empty response with 200 status may indicate successful authentication
        return {
          isValid: true,
          responseTime,
          servicesFound: 0,
          endpoint,
        };
      }

      // Try to parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // For EasyParcel API, sometimes HTML errors are returned
        if (
          responseText.includes('<!DOCTYPE') ||
          responseText.includes('<html>')
        ) {
          return {
            isValid: false,
            error: 'Server error - HTML response received',
            responseTime,
            endpoint,
          };
        }
        return {
          isValid: false,
          error: 'Invalid JSON response',
          responseTime,
          endpoint,
        };
      }

      // Check EasyParcel API response format
      if (data.api_status === 'Success') {
        return {
          isValid: true,
          responseTime,
          servicesFound: data.result ? 1 : 0,
          endpoint,
        };
      } else if (data.api_status === 'Fail' || data.error_remark) {
        return {
          isValid: false,
          error: data.error_remark || 'API authentication failed',
          responseTime,
          endpoint,
        };
      }

      // Fallback for unexpected response format
      return {
        isValid: false,
        error: 'Unexpected API response format',
        responseTime,
        endpoint,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        endpoint,
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
            ...details,
          },
        },
      });
    } catch (error) {
      console.error('Error logging credential operation:', error);
      // Don't throw here as it's logging, not critical
    }
  }
}

// Export singleton instance
export const easyParcelCredentialsService =
  EasyParcelCredentialsService.getInstance();
