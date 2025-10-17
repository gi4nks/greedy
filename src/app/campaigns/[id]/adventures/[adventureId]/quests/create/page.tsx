import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { adventures, campaigns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import QuestForm from "@/components/quest/QuestForm";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";

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
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
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
          <h1 className="text-2xl font-bold mb-2">Create Quest</h1>
          <p className="text-base-content/70">
            Create a new quest for {adventure.title}
          </p>
        </div>

        <QuestForm
          adventureId={adventureId}
          campaignId={campaignId}
          mode="create"
        />
      </div>
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
