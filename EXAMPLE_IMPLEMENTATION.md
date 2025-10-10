# Example Implementation Code

## Frontend Components

### Campaign Dashboard
```typescript
// frontend/src/pages/CampaignDashboard.tsx
import React, { useState } from 'react';
import { useCampaigns, useTimelineEvents } from '../hooks';
import { TimelineVisualization } from '../components/timeline/TimelineVisualization';
import { CampaignStats } from '../components/dashboard/CampaignStats';

export const CampaignDashboard: React.FC = () => {
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const { data: campaigns } = useCampaigns();
  const { data: timelineEvents } = useTimelineEvents(selectedCampaign);

  return (
    <div className="campaign-dashboard">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <h1 className="text-2xl font-bold">📚 Adventure Diary</h1>
        </div>
        <div className="navbar-end">
          <select
            className="select select-bordered"
            value={selectedCampaign || ''}
            onChange={(e) => setSelectedCampaign(Number(e.target.value) || null)}
          >
            <option value="">Select Campaign</option>
            {campaigns?.map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title} ({campaign.game_edition?.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCampaign && (
        <div className="container mx-auto p-4 space-y-6">
          <CampaignStats campaignId={selectedCampaign} />
          
          <div className="card bg-base-100 shadow-xl">
            <div className="card-header">
              <h2 className="card-title">📅 Campaign Timeline</h2>
            </div>
            <div className="card-body">
              <TimelineVisualization 
                events={timelineEvents || []} 
                height={400}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentSessions campaignId={selectedCampaign} />
            <ActiveQuests campaignId={selectedCampaign} />
            <CharacterSpotlight campaignId={selectedCampaign} />
          </div>
        </div>
      )}
    </div>
  );
};

// Campaign Statistics Component
const CampaignStats: React.FC<{ campaignId: number }> = ({ campaignId }) => {
  const { data: stats } = useCampaignStats(campaignId);

  return (
    <div className="stats stats-horizontal shadow">
      <div className="stat">
        <div className="stat-title">Sessions Played</div>
        <div className="stat-value text-primary">{stats?.sessions || 0}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Active Quests</div>
        <div className="stat-value text-secondary">{stats?.active_quests || 0}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Characters</div>
        <div className="stat-value text-accent">{stats?.characters || 0}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Locations Discovered</div>
        <div className="stat-value">{stats?.locations || 0}</div>
      </div>
    </div>
  );
};
```

### Enhanced Session Editor
```typescript
// frontend/src/components/sessions/EnhancedSessionEditor.tsx
import React, { useState, useEffect } from 'react';
import { SessionLog, TimelineEvent } from '@greedy/shared';
import { SessionLogEditor } from './SessionLogEditor';
import { AutoSummaryGenerator } from './AutoSummaryGenerator';

interface EnhancedSessionEditorProps {
  sessionId: number;
  onSessionUpdated?: () => void;
}

export const EnhancedSessionEditor: React.FC<EnhancedSessionEditorProps> = ({
  sessionId,
  onSessionUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'summary' | 'timeline'>('logs');
  const [autoSummary, setAutoSummary] = useState('');
  
  const { data: session } = useSession(sessionId);
  const { data: logs } = useSessionLogs(sessionId);
  const createTimelineEvent = useCreateTimelineEvent();

  // Auto-generate session summary when logs are added
  useEffect(() => {
    if (logs && logs.length > 0) {
      generateAutoSummary(logs).then(setAutoSummary);
    }
  }, [logs]);

  const handleCreateTimelineEvent = async (eventData: Partial<TimelineEvent>) => {
    await createTimelineEvent.mutateAsync({
      ...eventData,
      campaign_id: session?.adventure?.campaign_id,
      session_id: sessionId,
      real_date: session?.date || new Date().toISOString()
    });
    onSessionUpdated?.();
  };

  return (
    <div className="enhanced-session-editor">
      <div className="tabs tabs-bordered mb-6">
        <button 
          className={`tab ${activeTab === 'logs' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📝 Session Logs
        </button>
        <button 
          className={`tab ${activeTab === 'summary' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          📋 Summary
        </button>
        <button 
          className={`tab ${activeTab === 'timeline' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          ⏰ Timeline Events
        </button>
      </div>

      {activeTab === 'logs' && (
        <SessionLogEditor 
          sessionId={sessionId} 
          onLogAdded={() => onSessionUpdated?.()}
        />
      )}

      {activeTab === 'summary' && (
        <div className="space-y-4">
          <AutoSummaryGenerator 
            logs={logs || []}
            onSummaryGenerated={setAutoSummary}
          />
          
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="card-title">Session Summary</h3>
              <textarea
                className="textarea textarea-bordered w-full h-40"
                placeholder="Session summary (auto-generated or manual)"
                value={autoSummary}
                onChange={(e) => setAutoSummary(e.target.value)}
              />
              <div className="card-actions justify-end">
                <button 
                  className="btn btn-primary"
                  onClick={() => saveSessionSummary(sessionId, autoSummary)}
                >
                  Save Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <TimelineEventManager 
          sessionId={sessionId}
          onEventCreated={handleCreateTimelineEvent}
        />
      )}
    </div>
  );
};

// Timeline Event Manager
const TimelineEventManager: React.FC<{
  sessionId: number;
  onEventCreated: (event: Partial<TimelineEvent>) => void;
}> = ({ sessionId, onEventCreated }) => {
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'session' as TimelineEvent['event_type'],
    importance_level: 3 as TimelineEvent['importance_level'],
    game_date: ''
  });

  return (
    <div className="timeline-event-manager space-y-4">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title">Create Timeline Event</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Event title"
              className="input input-bordered"
              value={eventForm.title}
              onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
            />
            
            <select
              className="select select-bordered"
              value={eventForm.event_type}
              onChange={(e) => setEventForm({...eventForm, event_type: e.target.value as TimelineEvent['event_type']})}
            >
              <option value="session">📖 Session Event</option>
              <option value="quest_start">🎯 Quest Started</option>
              <option value="quest_complete">✅ Quest Completed</option>
              <option value="character_death">💀 Character Death</option>
              <option value="location_discovered">🗺️ Location Discovered</option>
              <option value="level_up">⬆️ Level Up</option>
              <option value="major_event">⭐ Major Event</option>
              <option value="combat">⚔️ Combat</option>
              <option value="social">🤝 Social Encounter</option>
            </select>
          </div>

          <textarea
            className="textarea textarea-bordered"
            placeholder="Event description"
            value={eventForm.description}
            onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="In-game date (optional)"
              className="input input-bordered"
              value={eventForm.game_date}
              onChange={(e) => setEventForm({...eventForm, game_date: e.target.value})}
            />
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Importance (1-5)</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                className="range range-primary"
                value={eventForm.importance_level}
                onChange={(e) => setEventForm({...eventForm, importance_level: Number(e.target.value) as TimelineEvent['importance_level']})}
              />
              <div className="flex justify-between text-xs px-2">
                <span>Minor</span>
                <span>Major</span>
                <span>Epic</span>
              </div>
            </div>
          </div>

          <div className="card-actions justify-end">
            <button
              className="btn btn-primary"
              onClick={() => {
                onEventCreated(eventForm);
                setEventForm({
                  title: '',
                  description: '',
                  event_type: 'session',
                  importance_level: 3,
                  game_date: ''
                });
              }}
              disabled={!eventForm.title}
            >
              Add to Timeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Backend API Endpoints

### Campaign Management API
```typescript
// backend/src/routes/campaigns.ts
import express, { Request, Response } from 'express';
import { db } from '../../db';
import { Campaign, TimelineEvent } from '@greedy/shared';
import { SearchService } from '../services/SearchService';

const router = express.Router();

// Get all campaigns with stats
router.get('/', (req: Request, res: Response) => {
  const campaigns = db.prepare(`
    SELECT 
      c.*,
      ge.name as edition_name,
      ge.code as edition_code,
      COUNT(DISTINCT a.id) as adventure_count,
      COUNT(DISTINCT s.id) as session_count,
      COUNT(DISTINCT ch.id) as character_count
    FROM campaigns c
    LEFT JOIN game_editions ge ON c.game_edition_id = ge.id
    LEFT JOIN adventures a ON c.id = a.campaign_id
    LEFT JOIN sessions s ON a.id = s.adventure_id
    LEFT JOIN characters ch ON a.id = ch.adventure_id
    GROUP BY c.id
    ORDER BY c.updated_at DESC
  `).all();

  res.json(campaigns);
});

// Create new campaign
router.post('/', async (req: Request, res: Response) => {
  const { title, description, game_edition_id, world_name, tags, settings } = req.body;
  
  const result = db.prepare(`
    INSERT INTO campaigns 
    (title, description, game_edition_id, world_name, tags, settings)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description,
    game_edition_id,
    world_name,
    JSON.stringify(tags || []),
    JSON.stringify(settings || {})
  );

  // Create initial timeline event
  db.prepare(`
    INSERT INTO timeline_events 
    (campaign_id, event_type, title, description, real_date, importance_level)
    VALUES (?, 'major_event', 'Campaign Started', ?, ?, 5)
  `).run(
    result.lastInsertRowid,
    `${title} campaign was created`,
    new Date().toISOString()
  );

  res.json({ id: result.lastInsertRowid, message: 'Campaign created' });
});

// Get campaign timeline
router.get('/:id/timeline', (req: Request, res: Response) => {
  const campaignId = req.params.id;
  
  const events = db.prepare(`
    SELECT 
      te.*,
      s.title as session_title,
      s.date as session_date
    FROM timeline_events te
    LEFT JOIN sessions s ON te.session_id = s.id
    WHERE te.campaign_id = ?
    ORDER BY te.real_date ASC
  `).all(campaignId);

  res.json(events);
});

// Get campaign statistics
router.get('/:id/stats', (req: Request, res: Response) => {
  const campaignId = req.params.id;
  
  const stats = db.prepare(`
    SELECT 
      COUNT(DISTINCT a.id) as adventures,
      COUNT(DISTINCT s.id) as sessions,
      COUNT(DISTINCT ch.id) as characters,
      COUNT(DISTINCT l.id) as locations,
      COUNT(DISTINCT q.id) as total_quests,
      COUNT(DISTINCT CASE WHEN q.status = 'active' THEN q.id END) as active_quests,
      COUNT(DISTINCT CASE WHEN q.status = 'completed' THEN q.id END) as completed_quests
    FROM campaigns c
    LEFT JOIN adventures a ON c.id = a.campaign_id
    LEFT JOIN sessions s ON a.id = s.adventure_id
    LEFT JOIN characters ch ON a.id = ch.adventure_id
    LEFT JOIN locations l ON a.id = l.adventure_id
    LEFT JOIN quests q ON a.id = q.adventure_id
    WHERE c.id = ?
  `).get(campaignId);

  res.json(stats);
});

// Search within campaign
router.get('/:id/search', (req: Request, res: Response) => {
  const campaignId = req.params.id;
  const { q: query, types } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter required' });
  }
  
  const entityTypes = types ? (types as string).split(',') : undefined;
  const results = SearchService.search(query as string, Number(campaignId), entityTypes);
  
  res.json(results);
});

export default router;
```

### Timeline Events API
```typescript
// backend/src/routes/timeline.ts
import express, { Request, Response } from 'express';
import { db } from '../../db';
import { TimelineEvent } from '@greedy/shared';
import { SearchService } from '../services/SearchService';

const router = express.Router();

// Create timeline event
router.post('/', (req: Request, res: Response) => {
  const {
    campaign_id,
    event_type,
    title,
    description,
    game_date,
    real_date,
    session_id,
    related_entities,
    importance_level,
    tags
  } = req.body;

  const result = db.prepare(`
    INSERT INTO timeline_events 
    (campaign_id, event_type, title, description, game_date, real_date, 
     session_id, related_entities, importance_level, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    campaign_id,
    event_type,
    title,
    description,
    game_date,
    real_date || new Date().toISOString(),
    session_id,
    JSON.stringify(related_entities || {}),
    importance_level || 3,
    JSON.stringify(tags || [])
  );

  // Index for search
  SearchService.indexEntity(
    'timeline',
    result.lastInsertRowid as number,
    title,
    description || '',
    tags || [],
    campaign_id
  );

  res.json({ id: result.lastInsertRowid, message: 'Timeline event created' });
});

// Get events for campaign
router.get('/campaign/:campaignId', (req: Request, res: Response) => {
  const { campaignId } = req.params;
  const { start_date, end_date, event_types, min_importance } = req.query;
  
  let sql = `
    SELECT te.*, s.title as session_title 
    FROM timeline_events te
    LEFT JOIN sessions s ON te.session_id = s.id
    WHERE te.campaign_id = ?
  `;
  
  const params: any[] = [campaignId];
  
  if (start_date && end_date) {
    sql += ' AND te.real_date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  
  if (event_types) {
    const types = (event_types as string).split(',');
    sql += ` AND te.event_type IN (${types.map(() => '?').join(',')})`;
    params.push(...types);
  }
  
  if (min_importance) {
    sql += ' AND te.importance_level >= ?';
    params.push(min_importance);
  }
  
  sql += ' ORDER BY te.real_date ASC';
  
  const events = db.prepare(sql).all(...params);
  res.json(events);
});

export default router;
```

### Session Logs API
```typescript
// backend/src/routes/sessionLogs.ts
import express, { Request, Response } from 'express';
import { db } from '../../db';
import { SessionLog } from '@greedy/shared';
import { SearchService } from '../services/SearchService';

const router = express.Router();

// Create session log
router.post('/', (req: Request, res: Response) => {
  const {
    session_id,
    entry_type,
    timestamp,
    content,
    characters_mentioned,
    locations_mentioned,
    items_mentioned,
    quests_mentioned,
    tags,
    is_summary
  } = req.body;

  const result = db.prepare(`
    INSERT INTO session_logs 
    (session_id, entry_type, timestamp, content, characters_mentioned,
     locations_mentioned, items_mentioned, quests_mentioned, tags, is_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    session_id,
    entry_type,
    timestamp,
    content,
    JSON.stringify(characters_mentioned || []),
    JSON.stringify(locations_mentioned || []),
    JSON.stringify(items_mentioned || []),
    JSON.stringify(quests_mentioned || []),
    JSON.stringify(tags || []),
    is_summary ? 1 : 0
  );

  // Get session info for indexing
  const session = db.prepare(`
    SELECT s.*, a.campaign_id 
    FROM sessions s 
    JOIN adventures a ON s.adventure_id = a.id 
    WHERE s.id = ?
  `).get(session_id);

  if (session) {
    SearchService.indexEntity(
      'session_log',
      result.lastInsertRowid as number,
      `${session.title} - ${entry_type}`,
      content,
      tags || [],
      session.campaign_id
    );
  }

  res.json({ id: result.lastInsertRowid, message: 'Session log created' });
});

// Get session logs
router.get('/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  const logs = db.prepare(`
    SELECT * FROM session_logs 
    WHERE session_id = ? 
    ORDER BY created_at ASC
  `).all(sessionId);

  // Parse JSON fields
  logs.forEach((log: any) => {
    log.characters_mentioned = JSON.parse(log.characters_mentioned || '[]');
    log.locations_mentioned = JSON.parse(log.locations_mentioned || '[]');
    log.items_mentioned = JSON.parse(log.items_mentioned || '[]');
    log.quests_mentioned = JSON.parse(log.quests_mentioned || '[]');
    log.tags = JSON.parse(log.tags || '[]');
  });

  res.json(logs);
});

// Auto-generate session summary
router.post('/:sessionId/generate-summary', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  const logs = db.prepare(`
    SELECT content, entry_type FROM session_logs 
    WHERE session_id = ? AND is_summary = 0
    ORDER BY created_at ASC
  `).all(sessionId);

  if (logs.length === 0) {
    return res.status(404).json({ error: 'No logs found for session' });
  }

  // Simple summary generation (could use AI/NLP)
  const summaryParts = {
    narrative: logs.filter(l => l.entry_type === 'narrative').map(l => l.content),
    combat: logs.filter(l => l.entry_type === 'combat').map(l => l.content),
    roleplay: logs.filter(l => l.entry_type === 'roleplay').map(l => l.content),
    exploration: logs.filter(l => l.entry_type === 'exploration').map(l => l.content)
  };

  let summary = '## Session Summary\n\n';
  
  if (summaryParts.narrative.length > 0) {
    summary += '### Story Progression\n' + summaryParts.narrative.join('\n\n') + '\n\n';
  }
  
  if (summaryParts.combat.length > 0) {
    summary += '### Combat Encounters\n' + summaryParts.combat.join('\n\n') + '\n\n';
  }
  
  if (summaryParts.roleplay.length > 0) {
    summary += '### Roleplay Highlights\n' + summaryParts.roleplay.join('\n\n') + '\n\n';
  }
  
  if (summaryParts.exploration.length > 0) {
    summary += '### Exploration & Discovery\n' + summaryParts.exploration.join('\n\n') + '\n\n';
  }

  res.json({ summary });
});

export default router;
```

## Utility Hooks

### React Query Hooks for Data Management
```typescript
// frontend/src/hooks/useCampaigns.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Campaign, TimelineEvent } from '@greedy/shared';

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async (): Promise<Campaign[]> => {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    }
  });
}

export function useCampaign(id: number) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async (): Promise<Campaign> => {
      const response = await fetch(`/api/campaigns/${id}`);
      if (!response.ok) throw new Error('Failed to fetch campaign');
      return response.json();
    },
    enabled: !!id
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaign: Omit<Campaign, 'id'>): Promise<Campaign> => {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign)
      });
      if (!response.ok) throw new Error('Failed to create campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    }
  });
}

export function useTimelineEvents(campaignId: number | null) {
  return useQuery({
    queryKey: ['timeline', campaignId],
    queryFn: async (): Promise<TimelineEvent[]> => {
      const response = await fetch(`/api/timeline/campaign/${campaignId}`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      return response.json();
    },
    enabled: !!campaignId
  });
}

export function useCreateTimelineEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> => {
      const response = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (!response.ok) throw new Error('Failed to create timeline event');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeline', variables.campaign_id] });
    }
  });
}

export function useCampaignStats(campaignId: number) {
  return useQuery({
    queryKey: ['campaign-stats', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch campaign stats');
      return response.json();
    },
    enabled: !!campaignId
  });
}

// Search functionality
export function useSearch() {
  return useMutation({
    mutationFn: async ({ 
      query, 
      campaignId, 
      types 
    }: { 
      query: string; 
      campaignId?: number; 
      types?: string[] 
    }) => {
      const params = new URLSearchParams({ q: query });
      if (types) params.append('types', types.join(','));
      
      const url = campaignId 
        ? `/api/campaigns/${campaignId}/search?${params}`
        : `/api/search?${params}`;
        
      const response = await fetch(url);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    }
  });
}
```

This comprehensive architecture evolution transforms your existing D&D campaign manager into a full-featured multi-edition adventure diary system. The implementation maintains your current solid foundation while adding powerful new features for chronicle management, timeline visualization, and edition-specific content integration.

The modular design ensures you can implement features incrementally, and the TypeScript foundation provides type safety throughout the evolution process.