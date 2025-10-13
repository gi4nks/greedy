import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { CharactersList } from "@/components/characters/CharactersList";
import { CampaignPageLayout } from "@/components/layout/CampaignPageLayout";
import { getCampaignWithEdition } from "@/lib/utils/campaign";
import { generateCampaignPageMetadata } from "@/lib/utils/metadata";

interface CharactersPageProps {
  params: Promise<{ id: string }>;
}

async function getCharacters(campaignId: number) {
  const characterList = await db
    .select()
    .from(characters)
    .where(eq(characters.campaignId, campaignId))
    .orderBy(characters.name);

  return characterList;
}

export default async function CharactersPage({ params }: CharactersPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);

  const campaign = await getCampaignWithEdition(campaignId);

  if (!campaign) {
    notFound();
  }

  const characters = await getCharacters(campaignId);

  return (
    <CampaignPageLayout
      campaign={campaign}
      title="Characters"
      description="Manage your player characters and NPCs"
      sectionItems={[{ label: "Characters" }]}
      createButton={{
        href: `/campaigns/${campaignId}/characters/create`,
        label: "Create Character",
        icon: <Plus className="w-4 h-4" />,
      }}
    >
      <CharactersList characters={characters} campaignId={campaignId} />
    </CampaignPageLayout>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CharactersPageProps) {
  const resolvedParams = await params;
  const campaign = await getCampaignWithEdition(parseInt(resolvedParams.id));

  return generateCampaignPageMetadata(
    campaign,
    "Characters",
    "Manage your D&D campaign characters",
  );
}
