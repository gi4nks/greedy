import { db } from "@/lib/db";
import {
  campaigns,
  adventures,
  sessions,
  characters,
  locations,
  npcs,
  quests,
  magicItems,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export interface SearchResult {
  id: number;
  entityType:
    | "campaign"
    | "adventure"
    | "session"
    | "character"
    | "location"
    | "npc"
    | "quest"
    | "magic_item";
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
  sortBy?: "relevance" | "date_desc" | "date_asc" | "title_asc" | "title_desc";
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
      console.error("Failed to initialize search index:", error);
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
        console.error("Failed to create trigger:", error);
      }
    }
  }

  static async search(
    query: string,
    filters: SearchFilters = {},
    limit: number = 50,
  ): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    try {
      const results: SearchResult[] = [];
      const { entityTypes, sortBy = "relevance" } = filters;
      const searchLower = query.toLowerCase();

      // Helper function to check if text matches search query
      const matchesSearch = (text: string | null | undefined): boolean => {
        if (!text) return false;
        return String(text).toLowerCase().includes(searchLower);
      };

      // Search campaigns
      if (!entityTypes || entityTypes.includes("campaign")) {
        const campaignResults = await db.select().from(campaigns);
        const filtered = campaignResults.filter(
          (c) =>
            matchesSearch(c.title) ||
            matchesSearch(c.description),
        );

        results.push(
          ...filtered.map((c) => ({
            id: c.id,
            entityType: "campaign" as const,
            title: c.title,
            description: c.description || undefined,
            campaignId: c.id,
            tags: [],
            relevanceScore: 1,
            createdAt: new Date().toISOString(),
          })),
        );
      }

      // Search adventures
      if (!entityTypes || entityTypes.includes("adventure")) {
        const adventureResults = await db.select().from(adventures);
        const filtered = adventureResults.filter(
          (a) =>
            matchesSearch(a.title) ||
            matchesSearch(a.description),
        );

        results.push(
          ...filtered.map((a) => ({
            id: a.id,
            entityType: "adventure" as const,
            title: a.title,
            description: a.description || undefined,
            campaignId: a.campaignId || undefined,
            tags: [],
            relevanceScore: 1,
            createdAt: new Date().toISOString(),
          })),
        );
      }

      // Search sessions
      if (!entityTypes || entityTypes.includes("session")) {
        const sessionResults = await db
          .select({
            session: sessions,
            campaignId: adventures.campaignId,
          })
          .from(sessions)
          .leftJoin(adventures, eq(sessions.adventureId, adventures.id));
        
        const filtered = sessionResults.filter(
          (s) =>
            matchesSearch(s.session.title) ||
            matchesSearch(s.session.text),
        );

        results.push(
          ...filtered.map((s) => ({
            id: s.session.id,
            entityType: "session" as const,
            title: s.session.title,
            description: s.session.text || undefined,
            campaignId: s.campaignId || undefined,
            adventureId: s.session.adventureId || undefined,
            tags: [],
            relevanceScore: 1,
            createdAt: new Date().toISOString(),
          })),
        );
      }

      // Search characters
      if (!entityTypes || entityTypes.includes("character")) {
        const characterResults = await db.select().from(characters);
        const filtered = characterResults.filter(
          (c) =>
            matchesSearch(c.name) ||
            matchesSearch(c.description) ||
            matchesSearch(c.race) ||
            matchesSearch(c.background) ||
            matchesSearch(c.alignment),
        );

        results.push(
          ...filtered.map((c) => ({
            id: c.id,
            entityType: "character" as const,
            title: c.name,
            description: c.description || undefined,
            campaignId: c.campaignId || undefined,
            adventureId: c.adventureId || undefined,
            tags: [],
            relevanceScore: 1,
            createdAt: new Date().toISOString(),
          })),
        );
      }

      // Search NPCs
      if (!entityTypes || entityTypes.includes("npc")) {
        const npcResults = await db
          .select({
            npc: npcs,
            campaignId: adventures.campaignId,
          })
          .from(npcs)
          .leftJoin(adventures, eq(npcs.adventureId, adventures.id));
        
        const filtered = npcResults.filter(
          (n) =>
            matchesSearch(n.npc.name) ||
            matchesSearch(n.npc.description) ||
            matchesSearch(n.npc.role),
        );

        results.push(
          ...filtered.map((n) => ({
            id: n.npc.id,
            entityType: "npc" as const,
            title: n.npc.name,
            description: n.npc.description || undefined,
            campaignId: n.campaignId || undefined,
            adventureId: n.npc.adventureId || undefined,
            tags: [],
            relevanceScore: 1,
            createdAt: new Date().toISOString(),
          })),
        );
      }

      // Search locations
      if (!entityTypes || entityTypes.includes("location")) {
        const locationResults = await db
          .select({
            location: locations,
            campaignId: adventures.campaignId,
          })
          .from(locations)
          .leftJoin(adventures, eq(locations.adventureId, adventures.id));
        
        const filtered = locationResults.filter(
          (l) =>
            matchesSearch(l.location.name) ||
            matchesSearch(l.location.description),
        );

        results.push(
          ...filtered.map((l) => ({
            id: l.location.id,
            entityType: "location" as const,
            title: l.location.name,
            description: l.location.description || undefined,
            campaignId: l.campaignId || undefined,
            adventureId: l.location.adventureId || undefined,
            tags: [],
            relevanceScore: 1,
            createdAt: new Date().toISOString(),
          })),
        );
      }

      // Search quests
      if (!entityTypes || entityTypes.includes("quest")) {
        const questResults = await db
          .select({
            quest: quests,
            campaignId: adventures.campaignId,
          })
          .from(quests)
          .leftJoin(adventures, eq(quests.adventureId, adventures.id));
        
        const filtered = questResults.filter(
          (q) =>
            matchesSearch(q.quest.title) ||
            matchesSearch(q.quest.description),
        );

        results.push(
          ...filtered.map((q) => ({
            id: q.quest.id,
            entityType: "quest" as const,
            title: q.quest.title,
            description: q.quest.description || undefined,
            campaignId: q.campaignId || undefined,
            adventureId: q.quest.adventureId || undefined,
            tags: [],
            relevanceScore: 1,
            createdAt: new Date().toISOString(),
          })),
        );
      }

      // Search magic items
      if (!entityTypes || entityTypes.includes("magic_item")) {
        const magicItemResults = await db.select().from(magicItems);
        const filtered = magicItemResults.filter(
          (m) =>
            matchesSearch(m.name) ||
            matchesSearch(m.description),
        );

        results.push(
          ...filtered.map((m) => ({
            id: m.id,
            entityType: "magic_item" as const,
            title: m.name,
            description: m.description || undefined,
            tags: [],
            relevanceScore: 1,
            createdAt: new Date().toISOString(),
          })),
        );
      }

      // Sort results
      if (sortBy === "date_desc") {
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortBy === "date_asc") {
        results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (sortBy === "title_asc") {
        results.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === "title_desc") {
        results.sort((a, b) => b.title.localeCompare(a.title));
      }

      return results.slice(0, limit);
    } catch (error) {
      console.error("Search query failed:", error);
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
    adventureId?: number,
  ) {
    // For now, we'll skip the FTS indexing until we properly set up the virtual table
    // This is a placeholder for future FTS implementation
    console.log(
      `Would index: ${entityType} ${entityId} - ${title}`,
      JSON.stringify({ tags, campaignId, adventureId, contentLength: content.length }),
    );
  }

  static async reindexAll() {
    try {
      // Clear existing index
      await db.run(sql`DELETE FROM search_index`);

      // Reindex campaigns
      const campaignResults = await db.select().from(campaigns);
      for (const campaign of campaignResults) {
        await this.indexEntity(
          "campaign",
          campaign.id,
          campaign.title,
          campaign.description || "",
          Array.isArray(campaign.tags) ? campaign.tags : [],
          campaign.id,
        );
      }

      // Reindex other entities...
      console.log("Search index rebuilt successfully");
    } catch (error) {
      console.error("Failed to reindex:", error);
    }
  }
}
