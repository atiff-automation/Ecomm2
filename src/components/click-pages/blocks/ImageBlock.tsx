'use client';

/**
 * Image Block Component
 * Image with optional caption and link
 */

import type { ImageBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageBlockComponentProps {
  block: ImageBlock;
  onClick?: (targetUrl?: string) => void;
}

const WIDTH_MAP = {
  small: 'max-w-sm',
  medium: 'max-w-md',
  large: 'max-w-lg',
  full: 'max-w-full',
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

  const imageContent = (
    <div
      className={cn(
        'w-full',
        WIDTH_MAP[settings.width],
        ALIGNMENT_MAP[settings.alignment]
      )}
    >
      <div className={cn('relative overflow-hidden', isRounded && 'rounded-lg')}>
        {settings.url ? (
          <Image
            src={settings.url}
            alt={settings.altText}
            width={1200}
            height={800}
            className="w-full h-auto object-cover"
          />
        ) : (
          <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </div>
      {settings.caption && (
        <p className="mt-2 text-sm text-gray-600 text-center">{settings.caption}</p>
      )}
    </div>
  );

  // Note: Padding/margin are applied by BlockRenderer wrapper via settings.styles.spacing
  // Do NOT add hardcoded padding here - it overrides user's spacing settings
  return (
    <div>
      {settings.link ? (
        <button onClick={handleClick} className="block w-full cursor-pointer">
          {imageContent}
        </button>
      ) : (
        imageContent
      )}
    </div>
  );
}

export default ImageBlockComponent;
