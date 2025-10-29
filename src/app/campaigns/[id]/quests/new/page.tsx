import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import QuestForm from "@/components/quest/QuestForm";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

interface CreateQuestPageProps {
  params: Promise<{ id: string }>;
}

async function getCampaign(campaignId: number) {
  const [campaign] = await db
    .select({
      id: campaigns.id,
      title: campaigns.title,
    })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  return campaign;
}

export default async function CreateQuestPage({
  params,
}: CreateQuestPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);

  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6 md:p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={campaign.title}
        sectionItems={[
          {
            label: "Quests",
            href: `/campaigns/${campaignId}/quests`,
          },
          { label: "Create Quest" },
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Create Quest</h1>
            <p className="text-base-content/70">
              Create a new quest for {campaign.title}
            </p>
          </div>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quest Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <QuestForm
            campaignId={campaignId}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Generate metadata
export async function generateMetadata({ params }: CreateQuestPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const campaign = await getCampaign(campaignId);

  return {
    title: campaign ? `Create Quest | ${campaign.title}` : "Create Quest",
    description: "Create a new quest for your campaign",
  };
}
