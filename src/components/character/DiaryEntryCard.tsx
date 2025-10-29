"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface DiaryEntry {
  id: number;
  description: string;
  date: string;
  linkedEntities: { id: string; type: string; name: string }[];
  isImportant?: boolean;
}

interface DiaryEntryCardProps {
  entry: DiaryEntry;
  onEdit?: () => void;
  onDelete?: () => void;
  isTextExpanded?: boolean;
  onToggleTextExpanded?: (entryId: number) => void;
  onEntityClick?: (entity: { id: string; type: string; name: string }) => void;
  highlightSearchTerms?: (text: string, searchQuery: string) => string | (string | React.ReactElement)[];
  searchQuery?: string;
}

export default function DiaryEntryCard({ 
  entry, 
  onEdit,
  onDelete,
  isTextExpanded = false,
  onToggleTextExpanded,
  onEntityClick,
  highlightSearchTerms,
  searchQuery = ""
}: DiaryEntryCardProps) {
  const formatDate = (dateString: string) => {
    try {
      // Parse date string in YYYY-MM-DD format
      // Use UTC date to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if parsing fails
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original string on error
    }
  };

  const description = entry.description || 'Untitled Entry';
  
  // Check if text needs truncation (more than 2 lines worth of content)
  const needsTruncation = description.length > 150 || description.split('\n').length > 2;

  return (
    <div
      className="bg-white border border-gray-200 rounded-md p-2 shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Entry Row - Compact Layout */}
      <div className="flex items-start gap-2">
        {/* Date Chip - Smaller */}
        <div className="flex-shrink-0">
          <Badge variant="warning" className="text-xs px-1.5 py-0.5 whitespace-nowrap">
            {formatDate(entry.date)}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Description with compact line clamping - 2 lines max by default */}
              <div className="relative">
                <p className={`text-sm text-gray-900 leading-snug ${
                  !isTextExpanded && needsTruncation ? 'line-clamp-2' : ''
                }`}>
                  {highlightSearchTerms ? highlightSearchTerms(description, searchQuery) : description}
                </p>
                
                {/* Show more/less toggle - inline */}
                {needsTruncation && onToggleTextExpanded && (
                  <button
                    type="button"
                    onClick={() => onToggleTextExpanded(entry.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-1 inline transition-colors"
                  >
                    {isTextExpanded ? 'less' : 'more'}
                  </button>
                )}
              </div>

              {/* Linked Entities - Compact */}
              {entry.linkedEntities && entry.linkedEntities.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {entry.linkedEntities.map((entity) => {
                    // Color coding by entity type
                    const typeColorMap: Record<string, { bg: string; text: string; border: string }> = {
                      'character': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                      'location': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
                      'quest': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                      'adventure': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                      'session': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
                      'npc': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
                      'magic-item': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
                    };
                    const colors = typeColorMap[entity.type] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                    
                    return (
                      <Badge
                        key={`${entity.type}-${entity.id}`}
                        variant="outline"
                        className={`text-xs px-2 py-0.5 ${colors.bg} ${colors.text} ${colors.border} hover:opacity-80 cursor-pointer transition-all`}
                        onClick={() => onEntityClick?.(entity)}
                        title={`${entity.type.replace('-', ' ')}: ${entity.name}`}
                      >
                        {entity.name && <span className="font-medium">{entity.name.substring(0, 20)}{entity.name.length > 20 ? '…' : ''}</span>}
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Important Badge */}
              {entry.isImportant && (
                <Badge variant="warning" className="text-xs mt-1">
                  ⭐ Important
                </Badge>
              )}
            </div>

            {/* Action Buttons - Compact */}
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {onEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="text-gray-400 hover:text-gray-600 p-0.5 h-5 w-5"
                    aria-label="Edit diary entry"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="text-gray-400 hover:text-gray-600 p-0.5 h-5 w-5"
                    aria-label="Delete diary entry"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}