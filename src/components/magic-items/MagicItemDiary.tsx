"use client";

import DiaryWrapper from "@/components/ui/diary-wrapper";

interface MagicItemDiaryProps {
  itemId: number;
  campaignId?: number;
}

export function MagicItemDiary({ itemId, campaignId }: MagicItemDiaryProps) {
  // If no campaignId is provided, we can't show diary entries
  if (!campaignId) {
    return null;
  }

  return (
    <DiaryWrapper
      entityType="magic-item"
      entityId={itemId}
      campaignId={campaignId}
      title="Diary"
      enableSearch={true}
      enableFiltering={true}
    />
  );
}