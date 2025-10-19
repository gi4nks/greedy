import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { quests, adventures, campaigns, gameEditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import QuestForm from "@/components/quest/QuestForm";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";

interface EditAdventureQuestPageProps {
  params: Promise<{ id: string; adventureId: string; questId: string }>;
}

async function getQuest(questId: number) {
  const [quest] = await db
    .select()
    .from(quests)
    .where(eq(quests.id, questId))
    .limit(1);

  if (!quest) return null;

  // Get related adventure
  const [adventure] = quest.adventureId
    ? await db
        .select()
        .from(adventures)
        .where(eq(adventures.id, quest.adventureId))
        .limit(1)
    : [null];

  return {
    ...quest,
    adventure,
  };
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

  return campaign;
}

async function getAdventures(campaignId: number) {
  return await db
    .select()
    .from(adventures)
    .where(eq(adventures.campaignId, campaignId))
    .orderBy(adventures.startDate);
}

export default async function EditAdventureQuestPage({
  params,
}: EditAdventureQuestPageProps) {
  const resolvedParams = await params;
  const questId = parseInt(resolvedParams.questId);
  const adventureId = parseInt(resolvedParams.adventureId);
  const campaignId = parseInt(resolvedParams.id);

  const quest = await getQuest(questId);
  const campaign = await getCampaign(campaignId);

  if (!quest || !campaign) {
    notFound();
  }

  // Verify quest belongs to the specified adventure and campaign
  if (quest.adventureId !== adventureId) {
    notFound();
  }

  const [adventure] = await db
    .select()
    .from(adventures)
    .where(eq(adventures.id, adventureId))
    .limit(1);

  if (!adventure || adventure.campaignId !== campaignId) {
    notFound();
  }

  const campaignAdventures = await getAdventures(campaignId);

  return (
    <Suspense fallback={<EditQuestSkeleton />}>
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
          {
            label: "Quests",
            href: `/campaigns/${campaignId}/adventures/${adventureId}/quests`,
          },
          {
            label: quest.title,
            href: `/campaigns/${campaignId}/adventures/${adventureId}/quests/${questId}`,
          },
          { label: "Edit" },
        ]}
      />

      <QuestForm
        quest={quest}
        campaignId={campaignId}
        adventureId={adventureId}
        adventures={campaignAdventures}
        mode="edit"
      />
    </Suspense>
  );
}

function EditQuestSkeleton() {
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
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
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
export async function generateMetadata({
  params,
}: EditAdventureQuestPageProps) {
  const resolvedParams = await params;
  const quest = await getQuest(parseInt(resolvedParams.questId));

  return {
    title: quest ? `Edit ${quest.title}` : "Edit Quest",
    description: quest?.description || `Edit quest details`,
  };
}
