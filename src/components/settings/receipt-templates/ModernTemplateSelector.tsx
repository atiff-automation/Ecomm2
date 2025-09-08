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
  Sparkles,
  Crown,
  Star,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { ReceiptTemplate, TEMPLATE_TYPE_LABELS } from '@/types/receipt-templates';
import { templateDisplayService, EnhancedReceiptTemplate } from '@/lib/receipts/template-display-service';
import { cn } from '@/lib/utils';

interface ModernTemplateSelectorProps {
  className?: string;
}

export default function ModernTemplateSelector({ className }: ModernTemplateSelectorProps) {
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
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin" />
              <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-blue-500" />
            </div>
            <p className="text-sm font-medium">Loading your templates...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-red-50 border border-red-100">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-red-700">Unable to Load Templates</h3>
              <p className="text-muted-foreground text-sm max-w-md">{error}</p>
            </div>
            <Button onClick={loadTemplates} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Receipt Templates</h1>
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
          <p className="text-muted-foreground">
            Choose your preferred template design for customer receipts and invoices
          </p>
        </div>
        <Button onClick={loadTemplates} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {templates.map((template, index) => {
          const statusInfo = templateDisplayService.getTemplateStatusInfo(template);
          
          return (
            <Card 
              key={template.id}
              className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                template.isDefault && "ring-2 ring-blue-500 shadow-lg",
                "hover:scale-[1.02] hover:-translate-y-1"
              )}
            >
              {/* Popular Badge */}
              {index === 0 && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-md gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Default Badge */}
              {template.isDefault && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-blue-500 text-white border-0 shadow-md gap-1">
                    <Check className="h-3 w-3" />
                    Active
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Icon with gradient background */}
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br shadow-lg",
                      template.displayConfig.gradient
                    )}>
                      <span className="filter drop-shadow-sm">
                        {template.displayConfig.icon}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold">
                        {TEMPLATE_TYPE_LABELS[template.templateType]}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs border-0 bg-gray-50", template.displayConfig.categoryInfo.color)}
                        >
                          {template.displayConfig.categoryInfo.name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {template.displayConfig.description}
                  </p>
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      {template.displayConfig.useCase}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Key Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.displayConfig.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">
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
                      className="gap-2"
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </Button>
                    
                    {statusInfo.canSetAsDefault && (
                      <Button
                        onClick={() => setAsDefault(template.id)}
                        disabled={settingDefault === template.id}
                        size="sm"
                        className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      >
                        {settingDefault === template.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Setting...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-3 w-3" />
                            Use This Template
                          </>
                        )}
                      </Button>
                    )}
                    
                    {template.isDefault && (
                      <div className="flex items-center text-sm text-blue-600 font-medium gap-1 px-3 py-2 bg-blue-50 rounded-md">
                        <Check className="h-4 w-4" />
                        Currently Active
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900">How Template Selection Works</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Click <strong>"Preview"</strong> to see how each template looks with sample data</p>
                <p>• Select <strong>"Use This Template"</strong> to make it your active receipt template</p>
                <p>• All future customer receipts and invoices will use your selected design</p>
                <p>• You can change templates anytime without affecting past receipts</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewTemplate !== null} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-gradient-to-br",
                  previewTemplate?.displayConfig.gradient || "from-gray-400 to-gray-600"
                )}>
                  {previewTemplate?.displayConfig.icon}
                </div>
                <span>
                  {previewTemplate && TEMPLATE_TYPE_LABELS[previewTemplate.templateType]} Preview
                </span>
              </div>
              {previewTemplate && (
                <Badge className={cn(
                  "text-xs",
                  previewTemplate.isDefault 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-100 text-gray-700"
                )}>
                  {previewTemplate.isDefault ? 'Currently Active' : 'Available'}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[75vh] border rounded-xl bg-gray-50">
            {previewLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="font-medium">Generating preview...</p>
                </div>
              </div>
            ) : previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[75vh] border-0 rounded-xl"
                title={`${previewTemplate?.name} Preview`}
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-full w-fit mx-auto">
                    <Eye className="h-8 w-8" />
                  </div>
                  <p className="font-medium">Preview not available</p>
                </div>
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
                className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {settingDefault === previewTemplate.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting as Active...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    Use This Template
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