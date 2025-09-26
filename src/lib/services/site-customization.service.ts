/**
 * Site Customization Service - Single Source of Truth
 * Centralized management of all site customization configuration
 * Following CLAUDE.md principles: No hardcoding, DRY, centralized approach
 */

import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// ==================== TYPE DEFINITIONS ====================

export interface HeroSlide {
  id: string;
  imageUrl: string;
  altText?: string;
  order: number;
  isActive: boolean;
  mediaId?: string; // Track media upload ID for deletion
}

export interface SliderConfig {
  enabled: boolean;
  autoAdvance: boolean;
  interval: number;
  showDots: boolean;
  showArrows: boolean;
  pauseOnHover: boolean;
  slides: HeroSlide[];
}

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
    slider: SliderConfig;
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

const HeroSlideValidationSchema = z.object({
  id: z.string().cuid(),
  imageUrl: z.string().url('Must be a valid image URL'),
  altText: z.string().max(200, 'Alt text must be under 200 characters').optional(),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
  isActive: z.boolean(),
  mediaId: z.string().optional() // Track media upload ID for deletion
});

const SliderValidationSchema = z.object({
  enabled: z.boolean(),
  autoAdvance: z.boolean(),
  interval: z.number().min(1000, 'Interval must be at least 1 second').max(30000, 'Interval must not exceed 30 seconds'),
  showDots: z.boolean(),
  showArrows: z.boolean(),
  pauseOnHover: z.boolean(),
  slides: z.array(HeroSlideValidationSchema).max(10, 'Maximum 10 slides allowed')
});

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
    }),
    slider: SliderValidationSchema
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
        title: '',
        subtitle: '',
        description: '',
        ctaPrimary: {
          text: '',
          link: ''
        },
        ctaSecondary: {
          text: '',
          link: ''
        },
        background: {
          type: 'IMAGE',
          overlayOpacity: 0.1
        },
        layout: {
          textAlignment: 'left',
          showTitle: false,  // Default to false when fields are empty
          showCTA: false     // Default to false when CTA fields are empty
        },
        slider: {
          enabled: false,           // Disabled by default (backward compatibility)
          autoAdvance: true,        // Auto-advance enabled by default
          interval: 5000,           // 5 second intervals
          showDots: true,           // Show navigation dots
          showArrows: true,         // Show navigation arrows
          pauseOnHover: true,       // Pause on hover
          slides: []                // Empty slides array
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
   * Validate that the user ID exists in the database
   * Throws proper error if user is not found (forces re-authentication)
   */
  private async validateUserId(userId: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true }
      });

      if (!user) {
        throw new Error(`User not found in database. Please log out and log back in. (User ID: ${userId})`);
      }

      return userId;
    } catch (error) {
      console.error('Authentication validation failed:', error);
      throw new Error(`Authentication error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

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
      
      // Handle legacy configuration format
      if (config && !config.hero) {
        console.log('Legacy configuration detected, migrating to new format');
        return this.migrateLegacyConfig(config, activeConfig);
      }

      // Ensure the config has the expected structure
      if (!config || !config.hero) {
        console.log('Invalid configuration structure, returning default');
        return this.getDefaultConfiguration();
      }

      // Handle missing slider configuration (backward compatibility)
      if (!config.hero.slider) {
        console.log('Missing slider configuration, adding default slider config for backward compatibility');
        config.hero.slider = this.getDefaultConfiguration().hero.slider;
      }
      
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
      // Validate user exists in database (prevents foreign key constraint errors)
      const validUserId = await this.validateUserId(updatedBy);

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
          createdBy: validUserId
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
      // Custom validation logic that respects layout toggles
      this.validateHeroSection(config, errors, warnings);
      this.validateBrandingSection(config, errors, warnings);

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

  private validateHeroSection(
    config: SiteCustomizationConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const hero = config.hero;

    // Validate title-related fields only if showTitle is enabled
    if (hero.layout.showTitle) {
      if (!hero.title || hero.title.trim().length === 0) {
        errors.push({
          field: 'hero.title',
          message: 'Title is required when title section is enabled',
          value: hero.title
        });
      } else if (hero.title.length > 100) {
        errors.push({
          field: 'hero.title',
          message: 'Title must be under 100 characters',
          value: hero.title
        });
      }

      if (hero.subtitle && hero.subtitle.length > 150) {
        errors.push({
          field: 'hero.subtitle',
          message: 'Subtitle must be under 150 characters',
          value: hero.subtitle
        });
      }

      if (hero.description && hero.description.length > 500) {
        errors.push({
          field: 'hero.description',
          message: 'Description must be under 500 characters',
          value: hero.description
        });
      }
    }

    // Validate CTA fields only if showCTA is enabled
    if (hero.layout.showCTA) {
      if (!hero.ctaPrimary.text || hero.ctaPrimary.text.trim().length === 0) {
        errors.push({
          field: 'hero.ctaPrimary.text',
          message: 'Primary CTA text is required when CTA buttons are enabled',
          value: hero.ctaPrimary.text
        });
      } else if (hero.ctaPrimary.text.length > 30) {
        errors.push({
          field: 'hero.ctaPrimary.text',
          message: 'CTA text must be under 30 characters',
          value: hero.ctaPrimary.text
        });
      }

      if (!hero.ctaPrimary.link || hero.ctaPrimary.link.trim().length === 0) {
        errors.push({
          field: 'hero.ctaPrimary.link',
          message: 'Primary CTA link is required when CTA buttons are enabled',
          value: hero.ctaPrimary.link
        });
      }

      if (!hero.ctaSecondary.text || hero.ctaSecondary.text.trim().length === 0) {
        errors.push({
          field: 'hero.ctaSecondary.text',
          message: 'Secondary CTA text is required when CTA buttons are enabled',
          value: hero.ctaSecondary.text
        });
      } else if (hero.ctaSecondary.text.length > 30) {
        errors.push({
          field: 'hero.ctaSecondary.text',
          message: 'CTA text must be under 30 characters',
          value: hero.ctaSecondary.text
        });
      }

      if (!hero.ctaSecondary.link || hero.ctaSecondary.link.trim().length === 0) {
        errors.push({
          field: 'hero.ctaSecondary.link',
          message: 'Secondary CTA link is required when CTA buttons are enabled',
          value: hero.ctaSecondary.link
        });
      }
    }

    // Validate background settings
    if (!['IMAGE', 'VIDEO'].includes(hero.background.type)) {
      errors.push({
        field: 'hero.background.type',
        message: 'Background type must be IMAGE or VIDEO',
        value: hero.background.type
      });
    }

    if (hero.background.overlayOpacity < 0 || hero.background.overlayOpacity > 1) {
      errors.push({
        field: 'hero.background.overlayOpacity',
        message: 'Overlay opacity must be between 0 and 1',
        value: hero.background.overlayOpacity
      });
    }

    // Validate layout settings
    if (!['left', 'center', 'right'].includes(hero.layout.textAlignment)) {
      errors.push({
        field: 'hero.layout.textAlignment',
        message: 'Text alignment must be left, center, or right',
        value: hero.layout.textAlignment
      });
    }
  }

  private validateBrandingSection(
    config: SiteCustomizationConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const branding = config.branding;

    // Validate logo if provided
    if (branding.logo) {
      if (!branding.logo.url || branding.logo.url.trim().length === 0) {
        errors.push({
          field: 'branding.logo.url',
          message: 'Logo URL is required when logo is provided',
          value: branding.logo.url
        });
      }

      if (branding.logo.width < 20 || branding.logo.width > 400) {
        errors.push({
          field: 'branding.logo.width',
          message: 'Logo width must be between 20px and 400px',
          value: branding.logo.width
        });
      }

      if (branding.logo.height < 20 || branding.logo.height > 200) {
        errors.push({
          field: 'branding.logo.height',
          message: 'Logo height must be between 20px and 200px',
          value: branding.logo.height
        });
      }
    }

    // Validate favicon if provided
    if (branding.favicon) {
      if (!branding.favicon.url || branding.favicon.url.trim().length === 0) {
        errors.push({
          field: 'branding.favicon.url',
          message: 'Favicon URL is required when favicon is provided',
          value: branding.favicon.url
        });
      }
    }

    // Validate colors if provided
    if (branding.colors) {
      const hexColorRegex = /^#[0-9A-F]{6}$/i;

      if (branding.colors.primary && !hexColorRegex.test(branding.colors.primary)) {
        errors.push({
          field: 'branding.colors.primary',
          message: 'Primary color must be a valid hex color',
          value: branding.colors.primary
        });
      }

      if (branding.colors.secondary && !hexColorRegex.test(branding.colors.secondary)) {
        errors.push({
          field: 'branding.colors.secondary',
          message: 'Secondary color must be a valid hex color',
          value: branding.colors.secondary
        });
      }

      if (branding.colors.background && !hexColorRegex.test(branding.colors.background)) {
        errors.push({
          field: 'branding.colors.background',
          message: 'Background color must be a valid hex color',
          value: branding.colors.background
        });
      }

      if (branding.colors.text && !hexColorRegex.test(branding.colors.text)) {
        errors.push({
          field: 'branding.colors.text',
          message: 'Text color must be a valid hex color',
          value: branding.colors.text
        });
      }
    }
  }

  private validateBusinessRules(
    config: SiteCustomizationConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate CTA links are accessible (only if CTA is enabled and link exists)
    if (config.hero.layout.showCTA &&
        config.hero.ctaPrimary.link &&
        config.hero.ctaPrimary.link.startsWith('/') &&
        !this.isValidInternalPath(config.hero.ctaPrimary.link)) {
      warnings.push({
        field: 'hero.ctaPrimary.link',
        message: 'Internal link may not exist',
        suggestion: 'Verify that this page exists in your application'
      });
    }

    // Validate secondary CTA link if enabled and exists
    if (config.hero.layout.showCTA &&
        config.hero.ctaSecondary.link &&
        config.hero.ctaSecondary.link.startsWith('/') &&
        !this.isValidInternalPath(config.hero.ctaSecondary.link)) {
      warnings.push({
        field: 'hero.ctaSecondary.link',
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

  // ==================== MIGRATION ====================

  private migrateLegacyConfig(legacyConfig: any, activeConfig: any): SiteCustomizationConfig {
    const defaultConfig = this.getDefaultConfiguration();

    // Migrate legacy config to new format
    const migratedConfig: SiteCustomizationConfig = {
      hero: {
        title: defaultConfig.hero.title,
        subtitle: defaultConfig.hero.subtitle,
        description: defaultConfig.hero.description,
        ctaPrimary: defaultConfig.hero.ctaPrimary,
        ctaSecondary: defaultConfig.hero.ctaSecondary,
        background: defaultConfig.hero.background,
        layout: defaultConfig.hero.layout,
        slider: defaultConfig.hero.slider  // Add default slider configuration
      },
      branding: {
        colors: {
          primary: legacyConfig.theme?.primaryColor || defaultConfig.branding.colors?.primary || '#3B82F6',
          secondary: legacyConfig.theme?.secondaryColor || defaultConfig.branding.colors?.secondary || '#FDE047',
          background: defaultConfig.branding.colors?.background || '#F8FAFC',
          text: defaultConfig.branding.colors?.text || '#1E293B'
        }
      },
      metadata: {
        lastUpdated: activeConfig.updatedAt,
        updatedBy: activeConfig.creator?.email || activeConfig.createdBy || 'system',
        version: activeConfig.version
      }
    };

    // Add logo information if available from legacy config
    if (legacyConfig.branding?.logoUrl) {
      migratedConfig.branding.logo = {
        url: legacyConfig.branding.logoUrl,
        width: 120,
        height: 40
      };
    }

    return migratedConfig;
  }

  // ==================== SLIDER MANAGEMENT METHODS ====================

  /**
   * Add a new slide to the slider
   */
  async addSlide(slideData: Omit<HeroSlide, 'id'>, updatedBy: string): Promise<HeroSlide> {
    try {
      const config = await this.getConfiguration();

      // Generate unique ID for the slide
      const slideId = `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newSlide: HeroSlide = {
        id: slideId,
        imageUrl: slideData.imageUrl,
        order: slideData.order,
        isActive: slideData.isActive,
        ...(slideData.altText && { altText: slideData.altText })
      };

      // Validate the new slide
      const slideValidation = HeroSlideValidationSchema.safeParse(newSlide);
      if (!slideValidation.success) {
        throw new Error(`Invalid slide data: ${slideValidation.error.message}`);
      }

      // Add slide to configuration
      config.hero.slider.slides.push(newSlide);

      // Sort slides by order
      config.hero.slider.slides.sort((a, b) => a.order - b.order);

      // Update configuration
      await this.updateConfiguration(config, updatedBy);

      return newSlide;
    } catch (error) {
      console.error('Error adding slide:', error);
      throw new Error(`Failed to add slide: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update an existing slide
   */
  async updateSlide(slideId: string, updates: Partial<HeroSlide>, updatedBy: string): Promise<void> {
    try {
      const config = await this.getConfiguration();

      const slideIndex = config.hero.slider.slides.findIndex(slide => slide.id === slideId);
      if (slideIndex === -1) {
        throw new Error(`Slide with ID ${slideId} not found`);
      }

      // Apply updates to the slide
      const updatedSlide = { ...config.hero.slider.slides[slideIndex], ...updates };

      // Validate the updated slide
      const slideValidation = HeroSlideValidationSchema.safeParse(updatedSlide);
      if (!slideValidation.success) {
        throw new Error(`Invalid slide updates: ${slideValidation.error.message}`);
      }

      // Update the slide in the array
      config.hero.slider.slides[slideIndex] = updatedSlide;

      // Resort slides if order was changed
      if (updates.order !== undefined) {
        config.hero.slider.slides.sort((a, b) => a.order - b.order);
      }

      // Update configuration
      await this.updateConfiguration(config, updatedBy);
    } catch (error) {
      console.error('Error updating slide:', error);
      throw new Error(`Failed to update slide: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a slide
   */
  async deleteSlide(slideId: string, updatedBy: string): Promise<void> {
    try {
      const config = await this.getConfiguration();

      const slideIndex = config.hero.slider.slides.findIndex(slide => slide.id === slideId);
      if (slideIndex === -1) {
        throw new Error(`Slide with ID ${slideId} not found`);
      }

      // Remove the slide from the array
      config.hero.slider.slides.splice(slideIndex, 1);

      // Update configuration
      await this.updateConfiguration(config, updatedBy);
    } catch (error) {
      console.error('Error deleting slide:', error);
      throw new Error(`Failed to delete slide: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Reorder slides
   */
  async reorderSlides(slideIds: string[], updatedBy: string): Promise<void> {
    try {
      const config = await this.getConfiguration();

      // Validate that all slide IDs exist
      const existingSlideIds = config.hero.slider.slides.map(slide => slide.id);
      const missingSlides = slideIds.filter(id => !existingSlideIds.includes(id));
      if (missingSlides.length > 0) {
        throw new Error(`Slides not found: ${missingSlides.join(', ')}`);
      }

      if (slideIds.length !== existingSlideIds.length) {
        throw new Error('Must provide all slide IDs for reordering');
      }

      // Reorder slides according to the provided array
      const reorderedSlides = slideIds.map((slideId, index) => {
        const slide = config.hero.slider.slides.find(s => s.id === slideId);
        return { ...slide!, order: index };
      });

      // Update the slides array
      config.hero.slider.slides = reorderedSlides;

      // Update configuration
      await this.updateConfiguration(config, updatedBy);
    } catch (error) {
      console.error('Error reordering slides:', error);
      throw new Error(`Failed to reorder slides: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update slider configuration
   */
  async updateSliderConfig(sliderConfig: Partial<SliderConfig>, updatedBy: string): Promise<void> {
    try {
      const config = await this.getConfiguration();

      // Merge with existing slider config
      const updatedSliderConfig = { ...config.hero.slider, ...sliderConfig };

      // Validate the updated slider configuration
      const sliderValidation = SliderValidationSchema.safeParse(updatedSliderConfig);
      if (!sliderValidation.success) {
        throw new Error(`Invalid slider configuration: ${sliderValidation.error.message}`);
      }

      // Update slider configuration
      config.hero.slider = updatedSliderConfig;

      // Update configuration
      await this.updateConfiguration(config, updatedBy);
    } catch (error) {
      console.error('Error updating slider configuration:', error);
      throw new Error(`Failed to update slider configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get slider configuration only
   */
  async getSliderConfiguration(): Promise<SliderConfig> {
    const config = await this.getConfiguration();
    return config.hero.slider;
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
          details: JSON.parse(JSON.stringify({
            action,
            version: fullConfig.metadata.version,
            changes,
            timestamp: new Date().toISOString()
          }))
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