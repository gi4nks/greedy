"use client";

import DiaryWrapper from "@/components/ui/diary-wrapper";

interface LocationDiaryWrapperProps {
  locationId: number;
  campaignId: number;
}

export default function LocationDiaryWrapper({ locationId, campaignId }: LocationDiaryWrapperProps) {
  // If no campaignId is provided, we can't show diary entries
  if (!campaignId) {
    return null;
  }

  return (
    <DiaryWrapper
      entityType="location"
      entityId={locationId}
      campaignId={campaignId}
      title="Location Diary"
    />
  );
}
