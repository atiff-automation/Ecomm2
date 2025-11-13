/**
 * CTA Button Dialog Component
 * Hybrid color picker: Brand presets + Custom colors
 * Full-featured with accessibility checks and live preview
 */

'use client';

import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CTA_COLOR_PRESETS,
  DEFAULT_CTA_COLOR,
  COLOR_CATEGORIES,
  type CTAColorPreset,
} from '@/lib/constants/cta-button-constants';
import {
  getOptimalTextColor,
  hasGoodContrast,
  isValidHexColor,
  formatHexColor,
  generateCTAButtonStyle,
} from '@/lib/utils/color-utils';
import { AlertCircle, Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CTAButtonDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
}

export default function CTAButtonDialog({
  open,
  onClose,
  onInsert,
}: CTAButtonDialogProps) {
  // Form state
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');

  // Color state
  const [selectedPreset, setSelectedPreset] = useState<CTAColorPreset | null>(
    DEFAULT_CTA_COLOR
  );
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [customBgColor, setCustomBgColor] = useState('#000000');
  const [customTextColor, setCustomTextColor] = useState('#FFFFFF');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);

  // Computed values
  const backgroundColor = useCustomColor
    ? customBgColor
    : selectedPreset?.backgroundColor || '#000000';
  const textColor = useCustomColor
    ? customTextColor
    : selectedPreset?.textColor || '#FFFFFF';
  const borderColor = !useCustomColor ? selectedPreset?.borderColor : undefined;

  const contrastOk = hasGoodContrast(backgroundColor, textColor);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setButtonText('');
      setButtonUrl('');
      setSelectedPreset(DEFAULT_CTA_COLOR);
      setUseCustomColor(false);
      setCustomBgColor('#000000');
      setCustomTextColor('#FFFFFF');
      setShowBgPicker(false);
      setShowTextPicker(false);
    }
  }, [open]);

  // Auto-optimize text color when background changes (custom mode)
  const handleBgColorChange = (color: string) => {
    setCustomBgColor(color);
    // Auto-suggest optimal text color
    const optimalText = getOptimalTextColor(color);
    setCustomTextColor(optimalText);
  };

  // Handle preset selection
  const handlePresetClick = (preset: CTAColorPreset) => {
    setSelectedPreset(preset);
    setUseCustomColor(false);
  };

  // Handle custom color mode
  const handleUseCustomColor = () => {
    setUseCustomColor(true);
    setSelectedPreset(null);
    // Initialize with current preset colors if available
    if (selectedPreset) {
      setCustomBgColor(selectedPreset.backgroundColor);
      setCustomTextColor(selectedPreset.textColor);
    }
  };

  // Validate and insert
  const handleInsert = () => {
    // Validation
    if (!buttonText.trim()) {
      alert('Please enter button text');
      return;
    }

    if (!buttonUrl.trim()) {
      alert('Please enter button URL');
      return;
    }

    if (!contrastOk) {
      const confirm = window.confirm(
        'Warning: Text color may be hard to read on this background. Insert anyway?'
      );
      if (!confirm) return;
    }

    // Generate HTML
    const style = generateCTAButtonStyle(backgroundColor, textColor, borderColor);
    const dataPreset = selectedPreset
      ? `data-preset="${selectedPreset.id}"`
      : '';

    const buttonHTML = `<p style="text-align: center;"><a href="${buttonUrl}" class="article-cta-button" ${dataPreset} style="${style}">${buttonText}</a></p>`;

    onInsert(buttonHTML);
    onClose();
  };

  // Group presets by category
  const presetsByCategory = CTA_COLOR_PRESETS.reduce(
    (acc, preset) => {
      if (!acc[preset.category]) {
        acc[preset.category] = [];
      }
      acc[preset.category].push(preset);
      return acc;
    },
    {} as Record<string, CTAColorPreset[]>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add CTA Button</DialogTitle>
          <DialogDescription>
            Create a call-to-action button with custom text and colors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Button Text */}
          <div className="space-y-2">
            <Label htmlFor="button-text">
              Button Text <span className="text-red-500">*</span>
            </Label>
            <Input
              id="button-text"
              placeholder="Buy Now, Learn More, Shop Now..."
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
            />
          </div>

          {/* Button URL */}
          <div className="space-y-2">
            <Label htmlFor="button-url">
              Button URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="button-url"
              placeholder="/products/slug, https://wa.me/..., https://shopee.com/..."
              value={buttonUrl}
              onChange={(e) => setButtonUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Supports product links, WhatsApp, Shopee, or any URL
            </p>
          </div>

          {/* Color Selection */}
          <div className="space-y-4">
            <Label>Button Colors</Label>

            {/* Brand Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quick Colors (Brand Palette)</span>
                {!useCustomColor && selectedPreset && (
                  <span className="text-xs text-muted-foreground">
                    {selectedPreset.name}
                  </span>
                )}
              </div>

              {Object.entries(presetsByCategory).map(([category, presets]) => (
                <div key={category} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {COLOR_CATEGORIES[category as keyof typeof COLOR_CATEGORIES]}
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className={cn(
                          'relative h-12 rounded-md transition-all hover:scale-105',
                          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                          !useCustomColor && selectedPreset?.id === preset.id &&
                            'ring-2 ring-primary ring-offset-2'
                        )}
                        style={{
                          backgroundColor: preset.backgroundColor,
                          border: preset.borderColor
                            ? `2px solid ${preset.borderColor}`
                            : 'none',
                        }}
                        title={`${preset.name} - ${preset.description}`}
                      >
                        {!useCustomColor && selectedPreset?.id === preset.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check
                              className="h-5 w-5"
                              style={{ color: preset.textColor }}
                            />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Color Section */}
            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCustomColor}
                className="w-full"
              >
                <Palette className="h-4 w-4 mr-2" />
                Use Custom Colors
              </Button>

              {useCustomColor && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Background Color */}
                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowBgPicker(!showBgPicker)}
                          className="w-12 h-10 rounded border-2 border-gray-300 hover:border-primary transition-colors"
                          style={{ backgroundColor: customBgColor }}
                        />
                        <Input
                          value={customBgColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (isValidHexColor(val) || val.startsWith('#')) {
                              handleBgColorChange(val);
                            }
                          }}
                          placeholder="#000000"
                          className="font-mono"
                        />
                      </div>
                      {showBgPicker && (
                        <div className="relative">
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowBgPicker(false)}
                          />
                          <div className="relative z-20">
                            <HexColorPicker
                              color={customBgColor}
                              onChange={handleBgColorChange}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Text Color */}
                    <div className="space-y-2">
                      <Label>Text Color</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowTextPicker(!showTextPicker)}
                          className="w-12 h-10 rounded border-2 border-gray-300 hover:border-primary transition-colors"
                          style={{ backgroundColor: customTextColor }}
                        />
                        <Input
                          value={customTextColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (isValidHexColor(val) || val.startsWith('#')) {
                              setCustomTextColor(val);
                            }
                          }}
                          placeholder="#FFFFFF"
                          className="font-mono"
                        />
                      </div>
                      {showTextPicker && (
                        <div className="relative">
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowTextPicker(false)}
                          />
                          <div className="relative z-20">
                            <HexColorPicker
                              color={customTextColor}
                              onChange={setCustomTextColor}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contrast Warning */}
                  {!contrastOk && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>
                        <strong>Accessibility Warning:</strong> Text may be hard to
                        read on this background. Consider adjusting colors for better
                        contrast.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-6 bg-gray-50 rounded-lg flex items-center justify-center">
              <a
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 font-semibold rounded-md transition-all hover:opacity-90 cursor-default"
                style={
                  borderColor
                    ? {
                        backgroundColor,
                        color: textColor,
                        border: `2px solid ${borderColor}`,
                        minWidth: '140px',
                      }
                    : {
                        backgroundColor,
                        color: textColor,
                        minWidth: '140px',
                      }
                }
                onClick={(e) => e.preventDefault()}
              >
                {buttonText || 'Button Preview'}
              </a>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleInsert}>
            Insert Button
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
