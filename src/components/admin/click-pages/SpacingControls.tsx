'use client';

/**
 * Spacing Controls Component
 * Padding and margin controls with lock mechanism
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';
import type { SpacingSettings } from '@/types/click-page-styles.types';

interface SpacingControlsProps {
  value: SpacingSettings;
  onChange: (value: SpacingSettings) => void;
  showPadding?: boolean;
  showMargin?: boolean;
  className?: string;
}

type SpacingSide = 'top' | 'right' | 'bottom' | 'left';
type SpacingType = 'padding' | 'margin';

export function SpacingControls({
  value,
  onChange,
  showPadding = true,
  showMargin = true,
  className = '',
}: SpacingControlsProps) {
  /**
   * Handle spacing change for individual side
   */
  const handleSpacingChange = (
    type: SpacingType,
    side: SpacingSide,
    newValue: number
  ) => {
    const spacing = value[type];

    if (spacing.locked) {
      // If locked, update all sides
      onChange({
        ...value,
        [type]: {
          top: newValue,
          right: newValue,
          bottom: newValue,
          left: newValue,
          locked: true,
        },
      });
    } else {
      // If unlocked, update only the specified side
      onChange({
        ...value,
        [type]: {
          ...spacing,
          [side]: newValue,
        },
      });
    }
  };

  /**
   * Toggle lock/unlock for spacing type
   */
  const handleLockToggle = (type: SpacingType) => {
    const spacing = value[type];
    const newLocked = !spacing.locked;

    if (newLocked) {
      // When locking, set all sides to the top value
      onChange({
        ...value,
        [type]: {
          top: spacing.top,
          right: spacing.top,
          bottom: spacing.top,
          left: spacing.top,
          locked: true,
        },
      });
    } else {
      // When unlocking, keep current values
      onChange({
        ...value,
        [type]: {
          ...spacing,
          locked: false,
        },
      });
    }
  };

  /**
   * Render spacing controls for a type (padding or margin)
   */
  const renderSpacingControls = (type: SpacingType) => {
    const spacing = value[type];
    const label = type === 'padding' ? 'Padding' : 'Margin';

    return (
      <div className="space-y-3">
        {/* Header with Lock Toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleLockToggle(type)}
            className="h-8 px-2"
          >
            {spacing.locked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </Button>
        </div>

        {spacing.locked ? (
          /* Locked: Single input for all sides */
          <div>
            <Label className="text-xs text-gray-500">All Sides (px)</Label>
            <Input
              type="number"
              value={spacing.top}
              onChange={(e) =>
                handleSpacingChange(type, 'top', Number(e.target.value))
              }
              min={0}
              max={200}
              step={1}
              className="mt-1"
            />
          </div>
        ) : (
          /* Unlocked: Individual inputs for each side */
          <div className="grid grid-cols-2 gap-2">
            {/* Top */}
            <div>
              <Label className="text-xs text-gray-500">Top (px)</Label>
              <Input
                type="number"
                value={spacing.top}
                onChange={(e) =>
                  handleSpacingChange(type, 'top', Number(e.target.value))
                }
                min={0}
                max={200}
                step={1}
                className="mt-1"
              />
            </div>

            {/* Right */}
            <div>
              <Label className="text-xs text-gray-500">Right (px)</Label>
              <Input
                type="number"
                value={spacing.right}
                onChange={(e) =>
                  handleSpacingChange(type, 'right', Number(e.target.value))
                }
                min={0}
                max={200}
                step={1}
                className="mt-1"
              />
            </div>

            {/* Bottom */}
            <div>
              <Label className="text-xs text-gray-500">Bottom (px)</Label>
              <Input
                type="number"
                value={spacing.bottom}
                onChange={(e) =>
                  handleSpacingChange(type, 'bottom', Number(e.target.value))
                }
                min={0}
                max={200}
                step={1}
                className="mt-1"
              />
            </div>

            {/* Left */}
            <div>
              <Label className="text-xs text-gray-500">Left (px)</Label>
              <Input
                type="number"
                value={spacing.left}
                onChange={(e) =>
                  handleSpacingChange(type, 'left', Number(e.target.value))
                }
                min={0}
                max={200}
                step={1}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {showPadding && renderSpacingControls('padding')}
      {showMargin && renderSpacingControls('margin')}
    </div>
  );
}
