/**
 * Image Upload Utility - JRM E-commerce Platform
 * Handles secure image uploads with validation and optimization
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  thumbnail?: boolean;
  thumbnailSize?: number;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');
const PRODUCTS_DIR = path.join(UPLOAD_DIR, 'products');

/**
 * Ensure upload directories exist
 */
async function ensureUploadDirs() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
    if (!existsSync(PRODUCTS_DIR)) {
      await mkdir(PRODUCTS_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw new Error('Failed to create upload directories');
  }
}

/**
 * Validate uploaded file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  return { valid: true };
}

/**
 * Generate unique filename
 */
function generateFilename(originalName: string, format?: string): string {
  const ext = format ? `.${format}` : path.extname(originalName);
  const name = path.basename(originalName, path.extname(originalName));
  const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 20);
  const uuid = uuidv4().substring(0, 8);
  return `${sanitizedName}-${uuid}${ext}`;
}

/**
 * Process image with Sharp
 */
async function processImage(
  buffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<{
  buffer: Buffer;
  metadata: { width: number; height: number; size: number; format: string };
}> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 85,
    format = 'webp',
  } = options;

  let image = sharp(buffer);

  // Get original metadata
  const originalMetadata = await image.metadata();

  // Resize if needed
  if (
    originalMetadata.width! > maxWidth ||
    originalMetadata.height! > maxHeight
  ) {
    image = image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert format and compress
  switch (format) {
    case 'webp':
      image = image.webp({ quality });
      break;
    case 'jpeg':
      image = image.jpeg({ quality });
      break;
    case 'png':
      image = image.png({ compressionLevel: 6 });
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
 * Create thumbnail
 */
async function createThumbnail(
  buffer: Buffer,
  size: number = 300
): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Upload and process product image
 */
export async function uploadProductImage(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Validation failed' };
    }

    // Ensure directories exist
    await ensureUploadDirs();

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process main image
    const processed = await processImage(buffer, options);
    const filename = generateFilename(file.name, options.format || 'webp');
    const filepath = path.join(PRODUCTS_DIR, filename);

    // Save main image
    await writeFile(filepath, processed.buffer);

    // Create thumbnail if requested
    if (options.thumbnail) {
      const thumbnailBuffer = await createThumbnail(
        processed.buffer,
        options.thumbnailSize
      );
      const thumbnailFilename = `thumb-${filename}`;
      const thumbnailPath = path.join(PRODUCTS_DIR, thumbnailFilename);
      await writeFile(thumbnailPath, thumbnailBuffer);
    }

    const publicUrl = `/uploads/products/${filename}`;

    return {
      success: true,
      url: publicUrl,
      filename,
      width: processed.metadata.width,
      height: processed.metadata.height,
      size: processed.metadata.size,
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
 * Delete uploaded image
 */
export async function deleteProductImage(filename: string): Promise<boolean> {
  try {
    const filepath = path.join(PRODUCTS_DIR, filename);
    const thumbnailPath = path.join(PRODUCTS_DIR, `thumb-${filename}`);

    if (existsSync(filepath)) {
      await import('fs/promises').then(fs => fs.unlink(filepath));
    }

    if (existsSync(thumbnailPath)) {
      await import('fs/promises').then(fs => fs.unlink(thumbnailPath));
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

/**
 * Get image info
 */
export async function getImageInfo(filepath: string): Promise<{
  exists: boolean;
  size?: number;
  width?: number;
  height?: number;
  format?: string;
} | null> {
  try {
    const fullPath = path.join(PRODUCTS_DIR, filepath);

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
