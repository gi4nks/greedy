# Migration Strategy & Implementation Plan

## 📋 Phase 1: Foundation (Weeks 1-2)

### 1.1 Database Migration
Create new migration files to transform existing schema:

```typescript
// backend/src/migrations/011_multi_edition_foundation.ts
export default {
  up: (db: any) => {
    // Create game editions table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS game_editions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        version TEXT,
        publisher TEXT,
        is_active BOOLEAN DEFAULT 1,
        import_sources TEXT, -- JSON
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Create campaigns table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        game_edition_id INTEGER NOT NULL,
        status TEXT DEFAULT 'active',
        start_date TEXT,
        end_date TEXT,
        world_name TEXT,
        tags TEXT, -- JSON
        settings TEXT, -- JSON
        images TEXT, -- JSON
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(game_edition_id) REFERENCES game_editions(id)
      )
    `).run();

    // Insert default editions
    const insertEdition = db.prepare(`
      INSERT INTO game_editions (code, name, publisher, import_sources) 
      VALUES (?, ?, ?, ?)
    `);
    
    insertEdition.run('adnd2e', 'AD&D 2nd Edition', 'TSR', JSON.stringify([
      { type: 'api', name: 'Fandom', base_url: 'https://adnd2e.fandom.com', 
        supported_content: ['spells', 'items', 'monsters'] }
    ]));
    
    insertEdition.run('dnd5e', 'D&D 5th Edition', 'Wizards of the Coast', JSON.stringify([
      { type: 'api', name: '5eTools', base_url: 'https://5e.tools', 
        supported_content: ['spells', 'items', 'monsters', 'classes', 'races'] }
    ]));

    // Create default campaign for existing data
    const defaultCampaignId = db.prepare(`
      INSERT INTO campaigns (title, description, game_edition_id) 
      VALUES ('Legacy Campaign', 'Migrated from existing adventures', 1)
    `).run().lastInsertRowid;

    // Update existing adventures to link to default campaign
    db.prepare('ALTER TABLE adventures ADD COLUMN campaign_id INTEGER').run();
    db.prepare('ALTER TABLE adventures ADD COLUMN game_edition_id INTEGER').run();
    db.prepare('ALTER TABLE adventures ADD COLUMN start_date TEXT').run();
    db.prepare('ALTER TABLE adventures ADD COLUMN status TEXT DEFAULT "active"').run();
    
    db.prepare(`
      UPDATE adventures 
      SET campaign_id = ?, game_edition_id = 1 
      WHERE campaign_id IS NULL
    `).run(defaultCampaignId);
  }
};
```

### 1.2 Enhanced Type System
Update shared types to support new diary features:

```typescript
// shared/types.ts additions
export interface DiarySystem {
  campaigns: Campaign[];
  timeline: TimelineEvent[];
  search_index: SearchIndex;
  editions: GameEdition[];
}

export interface DiaryFilters {
  campaign_id?: number;
  game_edition?: string;
  date_range?: { start: string; end: string };
  event_types?: string[];
  importance_level?: number[];
  characters?: number[];
  locations?: number[];
}

export interface ExportOptions {
  format: 'markdown' | 'pdf' | 'json' | 'html';
  campaign_id: number;
  include_images: boolean;
  date_range?: { start: string; end: string };
  sections: {
    timeline: boolean;
    characters: boolean;
    locations: boolean;
    quests: boolean;
    sessions: boolean;
    network: boolean;
  };
}
```

## 📋 Phase 2: Timeline & Chronicle System (Weeks 3-4)

### 2.1 Timeline Implementation
Create timeline visualization component using D3.js:

```typescript
// frontend/src/components/timeline/TimelineVisualization.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TimelineEvent } from '@greedy/shared';

interface TimelineVisualizationProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  height?: number;
}

export const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({
  events,
  onEventClick,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    if (!svgRef.current || events.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 80 };
    const width = svg.node()?.getBoundingClientRect().width || 800;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Parse dates and sort events
    const sortedEvents = events
      .map(event => ({
        ...event,
        parsedDate: new Date(event.real_date)
      }))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(sortedEvents, d => d.parsedDate) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleBand()
      .domain(sortedEvents.map((_, i) => i.toString()))
      .range([0, innerHeight])
      .paddingInner(0.1);

    // Color scale for importance
    const colorScale = d3.scaleOrdinal<number, string>()
      .domain([1, 2, 3, 4, 5])
      .range(['#e5e7eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Draw timeline line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight / 2)
      .attr('y2', innerHeight / 2)
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 2);

    // Draw events
    const eventGroups = g.selectAll('.event')
      .data(sortedEvents)
      .enter()
      .append('g')
      .attr('class', 'event')
      .attr('transform', (d, i) => `translate(${xScale(d.parsedDate)}, ${yScale(i.toString())})`);

    // Event circles
    eventGroups.append('circle')
      .attr('r', d => 4 + (d.importance_level * 2))
      .attr('fill', d => colorScale(d.importance_level))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedEvent(d);
        onEventClick?.(d);
      })
      .on('mouseover', function() {
        d3.select(this).transition().duration(200).attr('r', function(d) { 
          return 6 + (d.importance_level * 2); 
        });
      })
      .on('mouseout', function() {
        d3.select(this).transition().duration(200).attr('r', function(d) { 
          return 4 + (d.importance_level * 2); 
        });
      });

    // Event labels
    eventGroups.append('text')
      .attr('x', 15)
      .attr('y', 4)
      .text(d => d.title)
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .style('pointer-events', 'none');

    // X-axis (dates)
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeMonth.every(1))
      .tickFormat(d3.timeFormat('%b %Y'));

    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

  }, [events, height, onEventClick]);

  return (
    <div className="timeline-visualization">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        className="border rounded-lg bg-white"
      />
      
      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{selectedEvent.title}</h3>
            <p className="py-4">{selectedEvent.description}</p>
            <div className="badge badge-primary">
              Importance: {selectedEvent.importance_level}/5
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 2.2 Session Log System
Enhanced session management with structured logging:

```typescript
// frontend/src/components/sessions/SessionLogEditor.tsx
import React, { useState } from 'react';
import { SessionLog } from '@greedy/shared';
import { useSessionLogs, useCreateSessionLog } from '../hooks/useSessionLogs';

interface SessionLogEditorProps {
  sessionId: number;
  onLogAdded?: (log: SessionLog) => void;
}

export const SessionLogEditor: React.FC<SessionLogEditorProps> = ({
  sessionId,
  onLogAdded
}) => {
  const [logType, setLogType] = useState<SessionLog['entry_type']>('narrative');
  const [content, setContent] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  const { data: logs } = useSessionLogs(sessionId);
  const createLog = useCreateSessionLog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newLog: Omit<SessionLog, 'id'> = {
      session_id: sessionId,
      entry_type: logType,
      content,
      timestamp,
      tags,
      is_summary: logType === 'summary',
      characters_mentioned: extractMentionedCharacters(content),
      locations_mentioned: extractMentionedLocations(content),
      quests_mentioned: extractMentionedQuests(content)
    };

    await createLog.mutateAsync(newLog);
    
    setContent('');
    setTimestamp('');
    setTags([]);
    onLogAdded?.(newLog as SessionLog);
  };

  return (
    <div className="session-log-editor">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <select
            value={logType}
            onChange={(e) => setLogType(e.target.value as SessionLog['entry_type'])}
            className="select select-bordered"
          >
            <option value="narrative">📖 Narrative</option>
            <option value="combat">⚔️ Combat</option>
            <option value="roleplay">🎭 Roleplay</option>
            <option value="exploration">🗺️ Exploration</option>
            <option value="rest">💤 Rest</option>
            <option value="summary">📝 Summary</option>
          </select>
          
          <input
            type="text"
            placeholder="Time in session (e.g., 2:30 PM, Hour 3)"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="input input-bordered"
          />
        </div>

        <textarea
          placeholder="What happened? (Markdown supported)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="textarea textarea-bordered w-full h-32"
          required
        />

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add tag"
            className="input input-bordered flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const tag = (e.target as HTMLInputElement).value.trim();
                if (tag && !tags.includes(tag)) {
                  setTags([...tags, tag]);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
          
          <button type="submit" className="btn btn-primary">
            Add Log Entry
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {tags.map(tag => (
            <div key={tag} className="badge badge-secondary gap-1">
              {tag}
              <button
                type="button"
                onClick={() => setTags(tags.filter(t => t !== tag))}
                className="btn btn-ghost btn-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </form>

      {/* Existing Logs Display */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Session Timeline</h3>
        {logs?.map(log => (
          <div key={log.id} className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="badge badge-outline">
                    {log.entry_type}
                  </span>
                  {log.timestamp && (
                    <span className="text-sm text-gray-500">{log.timestamp}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(log.created_at!).toLocaleTimeString()}
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none mt-2">
                <ReactMarkdown>{log.content}</ReactMarkdown>
              </div>
              
              {log.tags && log.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {log.tags.map(tag => (
                    <span key={tag} className="badge badge-ghost badge-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Utility functions for entity extraction
function extractMentionedCharacters(content: string): number[] {
  // Use regex to find @character[id] mentions or implement NLP
  const matches = content.match(/@character\[(\d+)\]/g);
  return matches ? matches.map(m => parseInt(m.match(/\d+/)![0])) : [];
}

function extractMentionedLocations(content: string): number[] {
  const matches = content.match(/@location\[(\d+)\]/g);
  return matches ? matches.map(m => parseInt(m.match(/\d+/)![0])) : [];
}

function extractMentionedQuests(content: string): number[] {
  const matches = content.match(/@quest\[(\d+)\]/g);
  return matches ? matches.map(m => parseInt(m.match(/\d+/)![0])) : [];
}
```

## 📋 Phase 3: Multi-Edition Import System (Weeks 5-6)

### 3.1 Edition-Specific Import Architecture
Create a flexible import system that handles multiple D&D editions:

```typescript
// backend/src/services/ImportService.ts
import { GameEdition, EditionContent } from '@greedy/shared';
import { FandomImporter } from './importers/FandomImporter';
import { FiveEToolsImporter } from './importers/FiveEToolsImporter';
import { PathfinderImporter } from './importers/PathfinderImporter';

interface ImporterInterface {
  edition: string;
  search(query: string, contentType: string): Promise<ImportSearchResult[]>;
  import(contentId: string, contentType: string): Promise<EditionContent>;
  getSupportedTypes(): string[];
}

interface ImportSearchResult {
  id: string;
  name: string;
  type: string;
  description?: string;
  url?: string;
  source_book?: string;
}

export class ImportService {
  private importers: Map<string, ImporterInterface> = new Map();

  constructor() {
    this.registerImporter(new FandomImporter());
    this.registerImporter(new FiveEToolsImporter());
    this.registerImporter(new PathfinderImporter());
  }

  registerImporter(importer: ImporterInterface) {
    this.importers.set(importer.edition, importer);
  }

  async searchContent(
    editionCode: string, 
    query: string, 
    contentType: string
  ): Promise<ImportSearchResult[]> {
    const importer = this.importers.get(editionCode);
    if (!importer) {
      throw new Error(`No importer found for edition: ${editionCode}`);
    }
    
    return importer.search(query, contentType);
  }

  async importContent(
    editionCode: string,
    contentId: string,
    contentType: string
  ): Promise<EditionContent> {
    const importer = this.importers.get(editionCode);
    if (!importer) {
      throw new Error(`No importer found for edition: ${editionCode}`);
    }

    const content = await importer.import(contentId, contentType);
    
    // Save to database
    const result = db.prepare(`
      INSERT INTO edition_content 
      (game_edition_id, content_type, name, source_book, source_page, 
       import_source, data, tags, is_homebrew)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      content.game_edition_id,
      content.content_type,
      content.name,
      content.source_book,
      content.source_page,
      content.import_source,
      JSON.stringify(content.data),
      JSON.stringify(content.tags || []),
      content.is_homebrew ? 1 : 0
    );

    return { ...content, id: result.lastInsertRowid as number };
  }

  getSupportedEditions(): string[] {
    return Array.from(this.importers.keys());
  }

  getSupportedTypes(editionCode: string): string[] {
    const importer = this.importers.get(editionCode);
    return importer ? importer.getSupportedTypes() : [];
  }
}

// backend/src/services/importers/FiveEToolsImporter.ts
export class FiveEToolsImporter implements ImporterInterface {
  edition = 'dnd5e';
  private baseUrl = 'https://5e.tools/data';

  async search(query: string, contentType: string): Promise<ImportSearchResult[]> {
    const endpoint = this.getEndpoint(contentType);
    const response = await axios.get(`${this.baseUrl}/${endpoint}.json`);
    
    return response.data[contentType]
      .filter((item: any) => 
        item.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 20)
      .map((item: any) => ({
        id: item.name.toLowerCase().replace(/\s+/g, '-'),
        name: item.name,
        type: contentType,
        description: item.entries?.[0] || item.description,
        source_book: item.source
      }));
  }

  async import(contentId: string, contentType: string): Promise<EditionContent> {
    const endpoint = this.getEndpoint(contentType);
    const response = await axios.get(`${this.baseUrl}/${endpoint}.json`);
    
    const item = response.data[contentType].find((item: any) => 
      item.name.toLowerCase().replace(/\s+/g, '-') === contentId
    );

    if (!item) {
      throw new Error(`Content not found: ${contentId}`);
    }

    return {
      game_edition_id: 2, // D&D 5e
      content_type,
      name: item.name,
      source_book: item.source,
      source_page: item.page,
      import_source: '5etools',
      data: this.normalizeData(item, contentType),
      tags: this.extractTags(item, contentType),
      is_homebrew: false
    };
  }

  getSupportedTypes(): string[] {
    return ['spells', 'items', 'monsters', 'classes', 'races', 'feats', 'backgrounds'];
  }

  private getEndpoint(contentType: string): string {
    const endpoints = {
      spells: 'spells',
      items: 'items',
      monsters: 'bestiary',
      classes: 'classes',
      races: 'races',
      feats: 'feats',
      backgrounds: 'backgrounds'
    };
    return endpoints[contentType as keyof typeof endpoints] || contentType;
  }

  private normalizeData(item: any, contentType: string): any {
    switch (contentType) {
      case 'spells':
        return {
          level: item.level,
          school: item.school,
          casting_time: item.time,
          range: item.range,
          components: item.components,
          duration: item.duration,
          description: item.entries,
          classes: item.classes?.fromClassList
        };
      
      case 'items':
        return {
          type: item.type,
          rarity: item.rarity,
          weight: item.weight,
          value: item.value,
          description: item.entries,
          properties: item.property,
          attunement: item.reqAttune
        };
      
      case 'monsters':
        return {
          size: item.size,
          type: item.type,
          alignment: item.alignment,
          ac: item.ac,
          hp: item.hp,
          speed: item.speed,
          stats: {
            str: item.str,
            dex: item.dex,
            con: item.con,
            int: item.int,
            wis: item.wis,
            cha: item.cha
          },
          saves: item.save,
          skills: item.skill,
          senses: item.senses,
          languages: item.languages,
          challenge_rating: item.cr,
          traits: item.trait,
          actions: item.action,
          legendary_actions: item.legendary
        };
      
      default:
        return item;
    }
  }

  private extractTags(item: any, contentType: string): string[] {
    const tags = [];
    
    if (item.source) tags.push(`source:${item.source}`);
    if (item.level !== undefined) tags.push(`level:${item.level}`);
    if (item.school) tags.push(`school:${item.school}`);
    if (item.rarity) tags.push(`rarity:${item.rarity}`);
    if (item.type) tags.push(`type:${item.type}`);
    
    return tags;
  }
}
```

## 📋 Phase 4: Search & Export System (Weeks 7-8)

### 4.1 Full-Text Search Implementation
```typescript
// backend/src/services/SearchService.ts
import { db } from '../../db';
import { SearchResult } from '@greedy/shared';

export class SearchService {
  // Index content when entities are created/updated
  static indexEntity(
    entityType: string,
    entityId: number,
    title: string,
    content: string,
    tags: string[] = [],
    campaignId: number
  ) {
    db.prepare(`
      INSERT OR REPLACE INTO search_index 
      (entity_type, entity_id, title, content, tags, campaign_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      entityType,
      entityId,
      title,
      content,
      tags.join(' '),
      campaignId
    );
  }

  static async search(
    query: string,
    campaignId?: number,
    entityTypes?: string[]
  ): Promise<SearchResult[]> {
    let sql = `
      SELECT 
        entity_type,
        entity_id,
        title,
        snippet(search_index, 2, '<mark>', '</mark>', '...', 32) as snippet,
        campaign_id,
        bm25(search_index, 1.0, 1.0) as relevance_score
      FROM search_index
      WHERE search_index MATCH ?
    `;
    
    const params: any[] = [query];
    
    if (campaignId) {
      sql += ' AND campaign_id = ?';
      params.push(campaignId);
    }
    
    if (entityTypes && entityTypes.length > 0) {
      sql += ` AND entity_type IN (${entityTypes.map(() => '?').join(',')})`;
      params.push(...entityTypes);
    }
    
    sql += ' ORDER BY relevance_score DESC LIMIT 50';
    
    return db.prepare(sql).all(...params) as SearchResult[];
  }

  // Semantic search for related content
  static async findRelated(
    entityType: string,
    entityId: number,
    limit: number = 10
  ): Promise<SearchResult[]> {
    // Get the entity's content to find similar items
    const entity = db.prepare(`
      SELECT title, content FROM search_index 
      WHERE entity_type = ? AND entity_id = ?
    `).get(entityType, entityId);
    
    if (!entity) return [];
    
    // Simple keyword-based similarity (could be enhanced with vector embeddings)
    const keywords = this.extractKeywords(entity.title + ' ' + entity.content);
    const searchQuery = keywords.slice(0, 5).join(' OR ');
    
    return this.search(searchQuery);
  }

  private static extractKeywords(text: string): string[] {
    // Simple keyword extraction (could use NLP libraries)
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'they', 'been'].includes(word));
  }
}
```

### 4.2 Export System
```typescript
// backend/src/services/ExportService.ts
import { ExportOptions, Campaign } from '@greedy/shared';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

export class ExportService {
  static async exportCampaign(options: ExportOptions): Promise<Buffer | string> {
    const campaign = await this.getCampaignData(options);
    
    switch (options.format) {
      case 'markdown':
        return this.exportToMarkdown(campaign, options);
      case 'pdf':
        return this.exportToPDF(campaign, options);
      case 'html':
        return this.exportToHTML(campaign, options);
      case 'json':
        return JSON.stringify(campaign, null, 2);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private static async getCampaignData(options: ExportOptions) {
    // Fetch all campaign data based on options
    let whereClause = 'WHERE campaign_id = ?';
    const params = [options.campaign_id];
    
    if (options.date_range) {
      whereClause += ' AND created_at BETWEEN ? AND ?';
      params.push(options.date_range.start, options.date_range.end);
    }
    
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?')
      .get(options.campaign_id);
    
    const data: any = { campaign };
    
    if (options.sections.timeline) {
      data.timeline = db.prepare(`
        SELECT * FROM timeline_events ${whereClause} ORDER BY real_date
      `).all(...params);
    }
    
    if (options.sections.sessions) {
      data.sessions = db.prepare(`
        SELECT s.*, sl.* FROM sessions s 
        LEFT JOIN session_logs sl ON s.id = sl.session_id 
        ${whereClause} ORDER BY s.date, sl.created_at
      `).all(...params);
    }
    
    if (options.sections.characters) {
      data.characters = db.prepare(`
        SELECT c.*, cdl.* FROM characters c 
        LEFT JOIN character_development_logs cdl ON c.id = cdl.character_id 
        ${whereClause}
      `).all(...params);
    }
    
    if (options.sections.locations) {
      data.locations = db.prepare(`
        SELECT l.*, le.* FROM locations l 
        LEFT JOIN location_events le ON l.id = le.location_id 
        ${whereClause}
      `).all(...params);
    }
    
    if (options.sections.quests) {
      data.quests = db.prepare(`
        SELECT q.*, qpl.* FROM quests q 
        LEFT JOIN quest_progress_logs qpl ON q.id = qpl.quest_id 
        ${whereClause}
      `).all(...params);
    }
    
    return data;
  }

  private static async exportToMarkdown(data: any, options: ExportOptions): Promise<string> {
    let markdown = `# ${data.campaign.title}\n\n`;
    
    if (data.campaign.description) {
      markdown += `${data.campaign.description}\n\n`;
    }
    
    markdown += `**Game Edition:** ${data.campaign.game_edition?.name}\n`;
    markdown += `**Status:** ${data.campaign.status}\n\n`;
    
    if (options.sections.timeline && data.timeline) {
      markdown += `## Timeline\n\n`;
      data.timeline.forEach((event: any) => {
        markdown += `### ${event.title}\n`;
        markdown += `**Date:** ${event.real_date}\n`;
        if (event.game_date) markdown += `**Game Date:** ${event.game_date}\n`;
        markdown += `**Importance:** ${'★'.repeat(event.importance_level)}\n\n`;
        if (event.description) markdown += `${event.description}\n\n`;
      });
    }
    
    if (options.sections.sessions && data.sessions) {
      markdown += `## Sessions\n\n`;
      const sessionGroups = this.groupBy(data.sessions, 'session_id');
      
      Object.entries(sessionGroups).forEach(([sessionId, logs]: [string, any[]]) => {
        const session = logs[0];
        markdown += `### ${session.title}\n`;
        markdown += `**Date:** ${session.date}\n\n`;
        
        logs.forEach(log => {
          if (log.entry_type) {
            markdown += `#### ${log.entry_type.toUpperCase()}`;
            if (log.timestamp) markdown += ` (${log.timestamp})`;
            markdown += `\n\n${log.content}\n\n`;
          }
        });
      });
    }
    
    // Add other sections...
    
    return markdown;
  }

  private static async exportToPDF(data: any, options: ExportOptions): Promise<Buffer> {
    const html = await this.exportToHTML(data, options);
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html as string);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
    });
    
    await browser.close();
    return pdf;
  }

  private static async exportToHTML(data: any, options: ExportOptions): Promise<string> {
    const markdown = await this.exportToMarkdown(data, options);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.campaign.title} - Adventure Diary</title>
        <style>
          body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
          h1, h2, h3 { color: #2d3748; }
          .timeline-event { border-left: 4px solid #4299e1; padding-left: 1rem; margin: 1rem 0; }
          .importance-5 { border-left-color: #9f7aea; }
          .importance-4 { border-left-color: #ed8936; }
          .session-log { background: #f7fafc; padding: 1rem; margin: 0.5rem 0; border-radius: 4px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        ${marked(markdown)}
      </body>
      </html>
    `;
    
    return html;
  }

  private static groupBy(array: any[], key: string) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }
}
```

## 🎯 Technology Stack Recommendations

### Frontend Enhancements
- **Timeline Visualization**: Continue with D3.js, add zoom/pan capabilities
- **Rich Text Editing**: Add TinyMCE or Quill.js for session logs
- **Date Management**: Day.js for calendar integration
- **Calendar View**: FullCalendar for session scheduling
- **Image Gallery**: React Image Gallery for enhanced media management

### Backend Enhancements  
- **Full-Text Search**: SQLite FTS5 (already suitable for medium-scale)
- **PDF Generation**: Puppeteer for high-quality exports
- **Caching**: Redis for import data caching
- **Task Queue**: Bull Queue for background imports
- **Webhooks**: For integration with VTT platforms

### Infrastructure
- **Database**: Stick with SQLite for simplicity, consider PostgreSQL for multi-user
- **File Storage**: Local files or AWS S3 for production
- **Search**: Consider Elasticsearch for advanced search features
- **Analytics**: Track usage patterns for better UX

### Optional Enhancements
- **NLP Integration**: OpenAI API for auto-generating summaries
- **Voice-to-Text**: Web Speech API for dictating session notes
- **Real-time Collaboration**: Socket.io for multi-user editing
- **Mobile App**: React Native for on-the-go access