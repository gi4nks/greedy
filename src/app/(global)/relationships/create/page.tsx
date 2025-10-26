import { Suspense } from "react";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import RelationshipForm from "@/components/relationships/RelationshipForm";
import { Skeleton } from "@/components/ui/skeleton";

// Force dynamic rendering to avoid database queries during build
export const dynamic = "force-dynamic";

async function getNpcs() {
  const npcs = await db
    .select({
      id: characters.id,
      name: characters.name,
      race: characters.race,
      classes: characters.classes,
    })
    .from(characters)
    .where(eq(characters.characterType, "npc"))
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
    .where(eq(characters.characterType, "pc"))
    .orderBy(characters.name);

  return pcs;
}

export default async function CreateRelationshipPage() {
  const [npcs, playerCharacters] = await Promise.all([
    getNpcs(),
    getPlayerCharacters(),
  ]);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Relationship</h1>
        <p className="text-base-content/70">
          Define a relationship between an NPC and a player character
        </p>
      </div>

      <Suspense fallback={<RelationshipFormSkeleton />}>
        <RelationshipForm
          npcs={npcs}
          playerCharacters={playerCharacters}
          mode="create"
        />
      </Suspense>
    </div>
  );
}

function RelationshipFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata() {
  return {
    title: "Create Relationship | Adventure Diary",
    description:
      "Create a new relationship between an NPC and player character",
  };
}
