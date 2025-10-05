'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DragDropZone, FileType } from '@/components/ui/drag-drop-zone';
import { cn } from '@/lib/utils';
import {
  Camera,
  Globe,
  Upload,
  Image as ImageIcon,
  Video,
  Star,
  Trash2,
  Loader2,
  Save,
  RotateCcw,
  Palette,
  Settings,
  FileText
} from 'lucide-react';
import Image from 'next/image';
import { HeroSliderSection } from '@/components/admin/HeroSliderSection';

// ==================== INTERFACES ====================

interface HeroSlide {
  id: string;
  imageUrl: string;
  altText?: string;
  order: number;
  isActive: boolean;
}

interface SliderConfig {
  enabled: boolean;
  autoAdvance: boolean;
  interval: number;
  showDots: boolean;
  showArrows: boolean;
  pauseOnHover: boolean;
  slides: HeroSlide[];
}

interface SiteCustomizationConfig {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    ctaPrimary: {
      text: string;
      link: string;
    };
    ctaSecondary: {
      text: string;
      link: string;
    };
    background: {
      type: 'IMAGE' | 'VIDEO';
      url?: string;
      overlayOpacity: number;
    };
    layout: {
      textAlignment: 'left' | 'center' | 'right';
      showTitle: boolean;
      showCTA: boolean;
    };
    slider: SliderConfig;
  };
  branding: {
    logo?: {
      url: string;
      width: number;
      height: number;
    };
    favicon?: {
      url: string;
    };
    colors?: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
  };
  metadata: {
    lastUpdated: Date;
    updatedBy: string;
    version: number;
  };
}

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export default function SiteCustomizationSettings() {
  // ==================== STATE MANAGEMENT ====================
  const [config, setConfig] = useState<SiteCustomizationConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<SiteCustomizationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // ==================== LIFECYCLE ====================

  useEffect(() => {
    fetchConfiguration();
  }, []);

  useEffect(() => {
    // Check if configuration has changed
    if (config && originalConfig) {
      const hasChanged = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setIsDirty(hasChanged);
    }
  }, [config, originalConfig]);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty && config) {
      const autoSaveTimer = setTimeout(() => {
        handleAutoSave();
      }, 30000); // Auto-save after 30 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [config, isDirty]);

  // ==================== API CALLS ====================

  const fetchConfiguration = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/site-customization');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
        setOriginalConfig(JSON.parse(JSON.stringify(data.config))); // Deep copy
        toast.success('Configuration loaded successfully');
      } else {
        throw new Error(data.error || 'Failed to load configuration');
      }

    } catch (error) {
      console.error('Error fetching configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async (showMessage = true) => {
    if (!config) return;

    try {
      setIsSaving(true);
      setValidationErrors([]);

      const response = await fetch('/api/admin/site-customization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
        setOriginalConfig(JSON.parse(JSON.stringify(data.config)));
        setIsDirty(false);
        if (showMessage) {
          toast.success('Configuration saved successfully!');
        }
      } else {
        if (data.validation?.errors) {
          setValidationErrors(data.validation.errors);
        }
        throw new Error(data.error || 'Failed to save configuration');
      }

    } catch (error) {
      console.error('Error saving configuration:', error);
      if (showMessage) {
        toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSave = useCallback(async () => {
    if (isDirty && config) {
      console.log('🔄 Auto-saving configuration...');
      await saveConfiguration(false);
    }
  }, [config, isDirty]);

  const resetConfiguration = async () => {
    if (!confirm('Are you sure you want to reset to default configuration? All changes will be lost.')) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/site-customization?action=reset', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
        setOriginalConfig(JSON.parse(JSON.stringify(data.config)));
        setIsDirty(false);
        toast.success('Configuration reset to defaults successfully!');
      } else {
        throw new Error(data.error || 'Failed to reset configuration');
      }

    } catch (error) {
      console.error('Error resetting configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // ==================== FILE DELETION ====================

  const handleFileRemove = async (
    type: 'hero_background' | 'logo' | 'favicon',
    section: 'hero' | 'branding'
  ) => {
    if (!config) return;

    try {
      // Get current file URL to extract filename
      let currentUrl: string | undefined;

      if (section === 'hero' && type === 'hero_background') {
        currentUrl = config.hero.background.url;
      } else if (section === 'branding') {
        if (type === 'logo') {
          currentUrl = config.branding.logo?.url;
        } else if (type === 'favicon') {
          currentUrl = config.branding.favicon?.url;
        }
      }

      // Extract filename from URL
      if (currentUrl) {
        const filename = currentUrl.split('/').pop();

        if (filename) {
          console.log('🗑️ Deleting file from volume:', filename);

          // Delete from volume
          await fetch(`/api/admin/site-customization?filename=${filename}`, {
            method: 'DELETE',
          });

          console.log('✅ File deleted from volume');
        }
      }

      // Update config to remove URL
      if (section === 'hero' && type === 'hero_background') {
        updateConfig('hero.background.url', undefined);
      } else if (section === 'branding' && type === 'logo') {
        updateConfig('branding.logo', undefined);
      } else if (section === 'branding' && type === 'favicon') {
        updateConfig('branding.favicon', undefined);
      }

      toast.success('File removed successfully');

    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file from volume');
    }
  };

  // ==================== FILE UPLOAD ====================

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'hero_background' | 'logo' | 'favicon',
    section: 'hero' | 'branding'
  ) => {
    const file = event.target.files?.[0];
    if (!file || !config) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Delete old file from volume before uploading new one
      let oldFilename: string | undefined;

      if (section === 'hero' && type === 'hero_background') {
        oldFilename = config.hero.background.url?.split('/').pop();
      } else if (section === 'branding') {
        if (type === 'logo') {
          oldFilename = config.branding.logo?.url?.split('/').pop();
        } else if (type === 'favicon') {
          oldFilename = config.branding.favicon?.url?.split('/').pop();
        }
      }

      if (oldFilename) {
        console.log('🗑️ Deleting old file before upload:', oldFilename);
        try {
          await fetch(`/api/admin/site-customization?filename=${oldFilename}`, {
            method: 'DELETE',
          });
          console.log('✅ Old file deleted from volume');
        } catch (error) {
          console.warn('⚠️ Failed to delete old file (may not exist):', error);
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('section', section);
      
      if (type === 'logo' && config.branding.logo) {
        formData.append('width', config.branding.logo.width.toString());
        formData.append('height', config.branding.logo.height.toString());
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/admin/site-customization?action=upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
        toast.success(data.message);
      } else {
        throw new Error(data.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // File input reset is handled by DragDropZone component
    }
  };

  // ==================== CONFIGURATION UPDATES ====================

  const updateConfig = (path: string, value: any) => {
    if (!config) return;

    const updatedConfig = { ...config };
    const keys = path.split('.');
    let current = updatedConfig as any;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setConfig(updatedConfig);
  };

  // ==================== SLIDER HANDLER ====================

  const handleSliderChange = useCallback((updates: Partial<SliderConfig>) => {
    if (!config) return;

    const updatedConfig = {
      ...config,
      hero: {
        ...config.hero,
        slider: {
          ...config.hero.slider,
          ...updates
        }
      }
    };

    setConfig(updatedConfig);
  }, [config]);

  // ==================== RENDER HELPERS ====================

  const renderHeroSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          Hero Section
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Fields with Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Content</h4>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-title"
                checked={config?.hero.layout.showTitle || false}
                onCheckedChange={(checked) => updateConfig('hero.layout.showTitle', checked)}
              />
              <Label htmlFor="show-title" className="text-xs">Show Title Section</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="hero-title" className={cn("text-xs", !config?.hero.layout.showTitle && "text-gray-400")}>
                Title
              </Label>
              <Input
                id="hero-title"
                value={config?.hero.title || ''}
                onChange={(e) => updateConfig('hero.title', e.target.value)}
                placeholder="Enter hero title"
                maxLength={100}
                disabled={!config?.hero.layout.showTitle}
                className={cn(!config?.hero.layout.showTitle && "opacity-60")}
              />
              <p className="text-xs text-gray-400 mt-0.5">
                {config?.hero.title?.length || 0}/100
              </p>
            </div>
            <div>
              <Label htmlFor="hero-subtitle" className={cn("text-xs", !config?.hero.layout.showTitle && "text-gray-400")}>
                Subtitle
              </Label>
              <Input
                id="hero-subtitle"
                value={config?.hero.subtitle || ''}
                onChange={(e) => updateConfig('hero.subtitle', e.target.value)}
                placeholder="Enter hero subtitle"
                maxLength={150}
                disabled={!config?.hero.layout.showTitle}
                className={cn(!config?.hero.layout.showTitle && "opacity-60")}
              />
              <p className="text-xs text-gray-400 mt-0.5">
                {config?.hero.subtitle?.length || 0}/150
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="hero-description" className={cn("text-xs", !config?.hero.layout.showTitle && "text-gray-400")}>
              Description
            </Label>
            <Textarea
              id="hero-description"
              value={config?.hero.description || ''}
              onChange={(e) => updateConfig('hero.description', e.target.value)}
              placeholder="Enter hero description"
              rows={3}
              maxLength={500}
              disabled={!config?.hero.layout.showTitle}
              className={cn(!config?.hero.layout.showTitle && "opacity-60")}
            />
            <p className="text-xs text-gray-400 mt-0.5">
              {config?.hero.description?.length || 0}/500
            </p>
          </div>
        </div>

        <Separator />

        {/* CTA Buttons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Call-to-Action Buttons</h4>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-cta"
                checked={config?.hero.layout.showCTA || false}
                onCheckedChange={(checked) => updateConfig('hero.layout.showCTA', checked)}
              />
              <Label htmlFor="show-cta" className="text-xs">Show CTA Buttons</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={cn("border rounded-lg p-3 bg-gray-50", !config?.hero.layout.showCTA && "opacity-60")}>
              <div className="space-y-2">
                <h5 className={cn("text-xs font-medium text-gray-700", !config?.hero.layout.showCTA && "text-gray-400")}>
                  Primary CTA
                </h5>
                <div>
                  <Label htmlFor="cta-primary-text" className={cn("text-xs", !config?.hero.layout.showCTA && "text-gray-400")}>
                    Button Text
                  </Label>
                  <Input
                    id="cta-primary-text"
                    value={config?.hero.ctaPrimary.text || ''}
                    onChange={(e) => updateConfig('hero.ctaPrimary.text', e.target.value)}
                    placeholder="e.g., Join as Member"
                    maxLength={30}
                    className="h-8 text-xs"
                    disabled={!config?.hero.layout.showCTA}
                  />
                </div>
                <div>
                  <Label htmlFor="cta-primary-link" className={cn("text-xs", !config?.hero.layout.showCTA && "text-gray-400")}>
                    Button Link
                  </Label>
                  <Input
                    id="cta-primary-link"
                    value={config?.hero.ctaPrimary.link || ''}
                    onChange={(e) => updateConfig('hero.ctaPrimary.link', e.target.value)}
                    placeholder="e.g., /auth/signup"
                    className="h-8 text-xs"
                    disabled={!config?.hero.layout.showCTA}
                  />
                </div>
              </div>
            </div>

            <div className={cn("border rounded-lg p-3 bg-gray-50", !config?.hero.layout.showCTA && "opacity-60")}>
              <div className="space-y-2">
                <h5 className={cn("text-xs font-medium text-gray-700", !config?.hero.layout.showCTA && "text-gray-400")}>
                  Secondary CTA
                </h5>
                <div>
                  <Label htmlFor="cta-secondary-text" className={cn("text-xs", !config?.hero.layout.showCTA && "text-gray-400")}>
                    Button Text
                  </Label>
                  <Input
                    id="cta-secondary-text"
                    value={config?.hero.ctaSecondary.text || ''}
                    onChange={(e) => updateConfig('hero.ctaSecondary.text', e.target.value)}
                    placeholder="e.g., Browse Products"
                    maxLength={30}
                    className="h-8 text-xs"
                    disabled={!config?.hero.layout.showCTA}
                  />
                </div>
                <div>
                  <Label htmlFor="cta-secondary-link" className={cn("text-xs", !config?.hero.layout.showCTA && "text-gray-400")}>
                    Button Link
                  </Label>
                  <Input
                    id="cta-secondary-link"
                    value={config?.hero.ctaSecondary.link || ''}
                    onChange={(e) => updateConfig('hero.ctaSecondary.link', e.target.value)}
                    placeholder="e.g., /products"
                    className="h-8 text-xs"
                    disabled={!config?.hero.layout.showCTA}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Background Media */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Background Media</h4>
          <DragDropZone
            type="hero_background"
            currentFile={config?.hero.background.url ? {
              url: config.hero.background.url
            } : null}
            onUpload={(e) => handleFileUpload(e, 'hero_background', 'hero')}
            onRemove={() => handleFileRemove('hero_background', 'hero')}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            disabled={isUploading}
          />

          <div>
            <Label htmlFor="overlay-opacity" className="text-xs">Overlay Opacity: {config?.hero.background.overlayOpacity || 0}</Label>
            <input
              id="overlay-opacity"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config?.hero.background.overlayOpacity || 0}
              onChange={(e) => updateConfig('hero.background.overlayOpacity', parseFloat(e.target.value))}
              className="w-full mt-1"
            />
          </div>
        </div>

        <Separator />

        {/* Layout Settings */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Layout Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="text-alignment" className="text-xs">Text Alignment</Label>
              <Select
                value={config?.hero.layout.textAlignment || 'left'}
                onValueChange={(value) => updateConfig('hero.layout.textAlignment', value)}
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
        </div>
      </CardContent>
    </Card>
  );

  const renderBrandingSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-600" />
          Branding & Assets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo & Favicon - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logo Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Business Logo</h4>
            <DragDropZone
              type="logo"
              currentFile={config?.branding.logo ? {
                url: config.branding.logo.url,
                width: config.branding.logo.width,
                height: config.branding.logo.height
              } : null}
              onUpload={(e) => handleFileUpload(e, 'logo', 'branding')}
              onRemove={() => handleFileRemove('logo', 'branding')}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              disabled={isUploading}
            />

            {/* Logo dimensions */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="logo-width" className="text-xs">Width</Label>
                <Input
                  id="logo-width"
                  type="number"
                  value={config?.branding.logo?.width || 120}
                  onChange={(e) => updateConfig('branding.logo.width', parseInt(e.target.value) || 120)}
                  min="20"
                  max="400"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="logo-height" className="text-xs">Height</Label>
                <Input
                  id="logo-height"
                  type="number"
                  value={config?.branding.logo?.height || 40}
                  onChange={(e) => updateConfig('branding.logo.height', parseInt(e.target.value) || 40)}
                  min="20"
                  max="200"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Favicon Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Favicon</h4>
            <DragDropZone
              type="favicon"
              currentFile={config?.branding.favicon ? {
                url: config.branding.favicon.url
              } : null}
              onUpload={(e) => handleFileUpload(e, 'favicon', 'branding')}
              onRemove={() => handleFileRemove('favicon', 'branding')}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              disabled={isUploading}
            />
          </div>
        </div>

        <Separator />

        {/* Brand Colors */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Brand Colors
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'primary', label: 'Primary', default: '#3B82F6' },
              { key: 'secondary', label: 'Secondary', default: '#FDE047' },
              { key: 'background', label: 'Background', default: '#F8FAFC' },
              { key: 'text', label: 'Text', default: '#1E293B' }
            ].map(({ key, label, default: defaultColor }) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`color-${key}`} className="text-xs">{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    id={`color-${key}`}
                    type="color"
                    value={config?.branding.colors?.[key as keyof typeof config.branding.colors] || defaultColor}
                    onChange={(e) => updateConfig(`branding.colors.${key}`, e.target.value)}
                    className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
                  />
                  <Input
                    value={config?.branding.colors?.[key as keyof typeof config.branding.colors] || defaultColor}
                    onChange={(e) => updateConfig(`branding.colors.${key}`, e.target.value)}
                    className="font-mono text-xs h-8"
                    placeholder={defaultColor}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ==================== MAIN RENDER ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading site customization...</p>
        </div>
      </div>
    );
  }

  const renderSaveStatus = () => {
    if (isSaving) {
      return (
        <Badge variant="default" className="mr-2 bg-blue-100 text-blue-700 border-blue-200">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Saving...
        </Badge>
      );
    }
    if (isDirty) {
      return (
        <Badge variant="secondary" className="mr-2 bg-orange-100 text-orange-700 border-orange-200">
          <FileText className="w-3 h-3 mr-1" />
          Unsaved Changes
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="mr-2 bg-green-100 text-green-700 border-green-200">
        <Save className="w-3 h-3 mr-1" />
        All Changes Saved
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {renderSaveStatus()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={resetConfiguration}
            disabled={isSaving}
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('/', '_blank')}
            size="sm"
          >
            <Globe className="w-4 h-4 mr-2" />
            Visit Site
          </Button>
          <Button
            onClick={() => saveConfiguration()}
            disabled={isSaving}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="border-red-200 bg-red-50 border rounded-lg p-4">
          <div className="flex items-start gap-2">
            <div className="text-red-600">⚠️</div>
            <div className="text-red-800">
              <div className="font-medium mb-2">Configuration validation failed:</div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    <strong>{error.field}:</strong> {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Uploading file...</span>
            <span className="text-sm text-gray-600">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Main Configuration Layout */}
      <div className="space-y-6">
        {renderHeroSection()}
        {config?.hero.slider && (
          <HeroSliderSection
            sliderConfig={config.hero.slider}
            onChange={handleSliderChange}
            isLoading={isLoading || isSaving}
          />
        )}
        {renderBrandingSection()}
      </div>

      {/* Guidelines Card - Minimalist */}
      <Card className="border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4 text-gray-500" />
            Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <h4 className="font-medium text-gray-700 mb-1 text-xs">Hero Section:</h4>
            <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
              <li>Keep titles under 100 characters</li>
              <li>Use high-quality images (min 1920×1080px)</li>
              <li>Test overlay opacity for text visibility</li>
              <li>Use clear, action-oriented CTA text</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1 text-xs">Branding:</h4>
            <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
              <li>Logo: PNG/SVG recommended (120×40px)</li>
              <li>Favicon: 32×32px PNG/ICO works best</li>
              <li>Ensure sufficient color contrast</li>
              <li>Test across different device sizes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}