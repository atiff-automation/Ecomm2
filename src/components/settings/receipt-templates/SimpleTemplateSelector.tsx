'use client';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Settings,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ReceiptTemplate,
  TEMPLATE_TYPE_LABELS,
} from '@/types/receipt-templates';
import { cn } from '@/lib/utils';

interface SimpleTemplateSelectorProps {
  className?: string;
}

export default function SimpleTemplateSelector({
  className,
}: SimpleTemplateSelectorProps) {
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializingDefault, setInitializingDefault] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<ReceiptTemplate | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithCSRF('/api/admin/receipt-templates');

      if (!response.ok) {
        // If no templates exist, try to initialize them
        if (response.status === 404 || response.status === 500) {
          await initializeTemplates();
          return;
        }
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();

      if (data.success && data.templates?.length > 0) {
        setTemplates(data.templates);
      } else {
        // No templates found, initialize defaults
        await initializeTemplates();
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const initializeTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetchWithCSRF('/api/admin/receipt-templates/initialize', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to initialize templates');
      }

      const data = await response.json();
      if (data.success && data.templates) {
        setTemplates(data.templates);
        toast.success('Default templates initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing templates:', error);
      setError('Failed to initialize default templates');
      toast.error('Failed to initialize templates');
    }
  };

  const setAsDefault = async (templateId: string) => {
    try {
      setInitializingDefault(templateId);

      const response = await fetch(
        `/api/admin/receipt-templates/${templateId}/set-default`,
        {
          method: 'PUT',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set default template');
      }

      const data = await response.json();
      if (data.success) {
        // Update local state
        setTemplates(prevTemplates =>
          prevTemplates.map(template => ({
            ...template,
            isDefault: template.id === templateId,
            isActive: template.id === templateId ? true : template.isActive,
          }))
        );
        toast.success('Default template updated successfully');
      }
    } catch (error) {
      console.error('Error setting default template:', error);
      toast.error('Failed to set default template');
    } finally {
      setInitializingDefault(null);
    }
  };

  const handlePreview = async (template: ReceiptTemplate) => {
    try {
      setPreviewLoading(true);
      setPreviewTemplate(template);

      const response = await fetch(
        `/api/admin/receipt-templates/${template.id}/preview`
      );

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const htmlContent = await response.text();
      setPreviewHtml(htmlContent);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
      // Set fallback preview HTML
      setPreviewHtml(`
        <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
          <h2>Preview Not Available</h2>
          <p>Unable to generate preview for ${template.name}</p>
          <p><em>${getTemplateDescription(template.templateType)}</em></p>
        </div>
      `);
    } finally {
      setPreviewLoading(false);
    }
  };

  const getTemplateIcon = (templateType: string) => {
    const icons = {
      THERMAL_RECEIPT: '🧾',
      BUSINESS_INVOICE: '📋',
      MINIMAL_RECEIPT: '📄',
      DETAILED_INVOICE: '📊',
    };
    return icons[templateType as keyof typeof icons] || '📄';
  };

  const getTemplateDescription = (templateType: string) => {
    const descriptions = {
      THERMAL_RECEIPT: 'Compact format for thermal printers',
      BUSINESS_INVOICE: 'Professional business documentation',
      MINIMAL_RECEIPT: 'Clean and modern design',
      DETAILED_INVOICE: 'Comprehensive with full details',
    };
    return descriptions[templateType as keyof typeof descriptions] || '';
  };

  const getUseCaseRecommendation = (templateType: string) => {
    const recommendations = {
      THERMAL_RECEIPT: 'Best for: Retail stores, POS systems',
      BUSINESS_INVOICE: 'Best for: B2B transactions, service providers',
      MINIMAL_RECEIPT: 'Best for: Modern retail, mobile commerce',
      DETAILED_INVOICE: 'Best for: Tax compliance, detailed billing',
    };
    return recommendations[templateType as keyof typeof recommendations] || '';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading templates...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Error Loading Templates
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadTemplates} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Receipt Templates</h2>
          <p className="text-muted-foreground mt-1">
            Choose which template to use as your default for customer receipts
          </p>
        </div>
        <Button onClick={loadTemplates} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map(template => (
          <Card
            key={template.id}
            className={cn(
              'transition-all duration-200 hover:shadow-md',
              template.isDefault && 'ring-2 ring-blue-500 bg-blue-50/30'
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {getTemplateIcon(template.templateType)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {TEMPLATE_TYPE_LABELS[template.templateType]}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getTemplateDescription(template.templateType)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {template.isDefault && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      <Check className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  )}
                  {template.isActive && (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">
                  <div className="font-medium text-green-700 mb-1">
                    {getUseCaseRecommendation(template.templateType)}
                  </div>
                  <p className="text-muted-foreground">
                    {template.description ||
                      getTemplateDescription(template.templateType)}
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Last updated:{' '}
                      {new Date(template.updatedAt).toLocaleDateString('en-MY')}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePreview(template)}
                        disabled={previewLoading}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>

                      {!template.isDefault && (
                        <Button
                          onClick={() => setAsDefault(template.id)}
                          disabled={initializingDefault === template.id}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {initializingDefault === template.id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Setting...
                            </>
                          ) : (
                            <>
                              <Settings className="h-3 w-3 mr-1" />
                              Use as Default
                            </>
                          )}
                        </Button>
                      )}

                      {template.isDefault && (
                        <div className="flex items-center text-sm text-blue-600 font-medium">
                          <Check className="h-4 w-4 mr-1" />
                          Currently Active
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Templates Available
            </h3>
            <p className="text-muted-foreground mb-4">
              No receipt templates are currently configured in your system.
            </p>
            <Button onClick={initializeTemplates}>
              Initialize Default Templates
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-1">💡</div>
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">How it works:</p>
              <p className="text-blue-700">
                Click "Preview" to see how each template looks, then select "Use
                as Default" to make it your active receipt template. All new
                customer receipts will be generated using this template design.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog
        open={previewTemplate !== null}
        onOpenChange={() => setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                Preview:{' '}
                {previewTemplate &&
                  TEMPLATE_TYPE_LABELS[previewTemplate.templateType]}
              </span>
              <div className="flex items-center gap-2">
                {previewTemplate && (
                  <Badge
                    className={cn(
                      'text-xs',
                      previewTemplate.isDefault
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {previewTemplate.isDefault
                      ? 'Currently Active'
                      : 'Available'}
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[70vh] border rounded-lg">
            {previewLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating preview...
                </div>
              </div>
            ) : previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[70vh] border-0"
                title={`${previewTemplate?.name} Preview`}
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>Preview not available</p>
              </div>
            )}
          </div>

          {previewTemplate && !previewTemplate.isDefault && (
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() => {
                  setAsDefault(previewTemplate.id);
                  setPreviewTemplate(null);
                }}
                disabled={initializingDefault === previewTemplate.id}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {initializingDefault === previewTemplate.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting as Default...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Use as Default
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
