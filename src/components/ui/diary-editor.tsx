"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X, Plus, EyeOff } from "lucide-react";
import { toast } from "sonner";
import EntitySelectorModal from "@/components/ui/entity-selector-modal";

interface DiaryEntry {
  id: number;
  description: string;
  date: string;
  linkedEntities: { id: string; type: string; name: string }[];
  isImportant: boolean;
}

interface DiaryEditorProps {
  entityType: "character" | "location" | "quest";
  entityId: number;
  campaignId: number;
  entry?: DiaryEntry;
  onSave: (entry: DiaryEntry) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function DiaryEditor({
  entityType,
  entityId,
  campaignId,
  entry,
  onSave,
  onCancel,
  isOpen
}: DiaryEditorProps) {
  const [description, setDescription] = useState(entry?.description || "");
  const [date, setDate] = useState(entry?.date || new Date().toISOString().split("T")[0]);
  const [linkedEntities, setLinkedEntities] = useState(entry?.linkedEntities || []);
  const [isImportant, setIsImportant] = useState(entry?.isImportant || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEntitySelectorOpen, setIsEntitySelectorOpen] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const diaryEntry = {
        id: entry?.id,
        description: description.trim(),
        date,
        linkedEntities,
        isImportant,
      };

      const method = entry?.id ? "PUT" : "POST";
      const url = entry?.id
        ? `/api/${entityType}s/${entityId}/diary/${entry.id}`
        : `/api/${entityType}s/${entityId}/diary`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diaryEntry),
      });

      if (!response.ok) {
        throw new Error("Failed to save diary entry");
      }

      const savedEntry = await response.json();
      toast.success(entry?.id ? "Diary entry updated" : "Diary entry created");
      onSave(savedEntry);
    } catch (error) {
      console.error("Error saving diary entry:", error);
      toast.error("Failed to save diary entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLinkedEntity = (entity: { id: string; type: string; name: string }) => {
    const exists = linkedEntities.some(
      (linked) => linked.id === entity.id && linked.type === entity.type,
    );
    if (!exists) {
      setLinkedEntities([...linkedEntities, entity]);
    }
    setIsEntitySelectorOpen(false);
  };

  const removeLinkedEntity = (entityId: string) => {
    setLinkedEntities(linkedEntities.filter((entity) => entity.id !== entityId));
  };

  if (!isOpen) return null;

  return (
    <>
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle>{entry?.id ? "Edit Diary Entry" : "New Diary Entry"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="diary-date">Date</Label>
              <Input
                id="diary-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="diary-important"
                type="checkbox"
                className="h-4 w-4"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
              />
              <Label htmlFor="diary-important" className="text-sm">
                Mark as important
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="diary-description">Notes *</Label>
            <Textarea
              id="diary-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe what happened to this ${entityType}...`}
            />
          </div>

          <div className="space-y-2">
            <Label>Linked entities</Label>
            {linkedEntities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {linkedEntities.map((entity) => (
                  <Badge
                    key={`${entity.type}-${entity.id}`}
                    variant="outline"
                    className="gap-2"
                  >
                    <span className="text-xs uppercase text-muted-foreground">
                      {entity.type.replace("-", " ")}
                    </span>
                    {entity.name}
                    <button
                      type="button"
                      onClick={() => removeLinkedEntity(entity.id)}
                      aria-label="Remove linked entity"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No linked entities yet. Connect entries to characters, quests, or locations for quick reference.
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEntitySelectorOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add linked entity
            </Button>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              <EyeOff className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !description.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : entry?.id ? "Update" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <EntitySelectorModal
        campaignId={campaignId}
        isOpen={isEntitySelectorOpen}
        onClose={() => setIsEntitySelectorOpen(false)}
        onSelect={addLinkedEntity}
        title="Link Entity"
        selectLabel="Entity"
        excludedEntities={linkedEntities}
        sourceEntity={{
          id: entityId.toString(),
          type: entityType,
          name: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${entityId}`,
        }}
      />
    </>
  );
}