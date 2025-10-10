'use client';

import { Character, Adventure, Campaign } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EquipmentDisplay from '@/components/ui/equipment-display';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import MarkdownContent from '@/components/ui/markdown-content';
import WikiEntitiesDisplay from '@/components/ui/wiki-entities-display';
import { WikiEntity } from '@/lib/types/wiki';

interface MagicItem {
  id: number;
  name: string;
  rarity: string | null;
  type: string | null;
  description: string | null;
}

interface CharacterDetailProps {
  character: Character & {
    adventure?: Adventure | null;
    campaign?: Campaign | null;
    magicItems?: MagicItem[];
    wikiEntities?: WikiEntity[];
  };
}

export default function CharacterDetail({ character }: CharacterDetailProps) {
  // Parse classes data
  const parseClasses = () => {
    try {
      const classes = typeof character.classes === 'string'
        ? JSON.parse(character.classes)
        : character.classes;

      if (Array.isArray(classes) && classes.length > 0) {
        return classes
          .map((c: { name: string; level: number }) => `${c.name} ${c.level}`)
          .join(', ');
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  };

  // Parse equipment data
  const parseEquipment = (): string[] => {
    try {
      const equipment = typeof character.equipment === 'string'
        ? JSON.parse(character.equipment)
        : character.equipment;
      return Array.isArray(equipment) ? equipment : [];
    } catch {
      return [];
    }
  };

  const classesDisplay = parseClasses();
  const equipmentList = parseEquipment();

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-base-content/70">Race</label>
              <p className="text-sm">{character.race || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-base-content/70">Classes</label>
              <p className="text-sm">{classesDisplay || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-base-content/70">Alignment</label>
              <p className="text-sm">{character.alignment || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-base-content/70">Background</label>
              <p className="text-sm">{character.background || 'None'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-base-content/70">Experience</label>
              <p className="text-sm">{character.experience || 0} XP</p>
            </div>
          </div>

          {character.description && (
            <div>
              <label className="text-sm font-medium text-base-content/70">Description</label>
              <p className="mt-1">{character.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wiki Items from Wiki Import */}
      {character.wikiEntities && character.wikiEntities.length > 0 && (
        <WikiEntitiesDisplay
          wikiEntities={character.wikiEntities as WikiEntity[]}
          entityType="character"
          entityId={character.id}
          showImportMessage={true}
          isEditable={false}
        />
      )}

      {/* Equipment */}
      {equipmentList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <EquipmentDisplay equipment={equipmentList} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}