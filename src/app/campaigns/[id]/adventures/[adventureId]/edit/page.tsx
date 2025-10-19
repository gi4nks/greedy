import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { adventures, campaigns, gameEditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import AdventureForm from "@/components/adventure/AdventureForm";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";

interface EditAdventurePageProps {
  params: Promise<{ id: string; adventureId: string }>;
}

async function getAdventure(adventureId: number) {
  const [adventure] = await db
    .select()
    .from(adventures)
    .where(eq(adventures.id, adventureId))
    .limit(1);

  if (!adventure) return null;

  return adventure;
}

async function getCampaign(campaignId: number) {
  const [campaign] = await db
    .select({
      id: campaigns.id,
      gameEditionId: campaigns.gameEditionId,
      gameEditionName: gameEditions.name,
      gameEditionVersion: gameEditions.version,
      title: campaigns.title,
      description: campaigns.description,
      status: campaigns.status,
      startDate: campaigns.startDate,
      endDate: campaigns.endDate,
      tags: campaigns.tags,
      createdAt: campaigns.createdAt,
      updatedAt: campaigns.updatedAt,
    })
    .from(campaigns)
    .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) return null;

  return campaign;
}

export default async function EditAdventurePage({
  params,
}: EditAdventurePageProps) {
  const resolvedParams = await params;
  const adventureId = parseInt(resolvedParams.adventureId);
  const campaignId = parseInt(resolvedParams.id);

  const adventure = await getAdventure(adventureId);
  const campaign = await getCampaign(campaignId);

  if (!adventure || !campaign || adventure.campaignId !== campaignId) {
    notFound();
  }

  return (
    <Suspense fallback={<EditAdventureSkeleton />}>
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={campaign.title}
        sectionItems={[
          { label: "Adventures", href: `/campaigns/${campaignId}/adventures` },
          {
            label: adventure.title,
            href: `/campaigns/${campaignId}/adventures/${adventureId}`,
          },
          { label: "Edit" },
        ]}
      />

      <AdventureForm
        adventure={adventure}
        campaignId={campaignId}
        mode="edit"
      />
    </Suspense>
  );
}

function EditAdventureSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 md:p-6 max-w-4xl">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-6 w-48" />
      </div>

      <div className="space-y-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EditAdventurePageProps) {
  const resolvedParams = await params;
  const adventure = await getAdventure(parseInt(resolvedParams.adventureId));

  return {
    title: adventure ? `Edit ${adventure.title}` : "Edit Adventure",
    description:
      adventure?.description || `Edit ${adventure?.title} adventure details`,
  };
}
