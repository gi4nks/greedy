"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  BookOpen,
  X,
  EyeOff,
} from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import {
  WikiItemCategory,
  AssignableEntity,
  getAssignableEntities,
  getCategoryDisplayInfo,
} from "@/lib/utils/wiki-categories";
import { DependentSelect } from "@/components/ui/dependent-select";

interface WikiItemAssignmentDialogProps {
  itemId: number;
  itemTitle: string;
  itemCategory: WikiItemCategory;
  campaignId: number;
  onAssign: (assignment: {
    entityType: AssignableEntity;
    entityId: number;
    entityName: string;
    notes?: string;
  }) => void;
}

export function WikiItemAssignmentDialog({
  itemId: _itemId,
  itemTitle,
  itemCategory,
  campaignId,
  onAssign,
}: WikiItemAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedEntityType, setSelectedEntityType] =
    useState<AssignableEntity>("character");
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [selectedEntityName, setSelectedEntityName] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [entities, setEntities] = useState<{
    characters: Array<{ id: number; name: string }>;
    npcs: Array<{ id: number; name: string }>;
    sessions: Array<{ id: number; title: string; sessionNumber: number }>;
    locations: Array<{ id: number; name: string }>;
  }>({
    characters: [],
    npcs: [],
    sessions: [],
    locations: [],
  });
  const [loading, setLoading] = useState(false);

  const categoryInfo = getCategoryDisplayInfo(itemCategory);

  const loadEntities = useCallback(async () => {
    setLoading(true);
    try {
      const entitiesData = await getAssignableEntities(campaignId);
      console.log("Loaded entities:", entitiesData);
      setEntities(entitiesData);
    } catch (error) {
      console.error("Failed to load entities:", error);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (open && campaignId) {
      loadEntities();
    }
  }, [open, campaignId, loadEntities]);

  const handleAssign = () => {
    if (selectedEntityId && selectedEntityName) {
      onAssign({
        entityType: selectedEntityType,
        entityId: selectedEntityId,
        entityName: selectedEntityName,
        notes: notes.trim() || undefined,
      });
      setOpen(false);
      // Reset form
      setSelectedEntityId(null);
      setSelectedEntityName("");
      setNotes("");
    }
  };

  const currentEntityList = useMemo(() => {
    const list = (() => {
      switch (selectedEntityType) {
        case "character":
          return entities.characters.map((c) => ({ id: c.id, name: c.name }));
        case "npc":
          return entities.npcs.map((n) => ({ id: n.id, name: n.name }));
        case "session":
          return entities.sessions.map((s) => ({
            id: s.id,
            name: `Session ${s.sessionNumber}: ${s.title}`,
          }));
        case "location":
          return entities.locations.map((l) => ({ id: l.id, name: l.name }));
        default:
          return [];
      }
    })();
    console.log(`Current entity list for ${selectedEntityType}:`, list);
    return list;
  }, [selectedEntityType, entities]);

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        className="gap-1"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-3 h-3" />
        Assign
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <CardTitle>Assign Wiki Item</CardTitle>
                  <Badge className={`${categoryInfo.color} text-white`}>
                    {categoryInfo.icon} {categoryInfo.label}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-1">Item</h4>
                <p className="text-sm text-base-content/70">{itemTitle}</p>
              </div>

              <DependentSelect
                entityType={selectedEntityType}
                entities={entities}
                selectedEntityId={selectedEntityId}
                onEntityTypeChange={(type) => {
                  setSelectedEntityType(type as AssignableEntity);
                  setSelectedEntityId(null);
                  setSelectedEntityName("");
                }}
                onEntityIdChange={(id, name) => {
                  setSelectedEntityId(id);
                  setSelectedEntityName(name);
                }}
                loading={loading}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional):</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this assignment..."
                  rows={3}
                />
              </div>
            </CardContent>

            <CardFooter>
              <Button onClick={handleAssign} disabled={!selectedEntityId || loading} variant="secondary">
                <Plus className="w-4 h-4" />
                Assign
              </Button>
              <Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(false)}>
                <EyeOff className="w-4 h-4" />
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
