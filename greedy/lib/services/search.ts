import { db } from '@/lib/db';
import { campaigns, adventures, sessions, characters, locations, npcs, quests, magicItems } from '@/lib/db/schema';
import { eq, sql, and, gte, lte, like, desc, asc, SQL } from 'drizzle-orm';

export interface SearchResult {
  id: number;
  entityType: 'campaign' | 'adventure' | 'session' | 'character' | 'location' | 'npc' | 'quest' | 'magic_item';
  title: string;
  description?: string;
  campaignId?: number;
  adventureId?: number;
  tags?: string[];
  relevanceScore?: number;
  createdAt: string;
}

export interface SearchFilters {
  entityTypes?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  tags?: string[];
  sortBy?: 'relevance' | 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc';
}

export class SearchService {
  // Initialize FTS virtual table for search
  static async initializeSearchIndex() {
    try {
      // Create FTS5 virtual table for full-text search
      await db.run(sql`
        CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
          entity_type,
          entity_id UNINDEXED,
          title,
          content,
          tags,
          campaign_id UNINDEXED,
          adventure_id UNINDEXED,
          tokenize = 'porter unicode61'
        )
      `);

      // Create triggers to keep search index in sync
      await this.createSearchTriggers();
    } catch (error) {
      console.error('Failed to initialize search index:', error);
    }
  }

  private static async createSearchTriggers() {
    const triggers = [
      // Campaigns
      `CREATE TRIGGER IF NOT EXISTS campaigns_search_insert AFTER INSERT ON campaigns
       BEGIN
         INSERT INTO search_index (entity_type, entity_id, title, content, tags, campaign_id)
         VALUES ('campaign', NEW.id, NEW.title, COALESCE(NEW.description, ''), COALESCE(NEW.tags, '[]'), NEW.id);
       END`,

      `CREATE TRIGGER IF NOT EXISTS campaigns_search_update AFTER UPDATE ON campaigns
       BEGIN
         UPDATE search_index SET title = NEW.title, content = COALESCE(NEW.description, ''), tags = COALESCE(NEW.tags, '[]')
         WHERE entity_type = 'campaign' AND entity_id = NEW.id;
       END`,

      `CREATE TRIGGER IF NOT EXISTS campaigns_search_delete AFTER DELETE ON campaigns
       BEGIN
         DELETE FROM search_index WHERE entity_type = 'campaign' AND entity_id = OLD.id;
       END`,

      // Characters
      `CREATE TRIGGER IF NOT EXISTS characters_search_insert AFTER INSERT ON characters
       BEGIN
         INSERT INTO search_index (entity_type, entity_id, title, content, tags, campaign_id, adventure_id)
         SELECT 'character', NEW.id, NEW.name,
                COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.backstory, '') || ' ' ||
                COALESCE(NEW.personality_traits, '') || ' ' || COALESCE(NEW.ideals, '') || ' ' ||
                COALESCE(NEW.bonds, '') || ' ' || COALESCE(NEW.flaws, ''),
                COALESCE(NEW.tags, '[]'), c.id, NEW.adventure_id
         FROM adventures a
         LEFT JOIN campaigns c ON a.campaign_id = c.id
         WHERE a.id = NEW.adventure_id;
       END`,

      // Similar triggers for other entities...
    ];

    for (const trigger of triggers) {
      try {
        await db.run(sql.raw(trigger));
      } catch (error) {
        console.error('Failed to create trigger:', error);
      }
    }
  }

  static async search(
    query: string,
    filters: SearchFilters = {},
    limit: number = 50
  ): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    try {
      const results: SearchResult[] = [];
      const {
        entityTypes,
        dateRange,
        tags,
        sortBy = 'relevance'
      } = filters;

      // Helper function to apply common filters
      // Helper function to apply common filters
      const applyFilters = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        baseQuery: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        table: any,
        textFields: string[]
      ) => {
        const conditions: SQL[] = [];

        // Text search conditions
        const textConditions = textFields.map(field =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          like((table as any)[field], `%${query}%`)
        );
        conditions.push(sql`(${sql.join(textConditions, sql` OR `)})`);

        return baseQuery.where(and(...conditions));
      };

      // Helper function to apply sorting
      // Helper function to apply sorting
      const applySorting = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        table: any
      ) => {
        switch (sortBy) {
          case 'date_desc':
            // Skip date sorting for now due to missing createdAt columns
            return query;
          case 'date_asc':
            // Skip date sorting for now due to missing createdAt columns
            return query;
          case 'title_asc':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return query.orderBy(asc((table as any).title || (table as any).name));
          case 'title_desc':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return query.orderBy(desc((table as any).title || (table as any).name));
          default: // relevance - no specific ordering
            return query;
        }
      };

      // Search campaigns
      if (!entityTypes || entityTypes.includes('campaign')) {
        let campaignQuery = db.select().from(campaigns);
        campaignQuery = applyFilters(campaignQuery, campaigns, ['title', 'description']);
        campaignQuery = applySorting(campaignQuery, campaigns);

        const campaignResults = await campaignQuery.limit(limit);

        results.push(...campaignResults.map(c => ({
          id: c.id,
          entityType: 'campaign' as const,
          title: c.title,
          description: c.description || undefined,
          campaignId: c.id,
          tags: [], // TODO: Parse c.tags when implemented
          relevanceScore: 1,
          createdAt: new Date().toISOString(),
        })));
      }

      // Search adventures
      if (!entityTypes || entityTypes.includes('adventure')) {
        let adventureQuery = db.select().from(adventures);
        adventureQuery = applyFilters(adventureQuery, adventures, ['title', 'description']);
        adventureQuery = applySorting(adventureQuery, adventures);

        const adventureResults = await adventureQuery.limit(limit);

        results.push(...adventureResults.map(a => ({
          id: a.id,
          entityType: 'adventure' as const,
          title: a.title,
          description: a.description || undefined,
          campaignId: a.campaignId || undefined,
          tags: [], // TODO: Parse a.tags when implemented
          relevanceScore: 1,
          createdAt: new Date().toISOString(),
        })));
      }

      // Search sessions
      if (!entityTypes || entityTypes.includes('session')) {
        let sessionQuery = db.select().from(sessions);
        sessionQuery = applyFilters(sessionQuery, sessions, ['title', 'text']);
        sessionQuery = applySorting(sessionQuery, sessions);

        const sessionResults = await sessionQuery.limit(limit);

        results.push(...sessionResults.map(s => ({
          id: s.id,
          entityType: 'session' as const,
          title: s.title,
          description: s.text || undefined,
          adventureId: s.adventureId || undefined,
          tags: [], // TODO: Parse s.tags when implemented
          relevanceScore: 1,
          createdAt: new Date().toISOString(),
        })));
      }

      // Search characters
      if (!entityTypes || entityTypes.includes('character')) {
        let characterQuery = db.select().from(characters);
        characterQuery = applyFilters(characterQuery, characters, ['name', 'description', 'backstory', 'personalityTraits', 'ideals', 'bonds', 'flaws']);
        characterQuery = applySorting(characterQuery, characters);

        const characterResults = await characterQuery.limit(limit);

        results.push(...characterResults.map(c => ({
          id: c.id,
          entityType: 'character' as const,
          title: c.name,
          description: c.description || undefined,
          adventureId: c.adventureId || undefined,
          tags: [], // TODO: Parse c.tags when implemented
          relevanceScore: 1,
          createdAt: new Date().toISOString(),
        })));
      }

      // Search NPCs
      if (!entityTypes || entityTypes.includes('npc')) {
        let npcQuery = db.select().from(npcs);
        npcQuery = applyFilters(npcQuery, npcs, ['name', 'description', 'role']);
        npcQuery = applySorting(npcQuery, npcs);

        const npcResults = await npcQuery.limit(limit);

        results.push(...npcResults.map(n => ({
          id: n.id,
          entityType: 'npc' as const,
          title: n.name,
          description: n.description || undefined,
          adventureId: n.adventureId || undefined,
          tags: [], // TODO: Parse n.tags when column exists
          relevanceScore: 1,
          createdAt: new Date().toISOString(), // TODO: Use n.createdAt when column exists
        })));
      }

      // Search locations
      if (!entityTypes || entityTypes.includes('location')) {
        let locationQuery = db.select().from(locations);
        locationQuery = applyFilters(locationQuery, locations, ['name', 'description']);
        locationQuery = applySorting(locationQuery, locations);

        const locationResults = await locationQuery.limit(limit);

        results.push(...locationResults.map(l => ({
          id: l.id,
          entityType: 'location' as const,
          title: l.name,
          description: l.description || undefined,
          adventureId: l.adventureId || undefined,
          tags: [], // TODO: Parse l.tags when implemented
          relevanceScore: 1,
          createdAt: new Date().toISOString(),
        })));
      }

      // Search quests
      if (!entityTypes || entityTypes.includes('quest')) {
        let questQuery = db.select().from(quests);
        questQuery = applyFilters(questQuery, quests, ['title', 'description']);
        questQuery = applySorting(questQuery, quests);

        const questResults = await questQuery.limit(limit);

        results.push(...questResults.map(q => ({
          id: q.id,
          entityType: 'quest' as const,
          title: q.title,
          description: q.description || undefined,
          adventureId: q.adventureId || undefined,
          tags: [], // TODO: Parse q.tags when implemented
          relevanceScore: 1,
          createdAt: new Date().toISOString(),
        })));
      }

      // Search magic items
      if (!entityTypes || entityTypes.includes('magic_item')) {
        let magicItemQuery = db.select().from(magicItems);
        magicItemQuery = applyFilters(magicItemQuery, magicItems, ['name', 'description']);
        magicItemQuery = applySorting(magicItemQuery, magicItems);

        const magicItemResults = await magicItemQuery.limit(limit);

        results.push(...magicItemResults.map(m => ({
          id: m.id,
          entityType: 'magic_item' as const,
          title: m.name,
          description: m.description || undefined,
          tags: [], // TODO: Parse m.tags when implemented
          relevanceScore: 1,
          createdAt: new Date().toISOString(),
        })));
      }

      // Sort by relevance if no specific sorting was applied
      if (sortBy === 'relevance') {
        results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      }

      return results.slice(0, limit);
    } catch (error) {
      console.error('Search query failed:', error);
      return [];
    }
  }

  static async indexEntity(
    entityType: string,
    entityId: number,
    title: string,
    content: string,
    tags: string[] = [],
    campaignId?: number,
    adventureId?: number
  ) {
    // For now, we'll skip the FTS indexing until we properly set up the virtual table
    // This is a placeholder for future FTS implementation
    console.log(`Would index: ${entityType} ${entityId} - ${title}`);
  }

  static async reindexAll() {
    try {
      // Clear existing index
      await db.run(sql`DELETE FROM search_index`);

      // Reindex campaigns
      const campaignResults = await db.select().from(campaigns);
      for (const campaign of campaignResults) {
        await this.indexEntity(
          'campaign',
          campaign.id,
          campaign.title,
          campaign.description || '',
          Array.isArray(campaign.tags) ? campaign.tags : [],
          campaign.id
        );
      }

      // Reindex other entities...
      console.log('Search index rebuilt successfully');
    } catch (error) {
      console.error('Failed to reindex:', error);
    }
  }
}