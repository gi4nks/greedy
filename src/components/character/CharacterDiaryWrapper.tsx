"use client";

import { useState, useEffect } from "react";
import CharacterDiary from "@/components/character/CharacterDiary";
import CollapsibleSection from "@/components/ui/collapsible-section";

interface CharacterDiaryWrapperProps {
  characterId: number;
  campaignId: number;
}

export default function CharacterDiaryWrapper({ characterId, campaignId }: CharacterDiaryWrapperProps) {
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiaryEntries = async () => {
      try {
        const response = await fetch(`/api/characters/${characterId}/diary`);
        if (response.ok) {
          const entries = await response.json();
          setDiaryEntries(entries);
        }
      } catch (error) {
        console.error("Error fetching diary entries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiaryEntries();
  }, [characterId]);

  // Don't render anything if there are no diary entries
  if (!loading && diaryEntries.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection title="Character Journey" className="mb-6">
      <CharacterDiary characterId={characterId} campaignId={campaignId} />
    </CollapsibleSection>
  );
}