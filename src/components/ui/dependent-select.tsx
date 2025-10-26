"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EntityOption {
  id: number;
  name: string;
}

interface DependentSelectProps {
  entityType: string;
  entities: {
    characters: EntityOption[];
    npcs: EntityOption[];
    sessions: Array<{ id: number; title: string; sessionNumber: number }>;
    locations: EntityOption[];
  };
  selectedEntityId: number | null;
  onEntityTypeChange: (type: string) => void;
  onEntityIdChange: (id: number, name: string) => void;
  loading?: boolean;
}

export function DependentSelect({
  entityType,
  entities,
  selectedEntityId,
  onEntityTypeChange,
  onEntityIdChange,
  loading = false,
}: DependentSelectProps) {
  const currentEntityList = useMemo(() => {
    switch (entityType) {
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
  }, [entityType, entities]);

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Assign to:</label>
        <Select
          name="entityType"
          value={entityType}
          onValueChange={(value) => {
            onEntityTypeChange(value);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="character">Character</SelectItem>
            <SelectItem value="npc">NPC</SelectItem>
            <SelectItem value="session">Session</SelectItem>
            <SelectItem value="location">Location</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Select {entityType}:</label>
        <Select
          key={entityType}
          name="entityId"
          value={selectedEntityId?.toString() || ""}
          onValueChange={(value) => {
            const id = parseInt(value);
            const entity = currentEntityList.find((e) => e.id === id);
            onEntityIdChange(id, entity?.name || "");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Loading..." : `Choose a ${entityType}...`} />
          </SelectTrigger>
          <SelectContent>
            {currentEntityList.map((entity) => (
              <SelectItem key={entity.id} value={entity.id.toString()}>
                {entity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}