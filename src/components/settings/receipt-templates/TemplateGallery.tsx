'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Eye,
  Download,
  Check,
  RefreshCw,
  Sparkles,
  FileText,
  Calculator,
  Printer,
  Smartphone,
} from 'lucide-react';
import {
  ReceiptTemplateType,
  TEMPLATE_TYPE_LABELS,
  DEFAULT_TEMPLATE_CONFIGS,
  ReceiptTemplateContent,
} from '@/types/receipt-templates';
import { TemplatePreview } from './TemplatePreview';
import { cn } from '@/lib/utils';

interface GalleryTemplate {
  type: ReceiptTemplateType;
  name: string;
  description: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  config: ReceiptTemplateContent;
  category: 'receipt' | 'invoice' | 'modern';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  recommended?: boolean;
}

interface TemplateGalleryProps {
  onTemplateInstalled?: () => void;
  className?: string;
}

const GALLERY_TEMPLATES: GalleryTemplate[] = [
  {
    type: 'THERMAL_RECEIPT',
    name: 'Thermal Receipt',
    description:
      'Compact receipt style perfect for thermal printers and point-of-sale systems.',
    features: [
      'Compact layout',
      'Monospace font',
      'Thermal printer friendly',
      'Basic styling',
    ],
    icon: Printer,
    config: DEFAULT_TEMPLATE_CONFIGS.THERMAL_RECEIPT,
    category: 'receipt',
    difficulty: 'basic',
    recommended: true,
  },
  {
    type: 'MINIMAL_RECEIPT',
    name: 'Minimal Receipt',
    description:
      'Clean and modern receipt design with minimal styling and mobile-friendly layout.',
    features: [
      'Clean design',
      'Mobile responsive',
      'Modern typography',
      'Minimal styling',
    ],
    icon: Smartphone,
    config: DEFAULT_TEMPLATE_CONFIGS.MINIMAL_RECEIPT,
    category: 'modern',
    difficulty: 'basic',
  },
  {
    type: 'BUSINESS_INVOICE',
    name: 'Business Invoice',
    description:
      'Professional invoice format suitable for business-to-business transactions.',
    features: [
      'Professional layout',
      'Company branding',
      'Detailed sections',
      'A4 format',
    ],
    icon: FileText,
    config: DEFAULT_TEMPLATE_CONFIGS.BUSINESS_INVOICE,
    category: 'invoice',
    difficulty: 'intermediate',
    recommended: true,
  },
  {
    type: 'DETAILED_INVOICE',
    name: 'Detailed Invoice',
    description:
      'Comprehensive invoice with full tax details and compliance information.',
    features: [
      'Tax compliance focused',
      'Detailed breakdowns',
      'Multiple addresses',
      'Professional appearance',
    ],
    icon: Calculator,
    config: DEFAULT_TEMPLATE_CONFIGS.DETAILED_INVOICE,
    category: 'invoice',
    difficulty: 'advanced',
  },
];

const CATEGORIES = {
  receipt: { label: 'Receipts', color: 'bg-blue-100 text-blue-800' },
  invoice: { label: 'Invoices', color: 'bg-purple-100 text-purple-800' },
  modern: { label: 'Modern', color: 'bg-green-100 text-green-800' },
};

const DIFFICULTY_COLORS = {
  basic: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onTemplateInstalled,
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'receipt' | 'invoice' | 'modern'
  >('all');
  const [previewTemplate, setPreviewTemplate] =
    useState<GalleryTemplate | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);

  const filteredTemplates =
    selectedCategory === 'all'
      ? GALLERY_TEMPLATES
      : GALLERY_TEMPLATES.filter(t => t.category === selectedCategory);

  const handleInstallTemplate = async (template: GalleryTemplate) => {
    try {
      setInstalling(template.type);

      const response = await fetch('/api/admin/receipt-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          templateType: template.type,
          templateContent: template.config,
          isActive: true,
          isDefault:
            template.recommended &&
            filteredTemplates.filter(t => t.recommended).length === 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to install template');
      }

      toast.success(`${template.name} installed successfully!`);
      onTemplateInstalled?.();
    } catch (error: any) {
      console.error('Template installation error:', error);
      toast.error(error.message || 'Failed to install template');
    } finally {
      setInstalling(null);
    }
  };

  const handlePreview = (template: GalleryTemplate) => {
    setPreviewTemplate(template);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  if (previewTemplate) {
    // Create a mock ReceiptTemplate for preview
    const mockTemplate = {
      id: 'preview',
      name: previewTemplate.name,
      description: previewTemplate.description,
      templateType: previewTemplate.type,
      templateContent: previewTemplate.config,
      isDefault: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: null,
    };

    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={handleClosePreview}
            className="flex items-center gap-2"
          >
            ← Back to Gallery
          </Button>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              Preview: {previewTemplate.name}
            </h2>
            <Button onClick={() => handleInstallTemplate(previewTemplate)}>
              <Plus className="h-4 w-4 mr-2" />
              Install Template
            </Button>
          </div>
        </div>
        <TemplatePreview template={mockTemplate} onClose={handleClosePreview} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Gallery Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" />
          Template Gallery
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose from our collection of professional receipt and invoice
          templates. Each template is designed for different business needs and
          use cases.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All Templates
        </Button>
        {Object.entries(CATEGORIES).map(([key, category]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(key as any)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => {
          const Icon = template.icon;
          const categoryInfo = CATEGORIES[template.category];
          const isInstalling = installing === template.type;

          return (
            <Card
              key={template.type}
              className={cn(
                'relative group hover:shadow-lg transition-all duration-200',
                template.recommended && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              {template.recommended && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={categoryInfo.color}>
                        {categoryInfo.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={DIFFICULTY_COLORS[template.difficulty]}
                      >
                        {template.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Features:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {template.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(template)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-2" />
                    Preview
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleInstallTemplate(template)}
                    disabled={isInstalling}
                    className="flex-1"
                  >
                    {isInstalling ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-2" />
                        Install
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Templates Found
          </h3>
          <p className="text-gray-500 mb-6">
            No templates match the selected category. Try selecting a different
            category.
          </p>
          <Button variant="outline" onClick={() => setSelectedCategory('all')}>
            Show All Templates
          </Button>
        </div>
      )}

      {/* Installation Help */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Need Help Choosing?</h4>
              <p className="text-sm text-muted-foreground">
                • <strong>Thermal Receipt:</strong> Best for POS systems and
                simple receipts
                <br />• <strong>Minimal Receipt:</strong> Modern design for
                online stores
                <br />• <strong>Business Invoice:</strong> Professional invoices
                for B2B transactions
                <br />• <strong>Detailed Invoice:</strong> Comprehensive
                invoices with full tax details
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                💡 <strong>Tip:</strong> You can install multiple templates and
                switch between them anytime.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
