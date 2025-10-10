"use client";

import Link from 'next/link';
import { useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { deleteCharacterAction } from '@/lib/actions/characters';

interface CharactersListProps {
  characters: any[];
  campaignId: number;
}

export function CharactersList({ characters, campaignId }: CharactersListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (characterId: number) => {
    if (confirm('Are you sure you want to delete this character?')) {
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append('id', characterId.toString());
          await deleteCharacterAction(formData);
        } catch (error) {
          console.error('Failed to delete character:', error);
          alert('Failed to delete character');
        }
      });
    }
  };

  if (characters.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <Users className="w-16 h-16 mx-auto text-base-content/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No characters yet</h3>
          <p className="text-base-content/70 mb-4">
            Create your first character to get started.
          </p>
          <Link href={`/campaigns/${campaignId}/characters/create`}>
            <Button size="sm">
              <Users className="w-4 h-4 mr-2" />
              Create First Character
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {characters.map((character) => {
        // Parse classes data for multiclass display
        let classesInfo = '';
        try {
          const classes = typeof character.classes === 'string'
            ? JSON.parse(character.classes)
            : character.classes;

          if (Array.isArray(classes) && classes.length > 0) {
            classesInfo = classes
              .map((c: { name: string; level: number }) => `${c.name} ${c.level}`)
              .join(' / ');
          }
        } catch {
          classesInfo = '';
        }

        return (
          <Card key={character.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{character.name}</CardTitle>
                    <p className="text-sm text-base-content/70">
                      {character.race && `${character.race} `}
                      {classesInfo}
                    </p>
                    {character.characterType && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {character.characterType === 'pc' ? 'Player Character' :
                         character.characterType === 'npc' ? 'NPC' :
                         character.characterType}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {character.description && (
                <p className="text-sm text-base-content/70 mb-3 line-clamp-3">
                  {character.description}
                </p>
              )}

              <div className="flex justify-end gap-2 mt-auto">
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
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleDelete(character.id)}
                  disabled={isPending}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}