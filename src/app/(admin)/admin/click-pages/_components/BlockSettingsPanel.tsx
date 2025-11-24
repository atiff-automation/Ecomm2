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
