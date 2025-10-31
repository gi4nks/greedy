"use client";

import { ReactNode } from "react";
import { EntitySidebar } from "@/components/ui/entity-sidebar";
import { MagicItemAssignmentComposer } from "@/components/magic-items/MagicItemAssignmentComposer";
import type { MagicItemWithAssignments } from "@/lib/actions/magicItems";

interface MagicItemSidebarProps {
  item: MagicItemWithAssignments;
  campaignOptions: Array<{ id: number; title: string }>;
  additionalContent?: ReactNode;
}

export function MagicItemSidebar({ item, campaignOptions, additionalContent }: MagicItemSidebarProps) {
  const existingAssignments = item.assignments.map((assignment) => ({
    entityType: assignment.entityType,
    entityId: assignment.entityId,
  }));

  return (
    <EntitySidebar
      metadata={{
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }}
      metadataVariant="compact"
      quickActions={
        <MagicItemAssignmentComposer
          itemId={item.id}
          existingAssignments={existingAssignments}
          campaignOptions={campaignOptions}
        />
      }
      additionalContent={additionalContent}
    />
  );
}
