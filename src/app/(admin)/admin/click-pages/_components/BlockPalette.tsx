'use client';

/**
 * Block Palette Component
 * Sidebar with draggable block types organized by category
 */

import {
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CLICK_PAGE_CONSTANTS } from '@/lib/constants/click-page-constants';
import type { BlockType } from '@/types/click-page.types';

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
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

// Organize blocks by category
const BLOCK_CATEGORIES = [
  {
    key: 'cta',
    label: 'Call to Action',
    blocks: ['HERO', 'CTA_BUTTON', 'PRICING_TABLE', 'COUNTDOWN_TIMER'] as BlockType[],
  },
  {
    key: 'content',
    label: 'Content',
    blocks: ['TEXT'] as BlockType[],
  },
  {
    key: 'media',
    label: 'Media',
    blocks: ['IMAGE'] as BlockType[],
  },
  {
    key: 'layout',
    label: 'Layout',
    blocks: ['SPACER', 'DIVIDER'] as BlockType[],
  },
  {
    key: 'social',
    label: 'Social Proof',
    blocks: ['TESTIMONIAL', 'SOCIAL_PROOF'] as BlockType[],
  },
];

export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  const blockTypes = CLICK_PAGE_CONSTANTS.BLOCKS.TYPES;

  return (
    <div className="space-y-4">
      {BLOCK_CATEGORIES.map((category) => (
        <div key={category.key}>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {category.label}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {category.blocks.map((blockType) => {
              const blockDef = blockTypes[blockType];
              const IconComponent = BLOCK_ICONS[blockDef.icon];

              return (
                <Button
                  key={blockType}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 px-2 flex flex-col items-center gap-1 text-xs hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => onAddBlock(blockType)}
                >
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                  <span className="truncate w-full text-center">{blockDef.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
