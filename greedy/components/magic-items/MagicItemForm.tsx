"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createMagicItemAction,
  updateMagicItemAction,
  type MagicItemFormState,
} from "@/lib/actions/magicItems";
import { ImageManager } from "@/components/ui/image-manager";
import { ImageInfo, parseImagesJson } from "@/lib/utils/imageUtils.client";
import { ActionResult } from "@/lib/types/api";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
    images: unknown;
  };
}

export function MagicItemForm({ mode, magicItem }: MagicItemFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [images, setImages] = useState<ImageInfo[]>(() => {
    if (mode === "edit" && magicItem?.images) {
      return parseImagesJson(magicItem.images);
    }
    return [];
  });

  const handleImagesChange = (newImages: ImageInfo[]) => {
    setImages(newImages);
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const action =
        mode === "create" ? createMagicItemAction : updateMagicItemAction;
      const result: ActionResult = await action(
        {} as MagicItemFormState,
        formData,
      );

      if (result?.success === false) {
        if (result.errors) {
          setErrors(result.errors);
          toast.error(
            "Failed to save magic item. Please check the form for errors.",
          );
        } else {
          toast.error(result.message || "Failed to save magic item.");
        }
      } else {
        toast.success(
          `Magic item ${mode === "create" ? "created" : "updated"} successfully!`,
        );
        router.push("/magic-items");
      }
    } catch (error) {
      console.error("Error saving magic item:", error);
      toast.error("Failed to save magic item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Magic Item</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={handleSubmit} className="space-y-6">
          <input type="hidden" name="images" value={JSON.stringify(images)} />
          {mode === "edit" && magicItem && (
            <input type="hidden" name="id" value={magicItem.id} />
          )}

          <div className="space-y-2">
            <Label htmlFor="magic-item-name">Name *</Label>
            <Input
              id="magic-item-name"
              name="name"
              defaultValue={magicItem?.name ?? ""}
              placeholder="e.g. Sunsword"
              required
            />
            {errors?.name && (
              <span className="text-sm text-error">{errors.name[0]}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="magic-item-type">Type</Label>
              <Input
                id="magic-item-type"
                name="type"
                defaultValue={magicItem?.type ?? ""}
                placeholder="e.g. Weapon, Wondrous Item"
              />
              {errors?.type && (
                <span className="text-sm text-error">{errors.type[0]}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="magic-item-rarity">Rarity</Label>
              <Input
                id="magic-item-rarity"
                name="rarity"
                list="magic-item-rarity-options"
                defaultValue={magicItem?.rarity ?? ""}
                placeholder="Select or enter rarity"
              />
              <datalist id="magic-item-rarity-options">
                {RARITY_OPTIONS.map((rarity) => (
                  <option key={rarity} value={rarity} />
                ))}
              </datalist>
              {errors?.rarity && (
                <span className="text-sm text-error">{errors.rarity[0]}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="magic-item-description">Description</Label>
            <Textarea
              id="magic-item-description"
              name="description"
              defaultValue={magicItem?.description ?? ""}
              placeholder="Describe the item's appearance, abilities, and lore."
              rows={6}
            />
            {errors?.description && (
              <span className="text-sm text-error">
                {errors.description[0]}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="magic-item-properties">Properties (JSON)</Label>
            <Textarea
              id="magic-item-properties"
              name="properties"
              defaultValue={magicItem?.properties ?? ""}
              placeholder='{"charges": 3, "damage": "1d8 radiant"}'
              rows={6}
            />
            <p className="text-xs text-base-content/60">
              Provide structured data to power future automations. Leave blank
              if not needed.
            </p>
            {errors?.properties && (
              <span className="text-sm text-error">{errors.properties[0]}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="magic-item-attunement"
              name="attunementRequired"
              defaultChecked={magicItem?.attunementRequired ?? false}
            />
            <Label htmlFor="magic-item-attunement" className="text-sm">
              Requires attunement
            </Label>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageManager
                entityType="magic-items"
                entityId={magicItem?.id || 0}
                currentImages={images}
                onImagesChange={handleImagesChange}
              />
            </CardContent>
          </Card>
        </form>
      </CardContent>
      <CardFooter>
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              const form = document.querySelector('form[action]') as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
