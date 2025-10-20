import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { adventures, campaigns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import QuestForm from "@/components/quest/QuestForm";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

interface CreateQuestPageProps {
  params: Promise<{ id: string; adventureId: string }>;
}

async function getAdventure(campaignId: number, adventureId: number) {
  const [adventure] = await db
    .select()
    .from(adventures)
    .where(eq(adventures.id, adventureId))
    .limit(1);

  if (!adventure || adventure.campaignId !== campaignId) return null;
  return adventure;
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
  const adventureId = parseInt(resolvedParams.adventureId);

  const campaign = await getCampaign(campaignId);
  const adventure = await getAdventure(campaignId, adventureId);

  if (!campaign || !adventure) {
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
            label: "Adventures",
            href: `/campaigns/${campaignId}/adventures`,
          },
          {
            label: adventure.title,
            href: `/campaigns/${campaignId}/adventures/${adventureId}`,
          },
          {
            label: "Quests",
            href: `/campaigns/${campaignId}/adventures/${adventureId}/quests`,
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
              Create a new quest for {adventure.title}
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
            adventureId={adventureId}
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
  const adventureId = parseInt(resolvedParams.adventureId);
  const adventure = await getAdventure(campaignId, adventureId);

  return {
    title: adventure ? `Create Quest | ${adventure.title}` : "Create Quest",
    description: "Create a new quest for your adventure",
  };
}
