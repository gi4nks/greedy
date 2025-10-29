"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import DiaryEntryCard from "@/components/character/DiaryEntryCard";
import DiaryEditor from "@/components/ui/diary-editor";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, Plus } from "lucide-react";

interface DiaryEntry {
  id: number;
  description: string;
  date: string;
  linkedEntities: { id: string; type: string; name: string }[];
  isImportant: boolean;
}

interface DiaryComponentProps {
  entityType: "character" | "location" | "quest";
  entityId: number;
  campaignId: number;
  initialEntries?: DiaryEntry[];
  loading?: boolean;
}

export default function DiaryComponent({
  entityType,
  entityId,
  campaignId,
  initialEntries = [],
  loading = false
}: DiaryComponentProps) {
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(initialEntries);
  const [diarySearchQuery, setDiarySearchQuery] = useState("");
  const [diaryEntityFilter, setDiaryEntityFilter] = useState<string[]>([]);
  const [expandedTexts, setExpandedTexts] = useState<Set<number>>(new Set());
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  const fetchDiaryEntries = useCallback(async () => {
    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/diary`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setDiaryEntries(result.data);
        } else {
          console.error(`Unexpected API response format for ${entityType} diary entries`);
          setDiaryEntries([]);
        }
      } else {
        console.error(`Failed to fetch ${entityType} diary entries`);
        setDiaryEntries([]);
      }
    } catch (error) {
      console.error(`Error fetching ${entityType} diary entries:`, error);
      toast.error(`Failed to load diary entries`);
      setDiaryEntries([]);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (initialEntries.length === 0) {
      fetchDiaryEntries();
    }
  }, [entityType, entityId, fetchDiaryEntries, initialEntries.length]);

  // Helper function to highlight search terms
  const highlightSearchTerms = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Handle clicking on linked entities
  const handleEntityClick = (entity: { id: string; type: string; name: string }) => {
    // Navigate to the appropriate entity page based on type
    const entityRoutes: Record<string, string> = {
      'character': `/campaigns/${campaignId}/characters/${entity.id}`,
      'location': `/campaigns/${campaignId}/locations/${entity.id}`,
      'session': `/campaigns/${campaignId}/sessions/${entity.id}`,
      'quest': `/campaigns/${campaignId}/quests/${entity.id}`,
      'magic-item': `/campaigns/${campaignId}/magic-items/${entity.id}`,
      'adventure': `/campaigns/${campaignId}/adventures/${entity.id}`,
    };

    const route = entityRoutes[entity.type];
    if (route) {
      router.push(route);
    }
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setShowEditor(true);
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm("Are you sure you want to delete this diary entry?")) {
      return;
    }

    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/diary/${entryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete diary entry");
      }

      setDiaryEntries(prev => prev.filter(entry => entry.id !== entryId));
      toast.success("Diary entry deleted");
    } catch (error) {
      console.error("Error deleting diary entry:", error);
      toast.error("Failed to delete diary entry");
    }
  };

  const handleSaveEntry = (savedEntry: DiaryEntry) => {
    if (editingEntry) {
      // Update existing entry
      setDiaryEntries(prev => prev.map(entry =>
        entry.id === savedEntry.id ? savedEntry : entry
      ));
    } else {
      // Add new entry
      setDiaryEntries(prev => [savedEntry, ...prev]);
    }
    setShowEditor(false);
    setEditingEntry(undefined);
  };

    const handleCancelEdit = () => {
    setShowEditor(false);
    setEditingEntry(undefined);
  };

  const toggleTextExpanded = (entryId: number) => {
    const newExpanded = new Set(expandedTexts);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedTexts(newExpanded);
  };

  // Filter diary entries based on search query and entity filter (client-side only)
  const filteredDiaryEntries = useMemo(() => {
    if (!Array.isArray(diaryEntries)) {
      return [];
    }
    return diaryEntries.filter((entry) => {
      // Content search filter
      const contentMatches = !diarySearchQuery.trim() ||
        entry.description?.toLowerCase().includes(diarySearchQuery.toLowerCase()) ||
        entry.linkedEntities?.some(entity => entity.name.toLowerCase().includes(diarySearchQuery.toLowerCase()));

      // Entity type filter
      const entityMatches = diaryEntityFilter.length === 0 ||
        entry.linkedEntities?.some(entity => diaryEntityFilter.includes(entity.type));

      return contentMatches && entityMatches;
    });
  }, [diaryEntries, diarySearchQuery, diaryEntityFilter]);

  // Sort by newest first
  const sortedEntries = [...filteredDiaryEntries].sort((a, b) => {
    // Parse dates safely - handle YYYY-MM-DD format
    const parseDate = (dateString: string) => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day)).getTime();
    };
    
    try {
      return parseDate(b.date) - parseDate(a.date);
    } catch {
      // Fallback to string comparison if parsing fails
      return b.date.localeCompare(a.date);
    }
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-base-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">Diary Entries</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => {
              setEditingEntry(undefined);
              setShowEditor(true);
            }}
            className="flex items-center gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Compact Search and Filter Bar */}
      {Array.isArray(diaryEntries) && diaryEntries.length > 0 && (
        <div className="space-y-3">
          {/* Search Bar and Filter Toggle in one row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search entries..."
                value={diarySearchQuery}
                onChange={(e) => setDiarySearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                aria-label="Search diary entries"
              />
              {diarySearchQuery && (
                <button
                  onClick={() => setDiarySearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Filter Toggle Button */}
            <Button
              type="button"
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 whitespace-nowrap"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {diaryEntityFilter.length > 0 && (
                <Badge className="ml-1 bg-blue-600 text-white px-1.5 py-0 text-xs">
                  {diaryEntityFilter.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Active Filters Badges (Compact) */}
          {(diaryEntityFilter.length > 0 || diarySearchQuery) && (
            <div className="flex flex-wrap items-center gap-1">
              {diarySearchQuery && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 flex items-center gap-1">
                  Search: &quot;{diarySearchQuery.substring(0, 10)}{diarySearchQuery.length > 10 ? '...' : ''}&quot;
                </Badge>
              )}
              {diaryEntityFilter.map((entityType) => (
                <Badge
                  key={entityType}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-gray-300"
                  onClick={() => setDiaryEntityFilter(prev => prev.filter(type => type !== entityType))}
                >
                  {entityType.replace('-', ' ')}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
              {(diaryEntityFilter.length > 0 || diarySearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setDiarySearchQuery("");
                    setDiaryEntityFilter([]);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 ml-1 underline"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Collapsible Filter Buttons */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-gray-600">Filter by entity type:</div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const allEntityTypes = new Set<string>();
                  if (Array.isArray(diaryEntries)) {
                    diaryEntries.forEach(entry => {
                      entry.linkedEntities?.forEach(entity => {
                        allEntityTypes.add(entity.type);
                      });
                    });
                  }

                  const availableTypes = Array.from(allEntityTypes).sort();
                  
                  if (availableTypes.length === 0) {
                    return <p className="text-xs text-gray-500">No linked entities found</p>;
                  }

                  return availableTypes.map((entityType) => {
                    const isSelected = diaryEntityFilter.includes(entityType);
                    return (
                      <button
                        type="button"
                        key={entityType}
                        onClick={() => {
                          if (isSelected) {
                            setDiaryEntityFilter(prev => prev.filter(type => type !== entityType));
                          } else {
                            setDiaryEntityFilter(prev => [...prev, entityType]);
                          }
                        }}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                          isSelected
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {entityType.replace('-', ' ')}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diary Entries List */}
      {sortedEntries.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {Array.isArray(diaryEntries) && diaryEntries.length === 0 ? `No diary entries yet` : "No matching entries"}
          </h3>
          <p className="text-gray-500 mb-4">
            {Array.isArray(diaryEntries) && diaryEntries.length === 0
              ? `Start documenting the ${entityType}'s journey by adding your first diary entry.`
              : "Try adjusting your search terms or filters to find what you're looking for."
            }
          </p>
          {Array.isArray(diaryEntries) && diaryEntries.length > 0 && (diarySearchQuery || diaryEntityFilter.length > 0) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDiarySearchQuery("");
                setDiaryEntityFilter([]);
              }}
              className="text-sm"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEntries.map((entry, index) => (
            <DiaryEntryCard
              key={entry.id}
              entry={entry}
              isTextExpanded={expandedTexts.has(entry.id)}
              onToggleTextExpanded={toggleTextExpanded}
              onEntityClick={handleEntityClick}
              highlightSearchTerms={highlightSearchTerms}
              searchQuery={diarySearchQuery}
              onEdit={() => handleEditEntry(entry)}
              onDelete={() => handleDeleteEntry(entry.id)}
            />
          ))}
        </div>
      )}

      <DiaryEditor
        entityType={entityType}
        entityId={entityId}
        campaignId={campaignId}
        entry={editingEntry}
        onSave={handleSaveEntry}
        onCancel={handleCancelEdit}
        isOpen={showEditor}
      />
    </div>
  );
}