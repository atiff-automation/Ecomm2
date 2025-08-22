/**
 * toyyibPay Category Management Service
 * Handles category creation and management for toyyibPay bills
 */

import { toyyibPayCredentialsService } from './toyyibpay-credentials';

export interface ToyyibPayCategory {
  categoryCode: string;
  categoryName: string;
  categoryDescription: string;
  categoryStatus: string;
}

export interface CategoryCreateRequest {
  catname: string;
  catdescription: string;
}

export interface CategoryResponse {
  CategoryCode?: string;
  msg?: string;
}

export class ToyyibPayCategoryService {
  private static instance: ToyyibPayCategoryService;

  private constructor() {}

  public static getInstance(): ToyyibPayCategoryService {
    if (!ToyyibPayCategoryService.instance) {
      ToyyibPayCategoryService.instance = new ToyyibPayCategoryService();
    }
    return ToyyibPayCategoryService.instance;
  }

  /**
   * Get the base URL for toyyibPay API based on environment
   */
  private getBaseUrl(isSandbox: boolean): string {
    return isSandbox 
      ? process.env.TOYYIBPAY_SANDBOX_URL || 'http://dev.toyyibpay.com'
      : process.env.TOYYIBPAY_PRODUCTION_URL || 'https://toyyibpay.com';
  }

  /**
   * Create a new category in toyyibPay
   */
  async createCategory(categoryName: string, categoryDescription: string): Promise<{
    success: boolean;
    categoryCode?: string;
    error?: string;
  }> {
    try {
      console.log(`🔄 Creating toyyibPay category: ${categoryName}`);

      // Get credentials
      const credentials = await toyyibPayCredentialsService.getCredentialsForService();
      if (!credentials) {
        return {
          success: false,
          error: 'toyyibPay credentials not configured'
        };
      }

      console.log(`🔍 Category service credentials check:`, {
        hasCredentials: !!credentials,
        hasUserSecretKey: !!credentials.userSecretKey,
        userSecretKeyLength: credentials.userSecretKey?.length || 0,
        environment: credentials.environment
      });

      if (!credentials.userSecretKey) {
        return {
          success: false,
          error: 'toyyibPay userSecretKey not available in credentials'
        };
      }

      const baseUrl = this.getBaseUrl(credentials.isSandbox);

      // Use FormData instead of URLSearchParams (matching the working credential validation)
      const formData = new FormData();
      formData.append('userSecretKey', credentials.userSecretKey);
      formData.append('catname', categoryName);
      formData.append('catdescription', categoryDescription);

      console.log(`🔍 Form data being sent to toyyibPay:`, {
        userSecretKey: credentials.userSecretKey ? `${credentials.userSecretKey.substring(0, 8)}...` : 'EMPTY',
        catname: categoryName,
        catdescription: categoryDescription
      });

      // Make API call (using FormData, not URL-encoded)
      const response = await fetch(`${baseUrl}/index.php/api/createCategory`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`🔍 Category creation response: ${responseText}`);

      // Parse response
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return {
          success: false,
          error: 'Invalid JSON response from toyyibPay API'
        };
      }

      // Handle different response formats from HTTP vs HTTPS API
      // HTTPS API returns array: [{"CategoryCode":"0dry0b1x"}]
      // HTTP API returns object: {"status":"Category name already exist!","CategoryCode":"noid5f4j"}
      
      if (Array.isArray(data) && data.length > 0) {
        // HTTPS API response format
        const result = data[0];
        if (result.CategoryCode) {
          console.log(`✅ Category created successfully: ${result.CategoryCode}`);
          return {
            success: true,
            categoryCode: result.CategoryCode
          };
        }
      } else if (data && typeof data === 'object') {
        // HTTP API response format or error response
        if (data.CategoryCode) {
          console.log(`✅ Category created successfully: ${data.CategoryCode}`);
          return {
            success: true,
            categoryCode: data.CategoryCode
          };
        } else if (data.status) {
          // Check if it's an "already exists" error
          if (data.status.includes('Category name already exist') && data.CategoryCode) {
            console.log(`ℹ️ Category already exists, using existing: ${data.CategoryCode}`);
            return {
              success: true,
              categoryCode: data.CategoryCode
            };
          } else {
            console.log(`❌ Category creation failed: ${data.status}`);
            return {
              success: false,
              error: data.status
            };
          }
        }
      }

      return {
        success: false,
        error: 'Unexpected response format from toyyibPay API'
      };
    } catch (error) {
      console.error('Error creating toyyibPay category:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get category details from toyyibPay
   */
  async getCategory(categoryCode: string): Promise<{
    success: boolean;
    category?: ToyyibPayCategory;
    error?: string;
  }> {
    try {
      console.log(`🔄 Getting toyyibPay category: ${categoryCode}`);

      // Get credentials
      const credentials = await toyyibPayCredentialsService.getCredentialsForService();
      if (!credentials) {
        return {
          success: false,
          error: 'toyyibPay credentials not configured'
        };
      }

      console.log(`🔍 Get category credentials check:`, {
        hasCredentials: !!credentials,
        hasUserSecretKey: !!credentials.userSecretKey,
        userSecretKeyLength: credentials.userSecretKey?.length || 0,
        environment: credentials.environment
      });

      if (!credentials.userSecretKey) {
        return {
          success: false,
          error: 'toyyibPay userSecretKey not available in credentials for getCategory'
        };
      }

      const baseUrl = this.getBaseUrl(credentials.isSandbox);

      // Use FormData (matching the working credential validation)
      const formData = new FormData();
      formData.append('userSecretKey', credentials.userSecretKey);
      formData.append('catcode', categoryCode);

      // Make API call
      const response = await fetch(`${baseUrl}/index.php/api/getCategoryDetails`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`🔍 Category details response: ${responseText}`);

      // Parse response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return {
          success: false,
          error: 'Invalid JSON response from toyyibPay API'
        };
      }

      // Check response format and extract category data
      if (data && Array.isArray(data) && data.length > 0) {
        const categoryData = data[0];
        
        if (categoryData.CategoryCode) {
          return {
            success: true,
            category: {
              categoryCode: categoryData.CategoryCode,
              categoryName: categoryData.CategoryName || '',
              categoryDescription: categoryData.CategoryDescription || '',
              categoryStatus: categoryData.CategoryStatus || 'Active'
            }
          };
        } else if (categoryData.msg) {
          return {
            success: false,
            error: categoryData.msg
          };
        }
      }

      return {
        success: false,
        error: 'Category not found or invalid response'
      };
    } catch (error) {
      console.error('Error getting toyyibPay category:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get or create default category for the merchant
   */
  async getOrCreateDefaultCategory(): Promise<{
    success: boolean;
    categoryCode?: string;
    error?: string;
  }> {
    try {
      console.log('🔄 Getting or creating default toyyibPay category');

      // Check if we have a stored category code
      const credentials = await toyyibPayCredentialsService.getCredentialsForService();
      if (!credentials) {
        return {
          success: false,
          error: 'toyyibPay credentials not configured'
        };
      }

      if (credentials.categoryCode) {
        console.log(`ℹ️ Using stored category code: ${credentials.categoryCode}`);
        
        // Verify the category still exists
        const categoryResult = await this.getCategory(credentials.categoryCode);
        if (categoryResult.success) {
          return {
            success: true,
            categoryCode: credentials.categoryCode
          };
        } else {
          console.log(`⚠️ Stored category ${credentials.categoryCode} no longer exists, creating new one`);
        }
      }

      // Create a default category
      const defaultCategoryName = 'JRM_Ecommerce_' + Date.now();
      const defaultCategoryDescription = 'Default category for JRM E-commerce payments';

      const createResult = await this.createCategory(defaultCategoryName, defaultCategoryDescription);
      
      if (createResult.success && createResult.categoryCode) {
        // Store the new category code
        await this.storeCategoryCode(createResult.categoryCode);
        
        console.log(`✅ Created and stored default category: ${createResult.categoryCode}`);
        
        return {
          success: true,
          categoryCode: createResult.categoryCode
        };
      } else {
        return {
          success: false,
          error: createResult.error || 'Failed to create default category'
        };
      }
    } catch (error) {
      console.error('Error getting or creating default category:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Store category code in system config
   */
  private async storeCategoryCode(categoryCode: string): Promise<void> {
    try {
      const { prisma } = await import('@/lib/db/prisma');
      
      await prisma.systemConfig.upsert({
        where: { key: 'toyyibpay_category_code' },
        update: {
          value: categoryCode,
          updatedAt: new Date()
        },
        create: {
          key: 'toyyibpay_category_code',
          value: categoryCode,
          type: 'string'
        }
      });

      console.log(`📝 Stored category code in database: ${categoryCode}`);
    } catch (error) {
      console.error('Error storing category code:', error);
      throw error;
    }
  }

  /**
   * Validate category exists and is active
   */
  async validateCategory(categoryCode: string): Promise<boolean> {
    try {
      const result = await this.getCategory(categoryCode);
      return result.success && result.category?.categoryStatus === 'Active';
    } catch (error) {
      console.error('Error validating category:', error);
      return false;
    }
  }

  /**
   * Generate a unique category name
   */
  generateCategoryName(prefix: string = 'JRM'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }
}

// Export singleton instance
export const toyyibPayCategoryService = ToyyibPayCategoryService.getInstance();