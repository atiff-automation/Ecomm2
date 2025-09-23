/**
 * Image Processing Configuration - JRM E-commerce Platform
 * Single source of truth for all image processing settings
 * Following @CLAUDE.md principles: DRY, centralized, no hardcoding
 */

export interface ImageSize {
  width: number;
  height: number;
  quality: number;
  suffix: string;
  fit: 'cover' | 'inside' | 'outside' | 'fill';
  description: string;
}

export interface ImageFormat {
  extension: string;
  mimeType: string;
  quality: number;
  progressive?: boolean;
  lossless?: boolean;
}

export interface ImageProcessingConfig {
  sizes: Record<string, ImageSize>;
  formats: Record<string, ImageFormat>;
  upload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    uploadPath: string;
    tempPath: string;
  };
  optimization: {
    enableProgressive: boolean;
    enableLazyLoading: boolean;
    enableWebP: boolean;
    enableAvif: boolean;
    compressionLevel: number;
  };
  cdn: {
    enabled: boolean;
    baseUrl?: string;
    transformations: boolean;
  };
}

/**
 * Centralized image configuration - Single source of truth
 */
export const IMAGE_CONFIG: ImageProcessingConfig = {
  // Standardized image sizes for e-commerce
  sizes: {
    micro: {
      width: 50,
      height: 50,
      quality: 60,
      suffix: 'micro',
      fit: 'cover',
      description: 'Grid previews and micro thumbnails',
    },
    small: {
      width: 150,
      height: 150,
      quality: 70,
      suffix: 'sm',
      fit: 'cover',
      description: 'Product list thumbnails',
    },
    medium: {
      width: 300,
      height: 300,
      quality: 80,
      suffix: 'md',
      fit: 'cover',
      description: 'Product card images',
    },
    large: {
      width: 600,
      height: 600,
      quality: 85,
      suffix: 'lg',
      fit: 'inside',
      description: 'Product detail preview',
    },
    hero: {
      width: 1200,
      height: 1200,
      quality: 90,
      suffix: 'hero',
      fit: 'inside',
      description: 'Main product hero image',
    },
    zoom: {
      width: 2400,
      height: 2400,
      quality: 95,
      suffix: 'zoom',
      fit: 'inside',
      description: 'High-resolution zoom image',
    },
  },

  // Image format configurations
  formats: {
    webp: {
      extension: 'webp',
      mimeType: 'image/webp',
      quality: 85,
      progressive: true,
      lossless: false,
    },
    jpeg: {
      extension: 'jpg',
      mimeType: 'image/jpeg',
      quality: 85,
      progressive: true,
    },
    png: {
      extension: 'png',
      mimeType: 'image/png',
      quality: 90,
      lossless: true,
    },
    avif: {
      extension: 'avif',
      mimeType: 'image/avif',
      quality: 80,
      lossless: false,
    },
  },

  // Upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ],
    uploadPath: 'public/uploads/products',
    tempPath: 'public/uploads/temp',
  },

  // Optimization settings
  optimization: {
    enableProgressive: true,
    enableLazyLoading: true,
    enableWebP: true,
    enableAvif: true,
    compressionLevel: 6,
  },

  // CDN configuration
  cdn: {
    enabled: false, // Can be enabled when CDN is set up
    baseUrl: process.env.CDN_BASE_URL,
    transformations: true,
  },
};

/**
 * Get image size configuration by key
 */
export function getImageSize(sizeKey: string): ImageSize | null {
  return IMAGE_CONFIG.sizes[sizeKey] || null;
}

/**
 * Get all available image sizes
 */
export function getAllImageSizes(): Record<string, ImageSize> {
  return IMAGE_CONFIG.sizes;
}

/**
 * Get format configuration by key
 */
export function getImageFormat(formatKey: string): ImageFormat | null {
  return IMAGE_CONFIG.formats[formatKey] || null;
}

/**
 * Get primary formats for modern browsers
 */
export function getPrimaryFormats(): string[] {
  const formats = ['webp'];
  if (IMAGE_CONFIG.optimization.enableAvif) {
    formats.unshift('avif');
  }
  return formats;
}

/**
 * Get fallback format for older browsers
 */
export function getFallbackFormat(): string {
  return 'jpeg';
}

/**
 * Generate file name with size and format suffix
 */
export function generateImageFileName(
  baseName: string,
  sizeKey: string,
  formatKey: string,
  uuid: string
): string {
  const size = getImageSize(sizeKey);
  const format = getImageFormat(formatKey);

  if (!size || !format) {
    throw new Error(`Invalid size (${sizeKey}) or format (${formatKey})`);
  }

  const sanitizedName = baseName
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .substring(0, 20);

  return `${sanitizedName}-${uuid}-${size.suffix}.${format.extension}`;
}

/**
 * Get responsive image srcset for different sizes
 */
export function generateSrcSet(
  baseName: string,
  uuid: string,
  formatKey: string,
  sizeKeys: string[] = ['small', 'medium', 'large']
): string {
  return sizeKeys
    .map(sizeKey => {
      const size = getImageSize(sizeKey);
      if (!size) return '';

      const fileName = generateImageFileName(baseName, sizeKey, formatKey, uuid);
      return `${getImageUrl(fileName)} ${size.width}w`;
    })
    .filter(Boolean)
    .join(', ');
}

/**
 * Get image URL (with CDN support)
 */
export function getImageUrl(fileName: string): string {
  if (IMAGE_CONFIG.cdn.enabled && IMAGE_CONFIG.cdn.baseUrl) {
    return `${IMAGE_CONFIG.cdn.baseUrl}/products/${fileName}`;
  }
  return `/uploads/products/${fileName}`;
}

/**
 * Validate file against upload configuration
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!IMAGE_CONFIG.upload.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${IMAGE_CONFIG.upload.allowedMimeTypes.join(', ')}`,
    };
  }

  if (file.size > IMAGE_CONFIG.upload.maxFileSize) {
    const maxSizeMB = IMAGE_CONFIG.upload.maxFileSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  return { valid: true };
}

/**
 * Get optimal sizes for responsive images
 */
export function getResponsiveSizes(): { mobile: string[]; tablet: string[]; desktop: string[] } {
  return {
    mobile: ['small', 'medium'],
    tablet: ['medium', 'large'],
    desktop: ['large', 'hero'],
  };
}