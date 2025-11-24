'use client';

/**
 * ColorPicker Component
 * Color picker with opacity support and brand color palette
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Pipette } from 'lucide-react';
import type { BrandColors } from '@/types/click-page-styles.types';

interface ColorPickerProps {
  label?: string;
  value: string; // Hex color (with optional opacity, e.g., "#3B82F6" or "#3B82F680")
  onChange: (value: string) => void;
  showOpacity?: boolean;
  brandColors?: BrandColors;
  className?: string;
}

/**
 * Parse hex color to get color and opacity
 */
function parseHexColor(hex: string): { color: string; opacity: number } {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Check if includes opacity (8 characters)
  if (cleanHex.length === 8) {
    const color = `#${cleanHex.substring(0, 6)}`;
    const opacityHex = cleanHex.substring(6, 8);
    const opacity = Math.round((parseInt(opacityHex, 16) / 255) * 100);
    return { color, opacity };
  }

  // Standard 6-character hex
  return { color: `#${cleanHex}`, opacity: 100 };
}

/**
 * Convert color and opacity to hex with alpha
 */
function toHexWithOpacity(color: string, opacity: number): string {
  const cleanColor = color.replace('#', '');
  if (opacity === 100) {
    return `#${cleanColor}`;
  }

  const opacityHex = Math.round((opacity / 100) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${cleanColor}${opacityHex}`;
}

/**
 * Validate hex color
 */
function isValidHex(hex: string): boolean {
  const cleanHex = hex.replace('#', '');
  return /^[0-9A-Fa-f]{6}$/.test(cleanHex) || /^[0-9A-Fa-f]{8}$/.test(cleanHex);
}

export function ColorPicker({
  label,
  value,
  onChange,
  showOpacity = true,
  brandColors,
  className = '',
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { color, opacity } = parseHexColor(value);

  const handleColorChange = (newColor: string) => {
    if (isValidHex(newColor)) {
      onChange(toHexWithOpacity(newColor, opacity));
    }
  };

  const handleOpacityChange = (newOpacity: number) => {
    onChange(toHexWithOpacity(color, newOpacity));
  };

  const handleBrandColorClick = (brandColor: string) => {
    onChange(toHexWithOpacity(brandColor, opacity));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        {/* Color Preview and Picker */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-10 h-10 p-0 border-2"
              style={{ backgroundColor: value }}
              aria-label="Pick color"
            >
              <span className="sr-only">Pick color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="start">
            <div className="space-y-4">
              {/* Hex Input */}
              <div>
                <Label className="text-xs">Hex Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#3B82F6"
                    className="font-mono"
                  />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                    title="Pick color"
                  />
                </div>
              </div>

              {/* Opacity Slider */}
              {showOpacity && (
                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs">Opacity</Label>
                    <span className="text-xs text-gray-500">{opacity}%</span>
                  </div>
                  <Slider
                    value={[opacity]}
                    onValueChange={([value]) => handleOpacityChange(value)}
                    min={0}
                    max={100}
                    step={1}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Brand Colors */}
              {brandColors && (
                <div>
                  <Label className="text-xs mb-2 block">Brand Colors</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {/* Primary, Secondary, Accent */}
                    <button
                      onClick={() => handleBrandColorClick(brandColors.primary)}
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: brandColors.primary }}
                      title="Primary"
                    />
                    <button
                      onClick={() => handleBrandColorClick(brandColors.secondary)}
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: brandColors.secondary }}
                      title="Secondary"
                    />
                    <button
                      onClick={() => handleBrandColorClick(brandColors.accent)}
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: brandColors.accent }}
                      title="Accent"
                    />

                    {/* Success, Warning, Error */}
                    {brandColors.success && (
                      <button
                        onClick={() => handleBrandColorClick(brandColors.success!)}
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: brandColors.success }}
                        title="Success"
                      />
                    )}
                    {brandColors.warning && (
                      <button
                        onClick={() => handleBrandColorClick(brandColors.warning!)}
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: brandColors.warning }}
                        title="Warning"
                      />
                    )}
                    {brandColors.error && (
                      <button
                        onClick={() => handleBrandColorClick(brandColors.error!)}
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: brandColors.error }}
                        title="Error"
                      />
                    )}

                    {/* Neutral Scale (selected shades) */}
                    {brandColors.neutral && (
                      <>
                        <button
                          onClick={() => handleBrandColorClick(brandColors.neutral!['100'])}
                          className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: brandColors.neutral['100'] }}
                          title="Neutral 100"
                        />
                        <button
                          onClick={() => handleBrandColorClick(brandColors.neutral!['300'])}
                          className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: brandColors.neutral['300'] }}
                          title="Neutral 300"
                        />
                        <button
                          onClick={() => handleBrandColorClick(brandColors.neutral!['500'])}
                          className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: brandColors.neutral['500'] }}
                          title="Neutral 500"
                        />
                        <button
                          onClick={() => handleBrandColorClick(brandColors.neutral!['700'])}
                          className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: brandColors.neutral['700'] }}
                          title="Neutral 700"
                        />
                        <button
                          onClick={() => handleBrandColorClick(brandColors.neutral!['900'])}
                          className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: brandColors.neutral['900'] }}
                          title="Neutral 900"
                        />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Hex Value Display */}
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#3B82F6"
          className="font-mono flex-1"
        />
      </div>
    </div>
  );
}
