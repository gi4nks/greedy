export interface DnD5eItem {
  name: string;
  source: string;
  page?: number;
  type?: string;
  rarity?: string;
  reqAttune?: boolean | string;
  weight?: number;
  value?: number;
  entries?: DnD5eEntry[];
}

export interface DnD5eSpell {
  name: string;
  source: string;
  page?: number;
  level: number;
  school: string;
  time: Array<{ number: number; unit: string }>;
  range: { type: string; distance?: { type: string; amount: number } };
  components?: { v?: boolean; s?: boolean; m?: string | { text: string } };
  duration: Array<{ type: string; duration?: { type: string; amount: number } }>;
  entries?: DnD5eEntry[];
  entriesHigherLevel?: DnD5eEntry[];
  classes: { fromClassList: Array<{ name: string; source: string }> };
}

export interface DnD5eMonster {
  name: string;
  source: string;
  page?: number;
  size: string;
  type: string | { type: string; tags?: string[] };
  alignment: string[];
  ac: Array<{ ac: number; from?: string[] }>;
  hp: { average: number; formula: string };
  speed: Record<string, number>;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  cr: string | number;
  entries?: DnD5eEntry[];
}

export interface DnD5eRace {
  name: string;
  source: string;
  page?: number;
  ability?: Array<{ str?: number; dex?: number; con?: number; int?: number; wis?: number; cha?: number; choose?: DnD5eAbilityChoice }>;
  size: string;
  speed: number;
  entries?: DnD5eEntry[];
  subraces?: Array<{ name: string; entries?: DnD5eEntry[] }>;
}

export interface DnD5eClass {
  name: string;
  source: string;
  page?: number;
  hd: { number: number; faces: number };
  proficiency: string[];
  startingProficiencies?: {
    armor?: string[];
    weapons?: string[];
    tools?: string[];
    skills?: Array<{ choose?: DnD5eSkillChoice; from: string[] }>;
  };
  startingEquipment?: unknown;
  classTableGroups?: unknown[];
  classFeatures?: string[];
}

type DnD5eEntry =
  | string
  | { type: 'entries'; name?: string; entries: DnD5eEntry[] }
  | { type: 'list'; items: DnD5eEntry[] }
  | { type: 'table'; rows: string[][] };

type DnD5eAbilityChoice = {
  count: number;
  from: Array<{ str?: number; dex?: number; con?: number; int?: number; wis?: number; cha?: number }>;
};

type DnD5eSkillChoice = {
  count: number;
  from: string[];
};

export class DnD5eToolsService {
  private static readonly BASE_URL = 'https://5e.tools/data';
  
  // 5e.tools data files - these contain the actual content
  private static readonly DATA_SOURCES = {
    spells: '/spells/spells-phb.json',
    items: '/items/items-base.json',
    magicItems: '/items/magicitems.json',
    monsters: '/bestiary/bestiary-mm.json',
    races: '/races.json',
    classes: '/classes.json',
    backgrounds: '/backgrounds.json',
    feats: '/feats.json'
  };

  /**
   * Generic fetch method for 5e.tools JSON data
   */
  private static async fetchData<T>(endpoint: string): Promise<T[]> {
    try {
      // Use our backend proxy to avoid CORS issues
      const response = await fetch(`/api/5etools/data?source=${encodeURIComponent(endpoint)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch 5e.tools data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 5e.tools JSON structure varies by type
      // Most have the data in a property matching the content type
      const keys = Object.keys(data);
      const dataKey = keys.find(key => Array.isArray(data[key])) || keys[0];
      
      return data[dataKey] || data;
    } catch (error) {
      console.error('Error fetching 5e.tools data:', error);
      throw error;
    }
  }

  /**
   * Search spells from D&D 5e
   */
  static async searchSpells(query?: string): Promise<DnD5eSpell[]> {
    try {
      const allSpells = await this.fetchData<DnD5eSpell>(this.DATA_SOURCES.spells);
      
      if (!query) return allSpells;
      
      const searchTerm = query.toLowerCase();
      return allSpells.filter(spell => 
        spell.name.toLowerCase().includes(searchTerm) ||
        spell.school.toLowerCase().includes(searchTerm) ||
        (spell.entries && spell.entries.some(entry => 
          typeof entry === 'string' && entry.toLowerCase().includes(searchTerm)
        ))
      );
    } catch (error) {
      console.error('Error searching 5e spells:', error);
      return [];
    }
  }

  /**
   * Search magic items from D&D 5e
   */
  static async searchMagicItems(query?: string): Promise<DnD5eItem[]> {
    try {
      const allItems = await this.fetchData<DnD5eItem>(this.DATA_SOURCES.magicItems);
      
      if (!query) return allItems;
      
      const searchTerm = query.toLowerCase();
      return allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        (item.type && item.type.toLowerCase().includes(searchTerm)) ||
        (item.rarity && item.rarity.toLowerCase().includes(searchTerm))
      );
    } catch (error) {
      console.error('Error searching 5e magic items:', error);
      return [];
    }
  }

  /**
   * Search monsters from D&D 5e
   */
  static async searchMonsters(query?: string): Promise<DnD5eMonster[]> {
    try {
      const allMonsters = await this.fetchData<DnD5eMonster>(this.DATA_SOURCES.monsters);
      
      if (!query) return allMonsters;
      
      const searchTerm = query.toLowerCase();
      return allMonsters.filter(monster => 
        monster.name.toLowerCase().includes(searchTerm) ||
        (typeof monster.type === 'string' && monster.type.toLowerCase().includes(searchTerm)) ||
        (typeof monster.type === 'object' && monster.type.type.toLowerCase().includes(searchTerm))
      );
    } catch (error) {
      console.error('Error searching 5e monsters:', error);
      return [];
    }
  }

  /**
   * Search races from D&D 5e
   */
  static async searchRaces(query?: string): Promise<DnD5eRace[]> {
    try {
      const allRaces = await this.fetchData<DnD5eRace>(this.DATA_SOURCES.races);
      
      if (!query) return allRaces;
      
      const searchTerm = query.toLowerCase();
      return allRaces.filter(race => 
        race.name.toLowerCase().includes(searchTerm) ||
        race.size.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching 5e races:', error);
      return [];
    }
  }

  /**
   * Search classes from D&D 5e
   */
  static async searchClasses(query?: string): Promise<DnD5eClass[]> {
    try {
      const allClasses = await this.fetchData<DnD5eClass>(this.DATA_SOURCES.classes);
      
      if (!query) return allClasses;
      
      const searchTerm = query.toLowerCase();
      return allClasses.filter(cls => 
        cls.name.toLowerCase().includes(searchTerm) ||
        (cls.proficiency && cls.proficiency.some(prof => prof.toLowerCase().includes(searchTerm)))
      );
    } catch (error) {
      console.error('Error searching 5e classes:', error);
      return [];
    }
  }

  /**
   * Convert 5e.tools entries to readable text
   */
  static parseEntries(entries: DnD5eEntry[]): string {
    if (!entries || !Array.isArray(entries)) return '';

    return entries.map(entry => {
      if (typeof entry === 'string') {
        return entry;
      } else if (entry.type === 'entries' && entry.entries) {
        return `${entry.name ? entry.name + ': ' : ''}${this.parseEntries(entry.entries)}`;
      } else if (entry.type === 'list' && entry.items) {
        return entry.items.map((item: DnD5eEntry) => `• ${typeof item === 'string' ? item : this.parseEntries([item])}`).join('\n');
      } else if (entry.type === 'table' && entry.rows) {
        // Simple table rendering
        return entry.rows.map((row: string[]) => row.join(' | ')).join('\n');
      }
      return '';
    }).filter(text => text.trim()).join('\n\n');
  }

  /**
   * Parse spell data for import
   */
  static parseSpellForImport(spell: DnD5eSpell): {
    name: string;
    description: string;
    level: number;
    school: string;
    castingTime: string;
    range: string;
    duration: string;
    components: string;
  } {
    const castingTime = spell.time ? 
      spell.time.map(t => `${t.number} ${t.unit}`).join(', ') : 
      'Unknown';

    const range = spell.range ? 
      spell.range.type === 'point' ? 
        `${spell.range.distance?.amount} ${spell.range.distance?.type}` :
        spell.range.type :
      'Unknown';

    const duration = spell.duration ?
      spell.duration.map(d => 
        d.type === 'timed' ? 
          `${d.duration?.amount} ${d.duration?.type}` :
          d.type
      ).join(', ') :
      'Unknown';

    const components = [];
    if (spell.components?.v) components.push('V');
    if (spell.components?.s) components.push('S');
    if (spell.components?.m) {
      const material = typeof spell.components.m === 'string' ? 
        spell.components.m : 
        spell.components.m.text;
      components.push(`M (${material})`);
    }

    return {
      name: spell.name,
      description: this.parseEntries(spell.entries || []),
      level: spell.level,
      school: spell.school,
      castingTime,
      range,
      duration,
      components: components.join(', ')
    };
  }

  /**
   * Parse monster data for import
   */
  static parseMonsterForImport(monster: DnD5eMonster): {
    name: string;
    description: string;
    size: string;
    type: string;
    alignment: string;
    armorClass: number;
    hitPoints: string;
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
  } {
    const type = typeof monster.type === 'string' ? 
      monster.type : 
      `${monster.type.type}${monster.type.tags ? ` (${monster.type.tags.join(', ')})` : ''}`;

    const ac = monster.ac && monster.ac.length > 0 ? monster.ac[0].ac : 10;
    
    const speedEntries = Object.entries(monster.speed || {})
      .map(([type, value]) => `${type} ${value} ft.`)
      .join(', ');

    return {
      name: monster.name,
      description: this.parseEntries(monster.entries || []),
      size: monster.size,
      type,
      alignment: monster.alignment.join(' '),
      armorClass: ac,
      hitPoints: `${monster.hp.average} (${monster.hp.formula})`,
      speed: speedEntries,
      challengeRating: monster.cr.toString(),
      stats: {
        str: monster.str,
        dex: monster.dex,
        con: monster.con,
        int: monster.int,
        wis: monster.wis,
        cha: monster.cha
      }
    };
  }

  /**
   * Parse magic item data for import
   */
  static parseMagicItemForImport(item: DnD5eItem): {
    name: string;
    description: string;
    type: string;
    rarity: string;
    requiresAttunement: boolean;
    weight?: number;
    value?: string;
  } {
    return {
      name: item.name,
      description: this.parseEntries(item.entries || []),
      type: item.type || 'Wondrous Item',
      rarity: item.rarity || 'Unknown',
      requiresAttunement: Boolean(item.reqAttune),
      weight: item.weight,
      value: item.value ? `${item.value} gp` : undefined
    };
  }
}