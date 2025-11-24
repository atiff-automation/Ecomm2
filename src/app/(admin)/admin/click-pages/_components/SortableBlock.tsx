'use client';

/**
 * Sortable Block Component
 * Draggable block wrapper with controls for the canvas
 * Includes style preview indicators
 */

import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Trash2,
  Copy,
  Sparkles,
  Type,
  MousePointer2,
  Image,
  SeparatorVertical,
  Minus,
  DollarSign,
  MessageSquareQuote,
  Timer,
  Award,
  Palette,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CLICK_PAGE_CONSTANTS } from '@/lib/constants/click-page-constants';
import type { Block } from '@/types/click-page.types';
import type { StyleSettings } from '@/types/click-page-styles.types';

interface SortableBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

// Icon mapping for block types
const BLOCK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Type,
  MousePointer2,
  Image,
  SeparatorVertical,
  Minus,
  DollarSign,
  MessageSquareQuote,
  Timer,
  Award,
};

/**
 * Type for block with styles
 */
type BlockWithStyles = Block & {
  settings: {
    styles?: StyleSettings;
  };
};

export function SortableBlock({
  block,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const blockDef = CLICK_PAGE_CONSTANTS.BLOCKS.TYPES[block.type];
  const IconComponent = BLOCK_ICONS[blockDef.icon];

  // Check if block has styles applied
  const blockStyles = (block as BlockWithStyles).settings?.styles;
  const hasStyles = useMemo(() => {
    if (!blockStyles) return { hasAny: false, details: [] as string[] };

    const details: string[] = [];

    if (blockStyles.typography) details.push('Typography');
    if (blockStyles.spacing) details.push('Spacing');
    if (blockStyles.border && blockStyles.border.style !== 'none') details.push('Border');
    if (blockStyles.effects?.boxShadow?.enabled) details.push('Shadow');
    if (blockStyles.effects?.opacity !== undefined && blockStyles.effects.opacity !== 1) {
      details.push('Opacity');
    }
    if (blockStyles.hover?.enabled) details.push('Hover Effects');
    if (blockStyles.animation?.enabled) details.push('Animation');
    if (blockStyles.advanced?.customCSS) details.push('Custom CSS');
    if (blockStyles.responsive?.mobile?.hidden || blockStyles.responsive?.tablet?.hidden || blockStyles.responsive?.desktop?.hidden) {
      details.push('Responsive');
    }

    return { hasAny: details.length > 0, details };
  }, [blockStyles]);

  // Generate preview style from block settings
  const previewStyle = useMemo(() => {
    if (!blockStyles) return {};

    const preview: React.CSSProperties = {};

    // Apply typography color if set
    if (blockStyles.typography?.color) {
      preview.borderLeftColor = blockStyles.typography.color;
      preview.borderLeftWidth = '3px';
      preview.borderLeftStyle = 'solid';
    }

    // Apply background from border color as indicator
    if (blockStyles.border?.color && blockStyles.border.style !== 'none') {
      preview.borderLeftColor = blockStyles.border.color;
      preview.borderLeftWidth = '3px';
      preview.borderLeftStyle = 'solid';
    }

    return preview;
  }, [blockStyles]);

  // Get preview content based on block type
  const getBlockPreview = () => {
    switch (block.type) {
      case 'HERO':
        return block.settings.title || 'Hero Section';
      case 'TEXT':
        // Strip HTML tags for preview
        return block.settings.content.replace(/<[^>]*>/g, '').substring(0, 50) || 'Text Block';
      case 'CTA_BUTTON':
        return block.settings.text || 'Button';
      case 'IMAGE':
        return block.settings.altText || 'Image';
      case 'SPACER':
        return `${block.settings.height}px spacing`;
      case 'DIVIDER':
        return `${block.settings.style} divider`;
      case 'PRICING_TABLE':
        return `${block.settings.tiers.length} tier(s)`;
      case 'TESTIMONIAL':
        return `${block.settings.testimonials.length} testimonial(s)`;
      case 'COUNTDOWN_TIMER':
        return block.settings.title || 'Countdown Timer';
      case 'SOCIAL_PROOF':
        return block.settings.type || 'Social Proof';
      default:
        return blockDef.label;
    }
  };

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={{ ...style, ...previewStyle }}
        className={cn(
          'group relative bg-white border rounded-lg p-3 transition-all cursor-pointer',
          isSelected && 'ring-2 ring-blue-500 border-blue-500',
          isDragging && 'opacity-50 shadow-lg',
          !isSelected && 'hover:border-gray-300',
          hasStyles.hasAny && 'border-l-0 pl-[calc(0.75rem-3px)]'
        )}
        onClick={onSelect}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <button
            className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Block Icon */}
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
            {IconComponent && <IconComponent className="w-4 h-4 text-gray-600" />}
          </div>

          {/* Block Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-900">{blockDef.label}</span>
              {/* Style Indicator */}
              {hasStyles.hasAny && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-100 cursor-help">
                      <Wand2 className="w-2.5 h-2.5 text-purple-600" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-xs">
                      <div className="font-medium mb-1">Custom Styles Applied:</div>
                      <div className="flex flex-wrap gap-1">
                        {hasStyles.details.map((detail) => (
                          <span
                            key={detail}
                            className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-50 text-purple-700"
                          >
                            {detail}
                          </span>
                        ))}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="text-xs text-gray-500 truncate">{getBlockPreview()}</div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
