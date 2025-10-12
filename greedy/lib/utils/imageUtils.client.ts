// Client-side image utilities (no Node.js imports)

export type EntityType = 'adventures' | 'sessions' | 'quests' | 'characters' | 'locations' | 'magic-items';

export interface ImageUploadResult {
  success: boolean;
  filename?: string;
  url?: string;
  error?: string;
}

export interface ImageInfo {
  filename: string;
  url: string;
  uploadedAt: string;
}

/**
 * Parse images JSON from database
 */
export function parseImagesJson(imagesJson: unknown): ImageInfo[] {
  if (!imagesJson) return [];
  
  try {
    if (typeof imagesJson === 'string') {
      return JSON.parse(imagesJson) as ImageInfo[];
    }
    if (Array.isArray(imagesJson)) {
      return imagesJson as ImageInfo[];
    }
  } catch (error) {
    console.error('Error parsing images JSON:', error);
  }
  
  return [];
}

/**
 * Convert image upload results to ImageInfo array
 */
export function resultsToImageInfo(results: ImageUploadResult[]): ImageInfo[] {
  return results
    .filter(result => result.success && result.filename && result.url)
    .map(result => ({
      filename: result.filename!,
      url: result.url!,
      uploadedAt: new Date().toISOString()
    }));
}

/**
 * Add images to existing images array
 */
export function addImagesToEntity(
  existingImages: ImageInfo[],
  newImages: ImageInfo[]
): ImageInfo[] {
  return [...existingImages, ...newImages];
}

/**
 * Remove image from entity images array
 */
export function removeImageFromEntity(
  images: ImageInfo[],
  filename: string
): ImageInfo[] {
  return images.filter(img => img.filename !== filename);
}