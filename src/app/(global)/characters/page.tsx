import { Suspense } from "react";
import { db } from "../../../lib/db";
import { characters, adventures, campaigns } from "../../../lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import Link from "next/link";
import { Users, BookOpen, Edit, Trash2, View } from "lucide-react";
import DynamicBreadcrumb from "../../../components/ui/dynamic-breadcrumb";
import { CardSkeleton } from "../../../components/ui/skeleton";

// Force dynamic rendering
export const dynamic = "force-dynamic";

async function getCharacters() {
  const allCharacters = await db
    .select({
      id: characters.id,
      name: characters.name,
      race: characters.race,
      classes: characters.classes,
      characterType: characters.characterType,
      description: characters.description,
      createdAt: characters.createdAt,
      campaignId: characters.campaignId,
      adventureId: characters.adventureId,
      adventure: {
        id: adventures.id,
        title: adventures.title,
        campaignId: adventures.campaignId,
      },
      campaign: {
        id: campaigns.id,
        title: campaigns.title,
      },
    })
    .from(characters)
    .leftJoin(adventures, eq(characters.adventureId, adventures.id))
    .leftJoin(campaigns, eq(characters.campaignId, campaigns.id))
    .orderBy(desc(characters.createdAt));

  return allCharacters;
}

async function CharactersContent() {
  const charactersList = await getCharacters();

  return (
    <>
      {charactersList.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 mx-auto text-base-content/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No characters yet</h3>
            <p className="text-base-content/70 mb-6">
              Characters are created within adventures. Start by creating a
              campaign and adventure first.
            </p>
            <Link href="/campaigns">
              <Button size="sm" variant="warning" className="gap-2">
                <View className="w-4 h-4" />
                View Campaigns
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {charactersList.map((character) => (
            <Card
              key={character.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl">{character.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-base-content/70">
                      <BookOpen className="w-3 h-3" />
                      {character.campaign?.title} → {character.adventure?.title}
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          character.characterType === "pc" ? "info" : "warning"
                        }
                      >
                        {character.characterType === "pc"
                          ? "Player Character"
                          : "NPC"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex gap-4 text-sm">
                  {character.race && (
                    <div>
                      <span className="font-semibold">Race:</span>{" "}
                      {character.race}
                    </div>
                  )}
                  {Array.isArray(character.classes) &&
                    character.classes.length > 0 && (
                      <div>
                        <span className="font-semibold">Classes:</span>{" "}
                        {character.classes.join(", ")}
                      </div>
                    )}
                </div>

                {character.description && (
                  <p className="text-base-content/70 line-clamp-3">
                    {character.description}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Link
                    href={`/campaigns/${character.adventure?.campaignId}/characters/${character.id}`}
                  >
                    <Button variant="warning" className="gap-2" size="sm">
                      <View className="w-4 h-4" />
                      View
                    </Button>
                  </Link>
                  <Link
                    href={`/campaigns/${character.adventure?.campaignId}/characters/${character.id}/edit`}
                  >
                    <Button variant="secondary" className="gap-2" size="sm">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="neutral" className="gap-2" size="sm">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function CharactersSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function CharactersPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb items={[{ label: "Characters" }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Characters</h1>
          <p className="text-base-content/70 mt-2">
            No characters found. Create some characters to see them listed here.
          </p>
        </div>
      </div>

      <Suspense fallback={<CharactersSkeleton />}>
        <CharactersContent />
      </Suspense>
    </div>
  );
}
