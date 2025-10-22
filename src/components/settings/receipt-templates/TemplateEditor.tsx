'use client';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Save,
  Palette,
  Type,
  Layout,
  Eye,
  RefreshCw,
  X,
  Undo,
} from 'lucide-react';
import {
  ReceiptTemplate,
  ReceiptTemplateContent,
  TemplateColorConfig,
  TemplateTypographyConfig,
  TemplateSectionConfig,
} from '@/types/receipt-templates';
import { TemplatePreview } from './TemplatePreview';
import { cn } from '@/lib/utils';

interface TemplateEditorProps {
  template: ReceiptTemplate;
  onSave?: (updatedTemplate: ReceiptTemplate) => void;
  onClose?: () => void;
  className?: string;
}

const FONT_OPTIONS = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
];

const COLOR_PRESETS = [
  {
    name: 'Default Blue',
    primary: '#3B82F6',
    secondary: '#F8FAFC',
    accent: '#FDE047',
  },
  {
    name: 'Professional Black',
    primary: '#000000',
    secondary: '#F5F5F5',
    accent: '#666666',
  },
  {
    name: 'Corporate Green',
    primary: '#059669',
    secondary: '#ECFDF5',
    accent: '#F59E0B',
  },
  {
    name: 'Modern Purple',
    primary: '#7C3AED',
    secondary: '#F3E8FF',
    accent: '#EC4899',
  },
  {
    name: 'Classic Red',
    primary: '#DC2626',
    secondary: '#FEF2F2',
    accent: '#F59E0B',
  },
];

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onClose,
  className,
}) => {
  const [editedTemplate, setEditedTemplate] =
    useState<ReceiptTemplate>(template);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    setEditedTemplate(template);
    setHasChanges(false);
  }, [template]);

  const updateTemplateContent = (updates: Partial<ReceiptTemplateContent>) => {
    setEditedTemplate(prev => ({
      ...prev,
      templateContent: {
        ...prev.templateContent,
        ...updates,
      },
    }));
    setHasChanges(true);
  };

  const updateColors = (colors: Partial<TemplateColorConfig>) => {
    updateTemplateContent({
      colors: {
        ...editedTemplate.templateContent.colors,
        ...colors,
      },
    });
  };

  const updateTypography = (typography: Partial<TemplateTypographyConfig>) => {
    updateTemplateContent({
      typography: {
        ...editedTemplate.templateContent.typography,
        ...typography,
      },
    });
  };

  const updateSections = (sections: Partial<TemplateSectionConfig>) => {
    updateTemplateContent({
      sections: {
        ...editedTemplate.templateContent.sections,
        ...sections,
      },
    });
  };

  const applyColorPreset = (preset: (typeof COLOR_PRESETS)[0]) => {
    updateColors({
      primary: preset.primary,
      secondary: preset.secondary,
      accent: preset.accent,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/receipt-templates/${editedTemplate.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editedTemplate.name,
            description: editedTemplate.description,
            templateContent: editedTemplate.templateContent,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      const updated = await response.json();
      toast.success('Template saved successfully');
      setHasChanges(false);
      onSave?.(updated.template);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedTemplate(template);
    setHasChanges(false);
    toast.success('Changes reset');
  };

  if (previewMode) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(false)}
            className="flex items-center gap-2"
          >
            ← Back to Editor
          </Button>
          <h2 className="text-lg font-semibold">Live Preview</h2>
        </div>
        <TemplatePreview
          template={editedTemplate}
          onClose={() => setPreviewMode(false)}
        />
      </div>
    );
  }

  const { templateContent } = editedTemplate;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Template Editor</h2>
          <p className="text-muted-foreground">
            Customize your receipt template
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <Undo className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button variant="outline" onClick={() => setPreviewMode(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Save Banner */}
      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-800">
                <Save className="h-4 w-4" />
                <span className="text-sm font-medium">
                  You have unsaved changes
                </span>
              </div>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={editedTemplate.name}
                onChange={e => {
                  setEditedTemplate(prev => ({
                    ...prev,
                    name: e.target.value,
                  }));
                  setHasChanges(true);
                }}
                placeholder="Enter template name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={editedTemplate.description || ''}
              onChange={e => {
                setEditedTemplate(prev => ({
                  ...prev,
                  description: e.target.value,
                }));
                setHasChanges(true);
              }}
              placeholder="Describe this template"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customization Tabs */}
      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Sections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Presets */}
              <div className="space-y-3">
                <Label>Quick Presets</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {COLOR_PRESETS.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => applyColorPreset(preset)}
                      className="h-auto p-3 justify-start"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: preset.secondary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: preset.accent }}
                          />
                        </div>
                        <span className="text-sm">{preset.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={templateContent.colors.primary}
                        onChange={e =>
                          updateColors({ primary: e.target.value })
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={templateContent.colors.primary}
                        onChange={e =>
                          updateColors({ primary: e.target.value })
                        }
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={templateContent.colors.secondary}
                        onChange={e =>
                          updateColors({ secondary: e.target.value })
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={templateContent.colors.secondary}
                        onChange={e =>
                          updateColors({ secondary: e.target.value })
                        }
                        placeholder="#F8FAFC"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accent-color"
                        type="color"
                        value={templateContent.colors.accent}
                        onChange={e => updateColors({ accent: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={templateContent.colors.accent}
                        onChange={e => updateColors({ accent: e.target.value })}
                        placeholder="#FDE047"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-color">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="text-color"
                        type="color"
                        value={templateContent.colors.text}
                        onChange={e => updateColors({ text: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={templateContent.colors.text}
                        onChange={e => updateColors({ text: e.target.value })}
                        placeholder="#1E293B"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select
                    value={templateContent.typography.fontFamily}
                    onValueChange={value =>
                      updateTypography({ fontFamily: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(font => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>
                            {font.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="font-normal">Normal Size</Label>
                    <Input
                      id="font-normal"
                      type="number"
                      min="8"
                      max="24"
                      value={templateContent.typography.fontSize.normal}
                      onChange={e =>
                        updateTypography({
                          fontSize: {
                            ...templateContent.typography.fontSize,
                            normal: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="font-small">Small Size</Label>
                    <Input
                      id="font-small"
                      type="number"
                      min="6"
                      max="20"
                      value={templateContent.typography.fontSize.small}
                      onChange={e =>
                        updateTypography({
                          fontSize: {
                            ...templateContent.typography.fontSize,
                            small: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="font-large">Large Size</Label>
                    <Input
                      id="font-large"
                      type="number"
                      min="12"
                      max="32"
                      value={templateContent.typography.fontSize.large}
                      onChange={e =>
                        updateTypography({
                          fontSize: {
                            ...templateContent.typography.fontSize,
                            large: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="font-title">Title Size</Label>
                    <Input
                      id="font-title"
                      type="number"
                      min="16"
                      max="48"
                      value={templateContent.typography.fontSize.title}
                      onChange={e =>
                        updateTypography({
                          fontSize: {
                            ...templateContent.typography.fontSize,
                            title: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Header Section */}
              <div className="space-y-4">
                <h4 className="font-medium">Header Section</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="header-enabled"
                      checked={templateContent.sections.header.enabled}
                      onCheckedChange={checked =>
                        updateSections({
                          header: {
                            ...templateContent.sections.header,
                            enabled: checked,
                          },
                        })
                      }
                    />
                    <Label htmlFor="header-enabled">Show header</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="header-logo"
                      checked={templateContent.sections.header.showLogo}
                      onCheckedChange={checked =>
                        updateSections({
                          header: {
                            ...templateContent.sections.header,
                            showLogo: checked,
                          },
                        })
                      }
                      disabled={!templateContent.sections.header.enabled}
                    />
                    <Label htmlFor="header-logo">Show logo</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="header-alignment">Header Alignment</Label>
                  <Select
                    value={templateContent.sections.header.alignment}
                    onValueChange={(value: 'left' | 'center' | 'right') =>
                      updateSections({
                        header: {
                          ...templateContent.sections.header,
                          alignment: value,
                        },
                      })
                    }
                    disabled={!templateContent.sections.header.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Other sections */}
              <div className="space-y-4">
                <h4 className="font-medium">Content Sections</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="customer-enabled"
                      checked={templateContent.sections.customer.enabled}
                      onCheckedChange={checked =>
                        updateSections({
                          customer: {
                            ...templateContent.sections.customer,
                            enabled: checked,
                          },
                        })
                      }
                    />
                    <Label htmlFor="customer-enabled">
                      Customer information
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="items-enabled"
                      checked={templateContent.sections.items.enabled}
                      onCheckedChange={checked =>
                        updateSections({
                          items: {
                            ...templateContent.sections.items,
                            enabled: checked,
                          },
                        })
                      }
                    />
                    <Label htmlFor="items-enabled">Items list</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="totals-enabled"
                      checked={templateContent.sections.totals.enabled}
                      onCheckedChange={checked =>
                        updateSections({
                          totals: {
                            ...templateContent.sections.totals,
                            enabled: checked,
                          },
                        })
                      }
                    />
                    <Label htmlFor="totals-enabled">Totals section</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="footer-enabled"
                      checked={templateContent.sections.footer.enabled}
                      onCheckedChange={checked =>
                        updateSections({
                          footer: {
                            ...templateContent.sections.footer,
                            enabled: checked,
                          },
                        })
                      }
                    />
                    <Label htmlFor="footer-enabled">Footer</Label>
                  </div>
                </div>
              </div>

              {/* Footer Message */}
              <div className="space-y-2">
                <Label htmlFor="footer-message">Footer Message</Label>
                <Textarea
                  id="footer-message"
                  value={templateContent.sections.footer.message}
                  onChange={e =>
                    updateSections({
                      footer: {
                        ...templateContent.sections.footer,
                        message: e.target.value,
                      },
                    })
                  }
                  placeholder="Thank you for your business!"
                  rows={2}
                  disabled={!templateContent.sections.footer.enabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Final Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving Template...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
