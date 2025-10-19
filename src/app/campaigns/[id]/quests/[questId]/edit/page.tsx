import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { quests, adventures, campaigns, gameEditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import QuestForm from "@/components/quest/QuestForm";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

interface EditQuestPageProps {
  params: Promise<{ id: string; questId: string }>;
}

async function getQuest(questId: number) {
  const [quest] = await db
    .select()
    .from(quests)
    .where(eq(quests.id, questId))
    .limit(1);

  if (!quest) return null;

  // Get related adventure if exists
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

export default async function EditQuestPage({ params }: EditQuestPageProps) {
  const resolvedParams = await params;
  const questId = parseInt(resolvedParams.questId);
  const campaignId = parseInt(resolvedParams.id);

  const quest = await getQuest(questId);
  const campaign = await getCampaign(campaignId);

  if (!quest || !campaign) {
    notFound();
  }

  // Verify quest belongs to this campaign via adventure relationship
  if (quest.adventureId) {
    const [adventure] = await db
      .select()
      .from(adventures)
      .where(eq(adventures.id, quest.adventureId))
      .limit(1);

    if (!adventure || adventure.campaignId !== campaignId) {
      notFound();
    }
  }

  const campaignAdventures = await getAdventures(campaignId);

  return (
    <Suspense fallback={<EditQuestSkeleton />}>
      <div className="container mx-auto px-4 py-6 md:p-6 max-w-5xl">
        <DynamicBreadcrumb
          campaignId={campaignId}
          sectionItems={[
            { label: "Quests", href: `/campaigns/${campaignId}/quests` },
            {
              label: quest.title,
              href: `/campaigns/${campaignId}/quests/${questId}`,
            },
            { label: "Edit" },
          ]}
        />

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <ScrollText className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Edit Quest</h1>
              <p className="text-base-content/70">Update quest details</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <QuestForm
              quest={quest}
              campaignId={campaignId}
              adventures={campaignAdventures}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}

function EditQuestSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 md:p-6 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton h-8 w-8 rounded-lg"></div>
          <div className="skeleton h-6 w-48"></div>
        </div>
        <div className="skeleton h-8 w-64 mb-2"></div>
        <div className="skeleton h-4 w-96"></div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-10 w-full mb-4"></div>
            <div className="skeleton h-20 w-full mb-4"></div>
            <div className="skeleton h-10 w-full mb-4"></div>
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="skeleton h-10 w-full"></div>
              <div className="skeleton h-10 w-full"></div>
              <div className="skeleton h-10 w-full"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="skeleton h-10 w-full"></div>
              <div className="skeleton h-10 w-full"></div>
            </div>
            <div className="skeleton h-20 w-full mb-4"></div>
            <div className="flex gap-4">
              <div className="skeleton h-10 w-24"></div>
              <div className="skeleton h-10 w-20"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EditQuestPageProps) {
  const resolvedParams = await params;
  const quest = await getQuest(parseInt(resolvedParams.questId));

  return {
    title: quest ? `Edit ${quest.title}` : "Edit Quest",
    description: quest?.description || `Edit quest details`,
  };
}
