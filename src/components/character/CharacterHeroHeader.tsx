"use client";

import { useRouter } from "next/navigation";
import { Character, Adventure, Campaign } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Share } from "lucide-react";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";

interface CharacterHeroHeaderProps {
  character: Character & {
    adventure?: Adventure | null;
    campaign?: Campaign | null;
  };
  campaignId: number;
}

export default function CharacterHeroHeader({ character, campaignId }: CharacterHeroHeaderProps) {
  const router = useRouter();
  const images = parseImagesJson(character.images);
  const characterImage = images.length > 0 ? images[0].url : null;

  const handleEdit = () => {
    router.push(`/campaigns/${campaignId}/characters/${character.id}/edit`);
  };

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 rounded-xl p-6 mb-6 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative flex items-start gap-6">
        {/* Character Avatar */}
        <div className="avatar flex-shrink-0">
          <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
            {characterImage ? (
              <img
                src={characterImage}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white">
                {character.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Character Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-base-content mb-2">{character.name}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="outline" className="capitalize">
                  {character.characterType === "pc" ? "Player Character" : character.characterType === "npc" ? "NPC" : character.characterType}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 ml-4">
              <Button variant="primary" onClick={handleEdit} size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}