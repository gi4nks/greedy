"use client";

import { useActionState } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Save, EyeOff } from "lucide-react";
import { createAdventure, updateAdventure } from "@/lib/actions/adventures";
import { ImageManager } from "@/components/ui/image-manager";
import { ImageInfo, parseImagesJson } from "@/lib/utils/imageUtils.client";
import { toast } from "sonner";

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

interface FormState {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  slug: string;
  images: ImageInfo[];
}

const statusOptions = [
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdventureForm({
  adventure,
  campaignId,
  mode,
}: AdventureFormProps) {
  const router = useRouter();

  const createOrUpdateAdventure = async (
    prevState: { success: boolean; error?: string } | undefined,
    formData: FormData,
  ) => {
    try {
      if (mode === "edit" && adventure) {
        await updateAdventure(formData);
      } else {
        await createAdventure(formData);
      }

      toast.success(
        `Adventure ${mode === "edit" ? "updated" : "created"} successfully!`,
      );
      router.push(`/campaigns/${campaignId}/adventures`);
      return { success: true };
    } catch (error) {
      console.error("Error saving adventure:", error);
      toast.error("Failed to save adventure. Please try again.");
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const [state, formAction, isPending] = useActionState(
    createOrUpdateAdventure,
    { success: false },
  );

  // Initialize form data
  const [formData, setFormData] = useState<FormState>(() => {
    if (mode === "edit" && adventure) {
      return {
        title: adventure.title,
        description: adventure.description || "",
        startDate: adventure.startDate || "",
        endDate: adventure.endDate || "",
        status: adventure.status || "planned",
        slug: adventure.slug || "",
        images: parseImagesJson(adventure.images),
      };
    }
    return {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "planned",
      slug: "",
      images: [],
    };
  });

  const handleInputChange = (
    field: keyof FormState,
    value: string | ImageInfo[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug from title
    if (field === "title" && typeof value === "string") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData((prev) => ({
        ...prev,
        slug: slug,
      }));
    }
  };

  const handleImagesChange = (images: ImageInfo[]) => {
    handleInputChange("images", images);
  };

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden inputs for form data */}
      <input type="hidden" name="title" value={formData.title} />
      <input type="hidden" name="description" value={formData.description} />
      <input type="hidden" name="startDate" value={formData.startDate} />
      <input type="hidden" name="endDate" value={formData.endDate} />
      <input type="hidden" name="status" value={formData.status} />
      <input type="hidden" name="slug" value={formData.slug} />
      <input type="hidden" name="images" value={JSON.stringify(formData.images)} />
      {mode === "edit" && adventure && (
        <input type="hidden" name="id" value={adventure.id.toString()} />
      )}
      <input type="hidden" name="campaignId" value={campaignId.toString()} />

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter adventure title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                placeholder="adventure-slug"
              />
              <p className="text-sm text-base-content/70">
                URL-friendly identifier (auto-generated from title)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                handleInputChange("description", e.target.value)
              }
              placeholder="Describe the adventure, its goals, themes, and key elements..."
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageManager
            entityType="adventures"
            entityId={adventure?.id || 0}
            currentImages={formData.images}
            onImagesChange={handleImagesChange}
          />
        </CardContent>
      </Card>

      <div className="flex gap-4 pt-4 justify-end">
        <Button type="submit" size="sm" disabled={isPending} variant="primary">
          <Save className="w-4 h-4 mr-2" />
          {isPending
            ? mode === "edit"
              ? "Updating..."
              : "Creating..."
            : mode === "edit"
              ? "Update"
              : "Create"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          size="sm"
          onClick={() => router.push(`/campaigns/${campaignId}/adventures`)}
        >
          <EyeOff className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
