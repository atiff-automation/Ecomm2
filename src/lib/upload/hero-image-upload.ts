/**
 * Hero Image Upload Utility - JRM E-commerce Platform
 * Simplified upload handler for hero/site customization images
 * Follows the same pattern as product image uploads for consistency
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface HeroImageUploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

// Use Railway Volume in production, local filesystem in development
const isProduction = process.env.NODE_ENV === 'production';
const UPLOAD_DIR = isProduction
  ? path.join('/data', 'uploads', 'site-customization')
  : path.join(process.cwd(), 'public', 'uploads', 'site-customization');

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
      console.log('📁 Created upload directory:', UPLOAD_DIR);
    }
  } catch (error) {
    console.error('❌ Error creating upload directory:', error);
    throw new Error('Failed to create upload directory');
  }
}

/**
 * Validate hero image file
 */
function validateHeroImage(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm'
  ];

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum: ${MAX_SIZE / 1024 / 1024}MB`
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Generate public URL for uploaded file
 */
function getHeroImageUrl(filename: string): string {
  return isProduction
    ? `/api/media/site-customization/${filename}`
    : `/uploads/site-customization/${filename}`;
}

/**
 * Upload hero/background image
 */
export async function uploadHeroImage(
  file: File,
  type: 'hero_background' | 'logo' | 'favicon' = 'hero_background'
): Promise<HeroImageUploadResult> {
  try {
    console.log('📤 Starting hero image upload:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      uploadType: type,
      isProduction,
      uploadDir: UPLOAD_DIR
    });

    // Validate file
    const validation = validateHeroImage(file);
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.error);
      return { success: false, error: validation.error };
    }

    // Ensure directory exists
    await ensureUploadDir();

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueId = uuidv4();
    const filename = `${type}-${uniqueId}${fileExtension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    console.log('💾 Saving file:', {
      filename,
      filepath,
      directory: UPLOAD_DIR
    });

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Verify file was written
    if (!existsSync(filepath)) {
      console.error('❌ File not found after write:', filepath);
      return {
        success: false,
        error: 'File upload failed - file not found after write'
      };
    }

    // Generate public URL
    const url = getHeroImageUrl(filename);

    console.log('✅ Upload successful:', {
      filename,
      url,
      fileExists: existsSync(filepath)
    });

    return {
      success: true,
      url,
      filename
    };
  } catch (error) {
    console.error('❌ Hero image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Delete hero image file
 */
export async function deleteHeroImage(filename: string): Promise<boolean> {
  try {
    const filepath = path.join(UPLOAD_DIR, filename);

    if (existsSync(filepath)) {
      await import('fs/promises').then(fs => fs.unlink(filepath));
      console.log('🗑️ Deleted hero image:', filename);
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error deleting hero image:', error);
    return false;
  }
}

/**
 * Get hero image info
 */
export async function getHeroImageInfo(filename: string): Promise<{
  exists: boolean;
  size?: number;
  path?: string;
} | null> {
  try {
    const fullPath = path.join(UPLOAD_DIR, filename);

    if (!existsSync(fullPath)) {
      return { exists: false };
    }

    const stats = await import('fs/promises').then(fs => fs.stat(fullPath));

    return {
      exists: true,
      size: stats.size,
      path: fullPath
    };
  } catch (error) {
    console.error('❌ Error getting hero image info:', error);
    return null;
  }
}
