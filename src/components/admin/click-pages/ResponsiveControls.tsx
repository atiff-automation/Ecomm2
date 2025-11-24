'use client';

/**
 * Responsive Controls Component
 * Visibility toggles and responsive breakpoint settings
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { RESPONSIVE_BREAKPOINTS } from '@/lib/constants/click-page-style-constants';
import type { ResponsiveSettings } from '@/types/click-page-styles.types';

interface ResponsiveControlsProps {
  value: ResponsiveSettings;
  onChange: (value: ResponsiveSettings) => void;
  className?: string;
}

/**
 * Default responsive settings
 */
const DEFAULT_RESPONSIVE_SETTINGS: ResponsiveSettings = {
  mobile: { hidden: false },
  tablet: { hidden: false },
  desktop: { hidden: false },
};

export function ResponsiveControls({
  value = DEFAULT_RESPONSIVE_SETTINGS,
  onChange,
  className = '',
}: ResponsiveControlsProps) {
  /**
   * Update visibility for a breakpoint
   */
  const updateVisibility = (
    breakpoint: 'mobile' | 'tablet' | 'desktop',
    hidden: boolean
  ) => {
    onChange({
      ...value,
      [breakpoint]: {
        ...value[breakpoint],
        hidden,
      },
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Visibility Controls</h4>
        <p className="text-xs text-gray-500">
          Control which devices this block appears on
        </p>
      </div>

      {/* Mobile */}
      <div className="flex items-start gap-4 p-4 border rounded-lg">
        <div className="flex-shrink-0 mt-1">
          <Smartphone className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <h5 className="font-medium text-sm">
              {RESPONSIVE_BREAKPOINTS.MOBILE.label}
            </h5>
            <p className="text-xs text-gray-500">
              {RESPONSIVE_BREAKPOINTS.MOBILE.mediaQuery}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="hideMobile"
              checked={value.mobile?.hidden || false}
              onCheckedChange={(checked) =>
                updateVisibility('mobile', checked as boolean)
              }
            />
            <Label htmlFor="hideMobile" className="text-sm cursor-pointer">
              Hide on mobile devices
            </Label>
          </div>
        </div>
      </div>

      {/* Tablet */}
      <div className="flex items-start gap-4 p-4 border rounded-lg">
        <div className="flex-shrink-0 mt-1">
          <Tablet className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <h5 className="font-medium text-sm">
              {RESPONSIVE_BREAKPOINTS.TABLET.label}
            </h5>
            <p className="text-xs text-gray-500">
              {RESPONSIVE_BREAKPOINTS.TABLET.mediaQuery}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="hideTablet"
              checked={value.tablet?.hidden || false}
              onCheckedChange={(checked) =>
                updateVisibility('tablet', checked as boolean)
              }
            />
            <Label htmlFor="hideTablet" className="text-sm cursor-pointer">
              Hide on tablet devices
            </Label>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="flex items-start gap-4 p-4 border rounded-lg">
        <div className="flex-shrink-0 mt-1">
          <Monitor className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <h5 className="font-medium text-sm">
              {RESPONSIVE_BREAKPOINTS.DESKTOP.label}
            </h5>
            <p className="text-xs text-gray-500">
              {RESPONSIVE_BREAKPOINTS.DESKTOP.mediaQuery}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="hideDesktop"
              checked={value.desktop?.hidden || false}
              onCheckedChange={(checked) =>
                updateVisibility('desktop', checked as boolean)
              }
            />
            <Label htmlFor="hideDesktop" className="text-sm cursor-pointer">
              Hide on desktop devices
            </Label>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Responsive style overrides (custom styles per
          breakpoint) will be available in a future update. For now, you can
          control visibility per device.
        </p>
      </div>
    </div>
  );
}
