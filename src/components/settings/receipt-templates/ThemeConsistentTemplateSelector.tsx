'use client';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  FileBarChart,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ReceiptTemplate,
  TEMPLATE_TYPE_LABELS,
} from '@/types/receipt-templates';
import {
  templateDisplayService,
  EnhancedReceiptTemplate,
} from '@/lib/receipts/template-display-service';
import { cn } from '@/lib/utils';

interface ThemeConsistentTemplateSelectorProps {
  className?: string;
}

// Icon mapping following your existing pattern
const IconMap = {
  Receipt: Receipt,
  FileText: FileText,
  FileCheck: FileCheck,
  FileBarChart: FileBarChart,
};

export default function ThemeConsistentTemplateSelector({
  className,
}: ThemeConsistentTemplateSelectorProps) {
  const [templates, setTemplates] = useState<EnhancedReceiptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<EnhancedReceiptTemplate | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  // Logo upload states
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoWidth, setLogoWidth] = useState<number>(120);
  const [logoHeight, setLogoHeight] = useState<number>(40);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    loadTemplates();
    loadBusinessProfile();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithCSRF('/api/admin/receipt-templates');

      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          await initializeTemplates();
          return;
        }
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();

      if (data.success && data.templates?.length > 0) {
        const enhanced = templateDisplayService.enhanceTemplates(
          data.templates
        );
        const sorted =
          templateDisplayService.sortTemplatesByPopularity(enhanced);
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
      const response = await fetchWithCSRF('/api/admin/receipt-templates/initialize', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to initialize templates');
      }

      const data = await response.json();
      if (data.success && data.templates) {
        const enhanced = templateDisplayService.enhanceTemplates(
          data.templates
        );
        const sorted =
          templateDisplayService.sortTemplatesByPopularity(enhanced);
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
      setSettingDefault(null);
    }
  };

  const handlePreview = async (template: EnhancedReceiptTemplate) => {
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
      setPreviewHtml(
        templateDisplayService.generatePreviewFallbackHtml(template)
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const loadBusinessProfile = async () => {
    try {
      const response = await fetchWithCSRF('/api/admin/settings/business-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setBusinessProfile(data.profile);
          if (data.profile.logoWidth) {
            setLogoWidth(data.profile.logoWidth);
          }
          if (data.profile.logoHeight) {
            setLogoHeight(data.profile.logoHeight);
          }
        }
      }
    } catch (error) {
      console.error('Error loading business profile:', error);
    }
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setMessage({
        type: 'error',
        text: 'File size too large. Maximum size is 5MB.',
      });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('width', logoWidth.toString());
      formData.append('height', logoHeight.toString());

      const response = await fetchWithCSRF('/api/admin/receipt-templates/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        await loadBusinessProfile(); // Refresh business profile data
        setMessage({ type: 'success', text: data.message });
        toast.success('Logo uploaded successfully!');
      } else {
        throw new Error(data.message || 'Failed to upload logo');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Upload failed',
      });
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the logo?')) {
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const response = await fetchWithCSRF('/api/admin/receipt-templates/logo', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        await loadBusinessProfile(); // Refresh business profile data
        setMessage({ type: 'success', text: data.message });
        toast.success('Logo removed successfully!');
      } else {
        throw new Error(data.message || 'Failed to remove logo');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Removal failed',
      });
      toast.error('Failed to remove logo');
    } finally {
      setIsUploading(false);
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
          const statusInfo =
            templateDisplayService.getTemplateStatusInfo(template);
          const IconComponent =
            IconMap[template.displayConfig.icon as keyof typeof IconMap] ||
            FileText;

          return (
            <Card
              key={template.id}
              className={cn(
                'relative transition-all duration-200 hover:shadow-md',
                template.isDefault && 'ring-2 ring-blue-500 bg-blue-50/30'
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Icon with subtle background - matching business profile style */}
                    <div
                      className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center',
                        template.displayConfig.gradient,
                        template.isDefault ? 'bg-blue-100' : ''
                      )}
                    >
                      <IconComponent
                        className={cn(
                          'h-5 w-5',
                          template.isDefault ? 'text-blue-600' : 'text-gray-600'
                        )}
                      />
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
                    <h4 className="text-sm font-medium text-gray-900">
                      Features
                    </h4>
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
                      Updated{' '}
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

      {/* Logo Upload Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            Receipt Logo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload your business logo to appear on all receipts and invoices
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Messages */}
          {message && (
            <Alert
              className={`${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }
              >
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Preview */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Current Logo</Label>

              {businessProfile?.logoUrl ? (
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-center mb-4">
                    <img
                      src={businessProfile.logoUrl}
                      alt="Business Logo"
                      width={businessProfile.logoWidth || 120}
                      height={businessProfile.logoHeight || 40}
                      className="max-w-full h-auto"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Size: {businessProfile.logoWidth || 120}×
                    {businessProfile.logoHeight || 40}px
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No logo uploaded</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload a logo to display on your receipts
                  </p>
                </div>
              )}

              {businessProfile?.logoUrl && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={isUploading}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Logo
                </Button>
              )}
            </div>

            {/* Upload Controls */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Upload New Logo</Label>

              {/* Logo Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logoWidth">Width (px)</Label>
                  <Input
                    id="logoWidth"
                    type="number"
                    value={logoWidth}
                    onChange={e =>
                      setLogoWidth(parseInt(e.target.value) || 120)
                    }
                    min="20"
                    max="400"
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <Label htmlFor="logoHeight">Height (px)</Label>
                  <Input
                    id="logoHeight"
                    type="number"
                    value={logoHeight}
                    onChange={e =>
                      setLogoHeight(parseInt(e.target.value) || 40)
                    }
                    min="20"
                    max="200"
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <Label>Select Logo File</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PNG, JPEG, SVG, WebP (Max 5MB)
                </p>
              </div>

              {/* Upload Guidelines */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 text-sm mb-2">
                  Logo Guidelines:
                </h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Use high-quality PNG or SVG files for best results</li>
                  <li>• Recommended size: 120×40px to 200×80px</li>
                  <li>• Ensure good contrast for receipt printing</li>
                  <li>• Simple designs work best on receipts</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Card - matching business profile warning style */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="h-5 w-5 text-blue-600 mt-0.5">💡</div>
          <div>
            <h4 className="text-sm font-medium text-blue-800">
              How Template Selection Works
            </h4>
            <div className="text-sm text-blue-700 mt-1 space-y-1">
              <p>
                • Click "Preview" to see how each template looks with sample
                data
              </p>
              <p>
                • Select "Use as Default" to make it your active receipt
                template
              </p>
              <p>
                • All future customer receipts and invoices will use your
                selected design
              </p>
            </div>
          </div>
        </div>
      </div>

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
              {previewTemplate && (
                <Badge
                  className={cn(
                    'text-xs',
                    previewTemplate.isDefault
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
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

      {/* Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Uploading logo...</p>
          </div>
        </div>
      )}
    </div>
  );
}
