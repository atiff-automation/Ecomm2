'use client';

/**
 * Hover Effect Controls Component
 * Hover state effects for buttons and images
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPicker } from './ColorPicker';
import { ANIMATION_EASINGS, ANIMATION_DURATIONS } from '@/lib/constants/click-page-style-constants';
import type { HoverEffects, BrandColors } from '@/types/click-page-styles.types';

interface HoverEffectControlsProps {
  value: HoverEffects;
  onChange: (value: HoverEffects) => void;
  brandColors?: BrandColors;
  showBackgroundColor?: boolean; // For buttons
  showTextColor?: boolean; // For buttons
  showBorderColor?: boolean; // For buttons and images
  className?: string;
}

/**
 * Default hover effects
 */
const DEFAULT_HOVER_EFFECTS: HoverEffects = {
  enabled: false,
  transition: {
    duration: 300,
    easing: 'ease',
  },
};

export function HoverEffectControls({
  value,
  onChange,
  brandColors,
  showBackgroundColor = true,
  showTextColor = true,
  showBorderColor = true,
  className = '',
}: HoverEffectControlsProps) {
  const [showBoxShadow, setShowBoxShadow] = useState(!!value.boxShadow);

  /**
   * Update hover effect property
   */
  const updateProperty = <K extends keyof HoverEffects>(
    key: K,
    val: HoverEffects[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  /**
   * Update box shadow
   */
  const updateBoxShadow = (
    updates: Partial<NonNullable<HoverEffects['boxShadow']>>
  ) => {
    const current = value.boxShadow || {
      offsetX: 0,
      offsetY: 8,
      blur: 15,
      spread: 0,
      color: '#00000026',
    };
    onChange({
      ...value,
      boxShadow: { ...current, ...updates },
    });
  };

  /**
   * Update transition settings
   */
  const updateTransition = (
    updates: Partial<HoverEffects['transition']>
  ) => {
    onChange({
      ...value,
      transition: { ...value.transition, ...updates },
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Enable Hover Effects */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="hoverEnabled"
          checked={value.enabled}
          onCheckedChange={(checked) => updateProperty('enabled', checked as boolean)}
        />
        <Label htmlFor="hoverEnabled" className="text-sm font-medium cursor-pointer">
          Enable Hover Effects
        </Label>
      </div>

      {value.enabled && (
        <div className="space-y-4 pl-6 border-l-2 border-gray-200">
          {/* Transition Settings */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Transition
            </h5>

            <div className="grid grid-cols-2 gap-3">
              {/* Duration */}
              <div>
                <Label className="text-xs text-gray-500">Duration</Label>
                <Select
                  value={value.transition.duration.toString()}
                  onValueChange={(val) => updateTransition({ duration: Number(val) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ANIMATION_DURATIONS).map(([key, { value: dur, label }]) => (
                      <SelectItem key={key} value={dur.toString()}>
                        {label}
                      </SelectItem>
                    ))}
                    <SelectItem value="100">Very Fast (100ms)</SelectItem>
                    <SelectItem value="1000">Very Slow (1000ms)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Easing */}
              <div>
                <Label className="text-xs text-gray-500">Easing</Label>
                <Select
                  value={value.transition.easing}
                  onValueChange={(val) =>
                    updateTransition({
                      easing: val as HoverEffects['transition']['easing'],
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ANIMATION_EASINGS).map(([key, { value: easing, label }]) => (
                      <SelectItem key={key} value={easing}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Transform Effects */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Transform
            </h5>

            <div className="grid grid-cols-2 gap-3">
              {/* Scale */}
              <div>
                <Label className="text-xs text-gray-500">Scale</Label>
                <Input
                  type="number"
                  value={value.scale || 1}
                  onChange={(e) => updateProperty('scale', Number(e.target.value))}
                  min={0.5}
                  max={2}
                  step={0.05}
                  placeholder="1"
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">1 = 100% (no scale)</p>
              </div>

              {/* Translate Y */}
              <div>
                <Label className="text-xs text-gray-500">Move Up/Down (px)</Label>
                <Input
                  type="number"
                  value={value.translateY || 0}
                  onChange={(e) => updateProperty('translateY', Number(e.target.value))}
                  min={-50}
                  max={50}
                  step={1}
                  placeholder="0"
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">Negative = move up</p>
              </div>
            </div>
          </div>

          {/* Color Changes */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Colors
            </h5>

            {showBackgroundColor && (
              <ColorPicker
                label="Background Color"
                value={value.backgroundColor || 'transparent'}
                onChange={(color) => updateProperty('backgroundColor', color)}
                showOpacity={true}
                brandColors={brandColors}
              />
            )}

            {showTextColor && (
              <ColorPicker
                label="Text Color"
                value={value.textColor || '#000000'}
                onChange={(color) => updateProperty('textColor', color)}
                showOpacity={true}
                brandColors={brandColors}
              />
            )}

            {showBorderColor && (
              <ColorPicker
                label="Border Color"
                value={value.borderColor || '#E5E7EB'}
                onChange={(color) => updateProperty('borderColor', color)}
                showOpacity={true}
                brandColors={brandColors}
              />
            )}
          </div>

          {/* Box Shadow on Hover */}
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hoverBoxShadow"
                checked={showBoxShadow}
                onCheckedChange={(checked) => {
                  setShowBoxShadow(checked as boolean);
                  if (!checked) {
                    onChange({ ...value, boxShadow: undefined });
                  } else {
                    updateBoxShadow({});
                  }
                }}
              />
              <Label htmlFor="hoverBoxShadow" className="text-xs font-semibold cursor-pointer">
                Box Shadow on Hover
              </Label>
            </div>

            {showBoxShadow && value.boxShadow && (
              <div className="space-y-3 pl-6 border-l-2 border-gray-100">
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
