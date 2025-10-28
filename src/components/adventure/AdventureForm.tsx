"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { createAdventure, updateAdventure } from "@/lib/actions/adventures";
import { FormSection, FormGrid, FormActions } from "@/lib/forms";
import { FormField } from "@/components/ui/form-components";
import { AdventureFormSchema, type AdventureFormData } from "@/lib/forms";
import { validateFormData } from "@/lib/forms/validation";
import { useImageManagement } from "@/lib/utils/imageFormUtils";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import { ImageManager } from "@/components/ui/image-manager";
import { ErrorHandler } from "@/lib/error-handler";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusOptions = [
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

interface AdventureFormProps {
  adventure?: {
    id: number;
    title: string;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    status?: string | null;
    slug?: string | null;
    images?: unknown;
  };
  campaignId: number;
  mode: "create" | "edit";
}

export default function AdventureForm({
  adventure,
  campaignId,
  mode,
}: AdventureFormProps) {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<AdventureFormData>(() => ({
    name: adventure?.title || "",
    description: adventure?.description || "",
    startDate: adventure?.startDate || "",
    endDate: adventure?.endDate || "",
    status: (adventure?.status as "active" | "completed" | "paused" | "cancelled" | undefined) || "planned",
    campaignId,
    images: parseImagesJson(adventure?.images),
  }));

  // Use shared hooks for state management
  const imageManagement = useImageManagement(parseImagesJson(adventure?.images));

  // Server action setup
  const createOrUpdateAdventure = async (prevState: { success: boolean; error?: string }, formData: FormData) => {
    try {
      // Validate form data
      const rawData = Object.fromEntries(formData.entries());
      const validation = validateFormData(AdventureFormSchema, {
        ...rawData,
        campaignId: parseInt(rawData.campaignId as string),
        status: rawData.status as "planned" | "active" | "completed" | "paused" | "cancelled",
        images: rawData.images ? JSON.parse(rawData.images as string) : [],
      });

      if (!validation.success) {
        return { success: false, error: Object.values(validation.errors)[0] };
      }

      if (mode === "edit" && adventure) {
        return await updateAdventure(formData);
      } else {
        return await createAdventure(formData);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const [state, formAction, isPending] = useActionState(createOrUpdateAdventure, { success: false });

  // Handle form submission results
  const redirectPath = `/campaigns/${campaignId}/adventures`;
  
  if (state?.success) {
    ErrorHandler.showSuccess(`Adventure ${mode === "create" ? "created" : "updated"} successfully!`);
    router.push(redirectPath);
  } else if (state?.error) {
    ErrorHandler.handleSubmissionError(state.error, `${mode} adventure`);
  }

  // Helper functions
  const updateFormData = <K extends keyof AdventureFormData>(key: K, value: AdventureFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="campaignId" value={campaignId.toString()} />
      {mode === "edit" && adventure?.id && <input type="hidden" name="id" value={adventure.id.toString()} />}

      <div className="space-y-6">
        <FormGrid columns={2}>
          <FormField label="Title" required>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              className="input input-bordered w-full"
              placeholder="Enter adventure title"
              required
            />
          </FormField>

          <FormField label="Slug" help="URL-friendly identifier (auto-generated from title)">
            <input
              type="text"
              name="slug"
              value={adventure?.slug || ""}
              className="input input-bordered w-full"
              placeholder="adventure-slug"
              readOnly
            />
          </FormField>

          <FormField label="Status" required>
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

          <FormField label="Start Date">
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={(e) => updateFormData("startDate", e.target.value)}
              className="input input-bordered w-full"
            />
          </FormField>

          <FormField label="End Date">
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={(e) => updateFormData("endDate", e.target.value)}
              className="input input-bordered w-full"
            />
          </FormField>

          <div className="col-span-2">
            <FormField label="Description">
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={6}
                className="textarea textarea-bordered w-full"
                placeholder="Describe the adventure, its goals, themes, and key elements..."
              />
            </FormField>
          </div>
        </FormGrid>

        <FormSection title="Images">
          <ImageManager
            entityType="adventures"
            entityId={adventure?.id ?? 0}
            currentImages={imageManagement.images}
            onImagesChange={imageManagement.setImages}
          />
          {mode === "create" && !adventure?.id && (
            <p className="mt-2 text-sm text-base-content/70">
              Save the adventure to start uploading images.
            </p>
          )}
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
