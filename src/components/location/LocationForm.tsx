"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { createLocation, updateLocation } from "@/lib/actions/locations";
import { LocationFormSchema, type LocationFormData } from "@/lib/forms";
import { validateFormData } from "@/lib/forms/validation";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import { ImageManager } from "@/components/ui/image-manager";
import { useWikiItemManagement } from "@/lib/utils/wikiUtils";
import { useImageManagement } from "@/lib/utils/imageFormUtils";
import { FormSection, FormGrid, FormActions } from "@/lib/forms";
import { FormField } from "@/components/ui/form-components";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorHandler } from "@/lib/error-handler";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import DiaryWrapper from "@/components/ui/diary-wrapper";

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
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<LocationFormData>(() => ({
    name: location?.name || "",
    description: location?.description || "",
    campaignId,
    adventureId,
    images: parseImagesJson(location?.images),
    tags: [],
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
        tags: [],
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

  const [state, formAction, isPending] = useActionState(createOrUpdateLocation, { success: false });

  // Handle form submission results in useEffect
  const redirectPath = `/campaigns/${campaignId}/locations`;
  
  useEffect(() => {
    if (state?.success) {
      ErrorHandler.showSuccess(`Location ${mode === "create" ? "created" : "updated"} successfully!`);
      router.push(redirectPath);
    } else if (state?.error) {
      ErrorHandler.handleSubmissionError(state.error, `${mode} location`);
    }
  }, [state, mode, redirectPath, router]);

  // Helper functions
  const updateFormData = <K extends keyof LocationFormData>(key: K, value: LocationFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="campaignId" value={campaignId.toString()} />
      {adventureId && <input type="hidden" name="adventureId" value={adventureId.toString()} />}
      {mode === "edit" && location?.id && <input type="hidden" name="id" value={location.id.toString()} />}

      <div className="space-y-6">
        <FormGrid columns={1}>
          <FormField label="Name" required>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              placeholder="e.g., Moonhaven, The Whispering Woods, Dragonspire Castle"
              required
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              name="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              rows={4}
              placeholder="Describe this location's appearance, atmosphere, and notable features..."
            />
          </FormField>
        </FormGrid>

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

        {mode === "edit" && location?.id && (
          <div>
          <DiaryWrapper
            entityType="location"
            entityId={location.id}
            campaignId={campaignId}
            title="Location Diary"
          />
        </div>
      )}

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

        <FormActions
          isPending={isPending}
          mode={mode}
          onCancel={() => router.back()}
        />
      </div>
    </form>
  );
}
