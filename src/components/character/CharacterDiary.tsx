"use client";

import DiaryWrapper from "@/components/ui/diary-wrapper";

interface CharacterDiaryProps {
  characterId: number;
  campaignId: number;
}

export default function CharacterDiary({ characterId, campaignId }: CharacterDiaryProps) {
  return (
    <DiaryWrapper
      entityType="character"
      entityId={characterId}
      campaignId={campaignId}
      title="Diary Entries"
      enableSearch={true}
      enableFiltering={true}
    />
  );
}