'use client';

/**
 * Device Preview Components
 * Provides device mode preview and zoom controls for the editor canvas
 */

import { memo } from 'react';
import { Monitor, Tablet, Smartphone, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  DEVICE_MODES,
  DEVICE_WIDTHS,
  DEVICE_LABELS,
  ZOOM_OPTIONS,
  type DeviceMode,
} from '@/lib/constants/editor-constants';
import type { DevicePreviewProps, DevicePreviewToolbarProps } from '@/types/editor.types';

/**
 * Device icon mapping
 */
const DEVICE_ICONS = {
  [DEVICE_MODES.DESKTOP]: Monitor,
  [DEVICE_MODES.TABLET]: Tablet,
  [DEVICE_MODES.MOBILE]: Smartphone,
} as const;

/**
 * Device Preview Toolbar
 * Controls for switching device modes and zoom levels
 */
function DevicePreviewToolbarComponent({
  mode,
  zoom,
  onModeChange,
  onZoomChange,
}: DevicePreviewToolbarProps) {
  /**
   * Handle zoom in
   */
  const handleZoomIn = () => {
    const currentIndex = ZOOM_OPTIONS.findIndex((opt) => opt.value === zoom);
    if (currentIndex < ZOOM_OPTIONS.length - 1) {
      onZoomChange(ZOOM_OPTIONS[currentIndex + 1].value);
    }
  };

  /**
   * Handle zoom out
   */
  const handleZoomOut = () => {
    const currentIndex = ZOOM_OPTIONS.findIndex((opt) => opt.value === zoom);
    if (currentIndex > 0) {
      onZoomChange(ZOOM_OPTIONS[currentIndex - 1].value);
    }
  };

  const canZoomIn = zoom < ZOOM_OPTIONS[ZOOM_OPTIONS.length - 1].value;
  const canZoomOut = zoom > ZOOM_OPTIONS[0].value;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-white border-b">
      {/* Device Mode Selector */}
      <div className="flex items-center gap-1">
        {Object.values(DEVICE_MODES).map((deviceMode) => {
          const Icon = DEVICE_ICONS[deviceMode];
          return (
            <Button
              key={deviceMode}
              variant={mode === deviceMode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onModeChange(deviceMode)}
              className="gap-2"
              title={DEVICE_LABELS[deviceMode]}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{DEVICE_LABELS[deviceMode]}</span>
            </Button>
          );
        })}
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          disabled={!canZoomOut}
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <Select
          value={zoom.toString()}
          onValueChange={(value) => onZoomChange(parseInt(value, 10))}
        >
          <SelectTrigger className="w-24">
            <SelectValue>{zoom}%</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ZOOM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          disabled={!canZoomIn}
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Memoized toolbar export
 */
export const DevicePreviewToolbar = memo(DevicePreviewToolbarComponent);

/**
 * Device Preview Container
 * Provides responsive viewport with zoom support
 */
function DevicePreviewComponent({
  mode,
  zoom,
  children,
}: Omit<DevicePreviewProps, 'onModeChange' | 'onZoomChange'>) {
  // Calculate viewport dimensions
  const deviceWidth = DEVICE_WIDTHS[mode];
  const scale = zoom / 100;

  // Calculate the scaled width for proper spacing
  const scaledWidth = deviceWidth * scale;

  return (
    <div className="flex-1 overflow-auto bg-gray-100 p-6">
      {/* Centered preview container with proper spacing for scaled content */}
      <div
        className="flex justify-center items-start min-h-full mx-auto"
        style={{
          width: `${scaledWidth}px`,
          maxWidth: '100%',
        }}
      >
        {/* Scaled viewport */}
        <div
          className="origin-top-left"
          style={{
            width: `${deviceWidth}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Device frame (optional subtle border) */}
          <div
            className={cn(
              'bg-white rounded-lg shadow-lg overflow-hidden',
              'transition-all duration-300',
              mode === DEVICE_MODES.MOBILE && 'rounded-3xl',
              mode === DEVICE_MODES.TABLET && 'rounded-2xl'
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized preview export
 */
export const DevicePreview = memo(DevicePreviewComponent);
