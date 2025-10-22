'use client';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, Eye, Star } from 'lucide-react';
import {
  ReceiptTemplate,
  ReceiptTemplateType,
  TEMPLATE_TYPE_LABELS,
} from '@/types/receipt-templates';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  templates: ReceiptTemplate[];
  selectedTemplateId?: string;
  onSelectionChange?: (templateId: string) => void;
  onPreview?: (template: ReceiptTemplate) => void;
  allowSetDefault?: boolean;
  className?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelectionChange,
  onPreview,
  allowSetDefault = false,
  className,
}) => {
  const [selectedId, setSelectedId] = useState(selectedTemplateId || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (selectedTemplateId) {
      setSelectedId(selectedTemplateId);
    } else {
      // Auto-select default template if none selected
      const defaultTemplate = templates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedId(defaultTemplate.id);
        onSelectionChange?.(defaultTemplate.id);
      }
    }
  }, [selectedTemplateId, templates, onSelectionChange]);

  const handleSelectionChange = (templateId: string) => {
    setSelectedId(templateId);
    onSelectionChange?.(templateId);
  };

  const handleSetAsDefault = async (templateId: string) => {
    if (!allowSetDefault) {
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch(
        `/api/admin/receipt-templates/${templateId}/set-default`,
        {
          method: 'PATCH',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to set default template');
      }

      toast.success('Default template updated successfully');
      // The parent component should refresh the templates list
    } catch (error) {
      console.error('Error setting default template:', error);
      toast.error('Failed to set default template');
    } finally {
      setIsUpdating(false);
    }
  };

  const getTemplateTypeColor = (templateType: ReceiptTemplateType): string => {
    const colors = {
      THERMAL_RECEIPT: 'bg-blue-100 text-blue-800 border-blue-200',
      BUSINESS_INVOICE: 'bg-purple-100 text-purple-800 border-purple-200',
      MINIMAL_RECEIPT: 'bg-green-100 text-green-800 border-green-200',
      DETAILED_INVOICE: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[templateType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTemplateIcon = (templateType: ReceiptTemplateType): string => {
    const icons = {
      THERMAL_RECEIPT: '🧾',
      BUSINESS_INVOICE: '📄',
      MINIMAL_RECEIPT: '📝',
      DETAILED_INVOICE: '📋',
    };
    return icons[templateType] || '📄';
  };

  const activeTemplates = templates.filter(t => t.isActive);

  if (activeTemplates.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No active templates available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Select Template</h3>
        <Badge variant="outline" className="text-xs">
          {activeTemplates.length} template
          {activeTemplates.length !== 1 ? 's' : ''} available
        </Badge>
      </div>

      <RadioGroup value={selectedId} onValueChange={handleSelectionChange}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTemplates.map(template => (
            <Card
              key={template.id}
              className={cn(
                'relative cursor-pointer transition-all duration-200 hover:shadow-md',
                selectedId === template.id &&
                  'ring-2 ring-primary ring-offset-2'
              )}
              onClick={() => handleSelectionChange(template.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={template.id} id={template.id} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {getTemplateIcon(template.templateType)}
                      </span>
                      <Label
                        htmlFor={template.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {template.name}
                      </Label>
                      {template.isDefault && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <Badge
                      className={getTemplateTypeColor(template.templateType)}
                    >
                      {TEMPLATE_TYPE_LABELS[template.templateType]}
                    </Badge>
                  </div>
                </div>
                {template.description && (
                  <p className="text-xs text-muted-foreground ml-6">
                    {template.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="pt-0 pb-3">
                <div className="flex items-center justify-between ml-6">
                  <div className="text-xs text-muted-foreground">
                    Updated {new Date(template.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    {onPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          onPreview(template);
                        }}
                        className="h-8 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    )}

                    {allowSetDefault && !template.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          handleSetAsDefault(template.id);
                        }}
                        disabled={isUpdating}
                        className="h-8 px-2 text-xs"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Set Default
                      </Button>
                    )}
                  </div>
                </div>

                {selectedId === template.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>

      {selectedId && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Selected Template</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {templates.find(t => t.id === selectedId)?.name} will be used for
            generating receipts and invoices.
          </div>
        </div>
      )}
    </div>
  );
};
