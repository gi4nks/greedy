/**
 * Open5e API Service
 * Provides real-time access to D&D 5e content from https://api.open5e.com/
 * This replaces the local 5e.tools data scraping approach.
 */

const BASE_URL = "https://api.open5e.com";

export interface Open5eMagicItem {
  slug: string;
  name: string;
  desc: string;
  rarity: string;
  type: string;
  requires_attunement: boolean;
  document__title?: string;
  document__slug?: string;
}

export interface Open5eSpell {
  slug: string;
  name: string;
  desc: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  duration: string;
  components: string;
  ritual: boolean;
  concentration: boolean;
  document__title?: string;
  document__slug?: string;
}

export interface Open5eMonster {
  slug: string;
  name: string;
  desc: string;
  size: string;
  type: string;
  alignment: string;
  armor_class: number;
  hit_points: number;
  hit_dice: string;
  speed: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  challenge_rating: string;
  document__title?: string;
  document__slug?: string;
}

export interface Open5eClass {
  slug: string;
  name: string;
  desc: string;
  hit_dice: string;
  primary_ability: string;
  saving_throws: string;
  document__title?: string;
  document__slug?: string;
}

export interface Open5eRace {
  slug: string;
  name: string;
  desc: string;
  ability_bonuses: string;
  speed: string;
  document__title?: string;
  document__slug?: string;
}

export interface Open5eResponse<T> {
  results: T[];
  next?: string;
  count: number;
}

/**
 * Generic fetch method for Open5e API with error handling
 */
async function fetchFromOpen5e<T>(endpoint: string, searchQuery?: string): Promise<T[]> {
  try {
    let url = `${BASE_URL}${endpoint}/`;

    if (searchQuery && searchQuery.trim()) {
      // Open5e uses 'search' parameter for full-text search
      url += `?search=${encodeURIComponent(searchQuery)}`;
    }

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "greedy-dnd-app/1.0",
      },
    });

    if (!response.ok) {
      console.error(
        `Open5e API error: ${response.status} ${response.statusText} for URL: ${url}`,
      );
      return [];
    }

    const data = (await response.json()) as Open5eResponse<T>;
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching from Open5e API (${endpoint}):`, error);
    return [];
  }
}

/**
 * Search for magic items
 */
export async function searchOpen5eMagicItems(
  query?: string,
): Promise<Open5eMagicItem[]> {
  return fetchFromOpen5e<Open5eMagicItem>("/magicitems", query);
}

/**
 * Search for spells
 */
export async function searchOpen5eSpells(
  query?: string,
): Promise<Open5eSpell[]> {
  return fetchFromOpen5e<Open5eSpell>("/spells", query);
}

/**
 * Search for monsters
 */
export async function searchOpen5eMonsters(
  query?: string,
): Promise<Open5eMonster[]> {
  return fetchFromOpen5e<Open5eMonster>("/monsters", query);
}

/**
 * Search for classes
 */
export async function searchOpen5eClasses(
  query?: string,
): Promise<Open5eClass[]> {
  return fetchFromOpen5e<Open5eClass>("/classes", query);
}

/**
 * Search for races
 */
export async function searchOpen5eRaces(
  query?: string,
): Promise<Open5eRace[]> {
  return fetchFromOpen5e<Open5eRace>("/races", query);
}

/**
 * Parse Open5e magic item to standardized format for import
 */
export function parseOpen5eMagicItemForImport(item: Open5eMagicItem) {
  return {
    name: item.name,
    description: item.desc || "No description available",
    type: item.type || "Wondrous Item",
    rarity: item.rarity || "Unknown",
    requiresAttunement: item.requires_attunement ?? false,
  };
}

/**
 * Parse Open5e spell to standardized format for import
 */
export function parseOpen5eSpellForImport(spell: Open5eSpell) {
  return {
    name: spell.name,
    description: spell.desc || "No description available",
    level: spell.level,
    school: spell.school,
    castingTime: spell.casting_time,
    range: spell.range,
    duration: spell.duration,
    components: spell.components,
    ritual: spell.ritual,
    concentration: spell.concentration,
  };
}

/**
 * Parse Open5e monster to standardized format for import
 */
export function parseOpen5eMonsterForImport(monster: Open5eMonster) {
  return {
    name: monster.name,
    description: monster.desc || "No description available",
    size: monster.size,
    type: monster.type,
    alignment: monster.alignment,
    armorClass: monster.armor_class,
    hitPoints: monster.hit_points.toString(),
    hitDice: monster.hit_dice,
    speed: monster.speed,
    challengeRating: monster.challenge_rating,
    stats: {
      str: monster.strength,
      dex: monster.dexterity,
      con: monster.constitution,
      int: monster.intelligence,
      wis: monster.wisdom,
      cha: monster.charisma,
    },
  };
}

/**
 * Parse Open5e class to standardized format for import
 */
export function parseOpen5eClassForImport(cls: Open5eClass) {
  return {
    name: cls.name,
    description: cls.desc || "No description available",
    hitDice: cls.hit_dice,
    primaryAbility: cls.primary_ability,
    savingThrows: cls.saving_throws,
  };
}

/**
 * Parse Open5e race to standardized format for import
 */
export function parseOpen5eRaceForImport(race: Open5eRace) {
  return {
    name: race.name,
    description: race.desc || "No description available",
    abilityBonuses: race.ability_bonuses,
    speed: race.speed,
  };
}
