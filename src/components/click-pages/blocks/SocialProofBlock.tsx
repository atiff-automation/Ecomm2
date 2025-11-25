'use client';

/**
 * Social Proof Block Component
 * Stats, badges, and trust signals
 * Inherits color from parent wrapper for style customization
 */

import type { SocialProofBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import Image from 'next/image';
import { BLOCK_WIDTH_DEFAULTS, getBlockWidthClasses } from '@/lib/constants/click-page-blocks';

interface SocialProofBlockComponentProps {
  block: SocialProofBlock;
}

const LAYOUT_STYLES = {
  horizontal: 'flex flex-wrap justify-center gap-8',
  vertical: 'flex flex-col items-center gap-6',
  grid: 'grid grid-cols-2 md:grid-cols-4 gap-6',
};

export function SocialProofBlockComponent({ block }: SocialProofBlockComponentProps) {
  const { settings } = block;

  // Note: Padding/margin are applied by BlockRenderer wrapper via settings.styles.spacing
  return (
    <div style={{ color: 'inherit' }}>
      <div className={getBlockWidthClasses(BLOCK_WIDTH_DEFAULTS.SOCIAL_PROOF)}>
        <div className={cn(LAYOUT_STYLES[settings.layout])}>
          {/* Stats */}
          {settings.type === 'stats' && settings.stats?.map((stat, index) => (
            <div key={index} className="flex flex-col items-center text-center p-4">
              <span className="font-bold text-3xl" style={{ color: 'inherit' }}>{stat.value}</span>
              <span className="mt-1 opacity-70" style={{ color: 'inherit' }}>{stat.label}</span>
            </div>
          ))}

          {/* Badges */}
          {settings.type === 'badges' && settings.badges?.map((badge, index) => (
            <div key={index} className="flex items-center justify-center p-4">
              <Image
                src={badge.imageUrl}
                alt={badge.altText}
                width={120}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </div>
          ))}

          {/* Reviews */}
          {settings.type === 'reviews' && settings.reviews && (
            <div className="flex flex-col items-center text-center p-4" style={{ color: 'inherit' }}>
              {settings.reviews.showStars && (
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-6 h-6',
                        i < Math.round(settings.reviews!.averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
              )}
              <span className="font-bold text-2xl" style={{ color: 'inherit' }}>
                {settings.reviews.averageRating.toFixed(1)}/5
              </span>
              <span className="mt-1 opacity-70" style={{ color: 'inherit' }}>
                Based on {settings.reviews.totalReviews.toLocaleString()} reviews
              </span>
              {settings.reviews.images && settings.reviews.images.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {settings.reviews.images.slice(0, 4).map((img, index) => (
                    <Image
                      key={index}
                      src={img}
                      alt={`Review ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SocialProofBlockComponent;
