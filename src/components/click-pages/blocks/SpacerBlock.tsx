'use client';

/**
 * Spacer Block Component
 * Vertical spacing between blocks
 */

import type { SpacerBlock } from '@/types/click-page.types';

interface SpacerBlockComponentProps {
  block: SpacerBlock;
}

export function SpacerBlockComponent({ block }: SpacerBlockComponentProps) {
  const { settings } = block;

  return (
    <div
      style={{ height: `${settings.height}px` }}
      aria-hidden="true"
    />
  );
}

export default SpacerBlockComponent;
