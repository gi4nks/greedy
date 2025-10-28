"use client";

import { useState } from "react";

/**
 * Shared entity selection utilities
 */

export interface Entity {
  id: string;
  type: string;
  name: string;
}

export interface EntitySelectorState {
  isEntitySelectorOpen: boolean;
  selectedEntities: Entity[];
}

/**
 * Hook for managing entity selection in forms
 */
export function useEntitySelector(initialEntities: Entity[] = []) {
  const [isEntitySelectorOpen, setIsEntitySelectorOpen] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>(initialEntities);

  const openEntitySelector = () => {
    setIsEntitySelectorOpen(true);
  };

  const closeEntitySelector = () => {
    setIsEntitySelectorOpen(false);
  };

  const addEntity = (entity: Entity) => {
    const exists = selectedEntities.some(
      selected => selected.id === entity.id && selected.type === entity.type
    );
    if (!exists) {
      setSelectedEntities(prev => [...prev, entity]);
    }
    setIsEntitySelectorOpen(false);
  };

  const removeEntity = (entityId: string) => {
    setSelectedEntities(prev => prev.filter(entity => entity.id !== entityId));
  };

  const clearEntities = () => {
    setSelectedEntities([]);
  };

  return {
    isEntitySelectorOpen,
    selectedEntities,
    openEntitySelector,
    closeEntitySelector,
    addEntity,
    removeEntity,
    clearEntities,
    setSelectedEntities,
  };
}