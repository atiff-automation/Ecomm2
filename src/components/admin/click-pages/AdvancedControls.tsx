'use client';

/**
 * Advanced Controls Component
 * Custom CSS, classes, and advanced styling options
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import type { AdvancedSettings } from '@/types/click-page-styles.types';

interface AdvancedControlsProps {
  value: AdvancedSettings;
  onChange: (value: AdvancedSettings) => void;
  className?: string;
}

/**
 * Default advanced settings
 */
const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  customCSS: '',
  customClasses: [],
  zIndex: 1,
  display: 'block',
  position: 'static',
  overflow: 'visible',
};

export function AdvancedControls({
  value = DEFAULT_ADVANCED_SETTINGS,
  onChange,
  className = '',
}: AdvancedControlsProps) {
  const [newClass, setNewClass] = useState('');

  /**
   * Update advanced property
   */
  const updateProperty = <K extends keyof AdvancedSettings>(
    key: K,
    val: AdvancedSettings[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  /**
   * Add a new custom class
   */
  const addCustomClass = () => {
    if (newClass.trim()) {
      const classes = value.customClasses || [];
      if (!classes.includes(newClass.trim())) {
        updateProperty('customClasses', [...classes, newClass.trim()]);
        setNewClass('');
      }
    }
  };

  /**
   * Remove a custom class
   */
  const removeCustomClass = (classToRemove: string) => {
    const classes = value.customClasses || [];
    updateProperty(
      'customClasses',
      classes.filter((c) => c !== classToRemove)
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Custom CSS */}
      <div>
        <Label className="text-sm font-medium">Custom CSS</Label>
        <p className="text-xs text-gray-500 mb-2">
          Add custom CSS rules for this block. Use standard CSS syntax.
        </p>
        <Textarea
          value={value.customCSS || ''}
          onChange={(e) => updateProperty('customCSS', e.target.value)}
          placeholder={`/* Example:
.my-block {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
*/`}
          className="font-mono text-sm min-h-[150px]"
        />
        <p className="text-xs text-gray-400 mt-1">
          These styles will be applied inline to the block element.
        </p>
      </div>

      {/* Custom CSS Classes */}
      <div>
        <Label className="text-sm font-medium">Custom CSS Classes</Label>
        <p className="text-xs text-gray-500 mb-2">
          Add reusable CSS classes to this block.
        </p>

        {/* Existing Classes */}
        {value.customClasses && value.customClasses.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {value.customClasses.map((cls) => (
              <div
                key={cls}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm"
              >
                <span className="font-mono">{cls}</span>
                <button
                  type="button"
                  onClick={() => removeCustomClass(cls)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Class */}
        <div className="flex gap-2">
          <Input
            type="text"
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomClass();
              }
            }}
            placeholder="my-custom-class"
            className="font-mono flex-1"
          />
          <Button
            type="button"
            onClick={addCustomClass}
            variant="outline"
            size="sm"
            className="px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Press Enter or click + to add a class. Ensure these classes are
          defined in your global CSS.
        </p>
      </div>

      {/* Display Properties */}
      <div className="space-y-4 border-t pt-4">
        <h5 className="text-sm font-semibold text-gray-700">Display Properties</h5>

        {/* Display Type */}
        <div>
          <Label className="text-xs text-gray-500">Display</Label>
          <Select
            value={value.display || 'block'}
            onValueChange={(val) =>
              updateProperty('display', val as AdvancedSettings['display'])
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="block">Block</SelectItem>
              <SelectItem value="flex">Flex</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="inline">Inline</SelectItem>
              <SelectItem value="inline-block">Inline Block</SelectItem>
              <SelectItem value="none">None (Hidden)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Position */}
        <div>
          <Label className="text-xs text-gray-500">Position</Label>
          <Select
            value={value.position || 'static'}
            onValueChange={(val) =>
              updateProperty('position', val as AdvancedSettings['position'])
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="relative">Relative</SelectItem>
              <SelectItem value="absolute">Absolute</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="sticky">Sticky</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Z-Index */}
        <div>
          <Label className="text-xs text-gray-500">Z-Index</Label>
          <Input
            type="number"
            value={value.zIndex || 1}
            onChange={(e) => updateProperty('zIndex', Number(e.target.value))}
            min={-100}
            max={9999}
            step={1}
            className="mt-1"
          />
          <p className="text-xs text-gray-400 mt-1">
            Controls stacking order (higher values appear on top)
          </p>
        </div>

        {/* Overflow */}
        <div>
          <Label className="text-xs text-gray-500">Overflow</Label>
          <Select
            value={value.overflow || 'visible'}
            onValueChange={(val) =>
              updateProperty('overflow', val as AdvancedSettings['overflow'])
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visible">Visible</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="scroll">Scroll</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-xs text-yellow-800">
          <strong>Advanced Warning:</strong> Custom CSS and advanced settings can
          affect page layout and performance. Test thoroughly before publishing.
          Invalid CSS may break the page appearance.
        </p>
      </div>
    </div>
  );
}
