"use client";

import { useState, useEffect } from "react";
import CollapsibleSection from "@/components/ui/collapsible-section";
import DiaryComponent from "@/components/ui/diary-component";

interface DiaryWrapperProps {
  entityType: string;
  entityId: number;
  campaignId: number;
  title?: string;
}

interface DiaryEntry {
  id: number;
  description: string;
  date: string;
  linkedEntities: { id: string; type: string; name: string }[];
  isImportant: boolean;
}

export default function DiaryWrapper({
  entityType,
  entityId,
  campaignId,
  title = "Diary",
}: DiaryWrapperProps) {
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiaryEntries = async () => {
      try {
        const response = await fetch(`/api/${entityType}s/${entityId}/diary`);
        if (response.ok) {
          const result = await response.json();
          const entries = result.data;
          if (Array.isArray(entries)) {
            setDiaryEntries(entries);
          } else {
            console.error('Diary entries data is not an array:', entries);
            setDiaryEntries([]);
          }
        } else {
          console.error(`Failed to fetch ${entityType} diary entries:`, response.status);
          setDiaryEntries([]);
        }
      } catch (error) {
        console.error(`Error fetching ${entityType} diary entries:`, error);
        setDiaryEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDiaryEntries();
  }, [entityType, entityId]);

  // Don't render anything if there are no diary entries and not loading
  // Actually, we should always show the section so users can add entries
  // Only hide if we're still loading
  if (loading) {
    return null;
  }

  return (
    <CollapsibleSection title={title} className="mb-6">
      <DiaryComponent
        entityType={entityType as "character" | "location" | "quest"}
        entityId={entityId}
        campaignId={campaignId}
        initialEntries={diaryEntries}
        loading={loading}
      />
    </CollapsibleSection>
  );
}
