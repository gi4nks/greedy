"use client";

import { useActionState } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Save, ArrowLeft, X, EyeOff } from "lucide-react";
import { createLocation, updateLocation } from "@/lib/actions/locations";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import { ImageManager } from "@/components/ui/image-manager";
import { ImageInfo, parseImagesJson } from "@/lib/utils/imageUtils.client";
import { toast } from "sonner";

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

  const createOrUpdateLocation = async (
    prevState: { success: boolean; error?: string } | undefined,
    formData: FormData,
  ) => {
    try {
      if (mode === "edit" && location?.id) {
        const result = await updateLocation(formData);
        if (!result.success) {
          throw new Error("Failed to update location");
        }
      } else {
        const result = await createLocation(formData);
        if (!result.success) {
          throw new Error("Failed to create location");
        }
      }

      toast.success(
        `Location ${mode === "edit" ? "updated" : "created"} successfully!`,
      );
      router.push(`/campaigns/${campaignId}/locations`);
      return { success: true };
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to save location. Please try again.");
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const [state, formAction, isPending] = useActionState(
    createOrUpdateLocation,
    { success: false },
  );
  const [wikiEntities, setWikiEntities] = useState<WikiEntity[]>(
    location?.wikiEntities || [],
  );
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: location?.name || "",
    description: location?.description || "",
    tags: (location?.tags
      ? typeof location.tags === "string"
        ? JSON.parse(location.tags)
        : location.tags
      : []) as string[],
  });

  const [images, setImages] = useState<ImageInfo[]>(() =>
    parseImagesJson(location?.images),
  );

  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const removeWikiItem = async (
    wikiArticleId: number,
    _contentType: string,
  ) => {
    const itemKey = `wiki-${wikiArticleId}`;

    // Prevent duplicate removal operations
    if (removingItems.has(itemKey)) {
      return;
    }

    // Add to removing set to show loading state
    setRemovingItems((prev) => new Set(prev).add(itemKey));

    try {
      const response = await fetch(
        `/api/wiki-articles/${wikiArticleId}/entities`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entityType: "location",
            entityId: location?.id,
          }),
        },
      );

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

      // Update local state - remove the entity from wikiEntities
      setWikiEntities((prev) =>
        prev.filter((entity) => entity.id !== wikiArticleId),
      );
      console.log("Wiki item removed successfully");
    } catch (error) {
      console.error("Error removing wiki item:", error);
      toast.error("Failed to remove wiki item. Please try again.");
    } finally {
      // Remove from removing set
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <MapPin className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {mode === "create"
                ? "Create New Location"
                : `Edit ${location?.name}`}
            </h1>
            <p className="text-base-content/70">
              {mode === "create"
                ? "Add a new location to your campaign"
                : "Update location information"}
            </p>
          </div>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Moonhaven, The Whispering Woods, Dragonspire Castle"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe this location's appearance, atmosphere, and notable features..."
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag (city, dungeon, forest, etc.)"
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add Tag
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-red-500 hover:text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="text-sm text-base-content/70">
                Popular tags: city, town, village, dungeon, forest, mountain,
                castle, tavern, temple, ruins
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "edit" && location?.id ? (
              <ImageManager
                entityType="locations"
                entityId={location.id}
                currentImages={images}
                onImagesChange={setImages}
              />
            ) : (
              <div className="text-center py-8 text-base-content/70">
                <p>Images can be added after creating the location.</p>
                <p className="text-sm mt-2">
                  Save the location first, then return to edit it and add
                  images.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wiki Items */}
        {mode === "edit" && wikiEntities.length > 0 && location && (
          <Card>
            <CardHeader>
              <CardTitle>Wiki Items</CardTitle>
            </CardHeader>
            <CardContent>
              <WikiEntitiesDisplay
                wikiEntities={wikiEntities}
                entityType="location"
                entityId={location.id!}
                showImportMessage={true}
                isEditable={true}
                onRemoveEntity={removeWikiItem}
                removingItems={removingItems}
              />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => router.back()}
          >
            <EyeOff className="w-4 h-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !formData.name.trim()}>
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {mode === "create" ? "Create" : "Update"}
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
