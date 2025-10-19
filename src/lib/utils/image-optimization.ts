/**
 * Image Optimization Utilities - JRM E-commerce Platform
 * Centralized utilities for image processing and optimization
 * Following @CLAUDE.md principles: DRY, centralized configuration
 */

import {
  IMAGE_CONFIG,
  getImageSize,
  getImageFormat,
  getImageUrl,
} from '@/lib/config/image-config';
import type { ProcessedImage } from '@/lib/upload/image-upload';

export interface ImageMetadata {
  uuid: string;
  baseName: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  variants: ProcessedImage[];
}

/**
 * Calculate image compression ratio
 */
export function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number
): number {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

/**
 * Get optimal image size based on container dimensions
 */
export function getOptimalImageSize(
  containerWidth: number,
  containerHeight: number,
  pixelDensity: number = 1
): string {
  const targetWidth = containerWidth * pixelDensity;
  const targetHeight = containerHeight * pixelDensity;

  const sizes = Object.entries(IMAGE_CONFIG.sizes);

  // Find the smallest size that's larger than or equal to target
  for (const [sizeKey, sizeConfig] of sizes.sort(
    (a, b) => a[1].width - b[1].width
  )) {
    if (sizeConfig.width >= targetWidth && sizeConfig.height >= targetHeight) {
      return sizeKey;
    }
  }

  // If no size is large enough, return the largest
  return sizes[sizes.length - 1][0];
}

/**
 * Generate responsive image sources for different screen sizes
 */
export function generateResponsiveSources(
  uuid: string,
  baseName: string
): Array<{
  media: string;
  srcSet: string;
  sizes: string;
}> {
  return [
    {
      media: '(max-width: 640px)',
      srcSet: [
        `${getImageUrl(`${baseName}-${uuid}-small.webp`)} 1x`,
        `${getImageUrl(`${baseName}-${uuid}-medium.webp`)} 2x`,
      ].join(', '),
      sizes: '100vw',
    },
    {
      media: '(max-width: 1024px)',
      srcSet: [
        `${getImageUrl(`${baseName}-${uuid}-medium.webp`)} 1x`,
        `${getImageUrl(`${baseName}-${uuid}-large.webp`)} 2x`,
      ].join(', '),
      sizes: '50vw',
    },
    {
      media: '(min-width: 1025px)',
      srcSet: [
        `${getImageUrl(`${baseName}-${uuid}-large.webp`)} 1x`,
        `${getImageUrl(`${baseName}-${uuid}-hero.webp`)} 2x`,
      ].join(', '),
      sizes: '33vw',
    },
  ];
}

/**
 * Get image URL with format fallback
 */
export function getImageWithFallback(
  uuid: string,
  baseName: string,
  size: string,
  preferredFormat: string = 'webp'
): {
  primary: string;
  fallback: string;
} {
  return {
    primary: getImageUrl(`${baseName}-${uuid}-${size}.${preferredFormat}`),
    fallback: getImageUrl(`${baseName}-${uuid}-${size}.jpg`),
  };
}

/**
 * Calculate lazy loading threshold based on viewport
 */
export function calculateLazyLoadingThreshold(): number {
  if (typeof window === 'undefined') {
    return 100;
  }

  const viewportHeight = window.innerHeight;
  return Math.min(viewportHeight * 0.5, 500); // 50% of viewport or 500px max
}

/**
 * Check if WebP is supported by browser
 */
export function isWebPSupported(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = function () {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Check if AVIF is supported by browser
 */
export function isAvifSupported(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  return new Promise(resolve => {
    const avif = new Image();
    avif.onload = avif.onerror = function () {
      resolve(avif.height === 2);
    };
    avif.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';
  });
}

/**
 * Preload critical images
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Batch preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage));
}

/**
 * Create intersection observer for lazy loading
 */
export function createLazyLoadObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(entries => {
    entries.forEach(callback);
  }, defaultOptions);
}

/**
 * Get image dimensions from URL
 */
export function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Calculate aspect ratio from dimensions
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Get aspect ratio class for CSS
 */
export function getAspectRatioClass(width: number, height: number): string {
  const ratio = calculateAspectRatio(width, height);

  if (Math.abs(ratio - 1) < 0.1) {
    return 'aspect-square';
  }
  if (ratio > 1.5) {
    return 'aspect-video';
  }
  if (ratio < 0.8) {
    return 'aspect-[3/4]';
  }

  return `aspect-[${width}/${height}]`;
}

/**
 * Generate blur placeholder data URL
 */
export function generateBlurPlaceholder(
  width: number = 20,
  height: number = 20,
  color: string = '#f3f4f6'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Calculate bandwidth-aware image quality
 */
export function getBandwidthAwareQuality(): number {
  if (typeof navigator === 'undefined') {
    return 85;
  }

  // Check for slow connection
  const connection = (navigator as any).connection;
  if (connection) {
    if (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g'
    ) {
      return 60; // Lower quality for slow connections
    }
    if (connection.effectiveType === '3g') {
      return 75; // Medium quality for 3G
    }
  }

  return 85; // High quality for fast connections
}

/**
 * Optimize image loading based on device capabilities
 */
export function getDeviceOptimizedSettings(): {
  quality: number;
  format: string;
  enableProgressive: boolean;
} {
  const quality = getBandwidthAwareQuality();

  // Prefer WebP for supported browsers
  const format = 'webp';

  // Enable progressive loading for slower connections
  const enableProgressive = quality < 80;

  return {
    quality,
    format,
    enableProgressive,
  };
}

/**
 * Performance monitoring for image loading
 */
export class ImagePerformanceMonitor {
  private static metrics: Map<string, number> = new Map();

  static startTiming(imageId: string): void {
    this.metrics.set(imageId, performance.now());
  }

  static endTiming(imageId: string): number {
    const startTime = this.metrics.get(imageId);
    if (!startTime) {
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(imageId);

    return duration;
  }

  static getAverageLoadTime(): number {
    const times = Array.from(this.metrics.values());
    if (times.length === 0) {
      return 0;
    }

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  static reportMetrics(): void {
    if (typeof console !== 'undefined') {
      console.log('Image Loading Metrics:', {
        averageLoadTime: this.getAverageLoadTime(),
        totalImages: this.metrics.size,
      });
    }
  }
}
