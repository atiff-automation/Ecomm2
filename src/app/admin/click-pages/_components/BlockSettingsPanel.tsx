'use client';

/**
 * Block Settings Panel Component
 * Dynamic form for editing block-specific settings with tabbed interface
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { CLICK_PAGE_CONSTANTS } from '@/lib/constants/click-page-constants';
import { DEFAULT_STYLE_SETTINGS, DEFAULT_BRAND_COLORS } from '@/lib/constants/click-page-style-constants';
import { TypographyControls } from '@/components/admin/click-pages/TypographyControls';
import { SpacingControls } from '@/components/admin/click-pages/SpacingControls';
import { BorderControls } from '@/components/admin/click-pages/BorderControls';
import { EffectControls } from '@/components/admin/click-pages/EffectControls';
import { HoverEffectControls } from '@/components/admin/click-pages/HoverEffectControls';
import { AnimationControls } from '@/components/admin/click-pages/AnimationControls';
import { AdvancedControls } from '@/components/admin/click-pages/AdvancedControls';
import { ResponsiveControls } from '@/components/admin/click-pages/ResponsiveControls';
import TipTapEditor from '@/components/admin/TipTapEditor';
import ImageUpload, { type UploadedImage } from '@/components/ui/image-upload';
import VideoUpload, { type UploadedVideo } from '@/components/ui/video-upload';
import type { Block } from '@/types/click-page.types';
import type { StyleSettings } from '@/types/click-page-styles.types';

interface BlockSettingsPanelProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  brandColors?: typeof DEFAULT_BRAND_COLORS;
}

export function BlockSettingsPanel({ block, onUpdate, brandColors = DEFAULT_BRAND_COLORS }: BlockSettingsPanelProps) {
  const blockDef = CLICK_PAGE_CONSTANTS.BLOCKS.TYPES[block.type];
  const [activeTab, setActiveTab] = useState('content');

  // Helper to update content settings
  const updateSettings = <T extends Block['settings']>(updates: Partial<T>) => {
    onUpdate({
      settings: { ...block.settings, ...updates },
    } as Partial<Block>);
  };

  // Helper to update style settings
  const updateStyles = (updates: Partial<StyleSettings>) => {
    const currentStyles = (block.settings as { styles?: StyleSettings }).styles || {};
    onUpdate({
      settings: {
        ...block.settings,
        styles: {
          ...currentStyles,
          ...updates,
        },
      },
    } as Partial<Block>);
  };

  // Get current styles or defaults
  const currentStyles = (block.settings as { styles?: StyleSettings }).styles || {};

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b pb-3 px-4 pt-4">
        <h3 className="font-semibold">{blockDef.label}</h3>
        <p className="text-xs text-gray-500">{blockDef.description}</p>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start border-b rounded-none px-4 bg-transparent">
          <TabsTrigger value="content" className="text-xs">
            Content
          </TabsTrigger>
          <TabsTrigger value="style" className="text-xs">
            Style
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">
            Advanced
          </TabsTrigger>
          <TabsTrigger value="responsive" className="text-xs">
            Responsive
          </TabsTrigger>
        </TabsList>

        {/* Content Tab - Existing block-specific settings */}
        <TabsContent value="content" className="flex-1 overflow-y-auto px-4 py-4 m-0">
          <div className="space-y-4">
            {block.type === 'HERO' && (
              <HeroSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'TEXT' && (
              <TextSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'CTA_BUTTON' && (
              <CTAButtonSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'IMAGE' && (
              <ImageSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'SPACER' && (
              <SpacerSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'DIVIDER' && (
              <DividerSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'PRICING_TABLE' && (
              <PricingTableSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'TESTIMONIAL' && (
              <TestimonialSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'COUNTDOWN_TIMER' && (
              <CountdownTimerSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'SOCIAL_PROOF' && (
              <SocialProofSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'VIDEO' && (
              <VideoSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'FORM' && (
              <FormSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'IMAGE_GALLERY' && (
              <ImageGallerySettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'EMBED' && (
              <EmbedSettings block={block} updateSettings={updateSettings} />
            )}
            {block.type === 'ACCORDION' && (
              <AccordionSettings block={block} updateSettings={updateSettings} />
            )}
          </div>
        </TabsContent>

        {/* Style Tab - New styling controls */}
        <TabsContent value="style" className="flex-1 overflow-y-auto px-4 py-4 m-0">
          <div className="space-y-6">
            {/* Typography */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Typography</h4>
              <TypographyControls
                value={currentStyles.typography || DEFAULT_STYLE_SETTINGS.typography}
                onChange={(typography) => updateStyles({ typography })}
                brandColors={brandColors}
              />
            </div>

            {/* Spacing */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Spacing</h4>
              <SpacingControls
                value={currentStyles.spacing || DEFAULT_STYLE_SETTINGS.spacing}
                onChange={(spacing) => updateStyles({ spacing })}
              />
            </div>

            {/* Border */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Border</h4>
              <BorderControls
                value={currentStyles.border || DEFAULT_STYLE_SETTINGS.border}
                onChange={(border) => updateStyles({ border })}
                brandColors={brandColors}
              />
            </div>

            {/* Effects */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Effects</h4>
              <EffectControls
                value={currentStyles.effects || DEFAULT_STYLE_SETTINGS.effects}
                onChange={(effects) => updateStyles({ effects })}
                brandColors={brandColors}
              />
            </div>

            {/* Hover Effects - Only for buttons and images */}
            {(block.type === 'CTA_BUTTON' || block.type === 'IMAGE') && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Hover Effects</h4>
                <HoverEffectControls
                  value={
                    currentStyles.hover || {
                      enabled: false,
                      transition: { duration: 300, easing: 'ease' },
                    }
                  }
                  onChange={(hover) => updateStyles({ hover })}
                  brandColors={brandColors}
                  showBackgroundColor={block.type === 'CTA_BUTTON'}
                  showTextColor={block.type === 'CTA_BUTTON'}
                  showBorderColor={true}
                />
              </div>
            )}

            {/* Animations - All blocks */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Animations</h4>
              <AnimationControls
                value={
                  currentStyles.animation || {
                    enabled: false,
                    type: 'fadeIn',
                    trigger: 'onScroll',
                    duration: 500,
                    delay: 0,
                    easing: 'ease',
                    repeat: false,
                  }
                }
                onChange={(animation) => updateStyles({ animation })}
              />
            </div>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="flex-1 overflow-y-auto px-4 py-4 m-0">
          <AdvancedControls
            value={
              currentStyles.advanced || {
                customCSS: '',
                customClasses: [],
                zIndex: 1,
                display: 'block',
                position: 'static',
                overflow: 'visible',
              }
            }
            onChange={(advanced) => updateStyles({ advanced })}
          />
        </TabsContent>

        {/* Responsive Tab */}
        <TabsContent value="responsive" className="flex-1 overflow-y-auto px-4 py-4 m-0">
          <ResponsiveControls
            value={
              currentStyles.responsive || {
                mobile: { hidden: false },
                tablet: { hidden: false },
                desktop: { hidden: false },
              }
            }
            onChange={(responsive) => updateStyles({ responsive })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Block-Specific Settings Components
// ============================================================================

function HeroSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'HERO' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={block.settings.title}
          onChange={(e) => updateSettings({ title: e.target.value })}
          placeholder="Enter title"
        />
      </div>
      <div>
        <Label>Subtitle</Label>
        <Input
          value={block.settings.subtitle || ''}
          onChange={(e) => updateSettings({ subtitle: e.target.value })}
          placeholder="Enter subtitle"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={block.settings.description || ''}
          onChange={(e) => updateSettings({ description: e.target.value })}
          placeholder="Enter description"
          rows={3}
        />
      </div>
      <div>
        <Label>Background Image</Label>
        <ImageUpload
          value={block.settings.backgroundImage ? [{ url: block.settings.backgroundImage }] : []}
          onChange={(images: UploadedImage[]) => {
            const url = images[0]?.url || '';
            updateSettings({ backgroundImage: url });
          }}
          maxFiles={1}
          maxSize={10 * 1024 * 1024} // 10MB
          accept="image/*"
        />
      </div>
      <div>
        <Label>Overlay Opacity: {(block.settings.overlayOpacity * 100).toFixed(0)}%</Label>
        <Slider
          value={[block.settings.overlayOpacity * 100]}
          onValueChange={([value]) => updateSettings({ overlayOpacity: value / 100 })}
          max={100}
          step={5}
        />
      </div>
      <div>
        <Label>Text Alignment</Label>
        <Select
          value={block.settings.textAlignment}
          onValueChange={(v) => updateSettings({ textAlignment: v as 'left' | 'center' | 'right' })}
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
      <div>
        <Label>CTA Text</Label>
        <Input
          value={block.settings.ctaText}
          onChange={(e) => updateSettings({ ctaText: e.target.value })}
          placeholder="Shop Now"
        />
      </div>
      <div>
        <Label>CTA URL</Label>
        <Input
          value={block.settings.ctaUrl}
          onChange={(e) => updateSettings({ ctaUrl: e.target.value })}
          placeholder="/products"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Show Countdown</Label>
        <Switch
          checked={block.settings.showCountdown}
          onCheckedChange={(v) => updateSettings({ showCountdown: v })}
        />
      </div>
    </div>
  );
}

function TextSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'TEXT' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Content</Label>
        <div className="mt-2 border rounded-md">
          <TipTapEditor
            content={block.settings.content}
            onChange={(html) => updateSettings({ content: html })}
            placeholder="Enter your text here..."
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Rich text editor with formatting options
        </p>
      </div>
      <div>
        <Label>Text Alignment</Label>
        <Select
          value={block.settings.textAlign}
          onValueChange={(v) =>
            updateSettings({ textAlign: v as 'left' | 'center' | 'right' | 'justify' })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="justify">Justify</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Max Width (px)</Label>
        <Input
          type="number"
          value={block.settings.maxWidth || ''}
          onChange={(e) =>
            updateSettings({ maxWidth: e.target.value ? Number(e.target.value) : undefined })
          }
          placeholder="Auto"
        />
      </div>
    </div>
  );
}

function CTAButtonSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'CTA_BUTTON' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Button Text</Label>
        <Input
          value={block.settings.text}
          onChange={(e) => updateSettings({ text: e.target.value })}
          placeholder="Click Here"
        />
      </div>
      <div>
        <Label>URL</Label>
        <Input
          value={block.settings.url}
          onChange={(e) => updateSettings({ url: e.target.value })}
          placeholder="/products"
        />
      </div>
      <div>
        <Label>Style</Label>
        <Select
          value={block.settings.variant}
          onValueChange={(v) =>
            updateSettings({ variant: v as 'default' | 'outline' | 'ghost' | 'destructive' })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Solid</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="ghost">Ghost</SelectItem>
            <SelectItem value="destructive">Destructive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Size</Label>
        <Select
          value={block.settings.size}
          onValueChange={(v) => updateSettings({ size: v as 'sm' | 'default' | 'lg' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="default">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Alignment</Label>
        <Select
          value={block.settings.alignment}
          onValueChange={(v) => updateSettings({ alignment: v as 'left' | 'center' | 'right' })}
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
      <div className="flex items-center justify-between">
        <Label>Open in New Tab</Label>
        <Switch
          checked={block.settings.openInNewTab}
          onCheckedChange={(v) => updateSettings({ openInNewTab: v })}
        />
      </div>
    </div>
  );
}

function ImageSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'IMAGE' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Image</Label>
        <ImageUpload
          value={block.settings.url ? [{ url: block.settings.url }] : []}
          onChange={(images: UploadedImage[]) => {
            const url = images[0]?.url || '';
            updateSettings({ url });
          }}
          maxFiles={1}
          maxSize={10 * 1024 * 1024} // 10MB
          accept="image/*"
        />
      </div>
      <div>
        <Label>Alt Text</Label>
        <Input
          value={block.settings.altText}
          onChange={(e) => updateSettings({ altText: e.target.value })}
          placeholder="Image description"
        />
      </div>
      <div>
        <Label>Caption</Label>
        <Input
          value={block.settings.caption || ''}
          onChange={(e) => updateSettings({ caption: e.target.value })}
          placeholder="Optional caption"
        />
      </div>
      <div>
        <Label>Link URL</Label>
        <Input
          value={block.settings.link || ''}
          onChange={(e) => updateSettings({ link: e.target.value })}
          placeholder="Optional link"
        />
      </div>
      <div>
        <Label>Alignment</Label>
        <Select
          value={block.settings.alignment}
          onValueChange={(v) => updateSettings({ alignment: v as 'left' | 'center' | 'right' })}
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
      <div>
        <Label>Width</Label>
        <Select
          value={block.settings.width}
          onValueChange={(v) =>
            updateSettings({ width: v as 'full' | 'large' | 'medium' | 'small' })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Width</SelectItem>
            <SelectItem value="large">Large</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="small">Small</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Rounded Corners</Label>
        <Switch
          checked={block.settings.rounded}
          onCheckedChange={(v) => updateSettings({ rounded: v })}
        />
      </div>
    </div>
  );
}

function SpacerSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'SPACER' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Height: {block.settings.height}px</Label>
        <Slider
          value={[block.settings.height]}
          onValueChange={([value]) => updateSettings({ height: value })}
          min={10}
          max={200}
          step={10}
        />
      </div>
    </div>
  );
}

function DividerSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'DIVIDER' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Style</Label>
        <Select
          value={block.settings.style}
          onValueChange={(v) => updateSettings({ style: v as 'solid' | 'dashed' | 'dotted' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="dashed">Dashed</SelectItem>
            <SelectItem value="dotted">Dotted</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Color</Label>
        <Input
          type="color"
          value={block.settings.color}
          onChange={(e) => updateSettings({ color: e.target.value })}
        />
      </div>
      <div>
        <Label>Thickness: {block.settings.thickness}px</Label>
        <Slider
          value={[block.settings.thickness]}
          onValueChange={([value]) => updateSettings({ thickness: value })}
          min={1}
          max={10}
          step={1}
        />
      </div>
      <div>
        <Label>Spacing: {block.settings.spacing}px</Label>
        <Slider
          value={[block.settings.spacing]}
          onValueChange={([value]) => updateSettings({ spacing: value })}
          min={0}
          max={100}
          step={5}
        />
      </div>
    </div>
  );
}

function PricingTableSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'PRICING_TABLE' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  const [editingTierId, setEditingTierId] = useState<string | null>(null);

  const addTier = () => {
    const newTier = {
      id: `tier-${Date.now()}`,
      title: 'New Plan',
      subtitle: '',
      price: 0,
      originalPrice: 0,
      features: ['Feature 1'],
      ctaText: 'Get Started',
      ctaUrl: '#',
      highlighted: false,
      badge: '',
      imageUrl: '',
    };
    updateSettings({ tiers: [...block.settings.tiers, newTier] });
    setEditingTierId(newTier.id);
  };

  const updateTier = (tierId: string, updates: Partial<typeof block.settings.tiers[0]>) => {
    updateSettings({
      tiers: block.settings.tiers.map((t) =>
        t.id === tierId ? { ...t, ...updates } : t
      ),
    });
  };

  const deleteTier = (tierId: string) => {
    updateSettings({
      tiers: block.settings.tiers.filter((t) => t.id !== tierId),
    });
    if (editingTierId === tierId) {
      setEditingTierId(null);
    }
  };

  const addFeature = (tierId: string) => {
    const tier = block.settings.tiers.find((t) => t.id === tierId);
    if (tier) {
      updateTier(tierId, { features: [...tier.features, ''] });
    }
  };

  const updateFeature = (tierId: string, featureIndex: number, value: string) => {
    const tier = block.settings.tiers.find((t) => t.id === tierId);
    if (tier) {
      const newFeatures = [...tier.features];
      newFeatures[featureIndex] = value;
      updateTier(tierId, { features: newFeatures });
    }
  };

  const deleteFeature = (tierId: string, featureIndex: number) => {
    const tier = block.settings.tiers.find((t) => t.id === tierId);
    if (tier) {
      updateTier(tierId, { features: tier.features.filter((_, i) => i !== featureIndex) });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Layout</Label>
        <Select
          value={block.settings.layout}
          onValueChange={(v) => updateSettings({ layout: v as 'horizontal' | 'vertical' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="horizontal">Horizontal</SelectItem>
            <SelectItem value="vertical">Vertical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Show Comparison</Label>
        <Switch
          checked={block.settings.showComparison}
          onCheckedChange={(v) => updateSettings({ showComparison: v })}
        />
      </div>

      {/* Pricing Tiers */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Pricing Tiers</Label>
          <button
            type="button"
            onClick={addTier}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={block.settings.tiers.length >= 5}
          >
            + Add Tier
          </button>
        </div>

        {block.settings.tiers.length === 0 && (
          <p className="text-sm text-gray-500">No tiers yet. Click "Add Tier" to create one.</p>
        )}

        {block.settings.tiers.map((tier, index) => (
          <div key={tier.id} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingTierId(editingTierId === tier.id ? null : tier.id)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {editingTierId === tier.id ? '▼' : '▶'} {tier.title} - RM{tier.price}
              </button>
              <button
                type="button"
                onClick={() => deleteTier(tier.id)}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Delete
              </button>
            </div>

            {editingTierId === tier.id && (
              <div className="space-y-3 pl-3 border-l-2 border-gray-200">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={tier.title}
                    onChange={(e) => updateTier(tier.id, { title: e.target.value })}
                    placeholder="Basic Plan"
                  />
                </div>
                <div>
                  <Label className="text-xs">Subtitle (optional)</Label>
                  <Input
                    value={tier.subtitle || ''}
                    onChange={(e) => updateTier(tier.id, { subtitle: e.target.value })}
                    placeholder="Perfect for individuals"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tier Image (optional)</Label>
                  <ImageUpload
                    value={tier.imageUrl ? [{ url: tier.imageUrl }] : []}
                    onChange={(images: UploadedImage[]) => {
                      const url = images[0]?.url || '';
                      updateTier(tier.id, { imageUrl: url });
                    }}
                    maxFiles={1}
                    maxSize={5 * 1024 * 1024} // 5MB
                    accept="image/*"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Price (RM)</Label>
                    <Input
                      type="number"
                      value={tier.price}
                      onChange={(e) => updateTier(tier.id, { price: Number(e.target.value) })}
                      placeholder="99"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Original Price (RM)</Label>
                    <Input
                      type="number"
                      value={tier.originalPrice || ''}
                      onChange={(e) => updateTier(tier.id, { originalPrice: Number(e.target.value) || undefined })}
                      placeholder="149"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Badge (optional)</Label>
                  <Input
                    value={tier.badge || ''}
                    onChange={(e) => updateTier(tier.id, { badge: e.target.value })}
                    placeholder="Most Popular"
                  />
                </div>
                <div>
                  <Label className="text-xs">Features</Label>
                  <div className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(tier.id, featureIndex, e.target.value)}
                          placeholder="Feature name"
                          className="text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => deleteFeature(tier.id, featureIndex)}
                          className="text-xs text-red-500 hover:text-red-600 px-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addFeature(tier.id)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      + Add Feature
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Button Text</Label>
                  <Input
                    value={tier.ctaText}
                    onChange={(e) => updateTier(tier.id, { ctaText: e.target.value })}
                    placeholder="Get Started"
                  />
                </div>
                <div>
                  <Label className="text-xs">Button URL</Label>
                  <Input
                    value={tier.ctaUrl}
                    onChange={(e) => updateTier(tier.id, { ctaUrl: e.target.value })}
                    placeholder="#"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Highlight This Tier</Label>
                  <Switch
                    checked={tier.highlighted}
                    onCheckedChange={(v) => updateTier(tier.id, { highlighted: v })}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'TESTIMONIAL' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Layout</Label>
        <Select
          value={block.settings.layout}
          onValueChange={(v) => updateSettings({ layout: v as 'single' | 'carousel' | 'grid' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="carousel">Carousel</SelectItem>
            <SelectItem value="grid">Grid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Show Ratings</Label>
        <Switch
          checked={block.settings.showRatings}
          onCheckedChange={(v) => updateSettings({ showRatings: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Show Images</Label>
        <Switch
          checked={block.settings.showImages}
          onCheckedChange={(v) => updateSettings({ showImages: v })}
        />
      </div>
      <div className="text-sm text-gray-500">
        {block.settings.testimonials.length} testimonial(s) configured.
        <br />
        <span className="text-xs">Edit testimonials in the full editor.</span>
      </div>
    </div>
  );
}

function CountdownTimerSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'COUNTDOWN_TIMER' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  // Format date for datetime-local input
  const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={block.settings.title || ''}
          onChange={(e) => updateSettings({ title: e.target.value })}
          placeholder="Limited Time Offer"
        />
      </div>
      <div>
        <Label>Message</Label>
        <Input
          value={block.settings.message || ''}
          onChange={(e) => updateSettings({ message: e.target.value })}
          placeholder="Hurry, offer ends soon!"
        />
      </div>
      <div>
        <Label>End Date</Label>
        <Input
          type="datetime-local"
          value={formatDateForInput(block.settings.endDate)}
          onChange={(e) => updateSettings({ endDate: new Date(e.target.value) })}
        />
      </div>
      <div>
        <Label>Expired Message</Label>
        <Input
          value={block.settings.expiredMessage || ''}
          onChange={(e) => updateSettings({ expiredMessage: e.target.value })}
          placeholder="This offer has ended"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Days</Label>
          <Switch
            checked={block.settings.showDays}
            onCheckedChange={(v) => updateSettings({ showDays: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Hours</Label>
          <Switch
            checked={block.settings.showHours}
            onCheckedChange={(v) => updateSettings({ showHours: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Minutes</Label>
          <Switch
            checked={block.settings.showMinutes}
            onCheckedChange={(v) => updateSettings({ showMinutes: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Seconds</Label>
          <Switch
            checked={block.settings.showSeconds}
            onCheckedChange={(v) => updateSettings({ showSeconds: v })}
          />
        </div>
      </div>
    </div>
  );
}

function SocialProofSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'SOCIAL_PROOF' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Type</Label>
        <Select
          value={block.settings.type}
          onValueChange={(v) => updateSettings({ type: v as 'stats' | 'badges' | 'reviews' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stats">Stats</SelectItem>
            <SelectItem value="badges">Badges</SelectItem>
            <SelectItem value="reviews">Reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Layout</Label>
        <Select
          value={block.settings.layout}
          onValueChange={(v) =>
            updateSettings({ layout: v as 'horizontal' | 'vertical' | 'grid' })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="horizontal">Horizontal</SelectItem>
            <SelectItem value="vertical">Vertical</SelectItem>
            <SelectItem value="grid">Grid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-gray-500">
        Configure {block.settings.type} in the full editor.
      </div>
    </div>
  );
}

function VideoSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'VIDEO' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  // Extract current URL based on video type
  const getCurrentUrl = () => {
    if (block.settings.videoType === 'youtube') {
      return block.settings.youtubeId || '';
    } else if (block.settings.videoType === 'vimeo') {
      return block.settings.vimeoId || '';
    } else {
      return block.settings.selfHostedUrl || '';
    }
  };

  // Update URL based on video type
  const handleUrlChange = (url: string) => {
    if (block.settings.videoType === 'youtube') {
      // Extract YouTube ID from URL
      let youtubeId = url;
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        youtubeId = match ? match[1] : url;
      }
      updateSettings({ youtubeId, vimeoId: undefined, selfHostedUrl: undefined });
    } else if (block.settings.videoType === 'vimeo') {
      // Extract Vimeo ID from URL
      let vimeoId = url;
      if (url.includes('vimeo.com')) {
        const match = url.match(/vimeo\.com\/(\d+)/);
        vimeoId = match ? match[1] : url;
      }
      updateSettings({ vimeoId, youtubeId: undefined, selfHostedUrl: undefined });
    } else {
      updateSettings({ selfHostedUrl: url, youtubeId: undefined, vimeoId: undefined });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Video Type</Label>
        <Select
          value={block.settings.videoType}
          onValueChange={(v) => {
            const videoType = v as 'youtube' | 'vimeo' | 'self-hosted';
            updateSettings({
              videoType,
              youtubeId: videoType === 'youtube' ? block.settings.youtubeId : undefined,
              vimeoId: videoType === 'vimeo' ? block.settings.vimeoId : undefined,
              selfHostedUrl: videoType === 'self-hosted' ? block.settings.selfHostedUrl : undefined,
            });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
            <SelectItem value="self-hosted">Self-Hosted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Video Source Input - Different for each type */}
      {block.settings.videoType !== 'self-hosted' ? (
        <div>
          <Label>
            {block.settings.videoType === 'youtube' && 'YouTube URL or ID'}
            {block.settings.videoType === 'vimeo' && 'Vimeo URL or ID'}
          </Label>
          <Input
            value={getCurrentUrl()}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={
              block.settings.videoType === 'youtube'
                ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ'
                : 'https://vimeo.com/123456789 or 123456789'
            }
          />
          {block.settings.videoType === 'youtube' && (
            <p className="text-xs text-gray-500 mt-1">
              Enter full URL or just the video ID
            </p>
          )}
          {block.settings.videoType === 'vimeo' && (
            <p className="text-xs text-gray-500 mt-1">
              Enter full URL or just the video ID
            </p>
          )}
        </div>
      ) : (
        <div>
          <Label>Upload Video File</Label>
          <VideoUpload
            value={block.settings.selfHostedUrl ? { url: block.settings.selfHostedUrl, filename: block.settings.selfHostedFilename } : null}
            onChange={(video: UploadedVideo | null) => {
              updateSettings({
                selfHostedUrl: video?.url || '',
                selfHostedFilename: video?.filename || undefined
              });
            }}
            maxSize={100 * 1024 * 1024} // 100MB
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload MP4, WebM, OGG, or MOV files (max 100MB)
          </p>
        </div>
      )}
      <div>
        <Label>Aspect Ratio</Label>
        <Select
          value={block.settings.aspectRatio}
          onValueChange={(v) => updateSettings({ aspectRatio: v as '16:9' | '4:3' | '1:1' | '21:9' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
            <SelectItem value="4:3">4:3 (Standard)</SelectItem>
            <SelectItem value="1:1">1:1 (Square)</SelectItem>
            <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label>Autoplay</Label>
          <Switch
            checked={block.settings.autoplay}
            onCheckedChange={(v) => updateSettings({ autoplay: v })}
          />
        </div>
        {block.settings.autoplay && (
          <p className="text-xs text-gray-500 mt-1">
            Video will play automatically when it comes into view. Note: Browsers require videos to be muted for autoplay to work.
          </p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <Label>Loop</Label>
        <Switch
          checked={block.settings.loop}
          onCheckedChange={(v) => updateSettings({ loop: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Show Controls</Label>
        <Switch
          checked={block.settings.controls}
          onCheckedChange={(v) => updateSettings({ controls: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Muted by Default</Label>
        <Switch
          checked={block.settings.muted}
          onCheckedChange={(v) => updateSettings({ muted: v })}
        />
      </div>
      <div>
        <Label>Caption (optional)</Label>
        <Input
          value={block.settings.caption || ''}
          onChange={(e) => updateSettings({ caption: e.target.value })}
          placeholder="Video caption"
        />
      </div>
      <div>
        <Label>Thumbnail Image (optional)</Label>
        <ImageUpload
          value={block.settings.thumbnailUrl ? [{ url: block.settings.thumbnailUrl }] : []}
          onChange={(images: UploadedImage[]) => {
            const url = images[0]?.url || '';
            updateSettings({ thumbnailUrl: url });
          }}
          maxFiles={1}
          maxSize={5 * 1024 * 1024}
          accept="image/*"
        />
      </div>
    </div>
  );
}

function FormSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'FORM' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const addField = () => {
    const newField = {
      id: `field-${Date.now()}`,
      type: 'text' as const,
      label: 'New Field',
      placeholder: '',
      required: false,
      validation: {},
    };
    updateSettings({ fields: [...block.settings.fields, newField] });
    setEditingFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<typeof block.settings.fields[0]>) => {
    updateSettings({
      fields: block.settings.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    });
  };

  const deleteField = (fieldId: string) => {
    updateSettings({
      fields: block.settings.fields.filter((f) => f.id !== fieldId),
    });
    if (editingFieldId === fieldId) {
      setEditingFieldId(null);
    }
  };

  const addRecipient = () => {
    const currentRecipients = block.settings.emailNotification?.recipients || [];
    updateSettings({
      emailNotification: {
        ...block.settings.emailNotification,
        enabled: block.settings.emailNotification?.enabled || false,
        recipients: [...currentRecipients, ''],
        subject: block.settings.emailNotification?.subject || 'New Form Submission',
      },
    });
  };

  const updateRecipient = (index: number, value: string) => {
    const recipients = [...(block.settings.emailNotification?.recipients || [])];
    recipients[index] = value;
    updateSettings({
      emailNotification: {
        ...block.settings.emailNotification,
        enabled: block.settings.emailNotification?.enabled || false,
        recipients,
        subject: block.settings.emailNotification?.subject || 'New Form Submission',
      },
    });
  };

  const deleteRecipient = (index: number) => {
    const recipients = (block.settings.emailNotification?.recipients || []).filter((_, i) => i !== index);
    updateSettings({
      emailNotification: {
        ...block.settings.emailNotification,
        enabled: block.settings.emailNotification?.enabled || false,
        recipients,
        subject: block.settings.emailNotification?.subject || 'New Form Submission',
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Form Title (optional)</Label>
        <Input
          value={block.settings.title || ''}
          onChange={(e) => updateSettings({ title: e.target.value })}
          placeholder="Contact Us"
        />
      </div>
      <div>
        <Label>Description (optional)</Label>
        <Textarea
          value={block.settings.description || ''}
          onChange={(e) => updateSettings({ description: e.target.value })}
          placeholder="Fill out the form below"
          rows={2}
        />
      </div>

      {/* Form Fields */}
      <div className="space-y-3 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Form Fields</Label>
          <Button
            type="button"
            size="sm"
            onClick={addField}
            disabled={block.settings.fields.length >= 20}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Field
          </Button>
        </div>

        {block.settings.fields.length === 0 && (
          <p className="text-sm text-gray-500">No fields yet. Click "Add Field" to create one.</p>
        )}

        {block.settings.fields.map((field) => (
          <div key={field.id} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingFieldId(editingFieldId === field.id ? null : field.id)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {editingFieldId === field.id ? '▼' : '▶'} {field.label} ({field.type})
              </button>
              <button
                type="button"
                onClick={() => deleteField(field.id)}
                className="text-xs text-red-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editingFieldId === field.id && (
              <div className="space-y-3 pl-3 border-l-2 border-gray-200">
                <div>
                  <Label className="text-xs">Field Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(v) => updateField(field.id, {
                      type: v as 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                      <SelectItem value="select">Select Dropdown</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="radio">Radio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <Label className="text-xs">Placeholder</Label>
                  <Input
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
                {(field.type === 'select' || field.type === 'radio') && (
                  <div>
                    <Label className="text-xs">Options (comma-separated)</Label>
                    <Input
                      value={field.options?.join(', ') || ''}
                      onChange={(e) =>
                        updateField(field.id, {
                          options: e.target.value.split(',').map((opt) => opt.trim()).filter(Boolean),
                        })
                      }
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Required Field</Label>
                  <Switch
                    checked={field.required}
                    onCheckedChange={(v) => updateField(field.id, { required: v })}
                  />
                </div>
                {field.type === 'text' && (
                  <div>
                    <Label className="text-xs">Min Length (optional)</Label>
                    <Input
                      type="number"
                      value={field.validation?.minLength || ''}
                      onChange={(e) =>
                        updateField(field.id, {
                          validation: {
                            ...field.validation,
                            minLength: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                )}
                {field.type === 'text' && (
                  <div>
                    <Label className="text-xs">Max Length (optional)</Label>
                    <Input
                      type="number"
                      value={field.validation?.maxLength || ''}
                      onChange={(e) =>
                        updateField(field.id, {
                          validation: {
                            ...field.validation,
                            maxLength: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                      placeholder="500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="pt-2 border-t">
        <Label>Submit Button Text</Label>
        <Input
          value={block.settings.submitButtonText}
          onChange={(e) => updateSettings({ submitButtonText: e.target.value })}
          placeholder="Submit"
        />
      </div>
      <div>
        <Label>Submit Button Style</Label>
        <Select
          value={block.settings.submitButtonVariant}
          onValueChange={(v) =>
            updateSettings({ submitButtonVariant: v as 'default' | 'outline' | 'ghost' })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Solid</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="ghost">Ghost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Success Settings */}
      <div className="pt-2 border-t">
        <Label>Success Message</Label>
        <Textarea
          value={block.settings.successMessage}
          onChange={(e) => updateSettings({ successMessage: e.target.value })}
          placeholder="Thank you! Your submission has been received."
          rows={2}
        />
      </div>
      <div>
        <Label>Redirect URL (optional)</Label>
        <Input
          value={block.settings.redirectUrl || ''}
          onChange={(e) => updateSettings({ redirectUrl: e.target.value })}
          placeholder="https://example.com/thank-you"
        />
      </div>

      {/* Webhook */}
      <div className="pt-2 border-t">
        <Label>Webhook URL (optional)</Label>
        <Input
          value={block.settings.webhookUrl || ''}
          onChange={(e) => updateSettings({ webhookUrl: e.target.value })}
          placeholder="https://example.com/webhook"
        />
        <p className="text-xs text-gray-500 mt-1">
          Form data will be sent to this URL as a POST request
        </p>
      </div>

      {/* Email Notifications */}
      <div className="pt-2 border-t space-y-3">
        <div className="flex items-center justify-between">
          <Label>Email Notifications</Label>
          <Switch
            checked={block.settings.emailNotification?.enabled || false}
            onCheckedChange={(v) =>
              updateSettings({
                emailNotification: {
                  enabled: v,
                  recipients: block.settings.emailNotification?.recipients || [],
                  subject: block.settings.emailNotification?.subject || 'New Form Submission',
                },
              })
            }
          />
        </div>

        {block.settings.emailNotification?.enabled && (
          <>
            <div>
              <Label className="text-xs">Email Subject</Label>
              <Input
                value={block.settings.emailNotification?.subject || ''}
                onChange={(e) =>
                  updateSettings({
                    emailNotification: {
                      ...block.settings.emailNotification,
                      enabled: true,
                      recipients: block.settings.emailNotification?.recipients || [],
                      subject: e.target.value,
                    },
                  })
                }
                placeholder="New Form Submission"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Recipients</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addRecipient}
                  disabled={(block.settings.emailNotification?.recipients || []).length >= 10}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {(block.settings.emailNotification?.recipients || []).map((recipient, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      value={recipient}
                      onChange={(e) => updateRecipient(index, e.target.value)}
                      placeholder="email@example.com"
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRecipient(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ImageGallerySettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'IMAGE_GALLERY' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  const addImage = () => {
    const newImage = {
      id: `img-${Date.now()}`,
      url: '',
      altText: 'Gallery image',
      caption: '',
    };
    updateSettings({ images: [...block.settings.images, newImage] });
  };

  const updateImage = (imageId: string, updates: Partial<typeof block.settings.images[0]>) => {
    updateSettings({
      images: block.settings.images.map((img) =>
        img.id === imageId ? { ...img, ...updates } : img
      ),
    });
  };

  const deleteImage = (imageId: string) => {
    updateSettings({
      images: block.settings.images.filter((img) => img.id !== imageId),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Layout</Label>
        <Select
          value={block.settings.layout}
          onValueChange={(v) => updateSettings({ layout: v as 'carousel' | 'grid' | 'masonry' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="carousel">Carousel</SelectItem>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="masonry">Masonry</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {block.settings.layout === 'grid' && (
        <div>
          <Label>Columns: {block.settings.columns}</Label>
          <Slider
            value={[block.settings.columns]}
            onValueChange={([value]) => updateSettings({ columns: value as 2 | 3 | 4 | 5 })}
            min={2}
            max={5}
            step={1}
          />
        </div>
      )}
      {block.settings.layout === 'carousel' && (
        <>
          <div className="flex items-center justify-between">
            <Label>Autoplay</Label>
            <Switch
              checked={block.settings.autoplay}
              onCheckedChange={(v) => updateSettings({ autoplay: v })}
            />
          </div>
          {block.settings.autoplay && (
            <div>
              <Label>Autoplay Interval: {block.settings.autoplayInterval}ms</Label>
              <Slider
                value={[block.settings.autoplayInterval]}
                onValueChange={([value]) => updateSettings({ autoplayInterval: value })}
                min={1000}
                max={10000}
                step={500}
              />
            </div>
          )}
        </>
      )}
      <div className="flex items-center justify-between">
        <Label>Enable Lightbox</Label>
        <Switch
          checked={block.settings.lightbox}
          onCheckedChange={(v) => updateSettings({ lightbox: v })}
        />
      </div>

      {/* Images */}
      <div className="space-y-3 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Images</Label>
          <Button
            type="button"
            size="sm"
            onClick={addImage}
            disabled={block.settings.images.length >= 50}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Image
          </Button>
        </div>

        {block.settings.images.length === 0 && (
          <p className="text-sm text-gray-500">No images yet. Click "Add Image" to upload.</p>
        )}

        {block.settings.images.map((image) => (
          <div key={image.id} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium truncate flex-1">
                {image.url ? image.altText || 'Image' : 'New Image'}
              </span>
              <button
                type="button"
                onClick={() => deleteImage(image.id)}
                className="text-xs text-red-500 hover:text-red-600 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ImageUpload
              value={image.url ? [{ url: image.url }] : []}
              onChange={(images: UploadedImage[]) => {
                const url = images[0]?.url || '';
                updateImage(image.id, { url });
              }}
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              accept="image/*"
            />
            <Input
              value={image.altText}
              onChange={(e) => updateImage(image.id, { altText: e.target.value })}
              placeholder="Alt text"
              className="text-xs"
            />
            <Input
              value={image.caption || ''}
              onChange={(e) => updateImage(image.id, { caption: e.target.value })}
              placeholder="Caption (optional)"
              className="text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmbedSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'EMBED' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Embed Type</Label>
        <Select
          value={block.settings.embedType}
          onValueChange={(v) => updateSettings({ embedType: v as 'iframe' | 'custom' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="iframe">iFrame</SelectItem>
            <SelectItem value="custom">Custom HTML</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {block.settings.embedType === 'iframe' && (
        <>
          <div>
            <Label>iFrame URL</Label>
            <Input
              value={block.settings.iframeUrl || ''}
              onChange={(e) => updateSettings({ iframeUrl: e.target.value })}
              placeholder="https://example.com/embed"
            />
          </div>
          <div>
            <Label>Height (px)</Label>
            <Input
              type="number"
              value={block.settings.height}
              onChange={(e) => updateSettings({ height: Number(e.target.value) })}
              placeholder="400"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Allow Fullscreen</Label>
            <Switch
              checked={block.settings.allowFullscreen}
              onCheckedChange={(v) => updateSettings({ allowFullscreen: v })}
            />
          </div>
        </>
      )}
      {block.settings.embedType === 'custom' && (
        <div>
          <Label>Custom HTML/Script</Label>
          <Textarea
            value={block.settings.embedCode || ''}
            onChange={(e) => updateSettings({ embedCode: e.target.value })}
            placeholder="<script>...</script> or <div>...</div>"
            rows={10}
            className="font-mono text-xs"
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste your embed code here. Be careful with untrusted code.
          </p>
        </div>
      )}
    </div>
  );
}

function AccordionSettings({
  block,
  updateSettings,
}: {
  block: Extract<Block, { type: 'ACCORDION' }>;
  updateSettings: (updates: Partial<typeof block.settings>) => void;
}) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const addItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      title: 'New Item',
      content: '<p>Content goes here</p>',
      isOpenByDefault: false,
    };
    updateSettings({ items: [...block.settings.items, newItem] });
    setEditingItemId(newItem.id);
  };

  const updateItem = (itemId: string, updates: Partial<typeof block.settings.items[0]>) => {
    updateSettings({
      items: block.settings.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
  };

  const deleteItem = (itemId: string) => {
    updateSettings({
      items: block.settings.items.filter((item) => item.id !== itemId),
    });
    if (editingItemId === itemId) {
      setEditingItemId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Allow Multiple Open</Label>
        <Switch
          checked={block.settings.allowMultipleOpen}
          onCheckedChange={(v) => updateSettings({ allowMultipleOpen: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Show Icons</Label>
        <Switch
          checked={block.settings.showIcons}
          onCheckedChange={(v) => updateSettings({ showIcons: v })}
        />
      </div>
      <div>
        <Label>Animation Duration: {block.settings.animationDuration}ms</Label>
        <Slider
          value={[block.settings.animationDuration]}
          onValueChange={([value]) => updateSettings({ animationDuration: value })}
          min={100}
          max={1000}
          step={50}
        />
      </div>

      {/* Accordion Items */}
      <div className="space-y-3 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Accordion Items</Label>
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            disabled={block.settings.items.length >= 20}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Item
          </Button>
        </div>

        {block.settings.items.length === 0 && (
          <p className="text-sm text-gray-500">No items yet. Click "Add Item" to create one.</p>
        )}

        {block.settings.items.map((item) => (
          <div key={item.id} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingItemId(editingItemId === item.id ? null : item.id)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {editingItemId === item.id ? '▼' : '▶'} {item.title}
              </button>
              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                className="text-xs text-red-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editingItemId === item.id && (
              <div className="space-y-3 pl-3 border-l-2 border-gray-200">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={item.title}
                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                    placeholder="Question or title"
                  />
                </div>
                <div>
                  <Label className="text-xs">Content</Label>
                  <div className="mt-2 border rounded-md">
                    <TipTapEditor
                      content={item.content}
                      onChange={(html) => updateItem(item.id, { content: html })}
                      placeholder="Answer or content"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Open by Default</Label>
                  <Switch
                    checked={item.isOpenByDefault}
                    onCheckedChange={(v) => updateItem(item.id, { isOpenByDefault: v })}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
