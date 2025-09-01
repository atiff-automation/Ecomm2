'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Monitor,
  Upload,
  Image as ImageIcon,
  Video,
  Eye,
  Save,
  RotateCcw,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Camera,
  Play,
  Star,
  Globe,
  Settings,
} from 'lucide-react';
import Image from 'next/image';

interface HeroSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  backgroundType: 'IMAGE' | 'VIDEO';
  backgroundImage?: string;
  backgroundVideo?: string;
  overlayOpacity: number;
  textAlignment: 'left' | 'center' | 'right';
  showTitle?: boolean;
  showCTA?: boolean;
  isActive: boolean;
  creator?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MediaUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  mediaType: 'IMAGE' | 'VIDEO';
  usage?: string;
  uploader?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface SiteTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  faviconUrl?: string;
  isActive: boolean;
  creator?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function HeroSectionManagement() {
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
  const [mediaUploads, setMediaUploads] = useState<MediaUpload[]>([]);
  const [formData, setFormData] = useState<Partial<HeroSection>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTitle, setShowTitle] = useState(true);
  const [showCTA, setShowCTA] = useState(true);
  
  // Branding state  
  const [activeTheme, setActiveTheme] = useState<SiteTheme | null>({
    id: 'default',
    name: 'Default Theme',
    primaryColor: '#3B82F6',
    secondaryColor: '#FDE047', 
    backgroundColor: '#F8FAFC',
    textColor: '#1E293B',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [logoWidth, setLogoWidth] = useState<number>(120);
  const [logoHeight, setLogoHeight] = useState<number>(40);
  const [logoSizePercentage, setLogoSizePercentage] = useState<number>(50); // 50% = standard size
  const [logoScale, setLogoScale] = useState<number>(1); // Scale multiplier for natural sizing

  useEffect(() => {
    fetchHeroSection();
    fetchMediaUploads();
  }, []);

  // Sync slider percentage when logo dimensions change (from API or theme loading)
  useEffect(() => {
    // Calculate scale from stored width (logoWidth represents scale * 120)
    const scale = logoWidth / 120;
    setLogoScale(scale);
    
    // Calculate percentage from scale (0.5x-2.5x maps to 0%-100%)
    const minScale = 0.5;
    const maxScale = 2.5;
    const percentage = ((scale - minScale) / (maxScale - minScale)) * 100;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    
    setLogoSizePercentage(clampedPercentage);
  }, [logoWidth, logoHeight]);

  const fetchHeroSection = async () => {
    try {
      const response = await fetch('/api/admin/site-customization/hero');
      if (response.ok) {
        const data = await response.json();
        setHeroSection(data.heroSection);
        // Initialize toggle states from database
        setShowTitle(data.heroSection.showTitle ?? true);
        setShowCTA(data.heroSection.showCTA ?? true);
        // Only set form data with content fields, not metadata
        setFormData({
          title: data.heroSection.title,
          subtitle: data.heroSection.subtitle,
          description: data.heroSection.description,
          ctaPrimaryText: data.heroSection.ctaPrimaryText,
          ctaPrimaryLink: data.heroSection.ctaPrimaryLink,
          ctaSecondaryText: data.heroSection.ctaSecondaryText,
          ctaSecondaryLink: data.heroSection.ctaSecondaryLink,
          backgroundType: data.heroSection.backgroundType,
          backgroundImage: data.heroSection.backgroundImage,
          backgroundVideo: data.heroSection.backgroundVideo,
          overlayOpacity: data.heroSection.overlayOpacity,
          textAlignment: data.heroSection.textAlignment,
        });
      }
    } catch (error) {
      console.error('Error fetching hero section:', error);
      setMessage({ type: 'error', text: 'Failed to load hero section' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMediaUploads = async () => {
    try {
      const response = await fetch(
        '/api/admin/site-customization/media/upload?usage=hero_background&limit=50'
      );
      if (response.ok) {
        const data = await response.json();
        setMediaUploads(data.mediaUploads);
      }
    } catch (error) {
      console.error('Error fetching media uploads:', error);
    }
  };


  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Save hero section data
      const submitData = {
        title: showTitle ? formData.title || '' : '',
        subtitle: showTitle ? formData.subtitle || '' : '',
        description: showTitle ? formData.description || '' : '',
        ctaPrimaryText: showCTA
          ? formData.ctaPrimaryText || 'Join as Member'
          : 'Hidden',
        ctaPrimaryLink: showCTA
          ? formData.ctaPrimaryLink || '/auth/signup'
          : '#',
        ctaSecondaryText: showCTA
          ? formData.ctaSecondaryText || 'Browse Products'
          : 'Hidden',
        ctaSecondaryLink: showCTA
          ? formData.ctaSecondaryLink || '/products'
          : '#',
        backgroundType: formData.backgroundType || 'IMAGE',
        backgroundImage: formData.backgroundImage || null,
        backgroundVideo: formData.backgroundVideo || null,
        overlayOpacity: formData.overlayOpacity ?? 0.1,
        textAlignment: formData.textAlignment || 'left',
        showTitle,
        showCTA,
      };

      console.log('Submitting hero section data:', submitData);

      const response = await fetch('/api/admin/site-customization/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        setHeroSection(data.heroSection);
        
        // Also save logo size changes if there's a logo
        if (activeTheme?.logoUrl) {
          await handleApplyLogoSize();
        }
        
        setMessage({
          type: 'success',
          text: 'Changes saved successfully!',
        });
      } else {
        throw new Error(data.message || 'Failed to update hero section');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save changes',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/site-customization/hero', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setHeroSection(data.heroSection);
        // Reset toggle states to defaults
        setShowTitle(data.heroSection.showTitle ?? true);
        setShowCTA(data.heroSection.showCTA ?? true);
        // Only set form data with content fields, not metadata
        setFormData({
          title: data.heroSection.title,
          subtitle: data.heroSection.subtitle,
          description: data.heroSection.description,
          ctaPrimaryText: data.heroSection.ctaPrimaryText,
          ctaPrimaryLink: data.heroSection.ctaPrimaryLink,
          ctaSecondaryText: data.heroSection.ctaSecondaryText,
          ctaSecondaryLink: data.heroSection.ctaSecondaryLink,
          backgroundType: data.heroSection.backgroundType,
          backgroundImage: data.heroSection.backgroundImage,
          backgroundVideo: data.heroSection.backgroundVideo,
          overlayOpacity: data.heroSection.overlayOpacity,
          textAlignment: data.heroSection.textAlignment,
        });
        setMessage({ type: 'success', text: 'Hero section reset to default!' });
      } else {
        throw new Error(data.message || 'Failed to reset hero section');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to reset',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'File size too large. Maximum size is 50MB.',
      });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('usage', 'hero_background');

      const response = await fetch(
        '/api/admin/site-customization/media/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        await fetchMediaUploads(); // Refresh media list
        setMessage({
          type: 'success',
          text: `${data.mediaUpload.mediaType.toLowerCase()} uploaded successfully!`,
        });
      } else {
        throw new Error(data.message || 'Failed to upload file');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media file?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/site-customization/media/upload?id=${mediaId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        await fetchMediaUploads(); // Refresh media list
        setMessage({
          type: 'success',
          text: 'Media file deleted successfully!',
        });

        // If the deleted media was being used, clear it from form
        if (
          formData.backgroundImage?.includes(mediaId) ||
          formData.backgroundVideo?.includes(mediaId)
        ) {
          setFormData({
            ...formData,
            backgroundImage:
              formData.backgroundType === 'IMAGE'
                ? undefined
                : formData.backgroundImage,
            backgroundVideo:
              formData.backgroundType === 'VIDEO'
                ? undefined
                : formData.backgroundVideo,
          });
        }
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete media file');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete media',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleBrandingFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'favicon'
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const maxSize = type === 'logo' ? 5 * 1024 * 1024 : 1 * 1024 * 1024; // 5MB for logos, 1MB for favicons
    if (file.size > maxSize) {
      setMessage({
        type: 'error',
        text: `File size too large. Maximum size is ${maxSize / 1024 / 1024}MB for ${type}s.`,
      });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (type === 'logo') {
        formData.append('width', logoWidth.toString());
        formData.append('height', logoHeight.toString());
      }

      const response = await fetch('/api/admin/site-customization/branding', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state with database response
        setMessage({ type: 'success', text: data.message });
        // Update activeTheme state with uploaded file info
        if (data.theme) {
          setActiveTheme(data.theme);
          if (type === 'logo' && data.theme.logoWidth) {
            setLogoWidth(data.theme.logoWidth);
          }
          if (type === 'logo' && data.theme.logoHeight) {
            setLogoHeight(data.theme.logoHeight);
          }
        }
      } else {
        throw new Error(data.message || `Failed to upload ${type}`);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : `Upload failed`,
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRemoveAsset = async (type: 'logo' | 'favicon') => {
    if (!confirm(`Are you sure you want to remove the ${type}?`)) {
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/site-customization/branding?type=${type}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Update local state with database response
        setMessage({ type: 'success', text: data.message });
        // Update activeTheme state to remove logo/favicon
        if (data.theme) {
          setActiveTheme(data.theme);
        }
      } else {
        throw new Error(data.message || `Failed to remove ${type}`);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : `Removal failed`,
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle proportional logo size change
  const handleSizeChange = (percentage: number) => {
    setLogoSizePercentage(percentage);
    
    // Calculate scale based on percentage (0.5x to 2.5x scaling)
    // 0% = 0.5x, 50% = 1.5x, 100% = 2.5x
    const minScale = 0.5;
    const maxScale = 2.5;
    const scale = minScale + ((maxScale - minScale) * percentage / 100);
    
    setLogoScale(scale);
    
    // Update width/height for API purposes (these are for storage, not display)
    const baseWidth = 120; // Base reference width
    const baseHeight = 40;  // Base reference height
    
    setLogoWidth(Math.round(baseWidth * scale));
    setLogoHeight(Math.round(baseHeight * scale));
  };

  const handleApplyLogoSize = async () => {
    if (!activeTheme?.logoUrl) {
      return;
    }

    try {
      const response = await fetch('/api/admin/site-customization/branding', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'logo',
          width: logoWidth,
          height: logoHeight,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setActiveTheme(data);
        
        // Trigger branding refresh globally by dispatching a custom event
        window.dispatchEvent(new CustomEvent('brandingUpdated'));
      } else {
        throw new Error(data.message || 'Failed to update logo size');
      }
    } catch (error) {
      console.error('Failed to update logo size:', error);
      throw error; // Re-throw so handleSave can catch it
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading hero section...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            Site Customization
          </h1>
          <p className="text-gray-600 mt-1">
            Customize your homepage hero section, branding, and site appearance
          </p>
        </div>

        {/* Messages */}
        {message && (
          <Alert
            className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Site Customization</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {previewMode ? 'Edit' : 'Preview'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={isSaving}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset to Default
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewMode ? (
                  /* Preview Mode */
                  <div className="border rounded-lg overflow-hidden">
                    <div
                      className="relative h-96 flex items-center justify-center text-white"
                      style={{
                        backgroundColor: '#3B82F6',
                        backgroundImage: formData.backgroundImage
                          ? `url(${formData.backgroundImage})`
                          : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {formData.backgroundVideo &&
                        formData.backgroundType === 'VIDEO' && (
                          <video
                            className="absolute inset-0 w-full h-full object-cover"
                            src={formData.backgroundVideo}
                            autoPlay
                            muted
                            loop
                          />
                        )}
                      <div
                        className="absolute inset-0 bg-black"
                        style={{ opacity: formData.overlayOpacity || 0.1 }}
                      />
                      <div
                        className={`relative z-10 max-w-2xl mx-auto px-6 text-${formData.textAlignment || 'left'}`}
                      >
                        {showTitle && (
                          <>
                            <h1 className="text-4xl font-bold mb-4">
                              {formData.title || 'Hero Title'}
                            </h1>
                            <h2 className="text-xl text-blue-100 mb-4">
                              {formData.subtitle || 'Hero Subtitle'}
                            </h2>
                            <p className="text-blue-100 mb-6">
                              {formData.description || 'Hero Description'}
                            </p>
                          </>
                        )}
                        {showCTA && (
                          <div className="flex gap-4">
                            <Button className="bg-yellow-500 text-blue-900 hover:bg-yellow-400">
                              {formData.ctaPrimaryText || 'Primary CTA'}
                            </Button>
                            <Button
                              variant="outline"
                              className="text-white border-white hover:bg-white hover:text-blue-800"
                            >
                              {formData.ctaSecondaryText || 'Secondary CTA'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Edit Mode */
                  <Tabs defaultValue="content" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="media">Background Media</TabsTrigger>
                      <TabsTrigger value="layout">Layout & Style</TabsTrigger>
                      <TabsTrigger value="branding">Branding</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4">
                      {/* Toggle Controls */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">
                              Show Title Section
                            </Label>
                            <p className="text-sm text-gray-600">
                              Display title, subtitle, and description
                            </p>
                          </div>
                          <Switch
                            checked={showTitle}
                            onCheckedChange={setShowTitle}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">
                              Show CTA Buttons
                            </Label>
                            <p className="text-sm text-gray-600">
                              Display call-to-action buttons
                            </p>
                          </div>
                          <Switch
                            checked={showCTA}
                            onCheckedChange={setShowCTA}
                          />
                        </div>
                      </div>

                      {/* Title Section */}
                      {showTitle && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Title Content
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="title">Title</Label>
                              <Input
                                id="title"
                                value={formData.title || ''}
                                onChange={e =>
                                  setFormData({
                                    ...formData,
                                    title: e.target.value,
                                  })
                                }
                                placeholder="Welcome to JRM E-commerce"
                              />
                            </div>
                            <div>
                              <Label htmlFor="subtitle">Subtitle</Label>
                              <Input
                                id="subtitle"
                                value={formData.subtitle || ''}
                                onChange={e =>
                                  setFormData({
                                    ...formData,
                                    subtitle: e.target.value,
                                  })
                                }
                                placeholder="Malaysia's premier online marketplace"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={formData.description || ''}
                              onChange={e =>
                                setFormData({
                                  ...formData,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Describe your platform's key benefits"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}

                      {/* CTA Section */}
                      {showCTA && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Call-to-Action Buttons
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="ctaPrimary">
                                Primary CTA Text
                              </Label>
                              <Input
                                id="ctaPrimary"
                                value={formData.ctaPrimaryText || ''}
                                onChange={e =>
                                  setFormData({
                                    ...formData,
                                    ctaPrimaryText: e.target.value,
                                  })
                                }
                                placeholder="Join as Member"
                              />
                            </div>
                            <div>
                              <Label htmlFor="ctaPrimaryLink">
                                Primary CTA Link
                              </Label>
                              <Input
                                id="ctaPrimaryLink"
                                value={formData.ctaPrimaryLink || ''}
                                onChange={e =>
                                  setFormData({
                                    ...formData,
                                    ctaPrimaryLink: e.target.value,
                                  })
                                }
                                placeholder="/auth/signup"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="ctaSecondary">
                                Secondary CTA Text
                              </Label>
                              <Input
                                id="ctaSecondary"
                                value={formData.ctaSecondaryText || ''}
                                onChange={e =>
                                  setFormData({
                                    ...formData,
                                    ctaSecondaryText: e.target.value,
                                  })
                                }
                                placeholder="Browse Products"
                              />
                            </div>
                            <div>
                              <Label htmlFor="ctaSecondaryLink">
                                Secondary CTA Link
                              </Label>
                              <Input
                                id="ctaSecondaryLink"
                                value={formData.ctaSecondaryLink || ''}
                                onChange={e =>
                                  setFormData({
                                    ...formData,
                                    ctaSecondaryLink: e.target.value,
                                  })
                                }
                                placeholder="/products"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="media" className="space-y-4">
                      <div>
                        <Label>Background Type</Label>
                        <Select
                          value={formData.backgroundType || 'IMAGE'}
                          onValueChange={(value: 'IMAGE' | 'VIDEO') =>
                            setFormData({ ...formData, backgroundType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IMAGE">Image</SelectItem>
                            <SelectItem value="VIDEO">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.backgroundType === 'IMAGE' && (
                        <div>
                          <Label>Background Image URL</Label>
                          <Input
                            value={formData.backgroundImage || ''}
                            onChange={e =>
                              setFormData({
                                ...formData,
                                backgroundImage: e.target.value,
                              })
                            }
                            placeholder="Select from uploaded images or enter URL"
                          />
                          {formData.backgroundImage && (
                            <div className="mt-2">
                              <Image
                                src={formData.backgroundImage}
                                alt="Background preview"
                                width={300}
                                height={150}
                                className="rounded border object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {formData.backgroundType === 'VIDEO' && (
                        <div>
                          <Label>Background Video URL</Label>
                          <Input
                            value={formData.backgroundVideo || ''}
                            onChange={e =>
                              setFormData({
                                ...formData,
                                backgroundVideo: e.target.value,
                              })
                            }
                            placeholder="Select from uploaded videos or enter URL"
                          />
                          {formData.backgroundVideo && (
                            <div className="mt-2">
                              <video
                                src={formData.backgroundVideo}
                                width={300}
                                height={150}
                                className="rounded border object-cover"
                                controls
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <Label>Overlay Opacity</Label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={formData.overlayOpacity || 0.1}
                            onChange={e =>
                              setFormData({
                                ...formData,
                                overlayOpacity: parseFloat(e.target.value),
                              })
                            }
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-600 w-12">
                            {Math.round((formData.overlayOpacity || 0.1) * 100)}
                            %
                          </span>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="layout" className="space-y-4">
                      <div>
                        <Label>Text Alignment</Label>
                        <Select
                          value={formData.textAlignment || 'left'}
                          onValueChange={(value: 'left' | 'center' | 'right') =>
                            setFormData({ ...formData, textAlignment: value })
                          }
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
                    </TabsContent>

                    <TabsContent value="branding" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Logo Upload */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <ImageIcon className="w-5 h-5 text-blue-600" />
                              Business Logo
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Logo Preview and Size Controls */}
                            {activeTheme?.logoUrl ? (
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-900">Logo Preview & Size</Label>
                                  <p className="text-xs text-gray-500 mt-1">Adjust your logo size and preview changes</p>
                                </div>
                                
                                {/* Logo Preview with Size Control */}
                                <div className="bg-gray-50 border rounded-lg p-4 text-center">
                                  <Image
                                    src={activeTheme.logoUrl}
                                    alt="Logo Preview"
                                    width={120}
                                    height={40}
                                    className="max-w-full h-auto mx-auto transition-all duration-200"
                                    style={{ 
                                      transform: `scale(${logoScale})`,
                                      transformOrigin: 'center'
                                    }}
                                  />
                                  <p className="text-xs text-gray-600 mt-2">{logoScale.toFixed(1)}x size</p>
                                </div>
                                
                                {/* Simple Slider */}
                                <div className="space-y-3">
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>Small</span>
                                    <span>Large</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={logoSizePercentage}
                                    onChange={(e) => {
                                      const percentage = parseInt(e.target.value);
                                      handleSizeChange(percentage);
                                    }}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    disabled={isUploading}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No logo uploaded</p>
                              </div>
                            )}

                            {/* Upload Controls */}
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm font-medium">Upload Logo</Label>
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                                  onChange={e => handleBrandingFileUpload(e, 'logo')}
                                  disabled={isUploading}
                                  className="mt-2 w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, JPEG, SVG, WebP • Max 5MB
                                </p>
                              </div>

                              {activeTheme?.logoUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAsset('logo')}
                                  disabled={isUploading}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Favicon Upload */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Star className="w-5 h-5 text-purple-600" />
                              Favicon
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Current Favicon Preview */}
                            {activeTheme?.faviconUrl ? (
                              <div className="bg-gray-50 border rounded-lg p-4 text-center">
                                <Image
                                  src={activeTheme.faviconUrl}
                                  alt="Current Favicon"
                                  width={32}
                                  height={32}
                                  className="mx-auto border"
                                />
                                <p className="text-xs text-gray-500 mt-2">Browser tab icon</p>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                                <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No favicon uploaded</p>
                              </div>
                            )}

                            {/* Upload Controls */}
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm font-medium">Upload Favicon</Label>
                                <input
                                  type="file"
                                  accept="image/png,image/x-icon,image/vnd.microsoft.icon"
                                  onChange={e => handleBrandingFileUpload(e, 'favicon')}
                                  disabled={isUploading}
                                  className="mt-2 w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, ICO • Max 1MB • 32×32px recommended
                                </p>
                              </div>

                              {activeTheme?.faviconUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAsset('favicon')}
                                  disabled={isUploading}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Quick Tips */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Quick Tips</h4>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p>• Use PNG or SVG for logos, PNG/ICO for favicons</p>
                          <p>• Keep logos simple for better scaling</p>
                          <p>• Test visibility on different backgrounds</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Media Library */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drop files here or click to upload
                    </p>
                    <p className="text-xs text-gray-500">
                      Images: JPG, PNG, WebP, GIF (Max 50MB)
                      <br />
                      Videos: MP4, WebM, AVI, MOV (Max 50MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="mt-4 w-full"
                      disabled={isUploading}
                    />
                  </div>

                  {isUploading && (
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Uploading...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Media Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {mediaUploads.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p>No media files uploaded yet</p>
                    </div>
                  ) : (
                    mediaUploads.map(media => (
                      <div
                        key={media.id}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {media.mediaType === 'IMAGE' ? (
                            <Image
                              src={media.url}
                              alt={media.originalName}
                              width={60}
                              height={40}
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="w-15 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <Play className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {media.originalName}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                media.mediaType === 'IMAGE'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {media.mediaType}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(media.size)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (formData.backgroundType === media.mediaType) {
                                if (media.mediaType === 'IMAGE') {
                                  setFormData({
                                    ...formData,
                                    backgroundImage: media.url,
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    backgroundVideo: media.url,
                                  });
                                }
                              }
                            }}
                            disabled={
                              formData.backgroundType !== media.mediaType
                            }
                          >
                            Use
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteMedia(media.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {heroSection && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Current Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge
                      variant={heroSection.isActive ? 'default' : 'secondary'}
                    >
                      {heroSection.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Background:</span>
                    <Badge variant="outline">
                      {heroSection.backgroundType}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span>
                      {new Date(heroSection.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {heroSection.creator && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Updated By:</span>
                      <span>
                        {heroSection.creator.firstName}{' '}
                        {heroSection.creator.lastName}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
