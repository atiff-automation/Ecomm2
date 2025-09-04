'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Settings,
  Star,
  Filter,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Package,
  ShoppingCart,
  Building,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { toast } from 'sonner';

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

interface TemplateResponse {
  templates: ConfigurationTemplate[];
  categories: string[];
  availableTags: string[];
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<ConfigurationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredTemplates, setFilteredTemplates] = useState<ConfigurationTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [templates, selectedCategory, selectedTag, searchTerm]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/telegram/templates');
      if (response.ok) {
        const data: TemplateResponse = await response.json();
        setTemplates(data.templates);
        setCategories(data.categories);
        setAvailableTags(data.availableTags);
      } else {
        toast.error('Failed to load templates');
      }
    } catch (error) {
      toast.error('Error loading templates');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...templates];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (selectedTag !== 'all') {
      filtered = filtered.filter(t => t.tags.includes(selectedTag));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    setFilteredTemplates(filtered);
  };

  const applyTemplate = async (template: ConfigurationTemplate) => {
    setApplying(template.id);
    try {
      const configData = {
        botUsername: '', // Will be preserved from existing config
        botName: '',
        botToken: '', // Will be preserved from existing config
        ordersChannelId: template.configuration.ordersEnabled ? '-1001234567890' : '',
        ordersChannelName: template.configuration.ordersChannelName || 'Orders',
        inventoryChannelId: template.configuration.inventoryEnabled ? '-1001234567891' : '',
        inventoryChannelName: template.configuration.inventoryChannelName || 'Inventory',
        ordersEnabled: template.configuration.ordersEnabled,
        inventoryEnabled: template.configuration.inventoryEnabled,
      };

      // Create a minimal import payload for this template
      const importPayload = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        includesSecrets: false,
        configuration: configData,
        metadata: {
          source: 'template',
          templateId: template.id,
          templateName: template.name
        }
      };

      const response = await fetch('/api/admin/telegram/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importPayload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`Template "${template.name}" applied successfully!`);
        // Optionally trigger a page refresh or callback
      } else {
        toast.error(result.error || 'Failed to apply template');
      }
    } catch (error) {
      toast.error('Error applying template');
    } finally {
      setApplying(null);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/telegram/templates?id=${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Template deleted successfully');
        loadTemplates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete template');
      }
    } catch (error) {
      toast.error('Error deleting template');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basic': return <FileText className="w-4 h-4" />;
      case 'advanced': return <Settings className="w-4 h-4" />;
      case 'enterprise': return <Building className="w-4 h-4" />;
      case 'custom': return <Sparkles className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'advanced': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'enterprise': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'custom': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tag</Label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger>
                  <SelectValue placeholder="All tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                </div>
                {template.isBuiltIn && (
                  <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Badge className={getCategoryColor(template.category)}>
                  {getCategoryIcon(template.category)}
                  <span className="ml-1">{template.category}</span>
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Configuration Preview */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Features Included:</Label>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm">
                    <ShoppingCart className="w-4 h-4" />
                    <span className={template.configuration.ordersEnabled ? 'text-green-600' : 'text-gray-400'}>
                      Order Notifications
                    </span>
                    {template.configuration.ordersEnabled ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <span className="text-gray-400">✕</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Package className="w-4 h-4" />
                    <span className={template.configuration.inventoryEnabled ? 'text-green-600' : 'text-gray-400'}>
                      Inventory Alerts
                    </span>
                    {template.configuration.inventoryEnabled ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <span className="text-gray-400">✕</span>
                    )}
                  </div>
                  {template.configuration.additionalSettings?.silentMode && (
                    <div className="flex items-center space-x-2 text-sm">
                      <VolumeX className="w-4 h-4" />
                      <span className="text-blue-600">Silent Mode</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                  )}
                  {template.configuration.additionalSettings?.dailySummary && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Volume2 className="w-4 h-4" />
                      <span className="text-purple-600">Daily Summary</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {template.tags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags:</Label>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => applyTemplate(template)}
                  disabled={applying === template.id}
                  className="flex-1"
                  size="sm"
                >
                  {applying === template.id ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Apply
                    </>
                  )}
                </Button>

                {!template.isBuiltIn && (
                  <Button
                    onClick={() => deleteTemplate(template.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No templates found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or create a custom template.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage Note */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Template Usage:</strong> Templates provide pre-configured settings for different business needs. 
          Applying a template will update your notification configuration but preserve your bot token and existing channel IDs.
          You may need to update channel IDs after applying a template.
        </AlertDescription>
      </Alert>
    </div>
  );
}