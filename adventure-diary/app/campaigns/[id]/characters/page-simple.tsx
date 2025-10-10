import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { campaigns, characters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface CharactersPageProps {
  params: { id: string };
}

async function getCampaign(campaignId: number) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  return campaign;
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
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  const characters = await getCharacters(campaignId);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Characters</h1>
            <p className="text-base-content/70">
              {campaign.title} • Manage your player characters and NPCs
            </p>
          </div>
          <Link href={`/campaigns/${campaignId}/characters/create`}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Character
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {characters.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No characters yet</h3>
            <p className="text-base-content/70 mb-4">
              Create your first character to get started.
            </p>
            <Link href={`/campaigns/${campaignId}/characters/create`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Character
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((character) => (
              <div key={character.id} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title">{character.name}</h3>
                  <p className="text-sm text-base-content/70">
                    {character.race} {Array.isArray(character.classes) && character.classes.length > 0 ? character.classes.join(', ') : 'Unknown Class'}
                  </p>
                  <p className="text-xs opacity-75 capitalize">
                    {character.characterType || 'Unknown Type'}
                  </p>
                  <div className="card-actions justify-end">
                    <Link href={`/campaigns/${campaignId}/characters/${character.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CharactersPageProps) {
  const resolvedParams = await params;
  const campaign = await getCampaign(parseInt(resolvedParams.id));

  return {
    title: campaign ? `${campaign.title} - Characters | Adventure Diary` : 'Characters Not Found',
    description: 'Manage your D&D campaign characters',
  };
}