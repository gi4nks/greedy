"use client";

import { useState } from "react";
import type { Adventure, Campaign, Character } from "@/lib/db/schema";
import { createCharacter, updateCharacter } from "@/lib/actions/characters";
import { CharacterFormSchema, type CharacterFormData, type DiaryEntryFormData } from "@/lib/forms";
import { validateFormData } from "@/lib/forms/validation";
import { useImageManagement } from "@/lib/utils/imageFormUtils";
import { useWikiItemManagement } from "@/lib/utils/wikiUtils";
import { TabbedEntityForm, FormSection, FormGrid, DynamicArrayField } from "@/lib/forms";
import { FormField } from "@/components/ui/form-components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EntitySelectorModal from "@/components/ui/entity-selector-modal";
import { ImageManager } from "@/components/ui/image-manager";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import type { WikiEntity } from "@/lib/types/wiki";
import DiaryEntryCard from "@/components/character/DiaryEntryCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sortDiaryEntries } from "@/lib/utils/diaryUi";

interface MagicItemSummary {
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
}

import type { DiaryEntry } from "@/lib/types/diary";

interface DiaryEntryDraft extends DiaryEntryFormData {
  linkedEntities: { id: string; type: string; name: string }[];
}

interface CharacterFormProps {
  character?: Character & {
    adventure?: Adventure | null;
    campaign?: Campaign | null;
    magicItems?: MagicItemSummary[];
    wikiEntities?: WikiEntity[];
    diaryEntries?: DiaryEntry[];
  };
  campaignId: number;
  adventureId?: number;
  mode: "create" | "edit";
}

interface ClassEntry {
  id?: string | number;
  name: string;
  level: number;
}

const abilityFields = [
  { key: "strength", label: "Strength" },
  { key: "dexterity", label: "Dexterity" },
  { key: "constitution", label: "Constitution" },
  { key: "intelligence", label: "Intelligence" },
  { key: "wisdom", label: "Wisdom" },
  { key: "charisma", label: "Charisma" },
] as const;

const alignmentOptions: Array<{
  label: string;
  value: "Lawful Good" | "Neutral Good" | "Chaotic Good" | "Lawful Neutral" | "True Neutral" | "Chaotic Neutral" | "Lawful Evil" | "Neutral Evil" | "Chaotic Evil";
}> = [
  { label: "Lawful Good", value: "Lawful Good" },
  { label: "Neutral Good", value: "Neutral Good" },
  { label: "Chaotic Good", value: "Chaotic Good" },
  { label: "Lawful Neutral", value: "Lawful Neutral" },
  { label: "True Neutral", value: "True Neutral" },
  { label: "Chaotic Neutral", value: "Chaotic Neutral" },
  { label: "Lawful Evil", value: "Lawful Evil" },
  { label: "Neutral Evil", value: "Neutral Evil" },
  { label: "Chaotic Evil", value: "Chaotic Evil" },
];

const characterTypeOptions: Array<{
  label: string;
  value: "pc" | "npc" | "monster";
}> = [
  { label: "Player Character", value: "pc" },
  { label: "NPC", value: "npc" },
  { label: "Monster", value: "monster" },
];

function createDiaryDraft(): DiaryEntryDraft {
  return {
    description: "",
    date: new Date().toISOString().split("T")[0],
    linkedEntities: [],
    isImportant: false,
  };
}

export default function CharacterForm({
  character,
  campaignId,
  adventureId,
  mode,
}: CharacterFormProps) {

  // Form state
  const [formData, setFormData] = useState<CharacterFormData>(() => ({
    name: character?.name || "",
    race: character?.race || "",
    background: character?.background || "",
    alignment: (character?.alignment as "Lawful Good" | "Neutral Good" | "Chaotic Good" | "Lawful Neutral" | "True Neutral" | "Chaotic Neutral" | "Lawful Evil" | "Neutral Evil" | "Chaotic Evil") || "True Neutral",
    description: character?.description || "",
    characterType: (character?.characterType as "pc" | "npc" | "monster") || "pc",
    campaignId,
    adventureId: character?.adventureId || adventureId,
    strength: character?.strength || 10,
    dexterity: character?.dexterity || 10,
    constitution: character?.constitution || 10,
    intelligence: character?.intelligence || 10,
    wisdom: character?.wisdom || 10,
    charisma: character?.charisma || 10,
    hitPoints: character?.hitPoints || 0,
    maxHitPoints: character?.maxHitPoints || 0,
    armorClass: character?.armorClass || 10,
    classes: character?.classes ? JSON.parse(character.classes as string) : [],
    images: parseImagesJson(character?.images),
  }));

  // Diary state
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(character?.diaryEntries || []);
  const [showDiaryForm, setShowDiaryForm] = useState(false);
  const [editingDiaryId, setEditingDiaryId] = useState<number | null>(null);
  const [diaryDraft, setDiaryDraft] = useState<DiaryEntryDraft>(createDiaryDraft);
  const [isEntitySelectorOpen, setIsEntitySelectorOpen] = useState(false);

  // Shared hooks
  const imageManagement = useImageManagement(parseImagesJson(character?.images));
  const wikiManagement = useWikiItemManagement(character?.wikiEntities || []);

  // Form action
  const createOrUpdateCharacter = async (prevState: { success: boolean; error?: string }, fData: FormData) => {
    try {
      // Validate form data
      const rawData = Object.fromEntries(fData.entries());
      
      // Use form state as fallback for values that might not be in FormData
      const enrichedData = {
        ...rawData,
        campaignId: rawData.campaignId ? parseInt(rawData.campaignId as string) : campaignId,
        adventureId: rawData.adventureId ? parseInt(rawData.adventureId as string) : adventureId,
        strength: rawData.strength ? parseInt(rawData.strength as string) : formData.strength,
        dexterity: rawData.dexterity ? parseInt(rawData.dexterity as string) : formData.dexterity,
        constitution: rawData.constitution ? parseInt(rawData.constitution as string) : formData.constitution,
        intelligence: rawData.intelligence ? parseInt(rawData.intelligence as string) : formData.intelligence,
        wisdom: rawData.wisdom ? parseInt(rawData.wisdom as string) : formData.wisdom,
        charisma: rawData.charisma ? parseInt(rawData.charisma as string) : formData.charisma,
        hitPoints: rawData.hitPoints ? parseInt(rawData.hitPoints as string) : formData.hitPoints,
        maxHitPoints: rawData.maxHitPoints ? parseInt(rawData.maxHitPoints as string) : formData.maxHitPoints,
        armorClass: rawData.armorClass ? parseInt(rawData.armorClass as string) : formData.armorClass,
        classes: rawData.classes && rawData.classes !== "undefined" ? JSON.parse(rawData.classes as string) : [],
        images: rawData.images && rawData.images !== "undefined" ? JSON.parse(rawData.images as string) : [],
      };

      const validation = validateFormData(CharacterFormSchema, enrichedData);

      if (!validation.success) {
        return { success: false, error: Object.values(validation.errors)[0] };
      }

      if (mode === "edit" && character?.id) {
        return await updateCharacter(character.id, prevState, fData);
      } else {
        return await createCharacter(prevState, fData);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  // Helper functions
  const updateFormData = <K extends keyof CharacterFormData>(key: K, value: CharacterFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateClassEntry = (index: number, entry: ClassEntry) => {
    const newClasses = [...formData.classes];
    newClasses[index] = entry;
    updateFormData("classes", newClasses);
  };

  const removeClassEntry = (index: number) => {
    updateFormData("classes", formData.classes.filter((_: ClassEntry, idx: number) => idx !== index));
  };

  const addClassEntry = () => {
    updateFormData("classes", [...formData.classes, { name: "", level: 1 }]);
  };

  // Diary functions
  const resetDiaryForm = () => {
    setEditingDiaryId(null);
    setDiaryDraft(createDiaryDraft());
    setShowDiaryForm(false);
  };

  const addLinkedEntity = (entity: { id: string; type: string; name: string }) => {
    setDiaryDraft((prev) => {
      const exists = prev.linkedEntities.some(
        (linked) => linked.id === entity.id && linked.type === entity.type,
      );
      if (exists) {
        return prev;
      }
      return {
        ...prev,
        linkedEntities: [...prev.linkedEntities, entity],
      };
    });
    setIsEntitySelectorOpen(false);
  };

  const removeLinkedEntity = (entityId: string) => {
    setDiaryDraft((prev) => ({
      ...prev,
      linkedEntities: prev.linkedEntities.filter((entity) => entity.id !== entityId),
    }));
  };

  // Form tabs configuration
  const formTabs = [
    {
      id: "basic",
      label: "Basic Info",
      content: (
        <div className="space-y-6">
          {/* First Row: Name and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Name" required>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                className="input input-bordered w-full"
                required
                placeholder="Enter character name"
              />
            </FormField>

            <FormField label="Type">
              <Select
                value={formData.characterType}
                onValueChange={(value) => updateFormData("characterType", value as "pc" | "npc" | "monster")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select character type" />
                </SelectTrigger>
                <SelectContent>
                  {characterTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="characterType" value={formData.characterType} />
            </FormField>
          </div>

          {/* Second Row: Race and Alignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Race">
              <input
                type="text"
                name="race"
                value={formData.race}
                onChange={(e) => updateFormData("race", e.target.value)}
                className="input input-bordered w-full"
                placeholder="e.g. Human, Elf, Dwarf"
              />
            </FormField>

            <FormField label="Alignment">
              <Select
                value={formData.alignment}
                onValueChange={(value) => updateFormData("alignment", value as "Lawful Good" | "Neutral Good" | "Chaotic Good" | "Lawful Neutral" | "True Neutral" | "Chaotic Neutral" | "Lawful Evil" | "Neutral Evil" | "Chaotic Evil")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  {alignmentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="alignment" value={formData.alignment} />
            </FormField>
          </div>

          <FormField label="Background">
            <textarea
              name="background"
              value={formData.background}
              onChange={(e) => updateFormData("background", e.target.value)}
              rows={3}
              className="textarea textarea-bordered w-full"
              placeholder="Character's background story..."
            />
          </FormField>

          <FormField label="Description">
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              rows={4}
              className="textarea textarea-bordered w-full"
              placeholder="Physical description, personality, etc."
            />
          </FormField>
        </div>
      ),
    },
    {
      id: "abilities",
      label: "Abilities",
      content: (
        <div className="space-y-6">
          <FormGrid columns={3}>
            {abilityFields.map(({ key, label }) => (
              <FormField key={key} label={label}>
                <input
                  type="number"
                  name={key}
                  min={1}
                  max={30}
                  value={formData[key]}
                  onChange={(e) => updateFormData(key, parseInt(e.target.value) || 10)}
                  className="input input-bordered w-full"
                />
              </FormField>
            ))}
          </FormGrid>

          <FormGrid columns={3}>
            <FormField label="Current Hit Points">
              <input
                type="number"
                name="hitPoints"
                min={0}
                value={formData.hitPoints}
                onChange={(e) => updateFormData("hitPoints", parseInt(e.target.value) || 0)}
                className="input input-bordered w-full"
              />
            </FormField>

            <FormField label="Max Hit Points">
              <input
                type="number"
                name="maxHitPoints"
                min={0}
                value={formData.maxHitPoints}
                onChange={(e) => updateFormData("maxHitPoints", parseInt(e.target.value) || 0)}
                className="input input-bordered w-full"
              />
            </FormField>

            <FormField label="Armor Class">
              <input
                type="number"
                name="armorClass"
                min={0}
                value={formData.armorClass}
                onChange={(e) => updateFormData("armorClass", parseInt(e.target.value) || 10)}
                className="input input-bordered w-full"
              />
            </FormField>
          </FormGrid>

          <FormSection title="Classes & Levels">
            <DynamicArrayField
              items={formData.classes}
              onAdd={addClassEntry}
              onRemove={removeClassEntry}
              addLabel="Add Class"
              emptyMessage="No classes added yet. Add a class to define the character's progression."
              renderItem={(classEntry: ClassEntry, index: number) => (
                <FormGrid columns={2}>
                  <FormField label="Class">
                    <input
                      type="text"
                      value={classEntry.name}
                      onChange={(e) => updateClassEntry(index, { ...classEntry, name: e.target.value })}
                      placeholder="Enter class name"
                      className="input input-bordered w-full"
                    />
                  </FormField>
                  <FormField label="Level">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={classEntry.level}
                      onChange={(e) => updateClassEntry(index, { ...classEntry, level: parseInt(e.target.value) || 1 })}
                      className="input input-bordered w-full"
                    />
                  </FormField>
                </FormGrid>
              )}
            />
          </FormSection>
        </div>
      ),
    },
    {
      id: "diary",
      label: "Diary",
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            {/* Add New Entry Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Character Diary</h3>
              <Button
                type="button"
                onClick={() => setShowDiaryForm(true)}
                className="btn btn-primary btn-sm"
              >
                Add Entry
              </Button>
            </div>

            {/* Diary Entries List */}
            {diaryEntries.length > 0 ? (
              <div className="space-y-3">
                {sortDiaryEntries(diaryEntries).map((entry) => (
                  <DiaryEntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={() => {
                      setEditingDiaryId(entry.id);
                      const entryToEdit = diaryEntries.find(e => e.id === entry.id);
                      if (entryToEdit) {
                        setDiaryDraft({
                          description: entryToEdit.description,
                          date: entryToEdit.date,
                          linkedEntities: entryToEdit.linkedEntities,
                          isImportant: entryToEdit.isImportant || false,
                        });
                        setShowDiaryForm(true);
                      }
                    }}
                    onDelete={() => {
                      setDiaryEntries(prev => prev.filter(e => e.id !== entry.id));
                    }}
                    onEntityClick={(entity) => {
                      // Handle entity click - could navigate to entity page
                      console.log('Entity clicked:', entity);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-base-content/60">
                <p>No diary entries yet.</p>
                <p className="text-sm mt-1">Add your first entry to start tracking this character&apos;s story.</p>
              </div>
            )}
          </div>

          {/* Diary Entry Form Modal */}
          {showDiaryForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">
                  {editingDiaryId ? 'Edit Diary Entry' : 'Add Diary Entry'}
                </h3>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Handle form submission
                  if (editingDiaryId) {
                    setDiaryEntries(prev => prev.map(entry =>
                      entry.id === editingDiaryId
                        ? { ...entry, ...diaryDraft }
                        : entry
                    ));
                  } else {
                    const newEntry: DiaryEntry = {
                      id: Date.now(), // Simple ID generation
                      ...diaryDraft,
                    };
                    setDiaryEntries(prev => [...prev, newEntry]);
                  }
                  resetDiaryForm();
                }}>
                  <div className="space-y-4">
                    <FormField label="Date">
                      <input
                        type="date"
                        value={diaryDraft.date}
                        onChange={(e) => setDiaryDraft(prev => ({ ...prev, date: e.target.value }))}
                        className="input input-bordered w-full"
                        required
                      />
                    </FormField>

                    <FormField label="Description">
                      <textarea
                        value={diaryDraft.description}
                        onChange={(e) => setDiaryDraft(prev => ({ ...prev, description: e.target.value }))}
                        rows={6}
                        className="textarea textarea-bordered w-full"
                        placeholder="Describe what happened..."
                        required
                      />
                    </FormField>

                    <FormField label="Important">
                      <input
                        type="checkbox"
                        checked={diaryDraft.isImportant}
                        onChange={(e) => setDiaryDraft(prev => ({ ...prev, isImportant: e.target.checked }))}
                        className="checkbox"
                      />
                      <span className="ml-2 text-sm">Mark as important</span>
                    </FormField>

                    <FormField label="Linked Entities">
                      <div className="space-y-2">
                        <Button
                          type="button"
                          onClick={() => setIsEntitySelectorOpen(true)}
                          className="btn btn-outline btn-sm"
                        >
                          Add Linked Entity
                        </Button>
                        {diaryDraft.linkedEntities.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {diaryDraft.linkedEntities.map((entity, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                <span className="capitalize">{entity.type}</span>: {entity.name}
                                <button
                                  type="button"
                                  onClick={() => removeLinkedEntity(entity.id)}
                                  className="ml-1 text-xs hover:text-red-600"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormField>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      type="button"
                      onClick={resetDiaryForm}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="btn btn-primary"
                    >
                      {editingDiaryId ? 'Update Entry' : 'Add Entry'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Entity Selector Modal */}
          {isEntitySelectorOpen && (
            <EntitySelectorModal
              isOpen={isEntitySelectorOpen}
              onClose={() => setIsEntitySelectorOpen(false)}
              onSelect={addLinkedEntity}
              campaignId={campaignId}
              sourceEntity={character ? { id: character.id.toString(), type: "character", name: character.name } : undefined}
            />
          )}
        </div>
      ),
    },
    {
      id: "attachments",
      label: "Attachments",
      content: (
        <div className="space-y-6">
          <FormSection title="Wiki Entities">
            <WikiEntitiesDisplay
              wikiEntities={wikiManagement.wikiEntities}
              entityType="character"
              entityId={character?.id ?? 0}
              showImportMessage
              onRemoveEntity={(wikiArticleId, contentType) =>
                wikiManagement.removeWikiItem(wikiArticleId, contentType, "character", character?.id)
              }
              isEditable
              removingItems={wikiManagement.removingItems}
            />
          </FormSection>

          <FormSection title="Images">
            <ImageManager
              entityType="characters"
              entityId={character?.id ?? 0}
              currentImages={imageManagement.images}
              onImagesChange={imageManagement.setImages}
            />
            {mode === "create" && !character?.id && (
              <p className="mt-2 text-sm text-base-content/70">
                Save the character to start uploading images.
              </p>
            )}
          </FormSection>
        </div>
      ),
    },
  ];

  return (
    <TabbedEntityForm
      mode={mode}
      entity={character}
      action={createOrUpdateCharacter}
      tabs={formTabs}
      title="Character"
      redirectPath={`/campaigns/${campaignId}/characters`}
      campaignId={campaignId}
      defaultTab="basic"
    />
  );
}
