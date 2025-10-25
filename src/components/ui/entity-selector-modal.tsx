"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X, Users, MapPin, BookOpen, Play, User, EyeOff, Plus } from "lucide-react";

interface Entity {
    id: number;
    name: string;
    type: string;
    subtype?: string;
}

interface EntitySelectorModalProps {
    campaignId: number;
    isOpen: boolean;
    onClose: () => void;
    onSelect: (entity: { id: string; type: string; name: string }) => void;
    title?: string;
    selectLabel?: string;
    excludedEntities?: Array<{ id: string; type: string }>;
    sourceEntity?: { id: string; type: string; name: string };
}

const ENTITY_TYPES = [
    { value: "character", label: "Character", icon: Users },
    { value: "npc", label: "NPC", icon: Users },
    { value: "location", label: "Location", icon: MapPin },
    { value: "quest", label: "Quest", icon: BookOpen },
    { value: "adventure", label: "Adventure", icon: Play },
    { value: "session", label: "Session", icon: User },
];

export default function EntitySelectorModal({
    campaignId,
    isOpen,
    onClose,
    onSelect,
    title = "Select Entity",
    selectLabel = "Entity",
    excludedEntities = [],
    sourceEntity,
}: EntitySelectorModalProps) {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [selectedEntity, setSelectedEntity] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchEntities = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all entities for the campaign - same logic as relations + quests
            const [charactersRes, npcsRes, locationsRes, adventuresRes, sessionsRes, questsRes] = await Promise.all([
                fetch(`/api/campaigns/${campaignId}/characters`),
                fetch(`/api/campaigns/${campaignId}/npcs`),
                fetch(`/api/campaigns/${campaignId}/locations`),
                fetch(`/api/campaigns/${campaignId}/adventures`),
                fetch(`/api/campaigns/${campaignId}/sessions`),
                fetch(`/api/quests?campaignId=${campaignId}`),
            ]);

            const allEntities: Entity[] = [];

            if (charactersRes.ok) {
                const characters: any[] = await charactersRes.json();
                // Separate PCs and NPCs from the characters table
                characters.forEach((character) => {
                    if (character.characterType === 'pc' || !character.characterType) {
                        allEntities.push({ id: character.id, name: character.name, type: "character", subtype: "character" });
                    } else if (character.characterType === 'npc') {
                        allEntities.push({ id: character.id, name: character.name, type: "character", subtype: "NPC" });
                    }
                });
            }

            if (npcsRes.ok) {
                const npcs: any[] = await npcsRes.json();
                // Add NPCs from the separate NPCs table
                allEntities.push(...npcs.map((npc) => ({ id: npc.id, name: npc.name, type: "npc" })));
            }

            if (locationsRes.ok) {
                const locations: any[] = await locationsRes.json();
                allEntities.push(...locations.map((l: any) => ({ id: l.id, name: l.name, type: "location" })));
            }

            if (adventuresRes.ok) {
                const adventures: any[] = await adventuresRes.json();
                allEntities.push(...adventures.map((a: any) => ({ id: a.id, name: a.title, type: "adventure" })));
            }

            if (sessionsRes.ok) {
                const sessions: any[] = await sessionsRes.json();
                allEntities.push(...sessions.map((s: any) => ({ id: s.id, name: s.title, type: "session" })));
            }

            if (questsRes.ok) {
                const quests: any[] = await questsRes.json();
                allEntities.push(...quests.map((q: any) => ({ id: q.id, name: q.title, type: "quest" })));
            }

            // Deduplicate entities based on id and effective type (subtype || type)
            const entityMap = new Map<string, Entity>();
            allEntities.forEach((entity) => {
                const key = `${entity.id}-${entity.subtype || entity.type}`;
                if (!entityMap.has(key)) {
                    entityMap.set(key, entity);
                }
            });
            const deduplicatedEntities = Array.from(entityMap.values());

            setEntities(deduplicatedEntities);
        } catch (error) {
            console.error("Error fetching entities:", error);
        } finally {
            setLoading(false);
        }
    }, [campaignId]);

    useEffect(() => {
        if (isOpen) {
            fetchEntities();
            setSelectedEntity("");
        }
    }, [isOpen, fetchEntities]);

    const handleSelect = () => {
        if (!selectedEntity) return;

        const [type, id] = selectedEntity.split(":");
        const entity = entities.find(e => e.type === type && e.id.toString() === id);

        if (entity) {
            onSelect({
                id: entity.id.toString(),
                type: entity.subtype || entity.type,
                name: entity.name,
            });
            setSelectedEntity("");
        }
    };

    const getEntityIcon = (type: string) => {
        const entityType = ENTITY_TYPES.find(et => et.value === type);
        return entityType ? entityType.icon : Users;
    };

    const isEntityExcluded = (entity: Entity) => {
        // Exclude entities that are already linked to the current diary entry
        const isInExcludedList = Array.isArray(excludedEntities) && excludedEntities.some(
            excluded => excluded.id === entity.id.toString() && excluded.type === (entity.subtype || entity.type)
        );

        // Exclude the source entity (the entity from which this modal was opened)
        const isSourceEntity = sourceEntity && sourceEntity.id === entity.id.toString() && sourceEntity.type === (entity.subtype || entity.type);

        return isInExcludedList || isSourceEntity;
    };

    const availableEntities = entities.filter(e => !isEntityExcluded(e));

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-md w-full mx-4 max-h-[90vh] overflow-visible">
                <div className="flex flex-col">
                    {/* Header - Sticky */}
                    <div className="sticky top-0 bg-base-100 z-10 pb-4 border-b border-base-300 mb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{title}</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    onClose();
                                    setSelectedEntity("");
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <Label htmlFor="entity">{selectLabel}</Label>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <span className="loading loading-spinner loading-md" />
                                </div>
                            ) : (
                                <Select name="entity" value={selectedEntity} onValueChange={setSelectedEntity}>
                                    <SelectTrigger className="w-full">
                                        <div className="flex items-center w-full">
                                            <span className="truncate">
                                                {selectedEntity ? (() => {
                                                    const [type, id] = selectedEntity.split(":");
                                                    const entity = entities.find(e => e.type === type && e.id.toString() === id);
                                                    return entity ? entity.name : `Select ${selectLabel.toLowerCase()}`;
                                                })() : `Select ${selectLabel.toLowerCase()}`}
                                            </span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent
                                        className="z-[9999] max-h-[60vh] overflow-y-auto w-max min-w-[var(--radix-select-trigger-width)]"
                                    >
                                        <div className="grid gap-1 p-1">
                                            {availableEntities.map((entity) => {
                                                const Icon = getEntityIcon(entity.type);
                                                const displayType = entity.subtype ? `${entity.subtype}` : entity.type;
                                                return (
                                                    <SelectItem
                                                        key={`${entity.type}:${entity.id}`}
                                                        value={`${entity.type}:${entity.id}`}
                                                        className="cursor-pointer hover:bg-base-200 focus:bg-base-200 px-3 py-2 rounded-md"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Icon className="w-4 h-4 flex-shrink-0 text-base-content/70" />
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="font-medium truncate text-sm">{entity.name}</span>
                                                                <span className="text-xs text-base-content/60 capitalize">{displayType}</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </div>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                            <Button
                                onClick={handleSelect}
                                variant="primary"
                                size="sm"
                                disabled={!selectedEntity || loading}
                            >
                                <Plus className="w-4 h-4" />
                                Add Entity
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onClose();
                                    setSelectedEntity("");
                                }}
                                size="sm"
                            >
                                <EyeOff className="w-4 h-4" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
