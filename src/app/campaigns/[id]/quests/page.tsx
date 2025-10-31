import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { quests, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { CampaignPageLayout } from "@/components/layout/CampaignPageLayout";
import { getCampaignWithEdition } from "@/lib/utils/campaign";
import { QuestsList } from "@/components/quests/QuestsList";

interface CampaignQuestsPageProps {
  params: Promise<{ id: string }>;
}

async function getQuestsForCampaign(campaignId: number) {
  // Get all adventure-scoped quests only (adventureId is NOT NULL)
  return await db
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
    >
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900">
              Quests are managed within adventures. Go to{" "}
              <Link href={`/campaigns/${campaignId}/adventures`} className="underline font-semibold">
                Adventures
              </Link>
              {" "}to create a new quest.
            </p>
          </div>
        </CardContent>
      </Card>

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
