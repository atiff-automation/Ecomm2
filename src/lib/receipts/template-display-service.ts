/**
 * Template Display Service
 * Centralized service for template presentation logic
 */

import {
  ReceiptTemplate,
  ReceiptTemplateType,
} from '@/types/receipt-templates';
import {
  getTemplateConfig,
  getTemplatesByPopularity,
  TEMPLATE_CATEGORIES,
} from './template-config';

export interface EnhancedReceiptTemplate extends ReceiptTemplate {
  displayConfig: {
    icon: string;
    gradient: string;
    description: string;
    useCase: string;
    features: string[];
    category: string;
    categoryInfo: {
      name: string;
      description: string;
      color: string;
    };
    popularityRank: number;
  };
}

export class TemplateDisplayService {
  private static instance: TemplateDisplayService;

  public static getInstance(): TemplateDisplayService {
    if (!TemplateDisplayService.instance) {
      TemplateDisplayService.instance = new TemplateDisplayService();
    }
    return TemplateDisplayService.instance;
  }

  /**
   * Enhance templates with display configuration
   */
  enhanceTemplates(templates: ReceiptTemplate[]): EnhancedReceiptTemplate[] {
    return templates.map(template => this.enhanceTemplate(template));
  }

  /**
   * Enhance single template with display configuration
   */
  enhanceTemplate(template: ReceiptTemplate): EnhancedReceiptTemplate {
    const config = getTemplateConfig(template.templateType);
    const categoryInfo = TEMPLATE_CATEGORIES[config.category];

    return {
      ...template,
      displayConfig: {
        ...config,
        categoryInfo,
      },
    };
  }

  /**
   * Sort templates by popularity
   */
  sortTemplatesByPopularity(
    templates: EnhancedReceiptTemplate[]
  ): EnhancedReceiptTemplate[] {
    return templates.sort(
      (a, b) => a.displayConfig.popularityRank - b.displayConfig.popularityRank
    );
  }

  /**
   * Group templates by category
   */
  groupTemplatesByCategory(
    templates: EnhancedReceiptTemplate[]
  ): Record<string, EnhancedReceiptTemplate[]> {
    return templates.reduce(
      (groups, template) => {
        const category = template.displayConfig.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(template);
        return groups;
      },
      {} as Record<string, EnhancedReceiptTemplate[]>
    );
  }

  /**
   * Get template status display info
   */
  getTemplateStatusInfo(template: ReceiptTemplate) {
    return {
      isDefault: template.isDefault,
      isActive: template.isActive,
      statusText: template.isDefault
        ? 'Default'
        : template.isActive
          ? 'Active'
          : 'Inactive',
      statusVariant: template.isDefault
        ? 'default'
        : template.isActive
          ? 'secondary'
          : 'outline',
      actionText: template.isDefault ? 'Currently Active' : 'Use as Default',
      canSetAsDefault: !template.isDefault && template.isActive,
    };
  }

  /**
   * Generate preview fallback HTML
   */
  generatePreviewFallbackHtml(template: ReceiptTemplate): string {
    const config = getTemplateConfig(template.templateType);

    return `
      <div style="padding: 40px; text-align: center; font-family: 'Inter', system-ui, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <div style="background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 400px; width: 100%;">
          <div style="font-size: 48px; margin-bottom: 16px;">${config.icon}</div>
          <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">${template.name}</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;">${config.description}</p>
          <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: #475569; font-size: 13px; margin: 0; font-weight: 500;">${config.useCase}</p>
          </div>
          <div style="text-align: left;">
            <p style="color: #374151; font-size: 12px; font-weight: 600; margin: 0 0 8px 0;">Features:</p>
            <ul style="color: #6b7280; font-size: 12px; margin: 0; padding-left: 16px;">
              ${config.features.map(feature => `<li style="margin-bottom: 4px;">${feature}</li>`).join('')}
            </ul>
          </div>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;"><em>Preview generation temporarily unavailable</em></p>
      </div>
    `;
  }
}

// Export singleton instance
export const templateDisplayService = TemplateDisplayService.getInstance();
