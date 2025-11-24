'use client';

/**
 * Text Block Component
 * Rich text content with formatting
 * Inherits color from parent wrapper for style customization
 */

import type { TextBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';

interface TextBlockComponentProps {
  block: TextBlock;
}

const ALIGNMENT_MAP = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

export function TextBlockComponent({ block }: TextBlockComponentProps) {
  const { settings } = block;

  // Note: Padding/margin are applied by BlockRenderer wrapper via settings.styles.spacing
  return (
    <div
      className={cn(ALIGNMENT_MAP[settings.textAlign])}
      style={{ color: 'inherit' }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: settings.maxWidth ? `${settings.maxWidth}px` : '800px' }}
      >
        <div
          className="prose prose-lg max-w-none [&_*]:!text-[inherit] prose-headings:!text-[inherit] prose-p:!text-[inherit] prose-strong:!text-[inherit] prose-a:!text-[inherit]"
          style={{ color: 'inherit' }}
          dangerouslySetInnerHTML={{ __html: settings.content }}
        />
      </div>
    </div>
  );
}

export default TextBlockComponent;
