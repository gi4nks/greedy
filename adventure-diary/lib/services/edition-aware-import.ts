import { WikiDataService, WikiArticle } from './wiki-data';
import { DnD5eToolsService } from './dnd5e-tools';

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
    return this.IMPORT_CATEGORIES.filter(category => 
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
   * Search D&D 5e content using DnD5eToolsService and convert to WikiArticle format
   */
  private static async searchDnD5eContent(
    categoryId: string,
    searchQuery: string
  ): Promise<WikiArticle[]> {
    switch (categoryId) {
      case 'monsters':
        const monsters = await DnD5eToolsService.searchMonsters(searchQuery);
        return monsters.map((monster, index) => ({
          id: 5000000 + index, // Use high ID to avoid conflicts
          title: monster.name,
          url: `/5e/monsters/${encodeURIComponent(monster.name.toLowerCase())}`,
          ns: 0
        }));
        
      case 'spells':
        const spells = await DnD5eToolsService.searchSpells(searchQuery);
        return spells.map((spell, index) => ({
          id: 6000000 + index,
          title: spell.name,
          url: `/5e/spells/${encodeURIComponent(spell.name.toLowerCase())}`,
          ns: 0
        }));
        
      case 'magic-items':
        const items = await DnD5eToolsService.searchMagicItems(searchQuery);
        return items.map((item, index) => ({
          id: 7000000 + index,
          title: item.name,
          url: `/5e/items/${encodeURIComponent(item.name.toLowerCase())}`,
          ns: 0
        }));
        
      case 'races':
        const races = await DnD5eToolsService.searchRaces(searchQuery);
        return races.map((race, index) => ({
          id: 8000000 + index,
          title: race.name,
          url: `/5e/races/${encodeURIComponent(race.name.toLowerCase())}`,
          ns: 0
        }));
        
      case 'classes':
        const classes = await DnD5eToolsService.searchClasses(searchQuery);
        return classes.map((cls, index) => ({
          id: 9000000 + index,
          title: cls.name,
          url: `/5e/classes/${encodeURIComponent(cls.name.toLowerCase())}`,
          ns: 0
        }));
        
      case 'all':
      default:
        // Search all categories and combine results
        const [allMonsters, allSpells, allItems, allRaces, allClasses] = await Promise.all([
          this.searchDnD5eContent('monsters', searchQuery),
          this.searchDnD5eContent('spells', searchQuery),
          this.searchDnD5eContent('magic-items', searchQuery),
          this.searchDnD5eContent('races', searchQuery),
          this.searchDnD5eContent('classes', searchQuery)
        ]);
        return [...allMonsters, ...allSpells, ...allItems, ...allRaces, ...allClasses];
    }
  }

  /**
   * Auto-detect game edition from campaign data
   */
  static detectGameEdition(gameEditionCode?: string): GameEdition {
    if (!gameEditionCode) return 'dnd5e'; // Default fallback
    
    const normalized = gameEditionCode.toLowerCase().trim();
    
    // AD&D 2nd Edition patterns
    if (
      normalized.includes('adnd') || 
      normalized.includes('ad&d') || 
      normalized.includes('advanced d&d') ||
      normalized.includes('advanced dungeons') ||
      normalized.includes('2nd edition') ||
      normalized.includes('2e')
    ) {
      return 'adnd2e';
    }
    
    // D&D 5th Edition patterns  
    if (
      normalized.includes('5e') || 
      normalized.includes('5th edition') ||
      normalized.includes('d&d5') || 
      normalized.includes('dnd5') ||
      (normalized.includes('d&d') && normalized.includes('5'))
    ) {
      return 'dnd5e';
    }
    
    // Pathfinder 2nd Edition patterns
    if (normalized.includes('pf2') || normalized.includes('pathfinder')) {
      return 'pf2e';
    }
    
    return 'other';
  }
}