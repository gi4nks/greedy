export const SUPPORTED_MAGIC_ITEM_ENTITY_TYPES = [
  "character",
  "location",
  "adventure",
  "session",
] as const;

export type MagicItemAssignableEntity =
  (typeof SUPPORTED_MAGIC_ITEM_ENTITY_TYPES)[number];

export interface AssignableEntityOption {
  id: number;
  name: string;
  description: string | null;
  entityType: MagicItemAssignableEntity;
  campaignId: number | null;
  campaignTitle: string | null;
  path: string | null;
}
