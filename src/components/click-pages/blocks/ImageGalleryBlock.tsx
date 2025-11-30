'use client';

/**
 * Image Gallery Block Component
 * Carousel or grid layout for multiple images
 * Supports lightbox, captions, and auto-play
 */

import type { ImageGalleryBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BLOCK_WIDTH_DEFAULTS, getBlockWidthClasses } from '@/lib/constants/click-page-blocks';

interface ImageGalleryBlockComponentProps {
  block: ImageGalleryBlock;
}

const COLUMN_MAP = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
};

const ASPECT_RATIO_MAP = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  'original': '',
};

export function ImageGalleryBlockComponent({ block }: ImageGalleryBlockComponentProps) {
  const { settings } = block;
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!settings.images || settings.images.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
        <p className="text-gray-500 dark:text-gray-400">No images added to gallery</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? settings.images.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === settings.images.length - 1 ? 0 : prev + 1
    );
  };

  // Carousel layout
  if (settings.layout === 'carousel') {
    const currentImage = settings.images[currentIndex];
    const useFlexibleHeight = !settings.aspectRatio || settings.aspectRatio === 'original';

    return (
      <div className={getBlockWidthClasses(BLOCK_WIDTH_DEFAULTS.IMAGE_GALLERY_CAROUSEL, settings.fullWidth)}>
        <div className="relative group">
          {useFlexibleHeight ? (
            <div className={cn(
              'relative overflow-hidden bg-gray-100 dark:bg-gray-800',
              settings.rounded !== false && 'rounded-lg'
            )}>
              <img
                src={currentImage.url}
                alt={currentImage.altText}
                className="w-full h-auto"
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ) : (
            <div className={cn(
              'relative overflow-hidden bg-gray-100 dark:bg-gray-800',
              settings.rounded !== false && 'rounded-lg',
              ASPECT_RATIO_MAP[settings.aspectRatio]
            )}>
              <Image
                src={currentImage.url}
                alt={currentImage.altText}
                fill
                className="object-cover"
                priority={currentIndex === 0}
              />
            </div>
          )}

          {settings.showNavigation && settings.images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {settings.showCaptions && currentImage.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-4">
              <p className="text-sm">{currentImage.caption}</p>
            </div>
          )}
        </div>

        {/* Thumbnail navigation */}
        {settings.images.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {settings.images.map((image, idx) => (
              <button
                key={image.id}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'flex-shrink-0 w-20 h-20 overflow-hidden border-2 transition-all',
                  settings.rounded !== false && 'rounded-lg',
                  idx === currentIndex
                    ? 'border-blue-500'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
              >
                <Image
                  src={image.url}
                  alt={image.altText}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Grid or Masonry layout
  const useFlexibleHeight = !settings.aspectRatio || settings.aspectRatio === 'original';

  return (
    <div className={getBlockWidthClasses(BLOCK_WIDTH_DEFAULTS.IMAGE_GALLERY_GRID, settings.fullWidth)}>
      <div className={cn('grid gap-4', COLUMN_MAP[settings.columns])}>
        {settings.images.map((image) => (
        <div
          key={image.id}
          className={cn(
            'group relative overflow-hidden',
            settings.rounded !== false && 'rounded-lg'
          )}
        >
          {useFlexibleHeight ? (
            <>
              {image.link ? (
                <a href={image.link} target="_blank" rel="noopener noreferrer">
                  <img
                    src={image.url}
                    alt={image.altText}
                    className="w-full h-auto transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </a>
              ) : (
                <img
                  src={image.url}
                  alt={image.altText}
                  className="w-full h-auto transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              )}
            </>
          ) : (
            <div className={cn(
              'relative w-full',
              ASPECT_RATIO_MAP[settings.aspectRatio]
            )}>
              {image.link ? (
                <a href={image.link} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={image.url}
                    alt={image.altText}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </a>
              ) : (
                <Image
                  src={image.url}
                  alt={image.altText}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              )}
            </div>
          )}

          {settings.showCaptions && image.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-sm">{image.caption}</p>
            </div>
          )}
        </div>
        ))}
      </div>
    </div>
  );
}

export default ImageGalleryBlockComponent;
