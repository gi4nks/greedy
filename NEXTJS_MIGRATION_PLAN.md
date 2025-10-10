# Next.js Full-Stack Migration Plan

## 🎯 **Why Next.js is Perfect for the Adventure Diary System**

### **Current Architecture Issues**
- **Separate Deploy Complexity**: Frontend + Backend containers require coordination
- **No SSR**: Poor initial load times and SEO
- **API Round-trips**: Client-side data fetching causes loading states
- **Development Overhead**: Maintaining two separate codebases

### **Next.js Benefits for This Project**
- **📊 Server-Side Rendering**: Fast initial loads, better UX for content-heavy diary pages
- **🔄 App Router**: Perfect for nested campaign/adventure/session structure  
- **🗃️ Server Components**: Ideal for data-heavy pages (timelines, character sheets)
- **⚡ Server Actions**: Seamless form handling for session logs, character updates
- **🎨 Built-in Optimization**: Image optimization for character/location images
- **📱 Mobile-First**: Better responsive design for on-the-go session notes
- **🚀 Single Deploy**: Unified application, simpler DevOps

---

## 🏗️ **Proposed Next.js Architecture**

### **Project Structure**
```
adventure-diary/
├── app/                          # Next.js 14 App Router
│   ├── globals.css              # Global styles (Tailwind)
│   ├── layout.tsx               # Root layout with navigation
│   ├── page.tsx                 # Landing page / campaign selector
│   ├── campaigns/               # Campaign management
│   │   ├── page.tsx            # Campaign list
│   │   ├── [id]/               # Dynamic campaign routes
│   │   │   ├── page.tsx        # Campaign dashboard
│   │   │   ├── timeline/       # Timeline view
│   │   │   ├── adventures/     # Adventure management
│   │   │   ├── characters/     # Character management
│   │   │   ├── locations/      # Location management
│   │   │   ├── sessions/       # Session management
│   │   │   │   ├── [sessionId]/
│   │   │   │   │   ├── page.tsx    # Session viewer
│   │   │   │   │   └── edit/       # Session editor
│   │   │   └── network/        # Network visualization
│   ├── api/                     # API Routes (replace Express backend)
│   │   ├── campaigns/
│   │   ├── sessions/
│   │   ├── characters/
│   │   ├── timeline/
│   │   ├── search/
│   │   └── import/
│   ├── components/              # Reusable components
│   │   ├── ui/                 # Base UI components
│   │   ├── campaign/           # Campaign-specific components
│   │   ├── session/            # Session management
│   │   ├── timeline/           # Timeline visualization
│   │   ├── network/            # D3.js network graphs
│   │   └── forms/              # Form components with Server Actions
│   └── lib/                    # Utilities and database
│       ├── db/                 # Database layer (SQLite with Drizzle ORM)
│       ├── actions/            # Server Actions
│       ├── services/           # Business logic
│       └── utils/              # Shared utilities
├── public/                     # Static assets
├── types/                      # TypeScript definitions
└── database/                   # SQLite database files
```

### **Technology Stack Evolution**

| Component | Current | Next.js Approach | Benefits |
|-----------|---------|------------------|----------|
| **Frontend** | React + Vite | Next.js 14 App Router | SSR, better routing, performance |
| **Backend** | Express.js | Next.js API Routes + Server Actions | Unified codebase, better DX |
| **Database** | better-sqlite3 | Drizzle ORM + SQLite | Type-safe queries, migrations |
| **State Management** | React Query | Server Components + Server Actions | Less client state, better UX |
| **Styling** | Tailwind + DaisyUI | Tailwind + shadcn/ui | Better component system |
| **Deployment** | Docker containers | Vercel / Single container | Simpler deployment |

---

## 📋 **Phase 1: Next.js Foundation (Week 1)**

### **1.1 Project Setup**
```bash
# Create new Next.js project
npx create-next-app@latest adventure-diary --typescript --tailwind --eslint --app --src-dir

# Install additional dependencies
npm install drizzle-orm drizzle-kit better-sqlite3
npm install @types/better-sqlite3
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install d3 @types/d3
npm install marked puppeteer
npm install @radix-ui/react-accordion @radix-ui/react-dialog
```

### **1.2 Database Layer with Drizzle ORM**
```typescript
// lib/db/schema.ts
import { sqliteTable, integer, text, real, blob } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Core entities
export const gameEditions = sqliteTable('game_editions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  version: text('version'),
  publisher: text('publisher'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  importSources: text('import_sources', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const campaigns = sqliteTable('campaigns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  gameEditionId: integer('game_edition_id').references(() => gameEditions.id),
  status: text('status').default('active'), // 'active' | 'completed' | 'on-hold' | 'cancelled'
  startDate: text('start_date'),
  endDate: text('end_date'),
  worldName: text('world_name'),
  tags: text('tags', { mode: 'json' }),
  settings: text('settings', { mode: 'json' }),
  images: text('images', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const adventures = sqliteTable('adventures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  campaignId: integer('campaign_id').references(() => campaigns.id),
  slug: text('slug'),
  title: text('title').notNull(),
  description: text('description'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').default('active'),
  images: text('images', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adventureId: integer('adventure_id').references(() => adventures.id),
  title: text('title').notNull(),
  date: text('date').notNull(),
  gameDate: text('game_date'), // In-game calendar date
  durationHours: real('duration_hours'),
  xpAwarded: integer('xp_awarded'),
  goldAwarded: integer('gold_awarded'),
  summary: text('summary'),
  images: text('images', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const sessionLogs = sqliteTable('session_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
  entryType: text('entry_type').notNull(), // 'narrative' | 'combat' | 'roleplay' | 'exploration' | 'rest' | 'summary'
  timestamp: text('timestamp'), // Time within session
  content: text('content').notNull(),
  charactersMentioned: text('characters_mentioned', { mode: 'json' }),
  locationsMentioned: text('locations_mentioned', { mode: 'json' }),
  itemsMentioned: text('items_mentioned', { mode: 'json' }),
  questsMentioned: text('quests_mentioned', { mode: 'json' }),
  tags: text('tags', { mode: 'json' }),
  isSummary: integer('is_summary', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const timelineEvents = sqliteTable('timeline_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  campaignId: integer('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  gameDate: text('game_date'),
  realDate: text('real_date').notNull(),
  sessionId: integer('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  relatedEntities: text('related_entities', { mode: 'json' }),
  importanceLevel: integer('importance_level').default(3), // 1-5
  tags: text('tags', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Relations
export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  gameEdition: one(gameEditions, {
    fields: [campaigns.gameEditionId],
    references: [gameEditions.id],
  }),
  adventures: many(adventures),
  timelineEvents: many(timelineEvents),
}));

export const adventuresRelations = relations(adventures, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [adventures.campaignId],
    references: [campaigns.id],
  }),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  adventure: one(adventures, {
    fields: [sessions.adventureId],
    references: [adventures.id],
  }),
  logs: many(sessionLogs),
  timelineEvents: many(timelineEvents),
}));

// Database connection
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('./database/adventure-diary.db');
export const db = drizzle(sqlite, { schema });
```

### **1.3 Server Actions for Data Mutations**
```typescript
// lib/actions/campaigns.ts
'use server';

import { db } from '@/lib/db';
import { campaigns, timelineEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const CreateCampaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  gameEditionId: z.number(),
  worldName: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function createCampaign(formData: FormData) {
  const validatedFields = CreateCampaignSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    gameEditionId: Number(formData.get('gameEditionId')),
    worldName: formData.get('worldName'),
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, description, gameEditionId, worldName, tags } = validatedFields.data;

  try {
    const [campaign] = await db.insert(campaigns).values({
      title,
      description,
      gameEditionId,
      worldName,
      tags,
    }).returning();

    // Create initial timeline event
    await db.insert(timelineEvents).values({
      campaignId: campaign.id,
      eventType: 'major_event',
      title: 'Campaign Started',
      description: `${title} campaign was created`,
      realDate: new Date().toISOString(),
      importanceLevel: 5,
    });

    revalidatePath('/campaigns');
    redirect(`/campaigns/${campaign.id}`);
  } catch (error) {
    return {
      message: 'Database Error: Failed to create campaign.',
    };
  }
}

export async function updateCampaign(id: number, formData: FormData) {
  const validatedFields = CreateCampaignSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    gameEditionId: Number(formData.get('gameEditionId')),
    worldName: formData.get('worldName'),
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await db.update(campaigns)
      .set({
        ...validatedFields.data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(campaigns.id, id));

    revalidatePath(`/campaigns/${id}`);
    return { message: 'Campaign updated successfully.' };
  } catch (error) {
    return {
      message: 'Database Error: Failed to update campaign.',
    };
  }
}
```

### **1.4 Server Components for Data Fetching**
```typescript
// app/campaigns/[id]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import CampaignDashboard from '@/components/campaign/CampaignDashboard';
import CampaignStats from '@/components/campaign/CampaignStats';
import TimelineView from '@/components/timeline/TimelineView';
import { Skeleton } from '@/components/ui/skeleton';

interface CampaignPageProps {
  params: { id: string };
}

async function getCampaign(id: number) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);

  return campaign;
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const campaignId = parseInt(params.id);
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{campaign.title}</h1>
          <p className="text-muted-foreground">{campaign.description}</p>
        </div>
        <div className="badge badge-outline">
          {campaign.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<TimelineSkeleton />}>
            <TimelineView campaignId={campaignId} />
          </Suspense>
        </div>
        
        <div>
          <Suspense fallback={<StatsSkeleton />}>
            <CampaignStats campaignId={campaignId} />
          </Suspense>
        </div>
      </div>

      <CampaignDashboard campaign={campaign} />
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CampaignPageProps) {
  const campaign = await getCampaign(parseInt(params.id));
  
  return {
    title: campaign ? `${campaign.title} | Adventure Diary` : 'Campaign Not Found',
    description: campaign?.description,
  };
}
```

---

## 📋 **Phase 2: Session Management with Server Actions (Week 2)**

### **2.1 Enhanced Session Editor**
```typescript
// app/campaigns/[id]/sessions/[sessionId]/edit/page.tsx
import { Suspense } from 'react';
import { db } from '@/lib/db';
import { sessions, sessionLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import SessionEditor from '@/components/session/SessionEditor';
import SessionLogList from '@/components/session/SessionLogList';

interface SessionEditPageProps {
  params: { id: string; sessionId: string };
}

async function getSessionWithLogs(sessionId: number) {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      logs: {
        orderBy: (logs, { asc }) => [asc(logs.createdAt)],
      },
      adventure: {
        with: {
          campaign: true,
        },
      },
    },
  });

  return session;
}

export default async function SessionEditPage({ params }: SessionEditPageProps) {
  const sessionId = parseInt(params.sessionId);
  const session = await getSessionWithLogs(sessionId);

  if (!session) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{session.title}</h1>
        <p className="text-muted-foreground">
          {session.adventure?.campaign?.title} • {session.adventure?.title}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SessionEditor session={session} />
        </div>
        
        <div>
          <Suspense fallback={<div>Loading logs...</div>}>
            <SessionLogList sessionId={sessionId} logs={session.logs} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

### **2.2 Session Log Management with Server Actions**
```typescript
// lib/actions/sessions.ts
'use server';

import { db } from '@/lib/db';
import { sessionLogs, timelineEvents } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateLogSchema = z.object({
  sessionId: z.number(),
  entryType: z.enum(['narrative', 'combat', 'roleplay', 'exploration', 'rest', 'summary']),
  timestamp: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).default([]),
});

export async function createSessionLog(formData: FormData) {
  const validatedFields = CreateLogSchema.safeParse({
    sessionId: Number(formData.get('sessionId')),
    entryType: formData.get('entryType'),
    timestamp: formData.get('timestamp'),
    content: formData.get('content'),
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { sessionId, entryType, timestamp, content, tags } = validatedFields.data;

  try {
    // Extract entity mentions from content
    const charactersMentioned = extractMentions(content, 'character');
    const locationsMentioned = extractMentions(content, 'location');
    const questsMentioned = extractMentions(content, 'quest');

    await db.insert(sessionLogs).values({
      sessionId,
      entryType,
      timestamp,
      content,
      charactersMentioned,
      locationsMentioned,
      questsMentioned,
      tags,
    });

    // Auto-create timeline event for important log entries
    if (entryType === 'combat' || entryType === 'summary') {
      await createTimelineEventFromLog(sessionId, entryType, content);
    }

    revalidatePath(`/campaigns/*/sessions/${sessionId}/edit`);
    return { success: true };
  } catch (error) {
    return {
      message: 'Database Error: Failed to create session log.',
    };
  }
}

// Auto-generate session summary
export async function generateSessionSummary(sessionId: number) {
  try {
    const logs = await db.query.sessionLogs.findMany({
      where: eq(sessionLogs.sessionId, sessionId),
    });

    const summary = await generateAISummary(logs); // Could use OpenAI API

    await db.insert(sessionLogs).values({
      sessionId,
      entryType: 'summary',
      content: summary,
      isSummary: true,
    });

    revalidatePath(`/campaigns/*/sessions/${sessionId}/edit`);
    return { summary };
  } catch (error) {
    return {
      message: 'Failed to generate summary.',
    };
  }
}

// Utility functions
function extractMentions(content: string, type: 'character' | 'location' | 'quest'): number[] {
  const regex = new RegExp(`@${type}\\[(\\d+)\\]`, 'g');
  const mentions = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    mentions.push(parseInt(match[1]));
  }
  return mentions;
}

async function createTimelineEventFromLog(sessionId: number, entryType: string, content: string) {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: { adventure: { with: { campaign: true } } },
  });

  if (!session?.adventure?.campaign) return;

  const eventTitle = entryType === 'combat' ? 'Combat Encounter' : 'Session Summary';
  
  await db.insert(timelineEvents).values({
    campaignId: session.adventure.campaign.id,
    eventType: entryType === 'combat' ? 'combat' : 'session',
    title: eventTitle,
    description: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
    realDate: session.date,
    sessionId: sessionId,
    importanceLevel: entryType === 'combat' ? 4 : 3,
  });
}
```

### **2.3 Real-time Session Log Component**
```typescript
// components/session/SessionLogForm.tsx
'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { createSessionLog } from '@/lib/actions/sessions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface SessionLogFormProps {
  sessionId: number;
}

export default function SessionLogForm({ sessionId }: SessionLogFormProps) {
  const [state, formAction] = useFormState(createSessionLog, undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="tags" value={JSON.stringify(tags)} />
      
      <div className="grid grid-cols-2 gap-4">
        <Select name="entryType" required>
          <option value="narrative">📖 Narrative</option>
          <option value="combat">⚔️ Combat</option>
          <option value="roleplay">🎭 Roleplay</option>
          <option value="exploration">🗺️ Exploration</option>
          <option value="rest">💤 Rest</option>
        </Select>
        
        <input
          type="text"
          name="timestamp"
          placeholder="Time (e.g., 2:30 PM, Hour 3)"
          className="input input-bordered"
        />
      </div>

      <Textarea
        name="content"
        placeholder="What happened? (Markdown supported, use @character[id], @location[id], @quest[id] for mentions)"
        className="min-h-32"
        required
      />

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add tag"
          value={currentTag}
          onChange={(e) => setCurrentTag(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
          className="input input-bordered flex-1"
        />
        <Button type="button" onClick={handleAddTag} variant="outline">
          Add Tag
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-xs hover:text-red-500"
            >
              ×
            </button>
          </Badge>
        ))}
      </div>

      <Button type="submit" className="w-full">
        Add Log Entry
      </Button>

      {state?.errors && (
        <div className="text-red-500 text-sm">
          {Object.entries(state.errors).map(([field, errors]) => (
            <div key={field}>{errors?.join(', ')}</div>
          ))}
        </div>
      )}
    </form>
  );
}
```

---

## 📋 **Phase 3: Timeline & Visualization (Week 3)**

### **3.1 Server-Side Timeline Data**
```typescript
// app/campaigns/[id]/timeline/page.tsx
import { Suspense } from 'react';
import { db } from '@/lib/db';
import { timelineEvents } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import TimelineVisualization from '@/components/timeline/TimelineVisualization';
import TimelineFilters from '@/components/timeline/TimelineFilters';

interface TimelinePageProps {
  params: { id: string };
  searchParams: { 
    event_types?: string; 
    importance?: string; 
    start_date?: string; 
    end_date?: string; 
  };
}

async function getTimelineEvents(campaignId: number, filters: any) {
  let query = db
    .select({
      id: timelineEvents.id,
      eventType: timelineEvents.eventType,
      title: timelineEvents.title,
      description: timelineEvents.description,
      gameDate: timelineEvents.gameDate,
      realDate: timelineEvents.realDate,
      importanceLevel: timelineEvents.importanceLevel,
      tags: timelineEvents.tags,
      sessionId: timelineEvents.sessionId,
    })
    .from(timelineEvents)
    .where(eq(timelineEvents.campaignId, campaignId));

  // Apply filters
  if (filters.event_types) {
    const types = filters.event_types.split(',');
    query = query.where(inArray(timelineEvents.eventType, types));
  }

  if (filters.importance) {
    query = query.where(gte(timelineEvents.importanceLevel, parseInt(filters.importance)));
  }

  if (filters.start_date && filters.end_date) {
    query = query.where(
      and(
        gte(timelineEvents.realDate, filters.start_date),
        lte(timelineEvents.realDate, filters.end_date)
      )
    );
  }

  const events = await query.orderBy(desc(timelineEvents.realDate));
  return events;
}

export default async function TimelinePage({ params, searchParams }: TimelinePageProps) {
  const campaignId = parseInt(params.id);
  const events = await getTimelineEvents(campaignId, searchParams);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Campaign Timeline</h1>
        <p className="text-muted-foreground">
          Chronicle of events in chronological order
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div>
          <TimelineFilters campaignId={campaignId} />
        </div>
        
        <div className="lg:col-span-3">
          <Suspense fallback={<TimelineSkeletion />}>
            <TimelineVisualization events={events} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// Static generation for better performance
export async function generateStaticParams() {
  // Generate for active campaigns
  const activeCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.status, 'active'),
    columns: { id: true },
  });

  return activeCampaigns.map(campaign => ({
    id: campaign.id.toString(),
  }));
}
```

### **3.2 Enhanced D3.js Timeline Component**
```typescript
// components/timeline/TimelineVisualization.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TimelineEvent } from '@/types';

interface TimelineVisualizationProps {
  events: TimelineEvent[];
  height?: number;
}

export default function TimelineVisualization({ 
  events, 
  height = 600 
}: TimelineVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    if (!svgRef.current || events.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 100 };
    const width = svg.node()?.getBoundingClientRect().width || 800;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Parse and sort events
    const sortedEvents = events
      .map(event => ({
        ...event,
        parsedDate: new Date(event.realDate)
      }))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(sortedEvents, d => d.parsedDate) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scalePoint()
      .domain(sortedEvents.map((_, i) => i.toString()))
      .range([0, innerHeight])
      .padding(0.1);

    // Color scale based on importance and event type
    const colorScale = d3.scaleOrdinal()
      .domain(['session', 'combat', 'quest_start', 'quest_complete', 'character_death', 'major_event'])
      .range(['#3b82f6', '#ef4444', '#10b981', '#22c55e', '#8b5cf6', '#f59e0b']);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Timeline backbone
    g.append('line')
      .attr('class', 'timeline-backbone')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight / 2)
      .attr('y2', innerHeight / 2)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 2);

    // Event groups
    const eventGroups = g.selectAll('.timeline-event')
      .data(sortedEvents)
      .enter()
      .append('g')
      .attr('class', 'timeline-event')
      .attr('transform', (d, i) => {
        const x = xScale(d.parsedDate);
        const y = i % 2 === 0 ? yScale(i.toString())! - 50 : yScale(i.toString())! + 50;
        return `translate(${x}, ${y})`;
      });

    // Event circles
    eventGroups.append('circle')
      .attr('r', d => 6 + (d.importanceLevel * 2))
      .attr('fill', d => colorScale(d.eventType) as string)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => setSelectedEvent(d))
      .on('mouseover', function(event, d) {
        // Tooltip
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'timeline-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('opacity', 0);

        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <strong>${d.title}</strong><br>
          ${d3.timeFormat('%B %d, %Y')(d.parsedDate)}<br>
          Importance: ${d.importanceLevel}/5
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.timeline-tooltip').remove();
      });

    // Connection lines to timeline
    eventGroups.append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', (d, i) => i % 2 === 0 ? 50 : -50)
      .attr('y2', (d, i) => i % 2 === 0 ? innerHeight / 2 - (yScale(i.toString())! - 50) : innerHeight / 2 - (yScale(i.toString())! + 50))
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    // Event labels
    eventGroups.append('text')
      .attr('x', 15)
      .attr('y', 4)
      .text(d => d.title.length > 25 ? d.title.slice(0, 25) + '...' : d.title)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151');

    // Date labels
    eventGroups.append('text')
      .attr('x', 15)
      .attr('y', 20)
      .text(d => d3.timeFormat('%b %d, %Y')(d.parsedDate))
      .attr('font-size', '9px')
      .attr('fill', '#6b7280');

    // X-axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeMonth.every(2))
      .tickFormat(d3.timeFormat('%b %Y'));

    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

  }, [events, height]);

  return (
    <div className="timeline-container">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        className="border rounded-lg bg-white shadow-sm"
      />
      
      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-xl mb-4">{selectedEvent.title}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="font-semibold">Date:</span> {' '}
                {new Date(selectedEvent.realDate).toLocaleDateString()}
              </div>
              <div>
                <span className="font-semibold">Type:</span> {' '}
                <span className="capitalize">{selectedEvent.eventType.replace('_', ' ')}</span>
              </div>
              {selectedEvent.gameDate && (
                <div>
                  <span className="font-semibold">Game Date:</span> {selectedEvent.gameDate}
                </div>
              )}
              <div>
                <span className="font-semibold">Importance:</span> {' '}
                {'★'.repeat(selectedEvent.importanceLevel)}
              </div>
            </div>
            
            {selectedEvent.description && (
              <div className="prose prose-sm max-w-none mb-4">
                <p>{selectedEvent.description}</p>
              </div>
            )}
            
            {selectedEvent.tags && selectedEvent.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {selectedEvent.tags.map(tag => (
                  <span key={tag} className="badge badge-outline badge-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="modal-action">
              {selectedEvent.sessionId && (
                <a 
                  href={`/campaigns/${selectedEvent.campaignId}/sessions/${selectedEvent.sessionId}`}
                  className="btn btn-primary btn-sm"
                >
                  View Session
                </a>
              )}
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 **Benefits of Next.js Approach**

### **Performance Improvements**
- **Server-Side Rendering**: Campaign dashboards load instantly with data
- **Static Generation**: Timeline pages can be pre-generated for active campaigns  
- **Streaming**: Progressive loading of timeline events and session logs
- **Image Optimization**: Automatic optimization for character/location images
- **Code Splitting**: Automatic splitting reduces initial bundle size

### **Developer Experience**
- **Single Codebase**: Unified TypeScript across client/server
- **Type Safety**: Drizzle ORM provides end-to-end type safety
- **Server Actions**: Form handling without API boilerplate
- **File-based Routing**: Intuitive campaign/adventure/session URL structure
- **Hot Reload**: Faster development iteration

### **User Experience** 
- **Faster Navigation**: Client-side routing between campaign pages
- **Offline Capability**: Service worker can cache session data
- **Mobile Responsive**: Better mobile experience for on-the-go session notes
- **Progressive Enhancement**: Forms work without JavaScript
- **Real-time Updates**: Optimistic UI updates with Server Actions

### **SEO & Sharing**
- **Rich Metadata**: Campaign pages have proper meta tags for sharing
- **Search Engine Friendly**: Server-rendered content is indexable
- **Open Graph**: Beautiful previews when sharing campaign links
- **Structured Data**: JSON-LD markup for better search results

---

## 📋 **Migration Strategy**

### **Week 1: Foundation**
1. Create new Next.js project alongside existing system
2. Set up Drizzle ORM with current database schema
3. Migrate campaign and adventure management pages
4. Create basic Server Actions for CRUD operations

### **Week 2: Session Management** 
1. Build enhanced session editor with Server Actions
2. Implement session log system with real-time updates
3. Add timeline event auto-creation from session logs
4. Migrate existing session data to new log structure

### **Week 3: Visualization & Search**
1. Port D3.js network visualization to Next.js
2. Enhanced timeline visualization with server-side data
3. Implement full-text search with SQLite FTS5
4. Add export functionality (PDF, Markdown)

### **Week 4: Polish & Deploy**
1. Mobile responsive design improvements
2. Performance optimization and caching
3. Migration scripts for existing data
4. Deploy to Vercel or single Docker container

### **Data Migration**
```typescript
// scripts/migrate-to-nextjs.ts
import { db as oldDb } from '../backend/db';
import { db as newDb } from '../lib/db';

async function migrateExistingData() {
  console.log('Starting data migration...');
  
  // 1. Create default game edition and campaign
  const [adnd2e] = await newDb.insert(gameEditions).values({
    code: 'adnd2e',
    name: 'AD&D 2nd Edition', 
    publisher: 'TSR',
    isActive: true,
  }).returning();
  
  const [legacyCampaign] = await newDb.insert(campaigns).values({
    title: 'Legacy Campaign',
    description: 'Migrated from existing system',
    gameEditionId: adnd2e.id,
    status: 'active',
  }).returning();
  
  // 2. Migrate adventures
  const oldAdventures = oldDb.prepare('SELECT * FROM adventures').all();
  for (const adventure of oldAdventures) {
    await newDb.insert(adventures).values({
      ...adventure,
      campaignId: legacyCampaign.id,
    });
  }
  
  // 3. Migrate sessions and convert text to logs
  const oldSessions = oldDb.prepare('SELECT * FROM sessions').all();
  for (const session of oldSessions) {
    const [newSession] = await newDb.insert(sessions).values({
      ...session,
      summary: session.text, // Old text becomes summary
    }).returning();
    
    // Create a single log entry from old text
    if (session.text) {
      await newDb.insert(sessionLogs).values({
        sessionId: newSession.id,
        entryType: 'summary',
        content: session.text,
        isSummary: true,
      });
    }
  }
  
  console.log('Migration completed!');
}
```

The Next.js approach transforms your D&D campaign manager into a modern, performant, and user-friendly adventure diary system while maintaining all existing functionality and providing a clear path for future enhancements.