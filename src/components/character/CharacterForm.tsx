"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Adventure, Campaign, Character } from "@/lib/db/schema";
import { createCharacter, updateCharacter } from "@/lib/actions/characters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit,
  EyeOff,
  Filter,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import EntitySelectorModal from "@/components/ui/entity-selector-modal";
import { ImageManager } from "@/components/ui/image-manager";
import { ImageInfo, parseImagesJson } from "@/lib/utils/imageUtils.client";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { formatUIDate } from "@/lib/utils/date";
import DiaryEntryCard from "@/components/character/DiaryEntryCard";
import type { WikiEntity } from "@/lib/types/wiki";
import type { ActionResult } from "@/lib/types/api";

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

interface DiaryEntry {
  id: number;
  description: string;
  date: string;
  linkedEntities: { id: string; type: string; name: string }[];
  isImportant?: boolean;
}

interface DiaryEntryDraft {
  description: string;
  date: string;
  linkedEntities: { id: string; type: string; name: string }[];
  isImportant: boolean;
}

interface CharacterFormProps {
  character?: Character & {
    adventure?: Adventure | null;
    campaign?: Campaign | null;
    magicItems?: MagicItemSummary[];
    wikiEntities?: WikiEntity[];
  };
  campaignId: number;
  adventureId?: number;
  mode: "create" | "edit";
}

interface ClassEntry {
  name: string;
  level: number;
}

interface CharacterFormState {
  name: string;
  race: string;
  background: string;
  alignment: string;
  description: string;
  characterType: "player" | "npc" | "monster";
  campaignId: number;
  adventureId?: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  classes: ClassEntry[];
  images: ImageInfo[];
}

const DEFAULT_ALIGNMENT = "True Neutral";

const abilityFields = [
  { key: "strength", label: "Strength" },
  { key: "dexterity", label: "Dexterity" },
  { key: "constitution", label: "Constitution" },
  { key: "intelligence", label: "Intelligence" },
  { key: "wisdom", label: "Wisdom" },
  { key: "charisma", label: "Charisma" },
] as const;

const alignmentOptions = [
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "True Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil",
];

const characterTypeOptions: Array<{
  label: string;
  value: "player" | "npc" | "monster";
  serverValue: "pc" | "npc" | "monster";
}> = [
  { label: "Player Character", value: "player", serverValue: "pc" },
  { label: "NPC", value: "npc", serverValue: "npc" },
  { label: "Monster", value: "monster", serverValue: "monster" },
];

function parseStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

function parseClasses(value: unknown): ClassEntry[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed
            .filter(
              (item): item is ClassEntry =>
                Boolean(
                  item &&
                    typeof item === "object" &&
                    "name" in item &&
                    "level" in item,
                ),
            )
            .map((item) => ({
              name: String(
                (item as { name?: unknown }).name ?? "",
              ).trim(),
              level:
                Number((item as { level?: unknown }).level ?? 1) > 0
                  ? Number((item as { level?: unknown }).level ?? 1)
                  : 1,
            }))
        : [];
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is ClassEntry =>
          Boolean(
            item &&
              typeof item === "object" &&
              "name" in item &&
              "level" in item,
          ),
      )
      .map((item) => ({
        name: String((item as { name?: unknown }).name ?? "").trim(),
        level:
          Number((item as { level?: unknown }).level ?? 1) > 0
            ? Number((item as { level?: unknown }).level ?? 1)
            : 1,
      }));
  }

  return [];
}

function mapCharacterToState(
  campaignId: number,
  adventureId: number | undefined,
  character?: CharacterFormProps["character"],
): CharacterFormState {
  if (!character) {
    return {
      name: "",
      race: "",
      background: "",
      alignment: DEFAULT_ALIGNMENT,
      description: "",
      characterType: "player",
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
      classes: [],
      images: [],
    };
  }

  const typeOption = characterTypeOptions.find(
    (option) => option.serverValue === (character.characterType ?? "pc"),
  );

  return {
    name: character.name ?? "",
    race: character.race ?? "",
    background: character.background ?? "",
    alignment: character.alignment ?? DEFAULT_ALIGNMENT,
    description: character.description ?? "",
    characterType: typeOption?.value ?? "player",
    campaignId,
    adventureId: character.adventureId ?? adventureId,
    strength: character.strength ?? 10,
    dexterity: character.dexterity ?? 10,
    constitution: character.constitution ?? 10,
    intelligence: character.intelligence ?? 10,
    wisdom: character.wisdom ?? 10,
    charisma: character.charisma ?? 10,
    hitPoints: character.hitPoints ?? 0,
    maxHitPoints: character.maxHitPoints ?? 0,
    armorClass: character.armorClass ?? 10,
    classes: parseClasses(character.classes),
    images: parseImagesJson(character.images),
  };
}

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
  const router = useRouter();
  const [formState, setFormState] = useState<CharacterFormState>(() =>
    mapCharacterToState(campaignId, adventureId, character),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [diaryLoading, setDiaryLoading] = useState(mode === "edit");
  const [showDiaryForm, setShowDiaryForm] = useState(false);
  const [editingDiaryId, setEditingDiaryId] = useState<number | null>(null);
  const [diaryDraft, setDiaryDraft] = useState<DiaryEntryDraft>(createDiaryDraft);
  const [diarySearchQuery, setDiarySearchQuery] = useState("");
  const [diaryEntityFilter, setDiaryEntityFilter] = useState<string[]>([]);
  const [expandedDiaryEntries, setExpandedDiaryEntries] = useState<Set<number>>(new Set());
  const [isEntitySelectorOpen, setIsEntitySelectorOpen] = useState(false);
  const [manualMagicItems, setManualMagicItems] = useState<MagicItemSummary[]>(
    character?.magicItems ?? [],
  );
  const [wikiEntities, setWikiEntities] = useState<WikiEntity[]>(
    character?.wikiEntities ?? [],
  );
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (character) {
      setManualMagicItems(character.magicItems ?? []);
      setWikiEntities(character.wikiEntities ?? []);
    }
  }, [character]);

  useEffect(() => {
    if (mode !== "edit" || !character?.id) {
      setDiaryLoading(false);
      return;
    }

    const fetchDiaryEntries = async () => {
      try {
        const response = await fetch(`/api/characters/${character.id}/diary`);
        if (!response.ok) {
          throw new Error("Failed to load diary entries");
        }
        const entries = (await response.json()) as DiaryEntry[];
        setDiaryEntries(entries);
      } catch (error) {
        console.error("Error fetching diary entries:", error);
        toast.error("Failed to load diary entries");
      } finally {
        setDiaryLoading(false);
      }
    };

    void fetchDiaryEntries();
  }, [mode, character?.id]);

  const renderFieldError = (field: string) =>
    errors[field] ? (
      <p className="mt-1 text-sm text-destructive">{errors[field]}</p>
    ) : null;

  const updateFormState = <K extends keyof CharacterFormState>(
    key: K,
    value: CharacterFormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleAbilityChange = (
    key: (typeof abilityFields)[number]["key"],
    value: number,
  ) => {
    updateFormState(key, Number.isFinite(value) ? value : 10);
  };

  const updateClassEntry = (index: number, entry: ClassEntry) => {
    updateFormState(
      "classes",
      formState.classes.map((existing, idx) => (idx === index ? entry : existing)),
    );
  };

  const removeClassEntry = (index: number) => {
    updateFormState(
      "classes",
      formState.classes.filter((_, idx) => idx !== index),
    );
  };

  const handleImagesChange = (images: ImageInfo[]) => {
    updateFormState("images", images);
  };

  const toggleDiaryExpand = (entryId: number) => {
    setExpandedDiaryEntries((prev) => {
      const updated = new Set(prev);
      if (updated.has(entryId)) {
        updated.delete(entryId);
      } else {
        updated.add(entryId);
      }
      return updated;
    });
  };

  const highlightSearchTerms = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) {
      return text;
    }
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={`${part}-${index}`} className="rounded bg-yellow-200 px-0.5">
          {part}
        </mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      ),
    );
  };

  const filteredDiaryEntries = useMemo(() => {
    return diaryEntries.filter((entry) => {
      const matchesQuery =
        !diarySearchQuery.trim() ||
        entry.description.toLowerCase().includes(diarySearchQuery.toLowerCase()) ||
        entry.linkedEntities?.some((entity) =>
          entity.name.toLowerCase().includes(diarySearchQuery.toLowerCase()),
        );

      const matchesEntityFilter =
        diaryEntityFilter.length === 0 ||
        entry.linkedEntities?.some((entity) => diaryEntityFilter.includes(entity.type));

      return matchesQuery && matchesEntityFilter;
    });
  }, [diaryEntries, diarySearchQuery, diaryEntityFilter]);

  const handleDiaryDelete = async (entryId: number) => {
    if (!character?.id) {
      return;
    }

    const confirmed =
      typeof window === "undefined" || window.confirm("Delete this diary entry?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/characters/${character.id}/diary/${entryId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete diary entry");
      }
      setDiaryEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      toast.success("Diary entry deleted");
    } catch (error) {
      console.error("Error deleting diary entry:", error);
      toast.error("Failed to delete diary entry");
    }
  };

  const startDiaryEdit = (entry: DiaryEntry) => {
    setEditingDiaryId(entry.id);
    setDiaryDraft({
      description: entry.description,
      date: entry.date,
      linkedEntities: entry.linkedEntities ?? [],
      isImportant: Boolean(entry.isImportant),
    });
    setShowDiaryForm(true);
  };

  const resetDiaryForm = () => {
    setEditingDiaryId(null);
    setDiaryDraft(createDiaryDraft());
    setShowDiaryForm(false);
  };

  const saveDiaryEntry = async () => {
    if (!character?.id) {
      toast.error("Save the character before adding diary entries.");
      return;
    }

    if (!diaryDraft.description.trim()) {
      toast.error("Diary description is required");
      return;
    }

    const payload = {
      ...diaryDraft,
      linkedEntities: diaryDraft.linkedEntities,
    };

    const endpoint = editingDiaryId
      ? `/api/characters/${character.id}/diary/${editingDiaryId}`
      : `/api/characters/${character.id}/diary`;

    try {
      const response = await fetch(endpoint, {
        method: editingDiaryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save diary entry");
      }

      const savedEntry = (await response.json()) as DiaryEntry;
      setDiaryEntries((prev) => {
        if (editingDiaryId) {
          return prev.map((entry) => (entry.id === editingDiaryId ? savedEntry : entry));
        }
        return [savedEntry, ...prev];
      });

      toast.success(editingDiaryId ? "Diary entry updated" : "Diary entry added");
      resetDiaryForm();
    } catch (error) {
      console.error("Error saving diary entry:", error);
      toast.error("Failed to save diary entry");
    }
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

  const handleManualMagicItemRemoval = async (magicItemId: number) => {
    if (!character?.id) {
      return;
    }

    const guardKey = `manual-${magicItemId}`;
    if (removingItems.has(guardKey)) {
      return;
    }

    setRemovingItems((prev) => new Set(prev).add(guardKey));

    try {
      const response = await fetch(
        `/api/magic-items/${magicItemId}/assign/${character.id}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        throw new Error("Failed to unassign magic item");
      }
      setManualMagicItems((prev) => prev.filter((item) => item.id !== magicItemId));
      toast.success("Magic item unassigned");
    } catch (error) {
      console.error("Error unassigning magic item:", error);
      toast.error("Failed to unassign magic item");
    } finally {
      setRemovingItems((prev) => {
        const updated = new Set(prev);
        updated.delete(guardKey);
        return updated;
      });
    }
  };

  const handleWikiEntityRemoval = async (entityId: number, contentType: string) => {
    if (!character?.id) {
      return;
    }

    const guardKey = `${contentType}-${entityId}`;
    if (removingItems.has(guardKey)) {
      return;
    }

    setRemovingItems((prev) => new Set(prev).add(guardKey));

    try {
      const response = await fetch(`/api/wiki-articles/${entityId}/entities`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "character", entityId: character.id }),
      });

      if (!response.ok && response.status !== 404) {
        throw new Error("Failed to remove wiki entity");
      }

      setWikiEntities((prev) => prev.filter((entity) => entity.id !== entityId));
      toast.success("Wiki entity removed");
    } catch (error) {
      console.error("Error removing wiki entity:", error);
      toast.error("Failed to remove wiki entity");
    } finally {
      setRemovingItems((prev) => {
        const updated = new Set(prev);
        updated.delete(guardKey);
        return updated;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = new FormData();
      const typeOption = characterTypeOptions.find(
        (option) => option.value === formState.characterType,
      );
      const serverType = typeOption?.serverValue ?? "pc";

      payload.append("campaignId", String(formState.campaignId));
      if (formState.adventureId) {
        payload.append("adventureId", String(formState.adventureId));
      }
      payload.append("characterType", serverType);
      payload.append("name", formState.name.trim());
      payload.append("race", formState.race.trim());
      payload.append("background", formState.background.trim());
      payload.append("alignment", formState.alignment.trim());
      payload.append("description", formState.description.trim());
      payload.append("strength", String(formState.strength));
      payload.append("dexterity", String(formState.dexterity));
      payload.append("constitution", String(formState.constitution));
      payload.append("intelligence", String(formState.intelligence));
      payload.append("wisdom", String(formState.wisdom));
      payload.append("charisma", String(formState.charisma));
      payload.append("hitPoints", String(formState.hitPoints));
      payload.append("maxHitPoints", String(formState.maxHitPoints));
      payload.append("armorClass", String(formState.armorClass));
      payload.append("classes", JSON.stringify(formState.classes));
      payload.append("images", JSON.stringify(formState.images));

      const result: ActionResult =
        mode === "create"
          ? await createCharacter(payload)
          : character
            ? await updateCharacter(character.id, payload)
            : { success: false, message: "Character not found" };

      if (!result?.success) {
        if (result?.errors) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(result.errors).forEach(([fieldName, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[fieldName] = messages[0];
            }
          });
          setErrors(fieldErrors);
        }
        toast.error(result?.message ?? "Failed to save character");
        return;
      }

      toast.success(
        mode === "create"
          ? "Character created successfully"
          : "Character updated successfully",
      );
      router.push(`/campaigns/${campaignId}/characters`);
    } catch (error) {
      console.error("Error saving character:", error);
      toast.error("Failed to save character");
      setErrors({ submit: "Failed to save character. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="abilities">Abilities</TabsTrigger>
          <TabsTrigger value="diary">Diary</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formState.name}
                    onChange={(event) => updateFormState("name", event.target.value)}
                    required
                  />
                  {renderFieldError("name")}
                </div>
                <div>
                  <Label htmlFor="characterType">Type</Label>
                  <Select
                    value={formState.characterType}
                    onValueChange={(value) =>
                      updateFormState("characterType", value as CharacterFormState["characterType"])
                    }
                  >
                    <SelectTrigger>
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
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="race">Race</Label>
                  <Input
                    id="race"
                    value={formState.race}
                    onChange={(event) => updateFormState("race", event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="alignment">Alignment</Label>
                  <Select
                    value={formState.alignment}
                    onValueChange={(value) => updateFormState("alignment", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      {alignmentOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="background">Background</Label>
                  <Textarea
                    id="background"
                    value={formState.background}
                    onChange={(event) => updateFormState("background", event.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formState.description}
                    onChange={(event) => updateFormState("description", event.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abilities">
          <Card>
            <CardHeader>
              <CardTitle>Ability Scores &amp; Combat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {abilityFields.map(({ key, label }) => (
                  <div key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="number"
                      min={1}
                      max={30}
                      value={formState[key]}
                      onChange={(event) =>
                        handleAbilityChange(key, Number(event.target.value) || 10)
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="hitPoints">Current Hit Points</Label>
                  <Input
                    id="hitPoints"
                    type="number"
                    min={0}
                    value={formState.hitPoints}
                    onChange={(event) =>
                      updateFormState("hitPoints", Number(event.target.value) || 0)
                    }
                  />
                  {renderFieldError("hitPoints")}
                </div>
                <div>
                  <Label htmlFor="maxHitPoints">Max Hit Points</Label>
                  <Input
                    id="maxHitPoints"
                    type="number"
                    min={0}
                    value={formState.maxHitPoints}
                    onChange={(event) =>
                      updateFormState("maxHitPoints", Number(event.target.value) || 0)
                    }
                  />
                  {renderFieldError("maxHitPoints")}
                </div>
                <div>
                  <Label htmlFor="armorClass">Armor Class</Label>
                  <Input
                    id="armorClass"
                    type="number"
                    min={0}
                    value={formState.armorClass}
                    onChange={(event) =>
                      updateFormState("armorClass", Number(event.target.value) || 10)
                    }
                  />
                  {renderFieldError("armorClass")}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diary" className="space-y-4">
          {mode === "create" && !character?.id ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Save the character before adding diary entries.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end">
                {!showDiaryForm && (
                  <Button type="button" size="sm" onClick={() => setShowDiaryForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add diary entry
                  </Button>
                )}
              </div>

              {showDiaryForm && (
                <Card className="border-primary/40">
                  <CardHeader>
                    <CardTitle>{editingDiaryId ? "Edit Diary Entry" : "New Diary Entry"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="diary-date">Date</Label>
                        <Input
                          id="diary-date"
                          type="date"
                          value={diaryDraft.date}
                          onChange={(event) =>
                            setDiaryDraft((prev) => ({ ...prev, date: event.target.value }))
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input
                          id="diary-important"
                          type="checkbox"
                          className="h-4 w-4"
                          checked={diaryDraft.isImportant}
                          onChange={(event) =>
                            setDiaryDraft((prev) => ({
                              ...prev,
                              isImportant: event.target.checked,
                            }))
                          }
                        />
                        <Label htmlFor="diary-important" className="text-sm">
                          Mark as important
                        </Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="diary-description">Notes *</Label>
                      <Textarea
                        id="diary-description"
                        rows={4}
                        value={diaryDraft.description}
                        onChange={(event) =>
                          setDiaryDraft((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Linked entities</Label>
                      {diaryDraft.linkedEntities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {diaryDraft.linkedEntities.map((entity) => (
                            <Badge
                              key={`${entity.type}-${entity.id}`}
                              variant="outline"
                              className="gap-2"
                            >
                              <span className="text-xs uppercase text-muted-foreground">
                                {entity.type.replace("-", " ")}
                              </span>
                              {entity.name}
                              <button
                                type="button"
                                onClick={() => removeLinkedEntity(entity.id)}
                                aria-label="Remove linked entity"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No linked entities yet. Connect entries to characters, quests, or locations for quick reference.
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEntitySelectorOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add linked entity
                      </Button>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={resetDiaryForm}>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={saveDiaryEntry}
                        disabled={!diaryDraft.description.trim()}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {editingDiaryId ? "Update" : "Save"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <EntitySelectorModal
                campaignId={campaignId}
                isOpen={isEntitySelectorOpen}
                onClose={() => setIsEntitySelectorOpen(false)}
                onSelect={addLinkedEntity}
                title="Link Entity"
                selectLabel="Entity"
                excludedEntities={diaryDraft.linkedEntities}
                sourceEntity={
                  character
                    ? { id: character.id.toString(), type: "character", name: character.name }
                    : undefined
                }
              />

              {diaryLoading ? (
                <Card>
                  <CardContent className="space-y-3 py-6">
                    {[1, 2, 3].map((skeleton) => (
                      <div key={skeleton} className="h-20 animate-pulse rounded-md bg-muted" />
                    ))}
                  </CardContent>
                </Card>
              ) : filteredDiaryEntries.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    {diaryEntries.length === 0
                      ? "No diary entries yet. Add one to start chronicling their journey."
                      : "No entries match your filters."}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="space-y-3">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={diarySearchQuery}
                          onChange={(event) => setDiarySearchQuery(event.target.value)}
                          placeholder="Search diary entries..."
                          className="pl-9"
                        />
                        {diarySearchQuery && (
                          <button
                            type="button"
                            aria-label="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setDiarySearchQuery("")}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const entityTypes = new Set<string>();
                          diaryEntries.forEach((entry) => {
                            entry.linkedEntities?.forEach((entity) => entityTypes.add(entity.type));
                          });
                          return Array.from(entityTypes)
                            .sort()
                            .map((entityType) => {
                              const selected = diaryEntityFilter.includes(entityType);
                              return (
                                <button
                                  key={entityType}
                                  type="button"
                                  className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors ${
                                    selected
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border text-muted-foreground hover:bg-muted"
                                  }`}
                                  onClick={() =>
                                    setDiaryEntityFilter((prev) =>
                                      selected
                                        ? prev.filter((type) => type !== entityType)
                                        : [...prev, entityType],
                                    )
                                  }
                                >
                                  <Filter className="h-3 w-3" />
                                  {entityType.replace("-", " ")}
                                </button>
                              );
                            });
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    {filteredDiaryEntries
                      .slice()
                      .sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                      )
                      .map((entry, index) => (
                        <Card key={entry.id}>
                          <CardContent className="py-2">
                            <DiaryEntryCard
                              entry={entry}
                              isFirst={index === 0}
                              onEdit={() => startDiaryEdit(entry)}
                              onDelete={() => handleDiaryDelete(entry.id)}
                              isTextExpanded={expandedDiaryEntries.has(entry.id)}
                              onToggleTextExpanded={toggleDiaryExpand}
                              onEntityClick={(entity) => {
                                const routes: Record<string, string> = {
                                  character: `/campaigns/${campaignId}/characters/${entity.id}`,
                                  location: `/campaigns/${campaignId}/locations/${entity.id}`,
                                  session: `/campaigns/${campaignId}/sessions/${entity.id}`,
                                  quest: `/campaigns/${campaignId}/quests/${entity.id}`,
                                  "magic-item": `/campaigns/${campaignId}/magic-items/${entity.id}`,
                                  adventure: `/campaigns/${campaignId}/adventures/${entity.id}`,
                                };
                                const route = routes[entity.type];
                                if (route) {
                                  router.push(route);
                                }
                              }}
                              highlightSearchTerms={highlightSearchTerms}
                              searchQuery={diarySearchQuery}
                            />
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Magic Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {manualMagicItems.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Sparkles className="mx-auto mb-3 h-10 w-10" />
                  No magic items assigned to this character yet.
                </div>
              ) : (
                manualMagicItems.map((item) => {
                  const guardKey = `manual-${item.id}`;
                  const isRemoving = removingItems.has(guardKey);
                  return (
                    <Card key={item.id} className="border border-emerald-200">
                      <CardContent className="relative py-4">
                        <div className="pr-8">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-lg font-semibold text-foreground">
                              {item.name}
                            </span>
                            {item.rarity && (
                              <Badge variant="outline" className="text-xs">
                                {item.rarity}
                              </Badge>
                            )}
                            {item.type && (
                              <Badge variant="secondary" className="text-xs">
                                {item.type}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {item.source && <p>Source: {item.source}</p>}
                            {item.assignedAt && (
                              <p>Assigned: {formatUIDate(item.assignedAt)}</p>
                            )}
                          </div>
                          {item.description && (
                            <div className="mt-2">
                              <MarkdownRenderer content={item.description} className="prose-sm" />
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isRemoving}
                          onClick={() => handleManualMagicItemRemoval(item.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
                          aria-label="Unassign magic item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wiki Entities</CardTitle>
            </CardHeader>
            <CardContent>
              {wikiEntities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No wiki entities linked to this character.
                </p>
              ) : (
                <WikiEntitiesDisplay
                  wikiEntities={wikiEntities}
                  entityType="character"
                  entityId={character?.id ?? 0}
                  showImportMessage
                  onRemoveEntity={handleWikiEntityRemoval}
                  isEditable
                  removingItems={removingItems}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageManager
                entityType="characters"
                entityId={character?.id ?? 0}
                currentImages={formState.images}
                onImagesChange={handleImagesChange}
              />
              {mode === "create" && !character?.id && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Save the character to start uploading images.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {errors.submit && (
        <p className="text-center text-sm text-destructive">{errors.submit}</p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting} size="sm" variant="secondary">
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Update"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.back()}
          size="sm"
        >
          <EyeOff className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
