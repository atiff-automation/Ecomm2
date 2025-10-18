'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Download,
  Printer,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  ReceiptTemplate,
  ReceiptTemplateType,
  TEMPLATE_TYPE_LABELS,
} from '@/types/receipt-templates';
import { cn } from '@/lib/utils';

interface TemplatePreviewProps {
  template: ReceiptTemplate;
  onClose?: () => void;
  className?: string;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

interface ViewportConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  width: string;
  maxWidth: string;
}

const VIEWPORT_CONFIGS: Record<ViewportSize, ViewportConfig> = {
  desktop: {
    name: 'Desktop',
    icon: Monitor,
    width: '100%',
    maxWidth: '1024px',
  },
  tablet: {
    name: 'Tablet',
    icon: Tablet,
    width: '768px',
    maxWidth: '768px',
  },
  mobile: {
    name: 'Mobile',
    icon: Smartphone,
    width: '375px',
    maxWidth: '375px',
  },
};

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onClose,
  className,
}) => {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [sampleData, setSampleData] = useState<'default' | 'custom'>('default');

  useEffect(() => {
    loadPreview();
  }, [template.id, sampleData]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/receipt-templates/${template.id}/preview?sampleData=${sampleData}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate preview');
      }

      const htmlContent = await response.text();
      setPreviewHtml(htmlContent);
    } catch (error: any) {
      console.error('Preview generation error:', error);
      setError(error.message || 'Failed to generate preview');
      toast.error('Failed to generate template preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!previewHtml) return;

    try {
      const blob = new Blob([previewHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_preview.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      toast.success('Preview downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download preview');
    }
  };

  const handlePrint = () => {
    if (!previewHtml) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(previewHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const getTemplateTypeColor = (templateType: ReceiptTemplateType): string => {
    const colors = {
      THERMAL_RECEIPT: 'bg-blue-100 text-blue-800',
      BUSINESS_INVOICE: 'bg-purple-100 text-purple-800',
      MINIMAL_RECEIPT: 'bg-green-100 text-green-800',
      DETAILED_INVOICE: 'bg-orange-100 text-orange-800',
    };
    return colors[templateType] || 'bg-gray-100 text-gray-800';
  };

  const currentViewport = VIEWPORT_CONFIGS[viewport];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Preview Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Template Preview
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getTemplateTypeColor(template.templateType)}>
                  {TEMPLATE_TYPE_LABELS[template.templateType]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {template.name}
                </span>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            {/* Viewport Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Viewport:</span>
              {Object.entries(VIEWPORT_CONFIGS).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={key}
                    variant={viewport === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewport(key as ViewportSize)}
                    className="flex items-center gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{config.name}</span>
                  </Button>
                );
              })}
            </div>

            {/* Sample Data Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sample Data:</span>
              <Select
                value={sampleData}
                onValueChange={(value: 'default' | 'custom') =>
                  setSampleData(value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadPreview}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <RefreshCw
                  className={cn('h-3 w-3', loading && 'animate-spin')}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={loading || !previewHtml}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={loading || !previewHtml}
                className="flex items-center gap-1"
              >
                <Printer className="h-3 w-3" />
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Content */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating preview...
                </div>
              </div>
            )}

            {error && (
              <div className="p-8 text-center">
                <div className="text-red-600 mb-2">⚠️ Preview Error</div>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button variant="outline" onClick={loadPreview}>
                  Try Again
                </Button>
              </div>
            )}

            {!loading && !error && previewHtml && (
              <div className="p-6">
                <div
                  className={cn(
                    'mx-auto border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white',
                    'transition-all duration-300 ease-in-out'
                  )}
                  style={{
                    width: currentViewport.width,
                    maxWidth: currentViewport.maxWidth,
                  }}
                >
                  <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {template.name} Preview
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {currentViewport.name} View
                    </div>
                  </div>

                  <div className="relative">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full border-0"
                      style={{
                        height: viewport === 'mobile' ? '600px' : '800px',
                        minHeight: '400px',
                      }}
                      title={`${template.name} Preview`}
                      sandbox="allow-same-origin"
                    />

                    {/* Overlay for different viewport sizes */}
                    {viewport !== 'desktop' && (
                      <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-gray-300 rounded"></div>
                    )}
                  </div>
                </div>

                {/* Preview Info */}
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <p>
                    Preview shows how the template will appear when generated
                    for customers.
                    {viewport !== 'desktop' &&
                      ' Responsive layout adjustments are applied automatically.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template Details */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Template Name
              </label>
              <p className="text-sm">{template.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Template Type
              </label>
              <p className="text-sm">
                {TEMPLATE_TYPE_LABELS[template.templateType]}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Status
              </label>
              <div className="flex items-center gap-2">
                {template.isDefault && (
                  <Badge className="text-xs">Default</Badge>
                )}
                <Badge
                  variant={template.isActive ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {template.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Last Updated
              </label>
              <p className="text-sm">
                {new Date(template.updatedAt).toLocaleDateString('en-MY', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          {template.description && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Description
              </label>
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
