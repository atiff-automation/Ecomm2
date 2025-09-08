'use client';

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
  Check, 
  Loader2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Settings,
  Receipt,
  FileText,
  FileCheck,
  FileBarChart
} from 'lucide-react';
import { toast } from 'sonner';
import { ReceiptTemplate, TEMPLATE_TYPE_LABELS } from '@/types/receipt-templates';
import { templateDisplayService, EnhancedReceiptTemplate } from '@/lib/receipts/template-display-service';
import { cn } from '@/lib/utils';

interface ThemeConsistentTemplateSelectorProps {
  className?: string;
}

// Icon mapping following your existing pattern
const IconMap = {
  'Receipt': Receipt,
  'FileText': FileText,
  'FileCheck': FileCheck,
  'FileBarChart': FileBarChart
};

export default function ThemeConsistentTemplateSelector({ className }: ThemeConsistentTemplateSelectorProps) {
  const [templates, setTemplates] = useState<EnhancedReceiptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EnhancedReceiptTemplate | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/receipt-templates');
      
      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          await initializeTemplates();
          return;
        }
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      
      if (data.success && data.templates?.length > 0) {
        const enhanced = templateDisplayService.enhanceTemplates(data.templates);
        const sorted = templateDisplayService.sortTemplatesByPopularity(enhanced);
        setTemplates(sorted);
      } else {
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
      const response = await fetch('/api/admin/receipt-templates/initialize', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to initialize templates');
      }

      const data = await response.json();
      if (data.success && data.templates) {
        const enhanced = templateDisplayService.enhanceTemplates(data.templates);
        const sorted = templateDisplayService.sortTemplatesByPopularity(enhanced);
        setTemplates(sorted);
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
      setSettingDefault(templateId);

      const response = await fetch(`/api/admin/receipt-templates/${templateId}/set-default`, {
        method: 'PUT'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set default template');
      }

      const data = await response.json();
      if (data.success) {
        setTemplates(prevTemplates => 
          prevTemplates.map(template => ({
            ...template,
            isDefault: template.id === templateId,
            isActive: template.id === templateId ? true : template.isActive
          }))
        );
        toast.success('Default template updated successfully');
      }
    } catch (error) {
      console.error('Error setting default template:', error);
      toast.error('Failed to set default template');
    } finally {
      setSettingDefault(null);
    }
  };

  const handlePreview = async (template: EnhancedReceiptTemplate) => {
    try {
      setPreviewLoading(true);
      setPreviewTemplate(template);

      const response = await fetch(`/api/admin/receipt-templates/${template.id}/preview`);
      
      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const htmlContent = await response.text();
      setPreviewHtml(htmlContent);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
      setPreviewHtml(templateDisplayService.generatePreviewFallbackHtml(template));
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading templates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Templates</h3>
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
      {/* Header */}
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

      {/* Templates Grid - matching your existing business profile layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template, index) => {
          const statusInfo = templateDisplayService.getTemplateStatusInfo(template);
          const IconComponent = IconMap[template.displayConfig.icon as keyof typeof IconMap] || FileText;
          
          return (
            <Card 
              key={template.id}
              className={cn(
                "relative transition-all duration-200 hover:shadow-md",
                template.isDefault && "ring-2 ring-blue-500 bg-blue-50/30"
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Icon with subtle background - matching business profile style */}
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      template.displayConfig.gradient,
                      template.isDefault ? "bg-blue-100" : ""
                    )}>
                      <IconComponent className={cn(
                        "h-5 w-5",
                        template.isDefault ? "text-blue-600" : "text-gray-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {TEMPLATE_TYPE_LABELS[template.templateType]}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.displayConfig.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {template.isDefault && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        <Check className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                    {template.isActive && !template.isDefault && (
                      <Badge variant="secondary">Active</Badge>
                    )}
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs">
                        Most Popular
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Use case recommendation - matching business profile info style */}
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      {template.displayConfig.useCase}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.displayConfig.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Updated {new Date(template.updatedAt).toLocaleDateString('en-MY')}
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
                      
                      {statusInfo.canSetAsDefault && (
                        <Button
                          onClick={() => setAsDefault(template.id)}
                          disabled={settingDefault === template.id}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {settingDefault === template.id ? (
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No templates state */}
      {templates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
            <p className="text-muted-foreground mb-4">
              No receipt templates are currently configured in your system.
            </p>
            <Button onClick={initializeTemplates}>
              Initialize Default Templates
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Help Card - matching business profile warning style */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="h-5 w-5 text-blue-600 mt-0.5">💡</div>
          <div>
            <h4 className="text-sm font-medium text-blue-800">How Template Selection Works</h4>
            <div className="text-sm text-blue-700 mt-1 space-y-1">
              <p>• Click "Preview" to see how each template looks with sample data</p>
              <p>• Select "Use as Default" to make it your active receipt template</p>
              <p>• All future customer receipts and invoices will use your selected design</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewTemplate !== null} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                Preview: {previewTemplate && TEMPLATE_TYPE_LABELS[previewTemplate.templateType]}
              </span>
              {previewTemplate && (
                <Badge className={cn(
                  "text-xs",
                  previewTemplate.isDefault ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                )}>
                  {previewTemplate.isDefault ? 'Currently Active' : 'Available'}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[70vh] border rounded-lg">
            {previewLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating preview...</span>
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
                disabled={settingDefault === previewTemplate.id}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {settingDefault === previewTemplate.id ? (
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