import { WikiDataService, WikiArticle } from './WikiDataService';
import { DnD5eToolsService } from './DnD5eToolsService';

export type GameEdition = 'adnd2e' | 'dnd5e' | 'pf2e' | 'other';

export type ContentType = 'monster' | 'spell' | 'magic-item' | 'race' | 'class' | 'location' | 'note' | 'parking-lot';

export interface ImportCategory {
  id: string;
  name: string;
  icon: string;
  supportedEditions: GameEdition[];
}

/**
 * Edition-aware import service that automatically routes to appropriate
 * data sources based on the campaign's game edition.
 */
export class EditionAwareImportService {
  
  /**
   * Available import categories with edition support
   */
  static readonly IMPORT_CATEGORIES: ImportCategory[] = [
    {
      id: 'monsters',
      name: 'Monsters & Creatures',
      icon: '🐲',
      supportedEditions: ['adnd2e', 'dnd5e']
    },
    {
      id: 'spells',
      name: 'Spells & Magic',
      icon: '✨',
      supportedEditions: ['adnd2e', 'dnd5e']
    },
    {
      id: 'magic-items',
      name: 'Magic Items',
      icon: '🗡️',
      supportedEditions: ['adnd2e', 'dnd5e']
    },
    {
      id: 'races',
      name: 'Races & Species',
      icon: '👥',
      supportedEditions: ['adnd2e', 'dnd5e']
    },
    {
      id: 'classes',
      name: 'Classes & Professions',
      icon: '⚔️',
      supportedEditions: ['adnd2e', 'dnd5e']
    }
  ];

  /**
   * Get available import categories for a specific game edition
   */
  static getCategoriesForEdition(edition: GameEdition): ImportCategory[] {
    return EditionAwareImportService.IMPORT_CATEGORIES.filter(category => 
      category.supportedEditions.includes(edition)
    );
  }

  /**
   * Unified search interface that automatically routes to the appropriate service
   */
  static async search(
    categoryId: string,
    searchQuery: string,
    campaignId: number
  ): Promise<WikiArticle[]> {
    // Get campaign to determine edition
    const campaignResponse = await fetch(`/api/campaigns/${campaignId}`);
    if (!campaignResponse.ok) {
      throw new Error('Failed to fetch campaign data');
    }
    
    const campaign = await campaignResponse.json();
    const edition = this.detectGameEdition(
      campaign.gameEditionName || campaign.gameEditionVersion
    );

    // Route to appropriate service based on edition
    if (edition === 'dnd5e') {
      return this.searchDnD5eContent(categoryId, searchQuery);
    } else {
      return this.searchADnD2eContent(categoryId, searchQuery);
    }
  }

  /**
   * Search AD&D 2e content using WikiDataService
   */
  private static async searchADnD2eContent(
    categoryId: string,
    searchQuery: string
  ): Promise<WikiArticle[]> {
    if (categoryId === 'all') {
      return WikiDataService.searchArticles(searchQuery);
    }

    switch (categoryId) {
      case 'monsters':
        return WikiDataService.searchMonsters();
      case 'spells':
        return WikiDataService.searchSpells();
      case 'magic-items':
        return WikiDataService.searchMagicItems();
      case 'races':
        return WikiDataService.searchRaces();
      case 'classes':
        return WikiDataService.searchClasses();
      default:
        return WikiDataService.searchArticles(searchQuery);
    }
  }

  /**
   * Search D&D 5e content using DnD5eToolsService
   */
  private static async searchDnD5eContent(
    categoryId: string,
    searchQuery: string
  ): Promise<WikiArticle[]> {
    switch (categoryId) {
      case 'monsters':
        const monsters = await DnD5eToolsService.searchMonsters(searchQuery);
        return monsters.map(this.mapDnD5eMonsterToWikiArticle);
      case 'spells':
        const spells = await DnD5eToolsService.searchSpells(searchQuery);
        return spells.map(this.mapDnD5eSpellToWikiArticle);
      case 'magic-items':
        const magicItems = await DnD5eToolsService.searchMagicItems(searchQuery);
        return magicItems.map(this.mapDnD5eItemToWikiArticle);
      case 'races':
        const races = await DnD5eToolsService.searchRaces(searchQuery);
        return races.map(this.mapDnD5eRaceToWikiArticle);
      case 'classes':
        const classes = await DnD5eToolsService.searchClasses(searchQuery);
        return classes.map(this.mapDnD5eClassToWikiArticle);
      case 'all':
      default:
        // Search all categories and combine results
        const [monstersAll, spellsAll, magicItemsAll, racesAll, classesAll] = await Promise.all([
          DnD5eToolsService.searchMonsters(searchQuery),
          DnD5eToolsService.searchSpells(searchQuery),
          DnD5eToolsService.searchMagicItems(searchQuery),
          DnD5eToolsService.searchRaces(searchQuery),
          DnD5eToolsService.searchClasses(searchQuery)
        ]);
        return [
          ...monstersAll.map(this.mapDnD5eMonsterToWikiArticle),
          ...spellsAll.map(this.mapDnD5eSpellToWikiArticle),
          ...magicItemsAll.map(this.mapDnD5eItemToWikiArticle),
          ...racesAll.map(this.mapDnD5eRaceToWikiArticle),
          ...classesAll.map(this.mapDnD5eClassToWikiArticle)
        ];
    }
  }
  /**
   * Auto-detect game edition from campaign data
   */
  static detectGameEdition(gameEditionCode?: string): GameEdition {
    if (!gameEditionCode) return 'dnd5e'; // Default fallback
    
    const normalized = gameEditionCode.toLowerCase().trim();
    
    if (normalized.includes('adnd') || normalized.includes('ad&d') || normalized.includes('2e')) {
      return 'adnd2e';
    }
    
    if (normalized.includes('5e') || normalized.includes('d&d5') || normalized.includes('dnd5')) {
      return 'dnd5e';
    }
    
    if (normalized.includes('pf2') || normalized.includes('pathfinder')) {
      return 'pf2e';
    }
    
    return 'other';
  }

  /**
   * Map DnD5eMonster to WikiArticle format
   */
  private static mapDnD5eMonsterToWikiArticle(monster: any): WikiArticle {
    return {
      id: Math.abs(monster.name.toLowerCase().split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)), // Simple hash for ID
      title: monster.name,
      url: `/dnd5e/monster/${encodeURIComponent(monster.name.toLowerCase().replace(/\s+/g, '-'))}`
    };
  }

  /**
   * Map DnD5eSpell to WikiArticle format
   */
  private static mapDnD5eSpellToWikiArticle(spell: any): WikiArticle {
    return {
      id: Math.abs(spell.name.toLowerCase().split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)), // Simple hash for ID
      title: spell.name,
      url: `/dnd5e/spell/${encodeURIComponent(spell.name.toLowerCase().replace(/\s+/g, '-'))}`
    };
  }

  /**
   * Map DnD5eItem to WikiArticle format
   */
  private static mapDnD5eItemToWikiArticle(item: any): WikiArticle {
    return {
      id: Math.abs(item.name.toLowerCase().split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)), // Simple hash for ID
      title: item.name,
      url: `/dnd5e/item/${encodeURIComponent(item.name.toLowerCase().replace(/\s+/g, '-'))}`
    };
  }

  /**
   * Map DnD5eRace to WikiArticle format
   */
  private static mapDnD5eRaceToWikiArticle(race: any): WikiArticle {
    return {
      id: Math.abs(race.name.toLowerCase().split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)), // Simple hash for ID
      title: race.name,
      url: `/dnd5e/race/${encodeURIComponent(race.name.toLowerCase().replace(/\s+/g, '-'))}`
    };
  }

  /**
   * Map DnD5eClass to WikiArticle format
   */
  private static mapDnD5eClassToWikiArticle(cls: any): WikiArticle {
    return {
      id: Math.abs(cls.name.toLowerCase().split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)), // Simple hash for ID
      title: cls.name,
      url: `/dnd5e/class/${encodeURIComponent(cls.name.toLowerCase().replace(/\s+/g, '-'))}`
    };
  }
}