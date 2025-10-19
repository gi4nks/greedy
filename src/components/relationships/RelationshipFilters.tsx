"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";

interface RelationshipFiltersProps {
  npcs: Array<{
    id: number;
    name: string;
    race: string | null;
    classes: unknown;
  }>;
  playerCharacters: Array<{
    id: number;
    name: string;
    race: string | null;
    classes: unknown;
  }>;
  currentFilters: {
    npcId?: string;
    characterId?: string;
    type?: string;
  };
}

export default function RelationshipFilters({
  npcs,
  playerCharacters,
  currentFilters,
}: RelationshipFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "all" && value !== "none") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`/relationships?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/relationships");
  };

  const hasFilters = Object.values(currentFilters).some(Boolean);

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
          {hasFilters && (
            <span className="ml-2 bg-primary text-primary-content rounded-full px-2 py-1 text-xs">
              {Object.values(currentFilters).filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Filters Card */}
      <Card className={`${showMobileFilters ? "block" : "hidden"} lg:block`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Filters
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">NPC</label>
            <Select
              name="npcId"
              value={currentFilters.npcId || ""}
              onValueChange={(value) => updateFilters("npcId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All NPCs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All NPCs</SelectItem>
                {npcs.map((npc) => (
                  <SelectItem key={npc.id} value={npc.id.toString()}>
                    {npc.name}
                    {npc.race && ` (${npc.race})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Player Character
            </label>
            <Select
              name="characterId"
              value={currentFilters.characterId || ""}
              onValueChange={(value) => updateFilters("characterId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Characters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Characters</SelectItem>
                {playerCharacters.map((pc) => (
                  <SelectItem key={pc.id} value={pc.id.toString()}>
                    {pc.name}
                    {Array.isArray(pc.classes) &&
                      pc.classes.length > 0 &&
                      ` (${pc.classes.join(", ")})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Relationship Type
            </label>
            <Select
              name="type"
              value={currentFilters.type || ""}
              onValueChange={(value) => updateFilters("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ally">Ally</SelectItem>
                <SelectItem value="enemy">Enemy</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="romantic">Romantic</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="rival">Rival</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
