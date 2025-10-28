"use client";

import { useState } from "react";

/**
 * Shared tag management utilities and hooks
 */

export interface TagManagementState {
  tags: string[];
  newTag: string;
}

/**
 * Hook for managing tags in forms
 */
export function useTagManagement(initialTags: string[] = []) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const parseTags = (tagsData: unknown): string[] => {
    if (typeof tagsData === "string") {
      try {
        const parsed = JSON.parse(tagsData);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(tagsData) ? tagsData : [];
  };

  return {
    tags,
    setTags,
    newTag,
    setNewTag,
    addTag,
    removeTag,
    handleKeyPress,
    parseTags,
  };
}

/**
 * Utility functions for tag operations
 */
export const tagUtils = {
  /**
   * Parse tags from various formats (string, array, etc.)
   */
  parseTags: (tagsData: unknown): string[] => {
    if (typeof tagsData === "string") {
      try {
        const parsed = JSON.parse(tagsData);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(tagsData) ? tagsData : [];
  },

  /**
   * Serialize tags for form submission
   */
  serializeTags: (tags: string[]): string => {
    return tags.join(",");
  },

  /**
   * Validate tag input
   */
  isValidTag: (tag: string): boolean => {
    return tag.trim().length > 0 && tag.trim().length <= 50;
  },
};