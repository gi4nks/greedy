// Types for parsed D&D 5e entities from Open5e API and other sources

export interface ParsedSpell {
  name: string;
  description: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  components: string;
  ritual?: boolean;
  concentration?: boolean;
}

export interface ParsedMonster {
  name: string;
  description: string;
  size: string;
  type: string;
  alignment: string;
  armorClass: number;
  hitPoints: string;
  hitDice?: string;
  speed: string;
  challengeRating: string;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
}

export interface ParsedMagicItem {
  name: string;
  description: string;
  type: string;
  rarity: string;
  requiresAttunement: boolean;
}

export interface ParsedRace {
  name: string;
  description: string;
  abilityBonuses?: string;
  speed: string;
}

export interface ParsedClass {
  name: string;
  description: string;
  hitDice: string;
  primaryAbility?: string;
  savingThrows?: string;
}