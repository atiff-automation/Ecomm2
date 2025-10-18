/**
 * Optimized Image Component - JRM E-commerce Platform
 * Progressive loading with multi-format support and responsive sizing
 * Following @CLAUDE.md principles: DRY, centralized configuration
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  getImageUrl,
  generateSrcSet,
  getResponsiveSizes,
  IMAGE_CONFIG,
} from '@/lib/config/image-config';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps {
  uuid: string;
  baseName: string;
  alt: string;
  size?: 'micro' | 'small' | 'medium' | 'large' | 'hero' | 'zoom';
  className?: string;
  lazy?: boolean;
  blur?: boolean;
  priority?: boolean;
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
  fallbackSize?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Generate blur placeholder data URL
 */
function generateBlurDataURL(width: number = 24, height: number = 24): string {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f3f4f6" rx="4"/>
      <rect x="4" y="4" width="${width - 8}" height="${height - 8}" fill="#e5e7eb" rx="2"/>
    </svg>
  `;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get aspect ratio class for container
 */
function getAspectRatioClass(aspectRatio: string): string {
  switch (aspectRatio) {
    case 'square':
      return 'aspect-square';
    case 'landscape':
      return 'aspect-video';
    case 'portrait':
      return 'aspect-[3/4]';
    default:
      return '';
  }
}

/**
 * Modern browsers supporting WebP/AVIF
 */
function supportsModernFormats(): boolean {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  return (
    canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0 ||
    canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
  );
}

/**
 * Optimized Image with progressive loading
 */
export function OptimizedImage({
  uuid,
  baseName,
  alt,
  size = 'medium',
  className,
  lazy = true,
  blur = true,
  priority = false,
  aspectRatio = 'square',
  fallbackSize,
  onClick,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [format, setFormat] = useState<string>('webp');
  const imgRef = useRef<HTMLDivElement>(null);

  // Determine optimal format
  useEffect(() => {
    const useModernFormat = supportsModernFormats();
    setFormat(useModernFormat ? 'webp' : 'jpeg');
  }, []);

  // Generate image URLs
  const primaryUrl = getImageUrl(`${baseName}-${uuid}-${size}.${format}`);

  const fallbackUrl = getImageUrl(
    `${baseName}-${uuid}-${fallbackSize || size}.jpeg`
  );

  // Generate responsive srcSet
  const responsiveSizes = getResponsiveSizes();
  const srcSet = generateSrcSet(baseName, uuid, format, [
    'small',
    'medium',
    'large',
  ]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const containerClass = cn(
    'relative overflow-hidden bg-gray-100',
    getAspectRatioClass(aspectRatio),
    {
      'cursor-pointer': onClick,
      'transition-opacity duration-300': blur,
    },
    className
  );

  const imageClass = cn(
    'object-cover w-full h-full transition-opacity duration-300',
    {
      'opacity-0': !isLoaded && blur,
      'opacity-100': isLoaded || !blur,
    }
  );

  return (
    <div ref={imgRef} className={containerClass} onClick={onClick}>
      {/* Blur placeholder */}
      {blur && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Main image */}
      <picture>
        {/* Modern format source */}
        {IMAGE_CONFIG.optimization.enableWebP && (
          <source
            srcSet={generateSrcSet(baseName, uuid, 'webp', [
              'small',
              'medium',
              'large',
            ])}
            type="image/webp"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}

        {/* AVIF support if enabled */}
        {IMAGE_CONFIG.optimization.enableAvif && (
          <source
            srcSet={generateSrcSet(baseName, uuid, 'avif', [
              'small',
              'medium',
              'large',
            ])}
            type="image/avif"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}

        {/* Fallback JPEG */}
        <Image
          src={hasError ? fallbackUrl : primaryUrl}
          alt={alt}
          fill
          className={imageClass}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          priority={priority}
          placeholder={blur ? 'blur' : 'empty'}
          blurDataURL={blur ? generateBlurDataURL() : undefined}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={handleLoad}
          onError={handleError}
          quality={85}
        />
      </picture>

      {/* Loading state */}
      {!isLoaded && !hasError && blur && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <div className="w-12 h-12 mx-auto mb-2 opacity-50">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-xs">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Product image gallery with zoom support
 */
export interface ProductImageGalleryProps {
  images: Array<{
    uuid: string;
    baseName: string;
    alt: string;
    isPrimary?: boolean;
  }>;
  className?: string;
  enableZoom?: boolean;
}

export function ProductImageGallery({
  images,
  className,
  enableZoom = true,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);

  if (!images.length) {
    return (
      <div className={cn('bg-gray-100 rounded-lg aspect-square', className)}>
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 opacity-50">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p>No images available</p>
          </div>
        </div>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main image */}
      <OptimizedImage
        uuid={activeImage.uuid}
        baseName={activeImage.baseName}
        alt={activeImage.alt}
        size="hero"
        aspectRatio="square"
        priority={activeIndex === 0}
        className="rounded-lg cursor-zoom-in"
        onClick={() => enableZoom && setShowZoom(true)}
      />

      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={`${image.uuid}-${index}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors',
                {
                  'border-blue-500': index === activeIndex,
                  'border-gray-200 hover:border-gray-300':
                    index !== activeIndex,
                }
              )}
            >
              <OptimizedImage
                uuid={image.uuid}
                baseName={image.baseName}
                alt={image.alt}
                size="small"
                aspectRatio="square"
                lazy={index > 3}
                className="w-full h-full"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom modal */}
      {showZoom && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowZoom(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <OptimizedImage
              uuid={activeImage.uuid}
              baseName={activeImage.baseName}
              alt={activeImage.alt}
              size="zoom"
              aspectRatio="auto"
              priority
              className="max-w-full max-h-full"
            />
            <button
              onClick={() => setShowZoom(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimizedImage;
