'use client';

/**
 * Global Theme Settings Component
 * Brand colors, fonts, and default spacing for the entire page
 */

import { useState } from 'react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Palette, Type, Settings, Link2, Unlink } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import {
  GOOGLE_FONTS,
  DEFAULT_BRAND_COLORS,
  DEFAULT_GLOBAL_FONTS,
  COLOR_THEME_PRESETS,
} from '@/lib/constants/click-page-style-constants';
import type { ThemeSettings, BrandColors, GlobalFonts, ContainerPadding } from '@/types/click-page-styles.types';
import { migrateContainerPadding, togglePaddingLinked, updateContainerPadding } from '@/lib/utils/click-page-padding';

interface GlobalThemeSettingsProps {
  value: ThemeSettings;
  onChange: (value: ThemeSettings) => void;
  className?: string;
}

/**
 * Default theme settings
 */
const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  colors: DEFAULT_BRAND_COLORS,
  fonts: DEFAULT_GLOBAL_FONTS,
  defaultSpacing: {
    blockGap: 32,
    containerPadding: {
      linked: true,
      top: 24,
      right: 24,
      bottom: 24,
      left: 24,
    },
  },
};

export function GlobalThemeSettings({
  value = DEFAULT_THEME_SETTINGS,
  onChange,
  className = '',
}: GlobalThemeSettingsProps) {
  const [colorsOpen, setColorsOpen] = useState(true);
  const [fontsOpen, setFontsOpen] = useState(true);
  const [spacingOpen, setSpacingOpen] = useState(false);

  /**
   * Update colors
   */
  const updateColors = (updates: Partial<BrandColors>) => {
    onChange({
      ...value,
      colors: { ...value.colors, ...updates },
    });
  };

  /**
   * Update fonts
   */
  const updateFonts = (updates: Partial<GlobalFonts>) => {
    onChange({
      ...value,
      fonts: { ...value.fonts, ...updates },
    });
  };

  /**
   * Update spacing
   */
  const updateSpacing = (updates: Partial<NonNullable<ThemeSettings['defaultSpacing']>>) => {
    const currentSpacing = value.defaultSpacing || {
      blockGap: 32,
      containerPadding: { linked: true, top: 24, right: 24, bottom: 24, left: 24 },
    };

    // Ensure containerPadding is migrated to new format
    const migratedPadding = typeof currentSpacing.containerPadding === 'number'
      ? migrateContainerPadding(currentSpacing.containerPadding)
      : currentSpacing.containerPadding;

    onChange({
      ...value,
      defaultSpacing: {
        ...currentSpacing,
        containerPadding: migratedPadding,
        ...updates,
      },
    });
  };

  /**
   * Apply a color theme preset
   */
  const applyColorPreset = (presetKey: keyof typeof COLOR_THEME_PRESETS) => {
    const preset = COLOR_THEME_PRESETS[presetKey];
    onChange({
      ...value,
      colors: { ...value.colors, ...preset.colors },
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="pb-2 border-b">
        <h3 className="font-semibold text-sm">Global Theme Settings</h3>
        <p className="text-xs text-gray-500">
          Define brand colors and fonts used across all blocks
        </p>
      </div>

      {/* Theme Preview */}
      <div className="border rounded-lg p-4">
        <Label className="text-xs text-gray-500 mb-2 block">Theme Preview</Label>
        <div className="flex gap-2 mb-3">
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: value.colors.primary }}
            title="Primary"
          />
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: value.colors.secondary }}
            title="Secondary"
          />
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: value.colors.accent }}
            title="Accent"
          />
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: value.colors.success }}
            title="Success"
          />
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: value.colors.warning }}
            title="Warning"
          />
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: value.colors.error }}
            title="Error"
          />
        </div>
        <div>
          <p
            className="text-lg font-bold"
            style={{ fontFamily: value.fonts.heading }}
          >
            Heading Font: {value.fonts.heading}
          </p>
          <p
            className="text-sm"
            style={{ fontFamily: value.fonts.body }}
          >
            Body Font: {value.fonts.body}
          </p>
        </div>
      </div>

      {/* Brand Colors */}
      <Collapsible open={colorsOpen} onOpenChange={setColorsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center justify-between w-full p-2 h-auto"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="font-medium text-sm">Brand Colors</span>
            </div>
            {colorsOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          {/* Quick Color Presets */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Quick Color Presets</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(COLOR_THEME_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyColorPreset(key as keyof typeof COLOR_THEME_PRESETS)}
                  className="text-xs h-8"
                >
                  <div
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: preset.colors.primary }}
                  />
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Primary Colors */}
          <div className="grid grid-cols-3 gap-3">
            <ColorPicker
              label="Primary"
              value={value.colors.primary}
              onChange={(color) => updateColors({ primary: color })}
              showOpacity={false}
            />
            <ColorPicker
              label="Secondary"
              value={value.colors.secondary}
              onChange={(color) => updateColors({ secondary: color })}
              showOpacity={false}
            />
            <ColorPicker
              label="Accent"
              value={value.colors.accent}
              onChange={(color) => updateColors({ accent: color })}
              showOpacity={false}
            />
          </div>

          {/* Status Colors */}
          <div className="grid grid-cols-3 gap-3">
            <ColorPicker
              label="Success"
              value={value.colors.success || '#10B981'}
              onChange={(color) => updateColors({ success: color })}
              showOpacity={false}
            />
            <ColorPicker
              label="Warning"
              value={value.colors.warning || '#F59E0B'}
              onChange={(color) => updateColors({ warning: color })}
              showOpacity={false}
            />
            <ColorPicker
              label="Error"
              value={value.colors.error || '#EF4444'}
              onChange={(color) => updateColors({ error: color })}
              showOpacity={false}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Global Fonts */}
      <Collapsible open={fontsOpen} onOpenChange={setFontsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center justify-between w-full p-2 h-auto"
          >
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              <span className="font-medium text-sm">Typography</span>
            </div>
            {fontsOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          {/* Heading Font */}
          <div>
            <Label className="text-xs text-gray-500">Heading Font</Label>
            <Select
              value={value.fonts.heading}
              onValueChange={(font) => updateFonts({ heading: font })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {GOOGLE_FONTS.map((font) => (
                  <SelectItem key={font.family} value={font.family}>
                    <span style={{ fontFamily: font.family }}>{font.family}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 mt-1">
              Used for headings (H1, H2, Hero titles)
            </p>
          </div>

          {/* Body Font */}
          <div>
            <Label className="text-xs text-gray-500">Body Font</Label>
            <Select
              value={value.fonts.body}
              onValueChange={(font) => updateFonts({ body: font })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {GOOGLE_FONTS.map((font) => (
                  <SelectItem key={font.family} value={font.family}>
                    <span style={{ fontFamily: font.family }}>{font.family}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 mt-1">
              Used for body text and paragraphs
            </p>
          </div>

          {/* Monospace Font (Optional) */}
          <div>
            <Label className="text-xs text-gray-500">Monospace Font (Optional)</Label>
            <Select
              value={value.fonts.monospace || 'Fira Code'}
              onValueChange={(font) => updateFonts({ monospace: font })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fira Code">Fira Code</SelectItem>
                <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                <SelectItem value="Roboto Mono">Roboto Mono</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Default Spacing */}
      <Collapsible open={spacingOpen} onOpenChange={setSpacingOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center justify-between w-full p-2 h-auto"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="font-medium text-sm">Default Spacing</span>
            </div>
            {spacingOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          {/* Block Gap */}
          <div>
            <Label className="text-xs text-gray-500">Block Gap (px)</Label>
            <Input
              type="number"
              value={value.defaultSpacing?.blockGap ?? 32}
              onChange={(e) => updateSpacing({ blockGap: Number(e.target.value) })}
              min={0}
              max={100}
              step={4}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">
              Default vertical spacing between blocks
            </p>
          </div>

          {/* Container Padding */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-gray-500">Container Padding (px)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => {
                  const currentPadding = migrateContainerPadding(value.defaultSpacing?.containerPadding);
                  updateSpacing({ containerPadding: togglePaddingLinked(currentPadding) });
                }}
              >
                {value.defaultSpacing?.containerPadding && typeof value.defaultSpacing.containerPadding !== 'number' && value.defaultSpacing.containerPadding.linked ? (
                  <>
                    <Link2 className="w-3 h-3 mr-1" />
                    <span className="text-xs">Linked</span>
                  </>
                ) : (
                  <>
                    <Unlink className="w-3 h-3 mr-1" />
                    <span className="text-xs">Unlinked</span>
                  </>
                )}
              </Button>
            </div>

            {value.defaultSpacing?.containerPadding && typeof value.defaultSpacing.containerPadding !== 'number' && value.defaultSpacing.containerPadding.linked ? (
              // Linked mode - single input
              <Input
                type="number"
                value={value.defaultSpacing.containerPadding.top}
                onChange={(e) => {
                  const currentPadding = migrateContainerPadding(value.defaultSpacing?.containerPadding);
                  updateSpacing({
                    containerPadding: updateContainerPadding(currentPadding, 'all', Number(e.target.value))
                  });
                }}
                min={0}
                max={200}
                step={4}
                className="mt-1"
              />
            ) : (
              // Unlinked mode - four inputs
              <div className="grid grid-cols-4 gap-2 mt-1">
                <div>
                  <Label className="text-xs text-gray-400">Top</Label>
                  <Input
                    type="number"
                    value={migrateContainerPadding(value.defaultSpacing?.containerPadding).top}
                    onChange={(e) => {
                      const currentPadding = migrateContainerPadding(value.defaultSpacing?.containerPadding);
                      updateSpacing({
                        containerPadding: updateContainerPadding(currentPadding, 'top', Number(e.target.value))
                      });
                    }}
                    min={0}
                    max={200}
                    step={4}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Right</Label>
                  <Input
                    type="number"
                    value={migrateContainerPadding(value.defaultSpacing?.containerPadding).right}
                    onChange={(e) => {
                      const currentPadding = migrateContainerPadding(value.defaultSpacing?.containerPadding);
                      updateSpacing({
                        containerPadding: updateContainerPadding(currentPadding, 'right', Number(e.target.value))
                      });
                    }}
                    min={0}
                    max={200}
                    step={4}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Bottom</Label>
                  <Input
                    type="number"
                    value={migrateContainerPadding(value.defaultSpacing?.containerPadding).bottom}
                    onChange={(e) => {
                      const currentPadding = migrateContainerPadding(value.defaultSpacing?.containerPadding);
                      updateSpacing({
                        containerPadding: updateContainerPadding(currentPadding, 'bottom', Number(e.target.value))
                      });
                    }}
                    min={0}
                    max={200}
                    step={4}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Left</Label>
                  <Input
                    type="number"
                    value={migrateContainerPadding(value.defaultSpacing?.containerPadding).left}
                    onChange={(e) => {
                      const currentPadding = migrateContainerPadding(value.defaultSpacing?.containerPadding);
                      updateSpacing({
                        containerPadding: updateContainerPadding(currentPadding, 'left', Number(e.target.value))
                      });
                    }}
                    min={0}
                    max={200}
                    step={4}
                    className="text-xs"
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Padding around the page container on all sides
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
