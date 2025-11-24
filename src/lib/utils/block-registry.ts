/**
 * Block Registry - Central registry for all block types
 * Provides default settings, metadata, and utility functions for blocks
 */

import type {
  BlockType,
  Block,
  BlockDefinition,
  BlockRegistry as BlockRegistryType,
  HeroBlock,
  TextBlock,
  CTAButtonBlock,
  ImageBlock,
  SpacerBlock,
  DividerBlock,
  PricingTableBlock,
  TestimonialBlock,
  CountdownTimerBlock,
  SocialProofBlock,
} from '@/types/click-page.types';
import {
  CLICK_PAGE_CONSTANTS,
  generateBlockId,
} from '@/lib/constants/click-page-constants';

/**
 * Block Registry - Maps block types to their definitions
 */
export const BLOCK_REGISTRY: BlockRegistryType = {
  HERO: {
    type: 'HERO',
    label: 'Hero Section',
    description: 'Large banner with title, CTA, and optional countdown',
    icon: 'Sparkles',
    category: 'cta',
    defaultSettings: CLICK_PAGE_CONSTANTS.BLOCKS.DEFAULT_SETTINGS.HERO,
  },
  TEXT: {
    type: 'TEXT',
    label: 'Text Block',
    description: 'Rich text content with formatting',
    icon: 'Type',
    category: 'content',
    defaultSettings: CLICK_PAGE_CONSTANTS.BLOCKS.DEFAULT_SETTINGS.TEXT,
  },
  CTA_BUTTON: {
    type: 'CTA_BUTTON',
    label: 'CTA Button',
    description: 'Call-to-action button',
    icon: 'MousePointer2',
    category: 'cta',
    defaultSettings: CLICK_PAGE_CONSTANTS.BLOCKS.DEFAULT_SETTINGS.CTA_BUTTON,
  },
  IMAGE: {
    type: 'IMAGE',
    label: 'Image',
    description: 'Image with optional caption and link',
    icon: 'Image',
    category: 'media',
    defaultSettings: CLICK_PAGE_CONSTANTS.BLOCKS.DEFAULT_SETTINGS.IMAGE,
  },
  SPACER: {
    type: 'SPACER',
    label: 'Spacer',
    description: 'Vertical spacing',
    icon: 'SeparatorVertical',
    category: 'layout',
    defaultSettings: CLICK_PAGE_CONSTANTS.BLOCKS.DEFAULT_SETTINGS.SPACER,
  },
  DIVIDER: {
    type: 'DIVIDER',
    label: 'Divider',
    description: 'Visual separator line',
    icon: 'Minus',
    category: 'layout',
    defaultSettings: CLICK_PAGE_CONSTANTS.BLOCKS.DEFAULT_SETTINGS.DIVIDER,
  },
  PRICING_TABLE: {
    type: 'PRICING_TABLE',
    label: 'Pricing Table',
    description: 'Product pricing with tiers',
    icon: 'DollarSign',
    category: 'cta',
    defaultSettings: CLICK_PAGE_CONSTANTS.BLOCKS.DEFAULT_SETTINGS.PRICING_TABLE,
  },
  TESTIMONIAL: {
    type: 'TESTIMONIAL',
    label: 'Testimonial',
    description: 'Customer reviews and testimonials',
    icon: 'MessageSquareQuote',
    category: 'social',
    defaultSettings: CLICK_PAGE_CONSTANTS.BLOCKS.DEFAULT_SETTINGS.TESTIMONIAL,
  },
  COUNTDOWN_TIMER: {
    type: 'COUNTDOWN_TIMER',
    label: 'Countdown Timer',
    description: 'Urgency timer for promotions',
    icon: 'Timer',
    category: 'cta',
    defaultSettings: CLICK_PAGE_CONSTANTS.BLOCKS.DEFAULT_SETTINGS.COUNTDOWN_TIMER,
  },
  SOCIAL_PROOF: {
    type: 'SOCIAL_PROOF',
    label: 'Social Proof',
    description: 'Stats, badges, and trust signals',
    icon: 'Award',
    category: 'social',
    defaultSettings: CLICK_PAGE_CONSTANTS.BLOCKS.DEFAULT_SETTINGS.SOCIAL_PROOF,
  },
};

/**
 * Get block definition by type
 * @param type Block type
 * @returns Block definition
 */
export function getBlockDefinition(type: BlockType): BlockDefinition {
  return BLOCK_REGISTRY[type];
}

/**
 * Get all block definitions
 * @returns Array of all block definitions
 */
export function getAllBlockDefinitions(): BlockDefinition[] {
  return Object.values(BLOCK_REGISTRY);
}

/**
 * Get block definitions by category
 * @param category Block category
 * @returns Array of block definitions in the category
 */
export function getBlockDefinitionsByCategory(
  category: 'content' | 'media' | 'cta' | 'social' | 'layout'
): BlockDefinition[] {
  return getAllBlockDefinitions().filter((def) => def.category === category);
}

/**
 * Create a new block with default settings
 * @param type Block type
 * @param sortOrder Sort order for the block
 * @returns New block with default settings
 */
export function createDefaultBlock(type: BlockType, sortOrder: number = 0): Block {
  const definition = getBlockDefinition(type);
  const id = generateBlockId();

  // Type-safe block creation with discriminated union
  switch (type) {
    case 'HERO':
      return {
        id,
        type: 'HERO',
        sortOrder,
        settings: definition.defaultSettings,
      } as HeroBlock;

    case 'TEXT':
      return {
        id,
        type: 'TEXT',
        sortOrder,
        settings: definition.defaultSettings,
      } as TextBlock;

    case 'CTA_BUTTON':
      return {
        id,
        type: 'CTA_BUTTON',
        sortOrder,
        settings: definition.defaultSettings,
      } as CTAButtonBlock;

    case 'IMAGE':
      return {
        id,
        type: 'IMAGE',
        sortOrder,
        settings: definition.defaultSettings,
      } as ImageBlock;

    case 'SPACER':
      return {
        id,
        type: 'SPACER',
        sortOrder,
        settings: definition.defaultSettings,
      } as SpacerBlock;

    case 'DIVIDER':
      return {
        id,
        type: 'DIVIDER',
        sortOrder,
        settings: definition.defaultSettings,
      } as DividerBlock;

    case 'PRICING_TABLE':
      return {
        id,
        type: 'PRICING_TABLE',
        sortOrder,
        settings: definition.defaultSettings,
      } as PricingTableBlock;

    case 'TESTIMONIAL':
      return {
        id,
        type: 'TESTIMONIAL',
        sortOrder,
        settings: definition.defaultSettings,
      } as TestimonialBlock;

    case 'COUNTDOWN_TIMER':
      return {
        id,
        type: 'COUNTDOWN_TIMER',
        sortOrder,
        settings: definition.defaultSettings,
      } as CountdownTimerBlock;

    case 'SOCIAL_PROOF':
      return {
        id,
        type: 'SOCIAL_PROOF',
        sortOrder,
        settings: definition.defaultSettings,
      } as SocialProofBlock;

    default:
      // This should never happen due to TypeScript exhaustiveness checking
      throw new Error(`Unknown block type: ${type}`);
  }
}

/**
 * Duplicate a block with a new ID
 * @param block Block to duplicate
 * @returns Duplicated block with new ID
 */
export function duplicateBlock(block: Block): Block {
  return {
    ...block,
    id: generateBlockId(),
  };
}

/**
 * Reorder blocks by updating sort orders
 * @param blocks Array of blocks
 * @param fromIndex Current index
 * @param toIndex Target index
 * @returns Reordered blocks
 */
export function reorderBlocks(
  blocks: Block[],
  fromIndex: number,
  toIndex: number
): Block[] {
  const result = Array.from(blocks);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  // Update sort orders
  return result.map((block, index) => ({
    ...block,
    sortOrder: index,
  }));
}

/**
 * Validate block structure
 * @param block Block to validate
 * @returns True if valid
 */
export function isValidBlock(block: unknown): block is Block {
  if (typeof block !== 'object' || block === null) {
    return false;
  }

  const b = block as Partial<Block>;

  // Check required fields
  if (!b.id || !b.type || typeof b.sortOrder !== 'number' || !b.settings) {
    return false;
  }

  // Check if type is valid
  if (!BLOCK_REGISTRY[b.type as BlockType]) {
    return false;
  }

  return true;
}

/**
 * Get blocks grouped by category
 * @param blocks Array of blocks
 * @returns Blocks grouped by category
 */
export function getBlocksByCategory(blocks: Block[]): Record<string, Block[]> {
  return blocks.reduce(
    (acc, block) => {
      const definition = getBlockDefinition(block.type);
      const category = definition.category;

      if (!acc[category]) {
        acc[category] = [];
      }

      acc[category].push(block);
      return acc;
    },
    {} as Record<string, Block[]>
  );
}

/**
 * Count blocks by type
 * @param blocks Array of blocks
 * @returns Block count by type
 */
export function countBlocksByType(blocks: Block[]): Record<BlockType, number> {
  const counts = {} as Record<BlockType, number>;

  // Initialize counts
  Object.keys(BLOCK_REGISTRY).forEach((type) => {
    counts[type as BlockType] = 0;
  });

  // Count blocks
  blocks.forEach((block) => {
    counts[block.type] = (counts[block.type] || 0) + 1;
  });

  return counts;
}

/**
 * Find block by ID
 * @param blocks Array of blocks
 * @param id Block ID
 * @returns Block if found, undefined otherwise
 */
export function findBlockById(blocks: Block[], id: string): Block | undefined {
  return blocks.find((block) => block.id === id);
}

/**
 * Remove block by ID
 * @param blocks Array of blocks
 * @param id Block ID
 * @returns Blocks with the specified block removed
 */
export function removeBlockById(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((block) => block.id !== id)
    .map((block, index) => ({
      ...block,
      sortOrder: index,
    }));
}

/**
 * Update block by ID
 * @param blocks Array of blocks
 * @param id Block ID
 * @param updates Partial block updates
 * @returns Blocks with the specified block updated
 */
export function updateBlockById(
  blocks: Block[],
  id: string,
  updates: Partial<Block>
): Block[] {
  return blocks.map((block) =>
    block.id === id ? { ...block, ...updates } : block
  );
}
