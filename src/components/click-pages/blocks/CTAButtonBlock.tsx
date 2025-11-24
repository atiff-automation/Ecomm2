'use client';

/**
 * CTA Button Block Component
 * Call-to-action button with customizable styling
 */

import type { CTAButtonBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';

interface CTAButtonBlockComponentProps {
  block: CTAButtonBlock;
  onClick?: (targetUrl?: string) => void;
}

const SIZE_MAP = {
  sm: 'px-4 py-2 text-sm',
  default: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const ALIGNMENT_MAP = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

const VARIANT_MAP = {
  default: 'bg-black text-white hover:bg-gray-800',
  outline: 'bg-transparent border-2 border-black text-black hover:bg-gray-100',
  ghost: 'bg-transparent text-black hover:bg-gray-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
};

export function CTAButtonBlockComponent({ block, onClick }: CTAButtonBlockComponentProps) {
  const { settings } = block;

  const handleClick = () => {
    onClick?.(settings.url);
    if (settings.url) {
      if (settings.openInNewTab) {
        window.open(settings.url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = settings.url;
      }
    }
  };

  // Note: Padding/margin are applied by BlockRenderer wrapper via settings.styles.spacing
  return (
    <div className={cn('flex', ALIGNMENT_MAP[settings.alignment])}>
      <button
        onClick={handleClick}
        className={cn(
          'font-semibold rounded-lg transition-all duration-200 hover:scale-105',
          SIZE_MAP[settings.size],
          VARIANT_MAP[settings.variant]
        )}
      >
        {settings.text}
      </button>
    </div>
  );
}

export default CTAButtonBlockComponent;
