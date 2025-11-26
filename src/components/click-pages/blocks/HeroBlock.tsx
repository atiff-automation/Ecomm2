'use client';

/**
 * Hero Block Component
 * Large banner with title, subtitle, CTA, and optional countdown
 */

import type { HeroBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';
import { BLOCK_WIDTH_DEFAULTS, getBlockWidthClasses } from '@/lib/constants/click-page-blocks';

interface HeroBlockComponentProps {
  block: HeroBlock;
  onCtaClick?: (targetUrl?: string) => void;
}

const ALIGNMENT_MAP = {
  left: 'text-left items-start',
  center: 'text-center items-center',
  right: 'text-right items-end',
};

export function HeroBlockComponent({ block, onCtaClick }: HeroBlockComponentProps) {
  const { settings } = block;

  const handleCtaClick = () => {
    if (settings.ctaUrl) {
      onCtaClick?.(settings.ctaUrl);
      if (settings.ctaUrl.startsWith('http')) {
        window.open(settings.ctaUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = settings.ctaUrl;
      }
    }
  };

  // Note: Padding/margin are applied by BlockRenderer wrapper via settings.styles.spacing
  // Default min-height ensures hero looks good even without custom spacing
  return (
    <section
      className={cn(
        'relative flex flex-col min-h-[300px] justify-center',
        ALIGNMENT_MAP[settings.textAlignment]
      )}
      style={{
        backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      {settings.overlayOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: settings.overlayOpacity }}
        />
      )}

      <div
        className={cn(
          'relative w-full z-10',
          getBlockWidthClasses(BLOCK_WIDTH_DEFAULTS.HERO, settings.fullWidth),
          ALIGNMENT_MAP[settings.textAlignment].split(' ')[0] // Apply text alignment
        )}
        style={{ color: settings.backgroundImage ? 'white' : 'inherit' }}
      >
        {settings.title && (
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            style={{ color: 'inherit' }}
          >
            {settings.title}
          </h1>
        )}

        {settings.subtitle && (
          <p
            className="text-lg md:text-xl lg:text-2xl mb-4 opacity-90"
            style={{ color: 'inherit' }}
          >
            {settings.subtitle}
          </p>
        )}

        {settings.description && (
          <p
            className={cn(
              'text-base md:text-lg mb-8 opacity-80 max-w-2xl',
              settings.textAlignment === 'center' && 'mx-auto',
              settings.textAlignment === 'right' && 'ml-auto'
            )}
            style={{ color: 'inherit' }}
          >
            {settings.description}
          </p>
        )}

        {settings.ctaText && (
          <button
            onClick={handleCtaClick}
            className="px-8 py-4 text-lg font-semibold rounded-lg bg-white text-black transition-all duration-200 hover:opacity-90 hover:scale-105"
          >
            {settings.ctaText}
          </button>
        )}
      </div>
    </section>
  );
}

export default HeroBlockComponent;
