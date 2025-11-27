'use client';

/**
 * Background Controls Component
 * Controls for block background (color, image with overlay)
 */

import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import ImageUpload, { type UploadedImage } from '@/components/ui/image-upload';
import type { BackgroundSettings } from '@/types/click-page-styles.types';

interface BackgroundControlsProps {
  value: BackgroundSettings;
  onChange: (value: BackgroundSettings) => void;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  className?: string;
}

export function BackgroundControls({
  value,
  onChange,
  brandColors,
  className = '',
}: BackgroundControlsProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Memoize current images for controlled component
  const currentImages = useMemo(() => {
    return value.image?.url
      ? [{ url: value.image.url, altText: 'Background image' }]
      : [];
  }, [value.image?.url]);

  /**
   * Handle background type change
   */
  const handleTypeChange = (type: 'none' | 'solid' | 'image') => {
    if (type === 'none') {
      onChange({ type: 'none' });
    } else if (type === 'solid') {
      onChange({
        type: 'solid',
        color: value.color || brandColors?.primary || '#3B82F6',
        opacity: value.opacity !== undefined ? value.opacity : 1, // Default to fully opaque
      });
    } else if (type === 'image') {
      onChange({
        type: 'image',
        image: value.image || {
          url: '',
          position: 'center',
          size: 'cover',
          repeat: 'no-repeat',
          attachment: 'scroll',
        },
      });
    }
  };

  /**
   * Handle solid color change
   */
  const handleColorChange = (color: string) => {
    onChange({
      ...value,
      type: 'solid',
      color,
      opacity: value.opacity !== undefined ? value.opacity : 1, // Preserve opacity or default to 1
    });
  };

  /**
   * Handle solid color opacity change
   */
  const handleOpacityChange = (opacity: number) => {
    onChange({
      ...value,
      type: 'solid',
      color: value.color || brandColors?.primary || '#3B82F6',
      opacity,
    });
  };

  /**
   * Handle image upload
   */
  const handleImageUpload = useCallback(async (images: UploadedImage[]) => {
    if (images.length === 0) return;
    const uploadedImage = images[0]; // Take the first image for background

    setIsUploadingImage(true);
    try {
      onChange({
        type: 'image',
        image: {
          url: uploadedImage.url,
          position: value.image?.position || 'center',
          size: value.image?.size || 'cover',
          repeat: value.image?.repeat || 'no-repeat',
          attachment: value.image?.attachment || 'scroll',
          overlay: value.image?.overlay,
        },
      });
    } finally {
      setIsUploadingImage(false);
    }
  }, [onChange, value.image?.position, value.image?.size, value.image?.repeat, value.image?.attachment, value.image?.overlay]);

  /**
   * Handle image settings change
   */
  const handleImageSettingChange = <K extends keyof NonNullable<BackgroundSettings['image']>>(
    key: K,
    settingValue: NonNullable<BackgroundSettings['image']>[K]
  ) => {
    if (value.type !== 'image' || !value.image) return;

    onChange({
      type: 'image',
      image: {
        ...value.image,
        [key]: settingValue,
      },
    });
  };

  /**
   * Handle overlay change
   */
  const handleOverlayChange = (overlayColor: string, opacity: number) => {
    if (value.type !== 'image' || !value.image) return;

    onChange({
      type: 'image',
      image: {
        ...value.image,
        overlay: {
          color: overlayColor,
          opacity,
        },
      },
    });
  };

  /**
   * Remove overlay
   */
  const handleRemoveOverlay = () => {
    if (value.type !== 'image' || !value.image) return;

    const { overlay, ...imageWithoutOverlay } = value.image;
    onChange({
      type: 'image',
      image: imageWithoutOverlay,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Background Type */}
      <div>
        <Label className="text-sm font-medium">Background Type</Label>
        <Select value={value.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="solid">Solid Color</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Solid Color Settings */}
      {value.type === 'solid' && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Background Color</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={value.color || '#FFFFFF'}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-20 h-10 p-1"
              />
              <Input
                type="text"
                value={value.color || '#FFFFFF'}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#FFFFFF"
                className="flex-1"
              />
            </div>
          </div>

          {/* Opacity Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-gray-500">Opacity</Label>
              <span className="text-xs font-medium">{Math.round((value.opacity !== undefined ? value.opacity : 1) * 100)}%</span>
            </div>
            <Slider
              value={[(value.opacity !== undefined ? value.opacity : 1) * 100]}
              onValueChange={([v]) => handleOpacityChange(v / 100)}
              min={0}
              max={100}
              step={5}
              className="mt-1"
            />
          </div>

          {/* Quick Brand Colors */}
          {brandColors && (
            <div>
              <Label className="text-xs text-gray-500">Brand Colors</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => handleColorChange(brandColors.primary)}
                >
                  Primary
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => handleColorChange(brandColors.secondary)}
                >
                  Secondary
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => handleColorChange(brandColors.accent)}
                >
                  Accent
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Settings */}
      {value.type === 'image' && (
        <div className="space-y-3">
          {/* Image Upload */}
          <div>
            <Label className="text-xs text-gray-500">Background Image</Label>
            <ImageUpload
              value={currentImages}
              onChange={handleImageUpload}
              maxFiles={1}
              disabled={isUploadingImage}
              className="mt-1"
            />
          </div>

          {value.image?.url && (
            <>
              {/* Image Size */}
              <div>
                <Label className="text-xs text-gray-500">Size</Label>
                <Select
                  value={value.image.size || 'cover'}
                  onValueChange={(v) => handleImageSettingChange('size', v as 'cover' | 'contain' | 'auto')}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image Position */}
              <div>
                <Label className="text-xs text-gray-500">Position</Label>
                <Select
                  value={value.image.position || 'center'}
                  onValueChange={(v) => handleImageSettingChange('position', v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image Overlay */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-gray-500">Overlay (for text readability)</Label>
                  {value.image.overlay && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveOverlay}
                      className="h-6 text-xs"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {value.image.overlay ? (
                  <div className="space-y-2">
                    {/* Overlay Color */}
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={value.image.overlay.color}
                        onChange={(e) => handleOverlayChange(e.target.value, value.image!.overlay!.opacity)}
                        className="w-16 h-8 p-1"
                      />
                      <Input
                        type="text"
                        value={value.image.overlay.color}
                        onChange={(e) => handleOverlayChange(e.target.value, value.image!.overlay!.opacity)}
                        placeholder="#000000"
                        className="flex-1 h-8"
                      />
                    </div>

                    {/* Overlay Opacity */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Opacity</span>
                        <span className="text-xs font-medium">{Math.round(value.image.overlay.opacity * 100)}%</span>
                      </div>
                      <Slider
                        value={[value.image.overlay.opacity * 100]}
                        onValueChange={([v]) => handleOverlayChange(value.image!.overlay!.color, v / 100)}
                        min={0}
                        max={100}
                        step={5}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOverlayChange('#000000', 0.3)}
                    className="w-full h-8"
                  >
                    Add Overlay
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
