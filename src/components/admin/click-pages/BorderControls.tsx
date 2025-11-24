'use client';

/**
 * Border Controls Component
 * Border width, style, color, and radius controls with lock mechanisms
 */

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
import { Lock, Unlock } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import type {
  BorderSettings,
  BorderStyle,
  BrandColors,
} from '@/types/click-page-styles.types';

interface BorderControlsProps {
  value: BorderSettings;
  onChange: (value: BorderSettings) => void;
  brandColors?: BrandColors;
  className?: string;
}

type BorderSide = 'top' | 'right' | 'bottom' | 'left';
type BorderRadiusCorner = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

export function BorderControls({
  value,
  onChange,
  brandColors,
  className = '',
}: BorderControlsProps) {
  /**
   * Handle border width change
   */
  const handleWidthChange = (side: BorderSide, newValue: number) => {
    if (value.width.locked) {
      // If locked, update all sides
      onChange({
        ...value,
        width: {
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
        width: {
          ...value.width,
          [side]: newValue,
        },
      });
    }
  };

  /**
   * Handle border radius change
   */
  const handleRadiusChange = (corner: BorderRadiusCorner, newValue: number) => {
    if (value.radius.locked) {
      // If locked, update all corners
      onChange({
        ...value,
        radius: {
          topLeft: newValue,
          topRight: newValue,
          bottomRight: newValue,
          bottomLeft: newValue,
          locked: true,
        },
      });
    } else {
      // If unlocked, update only the specified corner
      onChange({
        ...value,
        radius: {
          ...value.radius,
          [corner]: newValue,
        },
      });
    }
  };

  /**
   * Toggle width lock
   */
  const handleWidthLockToggle = () => {
    const newLocked = !value.width.locked;
    if (newLocked) {
      onChange({
        ...value,
        width: {
          top: value.width.top,
          right: value.width.top,
          bottom: value.width.top,
          left: value.width.top,
          locked: true,
        },
      });
    } else {
      onChange({
        ...value,
        width: {
          ...value.width,
          locked: false,
        },
      });
    }
  };

  /**
   * Toggle radius lock
   */
  const handleRadiusLockToggle = () => {
    const newLocked = !value.radius.locked;
    if (newLocked) {
      onChange({
        ...value,
        radius: {
          topLeft: value.radius.topLeft,
          topRight: value.radius.topLeft,
          bottomRight: value.radius.topLeft,
          bottomLeft: value.radius.topLeft,
          locked: true,
        },
      });
    } else {
      onChange({
        ...value,
        radius: {
          ...value.radius,
          locked: false,
        },
      });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Border Style */}
      <div>
        <Label className="text-sm">Border Style</Label>
        <Select
          value={value.style}
          onValueChange={(val) =>
            onChange({ ...value, style: val as BorderStyle })
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="dashed">Dashed</SelectItem>
            <SelectItem value="dotted">Dotted</SelectItem>
            <SelectItem value="double">Double</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Border Width */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Border Width</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleWidthLockToggle}
            className="h-8 px-2"
          >
            {value.width.locked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </Button>
        </div>

        {value.width.locked ? (
          /* Locked: Single input */
          <div>
            <Label className="text-xs text-gray-500">All Sides (px)</Label>
            <Input
              type="number"
              value={value.width.top}
              onChange={(e) => handleWidthChange('top', Number(e.target.value))}
              min={0}
              max={20}
              step={1}
              className="mt-1"
            />
          </div>
        ) : (
          /* Unlocked: Individual inputs */
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">Top (px)</Label>
              <Input
                type="number"
                value={value.width.top}
                onChange={(e) => handleWidthChange('top', Number(e.target.value))}
                min={0}
                max={20}
                step={1}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Right (px)</Label>
              <Input
                type="number"
                value={value.width.right}
                onChange={(e) => handleWidthChange('right', Number(e.target.value))}
                min={0}
                max={20}
                step={1}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Bottom (px)</Label>
              <Input
                type="number"
                value={value.width.bottom}
                onChange={(e) => handleWidthChange('bottom', Number(e.target.value))}
                min={0}
                max={20}
                step={1}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Left (px)</Label>
              <Input
                type="number"
                value={value.width.left}
                onChange={(e) => handleWidthChange('left', Number(e.target.value))}
                min={0}
                max={20}
                step={1}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Border Color */}
      <ColorPicker
        label="Border Color"
        value={value.color}
        onChange={(color) => onChange({ ...value, color })}
        showOpacity={true}
        brandColors={brandColors}
      />

      {/* Border Radius */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Border Radius</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRadiusLockToggle}
            className="h-8 px-2"
          >
            {value.radius.locked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </Button>
        </div>

        {value.radius.locked ? (
          /* Locked: Single input */
          <div>
            <Label className="text-xs text-gray-500">All Corners (px)</Label>
            <Input
              type="number"
              value={value.radius.topLeft}
              onChange={(e) => handleRadiusChange('topLeft', Number(e.target.value))}
              min={0}
              max={100}
              step={1}
              className="mt-1"
            />
          </div>
        ) : (
          /* Unlocked: Individual inputs */
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">Top Left (px)</Label>
              <Input
                type="number"
                value={value.radius.topLeft}
                onChange={(e) => handleRadiusChange('topLeft', Number(e.target.value))}
                min={0}
                max={100}
                step={1}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Top Right (px)</Label>
              <Input
                type="number"
                value={value.radius.topRight}
                onChange={(e) => handleRadiusChange('topRight', Number(e.target.value))}
                min={0}
                max={100}
                step={1}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Bottom Right (px)</Label>
              <Input
                type="number"
                value={value.radius.bottomRight}
                onChange={(e) => handleRadiusChange('bottomRight', Number(e.target.value))}
                min={0}
                max={100}
                step={1}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Bottom Left (px)</Label>
              <Input
                type="number"
                value={value.radius.bottomLeft}
                onChange={(e) => handleRadiusChange('bottomLeft', Number(e.target.value))}
                min={0}
                max={100}
                step={1}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
