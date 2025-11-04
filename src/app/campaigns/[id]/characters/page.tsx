import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { CharactersList } from "@/components/characters/CharactersList";
import { CampaignPageLayout } from "@/components/layout/CampaignPageLayout";
import { getCampaignWithEdition } from "@/lib/utils/campaign";
import { generateCampaignPageMetadata } from "@/lib/utils/metadata";
import { deleteCharacter } from "@/lib/actions/characters";

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

  // Sort characters so PCs appear first, then NPCs, maintaining alphabetical order within each group
  const sortedCharacters = characters.sort((a, b) => {
    // PCs (characterType === "pc") come first, then NPCs (characterType === "npc")
    const aIsPC = a.characterType === "pc";
    const bIsPC = b.characterType === "pc";

    if (aIsPC && !bIsPC) return -1;
    if (!aIsPC && bIsPC) return 1;

    // If both are the same type (both PC or both NPC), sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  // Create a wrapper function for character deletion
  const handleDeleteCharacter = async (characterId: number) => {
    "use server";
    await deleteCharacter(characterId);
  };

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
      <CharactersList 
        characters={sortedCharacters} 
        campaignId={campaignId} 
        onDeleteCharacter={handleDeleteCharacter}
      />
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
