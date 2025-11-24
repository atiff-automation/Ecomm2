'use client';

/**
 * Animation Controls Component
 * Entrance animations with scroll triggers and presets
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ANIMATION_EASINGS, ANIMATION_DURATIONS } from '@/lib/constants/click-page-style-constants';
import type { AnimationSettings, AnimationType, AnimationTrigger } from '@/types/click-page-styles.types';

interface AnimationControlsProps {
  value: AnimationSettings;
  onChange: (value: AnimationSettings) => void;
  className?: string;
}

/**
 * Default animation settings
 */
const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
  enabled: false,
  type: 'fadeIn',
  trigger: 'onScroll',
  duration: 500,
  delay: 0,
  easing: 'ease',
  repeat: false,
};

/**
 * Animation type presets with descriptions
 */
const ANIMATION_TYPES: Array<{ value: AnimationType; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No animation' },
  { value: 'fadeIn', label: 'Fade In', description: 'Fade in from transparent' },
  { value: 'fadeInUp', label: 'Fade In Up', description: 'Fade in while moving up' },
  { value: 'fadeInDown', label: 'Fade In Down', description: 'Fade in while moving down' },
  { value: 'fadeInLeft', label: 'Fade In Left', description: 'Fade in from left' },
  { value: 'fadeInRight', label: 'Fade In Right', description: 'Fade in from right' },
  { value: 'slideInUp', label: 'Slide In Up', description: 'Slide up from bottom' },
  { value: 'slideInDown', label: 'Slide In Down', description: 'Slide down from top' },
  { value: 'slideInLeft', label: 'Slide In Left', description: 'Slide in from left' },
  { value: 'slideInRight', label: 'Slide In Right', description: 'Slide in from right' },
  { value: 'zoomIn', label: 'Zoom In', description: 'Scale up from small' },
  { value: 'bounce', label: 'Bounce', description: 'Bounce effect' },
  { value: 'pulse', label: 'Pulse', description: 'Pulse effect' },
];

/**
 * Animation trigger options
 */
const ANIMATION_TRIGGERS: Array<{ value: AnimationTrigger; label: string; description: string }> = [
  { value: 'onLoad', label: 'On Page Load', description: 'Animate immediately when page loads' },
  { value: 'onScroll', label: 'On Scroll Into View', description: 'Animate when scrolled into viewport' },
  { value: 'onHover', label: 'On Hover', description: 'Animate on mouse hover' },
];

export function AnimationControls({
  value = DEFAULT_ANIMATION_SETTINGS,
  onChange,
  className = '',
}: AnimationControlsProps) {
  /**
   * Update animation property
   */
  const updateProperty = <K extends keyof AnimationSettings>(
    key: K,
    val: AnimationSettings[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Enable Animations */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="animationEnabled"
          checked={value.enabled}
          onCheckedChange={(checked) => updateProperty('enabled', checked as boolean)}
        />
        <Label htmlFor="animationEnabled" className="text-sm font-medium cursor-pointer">
          Enable Entrance Animation
        </Label>
      </div>

      {value.enabled && (
        <div className="space-y-4 pl-6 border-l-2 border-gray-200">
          {/* Animation Type */}
          <div>
            <Label className="text-sm">Animation Type</Label>
            <Select
              value={value.type}
              onValueChange={(val) => updateProperty('type', val as AnimationType)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {ANIMATION_TYPES.map((anim) => (
                  <SelectItem key={anim.value} value={anim.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{anim.label}</span>
                      <span className="text-xs text-gray-500">{anim.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trigger */}
          <div>
            <Label className="text-sm">Animation Trigger</Label>
            <Select
              value={value.trigger}
              onValueChange={(val) => updateProperty('trigger', val as AnimationTrigger)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANIMATION_TRIGGERS.map((trigger) => (
                  <SelectItem key={trigger.value} value={trigger.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{trigger.label}</span>
                      <span className="text-xs text-gray-500">{trigger.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration and Delay */}
          <div className="grid grid-cols-2 gap-3">
            {/* Duration */}
            <div>
              <Label className="text-sm">Duration</Label>
              <Select
                value={value.duration.toString()}
                onValueChange={(val) => updateProperty('duration', Number(val))}
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
                  <SelectItem value="1500">Ultra Slow (1500ms)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Delay */}
            <div>
              <Label className="text-sm">Delay (ms)</Label>
              <Input
                type="number"
                value={value.delay}
                onChange={(e) => updateProperty('delay', Number(e.target.value))}
                min={0}
                max={5000}
                step={100}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>

          {/* Easing */}
          <div>
            <Label className="text-sm">Easing Function</Label>
            <Select
              value={value.easing}
              onValueChange={(val) =>
                updateProperty('easing', val as AnimationSettings['easing'])
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

          {/* Repeat Settings */}
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="animationRepeat"
                checked={value.repeat}
                onCheckedChange={(checked) => updateProperty('repeat', checked as boolean)}
              />
              <Label htmlFor="animationRepeat" className="text-sm cursor-pointer">
                Repeat Animation
              </Label>
            </div>

            {value.repeat && (
              <div className="pl-6">
                <Label className="text-sm">Repeat Count</Label>
                <Input
                  type="number"
                  value={value.repeatCount || 0}
                  onChange={(e) => updateProperty('repeatCount', Number(e.target.value))}
                  min={0}
                  max={10}
                  step={1}
                  placeholder="0 = infinite"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  0 = infinite loop, 1-10 = specific count
                </p>
              </div>
            )}
          </div>

          {/* Preview Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Animation preview will be available when viewing the
              published page. Animations will trigger based on the selected trigger type.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
