"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WikiEntity } from "@/lib/types/wiki";

/**
 * Shared wiki item management utilities
 */

export interface WikiItemManagementState {
  wikiEntities: WikiEntity[];
  removingItems: Set<string>;
}

/**
 * Hook for managing wiki items in forms
 */
export function useWikiItemManagement(initialWikiEntities: WikiEntity[] = []) {
  const [wikiEntities, setWikiEntities] = useState<WikiEntity[]>(initialWikiEntities);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  const removeWikiItem = async (
    wikiArticleId: number,
    _contentType: string,
    entityType: string,
    entityId?: number
  ) => {
    const itemKey = `wiki-${wikiArticleId}`;

    // Prevent duplicate removal operations
    if (removingItems.has(itemKey)) {
      return;
    }

    // Add to removing set to show loading state
    setRemovingItems(prev => new Set(prev).add(itemKey));

    try {
      const response = await fetch(
        `/api/wiki-articles/${wikiArticleId}/entities`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entityType,
            entityId,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);

        // Treat 404 as success (item already removed)
        if (response.status === 404) {
          console.log("Item already removed (404), treating as success");
        } else {
          throw new Error(`Failed to remove wiki item: ${errorText}`);
        }
      }

      const result = response.ok ? await response.json() : null;
      if (result) {
        console.log("API success result:", result);
      }

      // Update local state - remove the entity from wikiEntities
      setWikiEntities(prev =>
        prev.filter(entity => entity.id !== wikiArticleId)
      );
      console.log("Wiki item removed successfully");
    } catch (error) {
      console.error("Error removing wiki item:", error);
      toast.error("Failed to remove wiki item. Please try again.");
    } finally {
      // Remove from removing set
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  return {
    wikiEntities,
    setWikiEntities,
    removingItems,
    removeWikiItem,
  };
}