// Server-side image utilities
import { NextRequest } from 'next/server';
import { writeFile, mkdir, unlink, readdir } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

// Import and re-export client types
export type { EntityType, ImageUploadResult, ImageInfo } from './imageUtils.client';
import type { EntityType, ImageUploadResult, ImageInfo } from './imageUtils.client';

// Image configuration
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const IMAGES_DIR = '/public/images';

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

    // Generate filename and path
    const filename = generateFilename(entityType, entityId, file.name);
    const filepath = join(process.cwd(), IMAGES_DIR, entityType, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    return {
      success: true,
      filename,
      url: `/images/${entityType}/${filename}`
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