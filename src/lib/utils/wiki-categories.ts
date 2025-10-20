// Utility functions for categorizing and managing wiki items

import { logger } from "@/lib/utils/logger";

export type WikiItemCategory =
  | "magic-item"
  | "spell"
  | "class"
  | "race"
  | "monster"
  | "weapon"
  | "armor"
  | "location"
  | "npc"
  | "deity"
  | "organization"
  | "artifact"
  | "other";

export type AssignableEntity =
  | "character"
  | "npc"
  | "quest"
  | "session"
  | "location"
  | "campaign";

export interface WikiItemAssignment {
  itemId: number;
  itemTitle: string;
  itemCategory: WikiItemCategory;
  entityType: AssignableEntity;
  entityId: number;
  entityName: string;
  campaignId: number;
  createdAt: string;
  notes?: string;
}

/**
 * Detect the category of a wiki item based on its title and content
 */
export function detectWikiItemCategory(
  title: string,
  content?: string,
): WikiItemCategory {
  const titleLower = title.toLowerCase();
  const contentLower = content?.toLowerCase() || "";

  // Magic Items - rings, wands, potions, etc.
  if (
    titleLower.includes("ring of") ||
    titleLower.includes("wand of") ||
    titleLower.includes("potion of") ||
    titleLower.includes("scroll of") ||
    titleLower.includes("staff of") ||
    titleLower.includes("rod of") ||
    titleLower.includes("amulet") ||
    titleLower.includes("cloak of") ||
    titleLower.includes("boots of") ||
    titleLower.includes("gauntlets of") ||
    titleLower.includes("helm of") ||
    titleLower.includes("bag of") ||
    titleLower.includes("deck of") ||
    titleLower.includes("orb of") ||
    titleLower.includes("crystal ball") ||
    contentLower.includes("magic item") ||
    contentLower.includes("magic ring") ||
    contentLower.includes("magical item")
  ) {
    return "magic-item";
  }

  // Spells
  if (
    titleLower.includes(" spell") ||
    contentLower.includes("spell level") ||
    contentLower.includes("casting time") ||
    contentLower.includes("spell components") ||
    contentLower.includes("verbal, somatic") ||
    (titleLower.match(
      /\b(fireball|magic missile|cure|heal|charm|sleep|invisibility)\b/,
    ) &&
      !titleLower.includes("ring of") &&
      !titleLower.includes("potion of"))
  ) {
    return "spell";
  }

  // Character Classes
  if (
    titleLower.includes("fighter") ||
    titleLower.includes("wizard") ||
    titleLower.includes("cleric") ||
    titleLower.includes("thief") ||
    titleLower.includes("ranger") ||
    titleLower.includes("paladin") ||
    titleLower.includes("druid") ||
    titleLower.includes("barbarian") ||
    titleLower.includes("bard") ||
    titleLower.includes("sorcerer") ||
    contentLower.includes("character class") ||
    contentLower.includes("class abilities")
  ) {
    return "class";
  }

  // Races
  if (
    titleLower.includes("elf") ||
    titleLower.includes("dwarf") ||
    titleLower.includes("halfling") ||
    titleLower.includes("human") ||
    titleLower.includes("gnome") ||
    titleLower.includes("half-orc") ||
    titleLower.includes("half-elf") ||
    contentLower.includes("player character race") ||
    contentLower.includes("racial abilities")
  ) {
    return "race";
  }

  // Monsters/Creatures
  if (
    titleLower.includes("dragon") ||
    titleLower.includes("demon") ||
    titleLower.includes("devil") ||
    titleLower.includes("undead") ||
    titleLower.includes("skeleton") ||
    titleLower.includes("zombie") ||
    titleLower.includes("troll") ||
    titleLower.includes("ogre") ||
    titleLower.includes("orc") ||
    titleLower.includes("goblin") ||
    contentLower.includes("armor class") ||
    contentLower.includes("hit dice") ||
    contentLower.includes("monster") ||
    contentLower.includes("creature type")
  ) {
    return "monster";
  }

  // Weapons
  if (
    titleLower.includes("sword") ||
    titleLower.includes("bow") ||
    titleLower.includes("axe") ||
    titleLower.includes("mace") ||
    titleLower.includes("dagger") ||
    titleLower.includes("spear") ||
    titleLower.includes("crossbow") ||
    titleLower.includes("weapon") ||
    contentLower.includes("weapon type") ||
    contentLower.includes("damage:")
  ) {
    return "weapon";
  }

  // Armor
  if (
    titleLower.includes("armor") ||
    titleLower.includes("mail") ||
    titleLower.includes("plate") ||
    titleLower.includes("leather") ||
    titleLower.includes("shield") ||
    (contentLower.includes("armor class") &&
      contentLower.includes("protection"))
  ) {
    return "armor";
  }

  // Locations
  if (
    titleLower.includes("city of") ||
    titleLower.includes("temple of") ||
    titleLower.includes("dungeon") ||
    titleLower.includes("castle") ||
    titleLower.includes("tower") ||
    titleLower.includes("ruins of") ||
    contentLower.includes("location") ||
    contentLower.includes("settlement") ||
    contentLower.includes("geographic")
  ) {
    return "location";
  }

  // NPCs (often have parenthetical descriptors)
  if (
    titleLower.match(
      /\([^)]*(?:npc|character|person|lord|king|queen|priest|merchant|guard)\)/i,
    ) ||
    contentLower.includes("npc") ||
    contentLower.includes("non-player character")
  ) {
    return "npc";
  }

  // Deities
  if (
    titleLower.includes("god of") ||
    titleLower.includes("goddess of") ||
    titleLower.includes("deity") ||
    contentLower.includes("divine") ||
    contentLower.includes("pantheon")
  ) {
    return "deity";
  }

  // Organizations
  if (
    titleLower.includes("guild") ||
    titleLower.includes("order of") ||
    titleLower.includes("brotherhood") ||
    titleLower.includes("sisterhood") ||
    titleLower.includes("company") ||
    contentLower.includes("organization") ||
    contentLower.includes("faction")
  ) {
    return "organization";
  }

  // Artifacts (usually unique, powerful items)
  if (
    titleLower.includes("artifact") ||
    titleLower.includes("legendary") ||
    contentLower.includes("artifact") ||
    contentLower.includes("legendary item")
  ) {
    return "artifact";
  }

  return "other";
}

/**
 * Get display information for a wiki item category
 */
export function getCategoryDisplayInfo(category: WikiItemCategory): {
  label: string;
  color: string;
  icon: string;
} {
  const categoryInfo = {
    "magic-item": { label: "Magic Item", color: "bg-purple-500", icon: "✨" },
    spell: { label: "Spell", color: "bg-blue-500", icon: "🔮" },
    class: { label: "Class", color: "bg-green-500", icon: "🛡️" },
    race: { label: "Race", color: "bg-yellow-500", icon: "👥" },
    monster: { label: "Monster", color: "bg-red-500", icon: "👹" },
    weapon: { label: "Weapon", color: "bg-orange-500", icon: "⚔️" },
    armor: { label: "Armor", color: "bg-neutral", icon: "🛡️" },
    location: { label: "Location", color: "bg-teal-500", icon: "🏰" },
    npc: { label: "NPC", color: "bg-indigo-500", icon: "👤" },
    deity: { label: "Deity", color: "bg-amber-500", icon: "✨" },
    organization: { label: "Organization", color: "bg-cyan-500", icon: "🏛️" },
    artifact: { label: "Artifact", color: "bg-pink-500", icon: "💎" },
    other: { label: "Other", color: "bg-base-300", icon: "📜" },
  };

  return categoryInfo[category];
}

/**
 * Get available entities for assignment based on campaign
 */
export async function getAssignableEntities(campaignId: number): Promise<{
  characters: Array<{ id: number; name: string }>;
  npcs: Array<{ id: number; name: string }>;
  sessions: Array<{ id: number; title: string; sessionNumber: number }>;
  locations: Array<{ id: number; name: string }>;
}> {
  try {
    const [charactersRes, npcsRes, sessionsRes, locationsRes] =
      await Promise.all([
        fetch(`/api/campaigns/${campaignId}/characters`),
        fetch(`/api/campaigns/${campaignId}/npcs`),
        fetch(`/api/campaigns/${campaignId}/sessions`),
        fetch(`/api/campaigns/${campaignId}/locations`),
      ]);

    return {
      characters: charactersRes.ok ? await charactersRes.json() : [],
      npcs: npcsRes.ok ? await npcsRes.json() : [],
      sessions: sessionsRes.ok ? await sessionsRes.json() : [],
      locations: locationsRes.ok ? await locationsRes.json() : [],
    };
  } catch (error) {
    logger.error("Failed to load assignable entities", error);
    return {
      characters: [],
      npcs: [],
      sessions: [],
      locations: [],
    };
  }
}
