'use client';

/**
 * Effects Controls Component
 * Box shadow, text shadow, opacity, and backdrop blur controls
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { SHADOW_PRESETS } from '@/lib/constants/click-page-style-constants';
import type { EffectSettings, BrandColors } from '@/types/click-page-styles.types';

interface EffectControlsProps {
  value: EffectSettings;
  onChange: (value: EffectSettings) => void;
  brandColors?: BrandColors;
  className?: string;
}

export function EffectControls({
  value,
  onChange,
  brandColors,
  className = '',
}: EffectControlsProps) {
  const [showBoxShadow, setShowBoxShadow] = useState(value.boxShadow?.enabled || false);
  const [showTextShadow, setShowTextShadow] = useState(value.textShadow?.enabled || false);

  /**
   * Default box shadow values
   */
  const defaultBoxShadow = {
    enabled: false,
    offsetX: 0,
    offsetY: 4,
    blur: 6,
    spread: -1,
    color: '#0000001a',
    inset: false,
  };

  /**
   * Default text shadow values
   */
  const defaultTextShadow = {
    enabled: false,
    offsetX: 0,
    offsetY: 2,
    blur: 4,
    color: '#00000033',
  };

  /**
   * Update box shadow
   */
  const updateBoxShadow = (updates: Partial<NonNullable<EffectSettings['boxShadow']>>) => {
    const current = value.boxShadow || defaultBoxShadow;
    onChange({
      ...value,
      boxShadow: { ...current, ...updates },
    });
  };

  /**
   * Update text shadow
   */
  const updateTextShadow = (updates: Partial<NonNullable<EffectSettings['textShadow']>>) => {
    const current = value.textShadow || defaultTextShadow;
    onChange({
      ...value,
      textShadow: { ...current, ...updates },
    });
  };

  /**
   * Apply shadow preset
   */
  const applyShadowPreset = (presetKey: keyof typeof SHADOW_PRESETS) => {
    const preset = SHADOW_PRESETS[presetKey];
    updateBoxShadow({
      enabled: true,
      ...preset.value,
      inset: value.boxShadow?.inset || false,
    });
    setShowBoxShadow(true);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Opacity */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Opacity</Label>
          <span className="text-xs text-gray-500">
            {Math.round(value.opacity * 100)}%
          </span>
        </div>
        <Slider
          value={[value.opacity * 100]}
          onValueChange={([val]) => onChange({ ...value, opacity: val / 100 })}
          min={0}
          max={100}
          step={1}
          className="mt-1"
        />
      </div>

      {/* Backdrop Blur */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Backdrop Blur (px)</Label>
        <Input
          type="number"
          value={value.blur || 0}
          onChange={(e) => onChange({ ...value, blur: Number(e.target.value) })}
          min={0}
          max={50}
          step={1}
          placeholder="0"
        />
        <p className="text-xs text-gray-500">
          Blur effect applied to background behind element
        </p>
      </div>

      {/* Box Shadow */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="boxShadowEnabled"
              checked={value.boxShadow?.enabled || false}
              onCheckedChange={(checked) => {
                updateBoxShadow({ enabled: checked as boolean });
                setShowBoxShadow(checked as boolean);
              }}
            />
            <Label htmlFor="boxShadowEnabled" className="text-sm font-medium cursor-pointer">
              Box Shadow
            </Label>
          </div>
          {value.boxShadow?.enabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowBoxShadow(!showBoxShadow)}
              className="h-8 px-2"
            >
              {showBoxShadow ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {value.boxShadow?.enabled && showBoxShadow && (
          <div className="space-y-4 pl-6 border-l-2 border-gray-200">
            {/* Shadow Presets */}
            <div>
              <Label className="text-xs text-gray-500">Quick Presets</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {Object.entries(SHADOW_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyShadowPreset(key as keyof typeof SHADOW_PRESETS)}
                    className="text-xs h-8"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Offset X & Y */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">Offset X (px)</Label>
                <Input
                  type="number"
                  value={value.boxShadow.offsetX}
                  onChange={(e) => updateBoxShadow({ offsetX: Number(e.target.value) })}
                  min={-50}
                  max={50}
                  step={1}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Offset Y (px)</Label>
                <Input
                  type="number"
                  value={value.boxShadow.offsetY}
                  onChange={(e) => updateBoxShadow({ offsetY: Number(e.target.value) })}
                  min={-50}
                  max={50}
                  step={1}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Blur & Spread */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">Blur (px)</Label>
                <Input
                  type="number"
                  value={value.boxShadow.blur}
                  onChange={(e) => updateBoxShadow({ blur: Number(e.target.value) })}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Spread (px)</Label>
                <Input
                  type="number"
                  value={value.boxShadow.spread}
                  onChange={(e) => updateBoxShadow({ spread: Number(e.target.value) })}
                  min={-50}
                  max={50}
                  step={1}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Shadow Color */}
            <ColorPicker
              label="Shadow Color"
              value={value.boxShadow.color}
              onChange={(color) => updateBoxShadow({ color })}
              showOpacity={true}
              brandColors={brandColors}
            />

            {/* Inset Toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="boxShadowInset"
                checked={value.boxShadow.inset}
                onCheckedChange={(checked) => updateBoxShadow({ inset: checked as boolean })}
              />
              <Label htmlFor="boxShadowInset" className="text-xs cursor-pointer">
                Inner Shadow (Inset)
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* Text Shadow */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="textShadowEnabled"
              checked={value.textShadow?.enabled || false}
              onCheckedChange={(checked) => {
                updateTextShadow({ enabled: checked as boolean });
                setShowTextShadow(checked as boolean);
              }}
            />
            <Label htmlFor="textShadowEnabled" className="text-sm font-medium cursor-pointer">
              Text Shadow
            </Label>
          </div>
          {value.textShadow?.enabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowTextShadow(!showTextShadow)}
              className="h-8 px-2"
            >
              {showTextShadow ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {value.textShadow?.enabled && showTextShadow && (
          <div className="space-y-4 pl-6 border-l-2 border-gray-200">
            {/* Offset X & Y */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">Offset X (px)</Label>
                <Input
                  type="number"
                  value={value.textShadow.offsetX}
                  onChange={(e) => updateTextShadow({ offsetX: Number(e.target.value) })}
                  min={-50}
                  max={50}
                  step={1}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Offset Y (px)</Label>
                <Input
                  type="number"
                  value={value.textShadow.offsetY}
                  onChange={(e) => updateTextShadow({ offsetY: Number(e.target.value) })}
                  min={-50}
                  max={50}
                  step={1}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Blur */}
            <div>
              <Label className="text-xs text-gray-500">Blur (px)</Label>
              <Input
                type="number"
                value={value.textShadow.blur}
                onChange={(e) => updateTextShadow({ blur: Number(e.target.value) })}
                min={0}
                max={50}
                step={1}
                className="mt-1"
              />
            </div>

            {/* Shadow Color */}
            <ColorPicker
              label="Shadow Color"
              value={value.textShadow.color}
              onChange={(color) => updateTextShadow({ color })}
              showOpacity={true}
              brandColors={brandColors}
            />
          </div>
        )}
      </div>
    </div>
  );
}
