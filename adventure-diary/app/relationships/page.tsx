import { Suspense } from 'react';
import { db } from '@/lib/db';
import { characters, campaigns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import RelationshipsList from '@/components/relationships/RelationshipsList';
import RelationshipFilters from '@/components/relationships/RelationshipFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';

// Force dynamic rendering to avoid database queries during build
export const dynamic = 'force-dynamic';

interface RelationshipsPageProps {
  searchParams: {
    npcId?: string;
    characterId?: string;
    type?: string;
  };
}

async function getRelationships(filters: {
  npcId?: string;
  characterId?: string;
  type?: string;
}) {
  // This will be replaced with actual API call
  // For now, return empty array since we're using client-side fetching
  return [];
}

async function getNpcs() {
  const npcs = await db
    .select({
      id: characters.id,
      name: characters.name,
      race: characters.race,
      classes: characters.classes,
    })
    .from(characters)
    .where(eq(characters.characterType, 'npc'))
    .orderBy(characters.name);

  return npcs;
}

async function getPlayerCharacters() {
  const pcs = await db
    .select({
      id: characters.id,
      name: characters.name,
      race: characters.race,
      classes: characters.classes,
    })
    .from(characters)
    .where(eq(characters.characterType, 'pc'))
    .orderBy(characters.name);

  return pcs;
}

export default async function RelationshipsPage({ searchParams }: RelationshipsPageProps) {
  const [relationships, npcs, playerCharacters] = await Promise.all([
    getRelationships(searchParams),
    getNpcs(),
    getPlayerCharacters(),
  ]);

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        items={[
          { label: 'Relationships' }
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">NPC Relationships</h1>
            <p className="text-base-content/70">
              Manage relationships between NPCs and player characters
            </p>
          </div>
          <Link href="/relationships/create">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Relationship
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <RelationshipFilters
              npcs={npcs}
              playerCharacters={playerCharacters}
              currentFilters={searchParams}
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <Suspense fallback={<RelationshipsListSkeleton />}>
            <RelationshipsList
              initialRelationships={relationships}
              filters={searchParams}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function RelationshipsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="text-right">
                <Skeleton className="h-6 w-16 mb-2" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata() {
  return {
    title: 'NPC Relationships | Adventure Diary',
    description: 'Manage relationships between NPCs and player characters in your campaigns',
  };
}