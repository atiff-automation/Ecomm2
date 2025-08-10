'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import ContextualNavigation from '@/components/admin/ContextualNavigation';
import { HexColorPicker } from 'react-colorful';
import {
  Palette,
  Monitor,
  Save,
  Plus,
  Copy,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  Paintbrush,
  Star,
  Settings,
} from 'lucide-react';

interface SiteTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  creator?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);

  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2 mt-1">
        <div
          className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer flex-shrink-0"
          style={{ backgroundColor: color }}
          onClick={() => setIsOpen(true)}
        />
        <Input
          value={color}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono text-sm"
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pick {label}</DialogTitle>
            <DialogDescription>
              Choose a color for {label.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <HexColorPicker 
              color={tempColor} 
              onChange={setTempColor}
            />
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: tempColor }}
              />
              <Input
                value={tempColor}
                onChange={(e) => setTempColor(e.target.value)}
                className="w-32 font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                onChange(tempColor);
                setIsOpen(false);
              }}
            >
              Apply Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function ThemeCustomization() {
  const [activeTheme, setActiveTheme] = useState<SiteTheme | null>(null);
  const [allThemes, setAllThemes] = useState<SiteTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Form state for creating/editing themes
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<SiteTheme | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#FDE047',
    backgroundColor: '#F8FAFC',
    textColor: '#1E293B',
  });

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/admin/site-customization/theme');
      if (response.ok) {
        const data = await response.json();
        setActiveTheme(data.activeTheme);
        setAllThemes(data.allThemes);
      }
    } catch (error) {
      console.error('Error fetching themes:', error);
      setMessage({ type: 'error', text: 'Failed to load themes' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTheme = async () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Theme name is required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/site-customization/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTheme ? { themeId: editingTheme.id, ...formData } : formData),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchThemes();
        setCreateDialogOpen(false);
        setEditingTheme(null);
        setFormData({
          name: '',
          primaryColor: '#3B82F6',
          secondaryColor: '#FDE047',
          backgroundColor: '#F8FAFC',
          textColor: '#1E293B',
        });
        setMessage({ 
          type: 'success', 
          text: `Theme ${editingTheme ? 'updated' : 'created'} successfully!` 
        });
      } else {
        throw new Error(data.message || `Failed to ${editingTheme ? 'update' : 'create'} theme`);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : `Failed to ${editingTheme ? 'update' : 'create'} theme` 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleActivateTheme = async (themeId: string) => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/site-customization/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId, action: 'activate' }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchThemes();
        setMessage({ type: 'success', text: 'Theme activated successfully!' });
      } else {
        throw new Error(data.message || 'Failed to activate theme');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to activate theme' });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateTheme = async (themeId: string) => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/site-customization/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId, action: 'duplicate' }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchThemes();
        setMessage({ type: 'success', text: 'Theme duplicated successfully!' });
      } else {
        throw new Error(data.message || 'Failed to duplicate theme');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to duplicate theme' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm('Are you sure you want to delete this theme? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/site-customization/theme?id=${themeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        await fetchThemes();
        setMessage({ type: 'success', text: 'Theme deleted successfully!' });
      } else {
        throw new Error(data.message || 'Failed to delete theme');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete theme' });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (theme: SiteTheme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
    });
    setCreateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading themes...</p>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    {
      label: 'Site Customization',
      href: '/admin/site-customization',
      icon: Monitor,
    },
    {
      label: 'Theme Colors',
      href: '/admin/site-customization/theme',
      icon: Palette,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ContextualNavigation items={breadcrumbItems} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Palette className="h-8 w-8 text-purple-600" />
                Theme Customization
              </h1>
              <p className="text-gray-600 mt-1">
                Customize your site's color scheme and visual appearance
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingTheme(null);
                  setFormData({
                    name: '',
                    primaryColor: '#3B82F6',
                    secondaryColor: '#FDE047',
                    backgroundColor: '#F8FAFC',
                    textColor: '#1E293B',
                  });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Theme
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTheme ? 'Edit Theme' : 'Create New Theme'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTheme ? 'Update the theme colors and settings' : 'Create a new color theme for your site'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="themeName">Theme Name</Label>
                      <Input
                        id="themeName"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="My Custom Theme"
                      />
                    </div>

                    <ColorPicker
                      color={formData.primaryColor}
                      onChange={(color) => setFormData({ ...formData, primaryColor: color })}
                      label="Primary Color"
                    />

                    <ColorPicker
                      color={formData.secondaryColor}
                      onChange={(color) => setFormData({ ...formData, secondaryColor: color })}
                      label="Secondary Color"
                    />

                    <ColorPicker
                      color={formData.backgroundColor}
                      onChange={(color) => setFormData({ ...formData, backgroundColor: color })}
                      label="Background Color"
                    />

                    <ColorPicker
                      color={formData.textColor}
                      onChange={(color) => setFormData({ ...formData, textColor: color })}
                      label="Text Color"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Preview</Label>
                    <div 
                      className="border rounded-lg p-6 space-y-4"
                      style={{ backgroundColor: formData.backgroundColor, color: formData.textColor }}
                    >
                      <div 
                        className="h-20 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: formData.primaryColor }}
                      >
                        Primary Color Header
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Sample Content</h3>
                        <p className="text-sm">
                          This is how your text will appear with the selected colors.
                        </p>
                        <button 
                          className="px-4 py-2 rounded text-sm font-medium"
                          style={{ 
                            backgroundColor: formData.secondaryColor, 
                            color: formData.textColor 
                          }}
                        >
                          Secondary Button
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTheme} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingTheme ? 'Update Theme' : 'Create Theme'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Theme */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Active Theme
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTheme ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{activeTheme.name}</h3>
                      <p className="text-sm text-gray-600">
                        Last updated: {new Date(activeTheme.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div 
                          className="w-12 h-12 rounded mx-auto border-2 border-gray-200"
                          style={{ backgroundColor: activeTheme.primaryColor }}
                        />
                        <p className="text-xs mt-1">Primary</p>
                        <p className="text-xs font-mono text-gray-600">{activeTheme.primaryColor}</p>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-12 h-12 rounded mx-auto border-2 border-gray-200"
                          style={{ backgroundColor: activeTheme.secondaryColor }}
                        />
                        <p className="text-xs mt-1">Secondary</p>
                        <p className="text-xs font-mono text-gray-600">{activeTheme.secondaryColor}</p>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-12 h-12 rounded mx-auto border-2 border-gray-200"
                          style={{ backgroundColor: activeTheme.backgroundColor }}
                        />
                        <p className="text-xs mt-1">Background</p>
                        <p className="text-xs font-mono text-gray-600">{activeTheme.backgroundColor}</p>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-12 h-12 rounded mx-auto border-2 border-gray-200"
                          style={{ backgroundColor: activeTheme.textColor }}
                        />
                        <p className="text-xs mt-1">Text</p>
                        <p className="text-xs font-mono text-gray-600">{activeTheme.textColor}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(activeTheme)}
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateTheme(activeTheme.id)}
                        disabled={isSaving}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Palette className="w-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No active theme found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Themes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paintbrush className="w-5 h-5" />
                  All Themes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allThemes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`border rounded-lg p-4 ${theme.isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {theme.name}
                            {theme.isActive && (
                              <Badge className="bg-blue-600">Active</Badge>
                            )}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {new Date(theme.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mb-3">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: theme.primaryColor }}
                          title="Primary Color"
                        />
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: theme.secondaryColor }}
                          title="Secondary Color"
                        />
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: theme.backgroundColor }}
                          title="Background Color"
                        />
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: theme.textColor }}
                          title="Text Color"
                        />
                      </div>

                      <div className="flex gap-1">
                        {!theme.isActive && (
                          <Button
                            size="sm"
                            onClick={() => handleActivateTheme(theme.id)}
                            disabled={isSaving}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Activate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(theme)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicateTheme(theme.id)}
                          disabled={isSaving}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        {!theme.isActive && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTheme(theme.id)}
                            disabled={isSaving}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {allThemes.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">No themes found</p>
                      <p className="text-sm">Create your first theme to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}