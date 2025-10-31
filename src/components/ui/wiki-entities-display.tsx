"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import WikiContent from "@/components/ui/wiki-content";
import { WikiEntitiesDisplayProps } from "@/lib/types/wiki";
import {
  groupWikiEntities,
  generateItemId,
  getEntityBadges,
  getCategoryConfig,
} from "@/lib/utils/wiki";

export default function WikiEntitiesDisplay({
  wikiEntities,
  entityType,
  showImportMessage = true,
  onRemoveEntity,
  isEditable = false,
  removingItems = new Set(),
}: WikiEntitiesDisplayProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const { magicItems, spells, monsters, otherItems } =
    groupWikiEntities(wikiEntities);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Extract description from parsedData or fall back to entity.description
  const getEntityDescription = (entity: typeof wikiEntities[0]): string | null => {
    // First try to get description from parsedData
    if (entity.parsedData) {
      try {
        const parsed = typeof entity.parsedData === "string"
          ? JSON.parse(entity.parsedData)
          : entity.parsedData;

        if (parsed?.description) {
          return parsed.description;
        }
      } catch (error) {
        console.warn("Failed to parse wiki entity parsedData:", error);
      }
    }

    // Fall back to entity.description (which is rawContent)
    return entity.description || null;
  };

  const renderEntitySection = (
    entities: typeof wikiEntities,
    categoryKey: string,
    title: string,
  ) => {
    if (entities.length === 0) return null;

    const categoryConfig = getCategoryConfig(categoryKey);

    return (
      <Card key={categoryKey}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{categoryConfig?.icon}</span>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {entities.map((entity) => {
              const itemId = generateItemId(categoryKey, entity.id);
              const isExpanded = expandedItems.has(itemId);
              const badges = getEntityBadges(entity);

              return (
                <div
                  key={entity.id}
                  className={`border ${categoryConfig?.borderColor} ${categoryConfig?.bgColor} rounded-lg`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div
                      className={`flex items-center gap-2 p-3 cursor-pointer hover:${categoryConfig?.hoverColor} transition-colors flex-1`}
                      onClick={() => toggleExpanded(itemId)}
                    >
                      <span className="text-2xl">{categoryConfig?.icon}</span>
                      <span
                        className={`font-medium ${categoryConfig?.textColor}`}
                      >
                        {entity.title}
                      </span>
                      <div className="flex items-center gap-2">
                        {badges.map((badge) => (
                          <Badge
                            key={badge.key}
                            variant={badge.variant}
                            className={badge.className}
                          >
                            {badge.text}
                          </Badge>
                        ))}
                        {isExpanded ? (
                          <ChevronUp
                            className={`w-4 h-4 ${categoryConfig?.chevronColor}`}
                          />
                        ) : (
                          <ChevronDown
                            className={`w-4 h-4 ${categoryConfig?.chevronColor}`}
                          />
                        )}
                      </div>
                    </div>
                    {isEditable && onRemoveEntity && (
                      <Button
                        type="button"
                        variant="neutral"
                        className="gap-2 mr-3 mt-3"
                        size="sm"
                        onClick={() =>
                          onRemoveEntity(entity.id, entity.contentType)
                        }
                        disabled={removingItems.has(
                          `${entity.contentType}-${entity.id}`,
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                        Unassign
                      </Button>
                    )}
                  </div>
                  {isExpanded && getEntityDescription(entity) && (
                    <div className="px-3 pb-3">
                      <WikiContent
                        content={getEntityDescription(entity)!}
                        importedFrom={entity.importedFrom}
                        className="prose-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const hasAnyEntities =
    magicItems.length > 0 ||
    spells.length > 0 ||
    monsters.length > 0 ||
    otherItems.length > 0;

  if (!hasAnyEntities) {
    return null;
  }

  return (
    <div className="space-y-6">
      {renderEntitySection(
        magicItems,
        "magic-item",
        "Magic Items from Wiki Import",
      )}
      {renderEntitySection(spells, "spell", "Spells from Wiki Import")}
      {renderEntitySection(monsters, "monster", "Creatures from Wiki Import")}
      {renderEntitySection(otherItems, "other", "Other Items from Wiki Import")}

      {showImportMessage && (
        <div className="text-center text-gray-600 text-sm">
          <p>
            These entities were assigned to this {entityType} through the Wiki
            Import feature.
          </p>
          <p>
            Use the Wiki Import page to add more entities to this {entityType}.
          </p>
        </div>
      )}
    </div>
  );
}
