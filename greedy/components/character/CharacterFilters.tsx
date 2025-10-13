"use client";

import { Adventure } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import Link from "next/link";

interface CharacterFiltersProps {
  campaignId: number;
  adventures: Adventure[];
  currentFilters: {
    type?: string;
    race?: string;
    class?: string;
    adventure_id?: string;
  };
}

export default function CharacterFilters({
  campaignId,
  adventures,
  currentFilters,
}: CharacterFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "none") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/campaigns/${campaignId}/characters?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(`/campaigns/${campaignId}/characters`);
  };

  const hasActiveFilters = Object.values(currentFilters).some((value) => value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Character Type Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Character Type
          </label>
          <Select
            name="type"
            value={currentFilters.type || ""}
            onValueChange={(value) => updateFilter("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="player">Player</SelectItem>
              <SelectItem value="npc">NPC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Adventure Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Adventure</label>
          <Select
            name="adventure_id"
            value={currentFilters.adventure_id || ""}
            onValueChange={(value) => updateFilter("adventure_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All adventures" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All adventures</SelectItem>
              {adventures.map((adventure) => (
                <SelectItem key={adventure.id} value={adventure.id.toString()}>
                  {adventure.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Race Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Race</label>
          <Select
            name="race"
            value={currentFilters.race || ""}
            onValueChange={(value) => updateFilter("race", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All races" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All races</SelectItem>
              <SelectItem value="Human">Human</SelectItem>
              <SelectItem value="Elf">Elf</SelectItem>
              <SelectItem value="Dwarf">Dwarf</SelectItem>
              <SelectItem value="Halfling">Halfling</SelectItem>
              <SelectItem value="Orc">Orc</SelectItem>
              <SelectItem value="Dragonborn">Dragonborn</SelectItem>
              <SelectItem value="Tiefling">Tiefling</SelectItem>
              <SelectItem value="Gnome">Gnome</SelectItem>
              <SelectItem value="Half-Elf">Half-Elf</SelectItem>
              <SelectItem value="Half-Orc">Half-Orc</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Class Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Class</label>
          <Select
            name="class"
            value={currentFilters.class || ""}
            onValueChange={(value) => updateFilter("class", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              <SelectItem value="Fighter">Fighter</SelectItem>
              <SelectItem value="Wizard">Wizard</SelectItem>
              <SelectItem value="Rogue">Rogue</SelectItem>
              <SelectItem value="Cleric">Cleric</SelectItem>
              <SelectItem value="Barbarian">Barbarian</SelectItem>
              <SelectItem value="Bard">Bard</SelectItem>
              <SelectItem value="Druid">Druid</SelectItem>
              <SelectItem value="Monk">Monk</SelectItem>
              <SelectItem value="Paladin">Paladin</SelectItem>
              <SelectItem value="Ranger">Ranger</SelectItem>
              <SelectItem value="Sorcerer">Sorcerer</SelectItem>
              <SelectItem value="Warlock">Warlock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Active Filters</span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {currentFilters.type && (
                <Badge variant="secondary" className="gap-1">
                  Type: {currentFilters.type}
                  <button onClick={() => updateFilter("type", "")}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {currentFilters.adventure_id && (
                <Badge variant="secondary" className="gap-1">
                  Adventure:{" "}
                  {
                    adventures.find(
                      (a) => a.id.toString() === currentFilters.adventure_id,
                    )?.title
                  }
                  <button onClick={() => updateFilter("adventure_id", "")}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {currentFilters.race && (
                <Badge variant="secondary" className="gap-1">
                  Race: {currentFilters.race}
                  <button onClick={() => updateFilter("race", "")}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {currentFilters.class && (
                <Badge variant="secondary" className="gap-1">
                  Class: {currentFilters.class}
                  <button onClick={() => updateFilter("class", "")}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t space-y-2">
          <Link href={`/campaigns/${campaignId}/characters/new`}>
            <Button className="w-full" size="sm">
              + New Character
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
