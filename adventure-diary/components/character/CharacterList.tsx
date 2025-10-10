'use client';

import { Character, Adventure } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Users, Crown } from 'lucide-react';
import { formatDisplayDate } from '@/lib/utils/date';

interface CharacterListProps {
  characters: Character[];
  campaignId: number;
  adventures: Adventure[];
}

export default function CharacterList({ characters, campaignId, adventures }: CharacterListProps) {
  const getCharacterTypeIcon = (type: string | null) => {
    switch (type) {
      case 'pc':
        return <Crown className="w-4 h-4" />;
      case 'npc':
        return <Users className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getCharacterTypeColor = (type: string | null) => {
    switch (type) {
      case 'pc':
        return 'badge-primary';
      case 'npc':
        return 'badge-secondary';
      default:
        return 'badge-ghost';
    }
  };

  const getAdventureName = (adventureId: number | null) => {
    const adventure = adventures.find(a => a.id === adventureId);
    return adventure?.title || 'Unknown Adventure';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Characters ({characters.length})
        </h2>
        <Link href={`/campaigns/${campaignId}/characters/create`}>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Character
          </Button>
        </Link>
      </div>

      {characters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-base-content/60 mb-4" />
            <h3 className="text-lg font-medium mb-2">No characters yet</h3>
            <p className="text-base-content/70 text-center mb-4">
              Start building your campaign by adding player characters, NPCs, and monsters.
            </p>
            <Link href={`/campaigns/${campaignId}/characters/create`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Character
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {characters.map((character) => (
            <Card key={character.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{character.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getCharacterTypeColor(character.characterType)}>
                      {getCharacterTypeIcon(character.characterType)}
                      <span className="ml-1">{character.characterType?.toUpperCase() || 'UNKNOWN'}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col h-full">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        {Array.isArray(character.classes) && character.classes.length > 0 && (
                          <p className="text-base-content/70">
                            {character.race} {character.classes.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {character.description && (
                      <p className="text-sm text-base-content/80 line-clamp-2">
                        {character.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t mt-auto">
                    <div className="flex items-center gap-4 text-xs text-base-content/70">
                      {character.adventureId && (
                        <span className="flex items-center gap-1">
                          �� {getAdventureName(character.adventureId)}
                        </span>
                      )}
                      {character.createdAt && (
                        <span>
                          Created {formatDisplayDate(character.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/campaigns/${campaignId}/characters/${character.id}`}>
                        <Button variant="info" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link href={`/campaigns/${campaignId}/characters/${character.id}/edit`}>
                        <Button variant="primary" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
