import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'advanced' | 'enterprise' | 'custom';
  isBuiltIn: boolean;
  configuration: {
    ordersEnabled: boolean;
    inventoryEnabled: boolean;
    ordersChannelName?: string;
    inventoryChannelName?: string;
    additionalSettings?: Record<string, any>;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const BUILT_IN_TEMPLATES: ConfigurationTemplate[] = [
  {
    id: 'basic-orders-only',
    name: 'Basic Order Notifications',
    description: 'Simple setup for order notifications only. Perfect for small businesses.',
    category: 'basic',
    isBuiltIn: true,
    configuration: {
      ordersEnabled: true,
      inventoryEnabled: false,
      ordersChannelName: 'Orders',
      additionalSettings: {
        notificationLevel: 'standard',
        includeCustomerDetails: true,
        includePaymentMethod: true
      }
    },
    tags: ['orders', 'basic', 'beginner'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inventory-focused',
    name: 'Inventory Management Focus',
    description: 'Primarily for inventory alerts with optional order notifications.',
    category: 'basic',
    isBuiltIn: true,
    configuration: {
      ordersEnabled: false,
      inventoryEnabled: true,
      inventoryChannelName: 'Inventory Alerts',
      additionalSettings: {
        lowStockThreshold: 5,
        outOfStockAlerts: true,
        restockReminders: true
      }
    },
    tags: ['inventory', 'stock', 'alerts'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'complete-notifications',
    name: 'Complete Notification Suite',
    description: 'Full setup with both order and inventory notifications. Recommended for active businesses.',
    category: 'advanced',
    isBuiltIn: true,
    configuration: {
      ordersEnabled: true,
      inventoryEnabled: true,
      ordersChannelName: 'Order Updates',
      inventoryChannelName: 'Inventory Alerts',
      additionalSettings: {
        notificationLevel: 'detailed',
        includeCustomerDetails: true,
        includePaymentMethod: true,
        lowStockThreshold: 10,
        outOfStockAlerts: true,
        restockReminders: true,
        dailySummary: true
      }
    },
    tags: ['complete', 'orders', 'inventory', 'advanced'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'enterprise-multi-channel',
    name: 'Enterprise Multi-Channel',
    description: 'Advanced setup for large businesses with multiple departments and detailed reporting.',
    category: 'enterprise',
    isBuiltIn: true,
    configuration: {
      ordersEnabled: true,
      inventoryEnabled: true,
      ordersChannelName: 'Order Processing',
      inventoryChannelName: 'Stock Management',
      additionalSettings: {
        notificationLevel: 'comprehensive',
        includeCustomerDetails: true,
        includePaymentMethod: true,
        includeShippingDetails: true,
        lowStockThreshold: 20,
        outOfStockAlerts: true,
        restockReminders: true,
        dailySummary: true,
        weeklySummary: true,
        departmentSeparation: true,
        priorityOrders: true
      }
    },
    tags: ['enterprise', 'multi-channel', 'detailed', 'comprehensive'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'minimal-silent',
    name: 'Minimal & Silent',
    description: 'Quiet notifications for stores that need minimal disruption.',
    category: 'basic',
    isBuiltIn: true,
    configuration: {
      ordersEnabled: true,
      inventoryEnabled: false,
      ordersChannelName: 'Silent Orders',
      additionalSettings: {
        notificationLevel: 'minimal',
        includeCustomerDetails: false,
        includePaymentMethod: false,
        silentMode: true,
        onlyHighValue: true,
        highValueThreshold: 100
      }
    },
    tags: ['minimal', 'silent', 'quiet', 'high-value'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',');

    let templates = [...BUILT_IN_TEMPLATES];

    // Get custom templates from database
    const customTemplates = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'telegram_template_'
        }
      }
    });

    const customTemplateData = customTemplates.reduce((acc, template) => {
      const templateId = template.key.replace('telegram_template_', '');
      try {
        const templateData: ConfigurationTemplate = JSON.parse(template.value);
        acc.push(templateData);
      } catch (error) {
        console.error(`Failed to parse template ${templateId}:`, error);
      }
      return acc;
    }, [] as ConfigurationTemplate[]);

    templates = [...templates, ...customTemplateData];

    // Apply filters
    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (tags && tags.length > 0) {
      templates = templates.filter(t => 
        tags.some(tag => t.tags.includes(tag.trim()))
      );
    }

    const response = {
      templates,
      categories: ['basic', 'advanced', 'enterprise', 'custom'],
      availableTags: [...new Set(templates.flatMap(t => t.tags))].sort()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateData = await request.json();

    // Validate template data
    const validation = validateTemplate(templateData);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Invalid template data',
        details: validation.errors
      }, { status: 400 });
    }

    const template: ConfigurationTemplate = {
      id: templateData.id || `custom_${Date.now()}`,
      name: templateData.name,
      description: templateData.description,
      category: templateData.category || 'custom',
      isBuiltIn: false,
      configuration: templateData.configuration,
      tags: templateData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to database
    await prisma.systemConfig.upsert({
      where: { key: `telegram_template_${template.id}` },
      create: {
        key: `telegram_template_${template.id}`,
        value: JSON.stringify(template)
      },
      update: {
        value: JSON.stringify(template)
      }
    });

    return NextResponse.json({
      success: true,
      template,
      message: 'Template saved successfully'
    });

  } catch (error) {
    console.error('Error saving template:', error);
    return NextResponse.json({ 
      error: 'Failed to save template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    // Check if it's a built-in template
    const isBuiltIn = BUILT_IN_TEMPLATES.some(t => t.id === templateId);
    if (isBuiltIn) {
      return NextResponse.json({ error: 'Cannot delete built-in templates' }, { status: 400 });
    }

    // Delete from database
    await prisma.systemConfig.delete({
      where: { key: `telegram_template_${templateId}` }
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ 
      error: 'Failed to delete template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function validateTemplate(template: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!template.name || typeof template.name !== 'string') {
    errors.push('Template name is required');
  }

  if (!template.description || typeof template.description !== 'string') {
    errors.push('Template description is required');
  }

  if (!template.configuration || typeof template.configuration !== 'object') {
    errors.push('Template configuration is required');
  } else {
    if (typeof template.configuration.ordersEnabled !== 'boolean') {
      errors.push('ordersEnabled must be a boolean');
    }

    if (typeof template.configuration.inventoryEnabled !== 'boolean') {
      errors.push('inventoryEnabled must be a boolean');
    }

    if (!template.configuration.ordersEnabled && !template.configuration.inventoryEnabled) {
      errors.push('At least one notification type must be enabled');
    }
  }

  if (template.category && !['basic', 'advanced', 'enterprise', 'custom'].includes(template.category)) {
    errors.push('Invalid category');
  }

  return { valid: errors.length === 0, errors };
}