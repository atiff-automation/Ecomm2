'use client';

/**
 * Image Block Component
 * Image with optional caption and link
 */

import type { ImageBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';

interface ImageBlockComponentProps {
  block: ImageBlock;
  onClick?: (targetUrl?: string) => void;
}

const WIDTH_MAP = {
  small: 'w-full max-w-sm',
  medium: 'w-full max-w-md',
  large: 'w-full max-w-lg',
  full: 'w-full',
};

const ALIGNMENT_MAP = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
};

export function ImageBlockComponent({ block, onClick }: ImageBlockComponentProps) {
  const { settings } = block;

  const handleClick = () => {
    if (settings.link) {
      onClick?.(settings.link);
      window.open(settings.link, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle undefined rounded property (for old blocks) - default to false for sharp corners
  const isRounded = settings.rounded ?? false;

  // Check for fullWidth override from Style tab (takes precedence over Content tab width setting)
  const widthClass = settings.fullWidth ? 'w-full' : WIDTH_MAP[settings.width];
  const alignmentClass = settings.fullWidth ? '' : ALIGNMENT_MAP[settings.alignment];

  // Note: Padding/margin are applied by BlockRenderer wrapper via settings.styles.spacing
  // Do NOT add hardcoded padding here - it overrides user's spacing settings
  return (
    <div className={cn(widthClass, alignmentClass)}>
      <div className={cn('relative overflow-hidden', isRounded && 'rounded-lg')}>
        {settings.url ? (
          <img
            src={settings.url}
            alt={settings.altText}
            className="w-full h-auto"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        {settings.link && (
          <button
            onClick={handleClick}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0 hover:opacity-5 bg-black transition-opacity"
            aria-label={`Link to ${settings.link}`}
          />
        )}
      </div>
      {settings.caption && (
        <p className="mt-2 text-sm text-gray-600 text-center">{settings.caption}</p>
      )}
    </div>
  );
}

export default ImageBlockComponent;
