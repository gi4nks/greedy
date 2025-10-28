"use client";

import { useState, useEffect, useMemo } from "react";
import CollapsibleSection from "@/components/ui/collapsible-section";
import DiaryComponent from "@/components/ui/diary-component";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";

interface DiaryWrapperProps {
  entityType: string;
  entityId: number;
  campaignId: number;
  title?: string;
  enableSearch?: boolean;
  enableFiltering?: boolean;
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
  enableSearch = true,
  enableFiltering = true
}: DiaryWrapperProps) {
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState<string[]>([]);

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

  // Get unique entity types for filtering
  const availableEntityTypes = useMemo(() => {
    const types = new Set<string>();
    if (Array.isArray(diaryEntries)) {
      diaryEntries.forEach(entry => {
        entry.linkedEntities.forEach(entity => {
          types.add(entity.type);
        });
      });
    }
    return Array.from(types).sort();
  }, [diaryEntries]);

  // Filter entries based on search and entity filter
  const filteredEntries = useMemo(() => {
    if (!Array.isArray(diaryEntries)) return [];
    return diaryEntries.filter(entry => {
      // Search filter
      if (searchQuery && !entry.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Entity type filter
      if (entityFilter.length > 0) {
        const entryEntityTypes = entry.linkedEntities.map(e => e.type);
        const hasMatchingEntity = entityFilter.some(filterType =>
          entryEntityTypes.includes(filterType)
        );
        if (!hasMatchingEntity) {
          return false;
        }
      }

      return true;
    });
  }, [diaryEntries, searchQuery, entityFilter]);

  // Don't render anything if there are no diary entries
  if (!loading && diaryEntries.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection title={title} className="mb-6">
      <DiaryComponent
        entityType={entityType as "character" | "location" | "quest"}
        entityId={entityId}
        campaignId={campaignId}
        initialEntries={filteredEntries}
        loading={loading}
      />
    </CollapsibleSection>
  );
}