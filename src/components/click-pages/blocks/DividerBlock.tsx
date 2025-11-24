'use client';

/**
 * Divider Block Component
 * Visual separator line between blocks
 */

import type { DividerBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';

interface DividerBlockComponentProps {
  block: DividerBlock;
}

const STYLE_MAP = {
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
};

export function DividerBlockComponent({ block }: DividerBlockComponentProps) {
  const { settings } = block;

  // Note: Outer padding/margin are applied by BlockRenderer wrapper via settings.styles.spacing
  // The internal spacing prop is for spacing around the divider line itself
  return (
    <div
      style={{ paddingTop: `${settings.spacing}px`, paddingBottom: `${settings.spacing}px` }}
    >
      <hr
        className={cn('border-t-0 w-full', STYLE_MAP[settings.style])}
        style={{
          borderTopWidth: `${settings.thickness}px`,
          borderTopColor: settings.color,
        }}
      />
    </div>
  );
}

export default DividerBlockComponent;
