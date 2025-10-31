import type { DiaryEntityType } from "@/lib/types/diary";

const pluralMap: Record<DiaryEntityType, string> = {
  "character": "characters",
  "location": "locations",
  "quest": "quests",
  "magic-item": "magic-items",
};

export function getDiaryApiPath(
  entityType: DiaryEntityType,
  entityId: number,
  entryId?: number,
): string {
  const plural = pluralMap[entityType];
  if (!plural) {
    throw new Error(`Unsupported diary entity type: ${entityType}`);
  }

  const basePath = `/api/${plural}/${entityId}/diary`;
  return entryId !== undefined ? `${basePath}/${entryId}` : basePath;
}
