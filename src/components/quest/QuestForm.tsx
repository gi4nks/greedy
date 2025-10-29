"use client";

import { useState } from "react";
import { createQuest, updateQuest } from "@/lib/actions/quests";
import { QuestFormSchema, type QuestFormData } from "@/lib/forms";
import { validateFormData } from "@/lib/forms/validation";
import { ImageManager } from "@/components/ui/image-manager";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import DiaryWrapper from "@/components/ui/diary-wrapper";
import { useWikiItemManagement } from "@/lib/utils/wikiUtils";
import { useImageManagement } from "@/lib/utils/imageFormUtils";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import { StandardEntityForm, FormSection, FormGrid } from "@/lib/forms";
import { FormField } from "@/components/ui/form-components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuestFormProps {
  quest?: {
    id: number;
    title: string;
    description?: string | null;
    adventureId?: number | null;
    status?: string | null;
    priority?: string | null;
    type?: string | null;
    dueDate?: string | null;
    assignedTo?: string | null;
    tags?: unknown;
    images?: unknown;
    wikiEntities?: WikiEntity[];
  };
  campaignId: number;
  adventures?: Array<{
    id: number;
    title: string;
    status?: string | null;
  }>;
  adventureId?: number; // For adventure-scoped creation
  mode: "create" | "edit";
}

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "paused", label: "Paused" },
];

const priorityOptions = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const typeOptions = [
  { value: "main", label: "Main Quest" },
  { value: "side", label: "Side Quest" },
  { value: "personal", label: "Personal Quest" },
];

export default function QuestForm({
  quest,
  campaignId,
  adventures,
  adventureId: fixedAdventureId,
  mode,
}: QuestFormProps) {
  // Form state
  const [formData, setFormData] = useState<QuestFormData>(() => ({
    name: quest?.title || "",
    description: quest?.description || "",
    adventureId: quest?.adventureId || fixedAdventureId,
    status: (quest?.status as "active" | "completed" | "paused" | "cancelled") || "active",
    priority: (quest?.priority as "high" | "medium" | "low") || "medium",
    type: quest?.type || "main",
    dueDate: quest?.dueDate || "",
    assignedTo: quest?.assignedTo || "",
    campaignId,
    images: parseImagesJson(quest?.images),
    tags: quest?.tags ? JSON.parse(quest.tags as string) : [],
  }));

  // Use shared hooks for state management
  const wikiManagement = useWikiItemManagement(quest?.wikiEntities || []);
  const imageManagement = useImageManagement(parseImagesJson(quest?.images));

  // Server action setup
  const createOrUpdateQuest = async (prevState: { success: boolean; error?: string }, formData: FormData) => {
    try {
      // Validate form data
      const rawData = Object.fromEntries(formData.entries());
      const validation = validateFormData(QuestFormSchema, {
        ...rawData,
        campaignId: parseInt(rawData.campaignId as string),
        adventureId: rawData.adventureId ? parseInt(rawData.adventureId as string) : undefined,
        images: rawData.images ? JSON.parse(rawData.images as string) : [],
        tags: rawData.tags ? JSON.parse(rawData.tags as string) : [],
      });

      if (!validation.success) {
        return { success: false, error: Object.values(validation.errors)[0] };
      }

      if (mode === "edit" && quest?.id) {
        return await updateQuest(formData);
      } else {
        return await createQuest(formData);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  // Helper functions
  const updateFormData = <K extends keyof QuestFormData>(key: K, value: QuestFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const redirectPath = fixedAdventureId
    ? `/campaigns/${campaignId}/adventures/${fixedAdventureId}/quests`
    : `/campaigns/${campaignId}/adventures`;

  return (
    <StandardEntityForm
      mode={mode}
      entity={quest}
      action={createOrUpdateQuest}
      title="Quest"
      redirectPath={redirectPath}
      campaignId={campaignId}
    >
      <div className="space-y-6">
        {/* Title Field - Full Width */}
        <FormField label="Title" required>
          <input
            type="text"
            name="title"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
            className="input input-bordered w-full"
            placeholder="Enter quest title"
            required
          />
        </FormField>

        {/* Description Field - Full Width */}
        <FormField label="Description">
          <textarea
            name="description"
            value={formData.description}
            onChange={(e) => updateFormData("description", e.target.value)}
            rows={8}
            className="textarea textarea-bordered w-full"
            placeholder="Describe the quest objectives, background, and any important details..."
          />
        </FormField>

        {/* Two Column Grid */}
        <FormGrid columns={2}>
          <FormField label="Assigned To">
            <input
              type="text"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => updateFormData("assignedTo", e.target.value)}
              className="input input-bordered w-full"
              placeholder="Character or player name"
            />
          </FormField>

          <FormField label="Due Date">
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={(e) => updateFormData("dueDate", e.target.value)}
              className="input input-bordered w-full"
            />
          </FormField>
        </FormGrid>

        {/* Three Column Grid */}
        <FormGrid columns={3}>
          <FormField label="Status">
            <Select
              value={formData.status}
              onValueChange={(value) => updateFormData("status", value as "planned" | "active" | "completed" | "paused" | "cancelled")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Priority">
            <Select
              value={formData.priority}
              onValueChange={(value) => updateFormData("priority", value as "high" | "medium" | "low")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Type">
            <Select
              value={formData.type}
              onValueChange={(value) => updateFormData("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FormGrid>

        {/* Adventure Selector - Full Width if shown */}
        {!fixedAdventureId && (
          <FormField label="Adventure">
            <Select
              value={formData.adventureId?.toString() || ""}
              onValueChange={(value) => updateFormData("adventureId", value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an adventure (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific adventure</SelectItem>
                {adventures?.map((adventure) => (
                  <SelectItem
                    key={adventure.id}
                    value={adventure.id.toString()}
                  >
                    {adventure.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      </div>

      <FormSection title="Images">
        <ImageManager
          entityType="quests"
          entityId={quest?.id ?? 0}
          currentImages={imageManagement.images}
          onImagesChange={imageManagement.setImages}
        />
        {mode === "create" && !quest?.id && (
          <p className="mt-2 text-sm text-base-content/70">
            Save the quest to start uploading images.
          </p>
        )}
      </FormSection>

      <FormSection title="Wiki Entities">
        <WikiEntitiesDisplay
          wikiEntities={wikiManagement.wikiEntities}
          entityType="quest"
          entityId={quest?.id ?? 0}
          showImportMessage
          onRemoveEntity={(wikiArticleId, contentType) =>
            wikiManagement.removeWikiItem(wikiArticleId, contentType, "quest", quest?.id)
          }
          isEditable
          removingItems={wikiManagement.removingItems}
        />
      </FormSection>

      {/* Diary */}
      {mode === "edit" && quest?.id && (
        <FormSection title="Diary">
          <DiaryWrapper
            entityType="quest"
            entityId={quest.id}
            campaignId={campaignId}
            title="Quest Diary"
          />
        </FormSection>
      )}
    </StandardEntityForm>
  );
}
