"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Character, Adventure, Campaign } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  X,
  Save,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Search,
  Filter,
  Calendar,
  Package,
  Sparkles,
  Gem,
} from "lucide-react";
import { createCharacter, updateCharacter } from "@/lib/actions/characters";
import { ImageManager } from "@/components/ui/image-manager";
import { ImageInfo, parseImagesJson } from "@/lib/utils/imageUtils.client";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import WikiContent from "@/components/ui/wiki-content";
import { formatUIDate } from "@/lib/utils/date";
import { toast } from "sonner";
import EntitySelectorModal from "@/components/ui/entity-selector-modal";

interface DiaryEntry {
  id: number;
  description: string;
  date: string;
  linkedEntities: { id: string; type: string; name: string }[];
  isImportant?: boolean;
}

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
      importedFrom?: string;
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
  mode: "create" | "edit";
}

interface FormData {
  name: string;
  race: string;
  description: string;
  characterType: "player" | "npc";
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
  spells: string[];
  tags: string[];
  classes: Array<{ name: string; level: number }>;
  items: Array<{ title: string; description: string }>;

  // Relationships
  npcRelationships: Array<{ name: string; type: string; description: string }>;

  // Images
  images: ImageInfo[];
}

export default function CharacterForm({
  character,
  campaignId,
  adventureId,
  mode,
}: CharacterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Diary entries state
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [entryFormData, setEntryFormData] = useState<Omit<DiaryEntry, 'id'>>({
    description: "",
    date: new Date().toISOString().split('T')[0],
    linkedEntities: [],
    isImportant: false,
  });
  const [isEntitySelectorOpen, setIsEntitySelectorOpen] = useState(false);
  const [diarySearchQuery, setDiarySearchQuery] = useState("");
  const [diaryEntityFilter, setDiaryEntityFilter] = useState<string[]>([]);

  // Item modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemFormData, setItemFormData] = useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "",
  });

  // Expanded items state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Text expansion state for diary descriptions
  const [expandedTexts, setExpandedTexts] = useState<Set<number>>(new Set());

  // Loading states for remove operations
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    if (!expandedItems) return;
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleTextExpanded = (entryId: number) => {
    const newExpanded = new Set(expandedTexts);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedTexts(newExpanded);
  };

  // Initialize form data
  const [formData, setFormData] = useState<FormData>(() => {
    if (mode === "edit" && character) {
      const parseJsonArray = (json: unknown): string[] => {
        if (typeof json === "string") {
          try {
            return JSON.parse(json);
          } catch {
            return [];
          }
        }
        return Array.isArray(json) ? json : [];
      };

      const parseJsonObjectArray = (
        json: unknown,
      ): Array<{ name: string; type: string; description: string }> => {
        if (typeof json === "string") {
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
        name: character.name || "",
        race: character.race || "",
        alignment: character.alignment || "True Neutral",
        description: character.description || "",
        characterType:
          (character.characterType === "pc"
            ? "player"
            : (character.characterType as "player" | "npc")) || "player",
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

        personalityTraits: character.personalityTraits || "",
        ideals: character.ideals || "",
        bonds: character.bonds || "",
        flaws: character.flaws || "",
        backstory: character.backstory || "",

        equipment: parseJsonArray(character.equipment),
        weapons: parseJsonArray(character.weapons),
        spells: parseJsonArray(character.spells),
        tags: parseJsonArray(character.tags),

        npcRelationships: parseJsonObjectArray(character.npcRelationships),
        classes: (() => {
          try {
            const parsed =
              typeof character.classes === "string"
                ? JSON.parse(character.classes)
                : character.classes;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })(),

        items: [],

        spellcastingAbility: character.spellcastingAbility || "",
        spellSaveDc: character.spellSaveDc || 0,
        spellAttackBonus: character.spellAttackBonus || 0,
        images: parseImagesJson(character.images),
      };
    }

    return {
      name: "",
      race: "",
      alignment: "True Neutral",
      description: "",
      characterType: "player" as "player" | "npc",
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

      personalityTraits: "",
      ideals: "",
      bonds: "",
      flaws: "",
      backstory: "",

      equipment: [],
      weapons: [],
      spells: [],
      tags: [],

      npcRelationships: [],
      classes: [],

      items: [],

      spellcastingAbility: "",
      spellSaveDc: 0,
      spellAttackBonus: 0,
      images: [],
    };
  });

  // Database magic items state - initialize from character prop
  const [dbMagicItems, setDbMagicItems] = useState<
    Array<{
      id: number;
      assignmentId?: number;
      name: string;
      rarity: string | null;
      type: string | null;
      description: string | null;
      source?: string | null;
      notes?: string | null;
      assignedAt?: string | null;
    }>
  >(character?.magicItems || []);

  // Wiki entities state - initialize from character prop
  const [wikiSpells, setWikiSpells] = useState<
    Array<{
      id: number;
      name: string;
      level: number;
      school: string;
      description: string;
      isPrepared?: boolean;
      isKnown?: boolean;
    }>
  >(
    character?.wikiEntities
      ?.filter((entity) => entity.contentType === "spell")
      .map((spell) => ({
        id: spell.id,
        name: spell.title,
        level: (spell.parsedData as { level?: number })?.level || 0,
        school: (spell.parsedData as { school?: string })?.school || "common",
        description: spell.description || "", // Use description field (mapped from rawContent)
        isPrepared: Boolean(
          (spell.relationshipData as { isPrepared?: boolean })?.isPrepared,
        ),
        isKnown: Boolean(
          (spell.relationshipData as { isKnown?: boolean })?.isKnown,
        ),
      })) || [],
  );

  const [wikiMonsters, setWikiMonsters] = useState<
    Array<{
      id: number;
      name: string;
      type: string;
      challengeRating: string;
      description: string;
      relationshipType?: string;
    }>
  >(
    character?.wikiEntities
      ?.filter((entity) => entity.contentType === "monster")
      .map((monster) => ({
        id: monster.id,
        name: monster.title,
        type: monster.contentType,
        challengeRating:
          (monster.parsedData as { challengeRating?: string })
            ?.challengeRating || "",
        description: monster.description || "", // Use description field (mapped from rawContent)
        relationshipType: monster.relationshipType,
      })) || [],
  );

  const [magicItems, setMagicItems] = useState<
    Array<{
      id: number;
      name: string;
      rarity: string;
      type: string;
      description: string;
      importedFrom?: string;
    }>
  >(
    character?.wikiEntities
      ?.filter((entity) => entity.contentType === "magic-item")
      .map((item) => ({
        id: item.id,
        name: item.title,
        rarity: (item.parsedData as { rarity?: string })?.rarity || "",
        type: item.contentType,
        description: item.description || "",
        importedFrom: item.importedFrom,
      })) || [],
  );

  const [otherWikiItems, setOtherWikiItems] = useState<
    Array<{
      id: number;
      name: string;
      contentType: string;
      description: string;
    }>
  >(
    character?.wikiEntities
      ?.filter(
        (entity) =>
          !["spell", "monster", "magic-item"].includes(entity.contentType),
      )
      .map((item) => ({
        id: item.id,
        name: item.title,
        contentType: item.contentType,
        description: item.description || "", // Use description field (mapped from rawContent)
      })) || [],
  );

  const handleImagesChange = (images: ImageInfo[]) => {
    setFormData((prev) => ({
      ...prev,
      images,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const submitFormData = new FormData();

      // Map characterType from 'player'/'npc' to 'pc'/'npc'
      const mappedCharacterType =
        formData.characterType === "player" ? "pc" : formData.characterType;

      // Add all form data to FormData object
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "characterType") {
          submitFormData.append(key, mappedCharacterType);
        } else if (Array.isArray(value)) {
          submitFormData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          submitFormData.append(key, value.toString());
        }
      });

      if (mode === "create") {
        const result = await createCharacter(submitFormData);
        if (result?.success === false) {
          if (result.errors) {
            const errorMessages: Record<string, string> = {};
            Object.entries(result.errors).forEach(([key, messages]) => {
              if (Array.isArray(messages)) {
                errorMessages[key] = messages[0] || "Invalid value";
              }
            });
            setErrors(errorMessages);
            toast.error(
              "Failed to create character. Please check the form for errors.",
            );
          } else {
            toast.error(result.message || "Failed to create character.");
          }
          return;
        }
        // Success - navigate to characters list
        toast.success("Character created successfully!");
        router.push(`/campaigns/${campaignId}/characters`);
      } else if (mode === "edit" && character) {
        const result = await updateCharacter(character.id, submitFormData);
        if (result?.success === false) {
          if (result.errors) {
            const errorMessages: Record<string, string> = {};
            Object.entries(result.errors).forEach(([key, messages]) => {
              if (Array.isArray(messages)) {
                errorMessages[key] = messages[0] || "Invalid value";
              }
            });
            setErrors(errorMessages);
            toast.error(
              "Failed to update character. Please check the form for errors.",
            );
          } else {
            toast.error(result.message || "Failed to update character.");
          }
          return;
        }
        toast.success("Character updated successfully!");
        router.push(`/campaigns/${campaignId}/characters`);
      }
    } catch (error) {
      console.error("Error saving character:", error);
      setErrors({ submit: "Failed to save character. Please try again." });
      toast.error("Failed to save character. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (
    field: keyof FormData,
    value:
      | string
      | number
      | string[]
      | Array<{ name: string; type: string; description: string }>
      | Array<{ name: string; level: number }>
      | Array<{ title: string; description: string }>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addToArray = (
    field:
      | "equipment"
      | "weapons"
      | "spells"
      | "tags",
    value: string,
  ) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      updateFormData(field, [...formData[field], value.trim()]);
    }
  };

  const removeFromArray = (
    field:
      | "equipment"
      | "weapons"
      | "spells"
      | "tags",
    index: number,
  ) => {
    updateFormData(
      field,
      formData[field].filter((_, i) => i !== index),
    );
  };

  const removeItem = (index: number) => {
    updateFormData(
      "items",
      formData.items.filter((_, i) => i !== index),
    );
  };

  const openItemModal = (index?: number) => {
    if (index !== undefined) {
      setEditingItemIndex(index);
      setItemFormData(formData.items[index]);
    } else {
      setEditingItemIndex(null);
      setItemFormData({ title: "", description: "" });
    }
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setEditingItemIndex(null);
    setItemFormData({ title: "", description: "" });
  };

  const saveItem = () => {
    if (editingItemIndex !== null) {
      // Edit existing item
      const updated = formData.items.map((item, i) =>
        i === editingItemIndex ? itemFormData : item,
      );
      updateFormData("items", updated);
    } else {
      // Add new item
      updateFormData("items", [...formData.items, itemFormData]);
    }
    closeItemModal();
  };

  // Load diary entries when in edit mode
  useEffect(() => {
    if (mode === "edit" && character) {
      fetchDiaryEntries();
    }
  }, [mode, character?.id]);

  const fetchDiaryEntries = async () => {
    if (!character) return;
    
    try {
      const response = await fetch(`/api/characters/${character.id}/diary`);
      if (response.ok) {
        const entries = await response.json();
        setDiaryEntries(entries);
      }
    } catch (error) {
      console.error("Error fetching diary entries:", error);
      toast.error("Failed to load diary entries");
    }
  };

  // Diary entry functions
  const addDiaryEntry = async () => {
    if (!entryFormData.description.trim() || !character) return;
    
    try {
      const response = await fetch(`/api/characters/${character.id}/diary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryFormData),
      });

      if (response.ok) {
        const newEntry = await response.json();
        setDiaryEntries([newEntry, ...diaryEntries]);
        setEntryFormData({
          description: "",
          date: new Date().toISOString().split('T')[0],
          linkedEntities: [],
          isImportant: false,
        });
        setIsAddingEntry(false);
        toast.success("Diary entry added");
      } else {
        toast.error("Failed to add diary entry");
      }
    } catch (error) {
      console.error("Error adding diary entry:", error);
      toast.error("Failed to add diary entry");
    }
  };

  const updateDiaryEntry = async (id: number) => {
    if (!character) return;

    try {
      const response = await fetch(`/api/characters/${character.id}/diary/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryFormData),
      });

      if (response.ok) {
        const updatedEntry = await response.json();
        setDiaryEntries(diaryEntries.map(entry =>
          entry.id === id ? updatedEntry : entry
        ));
        setEditingEntryId(null);
        setEntryFormData({
          description: "",
          date: new Date().toISOString().split('T')[0],
          linkedEntities: [],
          isImportant: false,
        });
        setIsAddingEntry(false);
        toast.success("Diary entry updated");
      } else {
        toast.error("Failed to update diary entry");
      }
    } catch (error) {
      console.error("Error updating diary entry:", error);
      toast.error("Failed to update diary entry");
    }
  };

  const deleteDiaryEntry = async (id: number) => {
    if (!character || !confirm("Are you sure you want to delete this diary entry?")) return;

    try {
      const response = await fetch(`/api/characters/${character.id}/diary/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDiaryEntries(diaryEntries.filter(entry => entry.id !== id));
        toast.success("Diary entry deleted");
      } else {
        toast.error("Failed to delete diary entry");
      }
    } catch (error) {
      console.error("Error deleting diary entry:", error);
      toast.error("Failed to delete diary entry");
    }
  };

  const startEditEntry = (entry: DiaryEntry) => {
    setEditingEntryId(entry.id);
    setEntryFormData({
      description: entry.description,
      date: entry.date,
      linkedEntities: entry.linkedEntities,
      isImportant: entry.isImportant,
    });
    setIsAddingEntry(true);
  };

  const cancelEntryForm = () => {
    setIsAddingEntry(false);
    setEditingEntryId(null);
    setEntryFormData({
      description: "",
      date: new Date().toISOString().split('T')[0],
      linkedEntities: [],
      isImportant: false,
    });
  };

  const addLinkedEntity = (entity: { id: string; type: string; name: string }) => {
    const currentEntities = Array.isArray(entryFormData.linkedEntities) ? entryFormData.linkedEntities : [];
    // Check if entity is already linked
    if (currentEntities.some(e => e.id === entity.id && e.type === entity.type)) {
      return;
    }
    setEntryFormData({
      ...entryFormData,
      linkedEntities: [...currentEntities, entity],
    });
    setIsEntitySelectorOpen(false);
  };

  const removeLinkedEntity = (entityId: string) => {
    setEntryFormData({
      ...entryFormData,
      linkedEntities: entryFormData.linkedEntities.filter(e => e.id !== entityId),
    });
  };

  const addRelationship = () => {
    updateFormData("npcRelationships", [
      ...formData.npcRelationships,
      { name: "", type: "", description: "" },
    ]);
  };

  const updateRelationship = (
    index: number,
    field: "name" | "type" | "description",
    value: string,
  ) => {
    const updated = formData.npcRelationships.map((rel, i) =>
      i === index ? { ...rel, [field]: value } : rel,
    );
    updateFormData("npcRelationships", updated);
  };

  const removeRelationship = (index: number) => {
    updateFormData(
      "npcRelationships",
      formData.npcRelationships.filter((_, i) => i !== index),
    );
  };

  const removeWikiItem = async (wikiArticleId: number, contentType: string) => {
    const itemKey = `${contentType}-${wikiArticleId}`;

    // Prevent multiple simultaneous removals of the same item
    if (removingItems.has(itemKey)) {
      return;
    }

    setRemovingItems((prev) => new Set(prev).add(itemKey));

    console.log("removeWikiItem called:", {
      wikiArticleId,
      contentType,
      characterId: character?.id,
    });

    if (!character?.id) {
      console.error("Character ID is undefined");
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/wiki-articles/${wikiArticleId}/entities`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entityType: "character",
            entityId: character.id,
          }),
        },
      );

      console.log("API response status:", response.status);
      console.log("API response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);

        // Treat 404 as success (item already removed)
        if (response.status === 404) {
          console.log("Item already removed (404), treating as success");
        } else {
          throw new Error(`Failed to remove wiki item: ${errorText}`);
        }
      }

      const result = response.ok ? await response.json() : null;
      if (result) {
        console.log("API success result:", result);
      }

      // Update local state based on content type
      if (contentType === "spell") {
        setWikiSpells((prev) =>
          prev.filter((spell) => spell.id !== wikiArticleId),
        );
      } else if (contentType === "monster") {
        setWikiMonsters((prev) =>
          prev.filter((monster) => monster.id !== wikiArticleId),
        );
      } else if (contentType === "magic-item") {
        setMagicItems((prev) =>
          prev.filter((item) => item.id !== wikiArticleId),
        );
      } else {
        // Handle other content types
        setOtherWikiItems((prev) =>
          prev.filter((item) => item.id !== wikiArticleId),
        );
      }
    } catch (error) {
      console.error("Error removing wiki item:", error);
      toast.error("Failed to remove wiki item. Please try again.");
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  const removeDbMagicItem = async (magicItemId: number) => {
    const itemKey = `db-magic-item-${magicItemId}`;

    // Prevent multiple simultaneous removals of the same item
    if (removingItems.has(itemKey)) {
      return;
    }

    setRemovingItems((prev) => new Set(prev).add(itemKey));

    console.log("removeDbMagicItem called:", {
      magicItemId,
      characterId: character?.id,
    });

    if (!character?.id) {
      console.error("Character ID is undefined");
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/magic-items/${magicItemId}/assign/${character.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to unassign magic item: ${errorText}`);
      }

      // Update local state - remove the item from dbMagicItems
      setDbMagicItems((prev) =>
        prev.filter((item) => item.id !== magicItemId),
      );

      toast.success("Magic item unassigned successfully!");
    } catch (error) {
      console.error("Error unassigning magic item:", error);
      toast.error("Failed to unassign magic item. Please try again.");
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  // Helper function to highlight search terms
  const highlightSearchTerms = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Handle clicking on linked entities
  const handleEntityClick = (entity: { id: string; type: string; name: string }) => {
    // Navigate to the appropriate entity page based on type
    const entityRoutes: Record<string, string> = {
      'character': `/campaigns/${campaignId}/characters/${entity.id}`,
      'location': `/campaigns/${campaignId}/locations/${entity.id}`,
      'session': `/campaigns/${campaignId}/sessions/${entity.id}`,
      'quest': `/campaigns/${campaignId}/quests/${entity.id}`,
      'magic-item': `/campaigns/${campaignId}/magic-items/${entity.id}`,
      'adventure': `/campaigns/${campaignId}/adventures/${entity.id}`,
    };

    const route = entityRoutes[entity.type];
    if (route) {
      router.push(route);
    }
  };

  // Filter diary entries based on search query and entity filter (client-side only)
  const filteredDiaryEntries = useMemo(() => {
    return diaryEntries.filter((entry) => {
      // Content search filter
      const contentMatches = !diarySearchQuery.trim() ||
        entry.description?.toLowerCase().includes(diarySearchQuery.toLowerCase()) ||
        entry.linkedEntities?.some(entity => entity.name.toLowerCase().includes(diarySearchQuery.toLowerCase()));

      // Entity type filter
      const entityMatches = diaryEntityFilter.length === 0 ||
        entry.linkedEntities?.some(entity => diaryEntityFilter.includes(entity.type));

      return contentMatches && entityMatches;
    });
  }, [diaryEntries, diarySearchQuery, diaryEntityFilter]);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="abilities">Abilities</TabsTrigger>
            <TabsTrigger value="diary">Diary</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="spells">Spells</TabsTrigger>
            <TabsTrigger value="wiki">Wiki Entities</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateFormData("name", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="characterType">Type</Label>
                    <Select
                      defaultValue={formData.characterType}
                      name="characterType"
                      onValueChange={(value) =>
                        updateFormData(
                          "characterType",
                          value as "player" | "npc",
                        )
                      }
                    >
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateFormData("race", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="alignment">Alignment</Label>
                    <Select
                      value={formData.alignment}
                      name="alignment"
                      onValueChange={(value) =>
                        updateFormData("alignment", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lawful Good">Lawful Good</SelectItem>
                        <SelectItem value="Neutral Good">
                          Neutral Good
                        </SelectItem>
                        <SelectItem value="Chaotic Good">
                          Chaotic Good
                        </SelectItem>
                        <SelectItem value="Lawful Neutral">
                          Lawful Neutral
                        </SelectItem>
                        <SelectItem value="True Neutral">
                          True Neutral
                        </SelectItem>
                        <SelectItem value="Chaotic Neutral">
                          Chaotic Neutral
                        </SelectItem>
                        <SelectItem value="Lawful Evil">Lawful Evil</SelectItem>
                        <SelectItem value="Neutral Evil">
                          Neutral Evil
                        </SelectItem>
                        <SelectItem value="Chaotic Evil">
                          Chaotic Evil
                        </SelectItem>
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
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => {
                            const updated = [...formData.classes];
                            updated[index] = {
                              ...updated[index],
                              name: e.target.value,
                            };
                            updateFormData("classes", updated);
                          }}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          placeholder="Level"
                          value={classInfo.level}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => {
                            const updated = [...formData.classes];
                            updated[index] = {
                              ...updated[index],
                              level: parseInt(e.target.value) || 1,
                            };
                            updateFormData("classes", updated);
                          }}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = formData.classes.filter(
                              (_, i) => i !== index,
                            );
                            updateFormData("classes", updated);
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
                        updateFormData("classes", [
                          ...formData.classes,
                          { name: "", level: 1 },
                        ]);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Class
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      updateFormData("description", e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abilities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ability Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: "strength", label: "Strength" },
                    { key: "dexterity", label: "Dexterity" },
                    { key: "constitution", label: "Constitution" },
                    { key: "intelligence", label: "Intelligence" },
                    { key: "wisdom", label: "Wisdom" },
                    { key: "charisma", label: "Charisma" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        type="number"
                        min="1"
                        max="30"
                        value={
                          (formData[key as keyof FormData] as number) || 10
                        }
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateFormData(
                            key as keyof FormData,
                            parseInt(e.target.value) || 10,
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Combat Basics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxHitPoints">Max Hit Points</Label>
                    <Input
                      id="maxHitPoints"
                      type="number"
                      min="0"
                      value={formData.maxHitPoints}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateFormData(
                          "maxHitPoints",
                          parseInt(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="armorClass">Armor Class</Label>
                    <Input
                      id="armorClass"
                      type="number"
                      min="-20"
                      value={formData.armorClass}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateFormData(
                          "armorClass",
                          parseInt(e.target.value) || 10,
                        )
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diary" className="space-y-4">
            {/* Add Entry Button */}
            {!isAddingEntry && (
              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  onClick={() => setIsAddingEntry(true)}
                  className="btn-sm"
                  size="sm"
                  variant="primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Diary Entry
                </Button>
              </div>
            )}

            {/* Entry Form */}
            {isAddingEntry && (
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle>{editingEntryId ? 'Edit Entry' : 'New Diary Entry'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="entryDate">Date</Label>
                    <Input
                      id="entryDate"
                      type="date"
                      value={entryFormData.date}
                      onChange={(e) => setEntryFormData({ ...entryFormData, date: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="entryDescription">Notes *</Label>
                    <Textarea
                      id="entryDescription"
                      value={entryFormData.description}
                      onChange={(e) => setEntryFormData({ ...entryFormData, description: e.target.value })}
                      rows={4}
                      placeholder="What happened during this event..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          // Allow Ctrl+Enter to save
                          return;
                        }
                        if (e.key === 'Enter' && !e.shiftKey) {
                          // Prevent Enter from submitting form, but allow Shift+Enter for new lines
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>

                  <div>
                    <Label>Linked Entities</Label>
                    <div className="space-y-2">
                      {Array.isArray(entryFormData.linkedEntities) && entryFormData.linkedEntities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {entryFormData.linkedEntities.map((entity) => (
                            <Badge key={`${entity.type}-${entity.id}`} variant="outline" className="text-xs">
                              <span className="text-gray-500 mr-1">{entity.type}:</span>
                              {entity.name}
                              <X 
                                className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" 
                                onClick={() => removeLinkedEntity(entity.id)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => setIsEntitySelectorOpen(true)}
                          className="btn-sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Linked Entity
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Link this entry to other elements from your campaign (sessions, locations, NPCs, magic items, quests, etc.)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="entryImportant"
                      className="checkbox checkbox-primary"
                      checked={entryFormData.isImportant}
                      onChange={(e) => setEntryFormData({ ...entryFormData, isImportant: e.target.checked })}
                    />
                    <Label htmlFor="entryImportant" className="cursor-pointer">
                      Mark as important
                    </Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => editingEntryId ? updateDiaryEntry(editingEntryId) : addDiaryEntry()}
                      disabled={!entryFormData.description.trim()}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingEntryId ? 'Update' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelEntryForm}
                    >
                      <EyeOff className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Entity Selector Modal */}
            <EntitySelectorModal
              campaignId={campaignId}
              isOpen={isEntitySelectorOpen}
              onClose={() => setIsEntitySelectorOpen(false)}
              onSelect={addLinkedEntity}
              title="Add to Diary Entry"
              selectLabel="Entity"
              excludedEntities={entryFormData.linkedEntities}
              sourceEntity={character ? { id: character.id.toString(), type: "character", name: character.name } : undefined}
            />

            {/* Search and Filter Controls */}
            {diaryEntries.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex flex-col space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder="Search diary entries..."
                        value={diarySearchQuery}
                        onChange={(e) => setDiarySearchQuery(e.target.value)}
                        className="pl-10 pr-10 py-3 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                        aria-label="Search diary entries"
                      />
                      {diarySearchQuery && (
                        <button
                          onClick={() => setDiarySearchQuery("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Active Filters Display */}
                    {(diaryEntityFilter.length > 0 || diarySearchQuery) && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Active filters:</span>

                        {/* Search term badge */}
                        {diarySearchQuery && (
                          <Badge variant="default" className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                            <Search className="w-3 h-3" />
                            "{diarySearchQuery}"
                            <X
                              className="w-3 h-3 cursor-pointer ml-1"
                              onClick={() => setDiarySearchQuery("")}
                              aria-label="Remove search filter"
                            />
                          </Badge>
                        )}

                        {/* Entity type badges */}
                        {diaryEntityFilter.map((entityType) => (
                          <Badge
                            key={entityType}
                            variant="default"
                            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            <Filter className="w-3 h-3" />
                            {entityType.replace('-', ' ')}
                            <X
                              className="w-3 h-3 cursor-pointer ml-1"
                              onClick={() => setDiaryEntityFilter(prev => prev.filter(type => type !== entityType))}
                              aria-label={`Remove ${entityType} filter`}
                            />
                          </Badge>
                        ))}

                        {/* Clear all button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDiarySearchQuery("");
                            setDiaryEntityFilter([]);
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
                        >
                          Clear all
                        </Button>
                      </div>
                    )}

                    {/* Entity Filter Section */}
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Filter by entity type:</span>

                        {/* Quick filter buttons for common entity types */}
                        {(() => {
                          const allEntityTypes = new Set<string>();
                          diaryEntries.forEach(entry => {
                            entry.linkedEntities?.forEach(entity => {
                              allEntityTypes.add(entity.type);
                            });
                          });

                          const commonTypes = ['character', 'location', 'session', 'quest', 'magic-item'];
                          const availableTypes = Array.from(allEntityTypes).sort();

                          return availableTypes.map((entityType) => {
                            const isSelected = diaryEntityFilter.includes(entityType);
                            return (
                              <button
                                type="button"
                                key={entityType}
                                onClick={() => {
                                  if (isSelected) {
                                    setDiaryEntityFilter(prev => prev.filter(type => type !== entityType));
                                  } else {
                                    setDiaryEntityFilter(prev => [...prev, entityType]);
                                  }
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300 shadow-sm'
                                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                }`}
                                aria-label={`${isSelected ? 'Remove' : 'Add'} ${entityType} filter`}
                              >
                                {entityType.replace('-', ' ')}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                </div>
              </div>
            )}

            {/* Diary Entries List */}
            <div className="space-y-2">
              {filteredDiaryEntries.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="text-gray-400 mb-4">
                    <Search className="w-12 h-12 mx-auto opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {diaryEntries.length === 0 ? "No diary entries yet" : "No matching entries"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {diaryEntries.length === 0
                      ? "Start documenting your character's journey by adding your first diary entry."
                      : "Try adjusting your search terms or filters to find what you're looking for."
                    }
                  </p>
                  {diaryEntries.length > 0 && (diarySearchQuery || diaryEntityFilter.length > 0) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDiarySearchQuery("");
                        setDiaryEntityFilter([]);
                      }}
                      className="text-sm"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredDiaryEntries.map((entry, index) => {
                    const entryId = `diary-${entry.id}`;
                    const isTextExpanded = expandedTexts.has(entry.id);
                    const description = entry.description || 'Untitled Entry';
                    
                    // Check if text needs truncation (more than 2 lines worth of content)
                    const needsTruncation = description.length > 150 || description.split('\n').length > 2;
                    
                    return (
                      <div
                        key={entry.id}
                        className="bg-white border border-gray-200 rounded-md p-3 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        {/* Entry Row */}
                        <div className="flex items-start gap-3">
                          {/* Date Chip */}
                          <div className="flex-shrink-0">
                            <Badge variant="warning" className="text-xs px-2 py-1">
                              {new Date(entry.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Badge>
                          </div>

                          {/* Main Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                {/* Description with line clamping */}
                                <div className="relative">
                                  <p className={`text-sm text-gray-900 leading-relaxed ${
                                    !isTextExpanded && needsTruncation ? 'line-clamp-2' : ''
                                  }`}>
                                    {highlightSearchTerms(description, diarySearchQuery)}
                                  </p>
                                  
                                  {/* Show more/less toggle */}
                                  {needsTruncation && (
                                    <button
                                      type="button"
                                      onClick={() => toggleTextExpanded(entry.id)}
                                      className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 transition-colors"
                                    >
                                      {isTextExpanded ? 'Show less' : 'Show more'}
                                    </button>
                                  )}
                                </div>

                                {/* Linked Entities */}
                                {entry.linkedEntities && entry.linkedEntities.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {entry.linkedEntities.map((entity) => (
                                      <Badge
                                        key={`${entity.type}-${entity.id}`}
                                        variant="outline"
                                        className="text-xs px-1.5 py-0.5 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                        onClick={() => handleEntityClick(entity)}
                                      >
                                        <span className="capitalize text-xs">{entity.type.replace('-', ' ')}</span>
                                        <span className="font-medium ml-1">{entity.name}</span>
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Important Badge */}
                                {entry.isImportant && (
                                  <Badge variant="warning" className="text-xs mt-2">
                                    ⭐ Important
                                  </Badge>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditEntry(entry)}
                                  className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
                                  aria-label="Edit diary entry"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.items.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <div className="text-gray-400 mb-4">
                      <Package className="w-12 h-12 mx-auto opacity-50" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No manual items yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Add custom items that don't exist in the wiki or database.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-md p-3 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {item.title || `Item ${index + 1}`}
                            </h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openItemModal(index)}
                              className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
                              aria-label="Edit item"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openItemModal()}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manual Item
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">
                  🪄 Assigned Magic Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dbMagicItems.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <div className="text-gray-400 mb-4">
                      <Sparkles className="w-12 h-12 mx-auto opacity-50" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No magic items assigned
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Assign magic items from the database to this character.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {dbMagicItems.map((item) => {
                      const itemId = `db-magic-${item.id}`;
                      const isExpanded = expandedItems?.has(itemId) || false;
                      return (
                        <div
                          key={item.id}
                          className="bg-white border border-gray-200 rounded-md p-3 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {item.name}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {item.rarity || "Unknown"}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                {item.type && (
                                  <p><strong>Type:</strong> {item.type}</p>
                                )}
                                {item.source && (
                                  <p><strong>Source:</strong> {item.source}</p>
                                )}
                                {item.assignedAt && (
                                  <p><strong>Assigned:</strong> {formatUIDate(item.assignedAt)}</p>
                                )}
                              </div>

                              {item.description && (
                                <>
                                  {!isExpanded && item.description.length > 100 && (
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                      {item.description.substring(0, 100)}...
                                    </p>
                                  )}
                                  {isExpanded && (
                                    <div className="mt-2">
                                      <MarkdownRenderer
                                        content={item.description}
                                        className="prose-sm"
                                      />
                                    </div>
                                  )}
                                  {item.description.length > 100 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleExpanded(itemId)}
                                      className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 transition-colors"
                                    >
                                      {isExpanded ? 'Show less' : 'Show more'}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDbMagicItem(item.id)}
                                disabled={removingItems.has(`db-magic-item-${item.id}`)}
                                className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
                                aria-label="Unassign magic item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">
                  💎 Magic Items from Wiki
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {magicItems.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <div className="text-gray-400 mb-4">
                      <Gem className="w-12 h-12 mx-auto opacity-50" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No wiki magic items
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Import magic items from the wiki to assign them here.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {magicItems.map((item) => {
                      const itemId = `magic-${item.id}`;
                      const isExpanded = expandedItems?.has(itemId) || false;
                      return (
                        <div
                          key={item.id}
                          className="bg-white border border-gray-200 rounded-md p-3 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {item.name}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {item.rarity}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Type:</strong> {item.type}</p>
                              </div>

                              {item.description && (
                                <>
                                  {!isExpanded && item.description.length > 100 && (
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                      {item.description.substring(0, 100)}...
                                    </p>
                                  )}
                                  {isExpanded && (
                                    <div className="mt-2">
                                      <WikiContent
                                        content={item.description}
                                        importedFrom={item.importedFrom}
                                        className="prose-sm"
                                      />
                                    </div>
                                  )}
                                  {item.description.length > 100 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleExpanded(itemId)}
                                      className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 transition-colors"
                                    >
                                      {isExpanded ? 'Show less' : 'Show more'}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeWikiItem(item.id, "magic-item")
                                }
                                disabled={removingItems.has(
                                  `magic-item-${item.id}`,
                                )}
                                className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
                                aria-label="Unassign magic item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <ImageManager
              entityType="characters"
              entityId={character?.id || 0}
              currentImages={formData.images}
              onImagesChange={handleImagesChange}
            />
          </TabsContent>

          <TabsContent value="spells" className="space-y-4">
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
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addToArray(
                            "spells",
                            (e.target as HTMLInputElement).value,
                          );
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget
                          .previousElementSibling as HTMLInputElement;
                        addToArray("spells", input.value);
                        input.value = "";
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.spells.map((spell, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {spell}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeFromArray("spells", index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">
                  📚 Spells from Wiki
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {wikiSpells.length > 0 ? (
                  <div className="space-y-3">
                    {wikiSpells.map((spell) => {
                      const itemId = `spell-${spell.id}`;
                      const isExpanded = expandedItems?.has(itemId) || false;
                      return (
                        <div
                          key={spell.id}
                          className="border border-blue-200 bg-blue-50 rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div
                              className="flex items-center gap-2 p-3 cursor-pointer hover:bg-blue-100 transition-colors flex-1"
                              onClick={() => toggleExpanded(itemId)}
                            >
                              <h4 className="font-semibold text-blue-800">
                                {spell.name}
                              </h4>
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
                              onClick={() => removeWikiItem(spell.id, "spell")}
                              disabled={removingItems.has(`spell-${spell.id}`)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Unassign
                            </Button>
                          </div>
                          <div className="px-3 pb-1 mb-2">
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>School:</strong> {spell.school}
                            </p>
                          </div>
                          {isExpanded && spell.description && (
                            <div className="px-3 pb-3">
                              <MarkdownRenderer
                                content={spell.description}
                                className="prose-sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No spells assigned from wiki imports
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wiki" className="space-y-4">
            {(() => {
              // Combine all wiki entities from local state for the WikiEntitiesDisplay
              const allWikiEntities = [
                ...wikiSpells.map((spell) => ({
                  id: spell.id,
                  title: spell.name,
                  contentType: "spell" as const,
                  wikiUrl: undefined,
                  description: spell.description,
                  parsedData: { level: spell.level, school: spell.school },
                  relationshipType: "prepared" as const,
                  relationshipData: {
                    isPrepared: spell.isPrepared,
                    isKnown: spell.isKnown,
                  },
                })),
                ...wikiMonsters.map((monster) => ({
                  id: monster.id,
                  title: monster.name,
                  contentType: "monster" as const,
                  wikiUrl: undefined,
                  description: monster.description,
                  parsedData: {
                    type: monster.type,
                    challengeRating: monster.challengeRating,
                  },
                  relationshipType: monster.relationshipType,
                  relationshipData: {},
                })),
                ...magicItems.map((item) => ({
                  id: item.id,
                  title: item.name,
                  contentType: "magic-item" as const,
                  wikiUrl: undefined,
                  description: item.description,
                  parsedData: { rarity: item.rarity, type: item.type },
                  relationshipType: "owned" as const,
                  relationshipData: {},
                })),
                ...otherWikiItems.map((item) => ({
                  id: item.id,
                  title: item.name,
                  contentType: item.contentType as "other",
                  wikiUrl: undefined,
                  description: item.description,
                  parsedData: {},
                  relationshipType: undefined,
                  relationshipData: {},
                })),
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
                  <p>
                    Use the Wiki Import page to add entities to this character.
                  </p>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>

        {errors.submit && (
          <div className="text-red-500 text-center">{errors.submit}</div>
        )}

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting} variant="primary" size="sm">
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create"
                : "Update"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => router.back()}
            disabled={isSubmitting}
            size="sm"
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
                {editingItemIndex !== null ? "Edit Item" : "Add New Item"}
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
                  onChange={(e) =>
                    setItemFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Enter item title"
                />
              </div>

              <div>
                <Label htmlFor="itemDescription">Description</Label>
                <Textarea
                  id="itemDescription"
                  value={itemFormData.description}
                  onChange={(e) =>
                    setItemFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
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
                size="sm"
              >
                <EyeOff className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveItem}
                disabled={!itemFormData.title.trim()}
                size="sm"
              >
                {editingItemIndex !== null ? "Update Item" : "Add Item"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
