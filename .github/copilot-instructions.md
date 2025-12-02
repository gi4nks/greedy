# Greedy - Copilot Instructions

## Project Overview

Greedy is a full-stack D&D Campaign Manager built with Next.js 15 (App Router), React 19, TypeScript, and SQLite (via Drizzle ORM). It helps Dungeon Masters organize campaigns, adventures, characters, sessions, quests, locations, magic items, and relationships.

## Tech Stack

- **Framework**: Next.js 15.5.4 with App Router
- **React**: 19.1.0 (Server Components + Client Components)
- **Database**: SQLite with better-sqlite3 and Drizzle ORM
- **Styling**: TailwindCSS 4 + DaisyUI 5
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (global)/          # Cross-campaign routes
│   ├── api/               # API route handlers
│   └── campaigns/[id]/    # Campaign-scoped routes
├── components/            # React components by feature
│   ├── ui/               # Primitive UI components
│   └── [feature]/        # Feature-specific components
└── lib/
    ├── actions/          # Server Actions (mutations)
    ├── db/               # Drizzle schema & queries
    ├── forms/            # Zod schemas & validation
    └── hooks/            # Custom React hooks
```

## Key Conventions

### Server Actions
- All mutations use Server Actions in `src/lib/actions/`
- Actions return `{ success: boolean, error?: string, data?: T }`
- Always call `revalidatePath()` after mutations
- Use Zod validation with `validateFormData()` helper

### Components
- Default to Server Components; use `"use client"` only when needed
- Name pattern: `[Entity]Card.tsx`, `[Entity]Form.tsx`, `[Entity]Detail.tsx`, `[Entity]List.tsx`
- Forms use `useActionState` hook with Server Actions

### Database
- Schema defined in `src/lib/db/schema.ts`
- Queries in `src/lib/db/queries.ts`
- Use Drizzle ORM syntax, not raw SQL
- JSON columns use `{ mode: "json" }` in schema

### Styling
- Use TailwindCSS utility classes
- DaisyUI components: `btn`, `card`, `input`, `badge`, `tabs`, `modal`
- Prefer semantic DaisyUI colors: `btn-primary`, `text-base-content`

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run migrate      # Apply Drizzle migrations
npm run init-db      # Seed baseline data
npm run lint         # ESLint check
```

## Code Patterns

### Creating a Server Action
```typescript
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { validateFormData } from "@/lib/forms/validation";

export async function createEntity(prevState: ActionState, formData: FormData) {
  const validation = validateFormData(EntitySchema, { /* fields */ });
  if (!validation.success) return { success: false, error: validation.errors };
  
  const [entity] = await db.insert(table).values(validation.data).returning();
  revalidatePath("/path");
  return { success: true, data: entity };
}
```

### Creating a Form Component
```tsx
"use client";
import { useActionState } from "react";
import { createEntity } from "@/lib/actions/entities";

export function EntityForm() {
  const [state, formAction] = useActionState(createEntity, { success: false });
  return <form action={formAction}>...</form>;
}
```

## Important Notes

- husky/lint-staged is broken - use `--no-verify` for commits
- Database file is at `database/campaign.db` (gitignored)
- Images stored in `public/images/` (gitignored)
- 5etools data in `public/5etools/` (gitignored, external data)

## Entities

| Entity | Table | Key Fields |
|--------|-------|------------|
| Campaign | `campaigns` | title, game_edition_id, status |
| Adventure | `adventures` | title, campaign_id |
| Session | `sessions` | title, date, text, narrative |
| Character | `characters` | name, type (pc/npc), stats |
| Location | `locations` | name, campaign_id |
| Quest | `quests` | title, status, priority |
| MagicItem | `magic_items` | name, rarity, type |
| Relation | `relations` | source, target, type |
