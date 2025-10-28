"use client";

import DiaryWrapper from "@/components/ui/diary-wrapper";

interface CharacterDiaryWrapperProps {
  characterId: number;
  campaignId: number;
}

export default function CharacterDiaryWrapper({ characterId, campaignId }: CharacterDiaryWrapperProps) {
  return (
    <DiaryWrapper
      entityType="character"
      entityId={characterId}
      campaignId={campaignId}
      title="Character Journey"
      enableSearch={true}
      enableFiltering={true}
    />
  );
}