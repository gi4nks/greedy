'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Character, Adventure, Campaign } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Save, Edit, Trash2, ChevronDown, ChevronUp, EyeOff } from 'lucide-react';
import { createCharacter, updateCharacter } from '@/lib/actions/characters';
import { ImageManager } from '@/components/ui/image-manager';
import { ImageInfo, parseImagesJson } from '@/lib/utils/imageUtils.client';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import WikiEntitiesDisplay from '@/components/ui/wiki-entities-display';

interface CharacterFormProps {
  character?: Character & { 
    adventure?: Adventure | null; 
    campaign?: Campaign | null;
    wikiSpells?: Array<{
      id: number;
      title: string;
      contentType: string;
      wikiUrl?: string;
      parsedData?: unknown;
      relationshipType?: string;
      relationshipData?: unknown;
    }>;
    wikiMonsters?: Array<{
      id: number;
      title: string;
      contentType: string;
      wikiUrl?: string;
      parsedData?: unknown;
      relationshipType?: string;
      relationshipData?: unknown;
    }>;
    wikiEntities?: Array<{
      id: number;
      title: string;
      contentType: string;
      wikiUrl?: string;
      description?: string; // Added description field mapped from rawContent
      parsedData?: unknown;
      relationshipType?: string;
      relationshipData?: unknown;
    }>;
    magicItems?: Array<{
      id: number;
      assignmentId?: number;
      name: string;
      rarity: string | null;
      type: string | null;
      description: string | null;
      source?: string | null;
      notes?: string | null;
      metadata?: unknown;
      assignedAt?: string | null;
      campaignId?: number | null;
    }>;
  };
  campaignId: number;
  adventureId?: number;
  mode: 'create' | 'edit';
}

interface FormData {
  name: string;
  race: string;
  experience: number;
  description: string;
  characterType: 'player' | 'npc';
  campaignId?: number;
  adventureId?: number;
  alignment: string;

  // Ability scores
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  // Combat stats
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  proficiencyBonus: number;

  // Personality
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;

  // Arrays
  equipment: string[];
  weapons: string[];
  skills: string[];
  savingThrows: string[];
  spells: string[];
  tags: string[];
  classes: Array<{ name: string; level: number }>;
  items: Array<{ title: string; description: string }>;

  // Relationships
  npcRelationships: Array<{ name: string; type: string; description: string }>;

  // Images
  images: ImageInfo[];
}

export default function CharacterForm({ character, campaignId, adventureId, mode }: CharacterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Item modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemFormData, setItemFormData] = useState<{ title: string; description: string }>({
    title: '',
    description: ''
  });

  // Expanded items state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Loading states for remove operations
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Initialize form data
  const [formData, setFormData] = useState<FormData>(() => {
    if (mode === 'edit' && character) {
      const parseJsonArray = (json: unknown): string[] => {
        if (typeof json === 'string') {
          try {
            return JSON.parse(json);
          } catch {
            return [];
          }
        }
        return Array.isArray(json) ? json : [];
      };

      const parseJsonObjectArray = (json: unknown): Array<{ name: string; type: string; description: string }> => {
        if (typeof json === 'string') {
          try {
            const parsed = JSON.parse(json);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return Array.isArray(json) ? json : [];
      };

      return {
        name: character.name || '',
        race: character.race || '',
        alignment: character.alignment || 'True Neutral',
        experience: character.experience || 0,
        description: character.description || '',
        characterType: (character.characterType === 'pc' ? 'player' : character.characterType as 'player' | 'npc') || 'player',
        campaignId: campaignId,
        adventureId: character.adventureId || adventureId,

        strength: character.strength || 10,
        dexterity: character.dexterity || 10,
        constitution: character.constitution || 10,
        intelligence: character.intelligence || 10,
        wisdom: character.wisdom || 10,
        charisma: character.charisma || 10,

        hitPoints: character.hitPoints || 0,
        maxHitPoints: character.maxHitPoints || 0,
        armorClass: character.armorClass || 10,
        proficiencyBonus: character.proficiencyBonus || 2,

        personalityTraits: character.personalityTraits || '',
        ideals: character.ideals || '',
        bonds: character.bonds || '',
        flaws: character.flaws || '',
        backstory: character.backstory || '',

        equipment: parseJsonArray(character.equipment),
        weapons: parseJsonArray(character.weapons),
        skills: parseJsonArray(character.skills),
        savingThrows: parseJsonArray(character.savingThrows),
        spells: parseJsonArray(character.spells),
        tags: parseJsonArray(character.tags),

        npcRelationships: parseJsonObjectArray(character.npcRelationships),
        classes: (() => {
          try {
            const parsed = typeof character.classes === 'string' 
              ? JSON.parse(character.classes) 
              : character.classes;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })(),

        items: [],

        spellcastingAbility: character.spellcastingAbility || '',
        spellSaveDc: character.spellSaveDc || 0,
        spellAttackBonus: character.spellAttackBonus || 0,
        images: parseImagesJson(character.images),
      };
    }

    return {
      name: '',
      race: '',
      alignment: 'True Neutral',
      experience: 0,
      description: '',
      characterType: 'player' as 'player' | 'npc',
      campaignId,
      adventureId,

      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,

      hitPoints: 0,
      maxHitPoints: 0,
      armorClass: 10,
      proficiencyBonus: 2,

      personalityTraits: '',
      ideals: '',
      bonds: '',
      flaws: '',
      backstory: '',

      equipment: [],
      weapons: [],
      skills: [],
      savingThrows: [],
      spells: [],
      tags: [],

      npcRelationships: [],
      classes: [],

      items: [],

      spellcastingAbility: '',
      spellSaveDc: 0,
      spellAttackBonus: 0,
      images: [],
    };
  });

  // Wiki entities state - initialize from character prop
  const [wikiSpells, setWikiSpells] = useState<Array<{
    id: number;
    name: string;
    level: number;
    school: string;
    description: string;
    isPrepared?: boolean;
    isKnown?: boolean;
  }>>(character?.wikiEntities?.filter(entity => entity.contentType === 'spell').map(spell => ({
    id: spell.id,
    name: spell.title,
    level: (spell.parsedData as { level?: number })?.level || 0,
    school: (spell.parsedData as { school?: string })?.school || 'common',
    description: spell.description || '',  // Use description field (mapped from rawContent)
    isPrepared: Boolean((spell.relationshipData as { isPrepared?: boolean })?.isPrepared),
    isKnown: Boolean((spell.relationshipData as { isKnown?: boolean })?.isKnown)
  })) || []);

  const [wikiMonsters, setWikiMonsters] = useState<Array<{
    id: number;
    name: string;
    type: string;
    challengeRating: string;
    description: string;
    relationshipType?: string;
  }>>(character?.wikiEntities?.filter(entity => entity.contentType === 'monster').map(monster => ({
    id: monster.id,
    name: monster.title,
    type: (monster.parsedData as { type?: string })?.type || 'monster',
    challengeRating: (monster.parsedData as { challengeRating?: string })?.challengeRating || '',
    description: monster.description || '',  // Use description field (mapped from rawContent)
    relationshipType: monster.relationshipType
  })) || []);

  const [magicItems, setMagicItems] = useState<Array<{
    id: number;
    name: string;
    rarity: string;
    type: string;
    description: string;
  }>>(character?.wikiEntities?.filter(entity => entity.contentType === 'magic-item').map(item => ({
    id: item.id,
    name: item.title,
    rarity: (item.parsedData as { rarity?: string })?.rarity || '',
    type: (item.parsedData as { type?: string })?.type || '',
    description: item.description || ''  // Use description field (mapped from rawContent)
  })) || []);

  const [otherWikiItems, setOtherWikiItems] = useState<Array<{
    id: number;
    name: string;
    contentType: string;
    description: string;
  }>>(character?.wikiEntities?.filter(entity => 
    !['spell', 'monster', 'magic-item'].includes(entity.contentType)
  ).map(item => ({
    id: item.id,
    name: item.title,
    contentType: item.contentType,
    description: item.description || ''  // Use description field (mapped from rawContent)
  })) || []);

  const handleImagesChange = (images: ImageInfo[]) => {
    setFormData(prev => ({
      ...prev,
      images
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const submitFormData = new FormData();

      // Map characterType from 'player'/'npc' to 'pc'/'npc'
      const mappedCharacterType = formData.characterType === 'player' ? 'pc' : formData.characterType;

      // Add all form data to FormData object
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'characterType') {
          submitFormData.append(key, mappedCharacterType);
        } else if (Array.isArray(value)) {
          submitFormData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          submitFormData.append(key, value.toString());
        }
      });

      if (mode === 'create') {
        const result = await createCharacter(submitFormData);
        if (result?.errors) {
          const errorMessages: Record<string, string> = {};
          Object.entries(result.errors).forEach(([key, messages]) => {
            if (Array.isArray(messages)) {
              errorMessages[key] = messages[0] || 'Invalid value';
            }
          });
          setErrors(errorMessages);
          return;
        }
        // Don't push here since the action handles redirect
      } else if (mode === 'edit' && character) {
        const result = await updateCharacter(character.id, submitFormData);
        if (result?.errors) {
          const errorMessages: Record<string, string> = {};
          Object.entries(result.errors).forEach(([key, messages]) => {
            if (Array.isArray(messages)) {
              errorMessages[key] = messages[0] || 'Invalid value';
            }
          });
          setErrors(errorMessages);
          return;
        }
        router.push(`/campaigns/${campaignId}/characters`);
      }
    } catch (error) {
      console.error('Error saving character:', error);
      setErrors({ submit: 'Failed to save character. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string | number | string[] | Array<{ name: string; type: string; description: string }> | Array<{ name: string; level: number }> | Array<{ title: string; description: string }>) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: 'equipment' | 'weapons' | 'skills' | 'savingThrows' | 'spells' | 'tags', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      updateFormData(field, [...formData[field], value.trim()]);
    }
  };

  const removeFromArray = (field: 'equipment' | 'weapons' | 'skills' | 'savingThrows' | 'spells' | 'tags', index: number) => {
    updateFormData(field, formData[field].filter((_, i) => i !== index));
  };

  const removeItem = (index: number) => {
    updateFormData('items', formData.items.filter((_, i) => i !== index));
  };

  const openItemModal = (index?: number) => {
    if (index !== undefined) {
      setEditingItemIndex(index);
      setItemFormData(formData.items[index]);
    } else {
      setEditingItemIndex(null);
      setItemFormData({ title: '', description: '' });
    }
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setEditingItemIndex(null);
    setItemFormData({ title: '', description: '' });
  };

  const saveItem = () => {
    if (editingItemIndex !== null) {
      // Edit existing item
      const updated = formData.items.map((item, i) =>
        i === editingItemIndex ? itemFormData : item
      );
      updateFormData('items', updated);
    } else {
      // Add new item
      updateFormData('items', [...formData.items, itemFormData]);
    }
    closeItemModal();
  };

  const addRelationship = () => {
    updateFormData('npcRelationships', [...formData.npcRelationships, { name: '', type: '', description: '' }]);
  };

  const updateRelationship = (index: number, field: 'name' | 'type' | 'description', value: string) => {
    const updated = formData.npcRelationships.map((rel, i) =>
      i === index ? { ...rel, [field]: value } : rel
    );
    updateFormData('npcRelationships', updated);
  };

  const removeRelationship = (index: number) => {
    updateFormData('npcRelationships', formData.npcRelationships.filter((_, i) => i !== index));
  };

  const removeWikiItem = async (wikiArticleId: number, contentType: string) => {
    const itemKey = `${contentType}-${wikiArticleId}`;
    
    // Prevent multiple simultaneous removals of the same item
    if (removingItems.has(itemKey)) {
      return;
    }

    setRemovingItems(prev => new Set(prev).add(itemKey));

    console.log('removeWikiItem called:', { wikiArticleId, contentType, characterId: character?.id });

    if (!character?.id) {
      console.error('Character ID is undefined');
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
      return;
    }

    try {
      const response = await fetch(`/api/wiki-articles/${wikiArticleId}/entities`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType: 'character',
          entityId: character.id,
        }),
      });

      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        
        // Treat 404 as success (item already removed)
        if (response.status === 404) {
          console.log('Item already removed (404), treating as success');
        } else {
          throw new Error(`Failed to remove wiki item: ${errorText}`);
        }
      }

      const result = response.ok ? await response.json() : null;
      if (result) {
        console.log('API success result:', result);
      }

      // Update local state based on content type
      if (contentType === 'spell') {
        setWikiSpells(prev => prev.filter(spell => spell.id !== wikiArticleId));
      } else if (contentType === 'monster') {
        setWikiMonsters(prev => prev.filter(monster => monster.id !== wikiArticleId));
      } else if (contentType === 'magic-item') {
        setMagicItems(prev => prev.filter(item => item.id !== wikiArticleId));
      } else {
        // Handle other content types
        setOtherWikiItems(prev => prev.filter(item => item.id !== wikiArticleId));
      }
    } catch (error) {
      console.error('Error removing wiki item:', error);
      // Could add toast notification here
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {mode === 'create' ? 'Create New Character' : 'Edit Character'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="abilities">Abilities</TabsTrigger>
            <TabsTrigger value="combat">Combat</TabsTrigger>
            <TabsTrigger value="personality">Personality</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="spells">Spells</TabsTrigger>
            <TabsTrigger value="wiki">Wiki Entities</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="characterType">Type</Label>
                    <Select defaultValue={formData.characterType} name="characterType" onValueChange={(value) => updateFormData('characterType', value as 'player' | 'npc')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="player">Player Character</SelectItem>
                        <SelectItem value="npc">NPC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="race">Race</Label>
                    <Input
                      id="race"
                      value={formData.race}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('race', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="alignment">Alignment</Label>
                    <Select value={formData.alignment} name="alignment" onValueChange={(value) => updateFormData('alignment', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lawful Good">Lawful Good</SelectItem>
                        <SelectItem value="Neutral Good">Neutral Good</SelectItem>
                        <SelectItem value="Chaotic Good">Chaotic Good</SelectItem>
                        <SelectItem value="Lawful Neutral">Lawful Neutral</SelectItem>
                        <SelectItem value="True Neutral">True Neutral</SelectItem>
                        <SelectItem value="Chaotic Neutral">Chaotic Neutral</SelectItem>
                        <SelectItem value="Lawful Evil">Lawful Evil</SelectItem>
                        <SelectItem value="Neutral Evil">Neutral Evil</SelectItem>
                        <SelectItem value="Chaotic Evil">Chaotic Evil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Classes & Levels</Label>
                  <div className="space-y-2">
                    {formData.classes.map((classInfo, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Class name"
                          value={classInfo.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const updated = [...formData.classes];
                            updated[index] = { ...updated[index], name: e.target.value };
                            updateFormData('classes', updated);
                          }}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          placeholder="Level"
                          value={classInfo.level}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const updated = [...formData.classes];
                            updated[index] = { ...updated[index], level: parseInt(e.target.value) || 1 };
                            updateFormData('classes', updated);
                          }}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = formData.classes.filter((_, i) => i !== index);
                            updateFormData('classes', updated);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateFormData('classes', [...formData.classes, { name: '', level: 1 }]);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Class
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('experience', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('description', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ability Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'strength', label: 'Strength' },
                    { key: 'dexterity', label: 'Dexterity' },
                    { key: 'constitution', label: 'Constitution' },
                    { key: 'intelligence', label: 'Intelligence' },
                    { key: 'wisdom', label: 'Wisdom' },
                    { key: 'charisma', label: 'Charisma' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        type="number"
                        min="1"
                        max="30"
                        value={(formData[key as keyof FormData] as number) || 10}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData(key as keyof FormData, parseInt(e.target.value) || 10)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="combat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Combat Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hitPoints">Current Hit Points</Label>
                    <Input
                      id="hitPoints"
                      type="number"
                      min="0"
                      value={formData.hitPoints}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('hitPoints', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxHitPoints">Maximum Hit Points</Label>
                    <Input
                      id="maxHitPoints"
                      type="number"
                      min="0"
                      value={formData.maxHitPoints}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('maxHitPoints', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="armorClass">Armor Class</Label>
                    <Input
                      id="armorClass"
                      type="number"
                      min="0"
                      value={formData.armorClass}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('armorClass', parseInt(e.target.value) || 10)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="proficiencyBonus">Proficiency Bonus</Label>
                    <Input
                      id="proficiencyBonus"
                      type="number"
                      min="0"
                      value={formData.proficiencyBonus}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('proficiencyBonus', parseInt(e.target.value) || 2)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills & Proficiencies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Skills</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add skill..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('skills', (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addToArray('skills', input.value);
                        input.value = '';
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeFromArray('skills', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personality & Background</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="personalityTraits">Personality Traits</Label>
                  <Textarea
                    id="personalityTraits"
                    value={formData.personalityTraits}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('personalityTraits', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="ideals">Ideals</Label>
                  <Textarea
                    id="ideals"
                    value={formData.ideals}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('ideals', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="bonds">Bonds</Label>
                  <Textarea
                    id="bonds"
                    value={formData.bonds}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('bonds', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="flaws">Flaws</Label>
                  <Textarea
                    id="flaws"
                    value={formData.flaws}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('flaws', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="backstory">Backstory</Label>
                  <Textarea
                    id="backstory"
                    value={formData.backstory}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('backstory', e.target.value)}
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>NPC Relationships</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.npcRelationships.map((relationship, index) => (
                  <div key={index} className="border rounded p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Relationship {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRelationship(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Name"
                        value={relationship.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRelationship(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Type (e.g., friend, enemy, ally)"
                        value={relationship.type}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRelationship(index, 'type', e.target.value)}
                      />
                    </div>
                    <Textarea
                      placeholder="Description"
                      value={relationship.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateRelationship(index, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRelationship}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Relationship
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manual Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="border rounded p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{item.title || `Item ${index + 1}`}</h4>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="gap-2"
                          onClick={() => openItemModal(index)}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openItemModal()}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manual Item
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">💎 Magic Items from Wiki</CardTitle>
              </CardHeader>
              <CardContent>
                {magicItems.length > 0 ? (
                  <div className="space-y-3">
                    {magicItems.map((item) => {
                      const itemId = `magic-${item.id}`;
                      const isExpanded = expandedItems.has(itemId);
                      return (
                        <div key={item.id} className="border border-purple-200 bg-purple-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div
                              className="flex items-center gap-2 p-3 cursor-pointer hover:bg-purple-100 transition-colors flex-1"
                              onClick={() => toggleExpanded(itemId)}
                            >
                              <h4 className="font-semibold text-purple-800">{item.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  {item.rarity}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-purple-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-purple-600" />
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="neutral"
                              className="gap-2 mr-3 mt-3"
                              size="sm"
                              onClick={() => removeWikiItem(item.id, 'magic-item')}
                              disabled={removingItems.has(`magic-item-${item.id}`)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                          <div className="px-3 pb-1 mb-2">
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Type:</strong> {item.type}
                            </p>
                          </div>
                          {isExpanded && item.description && (
                            <div className="px-3 pb-3">
                              <MarkdownRenderer content={item.description} className="prose-sm" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No magic items assigned from wiki imports</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            <ImageManager
              entityType="characters"
              entityId={character?.id || 0}
              currentImages={formData.images}
              onImagesChange={handleImagesChange}
            />
          </TabsContent>

          <TabsContent value="spells" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manual Known Spells</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Known Spells</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add spell..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('spells', (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addToArray('spells', input.value);
                        input.value = '';
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.spells.map((spell, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {spell}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeFromArray('spells', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">📚 Spells from Wiki</CardTitle>
              </CardHeader>
              <CardContent>
                {wikiSpells.length > 0 ? (
                  <div className="space-y-3">
                    {wikiSpells.map((spell) => {
                      const itemId = `spell-${spell.id}`;
                      const isExpanded = expandedItems.has(itemId);
                      return (
                        <div key={spell.id} className="border border-blue-200 bg-blue-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div
                              className="flex items-center gap-2 p-3 cursor-pointer hover:bg-blue-100 transition-colors flex-1"
                              onClick={() => toggleExpanded(itemId)}
                            >
                              <h4 className="font-semibold text-blue-800">{spell.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  Level {spell.level}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="neutral"
                              className="gap-2 mr-3 mt-3"
                              size="sm"
                              onClick={() => removeWikiItem(spell.id, 'spell')}
                              disabled={removingItems.has(`spell-${spell.id}`)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                          <div className="px-3 pb-1 mb-2">
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>School:</strong> {spell.school}
                            </p>
                          </div>
                          {isExpanded && spell.description && (
                            <div className="px-3 pb-3">
                              <MarkdownRenderer content={spell.description} className="prose-sm" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No spells assigned from wiki imports</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wiki" className="space-y-6">
            {(() => {
              // Combine all wiki entities from local state for the WikiEntitiesDisplay
              const allWikiEntities = [
                ...wikiSpells.map(spell => ({
                  id: spell.id,
                  title: spell.name,
                  contentType: 'spell' as const,
                  wikiUrl: undefined,
                  description: spell.description,
                  parsedData: { level: spell.level, school: spell.school },
                  relationshipType: 'prepared' as const,
                  relationshipData: { isPrepared: spell.isPrepared, isKnown: spell.isKnown }
                })),
                ...wikiMonsters.map(monster => ({
                  id: monster.id,
                  title: monster.name,
                  contentType: 'monster' as const,
                  wikiUrl: undefined,
                  description: monster.description,
                  parsedData: { type: monster.type, challengeRating: monster.challengeRating },
                  relationshipType: monster.relationshipType,
                  relationshipData: {}
                })),
                ...magicItems.map(item => ({
                  id: item.id,
                  title: item.name,
                  contentType: 'magic-item' as const,
                  wikiUrl: undefined,
                  description: item.description,
                  parsedData: { rarity: item.rarity, type: item.type },
                  relationshipType: 'owned' as const,
                  relationshipData: {}
                })),
                ...otherWikiItems.map(item => ({
                  id: item.id,
                  title: item.name,
                  contentType: item.contentType as 'other',
                  wikiUrl: undefined,
                  description: item.description,
                  parsedData: {},
                  relationshipType: undefined,
                  relationshipData: {}
                }))
              ];

              return allWikiEntities.length > 0 ? (
                <WikiEntitiesDisplay
                  wikiEntities={allWikiEntities}
                  entityType="character"
                  entityId={character?.id || 0}
                  showImportMessage={true}
                  onRemoveEntity={removeWikiItem}
                  isEditable={true}
                  removingItems={removingItems}
                />
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No wiki entities assigned to this character.</p>
                  <p>Use the Wiki Import page to add entities to this character.</p>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>

        {errors.submit && (
          <div className="text-red-500 text-center">{errors.submit}</div>
        )}

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting} variant="primary">
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            <EyeOff className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      </form>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeItemModal}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingItemIndex !== null ? 'Edit Item' : 'Add New Item'}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeItemModal}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="itemTitle">Title</Label>
                <Input
                  id="itemTitle"
                  value={itemFormData.title}
                  onChange={(e) => setItemFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter item title"
                />
              </div>
              
              <div>
                <Label htmlFor="itemDescription">Description</Label>
                <Textarea
                  id="itemDescription"
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter item description"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={closeItemModal}
              >
                <EyeOff className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveItem}
                disabled={!itemFormData.title.trim()}
              >
                {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}