"use client";

import { useState, useEffect } from "react";
import CollapsibleSection from "@/components/ui/collapsible-section";
import DiaryComponent from "@/components/ui/diary-component";
import {
  type DiaryEntry,
  type DiaryEntityType,
} from "@/lib/types/diary";

interface DiaryWrapperProps {
  entityType: DiaryEntityType;
  entityId: number;
  campaignId: number;
  title?: string;
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
            console.error("Diary entries data is not an array:", entries);
            setDiaryEntries([]);
          }
        } else {
          console.error(
            `Failed to fetch ${entityType} diary entries:`,
            response.status,
          );
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

  if (loading) {
    return null;
  }

  return (
    <CollapsibleSection title={title} className="mb-6">
      <DiaryComponent
        entityType={entityType}
        entityId={entityId}
        campaignId={campaignId}
        initialEntries={diaryEntries}
        loading={loading}
        disableAutoFetch
      />
    </CollapsibleSection>
  );
}
