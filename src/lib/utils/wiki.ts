import { WikiEntity, WikiEntityGroup, WIKI_CATEGORIES } from "@/lib/types/wiki";

/**
 * Groups wiki entities by their content type for display
 */
export function groupWikiEntities(wikiEntities: WikiEntity[]): {
  magicItems: WikiEntity[];
  spells: WikiEntity[];
  monsters: WikiEntity[];
  otherItems: WikiEntity[];
} {
  const grouped: WikiEntityGroup = {};

  // Initialize groups
  wikiEntities.forEach((entity) => {
    const contentType = entity.contentType;
    if (!grouped[contentType]) {
      grouped[contentType] = [];
    }
    grouped[contentType].push(entity);
  });

  return {
    magicItems: grouped["magic-item"] || [],
    spells: grouped["spell"] || [],
    monsters: grouped["monster"] || [],
    otherItems: Object.entries(grouped)
      .filter(
        ([contentType]) =>
          !["magic-item", "spell", "monster"].includes(contentType),
      )
      .flatMap(([, items]) => items),
  };
}

/**
 * Gets the category configuration for a given content type
 */
export function getCategoryConfig(contentType: string) {
  return (
    WIKI_CATEGORIES.find((cat) => cat.key === contentType) ||
    WIKI_CATEGORIES.find((cat) => cat.key === "other")
  );
}

/**
 * Generates a unique item ID for expandable items
 */
export function generateItemId(contentType: string, entityId: number): string {
  return `${contentType}-${entityId}`;
}

/**
 * Returns badge data for wiki entities based on their parsed data
 */
export function getEntityBadges(entity: WikiEntity): Array<{
  key: string;
  text: string;
  variant: "default" | "secondary" | "outline";
  className: string;
}> {
  const badges: Array<{
    key: string;
    text: string;
    variant: "default" | "secondary" | "outline";
    className: string;
  }> = [];

  if (entity.contentType === "magic-item" && entity.parsedData) {
    const parsedData = entity.parsedData as { rarity?: string; type?: string };
    if (parsedData.rarity) {
      badges.push({
        key: "rarity",
        text: parsedData.rarity,
        variant: "outline",
        className: "text-xs bg-purple-100 border-purple-300",
      });
    }
    if (parsedData.type) {
      badges.push({
        key: "type",
        text: parsedData.type,
        variant: "secondary",
        className: "text-xs",
      });
    }
  }

  if (entity.contentType === "spell" && entity.parsedData) {
    const parsedData = entity.parsedData as { level?: number; school?: string };
    if (parsedData.level !== undefined) {
      badges.push({
        key: "level",
        text: `Level ${parsedData.level || 0}`,
        variant: "outline",
        className: "text-xs bg-blue-100 border-blue-300",
      });
    }
    if (parsedData.school) {
      badges.push({
        key: "school",
        text: parsedData.school,
        variant: "secondary",
        className: "text-xs",
      });
    }
    if ((entity.relationshipData as { isPrepared?: boolean })?.isPrepared) {
      badges.push({
        key: "prepared",
        text: "Prepared",
        variant: "default",
        className: "text-xs bg-green-100 text-green-800 border-green-300",
      });
    }
  }

  if (entity.contentType === "monster" && entity.parsedData) {
    const parsedData = entity.parsedData as {
      challengeRating?: string | number;
    };
    if (parsedData.challengeRating) {
      badges.push({
        key: "cr",
        text: `CR ${parsedData.challengeRating}`,
        variant: "outline",
        className: "text-xs bg-red-100 border-red-300",
      });
    }
    if (entity.relationshipType) {
      badges.push({
        key: "relationship",
        text: entity.relationshipType,
        variant: "secondary",
        className: "text-xs capitalize",
      });
    }
  }

  if (!["magic-item", "spell", "monster"].includes(entity.contentType)) {
    badges.push({
      key: "content-type",
      text: entity.contentType.replace("-", " "),
      variant: "outline",
      className: "text-xs bg-gray-100 border-gray-300 capitalize",
    });
  }

  return badges;
}
