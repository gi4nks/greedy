"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Star } from "lucide-react";

interface DiaryEntry {
  id: number;
  description: string;
  date: string;
  linkedEntities: { id: string; type: string; name: string }[];
  isImportant?: boolean;
}

interface DiaryEntryCardProps {
  entry: DiaryEntry;
  isFirst?: boolean;
  onEdit?: () => void;
  isTextExpanded?: boolean;
  onToggleTextExpanded?: (entryId: number) => void;
  onEntityClick?: (entity: { id: string; type: string; name: string }) => void;
  highlightSearchTerms?: (text: string, searchQuery: string) => string | (string | React.ReactElement)[];
  searchQuery?: string;
}

export default function DiaryEntryCard({ 
  entry, 
  isFirst = false, 
  onEdit,
  isTextExpanded = false,
  onToggleTextExpanded,
  onEntityClick,
  highlightSearchTerms,
  searchQuery = ""
}: DiaryEntryCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const description = entry.description || 'Untitled Entry';
  
  // Check if text needs truncation (more than 2 lines worth of content)
  const needsTruncation = description.length > 150 || description.split('\n').length > 2;

  return (
    <div
      className="bg-white border border-gray-200 rounded-md p-3 shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Entry Row */}
      <div className="flex items-start gap-3">
        {/* Date Chip */}
        <div className="flex-shrink-0">
          <Badge variant="warning" className="text-xs px-2 py-1">
            {formatDate(entry.date)}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Description with line clamping */}
              <div className="relative">
                <p className={`text-sm text-gray-900 leading-relaxed ${
                  !isTextExpanded && needsTruncation ? 'line-clamp-2' : ''
                }`}>
                  {highlightSearchTerms ? highlightSearchTerms(description, searchQuery) : description}
                </p>
                
                {/* Show more/less toggle */}
                {needsTruncation && onToggleTextExpanded && (
                  <button
                    type="button"
                    onClick={() => onToggleTextExpanded(entry.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 transition-colors"
                  >
                    {isTextExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              {/* Linked Entities */}
              {entry.linkedEntities && entry.linkedEntities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.linkedEntities.map((entity) => (
                    <Badge
                      key={`${entity.type}-${entity.id}`}
                      variant="outline"
                      className="text-xs px-1.5 py-0.5 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => onEntityClick?.(entity)}
                    >
                      <span className="capitalize text-xs">{entity.type.replace('-', ' ')}</span>
                      <span className="font-medium ml-1">{entity.name}</span>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Important Badge */}
              {entry.isImportant && (
                <Badge variant="warning" className="text-xs mt-2">
                  ⭐ Important
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            {onEdit && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
                  aria-label="Edit diary entry"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}