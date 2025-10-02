'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SlideManager } from './SlideManager';
import { SliderPreview } from './SliderPreview';
import { DragDropZone } from '@/components/ui/drag-drop-zone';
import {
  Settings,
  Upload,
  Eye,
  Timer,
  MousePointer,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react';

// ==================== INTERFACES ====================

interface HeroSlide {
  id: string;
  imageUrl: string;
  altText?: string;
  order: number;
  isActive: boolean;
  mediaId?: string; // Track media upload ID for deletion
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

interface HeroSliderSectionProps {
  sliderConfig: SliderConfig;
  onChange: (updates: Partial<SliderConfig>) => void;
  isLoading?: boolean;
}

// ==================== COMPONENT ====================

export function HeroSliderSection({
  sliderConfig,
  onChange,
  isLoading = false
}: HeroSliderSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ==================== SLIDER CONFIGURATION HANDLERS ====================

  const handleSliderToggle = useCallback((enabled: boolean) => {
    onChange({ enabled });
  }, [onChange]);

  const handleAutoAdvanceToggle = useCallback((autoAdvance: boolean) => {
    onChange({ autoAdvance });
  }, [onChange]);

  const handleIntervalChange = useCallback((interval: string) => {
    const numInterval = parseInt(interval, 10);
    if (!isNaN(numInterval) && numInterval >= 1000 && numInterval <= 30000) {
      onChange({ interval: numInterval });
    }
  }, [onChange]);

  const handleNavigationChange = useCallback((field: keyof Pick<SliderConfig, 'showDots' | 'showArrows' | 'pauseOnHover'>, value: boolean) => {
    onChange({ [field]: value });
  }, [onChange]);

  // ==================== SLIDE MANAGEMENT HANDLERS ====================

  const handleSlidesChange = useCallback((slides: HeroSlide[]) => {
    onChange({ slides });
  }, [onChange]);

  const handleSlideUpload = useCallback(async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get CSRF token from cookie for NextAuth protection
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('__Host-next-auth.csrf-token=') || row.startsWith('next-auth.csrf-token='))
        ?.split('=')[1]
        ?.split('%')[0]; // Extract token before URL encoding

      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('usage', 'hero_background');

        // Add CSRF token if available
        if (csrfToken) {
          formData.append('csrfToken', csrfToken);
        }

        const response = await fetch('/api/admin/site-customization/media/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include', // Include cookies
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed for ${file.name}: ${errorText}`);
        }

        const result = await response.json();

        // Update progress
        setUploadProgress(((index + 1) / files.length) * 100);

        // Create new slide
        const newSlide: HeroSlide = {
          id: `slide_${Date.now()}_${index}`,
          imageUrl: result.mediaUpload.url,
          altText: `Slide ${sliderConfig.slides.length + index + 1}`,
          order: sliderConfig.slides.length + index,
          isActive: true,
          mediaId: result.mediaUpload.id // Track media ID for deletion
        };

        return newSlide;
      });

      const newSlides = await Promise.all(uploadPromises);
      const updatedSlides = [...sliderConfig.slides, ...newSlides].sort((a, b) => a.order - b.order);

      onChange({ slides: updatedSlides });
      toast.success(`${newSlides.length} slide(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload slides');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [sliderConfig.slides, onChange]);

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Slider Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <CardTitle>Hero Slider Configuration</CardTitle>
            <Badge variant={sliderConfig.enabled ? "default" : "secondary"}>
              {sliderConfig.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable/Disable Slider */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="slider-enabled">Enable Hero Slider</Label>
              <div className="text-sm text-muted-foreground">
                Switch between single image and multi-image carousel
              </div>
            </div>
            <Switch
              id="slider-enabled"
              checked={sliderConfig.enabled}
              onCheckedChange={handleSliderToggle}
              disabled={isLoading}
            />
          </div>

          {sliderConfig.enabled && (
            <>
              <Separator />

              {/* Auto-advance Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-advance">Auto-advance Slides</Label>
                    <div className="text-sm text-muted-foreground">
                      Automatically move to next slide
                    </div>
                  </div>
                  <Switch
                    id="auto-advance"
                    checked={sliderConfig.autoAdvance}
                    onCheckedChange={handleAutoAdvanceToggle}
                    disabled={isLoading}
                  />
                </div>

                {sliderConfig.autoAdvance && (
                  <div className="space-y-2">
                    <Label htmlFor="interval">Interval (seconds)</Label>
                    <Select
                      value={sliderConfig.interval.toString()}
                      onValueChange={handleIntervalChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="interval">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3000">3 seconds</SelectItem>
                        <SelectItem value="5000">5 seconds</SelectItem>
                        <SelectItem value="7000">7 seconds</SelectItem>
                        <SelectItem value="10000">10 seconds</SelectItem>
                        <SelectItem value="15000">15 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />

              {/* Navigation Controls */}
              <div className="space-y-4">
                <Label>Navigation Controls</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MoreHorizontal className="h-4 w-4" />
                      <Label htmlFor="show-dots">Show Dots</Label>
                    </div>
                    <Switch
                      id="show-dots"
                      checked={sliderConfig.showDots}
                      onCheckedChange={(value) => handleNavigationChange('showDots', value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      <ArrowRight className="h-4 w-4" />
                      <Label htmlFor="show-arrows">Show Arrows</Label>
                    </div>
                    <Switch
                      id="show-arrows"
                      checked={sliderConfig.showArrows}
                      onCheckedChange={(value) => handleNavigationChange('showArrows', value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4" />
                      <Label htmlFor="pause-on-hover">Pause on Hover</Label>
                    </div>
                    <Switch
                      id="pause-on-hover"
                      checked={sliderConfig.pauseOnHover}
                      onCheckedChange={(value) => handleNavigationChange('pauseOnHover', value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Slide Upload & Management */}
      {sliderConfig.enabled && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <CardTitle>Upload Slides</CardTitle>
                <Badge variant="outline">
                  {sliderConfig.slides.length} / 10 slides
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DragDropZone
                type="hero_background"
                multiple={true}
                onUpload={async (event) => {
                  const files = Array.from(event.target.files || []);
                  await handleSlideUpload(files);
                }}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                disabled={sliderConfig.slides.length >= 10}
              />
              {sliderConfig.slides.length >= 10 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Maximum of 10 slides reached. Remove slides to upload more.
                </div>
              )}
            </CardContent>
          </Card>

          {sliderConfig.slides.length > 0 && (
            <SlideManager
              slides={sliderConfig.slides}
              onChange={handleSlidesChange}
              isLoading={isLoading}
            />
          )}

          {sliderConfig.slides.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <CardTitle>Preview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <SliderPreview
                  sliderConfig={sliderConfig}
                  className="max-w-2xl mx-auto"
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}