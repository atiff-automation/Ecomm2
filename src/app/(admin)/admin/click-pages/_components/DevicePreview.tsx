'use client';

/**
 * Device Preview Components
 * Provides device mode preview and zoom controls for the editor canvas
 */

import { memo, useEffect, useRef } from 'react';
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
  GRANULAR_ZOOM_LEVELS,
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
   * Handle zoom in (step by 10%)
   */
  const handleZoomIn = () => {
    const currentIndex = GRANULAR_ZOOM_LEVELS.findIndex((level) => level === zoom);
    if (currentIndex < GRANULAR_ZOOM_LEVELS.length - 1) {
      onZoomChange(GRANULAR_ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  /**
   * Handle zoom out (step by 10%)
   */
  const handleZoomOut = () => {
    const currentIndex = GRANULAR_ZOOM_LEVELS.findIndex((level) => level === zoom);
    if (currentIndex > 0) {
      onZoomChange(GRANULAR_ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  const canZoomIn = zoom < GRANULAR_ZOOM_LEVELS[GRANULAR_ZOOM_LEVELS.length - 1];
  const canZoomOut = zoom > GRANULAR_ZOOM_LEVELS[0];

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
            {/* Show all granular zoom levels in dropdown */}
            {GRANULAR_ZOOM_LEVELS.map((level) => (
              <SelectItem key={level} value={level.toString()}>
                {level}%
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
 * Provides responsive viewport with zoom support and pinch-to-zoom
 */
function DevicePreviewComponent({
  mode,
  zoom,
  onZoomChange,
  children,
}: Omit<DevicePreviewProps, 'onModeChange'>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const accumulatedZoomRef = useRef<number>(zoom);
  const zoomRef = useRef<number>(zoom);
  const onZoomChangeRef = useRef<(zoom: number) => void>(onZoomChange);

  // Calculate viewport dimensions
  const deviceWidth = DEVICE_WIDTHS[mode];
  const scale = zoom / 100;

  // Calculate the scaled width for proper spacing
  const scaledWidth = deviceWidth * scale;

  // Keep refs in sync without re-running useEffect
  useEffect(() => {
    accumulatedZoomRef.current = zoom;
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  /**
   * Handle pinch-to-zoom (trackpad gesture)
   * Using document-level listener with refs to avoid re-attaching
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if the event target is within our canvas container
      const target = e.target as Node;
      if (!container.contains(target)) {
        return; // Event is outside our canvas
      }

      // Only handle pinch gesture (Ctrl/Cmd + wheel on Mac trackpad)
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      e.stopPropagation();

      // Calculate zoom delta (negative deltaY = zoom in, positive = zoom out)
      const delta = -e.deltaY;
      const zoomSensitivity = 2; // Increased sensitivity for smoother zooming
      const zoomDelta = delta * zoomSensitivity;

      // Accumulate zoom smoothly
      accumulatedZoomRef.current += zoomDelta;

      // Clamp to granular zoom levels (50% to 150%)
      const minZoom = GRANULAR_ZOOM_LEVELS[0];
      const maxZoom = GRANULAR_ZOOM_LEVELS[GRANULAR_ZOOM_LEVELS.length - 1];
      accumulatedZoomRef.current = Math.max(minZoom, Math.min(maxZoom, accumulatedZoomRef.current));

      // Snap to nearest granular zoom level (every 10%)
      const nearestZoom = GRANULAR_ZOOM_LEVELS.reduce((prev, curr) =>
        Math.abs(curr - accumulatedZoomRef.current) < Math.abs(prev - accumulatedZoomRef.current) ? curr : prev
      );

      // Only update if zoom changed
      if (nearestZoom !== zoomRef.current) {
        onZoomChangeRef.current(nearestZoom);
      }
    };

    // Add event listener to document with passive: false to allow preventDefault
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []); // Empty dependency array - only run once!

  return (
    <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100">
      {/* Wrapper to account for scaled dimensions */}
      <div
        className="flex justify-center items-start"
        style={{
          padding: mode === DEVICE_MODES.DESKTOP ? '40px 10px' : '40px',
          minWidth: `${scaledWidth}px`,
          minHeight: '100%',
        }}
      >
        {/* Scaled viewport */}
        <div
          style={{
            width: `${deviceWidth}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
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
