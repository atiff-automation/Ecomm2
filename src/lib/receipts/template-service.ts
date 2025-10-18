/**
 * Receipt Template Service
 * Centralized service for managing receipt templates with CRUD operations
 */

import { prisma } from '@/lib/db/prisma';
import {
  ReceiptTemplate,
  CreateReceiptTemplateInput,
  UpdateReceiptTemplateInput,
  ReceiptTemplateType,
  TemplateValidationResult,
  DEFAULT_TEMPLATE_CONFIGS,
  ReceiptTemplateContent,
} from '@/types/receipt-templates';
import { TaxReceiptData } from './receipt-service';

export class ReceiptTemplateService {
  private static instance: ReceiptTemplateService;

  public static getInstance(): ReceiptTemplateService {
    if (!ReceiptTemplateService.instance) {
      ReceiptTemplateService.instance = new ReceiptTemplateService();
    }
    return ReceiptTemplateService.instance;
  }

  /**
   * Get all available templates with optional filtering
   */
  async getAvailableTemplates(options?: {
    activeOnly?: boolean;
    templateType?: ReceiptTemplateType;
  }): Promise<ReceiptTemplate[]> {
    try {
      const templates = await prisma.receiptTemplate.findMany({
        where: {
          ...(options?.activeOnly && { isActive: true }),
          ...(options?.templateType && { templateType: options.templateType }),
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      });

      return templates.map(template => ({
        ...template,
        templateContent: template.templateContent as ReceiptTemplateContent,
      }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw new Error('Failed to fetch receipt templates');
    }
  }

  /**
   * Get the active default template
   */
  async getActiveTemplate(): Promise<ReceiptTemplate | null> {
    try {
      // First try to get the default template
      let template = await prisma.receiptTemplate.findFirst({
        where: {
          isDefault: true,
          isActive: true,
        },
      });

      // If no default, get any active template
      if (!template) {
        template = await prisma.receiptTemplate.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        });
      }

      if (!template) {
        return null;
      }

      return {
        ...template,
        templateContent: template.templateContent as ReceiptTemplateContent,
      };
    } catch (error) {
      console.error('Error fetching active template:', error);
      throw new Error('Failed to fetch active template');
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<ReceiptTemplate | null> {
    try {
      const template = await prisma.receiptTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        return null;
      }

      return {
        ...template,
        templateContent: template.templateContent as ReceiptTemplateContent,
      };
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      throw new Error('Failed to fetch template');
    }
  }

  /**
   * Create a new receipt template
   */
  async createTemplate(
    input: CreateReceiptTemplateInput,
    userId: string
  ): Promise<ReceiptTemplate> {
    try {
      // Validate template content
      const validation = await this.validateTemplate(input.templateContent);
      if (!validation.isValid) {
        throw new Error(
          `Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      // If this is set as default, unset current default
      if (input.isDefault) {
        await this.unsetCurrentDefault();
      }

      const template = await prisma.receiptTemplate.create({
        data: {
          name: input.name,
          description: input.description,
          templateType: input.templateType,
          templateContent: input.templateContent as any,
          isDefault: input.isDefault || false,
          isActive: input.isActive !== undefined ? input.isActive : true,
          previewImage: input.previewImage,
          createdBy: userId,
        },
      });

      return {
        ...template,
        templateContent: template.templateContent as ReceiptTemplateContent,
      };
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to create receipt template');
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(
    id: string,
    input: UpdateReceiptTemplateInput,
    userId: string
  ): Promise<ReceiptTemplate> {
    try {
      // Validate template content if provided
      if (input.templateContent) {
        const validation = await this.validateTemplate(input.templateContent);
        if (!validation.isValid) {
          throw new Error(
            `Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`
          );
        }
      }

      // If this is set as default, unset current default
      if (input.isDefault) {
        await this.unsetCurrentDefault();
      }

      const template = await prisma.receiptTemplate.update({
        where: { id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.templateContent && {
            templateContent: input.templateContent as any,
          }),
          ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
          ...(input.previewImage !== undefined && {
            previewImage: input.previewImage,
          }),
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      return {
        ...template,
        templateContent: template.templateContent as ReceiptTemplateContent,
      };
    } catch (error) {
      console.error('Error updating template:', error);
      throw new Error('Failed to update receipt template');
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const template = await prisma.receiptTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        throw new Error('Template not found');
      }

      if (template.isDefault) {
        throw new Error('Cannot delete the default template');
      }

      await prisma.receiptTemplate.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      throw new Error('Failed to delete receipt template');
    }
  }

  /**
   * Set a template as the default
   */
  async setDefaultTemplate(
    id: string,
    userId: string
  ): Promise<ReceiptTemplate> {
    try {
      // Use a transaction to ensure atomicity
      const template = await prisma.$transaction(async tx => {
        // First, unset all current defaults in a single operation
        await tx.receiptTemplate.updateMany({
          where: { isDefault: true },
          data: {
            isDefault: false,
            updatedAt: new Date(),
          },
        });

        // Then set the new default
        const updatedTemplate = await tx.receiptTemplate.update({
          where: { id },
          data: {
            isDefault: true,
            isActive: true, // Ensure default template is active
            updatedBy: userId,
            updatedAt: new Date(),
          },
        });

        return updatedTemplate;
      });

      return {
        ...template,
        templateContent: template.templateContent as ReceiptTemplateContent,
      };
    } catch (error) {
      console.error('Error setting default template:', error);
      throw new Error('Failed to set default template');
    }
  }

  /**
   * Validate template content
   */
  async validateTemplate(
    content: ReceiptTemplateContent
  ): Promise<TemplateValidationResult> {
    const errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }> = [];

    // Validate required fields
    if (!content.templateType) {
      errors.push({
        field: 'templateType',
        message: 'Template type is required',
        severity: 'error',
      });
    }

    if (!content.layout) {
      errors.push({
        field: 'layout',
        message: 'Layout configuration is required',
        severity: 'error',
      });
    }

    if (!content.colors) {
      errors.push({
        field: 'colors',
        message: 'Color configuration is required',
        severity: 'error',
      });
    }

    if (!content.typography) {
      errors.push({
        field: 'typography',
        message: 'Typography configuration is required',
        severity: 'error',
      });
    }

    if (!content.sections) {
      errors.push({
        field: 'sections',
        message: 'Section configuration is required',
        severity: 'error',
      });
    }

    // Validate color values
    if (content.colors) {
      const colorFields = [
        'primary',
        'secondary',
        'text',
        'accent',
        'background',
      ];
      for (const field of colorFields) {
        const color = content.colors[field as keyof typeof content.colors];
        if (color && !this.isValidColor(color)) {
          errors.push({
            field: `colors.${field}`,
            message: `Invalid color format: ${color}`,
            severity: 'error',
          });
        }
      }
    }

    // Validate font sizes
    if (content.typography?.fontSize) {
      const fontSizes = content.typography.fontSize;
      Object.entries(fontSizes).forEach(([key, size]) => {
        if (size < 8 || size > 72) {
          errors.push({
            field: `typography.fontSize.${key}`,
            message: `Font size must be between 8 and 72px`,
            severity: 'warning',
          });
        }
      });
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
    };
  }

  /**
   * Initialize system with default templates
   */
  async initializeDefaultTemplates(userId: string): Promise<void> {
    try {
      const existingTemplates = await this.getAvailableTemplates();

      if (existingTemplates.length === 0) {
        // Create default templates
        const templateTypes: ReceiptTemplateType[] = [
          'THERMAL_RECEIPT',
          'BUSINESS_INVOICE',
          'MINIMAL_RECEIPT',
          'DETAILED_INVOICE',
        ];

        for (let i = 0; i < templateTypes.length; i++) {
          const templateType = templateTypes[i];
          const config = DEFAULT_TEMPLATE_CONFIGS[templateType];

          await this.createTemplate(
            {
              name: this.getDefaultTemplateName(templateType),
              description: this.getDefaultTemplateDescription(templateType),
              templateType,
              templateContent: config,
              isDefault: i === 0, // First template is default
              isActive: true,
            },
            userId
          );
        }
      }
    } catch (error) {
      console.error('Error initializing default templates:', error);
      throw new Error('Failed to initialize default templates');
    }
  }

  /**
   * Generate preview for a template
   */
  async generatePreview(
    templateId: string,
    sampleData?: Partial<TaxReceiptData>
  ): Promise<string> {
    try {
      const template = await this.getTemplateById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Use sample data or create default sample data
      const previewData = sampleData || this.createSampleData();

      // Import template engine for rendering
      const { TemplateEngine } = await import('./template-engine');
      const engine = new TemplateEngine();

      return await engine.renderTemplate(
        template,
        previewData as TaxReceiptData
      );
    } catch (error) {
      console.error('Error generating preview:', error);
      throw new Error('Failed to generate template preview');
    }
  }

  // Private helper methods
  private async unsetCurrentDefault(): Promise<void> {
    await prisma.receiptTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  private isValidColor(color: string): boolean {
    // Basic hex color validation
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  private getDefaultTemplateName(type: ReceiptTemplateType): string {
    const names = {
      THERMAL_RECEIPT: 'Thermal Receipt',
      BUSINESS_INVOICE: 'Business Invoice',
      MINIMAL_RECEIPT: 'Minimal Receipt',
      DETAILED_INVOICE: 'Detailed Invoice',
    };
    return names[type];
  }

  private getDefaultTemplateDescription(type: ReceiptTemplateType): string {
    const descriptions = {
      THERMAL_RECEIPT: 'Compact receipt style suitable for thermal printers',
      BUSINESS_INVOICE:
        'Professional invoice format for business documentation',
      MINIMAL_RECEIPT: 'Clean and simple receipt with modern design',
      DETAILED_INVOICE:
        'Comprehensive invoice with full tax and billing details',
    };
    return descriptions[type];
  }

  private createSampleData(): Partial<TaxReceiptData> {
    return {
      order: {
        id: 'sample-id',
        orderNumber: 'ORD-12345',
        createdAt: new Date(),
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        subtotal: 150.0,
        taxAmount: 9.0,
        shippingCost: 15.0,
        discountAmount: 5.0,
        total: 169.0,
        paymentMethod: 'Credit Card',
        customerNotes: undefined,
      },
      customer: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+60123456789',
        isMember: true,
      },
      orderItems: [
        {
          id: 'item-1',
          productName: 'Sample Product 1',
          productSku: 'SKU-001',
          quantity: 2,
          regularPrice: 50.0,
          memberPrice: 45.0,
          appliedPrice: 45.0,
          totalPrice: 90.0,
        },
        {
          id: 'item-2',
          productName: 'Sample Product 2',
          productSku: 'SKU-002',
          quantity: 1,
          regularPrice: 60.0,
          memberPrice: 60.0,
          appliedPrice: 60.0,
          totalPrice: 60.0,
        },
      ],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+60123456789',
        addressLine1: '123 Main Street',
        addressLine2: 'Apt 4B',
        city: 'Kuala Lumpur',
        state: 'KUL',
        postalCode: '50000',
        country: 'Malaysia',
      },
      taxBreakdown: {
        taxableAmount: 150.0,
        sstAmount: 9.0,
        gstAmount: 0.0,
        totalTax: 9.0,
        taxRate: '6%',
      },
    };
  }
}

// Export singleton instance
export const receiptTemplateService = ReceiptTemplateService.getInstance();
