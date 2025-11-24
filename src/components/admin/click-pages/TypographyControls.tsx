'use client';

/**
 * Typography Controls Component
 * Comprehensive typography settings with font family, size, weight, spacing, and formatting
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPicker } from './ColorPicker';
import {
  GOOGLE_FONTS,
  FONT_WEIGHT_LABELS,
} from '@/lib/constants/click-page-style-constants';
import type {
  TypographySettings,
  FontWeight,
  TextTransform,
  BrandColors,
} from '@/types/click-page-styles.types';

interface TypographyControlsProps {
  value: TypographySettings;
  onChange: (value: TypographySettings) => void;
  brandColors?: BrandColors;
  showColor?: boolean; // Whether to show color picker
  className?: string;
}

export function TypographyControls({
  value,
  onChange,
  brandColors,
  showColor = true,
  className = '',
}: TypographyControlsProps) {
  const handleChange = <K extends keyof TypographySettings>(
    key: K,
    val: TypographySettings[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Font Family */}
      <div>
        <Label className="text-sm">Font Family</Label>
        <Select
          value={value.fontFamily}
          onValueChange={(val) => handleChange('fontFamily', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {/* System Fonts */}
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
              System Fonts
            </div>
            <SelectItem value="-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, sans-serif">
              System Sans Serif
            </SelectItem>
            <SelectItem value="Georgia, &quot;Times New Roman&quot;, Times, serif">
              System Serif
            </SelectItem>
            <SelectItem value="&quot;Courier New&quot;, Courier, monospace">
              System Monospace
            </SelectItem>

            {/* Google Fonts */}
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">
              Google Fonts
            </div>
            {GOOGLE_FONTS.map((font) => (
              <SelectItem key={font.family} value={font.family}>
                <span style={{ fontFamily: font.family }}>{font.family}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size and Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Font Size (px)</Label>
          <Input
            type="number"
            value={value.fontSize}
            onChange={(e) => handleChange('fontSize', Number(e.target.value))}
            min={8}
            max={200}
            step={1}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm">Font Weight</Label>
          <Select
            value={value.fontWeight}
            onValueChange={(val) => handleChange('fontWeight', val as FontWeight)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FONT_WEIGHT_LABELS) as FontWeight[]).map((weight) => (
                <SelectItem key={weight} value={weight}>
                  {FONT_WEIGHT_LABELS[weight]} ({weight})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Line Height and Letter Spacing */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Line Height</Label>
          <Input
            type="number"
            value={value.lineHeight}
            onChange={(e) => handleChange('lineHeight', Number(e.target.value))}
            min={0.5}
            max={3}
            step={0.1}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Multiplier (e.g., 1.5)</p>
        </div>
        <div>
          <Label className="text-sm">Letter Spacing (px)</Label>
          <Input
            type="number"
            value={value.letterSpacing}
            onChange={(e) =>
              handleChange('letterSpacing', Number(e.target.value))
            }
            min={-5}
            max={10}
            step={0.5}
            className="mt-1"
          />
        </div>
      </div>

      {/* Text Transform */}
      <div>
        <Label className="text-sm">Text Transform</Label>
        <Select
          value={value.textTransform}
          onValueChange={(val) =>
            handleChange('textTransform', val as TextTransform)
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="uppercase">UPPERCASE</SelectItem>
            <SelectItem value="lowercase">lowercase</SelectItem>
            <SelectItem value="capitalize">Capitalize</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text Color */}
      {showColor && (
        <ColorPicker
          label="Text Color"
          value={value.color}
          onChange={(color) => handleChange('color', color)}
          showOpacity={true}
          brandColors={brandColors}
        />
      )}
    </div>
  );
}
