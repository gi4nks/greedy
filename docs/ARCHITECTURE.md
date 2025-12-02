# Greedy Architecture

> A comprehensive overview of the Greedy D&D Campaign Manager architecture.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Layer](#data-layer)
- [Application Layer](#application-layer)
- [Component Architecture](#component-architecture)
- [API Design](#api-design)
- [State Management](#state-management)
- [Deployment](#deployment)

---

## Overview

Greedy is a **full-stack Next.js 15 application** designed for Dungeon Masters to manage D&D campaigns. It follows a **server-first architecture** leveraging React Server Components and Server Actions for data mutations.

### Core Principles

1. **Server-First**: Data fetching happens on the server, close to the database
2. **Type Safety**: End-to-end TypeScript with Zod validation
3. **Campaign Isolation**: All data is scoped to campaigns for multi-campaign support
4. **Progressive Enhancement**: Forms work without JavaScript via Server Actions

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 15 (App Router) | Full-stack React framework |
| **Runtime** | React 19 | Server/Client Components |
| **Language** | TypeScript 5 | Type safety |
| **Database** | SQLite (better-sqlite3) | Embedded relational database |
| **ORM** | Drizzle ORM | Type-safe SQL queries |
| **Styling** | TailwindCSS 4 + DaisyUI 5 | Utility-first CSS |
| **Icons** | Lucide React | Icon library |
| **Forms** | React Hook Form + Zod | Form handling & validation |
| **Charts** | Recharts | Data visualization |
| **Markdown** | Marked + DOMPurify | Safe HTML rendering |

---

## Project Structure

```
greedy/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (global)/             # Cross-campaign routes
│   │   │   ├── adventures/       # Global adventure list
│   │   │   ├── analytics/        # Campaign analytics
│   │   │   ├── characters/       # Global character list
│   │   │   ├── magic-items/      # Magic item management
│   │   │   ├── relationships/    # Relationship explorer
│   │   │   ├── search/           # Global search
│   │   │   ├── sessions/         # Global session list
│   │   │   └── wiki/             # Wiki browser
│   │   ├── api/                  # API route handlers
│   │   │   ├── campaigns/        # Campaign CRUD
│   │   │   ├── characters/       # Character CRUD + diary
│   │   │   ├── locations/        # Location CRUD + diary
│   │   │   ├── magic-items/      # Magic item CRUD
│   │   │   ├── quests/           # Quest CRUD + diary
│   │   │   ├── relations/        # Relationship CRUD
│   │   │   ├── 5etools/          # 5e data integration
│   │   │   ├── analytics/        # Analytics queries
│   │   │   ├── export/           # Data export
│   │   │   ├── game-editions/    # Game edition config
│   │   │   └── images/           # Image upload/serve
│   │   ├── campaigns/            # Campaign-scoped routes
│   │   │   └── [id]/
│   │   │       ├── adventures/   # Campaign adventures
│   │   │       ├── characters/   # Campaign characters
│   │   │       ├── locations/    # Campaign locations
│   │   │       ├── network/      # Relationship graph
│   │   │       ├── quests/       # Campaign quests
│   │   │       ├── relations/    # Campaign relations
│   │   │       └── sessions/     # Campaign sessions
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Homepage (campaign list)
│   │   └── globals.css           # Global styles
│   │
│   ├── components/               # React Components
│   │   ├── ui/                   # Primitive UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── ...
│   │   ├── layout/               # Layout components
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── ...
│   │   ├── campaign/             # Campaign components
│   │   ├── character/            # Character components
│   │   ├── adventure/            # Adventure components
│   │   ├── session/              # Session components
│   │   ├── location/             # Location components
│   │   ├── quest/                # Quest components
│   │   ├── magic-items/          # Magic item components
│   │   ├── relationships/        # Relationship components
│   │   ├── wiki/                 # Wiki components
│   │   └── Navigation.tsx        # Main navigation
│   │
│   └── lib/                      # Shared utilities
│       ├── actions/              # Server Actions
│       │   ├── adventures.ts
│       │   ├── campaigns.ts
│       │   ├── characters.ts
│       │   ├── locations.ts
│       │   ├── magic-items.ts
│       │   ├── quests.ts
│       │   ├── relations.ts
│       │   └── sessions.ts
│       ├── db/                   # Database layer
│       │   ├── schema.ts         # Drizzle schema
│       │   ├── queries.ts        # Query functions
│       │   └── index.ts          # DB connection
│       ├── forms/                # Form utilities
│       │   ├── schemas.ts        # Zod schemas
│       │   └── validation.ts     # Validation helpers
│       ├── hooks/                # React hooks
│       ├── types/                # TypeScript types
│       ├── services/             # Business logic
│       ├── utils/                # Helper functions
│       └── utils.ts              # Common utilities
│
├── drizzle/                      # Database migrations
│   ├── *.sql                     # Migration files
│   └── meta/                     # Migration metadata
├── migrations/                   # Manual SQL scripts
├── scripts/                      # CLI utilities
├── public/                       # Static assets
│   ├── images/                   # Uploaded images
│   └── 5etools/                  # 5e data (gitignored)
├── database/                     # SQLite storage (gitignored)
├── docker-compose.yml            # Production compose
├── docker-compose.dev.yml        # Development compose
├── Dockerfile                    # Multi-stage build
└── Makefile                      # Task runner
```

---

## Data Layer

### Database Schema

Greedy uses SQLite with Drizzle ORM. The schema is defined in `src/lib/db/schema.ts`.

#### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  game_editions  │     │    campaigns    │     │   adventures    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │◄────│ game_edition_id │     │ id              │
│ code            │     │ id              │◄────│ campaign_id     │
│ name            │     │ title           │     │ title           │
│ version         │     │ description     │     │ description     │
│ publisher       │     │ status          │     │ status          │
└─────────────────┘     │ tags            │     └────────┬────────┘
                        └────────┬────────┘              │
                                 │                       │
        ┌────────────────────────┼───────────────────────┤
        │                        │                       │
        ▼                        ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   sessions    │     │   characters    │     │    locations    │
├───────────────┤     ├─────────────────┤     ├─────────────────┤
│ id            │     │ id              │     │ id              │
│ campaign_id   │     │ campaign_id     │     │ campaign_id     │
│ adventure_id  │     │ adventure_id    │     │ adventure_id    │
│ title         │     │ name            │     │ name            │
│ date          │     │ character_type  │     │ description     │
│ text          │     │ race, classes   │     │ tags            │
│ narrative     │     │ stats, hp, ac   │     └─────────────────┘
└───────────────┘     │ tags            │
                      └────────┬────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ character_diary_    │
                    │ entries             │
                    ├─────────────────────┤
                    │ id                  │
                    │ character_id        │
                    │ description         │
                    │ date                │
                    │ linked_entities     │
                    └─────────────────────┘

┌─────────────────┐     ┌─────────────────────────┐
│   magic_items   │     │  magic_item_assignments │
├─────────────────┤     ├─────────────────────────┤
│ id              │◄────│ magic_item_id           │
│ name            │     │ entity_type             │
│ rarity          │     │ entity_id               │
│ type            │     │ campaign_id             │
│ description     │     │ notes                   │
│ properties      │     └─────────────────────────┘
│ attunement      │
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│    relations    │     │     quests      │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ campaign_id     │     │ adventure_id    │
│ source_entity_* │     │ title           │
│ target_entity_* │     │ status          │
│ relation_type   │     │ priority        │
│ bidirectional   │     │ type            │
└─────────────────┘     └─────────────────┘
```

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **Campaign** | Top-level container | title, game_edition, status |
| **Adventure** | Story arc within campaign | title, campaign_id |
| **Session** | Play session log | title, date, text, narrative |
| **Character** | PC or NPC | name, type, stats, classes |
| **Location** | Place in the world | name, description, tags |
| **Quest** | Tracked objective | title, status, priority |
| **MagicItem** | Item catalog | name, rarity, properties |
| **Relation** | Entity connections | source, target, type |

### Diary System

Characters, Locations, and Quests support **diary entries** for tracking history:

```typescript
// Example: Character diary entry
{
  id: 1,
  characterId: 5,
  description: "Discovered ancient tome in library",
  date: "2024-03-15",
  linkedEntities: [
    { id: 2, type: "location", name: "Ancient Library" }
  ],
  isImportant: true
}
```

---

## Application Layer

### Server Actions

All mutations are handled via **Server Actions** in `src/lib/actions/`:

```typescript
// src/lib/actions/characters.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { validateFormData, CharacterFormSchema } from "@/lib/forms";

export async function createCharacter(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validation = validateFormData(CharacterFormSchema, {
    name: formData.get("name"),
    characterType: formData.get("characterType"),
    // ...
  });

  if (!validation.success) {
    return { success: false, error: validation.errors };
  }

  const [character] = await db
    .insert(characters)
    .values(validation.data)
    .returning();

  revalidatePath("/campaigns/[id]/characters");
  return { success: true, data: character };
}
```

### Query Functions

Read operations use query functions in `src/lib/db/queries.ts`:

```typescript
// src/lib/db/queries.ts
export async function getCharacterById(id: number) {
  return db
    .select()
    .from(characters)
    .where(eq(characters.id, id))
    .get();
}

export async function getCampaignCharacters(campaignId: number) {
  return db
    .select()
    .from(characters)
    .where(eq(characters.campaignId, campaignId))
    .all();
}
```

---

## Component Architecture

### Component Types

1. **Server Components** (default): Fetch data, render HTML
2. **Client Components** (`"use client"`): Interactive features

### Naming Conventions

```
components/
├── character/
│   ├── CharacterCard.tsx       # Display card
│   ├── CharacterDetail.tsx     # Full detail view
│   ├── CharacterForm.tsx       # Create/edit form
│   ├── CharacterList.tsx       # List container
│   └── CharacterHeader.tsx     # Detail page header
```

### Form Pattern

Forms use React Hook Form with Zod validation:

```tsx
// Client Component
"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CharacterFormSchema } from "@/lib/forms/schemas";
import { createCharacter } from "@/lib/actions/characters";

export function CharacterForm() {
  const [state, formAction] = useActionState(createCharacter, { success: false });
  
  const form = useForm({
    resolver: zodResolver(CharacterFormSchema),
    defaultValues: { name: "", characterType: "pc" }
  });

  return (
    <form action={formAction}>
      <input {...form.register("name")} />
      <button type="submit">Create</button>
    </form>
  );
}
```

### UI Components

Primitive components in `src/components/ui/`:

| Component | Purpose |
|-----------|---------|
| `Button` | Action buttons with variants |
| `Card` | Content container |
| `Input` | Form input with label/error |
| `Modal` | Dialog overlay |
| `Tabs` | Tab navigation |
| `Badge` | Status/tag indicator |
| `Toast` | Notifications (Sonner) |

---

## API Design

### Route Handlers

API routes in `src/app/api/` follow REST conventions:

```
GET    /api/campaigns              # List campaigns
POST   /api/campaigns              # Create campaign
GET    /api/campaigns/[id]         # Get campaign
PUT    /api/campaigns/[id]         # Update campaign
DELETE /api/campaigns/[id]         # Delete campaign

# Nested resources
GET    /api/campaigns/[id]/characters
GET    /api/characters/[id]/diary
POST   /api/characters/[id]/diary
```

### Response Format

```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: "Error message" }

// List
{ success: true, data: [...], count: 42 }
```

---

## State Management

### Server State

- **React Server Components**: Fetch data at request time
- **Server Actions**: Mutate and revalidate with `revalidatePath()`

### Client State

- **React Hook Form**: Form state
- **URL Search Params**: Filter/pagination state
- **React Context**: Theme, user preferences (minimal)

### Caching Strategy

```typescript
// Revalidate specific paths after mutations
revalidatePath("/campaigns/[id]/characters");

// Revalidate by tag (for cross-cutting updates)
revalidateTag("characters");
```

---

## Deployment

### Docker Architecture

```
┌─────────────────────────────────────────────┐
│              Docker Host                     │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │         greedy_app container         │    │
│  │  ┌─────────────────────────────────┐ │    │
│  │  │    Next.js Standalone Server    │ │    │
│  │  │         (Port 3000)             │ │    │
│  │  └─────────────────────────────────┘ │    │
│  │                 │                     │    │
│  │    ┌────────────┴────────────┐       │    │
│  │    ▼                         ▼       │    │
│  │  /app/database           /app/public │    │
│  │  (SQLite)                /images     │    │
│  └───┬─────────────────────────┬────────┘    │
│      │                         │             │
│  ┌───▼───────────┐     ┌───────▼────────┐   │
│  │ ./database    │     │ ./public/images│   │
│  │ (host volume) │     │ (host volume)  │   │
│  └───────────────┘     └────────────────┘   │
└─────────────────────────────────────────────┘
```

### Multi-Stage Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner (production)
FROM node:20-alpine AS runner
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATA_DIR` | No | SQLite location (default: `./database`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL for links |
| `NODE_ENV` | No | `development` or `production` |

---

## Security Considerations

1. **Input Validation**: All inputs validated with Zod on server
2. **SQL Injection**: Prevented by Drizzle ORM parameterized queries
3. **XSS Prevention**: HTML sanitized with DOMPurify
4. **File Uploads**: Validated by type/size, stored outside webroot
5. **No Auth Yet**: Currently single-user; auth planned for future

---

## Performance Optimizations

1. **Server Components**: Reduced client JS bundle
2. **SQLite**: Fast embedded database, no network latency
3. **Streaming**: React Suspense for progressive rendering
4. **Image Optimization**: Next.js Image component
5. **Static Generation**: Campaign list can be statically generated

---

## Future Considerations

- [ ] Multi-user authentication (NextAuth.js)
- [ ] Real-time collaboration (WebSockets)
- [ ] PostgreSQL option for cloud deployment
- [ ] Mobile-optimized views
- [ ] Offline support (PWA)
- [ ] AI-assisted content generation

---

*Last updated: December 2024*
