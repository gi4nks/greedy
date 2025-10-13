import { NextRequest, NextResponse } from "next/server";
import {
  deleteImage,
  removeImageFromEntityDB,
  countImageReferences,
  EntityType,
} from "@/lib/utils/imageUtils";
import { logger } from "@/lib/utils/logger";

export async function DELETE(request: NextRequest) {
  try {
    const { filename, entityType, entityId } = await request.json();

    if (!filename || !entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing filename, entityType, or entityId" },
        { status: 400 },
      );
    }

    // Remove the image association from the entity
    logger.info(
      `Removing image association: ${filename} from ${entityType} ${entityId}`,
    );
    const removeResult = await removeImageFromEntityDB(
      entityType as EntityType,
      entityId,
      filename,
    );

    if (!removeResult.success) {
      logger.error(`Failed to remove image association: ${removeResult.error}`);
      return NextResponse.json({ error: removeResult.error }, { status: 400 });
    }

    // Check if this image is referenced by any other entities
    const referenceCount = await countImageReferences(filename);
    logger.info(`Image ${filename} has ${referenceCount} remaining references`);

    if (referenceCount === 0) {
      // No more references, safe to delete the file
      logger.info(`Deleting image file: ${filename} (${entityType})`);
      const deleteResult = await deleteImage(
        filename,
        entityType as EntityType,
      );

      if (!deleteResult.success) {
        logger.warn(`Failed to delete image file: ${deleteResult.error}`);
        // Don't return error here as the association was successfully removed
      } else {
        logger.info(`Successfully deleted image file: ${filename}`);
      }
    } else {
      logger.info(
        `Keeping image file ${filename} - still referenced by ${referenceCount} entities`,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
