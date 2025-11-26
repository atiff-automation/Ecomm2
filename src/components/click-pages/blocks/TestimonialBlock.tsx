'use client';

/**
 * Testimonial Block Component
 * Customer reviews and testimonials
 */

import type { TestimonialBlock, TestimonialItem } from '@/types/click-page.types';
import { cn } from '@/lib/utils';
import { Star, Quote } from 'lucide-react';
import Image from 'next/image';
import { BLOCK_WIDTH_DEFAULTS, BLOCK_WIDTH_CLASSES, getBlockWidthClasses } from '@/lib/constants/click-page-blocks';

interface TestimonialBlockComponentProps {
  block: TestimonialBlock;
}

const LAYOUT_STYLES = {
  single: 'grid-cols-1',
  grid: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  carousel: 'grid-cols-1', // Simplified for now
};

export function TestimonialBlockComponent({ block }: TestimonialBlockComponentProps) {
  const { settings } = block;

  // Note: Padding/margin are applied by BlockRenderer wrapper via settings.styles.spacing
  return (
    <div>
      <div
        className={cn(
          'grid gap-6',
          getBlockWidthClasses(settings.layout === 'single' ? BLOCK_WIDTH_CLASSES.NARROW : BLOCK_WIDTH_DEFAULTS.TESTIMONIAL_GRID, settings.fullWidth),
          LAYOUT_STYLES[settings.layout]
        )}
      >
        {settings.testimonials.map((testimonial) => (
          <TestimonialCard
            key={testimonial.id}
            testimonial={testimonial}
            showRatings={settings.showRatings}
            showImages={settings.showImages}
          />
        ))}
      </div>
    </div>
  );
}

interface TestimonialCardProps {
  testimonial: TestimonialItem;
  showRatings: boolean;
  showImages: boolean;
}

function TestimonialCard({ testimonial, showRatings, showImages }: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100" style={{ color: 'inherit' }}>
      <Quote className="w-8 h-8 opacity-30 mb-4" style={{ color: 'inherit' }} />

      <p className="mb-6 leading-relaxed opacity-80" style={{ color: 'inherit' }}>
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      <div className="flex items-center gap-4">
        {showImages && testimonial.authorImage ? (
          <Image
            src={testimonial.authorImage}
            alt={testimonial.authorName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : showImages ? (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-500">
              {testimonial.authorName.charAt(0)}
            </span>
          </div>
        ) : null}

        <div className="flex-grow">
          <p className="font-semibold" style={{ color: 'inherit' }}>{testimonial.authorName}</p>
          {testimonial.authorTitle && (
            <p className="text-sm opacity-60" style={{ color: 'inherit' }}>{testimonial.authorTitle}</p>
          )}
        </div>

        {showRatings && testimonial.rating && (
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4',
                  i < testimonial.rating!
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TestimonialBlockComponent;
