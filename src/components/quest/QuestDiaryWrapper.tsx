"use client";

import DiaryWrapper from "@/components/ui/diary-wrapper";

interface QuestDiaryWrapperProps {
  questId: number;
  campaignId: number;
}

export default function QuestDiaryWrapper({ questId, campaignId }: QuestDiaryWrapperProps) {
  // If no campaignId is provided, we can't show diary entries
  if (!campaignId) {
    return null;
  }

  return (
    <DiaryWrapper
      entityType="quest"
      entityId={questId}
      campaignId={campaignId}
      title="Quest Diary"
    />
  );
}
