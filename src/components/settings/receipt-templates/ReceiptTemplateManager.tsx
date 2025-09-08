'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Star, 
  StarOff, 
  Download,
  Upload,
  Settings,
  RefreshCw,
  Receipt
} from 'lucide-react';
import { 
  ReceiptTemplate, 
  ReceiptTemplateType,
  TEMPLATE_TYPE_LABELS 
} from '@/types/receipt-templates';
import { TemplatePreview } from './TemplatePreview';
import { TemplateSelector } from './TemplateSelector';
import { TemplateGallery } from './TemplateGallery';
import { CompanyInfoEditor } from './CompanyInfoEditor';
import { cn } from '@/lib/utils';

interface ReceiptTemplateManagerProps {
  className?: string;
}

export const ReceiptTemplateManager: React.FC<ReceiptTemplateManagerProps> = ({
  className
}) => {
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'preview' | 'gallery' | 'settings'>('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load templates on mount and when refresh is triggered
  useEffect(() => {
    loadTemplates();
  }, [refreshTrigger]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/receipt-templates');
      if (!response.ok) {
        throw new Error('Failed to load templates');
      }
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load receipt templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/receipt-templates/${templateId}/set-default`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error('Failed to set default template');
      }

      toast.success('Default template updated successfully');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error setting default template:', error);
      toast.error('Failed to set default template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/receipt-templates/${templateId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete template');
      }

      toast.success('Template deleted successfully');
      setRefreshTrigger(prev => prev + 1);
      
      // Clear selected template if it was deleted
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setActiveView('list');
      }
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error(error.message || 'Failed to delete template');
    }
  };

  const handleToggleActive = async (templateId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/receipt-templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) {
        throw new Error('Failed to update template status');
      }

      toast.success(`Template ${isActive ? 'activated' : 'deactivated'} successfully`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating template status:', error);
      toast.error('Failed to update template status');
    }
  };

  const handlePreviewTemplate = (template: ReceiptTemplate) => {
    setSelectedTemplate(template);
    setActiveView('preview');
  };

  const handleInitializeDefaults = async () => {
    try {
      const response = await fetch('/api/admin/receipt-templates/initialize', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to initialize default templates');
      }

      toast.success('Default templates created successfully');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error initializing templates:', error);
      toast.error('Failed to initialize default templates');
    }
  };

  const getStatusBadge = (template: ReceiptTemplate) => {
    if (template.isDefault) {
      return <Badge className="bg-green-100 text-green-800">Default</Badge>;
    }
    if (template.isActive) {
      return <Badge variant="secondary">Active</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  const getTypeColor = (templateType: ReceiptTemplateType): string => {
    const colors = {
      THERMAL_RECEIPT: 'bg-blue-100 text-blue-800',
      BUSINESS_INVOICE: 'bg-purple-100 text-purple-800',
      MINIMAL_RECEIPT: 'bg-green-100 text-green-800',
      DETAILED_INVOICE: 'bg-orange-100 text-orange-800'
    };
    return colors[templateType] || 'bg-gray-100 text-gray-800';
  };

  if (activeView === 'preview' && selectedTemplate) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setActiveView('list')}
            className="flex items-center gap-2"
          >
            ← Back to Templates
          </Button>
          <h2 className="text-lg font-semibold">Preview: {selectedTemplate.name}</h2>
        </div>
        <TemplatePreview 
          template={selectedTemplate}
          onClose={() => setActiveView('list')}
        />
      </div>
    );
  }

  if (activeView === 'gallery') {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setActiveView('list')}
            className="flex items-center gap-2"
          >
            ← Back to Templates
          </Button>
          <h2 className="text-lg font-semibold">Template Gallery</h2>
        </div>
        <TemplateGallery 
          onTemplateInstalled={() => {
            setRefreshTrigger(prev => prev + 1);
            setActiveView('list');
          }}
        />
      </div>
    );
  }

  if (activeView === 'settings') {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setActiveView('list')}
            className="flex items-center gap-2"
          >
            ← Back to Templates
          </Button>
          <h2 className="text-lg font-semibold">Company Information</h2>
        </div>
        <CompanyInfoEditor />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setActiveView('gallery')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Browse Gallery
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveView('settings')}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Company Info
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          
          {templates.length === 0 && !loading && (
            <Button
              variant="outline"
              onClick={handleInitializeDefaults}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Initialize Defaults
            </Button>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Receipt className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first receipt template or initializing with default templates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleInitializeDefaults}>
                Initialize Default Templates
              </Button>
              <Button variant="outline" onClick={() => setActiveView('gallery')}>
                Browse Template Gallery
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="relative group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(template.templateType)}>
                        {TEMPLATE_TYPE_LABELS[template.templateType]}
                      </Badge>
                      {getStatusBadge(template)}
                    </div>
                  </div>
                  
                  {template.isDefault && (
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>Created {new Date(template.createdAt).toLocaleDateString()}</span>
                  <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreviewTemplate(template)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </Button>
                  
                  {!template.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(template.id)}
                      className="flex items-center gap-1"
                      title="Set as default"
                    >
                      <StarOff className="h-3 w-3" />
                      Set Default
                    </Button>
                  )}
                  
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(template.id, !template.isActive)}
                      className="h-8 w-8 p-0"
                      title={template.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {template.isActive ? '⏸️' : '▶️'}
                    </Button>
                    
                    {!template.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Delete template"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};