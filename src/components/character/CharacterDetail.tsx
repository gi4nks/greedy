"use client";

import { Character, Adventure, Campaign } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EquipmentDisplay from "@/components/ui/equipment-display";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";

interface MagicItem {
  assignmentId?: number;
  id: number;
  name: string;
  rarity: string | null;
  type: string | null;
  description: string | null;
  source: "manual" | "wiki";
  notes?: string | null;
  assignedAt?: string | null;
  campaignId?: number | null;
}

interface CharacterDetailProps {
  character: Character & {
    adventure?: Adventure | null;
    campaign?: Campaign | null;
    magicItems?: MagicItem[];
    wikiEntities?: WikiEntity[];
  };
}

export default function CharacterDetail({ character }: CharacterDetailProps) {

  // Parse classes data
  const parseClasses = () => {
    try {
      const classes =
        typeof character.classes === "string"
          ? JSON.parse(character.classes)
          : character.classes;

      if (Array.isArray(classes) && classes.length > 0) {
        return classes
          .map((c: { name: string; level: number }) => `${c.name} ${c.level}`)
          .join(", ");
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  };

  // Parse equipment data
  const parseEquipment = (): string[] => {
    try {
      const equipment =
        typeof character.equipment === "string"
          ? JSON.parse(character.equipment)
          : character.equipment;
      return Array.isArray(equipment) ? equipment : [];
    } catch {
      return [];
    }
  };

  // Combine manual and wiki magic items
  const getUnifiedMagicItems = () => {
    const manualItems = (character.magicItems || []).map((item) => ({
      ...item,
      source: "manual" as const,
      assignmentId: item.assignmentId,
    }));

    const wikiMagicItems = (character.wikiEntities || [])
      .filter((entity) => entity.contentType === "magic-item")
      .map((entity) => {
        // Parse additional data from parsedData if available
        let rarity: string | null = null;
        let type: string | null = null;
        let description: string | null = entity.description || null;

        try {
          if (entity.parsedData) {
            const parsed =
              typeof entity.parsedData === "string"
                ? JSON.parse(entity.parsedData)
                : entity.parsedData;
            rarity = parsed?.rarity || null;
            type = parsed?.type || null;
            description = parsed?.description || entity.description || null;
          }
        } catch (error) {
          console.warn("Failed to parse wiki magic item data:", error);
        }

        return {
          id: entity.id,
          name: entity.title,
          rarity,
          type,
          description,
          source: "wiki" as const,
          assignmentId: undefined,
          notes: entity.relationshipData
            ? typeof entity.relationshipData === "string"
              ? entity.relationshipData
              : JSON.stringify(entity.relationshipData)
            : null,
          assignedAt: null, // Wiki items don't have assignment dates
          campaignId: null,
        };
      });

    return [...manualItems, ...wikiMagicItems];
  };

  // Filter out magic items from wiki entities for the WikiEntitiesDisplay
  const getFilteredWikiEntities = () => {
    return (character.wikiEntities || []).filter(
      (entity) => entity.contentType !== "magic-item",
    );
  };

  const classesDisplay = parseClasses();
  const equipmentList = parseEquipment();
  const unifiedMagicItems = getUnifiedMagicItems();
  const filteredWikiEntities = getFilteredWikiEntities();

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-base-content/70">
                Race
              </label>
              <p className="text-sm">{character.race || "Unknown"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-base-content/70">
                Classes
              </label>
              <p className="text-sm">{classesDisplay || "Unknown"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-base-content/70">
                Alignment
              </label>
              <p className="text-sm">{character.alignment || "Unknown"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-base-content/70">
                Background
              </label>
              <p className="text-sm">{character.background || "None"}</p>
            </div>
          </div>

          {character.description && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-base-content/70">
                Description
              </label>
              <MarkdownRenderer
                content={character.description}
                className="prose-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wiki Items from Wiki Import */}
      {filteredWikiEntities && filteredWikiEntities.length > 0 && (
        <WikiEntitiesDisplay
          wikiEntities={filteredWikiEntities as WikiEntity[]}
          entityType="character"
          entityId={character.id}
          showImportMessage={true}
          isEditable={false}
        />
      )}

      {/* Magic Items */}
      <Card>
        <CardHeader>
          <CardTitle>Magic Items</CardTitle>
        </CardHeader>
        <CardContent>
          {unifiedMagicItems.length > 0 ? (
            <div className="grid gap-3">
              {unifiedMagicItems.map((item) => (
                <div
                  key={`${item.source}-${item.id}`}
                  className="border border-purple-200 bg-purple-50 rounded-lg"
                >
                  <div className="flex justify-between items-start p-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl">✨</span>
                      <span className="font-medium text-purple-800">
                        {item.name}
                      </span>
                      <Badge
                        variant={
                          item.source === "wiki" ? "secondary" : "default"
                        }
                        className={`text-xs ${item.source === "wiki" ? "bg-blue-500 text-white" : ""}`}
                      >
                        {item.source === "wiki" ? "Wiki" : "Manual"}
                      </Badge>
                      {item.rarity && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-purple-100 border-purple-300 capitalize"
                        >
                          {item.rarity}
                        </Badge>
                      )}
                      {item.type && (
                        <Badge variant="secondary" className="text-xs">
                          {item.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-base-content/70">
              No magic items assigned yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Equipment */}
      {equipmentList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <EquipmentDisplay equipment={equipmentList} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
