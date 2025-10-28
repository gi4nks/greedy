"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createLocation, updateLocation } from "@/lib/actions/locations";
import { LocationFormSchema, type LocationFormData } from "@/lib/forms";
import { validateFormData } from "@/lib/forms/validation";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import { ImageManager } from "@/components/ui/image-manager";
import DiaryWrapper from "@/components/ui/diary-wrapper";
import { useWikiItemManagement } from "@/lib/utils/wikiUtils";
import { useImageManagement } from "@/lib/utils/imageFormUtils";
import { StandardEntityForm, FormSection, FormGrid } from "@/lib/forms";
import { FormField } from "@/components/ui/form-components";
import TagManager from "@/components/ui/tag-manager";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";

interface LocationFormProps {
  campaignId: number;
  adventureId?: number;
  mode: "create" | "edit";
  location?: {
    id?: number;
    name?: string;
    description?: string;
    tags?: unknown;
    images?: unknown;
    wikiEntities?: WikiEntity[];
  };
}

export default function LocationForm({
  campaignId,
  adventureId,
  mode,
  location,
}: LocationFormProps) {
  // Form state
  const [formData, setFormData] = useState<LocationFormData>(() => ({
    name: location?.name || "",
    description: location?.description || "",
    campaignId,
    adventureId,
    images: parseImagesJson(location?.images),
    tags: location?.tags ? JSON.parse(location.tags as string) : [],
  }));

  // Use shared hooks for state management
  const wikiManagement = useWikiItemManagement(location?.wikiEntities || []);
  const imageManagement = useImageManagement(parseImagesJson(location?.images));

  // Server action setup
  const createOrUpdateLocation = async (prevState: { success: boolean; error?: string }, formData: FormData) => {
    try {
      // Validate form data
      const rawData = Object.fromEntries(formData.entries());
      const validation = validateFormData(LocationFormSchema, {
        ...rawData,
        campaignId: parseInt(rawData.campaignId as string),
        adventureId: rawData.adventureId ? parseInt(rawData.adventureId as string) : undefined,
        images: rawData.images ? JSON.parse(rawData.images as string) : [],
        tags: rawData.tags ? JSON.parse(rawData.tags as string) : [],
      });

      if (!validation.success) {
        return { success: false, error: Object.values(validation.errors)[0] };
      }

      if (mode === "edit" && location?.id) {
        return await updateLocation(formData);
      } else {
        return await createLocation(formData);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  // Helper functions
  const updateFormData = <K extends keyof LocationFormData>(key: K, value: LocationFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <StandardEntityForm
      mode={mode}
      entity={location}
      action={createOrUpdateLocation}
      title="Location"
      redirectPath={`/campaigns/${campaignId}/locations`}
      campaignId={campaignId}
    >
      <FormGrid columns={1}>
        <FormField label="Name" required>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
            className="input input-bordered w-full"
            placeholder="e.g., Moonhaven, The Whispering Woods, Dragonspire Castle"
            required
          />
        </FormField>

        <FormField label="Description">
          <textarea
            name="description"
            value={formData.description}
            onChange={(e) => updateFormData("description", e.target.value)}
            rows={4}
            className="textarea textarea-bordered w-full"
            placeholder="Describe this location's appearance, atmosphere, and notable features..."
          />
        </FormField>
      </FormGrid>

      <FormSection title="Tags">
        <TagManager
          initialTags={formData.tags}
          readonly={false}
          onTagsChange={(tags: string[]) => updateFormData("tags", tags)}
        />
      </FormSection>

      <FormSection title="Images">
        <ImageManager
          entityType="locations"
          entityId={location?.id ?? 0}
          currentImages={imageManagement.images}
          onImagesChange={imageManagement.setImages}
        />
        {mode === "create" && !location?.id && (
          <p className="mt-2 text-sm text-base-content/70">
            Save the location to start uploading images.
          </p>
        )}
      </FormSection>

      <FormSection title="Wiki Entities">
        <WikiEntitiesDisplay
          wikiEntities={wikiManagement.wikiEntities}
          entityType="location"
          entityId={location?.id ?? 0}
          showImportMessage
          onRemoveEntity={(wikiArticleId, contentType) =>
            wikiManagement.removeWikiItem(wikiArticleId, contentType, "location", location?.id)
          }
          isEditable
          removingItems={wikiManagement.removingItems}
        />
      </FormSection>

      {/* Diary */}
      {mode === "edit" && location?.id && (
        <FormSection title="Diary">
          <DiaryWrapper
            entityType="location"
            entityId={location.id}
            campaignId={campaignId}
            title="Location Diary"
          />
        </FormSection>
      )}
    </StandardEntityForm>
  );
}