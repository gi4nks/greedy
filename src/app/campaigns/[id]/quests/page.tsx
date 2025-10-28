import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { quests, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { CampaignPageLayout } from "@/components/layout/CampaignPageLayout";
import { getCampaignWithEdition } from "@/lib/utils/campaign";
import { generateCampaignPageMetadata } from "@/lib/utils/metadata";
import { QuestsList } from "@/components/quests/QuestsList";

interface CampaignQuestsPageProps {
  params: Promise<{ id: string }>;
}

async function getQuestsForCampaign(campaignId: number) {
  const questsList = await db
    .select({
      id: quests.id,
      adventureId: quests.adventureId,
      title: quests.title,
      description: quests.description,
      status: quests.status,
      priority: quests.priority,
      type: quests.type,
      dueDate: quests.dueDate,
      assignedTo: quests.assignedTo,
      createdAt: quests.createdAt,
      adventureTitle: adventures.title,
    })
    .from(quests)
    .innerJoin(adventures, eq(quests.adventureId, adventures.id))
    .where(eq(adventures.campaignId, campaignId))
    .orderBy(quests.createdAt);

  return questsList;
}

export default async function CampaignQuestsPage({
  params,
}: CampaignQuestsPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);

  const campaign = await getCampaignWithEdition(campaignId);

  if (!campaign) {
    notFound();
  }

  const questsList = await getQuestsForCampaign(campaignId);

  return (
    <CampaignPageLayout
      campaign={campaign}
      title="Quests"
      description="Manage campaign quests and story objectives"
      sectionItems={[{ label: "Quests" }]}
      createButton={{
        href: `/campaigns/${campaignId}/adventures`,
        label: "Create Quest",
        icon: <Plus className="w-4 h-4" />,
      }}
    >
      <Suspense fallback={<QuestsListSkeleton />}>
        <QuestsList quests={questsList} campaignId={campaignId} />
      </Suspense>
    </CampaignPageLayout>
  );
}

function QuestsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="flex flex-col h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-0">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2 pt-4 mt-auto">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}