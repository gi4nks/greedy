"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  createMagicItemAction,
  updateMagicItemAction,
} from "@/lib/actions/magicItems";
import { ImageManager } from "@/components/ui/image-manager";
import { parseImagesJson, type ImageInfo } from "@/lib/utils/imageUtils.client";
import { FormSection, FormGrid, FormActions } from "@/lib/forms";
import { FormField } from "@/components/ui/form-components";
import { MagicItemFormSchema, type MagicItemFormData } from "@/lib/forms";
import { validateFormData } from "@/lib/forms/validation";
import { useImageManagement } from "@/lib/utils/imageFormUtils";

const RARITY_OPTIONS = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
  "Artifact",
];

interface MagicItemFormProps {
  mode: "create" | "edit";
  magicItem?: {
    id: number;
    name: string;
    rarity: string | null;
    type: string | null;
    description: string | null;
    properties: string;
    attunementRequired: boolean | null;
    tags: unknown;
    images: unknown;
  };
}

export function MagicItemForm({ mode, magicItem }: MagicItemFormProps) {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  // Form state
  const [formData, setFormData] = useState<MagicItemFormData>(() => ({
    name: magicItem?.name || "",
    type: magicItem?.type || "",
    rarity: magicItem?.rarity || "",
    description: magicItem?.description || "",
    properties: magicItem?.properties ? JSON.parse(magicItem.properties) : null,
    attunementRequired: magicItem?.attunementRequired || false,
    tags: Array.isArray(magicItem?.tags) ? magicItem.tags : [],
    images: parseImagesJson(magicItem?.images),
  }));

  // Use shared hooks for state management
  const imageManagement = useImageManagement(parseImagesJson(magicItem?.images));
  const serializedImages = useMemo(
    () => JSON.stringify(imageManagement.images ?? []),
    [imageManagement.images],
  );

  // Server action setup
  const createOrUpdateMagicItem = async (prevState: { success: boolean; error?: string }, formData: FormData) => {
    try {
      // Validate form data
      const rawData = Object.fromEntries(formData.entries());
      const validation = validateFormData(MagicItemFormSchema, {
        ...rawData,
        attunementRequired: rawData.attunementRequired === "on",
        tags: rawData.tags ? JSON.parse(rawData.tags as string) : [],
        images: rawData.images ? JSON.parse(rawData.images as string) : [],
        properties: rawData.properties ? JSON.parse(rawData.properties as string) : null,
      });

      if (!validation.success) {
        return { success: false, error: Object.values(validation.errors)[0] };
      }

      if (mode === "edit" && magicItem?.id) {
        return await updateMagicItemAction(formData);
      } else {
        return await createMagicItemAction(formData);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const [state, formAction, isPending] = useActionState(createOrUpdateMagicItem, {
    success: false,
  });

  // Handle redirect on success
  useEffect(() => {
    if (state?.success && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      const redirectPath = mode === "edit" && magicItem?.id 
        ? `/magic-items/${magicItem.id}`
        : "/magic-items";
      // Use router.replace to prevent back button returning to edit page
      router.replace(redirectPath);
    }
  }, [state?.success, mode, magicItem?.id, router]);

  // Helper functions
  const updateFormData = <K extends keyof MagicItemFormData>(key: K, value: MagicItemFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImagesChange = (images: ImageInfo[]) => {
    imageManagement.setImages(images);
    updateFormData("images", images as MagicItemFormData["images"]);
  };

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && magicItem?.id && (
        <input type="hidden" name="id" value={magicItem.id.toString()} />
      )}
      <input type="hidden" name="images" value={serializedImages} readOnly />
      <FormGrid columns={2}>
        <FormField label="Name" required>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
            className="input input-bordered w-full"
            placeholder="e.g. Sunsword"
            required
          />
        </FormField>

        <FormField label="Type">
          <input
            type="text"
            name="type"
            value={formData.type}
            onChange={(e) => updateFormData("type", e.target.value)}
            className="input input-bordered w-full"
            placeholder="e.g. Weapon"
          />
        </FormField>

        <FormField label="Rarity">
          <input
            type="text"
            name="rarity"
            value={formData.rarity}
            onChange={(e) => updateFormData("rarity", e.target.value)}
            className="input input-bordered w-full"
            placeholder="Select rarity"
            list="magic-item-rarity-options"
          />
          <datalist id="magic-item-rarity-options">
            {RARITY_OPTIONS.map((rarity) => (
              <option key={rarity} value={rarity} />
            ))}
          </datalist>
        </FormField>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="magic-item-attunement"
            name="attunementRequired"
            checked={formData.attunementRequired}
            onChange={(e) => updateFormData("attunementRequired", e.target.checked)}
            className="checkbox"
          />
          <Label htmlFor="magic-item-attunement" className="text-sm">
            Requires attunement
          </Label>
        </div>

        <div className="col-span-2">
          <FormField label="Description">
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              rows={6}
              className="textarea textarea-bordered w-full"
              placeholder="Describe the item..."
            />
          </FormField>
        </div>

        <div className="col-span-2">
          <FormField label="Properties (JSON)">
            <textarea
              name="properties"
              value={formData.properties ? JSON.stringify(formData.properties, null, 2) : ""}
              onChange={(e) => {
                try {
                  const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                  updateFormData("properties", parsed);
                } catch {
                  // Invalid JSON, keep as string for now
                  updateFormData("properties", null);
                }
              }}
              rows={6}
              className="textarea textarea-bordered w-full font-mono text-sm"
              placeholder='{"charges": 3, "damage": "2d6"}'
            />
            <p className="text-xs text-base-content/60">
              Structured data for automations (optional)
            </p>
          </FormField>
        </div>
      </FormGrid>

      <FormSection title="Images">
        <ImageManager
          entityType="magic-items"
          entityId={magicItem?.id ?? 0}
          currentImages={imageManagement.images}
          onImagesChange={handleImagesChange}
        />
        {mode === "create" && !magicItem?.id && (
          <p className="mt-2 text-sm text-base-content/70">
            Save the magic item to start uploading images.
          </p>
        )}
      </FormSection>

      <FormActions 
        mode={mode}
        onCancel={() => {
          const redirectPath = mode === "edit" && magicItem?.id 
            ? `/magic-items/${magicItem.id}`
            : "/magic-items";
          router.push(redirectPath);
        }}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create Magic Item" : "Update Magic Item"}
      />
    </form>
  );
}
