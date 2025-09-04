/**
 * Site Customization Service - Single Source of Truth
 * Centralized management of all site customization configuration
 * Following CLAUDE.md principles: No hardcoding, DRY, centralized approach
 */

import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// ==================== TYPE DEFINITIONS ====================

export interface SiteCustomizationConfig {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    ctaPrimary: {
      text: string;
      link: string;
    };
    ctaSecondary: {
      text: string;
      link: string;
    };
    background: {
      type: 'IMAGE' | 'VIDEO';
      url?: string;
      overlayOpacity: number;
    };
    layout: {
      textAlignment: 'left' | 'center' | 'right';
      showTitle: boolean;
      showCTA: boolean;
    };
  };
  branding: {
    logo?: {
      url: string;
      width: number;
      height: number;
    };
    favicon?: {
      url: string;
    };
    colors?: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
  };
  metadata: {
    lastUpdated: Date;
    updatedBy: string;
    version: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface SiteCustomizationResponse {
  config: SiteCustomizationConfig;
  validation: {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };
  preview: {
    heroPreviewUrl: string;
    headerPreviewUrl: string;
  };
}

// ==================== VALIDATION SCHEMAS ====================

const ValidationRules = z.object({
  hero: z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 characters'),
    subtitle: z.string().max(150, 'Subtitle must be under 150 characters'),
    description: z.string().max(500, 'Description must be under 500 characters'),
    ctaPrimary: z.object({
      text: z.string().min(1, 'Primary CTA text is required').max(30, 'CTA text must be under 30 characters'),
      link: z.string().min(1, 'Primary CTA link is required').url('Must be a valid URL or relative path').or(z.string().startsWith('/'))
    }),
    ctaSecondary: z.object({
      text: z.string().min(1, 'Secondary CTA text is required').max(30, 'CTA text must be under 30 characters'),
      link: z.string().min(1, 'Secondary CTA link is required').url('Must be a valid URL or relative path').or(z.string().startsWith('/'))
    }),
    background: z.object({
      type: z.enum(['IMAGE', 'VIDEO']),
      url: z.string().optional(),
      overlayOpacity: z.number().min(0).max(1)
    }),
    layout: z.object({
      textAlignment: z.enum(['left', 'center', 'right']),
      showTitle: z.boolean(),
      showCTA: z.boolean()
    })
  }),
  branding: z.object({
    logo: z.object({
      url: z.string(),
      width: z.number().min(20, 'Logo width must be at least 20px').max(400, 'Logo width must not exceed 400px'),
      height: z.number().min(20, 'Logo height must be at least 20px').max(200, 'Logo height must not exceed 200px')
    }).optional(),
    favicon: z.object({
      url: z.string()
    }).optional(),
    colors: z.object({
      primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Primary color must be a valid hex color'),
      secondary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Secondary color must be a valid hex color'),
      background: z.string().regex(/^#[0-9A-F]{6}$/i, 'Background color must be a valid hex color'),
      text: z.string().regex(/^#[0-9A-F]{6}$/i, 'Text color must be a valid hex color')
    }).optional()
  })
});

// ==================== SITE CUSTOMIZATION SERVICE ====================

export class SiteCustomizationService {
  private static instance: SiteCustomizationService;

  private constructor() {}

  public static getInstance(): SiteCustomizationService {
    if (!SiteCustomizationService.instance) {
      SiteCustomizationService.instance = new SiteCustomizationService();
    }
    return SiteCustomizationService.instance;
  }

  // ==================== DEFAULT CONFIGURATION ====================

  private getDefaultConfiguration(): SiteCustomizationConfig {
    return {
      hero: {
        title: 'Welcome to JRM E-commerce',
        subtitle: "Malaysia's premier online marketplace",
        description: 'Intelligent membership benefits, dual pricing, and local payment integration.',
        ctaPrimary: {
          text: 'Join as Member',
          link: '/auth/signup'
        },
        ctaSecondary: {
          text: 'Browse Products',
          link: '/products'
        },
        background: {
          type: 'IMAGE',
          overlayOpacity: 0.1
        },
        layout: {
          textAlignment: 'left',
          showTitle: true,
          showCTA: true
        }
      },
      branding: {
        colors: {
          primary: '#3B82F6',
          secondary: '#FDE047',
          background: '#F8FAFC',
          text: '#1E293B'
        }
      },
      metadata: {
        lastUpdated: new Date(),
        updatedBy: 'system',
        version: 1
      }
    };
  }

  // ==================== CORE OPERATIONS ====================

  /**
   * Get current active site customization configuration
   * Returns default configuration if none exists
   */
  async getConfiguration(): Promise<SiteCustomizationConfig> {
    try {
      const activeConfig = await prisma.siteCustomization.findFirst({
        where: { isActive: true },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!activeConfig) {
        console.log('No active configuration found, returning default');
        return this.getDefaultConfiguration();
      }

      // Parse and validate the JSON configuration
      const config = activeConfig.config as any;
      
      // Ensure metadata is up to date
      config.metadata = {
        lastUpdated: activeConfig.updatedAt,
        updatedBy: activeConfig.creator?.email || activeConfig.createdBy || 'unknown',
        version: activeConfig.version
      };

      return config;
    } catch (error) {
      console.error('Error fetching site customization:', error);
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Update site customization configuration
   * Performs validation and atomic update
   */
  async updateConfiguration(
    config: Partial<SiteCustomizationConfig>,
    updatedBy: string
  ): Promise<SiteCustomizationResponse> {
    try {
      // Get current configuration to merge with updates
      const currentConfig = await this.getConfiguration();
      
      // Deep merge configurations
      const mergedConfig = this.deepMerge(currentConfig, config);
      
      // Validate the merged configuration
      const validation = this.validateConfiguration(mergedConfig);
      
      if (!validation.isValid) {
        return {
          config: mergedConfig,
          validation,
          preview: {
            heroPreviewUrl: '',
            headerPreviewUrl: ''
          }
        };
      }

      // Update metadata
      mergedConfig.metadata = {
        lastUpdated: new Date(),
        updatedBy,
        version: currentConfig.metadata.version + 1
      };

      // Deactivate current active configuration
      await prisma.siteCustomization.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      // Create new active configuration
      const newConfig = await prisma.siteCustomization.create({
        data: {
          config: mergedConfig as any,
          version: mergedConfig.metadata.version,
          isActive: true,
          createdBy: updatedBy
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Create audit log
      await this.createAuditLog(updatedBy, 'UPDATE', mergedConfig, config);

      const preview = await this.generatePreviewUrls(mergedConfig);

      return {
        config: mergedConfig,
        validation,
        preview
      };

    } catch (error) {
      console.error('Error updating site customization:', error);
      throw new Error('Failed to update site customization');
    }
  }

  /**
   * Reset configuration to default values
   */
  async resetToDefault(updatedBy: string): Promise<SiteCustomizationResponse> {
    const defaultConfig = this.getDefaultConfiguration();
    defaultConfig.metadata.updatedBy = updatedBy;
    
    return await this.updateConfiguration(defaultConfig, updatedBy);
  }

  // ==================== VALIDATION ====================

  private validateConfiguration(config: SiteCustomizationConfig): {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Use Zod validation for structure validation
      const heroValidation = ValidationRules.shape.hero.safeParse(config.hero);
      if (!heroValidation.success) {
        heroValidation.error.errors.forEach(err => {
          errors.push({
            field: `hero.${err.path.join('.')}`,
            message: err.message,
            value: err.path.reduce((obj, key) => obj?.[key], config.hero)
          });
        });
      }

      const brandingValidation = ValidationRules.shape.branding.safeParse(config.branding);
      if (!brandingValidation.success) {
        brandingValidation.error.errors.forEach(err => {
          errors.push({
            field: `branding.${err.path.join('.')}`,
            message: err.message,
            value: err.path.reduce((obj, key) => obj?.[key], config.branding)
          });
        });
      }

      // Additional business logic validations
      this.validateBusinessRules(config, errors, warnings);

    } catch (error) {
      errors.push({
        field: 'configuration',
        message: 'Configuration validation failed',
        value: error
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateBusinessRules(
    config: SiteCustomizationConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate CTA links are accessible
    if (config.hero.ctaPrimary.link.startsWith('/') && 
        !this.isValidInternalPath(config.hero.ctaPrimary.link)) {
      warnings.push({
        field: 'hero.ctaPrimary.link',
        message: 'Internal link may not exist',
        suggestion: 'Verify that this page exists in your application'
      });
    }

    // Validate color contrast if both text and background colors are provided
    if (config.branding.colors?.text && config.branding.colors?.background) {
      const contrast = this.calculateContrastRatio(
        config.branding.colors.text,
        config.branding.colors.background
      );
      if (contrast < 4.5) {
        warnings.push({
          field: 'branding.colors',
          message: 'Low contrast ratio between text and background colors',
          suggestion: 'Consider using colors with better contrast for accessibility'
        });
      }
    }

    // Validate logo dimensions ratio
    if (config.branding.logo && config.branding.logo.width && config.branding.logo.height) {
      const ratio = config.branding.logo.width / config.branding.logo.height;
      if (ratio > 5 || ratio < 0.2) {
        warnings.push({
          field: 'branding.logo',
          message: 'Logo has unusual aspect ratio',
          suggestion: 'Consider using a logo with a more standard aspect ratio'
        });
      }
    }
  }

  // ==================== UTILITY METHODS ====================

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private isValidInternalPath(path: string): boolean {
    // List of known valid internal paths
    const validPaths = [
      '/', '/products', '/auth/signup', '/auth/login', '/cart', '/checkout',
      '/account', '/about', '/contact', '/privacy', '/terms'
    ];
    
    return validPaths.includes(path) || path.startsWith('/products/');
  }

  private calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast ratio calculation
    // In a real implementation, you'd use a proper color contrast library
    const getLuminance = (hex: string): number => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private async generatePreviewUrls(config: SiteCustomizationConfig): Promise<{
    heroPreviewUrl: string;
    headerPreviewUrl: string;
  }> {
    // Generate preview URLs for hero and header sections
    // This would integrate with your preview generation system
    return {
      heroPreviewUrl: `/api/preview/hero?v=${config.metadata.version}`,
      headerPreviewUrl: `/api/preview/header?v=${config.metadata.version}`
    };
  }

  private async createAuditLog(
    userId: string,
    action: string,
    fullConfig: SiteCustomizationConfig,
    changes: Partial<SiteCustomizationConfig>
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: `SITE_CUSTOMIZATION_${action}`,
          resource: 'SITE_CUSTOMIZATION',
          details: {
            action,
            version: fullConfig.metadata.version,
            changes,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw here as it's logging, not critical to the operation
    }
  }

  // ==================== SPECIFIC CONFIGURATION GETTERS ====================

  /**
   * Get hero configuration only
   */
  async getHeroConfiguration() {
    const config = await this.getConfiguration();
    return config.hero;
  }

  /**
   * Get branding configuration only
   */
  async getBrandingConfiguration() {
    const config = await this.getConfiguration();
    return config.branding;
  }

  /**
   * Get configuration status for admin overview
   */
  async getConfigurationStatus() {
    try {
      const config = await this.getConfiguration();
      const validation = this.validateConfiguration(config);

      return {
        isConfigured: true,
        isValid: validation.isValid,
        version: config.metadata.version,
        lastUpdated: config.metadata.lastUpdated,
        updatedBy: config.metadata.updatedBy,
        hasHeroBackground: !!config.hero.background.url,
        hasLogo: !!config.branding.logo,
        hasFavicon: !!config.branding.favicon,
        validationErrors: validation.errors.length,
        validationWarnings: validation.warnings.length
      };
    } catch (error) {
      return {
        isConfigured: false,
        isValid: false,
        error: 'Failed to retrieve configuration status'
      };
    }
  }
}

// Export singleton instance
export const siteCustomizationService = SiteCustomizationService.getInstance();