// Server-side image utilities
import { NextRequest } from 'next/server';
import { writeFile, mkdir, unlink, readdir } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

// Import and re-export client types
export type { EntityType, ImageUploadResult, ImageInfo } from './imageUtils.client';
import type { EntityType, ImageUploadResult, ImageInfo } from './imageUtils.client';

// Image configuration
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const IMAGES_DIR = '/public/images';

// Optimization settings
const OPTIMIZATION_CONFIG = {
  // Maximum dimensions for uploaded images
  maxWidth: 1920,
  maxHeight: 1080,
  // Quality settings for different formats
  jpeg: { quality: 85 },
  png: { quality: 85 },
  webp: { quality: 85 },
  // Thumbnail settings
  thumbnail: {
    width: 300,
    height: 300,
    quality: 80
  }
};

/**
 * Generate a filename with proper naming convention
 * Format: {entityType}_{entityId}_{timestamp}_{originalName}
 */
function generateFilename(
  entityType: EntityType,
  entityId: number,
  originalName: string
): string {
  const timestamp = Date.now();
  const extension = extname(originalName);
  const baseName = originalName.replace(extension, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${entityType}_${entityId}_${timestamp}_${baseName}${extension}`;
}

/**
 * Validate uploaded file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}` 
    };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
    };
  }
  
  return { valid: true };
}

/**
 * Optimize image using Sharp
 */
async function optimizeImage(
  buffer: Buffer,
  originalType: string
): Promise<{ optimized: Buffer; format: string }> {
  try {
    let sharpInstance = sharp(buffer);

    // Get image metadata
    const metadata = await sharpInstance.metadata();

    // Resize if too large
    if (metadata.width! > OPTIMIZATION_CONFIG.maxWidth || metadata.height! > OPTIMIZATION_CONFIG.maxHeight) {
      sharpInstance = sharpInstance.resize(
        OPTIMIZATION_CONFIG.maxWidth,
        OPTIMIZATION_CONFIG.maxHeight,
        {
          fit: 'inside',
          withoutEnlargement: true
        }
      );
    }

    // Convert to WebP for better compression (except for GIFs which should stay as GIF)
    let outputFormat = 'webp';
    let outputOptions: any = OPTIMIZATION_CONFIG.webp;

    if (originalType === 'image/gif') {
      outputFormat = 'gif';
      outputOptions = {};
    } else if (originalType === 'image/png') {
      // Keep PNG if it has transparency
      const hasTransparency = metadata.hasAlpha || (metadata.channels === 4);
      if (hasTransparency) {
        outputFormat = 'png';
        outputOptions = OPTIMIZATION_CONFIG.png;
      }
    }

    const optimized = await sharpInstance
      .toFormat(outputFormat as any, outputOptions)
      .toBuffer();

    return {
      optimized,
      format: outputFormat
    };
  } catch (error) {
    console.warn('Image optimization failed, using original:', error);
    // Return original buffer if optimization fails
    return {
      optimized: buffer,
      format: originalType.split('/')[1]
    };
  }
}

/**
 * Generate thumbnail using Sharp
 */
async function generateThumbnail(
  buffer: Buffer,
  filename: string,
  entityType: EntityType
): Promise<string | null> {
  try {
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = join(process.cwd(), IMAGES_DIR, entityType, thumbnailFilename);

    await sharp(buffer)
      .resize(
        OPTIMIZATION_CONFIG.thumbnail.width,
        OPTIMIZATION_CONFIG.thumbnail.height,
        {
          fit: 'cover',
          position: 'center'
        }
      )
      .jpeg(OPTIMIZATION_CONFIG.thumbnail)
      .toFile(thumbnailPath);

    return thumbnailFilename;
  } catch (error) {
    console.warn('Thumbnail generation failed:', error);
    return null;
  }
}

/**
 * Ensure directory exists
 */
async function ensureDirectory(entityType: EntityType): Promise<void> {
  const dirPath = join(process.cwd(), IMAGES_DIR, entityType);
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * Upload a single image
 */
export async function uploadImage(
  file: File,
  entityType: EntityType,
  entityId: number
): Promise<ImageUploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Ensure directory exists
    await ensureDirectory(entityType);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Optimize image
    const { optimized, format } = await optimizeImage(buffer, file.type);

    // Generate filename with optimized format
    const timestamp = Date.now();
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${entityType}_${entityId}_${timestamp}_${baseName}.${format}`;
    const filepath = join(process.cwd(), IMAGES_DIR, entityType, filename);

    // Save optimized image
    await writeFile(filepath, optimized);

    // Generate thumbnail
    const thumbnailFilename = await generateThumbnail(optimized, filename, entityType);

    return {
      success: true,
      filename,
      url: `/images/${entityType}/${filename}`,
      thumbnailUrl: thumbnailFilename ? `/images/${entityType}/${thumbnailFilename}` : undefined
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: 'Failed to upload image'
    };
  }
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: File[],
  entityType: EntityType,
  entityId: number
): Promise<ImageUploadResult[]> {
  const results: ImageUploadResult[] = [];
  
  for (const file of files) {
    const result = await uploadImage(file, entityType, entityId);
    results.push(result);
  }
  
  return results;
}

/**
 * Delete an image
 */
export async function deleteImage(
  filename: string,
  entityType: EntityType
): Promise<{ success: boolean; error?: string }> {
  try {
    const filepath = join(process.cwd(), IMAGES_DIR, entityType, filename);
    
    if (!existsSync(filepath)) {
      return { success: false, error: 'File not found' };
    }
    
    await unlink(filepath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: 'Failed to delete image' };
  }
}

/**
 * Get all images for an entity
 */
export async function getEntityImages(
  entityType: EntityType,
  entityId: number
): Promise<string[]> {
  try {
    const dirPath = join(process.cwd(), IMAGES_DIR, entityType);
    
    if (!existsSync(dirPath)) {
      return [];
    }
    
    const files = await readdir(dirPath);
    const entityFiles = files.filter(file => 
      file.startsWith(`${entityType}_${entityId}_`)
    );
    
    return entityFiles;
  } catch (error) {
    console.error('Error getting entity images:', error);
    return [];
  }
}

// Re-export client-side functions
export {
  parseImagesJson,
  resultsToImageInfo,
  addImagesToEntity,
  removeImageFromEntity
} from './imageUtils.client';