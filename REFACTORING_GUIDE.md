# 🔧 Greedy - Detailed Refactoring Guide

## Phase 1: Critical Fixes (Priority Implementation)

---

## 1️⃣ MERGE RELATIONSHIP SYSTEMS

### The Problem

**File 1**: `src/lib/actions/relations.ts` (177 lines)
```typescript
export async function createRelationship(formData: FormData) { ... }
export async function updateRelationship(formData: FormData) { ... }
export async function deleteRelationship(id: number) { ... }

// Uses RelationSchema from src/lib/validation/schemas.ts
const parsed = RelationSchema.safeParse(normalized);
```

**File 2**: `src/lib/actions/relationships.ts` (302 lines)
```typescript
export async function getEntityRelationships(entityId, entityType) { ... }
export async function createRelationship(formData: FormData) { ... }
export async function updateRelationship(formData: FormData) { ... }

// Uses relationshipSchema (different casing!)
const parsed = relationshipSchema.safeParse(formData);
```

**Database**: Two separate tables
- `relations` - stores relationships
- Also queries `relations` in relationships.ts

### Impact Analysis

**Code Duplication**: ~350 lines
**API Confusion**: Which endpoint to use?
**Data Inconsistency Risk**: Different validation rules
**Developer Time Waste**: Looking for functionality in wrong file

### Solution: Merge into Single System

#### Step 1: Create Unified Schema
```typescript
// src/lib/validation/relationship.ts
import { z } from "zod";

export const RelationshipSchema = z.object({
  campaignId: z.number().int().positive(),
  sourceEntityType: z.string(),
  sourceEntityId: z.number().int().positive(),
  targetEntityType: z.string(),
  targetEntityId: z.number().int().positive(),
  relationType: z.string().min(1),
  description: z.string().optional(),
  bidirectional: z.boolean().default(false),
  // Metadata for relationship strength/trust/etc
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;
```

#### Step 2: Create Unified Service
```typescript
// src/lib/actions/relationships.ts (REPLACE BOTH FILES)
"use server";

import { db } from "@/lib/db";
import { relations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { RelationshipSchema } from "@/lib/validation/relationship";

// QUERYING
export async function getEntityRelationships(
  entityId: string,
  entityType: string,
  campaignId?: number
) {
  // Implementation: fetch and enrich relationships
}

export async function getRelationship(id: number) {
  // Implementation: fetch single relationship
}

// MUTATIONS
export async function createRelationship(formData: FormData) {
  // Implementation: validate and insert
}

export async function updateRelationship(formData: FormData) {
  // Implementation: validate and update
}

export async function deleteRelationship(id: number) {
  // Implementation: delete and revalidate
}

// HELPER: Enrich relationships with entity names
async function enrichRelationships(rawRelations: any[]) {
  // Fetch entity names and return enriched data
}
```

#### Step 3: Update Components & API Routes

**Before**:
```typescript
// components/relationships/RelationshipForm.tsx
import { createRelationship } from "@/lib/actions/relations";

// OR

import { createRelationship } from "@/lib/actions/relationships";
```

**After**:
```typescript
// components/relationships/RelationshipForm.tsx
import { createRelationship } from "@/lib/actions/relationships";
```

**API Routes**: Consolidate to single endpoint
```typescript
// REMOVE: src/app/api/relations/ folder
// KEEP: src/app/api/relationships/
```

#### Step 4: Files to Delete
1. `src/lib/actions/relations.ts`
2. `src/lib/validation/schemas.ts` (RelationSchema - move to relationship.ts)
3. `src/app/api/relations/` folder

#### Step 5: Files to Update
- `src/components/relationships/*` - Update imports
- `src/components/relations/*` - Rename to relationships, update imports
- `src/app/campaigns/[id]/relations/` - Rename to relationships
- `src/app/(global)/relationships/` - Update imports
- `src/components/ui/entity-relationships.tsx` - Update imports

### Verification Checklist
- [ ] New unified `relationships.ts` passes tests
- [ ] All imports updated across codebase
- [ ] No more `relations.ts` references
- [ ] API routes consolidated
- [ ] Component folder renamed to `relationships/`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in dev: `npm run dev`

---

## 2️⃣ SPLIT MONOLITHIC magicItems.ts

### The Problem

**File**: `src/lib/actions/magicItems.ts` (1,470 lines 😱)

Contains 15+ functions mixed together:
```typescript
// Queries (should be separate)
export async function getMagicItemsWithAssignments() { ... }  // 400 lines
export async function searchAssignableEntities() { ... }      // 180 lines
export async function getMagicItemById() { ... }

// Mutations (should be separate)
export async function createMagicItem() { ... }               // 20 lines
export async function updateMagicItem() { ... }
export async function deleteMagicItem() { ... }

// Assignments (should be separate)
export async function assignMagicItemToEntities() { ... }     // 90 lines
export async function unassignMagicItem() { ... }             // 150 lines

// Enrichment (should be separate)
export async function enrichEquipmentWithMagicItems() { ... } // 80 lines

// Server Actions (should be separate)
export async function createMagicItemAction() { ... }
export async function updateMagicItemAction() { ... }
export async function deleteMagicItemAction() { ... }

// Utilities (should be separate)
export async function getMagicItemNames() { ... }
```

### Solution: Split into 4 Focused Modules

#### Structure After Refactoring
```
src/lib/actions/magicItems/
├── index.ts                  # Exports main API
├── queries.ts                # GET operations (~300 lines)
├── mutations.ts              # CREATE, UPDATE, DELETE (~200 lines)
├── assignments.ts            # Assignment logic (~250 lines)
├── enrichment.ts             # Equipment enrichment (~100 lines)
└── types.ts                  # Shared types
```

#### Step 1: Create Directory Structure
```bash
mkdir -p src/lib/actions/magicItems
```

#### Step 2: Split Into Files

**File**: `src/lib/actions/magicItems/types.ts`
```typescript
// Shared types for magic items module
export type MagicItemSummary = { ... }
export type MagicItemWithAssignments = { ... }
export type AssignmentPayload = { ... }
```

**File**: `src/lib/actions/magicItems/queries.ts`
```typescript
"use server";

import { db } from "@/lib/db";
// ... imports

export async function getMagicItemsWithAssignments(filters?: Filters) {
  // ~300 lines - complex query logic
}

export async function getMagicItemById(id: number) {
  // ~30 lines
}

export async function searchAssignableEntities(query: string, campaignId: number) {
  // ~200 lines - complex search logic
}

export async function getMagicItemNames(): Promise<string[]> {
  // ~20 lines
}
```

**File**: `src/lib/actions/magicItems/mutations.ts`
```typescript
"use server";

import { db } from "@/lib/db";
import { MagicItemSchema } from "@/lib/validation/magicItem";
// ... imports

export async function createMagicItem(data: MagicItemInput): Promise<MagicItem> {
  // Validate, insert, return
}

export async function updateMagicItem(id: number, data: Partial<MagicItemInput>): Promise<MagicItem> {
  // Validate, update, return
}

export async function deleteMagicItem(itemId: number): Promise<void> {
  // Delete with cascade cleanup
}
```

**File**: `src/lib/actions/magicItems/assignments.ts`
```typescript
"use server";

import { db } from "@/lib/db";
import { magicItemAssignments } from "@/lib/db/schema";
// ... imports

export async function assignMagicItemToEntities(
  itemId: number,
  entities: EntityAssignment[],
  campaignId: number
): Promise<void> {
  // ~90 lines of assignment logic
}

export async function unassignMagicItem(assignmentId: number): Promise<void> {
  // ~150 lines of unassignment logic
}
```

**File**: `src/lib/actions/magicItems/enrichment.ts`
```typescript
"use server";

import { db } from "@/lib/db";
// ... imports

export async function enrichEquipmentWithMagicItems(equipment: any[], campaignId: number) {
  // ~100 lines of enrichment logic
  // Returns equipment with magic items details attached
}
```

**File**: `src/lib/actions/magicItems/index.ts`
```typescript
// Main export file for magicItems module

export * from './queries';
export * from './mutations';
export * from './assignments';
export * from './enrichment';
export * from './types';

// Import and re-export server actions
export { createMagicItemAction, updateMagicItemAction, deleteMagicItemAction } from './server-actions';
```

#### Step 3: Move Server Actions
Create: `src/lib/actions/magicItems/server-actions.ts` (if they're separate)

Or if they should be inline in mutations, add them there:
```typescript
// At end of mutations.ts

"use server"

export async function createMagicItemAction(formData: FormData) {
  // Wrapper for form submission
}

export async function updateMagicItemAction(formData: FormData) {
  // Wrapper for form submission
}

export async function deleteMagicItemAction(id: number) {
  // Wrapper for deletion
}
```

#### Step 4: Update All Imports

**Before**:
```typescript
import {
  getMagicItemsWithAssignments,
  createMagicItem,
  assignMagicItemToEntities,
  enrichEquipmentWithMagicItems,
} from "@/lib/actions/magicItems";
```

**After** (same import works with index.ts):
```typescript
import {
  getMagicItemsWithAssignments,
  createMagicItem,
  assignMagicItemToEntities,
  enrichEquipmentWithMagicItems,
} from "@/lib/actions/magicItems";
```

**Or more specific**:
```typescript
import { getMagicItemsWithAssignments } from "@/lib/actions/magicItems/queries";
import { createMagicItem } from "@/lib/actions/magicItems/mutations";
```

#### Step 5: Delete Original File
```bash
rm src/lib/actions/magicItems.ts
```

### Benefits
- ✅ Each file ~250-400 lines (readable)
- ✅ Clear separation of concerns
- ✅ Easier to test individually
- ✅ Easier to find functionality
- ✅ Reduced cognitive load

### Verification
- [ ] All 15+ functions split into appropriate files
- [ ] `index.ts` exports all public functions
- [ ] All imports updated across codebase
- [ ] No broken imports (check components)
- [ ] Tests (if any) still pass
- [ ] Build succeeds
- [ ] No console errors in dev

---

## 3️⃣ STANDARDIZE FORM HANDLING

### The Problem

**Pattern 1** (Correct - 12 instances):
```typescript
"use client";
const [state, formAction] = useActionState(createCampaign, null);

return (
  <form action={formAction}>
    <input name="title" />
    <button type="submit">Save</button>
  </form>
);
```

**Pattern 2** (Mixed):
```typescript
const handleSubmit = async (e: FormEvent) => {
  const formData = new FormData(e.currentTarget);
  const result = await createCampaign(formData);
};
```

**Pattern 3** (Incorrect):
```typescript
const [title, setTitle] = useState("");
const handleChange = (e) => setTitle(e.target.value);
const handleSubmit = () => { ... };
```

### Solution: Create Standard useServerForm Hook

#### Step 1: Create Hook
```typescript
// src/lib/hooks/useServerForm.ts

import { useActionState } from "react";
import { useCallback } from "react";

interface UseServerFormOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export function useServerForm<T>(
  action: (formData: FormData) => Promise<any>,
  options?: UseServerFormOptions<T>
) {
  const [state, formAction] = useActionState(action, null);

  // State indicator helpers
  const isPending = state?.pending ?? false;
  const isError = state?.success === false;
  const isSuccess = state?.success === true;

  // Call callbacks on success/error
  useCallback(() => {
    if (isSuccess && options?.onSuccess) {
      options.onSuccess(state.data);
    }
    if (isError && options?.onError) {
      options.onError(state.error);
    }
  }, [isSuccess, isError, state, options]);

  return {
    formAction,
    state,
    isPending,
    isError,
    isSuccess,
    error: state?.error,
  };
}
```

#### Step 2: Create Error Component
```typescript
// src/components/ui/form-error.tsx

interface FormErrorProps {
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export function FormError({ message, fieldErrors }: FormErrorProps) {
  if (!message && !fieldErrors) return null;

  return (
    <div className="alert alert-error">
      {message && <p>{message}</p>}
      {fieldErrors && (
        <ul>
          {Object.entries(fieldErrors).map(([field, errors]) => (
            <li key={field}>{errors.join(", ")}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

#### Step 3: Create Form Wrapper Component
```typescript
// src/components/ui/server-form.tsx

interface ServerFormProps {
  action: (formData: FormData) => Promise<any>;
  children: React.ReactNode;
  onSuccess?: () => void;
  className?: string;
}

export function ServerForm({
  action,
  children,
  onSuccess,
  className,
}: ServerFormProps) {
  const { formAction, isPending, error } = useServerForm(action, {
    onSuccess,
  });

  return (
    <form action={formAction} className={className}>
      {error && <FormError message={error} />}
      {children}
    </form>
  );
}
```

#### Step 4: Update All Forms

**Before**:
```typescript
// CampaignForm.tsx (Original Pattern 1 - Good)
const [state, formAction] = useActionState(createCampaign, null);

return (
  <form action={formAction}>
    <input name="title" />
    {state?.error && <p>{state.error}</p>}
    <button type="submit">Save</button>
  </form>
);
```

**After** (Using new hook):
```typescript
// CampaignForm.tsx (Standardized)
const { formAction, isPending, error } = useServerForm(createCampaign);

return (
  <ServerForm action={createCampaign}>
    <input name="title" disabled={isPending} />
    <button type="submit" disabled={isPending}>
      {isPending ? "Saving..." : "Save"}
    </button>
  </ServerForm>
);
```

### Forms to Update (12 components)
1. CampaignForm.tsx ✅ Already correct
2. CharacterForm.tsx
3. AdventureForm.tsx
4. LocationForm.tsx
5. QuestForm.tsx
6. SessionForm.tsx
7. MagicItemForm.tsx
8. RelationshipForm.tsx
9. Others... (check all 84 components)

### Verification
- [ ] Hook created and exported
- [ ] Error component created
- [ ] Form wrapper component created
- [ ] All 12+ forms updated
- [ ] No regression in functionality
- [ ] Error handling consistent
- [ ] Loading states work correctly
- [ ] Build succeeds

---

## 4️⃣ CONSOLIDATE API ENDPOINTS

### The Problem

5 endpoints marked as "DEPRECATED":

```typescript
// src/app/api/campaigns/route.ts
export async function POST(request: NextRequest) {
  // DEPRECATED: Use Server Action createCampaign instead
  // Kept for backward compatibility
}

// Similar in: characters, locations, adventures, quests
```

### Solution: Gradual Migration Plan

#### Phase 1: Add Migration Guide
Create: `docs/API_MIGRATION.md`
```markdown
# API Migration Guide

## Deprecated Endpoints

### POST /api/campaigns (DEPRECATED)
**Use Instead**: Server action `createCampaign()`

**Migration Timeline**:
- v1.x: Active with deprecation notice
- v2.0: Removed

**Example**:
```typescript
// Before (API call)
const res = await fetch('/api/campaigns', { method: 'POST', body: ... });

// After (Server Action)
"use server"
const result = await createCampaign(formData);
```
```

#### Phase 2: Mark Endpoints with Headers
```typescript
export async function POST(request: NextRequest) {
  const response = NextResponse.json(...);
  response.headers.set(
    "X-Deprecated",
    "This endpoint is deprecated. Use Server Action instead. See /docs/API_MIGRATION"
  );
  return response;
}
```

#### Phase 3: Track Usage
Add analytics to see if anyone still uses these endpoints

#### Phase 4: Remove (v2.0+)
Delete the 5 deprecated POST endpoints

### Deprecation Timeline
- **Now**: Document all deprecated endpoints
- **v1.2**: Add deprecation headers
- **v1.5**: Show deprecation warnings in console
- **v2.0**: Remove entirely

---

## Phase 2: Enhancement (Following Phase 1)

### 5️⃣ Complete Authentication System
**Timeline**: Week 2  
**Effort**: 2-3 days

```typescript
// Option A: Implement next-auth fully
// Option B: Remove auth if not needed

// Recommendation: Remove if single-user
// If multi-user planned, implement:
├── Login page
├── Signup page
├── Protected routes
├── User sessions
└── Logout functionality
```

### 6️⃣ Add Testing Infrastructure
**Timeline**: Week 2  
**Effort**: 2-3 days

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react
npm install --save-dev @playwright/test
```

Create test structure:
```
src/__tests__/
├── lib/
│   ├── actions/
│   │   ├── campaigns.test.ts
│   │   └── characters.test.ts
│   └── utils/
│       └── ...
├── components/
│   ├── __snapshots__/
│   └── ...
└── integration/
    └── forms.test.ts
```

### 7️⃣ Complete Export Feature
**Timeline**: Week 2  
**Effort**: 1-2 days

```typescript
// src/lib/services/export.ts
export async function exportCampaignAsJSON(campaignId: number) {
  // Full campaign export with all entities
}

export async function exportCampaignAsMarkdown(campaignId: number) {
  // Markdown export for printing/sharing
}

export async function exportCampaignAsCSV(campaignId: number) {
  // CSV for spreadsheet compatibility
}
```

---

## Phase 3: Optimization

### 8️⃣ Create Tailwind Token System
**Timeline**: Week 3  
**Effort**: 1 day

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      spacing: {
        xs: '0.25rem',  // 4px
        sm: '0.5rem',   // 8px
        md: '1rem',     // 16px
        lg: '1.5rem',   // 24px
        xl: '2rem',     // 32px
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
      },
      colors: {
        // Use semantic names instead of arbitrary values
        accent: 'hsl(var(--accent) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
        error: 'hsl(var(--error) / <alpha-value>)',
      },
    },
  },
};
```

### 9️⃣ Performance Audit
**Timeline**: Week 3  
**Effort**: 1-2 days

```bash
# Analyze bundle size
npm run build
npx webpack-bundle-analyzer

# Performance testing
npx lighthouse-cli
```

---

## Implementation Checklist

### Phase 1: Critical (Weeks 1-2)
- [ ] **Item 1: Merge relationships** (2-3 days)
  - [ ] Create unified schema
  - [ ] Create unified service
  - [ ] Update all components
  - [ ] Update API routes
  - [ ] Delete old files
  - [ ] Test & verify build

- [ ] **Item 2: Split magicItems** (2-3 days)
  - [ ] Create directory structure
  - [ ] Split into 4 modules
  - [ ] Create index exports
  - [ ] Update all imports (40+ files)
  - [ ] Delete original file
  - [ ] Test & verify build

- [ ] **Item 3: Standardize forms** (1-2 days)
  - [ ] Create useServerForm hook
  - [ ] Create FormError component
  - [ ] Create ServerForm wrapper
  - [ ] Update 12+ components
  - [ ] Test form submissions
  - [ ] Verify error handling

- [ ] **Item 4: Deprecate API endpoints** (1 day)
  - [ ] Create migration guide
  - [ ] Add deprecation headers
  - [ ] Document all changes
  - [ ] Plan removal timeline

### Phase 2: Enhancement (Weeks 2-3)
- [ ] Complete authentication
- [ ] Add test infrastructure
- [ ] Complete export feature
- [ ] Update documentation

### Phase 3: Optimization (Week 4)
- [ ] Create Tailwind token system
- [ ] Performance optimization
- [ ] Bundle analysis
- [ ] Final review

---

## Testing Strategy

### Unit Tests
```typescript
// Test relationship service
describe('Relationship Service', () => {
  test('createRelationship validates input');
  test('getEntityRelationships enriches data');
  test('deleteRelationship cascades correctly');
});

// Test magic items splitting
describe('Magic Items Queries', () => {
  test('getMagicItemsWithAssignments returns enriched data');
});

describe('Magic Items Mutations', () => {
  test('createMagicItem validates schema');
});
```

### Integration Tests
```typescript
// Test form submission end-to-end
describe('Campaign Form', () => {
  test('User can create campaign via form');
  test('Errors display correctly');
  test('Success redirects to campaign detail');
});
```

### E2E Tests
```typescript
// Test complete workflows
describe('Campaign Workflow', () => {
  test('User creates campaign → creates character → assigns magic item');
});
```

---

## Success Criteria

### Phase 1: Critical Fixes ✅
- [ ] All high-priority items completed
- [ ] No console errors
- [ ] All tests pass (or none fail)
- [ ] Build succeeds
- [ ] All components still functional

### Phase 2: Enhancement ✅
- [ ] Authentication complete or removed
- [ ] Test infrastructure operational
- [ ] Export features working
- [ ] Documentation updated

### Phase 3: Optimization ✅
- [ ] Tailwind tokens in use across codebase
- [ ] No performance regressions
- [ ] Bundle size analyzed and optimized

---

## Questions Before Starting

1. **Relations Table**: Is it still needed after merging with relationships?
2. **magicItems.ts Testing**: Should tests be created first or after split?
3. **Form Pattern**: Should we keep old patterns for backward compat or migrate all?
4. **Authentication**: Is login feature needed or should it be removed?
5. **Export Feature**: What formats should be supported?

---

**Created**: October 30, 2025  
**Status**: Ready for implementation  
**Estimated Total Effort**: 2-3 weeks (with all 3 phases)
