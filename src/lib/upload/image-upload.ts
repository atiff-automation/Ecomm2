/**
 * Image Upload Utility - JRM E-commerce Platform
 * Handles secure image uploads with validation and optimization
 * Following @CLAUDE.md principles: DRY, centralized configuration
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import {
  IMAGE_CONFIG,
  getImageSize,
  getImageFormat,
  generateImageFileName,
  getImageUrl,
  validateImageFile,
  getPrimaryFormats,
  getFallbackFormat,
  type ImageSize,
  type ImageFormat,
} from '@/lib/config/image-config';

export interface UploadResult {
  success: boolean;
  images?: ProcessedImage[];
  error?: string;
  metadata?: {
    originalWidth: number;
    originalHeight: number;
    originalSize: number;
    uuid: string;
  };
}

export interface ProcessedImage {
  url: string;
  filename: string;
  size: string;
  format: string;
  width: number;
  height: number;
  fileSize: number;
}

export interface ImageProcessingOptions {
  sizes?: string[]; // Array of size keys from config
  formats?: string[]; // Array of format keys from config
  generateThumbnails?: boolean;
  preserveOriginal?: boolean;
}

const UPLOAD_DIR = path.join(process.cwd(), IMAGE_CONFIG.upload.uploadPath);
const TEMP_DIR = path.join(process.cwd(), IMAGE_CONFIG.upload.tempPath);

/**
 * Ensure upload directories exist
 */
async function ensureUploadDirs() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
    if (!existsSync(TEMP_DIR)) {
      await mkdir(TEMP_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw new Error('Failed to create upload directories');
  }
}

/**
 * Process image with Sharp using centralized configuration
 */
async function processImageVariant(
  buffer: Buffer,
  sizeConfig: ImageSize,
  formatConfig: ImageFormat
): Promise<{
  buffer: Buffer;
  metadata: { width: number; height: number; size: number; format: string };
}> {
  let image = sharp(buffer);

  // Resize according to size configuration
  image = image.resize(sizeConfig.width, sizeConfig.height, {
    fit: sizeConfig.fit,
    withoutEnlargement: true,
  });

  // Apply format-specific processing
  switch (formatConfig.extension) {
    case 'webp':
      image = image.webp({
        quality: formatConfig.quality,
        progressive: formatConfig.progressive,
        lossless: formatConfig.lossless,
      });
      break;
    case 'jpg':
    case 'jpeg':
      image = image.jpeg({
        quality: formatConfig.quality,
        progressive: formatConfig.progressive,
      });
      break;
    case 'png':
      image = image.png({
        compressionLevel: IMAGE_CONFIG.optimization.compressionLevel,
      });
      break;
    case 'avif':
      image = image.avif({
        quality: formatConfig.quality,
        lossless: formatConfig.lossless,
      });
      break;
  }

  const processedBuffer = await image.toBuffer();
  const metadata = await sharp(processedBuffer).metadata();

  return {
    buffer: processedBuffer,
    metadata: {
      width: metadata.width!,
      height: metadata.height!,
      size: processedBuffer.length,
      format: metadata.format!,
    },
  };
}

/**
 * Upload and process product image with multiple sizes and formats
 */
export async function uploadProductImage(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<UploadResult> {
  try {
    // Validate file using centralized configuration
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Validation failed' };
    }

    // Ensure directories exist
    await ensureUploadDirs();

    // Default processing options
    const {
      sizes = ['small', 'medium', 'large', 'hero'],
      formats = [...getPrimaryFormats(), getFallbackFormat()],
      generateThumbnails = true,
      preserveOriginal = false,
    } = options;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get original metadata
    const originalMetadata = await sharp(buffer).metadata();
    const uuid = uuidv4().substring(0, 8);
    const baseName = path.basename(file.name, path.extname(file.name));

    const processedImages: ProcessedImage[] = [];

    // Generate all size and format combinations
    for (const sizeKey of sizes) {
      const sizeConfig = getImageSize(sizeKey);
      if (!sizeConfig) continue;

      for (const formatKey of formats) {
        const formatConfig = getImageFormat(formatKey);
        if (!formatConfig) continue;

        try {
          // Process image variant
          const processed = await processImageVariant(buffer, sizeConfig, formatConfig);

          // Generate filename
          const filename = generateImageFileName(baseName, sizeKey, formatKey, uuid);
          const filepath = path.join(UPLOAD_DIR, filename);

          // Save processed image
          await writeFile(filepath, processed.buffer);

          // Add to results
          processedImages.push({
            url: getImageUrl(filename),
            filename,
            size: sizeKey,
            format: formatKey,
            width: processed.metadata.width,
            height: processed.metadata.height,
            fileSize: processed.metadata.size,
          });
        } catch (error) {
          console.error(`Error processing ${sizeKey}-${formatKey}:`, error);
          // Continue with other variants even if one fails
        }
      }
    }

    if (processedImages.length === 0) {
      return {
        success: false,
        error: 'Failed to process any image variants',
      };
    }

    return {
      success: true,
      images: processedImages,
      metadata: {
        originalWidth: originalMetadata.width!,
        originalHeight: originalMetadata.height!,
        originalSize: file.size,
        uuid,
      },
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete all variants of an uploaded image by UUID
 */
export async function deleteProductImagesByUuid(uuid: string): Promise<boolean> {
  try {
    const fs = await import('fs/promises');
    const files = await fs.readdir(UPLOAD_DIR);

    // Filter files that match the UUID pattern
    const matchingFiles = files.filter(file => file.includes(uuid));

    let deletedCount = 0;
    for (const filename of matchingFiles) {
      try {
        const filepath = path.join(UPLOAD_DIR, filename);
        if (existsSync(filepath)) {
          await fs.unlink(filepath);
          deletedCount++;
        }
      } catch (error) {
        console.error(`Error deleting file ${filename}:`, error);
      }
    }

    return deletedCount > 0;
  } catch (error) {
    console.error('Error deleting image variants:', error);
    return false;
  }
}

/**
 * Delete specific image file
 */
export async function deleteProductImage(filename: string): Promise<boolean> {
  try {
    const filepath = path.join(UPLOAD_DIR, filename);

    if (existsSync(filepath)) {
      await import('fs/promises').then(fs => fs.unlink(filepath));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

/**
 * Get all image variants for a UUID
 */
export async function getImageVariants(uuid: string): Promise<ProcessedImage[]> {
  try {
    const fs = await import('fs/promises');
    const files = await fs.readdir(UPLOAD_DIR);

    // Filter files that match the UUID pattern
    const matchingFiles = files.filter(file => file.includes(uuid));

    const variants: ProcessedImage[] = [];

    for (const filename of matchingFiles) {
      try {
        const filepath = path.join(UPLOAD_DIR, filename);
        const stats = await fs.stat(filepath);
        const metadata = await sharp(filepath).metadata();

        // Parse size and format from filename
        const parts = filename.split('-');
        const sizePart = parts[parts.length - 1].split('.')[0]; // Extract size suffix
        const formatPart = filename.split('.').pop() || '';

        variants.push({
          url: getImageUrl(filename),
          filename,
          size: sizePart,
          format: formatPart,
          width: metadata.width!,
          height: metadata.height!,
          fileSize: stats.size,
        });
      } catch (error) {
        console.error(`Error processing file ${filename}:`, error);
      }
    }

    return variants;
  } catch (error) {
    console.error('Error getting image variants:', error);
    return [];
  }
}

/**
 * Get image info for specific file
 */
export async function getImageInfo(filename: string): Promise<{
  exists: boolean;
  size?: number;
  width?: number;
  height?: number;
  format?: string;
} | null> {
  try {
    const fullPath = path.join(UPLOAD_DIR, filename);

    if (!existsSync(fullPath)) {
      return { exists: false };
    }

    const metadata = await sharp(fullPath).metadata();
    const stats = await import('fs/promises').then(fs => fs.stat(fullPath));

    return {
      exists: true,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    };
  } catch (error) {
    console.error('Error getting image info:', error);
    return null;
  }
}

/**
 * Backward compatibility helper for existing ProductForm
 */
export async function uploadProductImageLegacy(
  file: File,
  options: any = {}
): Promise<{ success: boolean; url?: string; filename?: string; error?: string; width?: number; height?: number; size?: number }> {
  const result = await uploadProductImage(file, {
    sizes: ['medium'], // Single size for compatibility
    formats: ['webp', 'jpeg'], // Modern formats with fallback
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Return first image for compatibility
  const firstImage = result.images![0];
  return {
    success: true,
    url: firstImage.url,
    filename: firstImage.filename,
    width: firstImage.width,
    height: firstImage.height,
    size: firstImage.fileSize,
  };
}
