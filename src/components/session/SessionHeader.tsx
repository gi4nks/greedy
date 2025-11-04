"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { Session } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDisplayDate, formatUIDate } from "@/lib/utils/date";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import { Edit } from "lucide-react";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import PromoteToModal, { PromotionType } from "@/components/ui/promote-to-modal";
import { toast } from "sonner";

interface SessionHeaderProps {
  session: Session & {
    campaignId?: number | null;
    wikiEntities?: WikiEntity[];
  };
  campaignId?: number;
}

export function SessionHeader({ 
  session, 
  campaignId,
}: SessionHeaderProps) {
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [isContextualMenuOpen, setIsContextualMenuOpen] = useState(false);
  const [selectedPromotionType, setSelectedPromotionType] = useState<PromotionType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcut for promotion
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only trigger if text is selected and we're not in an input/textarea
    if (selectedText && 
        !isContextualMenuOpen && 
        event.key === 'p' && 
        !event.ctrlKey && 
        !event.metaKey && 
        !event.altKey &&
        !(event.target as HTMLElement)?.matches('input, textarea, [contenteditable]')) {
      
      event.preventDefault();
      setIsContextualMenuOpen(true);
    }
    
    // Close menu on Escape
    if (event.key === 'Escape' && isContextualMenuOpen) {
      setIsContextualMenuOpen(false);
    }
  }, [selectedText, isContextualMenuOpen]);

  // Close dropdown when clicking outside - simplified version
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Only close if clicking completely outside the floating menu area
      // and not on the button or dropdown
      if (isContextualMenuOpen &&
          !target.closest('.btn-circle') &&
          !target.closest('.absolute.top-full') &&
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)) {
        setIsContextualMenuOpen(false);
      }
    };

    if (isContextualMenuOpen) {
      // Add event listener after dropdown is rendered
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 200); // Longer delay

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isContextualMenuOpen]);

  // Handle text selection and contextual menu positioning
  useEffect(() => {
    // Don't handle selection changes when modal is open
    if (isPromoteModalOpen) return;

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && containerRef.current) {
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString().trim();

        if (selectedText) {
          // Check if selection is within our container
          const containerRect = containerRef.current.getBoundingClientRect();
          const selectionBoundingRect = range.getBoundingClientRect();

          // Check if the selection intersects with our container
          const intersects = !(
            selectionBoundingRect.right < containerRect.left ||
            selectionBoundingRect.left > containerRect.right ||
            selectionBoundingRect.bottom < containerRect.top ||
            selectionBoundingRect.top > containerRect.bottom
          );

          if (intersects) {
            setSelectedText(selectedText);
            setSelectionRect(selectionBoundingRect);
            
            // Don't automatically close dropdown - let user control it
            return;
          }
        }
      }

      // Clear selection if no valid selection or outside container
      setSelectedText("");
      setSelectionRect(null);
      setIsContextualMenuOpen(false);
    };

    const handlePointerDown = (event: Event) => {
      // Only clear if clicking outside the floating menu area
      const target = event.target as Element;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !target.closest('.dropdown-content')
      ) {
        setSelectedText("");
        setSelectionRect(null);
        setIsContextualMenuOpen(false);
      }
    };

    // Use selectionchange for better cross-browser support
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange); // Fallback for some browsers
    document.addEventListener('touchend', handleSelectionChange); // Mobile support
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown); // Mobile support

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isPromoteModalOpen]); // Added isPromoteModalOpen to dependencies

  // Handle keyboard shortcut for promotion
  useEffect(() => {
    if (selectedText && !isPromoteModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedText, handleKeyDown, isPromoteModalOpen]);

  const handlePromote = (type: PromotionType) => {
    if (!selectedText) {
      toast.error("Please select some text first");
      return;
    }

    // Magic items can be created globally, others require a campaign
    if (type !== 'magic-item' && !campaignId) {
      toast.error("Promotion to this entity type requires the session to be part of a campaign");
      return;
    }

    setSelectedPromotionType(type);
    setIsPromoteModalOpen(true);
    setIsContextualMenuOpen(false); // Close the contextual menu when modal opens
  };
  return (
    <>
      <div className="space-y-6">
        {/* Session Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{session.title || `Session ${session.id}`}</h1>
            <div className="space-y-1">
              <p className="text-lg text-base-content/70">
                {formatUIDate(session.date)}
              </p>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <Link
              href={
                session.campaignId
                  ? `/campaigns/${session.campaignId}/sessions/${session.id}/edit`
                  : `/sessions/${session.id}/edit`
              }
            >
              <Button variant="secondary" className="gap-2" size="sm">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Session Content */}
        {session.text && (
          <Card className="bg-base-100 shadow-sm relative">
            <CardContent className="p-6">
              <div className="relative" ref={containerRef}>
                <div className="prose prose-sm max-w-none">
                  <MarkdownRenderer content={session.text} />
                </div>

                {/* Contextual Floating Promote Menu */}
                {selectedText && selectionRect && containerRef.current && !isPromoteModalOpen && (
                  <div
                    className="absolute z-50 animate-in fade-in-0 zoom-in-95 duration-200"
                    style={{
                      top: selectionRect.top - containerRef.current.getBoundingClientRect().top - 40,
                      left: Math.max(
                        8,
                        Math.min(
                          selectionRect.left - containerRef.current.getBoundingClientRect().left + (selectionRect.width / 2) - 16, // Center on selection
                          containerRef.current.offsetWidth - 200 // Account for dropdown width
                        )
                      ),
                    }}
                  >
                    {/* Tooltip */}
                    
                    <div className="relative">
                      <button
                        className="btn btn-sm btn-primary btn-circle shadow-lg hover:scale-110 active:scale-95 transition-all duration-150 ring-2 ring-primary/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsContextualMenuOpen(!isContextualMenuOpen);
                        }}
                        title="Promote selected text"
                        aria-label="Open promotion menu for selected text"
                        aria-expanded={isContextualMenuOpen}
                        aria-haspopup="menu"
                      >
                        <span className="text-lg font-bold text-primary-content">⋮</span>
                      </button>
                      {isContextualMenuOpen && (
                        <div 
                          className="absolute top-full left-0 mt-2 bg-base-100 rounded-box shadow-xl w-52 border border-base-300 animate-in fade-in-0 slide-in-from-top-2 duration-150 z-50"
                          role="menu"
                          aria-label="Promotion options"
                        >
                          <div className="p-2">
                            <div className="text-xs text-base-content/70 px-3 py-1 font-medium border-b border-base-300 mb-1">Promote Selection</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromote('character');
                              }}
                              className="flex items-center gap-3 text-sm hover:bg-base-200 px-3 py-2 rounded-md transition-colors w-full text-left focus:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                              role="menuitem"
                              aria-label="Promote to character"
                            >
                              👤 Promote to Character
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromote('quest');
                              }}
                              className="flex items-center gap-3 text-sm hover:bg-base-200 px-3 py-2 rounded-md transition-colors w-full text-left focus:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                              role="menuitem"
                              aria-label="Promote to quest"
                            >
                              🎯 Promote to Quest
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromote('location');
                              }}
                              className="flex items-center gap-3 text-sm hover:bg-base-200 px-3 py-2 rounded-md transition-colors w-full text-left focus:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                              role="menuitem"
                              aria-label="Promote to location"
                            >
                              🗺️ Promote to Location
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromote('magic-item');
                              }}
                              className="flex items-center gap-3 text-sm hover:bg-base-200 px-3 py-2 rounded-md transition-colors w-full text-left focus:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                              role="menuitem"
                              aria-label="Promote to magic item"
                            >
                              ✨ Promote to Magic Item
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromote('diary-note');
                              }}
                              className="flex items-center gap-3 text-sm hover:bg-base-200 px-3 py-2 rounded-md transition-colors w-full text-left focus:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                              role="menuitem"
                              aria-label="Promote to diary note"
                            >
                              📝 Promote to Diary Note
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              
            </CardContent>
          </Card>
        )}

        {/* Wiki Items */}
        {session.wikiEntities && session.wikiEntities.length > 0 && (
          <Card className="bg-base-100 shadow-sm">
            <CardContent className="p-6">
              <WikiEntitiesDisplay
                wikiEntities={session.wikiEntities}
                entityType="session"
                entityId={session.id}
                showImportMessage={true}
                isEditable={false}
              />
            </CardContent>
          </Card>
        )}

        {/* Metadata Footer */}
        <Card className="bg-base-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-sm text-base-content/70">
              <div>Created: {formatDisplayDate(session.createdAt)}</div>
              {session.updatedAt && session.updatedAt !== session.createdAt && (
                <div>Updated: {formatDisplayDate(session.updatedAt)}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promote Modal */}
      {selectedPromotionType && (
        <PromoteToModal
          isOpen={isPromoteModalOpen}
          onClose={() => {
            setIsPromoteModalOpen(false);
            setSelectedText("");
            setSelectedPromotionType(null);
          }}
          campaignId={campaignId || 0}
          adventureId={session.adventureId || undefined}
          prefilledText={selectedText}
          selectedType={selectedPromotionType}
        />
      )}
    </>
  );
}
