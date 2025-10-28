import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { campaigns, quests, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle } from "lucide-react";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import QuestCard from "@/components/quests/QuestCard";

interface AdventureQuestsPageProps {
  params: Promise<{ id: string; adventureId: string }>;
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

async function getAdventure(campaignId: number, adventureId: number) {
  const [adventure] = await db
    .select({
      id: adventures.id,
      campaignId: adventures.campaignId,
      title: adventures.title,
      description: adventures.description,
      status: adventures.status,
      startDate: adventures.startDate,
      endDate: adventures.endDate,
    })
    .from(adventures)
    .where(eq(adventures.id, adventureId))
    .limit(1);

  if (!adventure || adventure.campaignId !== campaignId) return null;

  return adventure;
}

async function getQuestsForAdventure(adventureId: number) {
  const questsList = await db
    .select()
    .from(quests)
    .where(eq(quests.adventureId, adventureId))
    .orderBy(quests.createdAt);

  return questsList;
}

export default async function AdventureQuestsPage({
  params,
}: AdventureQuestsPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const adventureId = parseInt(resolvedParams.adventureId);

  const campaign = await getCampaign(campaignId);
  const adventure = await getAdventure(campaignId, adventureId);

  if (!campaign || !adventure) {
    notFound();
  }

  const questsList = await getQuestsForAdventure(adventureId);

  return (
    <div className="container mx-auto px-4 py-6 md:p-6">
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
          { label: "Quests" },
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Adventure Quests</h1>
            <p className="text-base-content/70">
              {adventure.title} • Manage quests and objectives for this
              adventure
            </p>
          </div>
          <Link
            href={`/campaigns/${campaignId}/adventures/${adventureId}/quests/create`}
          >
            <Button className="gap-2" variant="primary" size="sm">
              <Plus className="w-4 h-4" />
              Create Quest
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {questsList.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <CheckCircle className="w-12 h-12 mx-auto text-base-content/70" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Quests Yet</h3>
              <p className="text-base-content/70 mb-4">
                Start creating quests to track objectives and storylines for
                this adventure.
              </p>
              <Link
                href={`/campaigns/${campaignId}/adventures/${adventureId}/quests/create`}
              >
                <Button variant="primary" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Quest
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questsList.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                campaignId={campaignId}
                adventureId={adventureId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: AdventureQuestsPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const adventureId = parseInt(resolvedParams.adventureId);
  const adventure = await getAdventure(campaignId, adventureId);

  return {
    title: adventure ? `Quests | ${adventure.title}` : "Adventure Quests",
    description: adventure
      ? `Manage quests for ${adventure.title}`
      : "Manage adventure quests",
  };
}
