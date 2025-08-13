'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ContextualNavigation from '@/components/admin/ContextualNavigation';
import {
  Monitor,
  Upload,
  Image as ImageIcon,
  Star,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Globe,
} from 'lucide-react';
import Image from 'next/image';

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

export default function BrandingCustomization() {
  const [activeTheme, setActiveTheme] = useState<SiteTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [logoWidth, setLogoWidth] = useState<number>(120);
  const [logoHeight, setLogoHeight] = useState<number>(40);

  useEffect(() => {
    fetchActiveTheme();
  }, []);

  const fetchActiveTheme = async () => {
    try {
      const response = await fetch('/api/admin/site-customization/theme');
      if (response.ok) {
        const data = await response.json();
        setActiveTheme(data.activeTheme);
        if (data.activeTheme?.logoWidth) {
          setLogoWidth(data.activeTheme.logoWidth);
        }
        if (data.activeTheme?.logoHeight) {
          setLogoHeight(data.activeTheme.logoHeight);
        }
      }
    } catch (error) {
      console.error('Error fetching theme:', error);
      setMessage({ type: 'error', text: 'Failed to load branding settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (
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

    setIsUploading(true);
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
        await fetchActiveTheme(); // Refresh theme data
        setMessage({ type: 'success', text: data.message });
      } else {
        throw new Error(data.message || `Failed to upload ${type}`);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : `Upload failed`,
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRemoveAsset = async (type: 'logo' | 'favicon') => {
    if (!confirm(`Are you sure you want to remove the ${type}?`)) {
      return;
    }

    setIsUploading(true);
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
        await fetchActiveTheme(); // Refresh theme data
        setMessage({ type: 'success', text: data.message });
      } else {
        throw new Error(data.message || `Failed to remove ${type}`);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : `Removal failed`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading branding settings...</p>
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
      label: 'Branding',
      href: '/admin/site-customization/branding',
      icon: Globe,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ContextualNavigation items={breadcrumbItems} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-600" />
            Site Branding
          </h1>
          <p className="text-gray-600 mt-1">
            Upload your business logo and favicon to customize your site's
            branding
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
              {/* Current Logo Preview */}
              {activeTheme?.logoUrl ? (
                <div className="border rounded-lg p-4 bg-white">
                  <p className="text-sm text-gray-600 mb-2">Current Logo:</p>
                  <div className="flex items-center justify-center">
                    <Image
                      src={activeTheme.logoUrl}
                      alt="Current Logo"
                      width={activeTheme.logoWidth || 120}
                      height={activeTheme.logoHeight || 40}
                      className="max-w-full h-auto"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Size: {activeTheme.logoWidth}×{activeTheme.logoHeight}px
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No logo uploaded</p>
                </div>
              )}

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
                  />
                </div>
              </div>

              {/* Upload Controls */}
              <div className="space-y-3">
                <div>
                  <Label>Upload New Logo</Label>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={e => handleFileUpload(e, 'logo')}
                    disabled={isUploading}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PNG, JPEG, SVG, WebP (Max 5MB)
                  </p>
                </div>

                {activeTheme?.logoUrl && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveAsset('logo')}
                    disabled={isUploading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Logo
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
                <div className="border rounded-lg p-4 bg-white">
                  <p className="text-sm text-gray-600 mb-2">Current Favicon:</p>
                  <div className="flex items-center justify-center">
                    <Image
                      src={activeTheme.faviconUrl}
                      alt="Current Favicon"
                      width={32}
                      height={32}
                      className="border"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    32×32px (standard browser tab icon)
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No favicon uploaded</p>
                </div>
              )}

              {/* Upload Controls */}
              <div className="space-y-3">
                <div>
                  <Label>Upload New Favicon</Label>
                  <Input
                    type="file"
                    accept="image/png,image/x-icon,image/vnd.microsoft.icon"
                    onChange={e => handleFileUpload(e, 'favicon')}
                    disabled={isUploading}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PNG, ICO (Max 1MB)
                    <br />
                    Recommended size: 32×32px or 16×16px
                  </p>
                </div>

                {activeTheme?.faviconUrl && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveAsset('favicon')}
                    disabled={isUploading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Favicon
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Branding Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Logo Best Practices:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Use high-quality PNG or SVG files for best results</li>
                <li>Recommended dimensions: 120×40px to 200×80px</li>
                <li>Ensure good contrast against your theme colors</li>
                <li>Test visibility on both light and dark backgrounds</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Favicon Requirements:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Use 32×32px or 16×16px PNG/ICO files</li>
                <li>Simple designs work best at small sizes</li>
                <li>Avoid detailed graphics that become unclear when small</li>
                <li>
                  Consider using your logo's simplified version or initials
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Loading Overlay */}
        {isUploading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Uploading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
