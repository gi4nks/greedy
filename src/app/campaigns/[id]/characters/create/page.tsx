import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { campaigns, gameEditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import CharacterForm from "@/components/character/CharacterForm";
import { Card, CardContent } from "@/components/ui/card";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { createCharacter } from "@/lib/actions/characters";

interface CreateCharacterPageProps {
  params: Promise<{ id: string }>;
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

export default async function CreateCharacterPage({
  params,
}: CreateCharacterPageProps) {
  const { id } = await params;
  const campaignId = parseInt(id);
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
          { label: "Characters", href: `/campaigns/${campaignId}/characters` },
          { label: "Create Character" },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Character</h1>
        <p className="text-base-content/70 mt-2">
          Add a new character to your campaign.
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="p-6">
          <CharacterForm 
            campaignId={campaignId} 
            mode="create" 
            action={createCharacter}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CreateCharacterPageProps) {
  const { id } = await params;
  const campaign = await getCampaign(parseInt(id));

  return {
    title: campaign
      ? `Create Character | ${campaign.title}`
      : "Create Character",
    description: "Create a new character for your D&D campaign",
  };
}
