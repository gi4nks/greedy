"use client";

import React from "react";
import { Character, Adventure, Campaign } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Shield, Sword, Eye, Brain, Users } from "lucide-react";

interface CharacterStatsProps {
  character: Character & {
    adventure?: Adventure | null;
    campaign?: Campaign | null;
  };
}

export default function CharacterStats({ character }: CharacterStatsProps) {
  const calculateModifier = (score: number | null): number => {
    if (!score) return 0;
    return Math.floor((score - 10) / 2);
  };

  const formatModifier = (modifier: number): string => {
    return modifier >= 0 ? `+${modifier}` : modifier.toString();
  };

  return (
    <div className="space-y-4">
      {/* Ability Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sword className="w-4 h-4" />
            Ability Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Strength", value: character.strength, icon: Sword },
            { name: "Dexterity", value: character.dexterity, icon: Eye },
            {
              name: "Constitution",
              value: character.constitution,
              icon: Heart,
            },
            {
              name: "Intelligence",
              value: character.intelligence,
              icon: Brain,
            },
            { name: "Wisdom", value: character.wisdom, icon: Users },
            { name: "Charisma", value: character.charisma, icon: Shield },
          ].map(({ name, value, icon: Icon }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-base-content/60" />
                <span className="text-sm font-medium">{name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{value || 10}</span>
                <Badge variant="outline" className="text-xs">
                  {formatModifier(calculateModifier(value))}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Combat Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Combat Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Hit Points</span>
            <span className="text-sm font-mono">
              {character.hitPoints || 0} / {character.maxHitPoints || 0}
            </span>
          </div>

          {character.hitPoints && character.maxHitPoints && (
            <Progress
              value={(character.hitPoints / character.maxHitPoints) * 100}
              className="h-2"
            />
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Armor Class</span>
            <span className="text-sm font-mono">
              {character.armorClass || 10}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
