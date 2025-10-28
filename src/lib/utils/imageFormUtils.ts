"use client";

import { useState } from "react";
import { ImageInfo, parseImagesJson } from "@/lib/utils/imageUtils.client";

/**
 * Shared image management utilities and hooks
 */

export interface ImageManagementState {
  images: ImageInfo[];
}

/**
 * Hook for managing images in forms
 */
export function useImageManagement(initialImages: ImageInfo[] = []) {
  const [images, setImages] = useState<ImageInfo[]>(initialImages);

  const handleImagesChange = (newImages: ImageInfo[]) => {
    setImages(newImages);
  };

  return {
    images,
    setImages: handleImagesChange,
  };
}

/**
 * Utility functions for image operations
 */
export const imageUtils = {
  /**
   * Parse images from entity data
   */
  parseImages: (imagesData: unknown): ImageInfo[] => {
    return parseImagesJson(imagesData);
  },

  /**
   * Serialize images for form submission
   */
  serializeImages: (images: ImageInfo[]): string => {
    return JSON.stringify(images);
  },

  /**
   * Check if images can be edited (only in edit mode with entity ID)
   */
  canEditImages: (mode: "create" | "edit", entityId?: number): boolean => {
    return mode === "edit" && !!entityId;
  },
};