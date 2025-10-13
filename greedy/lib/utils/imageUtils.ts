// Server-side image utilities
import { NextRequest } from "next/server";
import { writeFile, mkdir, unlink, readdir } from "fs/promises";
import { join, extname } from "path";
import { existsSync } from "fs";
import sharp from "sharp";
import { logger } from "@/lib/utils/logger";
import { eq, sql } from "drizzle-orm";

// Import and re-export client types
export type {
  EntityType,
  ImageUploadResult,
  ImageInfo,
} from "./imageUtils.client";
import type {
  EntityType,
  ImageUploadResult,
  ImageInfo,
} from "./imageUtils.client";
import { parseImagesJson } from "./imageUtils.client";

// Image configuration
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const IMAGES_DIR = "/public/images";

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
    quality: 80,
  },
};

/**
 * Generate a filename with proper naming convention
 * Format: {entityType}_{entityId}_{timestamp}_{originalName}
 */
function generateFilename(
  entityType: EntityType,
  entityId: number,
  originalName: string,
): string {
  const timestamp = Date.now();
  const extension = extname(originalName);
  const baseName = originalName
    .replace(extension, "")
    .replace(/[^a-zA-Z0-9]/g, "_");
  return `${entityType}_${entityId}_${timestamp}_${baseName}${extension}`;
}

/**
 * Validate uploaded file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Optimize image using Sharp
 */
async function optimizeImage(
  buffer: Buffer,
  originalType: string,
): Promise<{ optimized: Buffer; format: string }> {
  try {
    let sharpInstance = sharp(buffer);

    // Get image metadata
    const metadata = await sharpInstance.metadata();

    // Resize if too large
    if (
      metadata.width! > OPTIMIZATION_CONFIG.maxWidth ||
      metadata.height! > OPTIMIZATION_CONFIG.maxHeight
    ) {
      sharpInstance = sharpInstance.resize(
        OPTIMIZATION_CONFIG.maxWidth,
        OPTIMIZATION_CONFIG.maxHeight,
        {
          fit: "inside",
          withoutEnlargement: true,
        },
      );
    }

    // Convert to WebP for better compression (except for GIFs which should stay as GIF)
    let outputFormat: "webp" | "png" | "gif" = "webp";
    let outputOptions: Record<string, unknown> = OPTIMIZATION_CONFIG.webp;

    if (originalType === "image/gif") {
      outputFormat = "gif";
      outputOptions = {};
    } else if (originalType === "image/png") {
      // Keep PNG if it has transparency
      const hasTransparency = metadata.hasAlpha || metadata.channels === 4;
      if (hasTransparency) {
        outputFormat = "png";
        outputOptions = OPTIMIZATION_CONFIG.png;
      }
    }

    const optimized = await sharpInstance
      .toFormat(outputFormat, outputOptions)
      .toBuffer();

    return {
      optimized,
      format: outputFormat,
    };
  } catch (error) {
    logger.warn("Image optimization failed, using original", error);
    // Return original buffer if optimization fails
    return {
      optimized: buffer,
      format: originalType.split("/")[1],
    };
  }
}

/**
 * Generate thumbnail using Sharp
 */
async function generateThumbnail(
  buffer: Buffer,
  filename: string,
  entityType: EntityType,
): Promise<string | null> {
  try {
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = join(
      process.cwd(),
      IMAGES_DIR,
      entityType,
      thumbnailFilename,
    );

    await sharp(buffer)
      .resize(
        OPTIMIZATION_CONFIG.thumbnail.width,
        OPTIMIZATION_CONFIG.thumbnail.height,
        {
          fit: "cover",
          position: "center",
        },
      )
      .jpeg(OPTIMIZATION_CONFIG.thumbnail)
      .toFile(thumbnailPath);

    return thumbnailFilename;
  } catch (error) {
    logger.warn("Thumbnail generation failed", error);
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
  entityId: number,
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
    const baseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${entityType}_${entityId}_${timestamp}_${baseName}.${format}`;
    const filepath = join(process.cwd(), IMAGES_DIR, entityType, filename);

    // Save optimized image
    await writeFile(filepath, optimized);

    // Generate thumbnail
    const thumbnailFilename = await generateThumbnail(
      optimized,
      filename,
      entityType,
    );

    return {
      success: true,
      filename,
      url: `/images/${entityType}/${filename}`,
      thumbnailUrl: thumbnailFilename
        ? `/images/${entityType}/${thumbnailFilename}`
        : undefined,
    };
  } catch (error) {
    logger.error("Error uploading image", error);
    return {
      success: false,
      error: "Failed to upload image",
    };
  }
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: File[],
  entityType: EntityType,
  entityId: number,
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
  entityType: EntityType,
): Promise<{ success: boolean; error?: string }> {
  try {
    const filepath = join(process.cwd(), IMAGES_DIR, entityType, filename);

    if (!existsSync(filepath)) {
      return { success: false, error: "File not found" };
    }

    await unlink(filepath);
    return { success: true };
  } catch (error) {
    logger.error("Error deleting image", error);
    return { success: false, error: "Failed to delete image" };
  }
}

/**
 * Get all images for an entity
 */
export async function getEntityImages(
  entityType: EntityType,
  entityId: number,
): Promise<string[]> {
  try {
    const dirPath = join(process.cwd(), IMAGES_DIR, entityType);

    if (!existsSync(dirPath)) {
      return [];
    }

    const files = await readdir(dirPath);
    const entityFiles = files.filter((file) =>
      file.startsWith(`${entityType}_${entityId}_`),
    );

    return entityFiles;
  } catch (error) {
    logger.error("Error getting entity images", error);
    return [];
  }
}

/**
 * Update an entity's images field by removing a specific image (server-side)
 */
export async function removeImageFromEntityDB(
  entityType: EntityType,
  entityId: number,
  filename: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = (await import("@/lib/db")).db;
    let table;
    let whereCondition;

    switch (entityType) {
      case "adventures":
        table = (await import("@/lib/db/schema")).adventures;
        whereCondition = eq(table.id, entityId);
        break;
      case "sessions":
        table = (await import("@/lib/db/schema")).sessions;
        whereCondition = eq(table.id, entityId);
        break;
      case "characters":
        table = (await import("@/lib/db/schema")).characters;
        whereCondition = eq(table.id, entityId);
        break;
      case "locations":
        table = (await import("@/lib/db/schema")).locations;
        whereCondition = eq(table.id, entityId);
        break;
      case "quests":
        table = (await import("@/lib/db/schema")).quests;
        whereCondition = eq(table.id, entityId);
        break;
      case "magic-items":
        table = (await import("@/lib/db/schema")).magicItems;
        whereCondition = eq(table.id, entityId);
        break;
      default:
        return {
          success: false,
          error: `Unsupported entity type: ${entityType}`,
        };
    }

    // Get current images
    const [entity] = await db
      .select({ images: table.images })
      .from(table)
      .where(whereCondition)
      .limit(1);

    if (!entity) {
      return {
        success: false,
        error: `Entity not found: ${entityType} ${entityId}`,
      };
    }

    const currentImages = parseImagesJson(entity.images);
    const updatedImages = removeImageFromEntityImages(currentImages, filename);

    // Update the entity
    await db
      .update(table)
      .set({
        images: updatedImages.length > 0 ? JSON.stringify(updatedImages) : null,
        updatedAt: new Date().toISOString(),
      })
      .where(whereCondition);

    return { success: true };
  } catch (error) {
    logger.error("Error removing image from entity", error);
    return { success: false, error: "Failed to remove image from entity" };
  }
}

/**
 * Check if an image filename is referenced by any entities
 */
export async function countImageReferences(filename: string): Promise<number> {
  try {
    const db = (await import("@/lib/db")).db;
    const { adventures, sessions, characters, locations, quests, magicItems } =
      await import("@/lib/db/schema");

    const tables = [
      { table: adventures, name: "adventures" },
      { table: sessions, name: "sessions" },
      { table: characters, name: "characters" },
      { table: locations, name: "locations" },
      { table: quests, name: "quests" },
      { table: magicItems, name: "magic_items" },
    ];

    let totalReferences = 0;

    for (const { table } of tables) {
      // Check if images field contains the filename
      const rows = await db
        .select({ images: table.images })
        .from(table)
        .where(sql`${table.images} LIKE ${`%${filename}%`}`);

      for (const row of rows) {
        const images = parseImagesJson(row.images);
        if (images.some((img) => img.filename === filename)) {
          totalReferences++;
        }
      }
    }

    return totalReferences;
  } catch (error) {
    logger.error("Error counting image references", error);
    return 0; // Assume no references on error to be safe
  }
}

/**
 * Remove image from entity images array (client-side utility)
 */
function removeImageFromEntityImages(
  images: ImageInfo[],
  filename: string,
): ImageInfo[] {
  return images.filter((img) => img.filename !== filename);
}

// Re-export client-side functions
export {
  parseImagesJson,
  resultsToImageInfo,
  addImagesToEntity,
  removeImageFromEntity,
} from "./imageUtils.client";
