"use client";

import { useActionState } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { createSession, updateSession } from "@/lib/actions/sessions";
import { ImageManager } from "@/components/ui/image-manager";
import { ImageInfo, parseImagesJson } from "@/lib/utils/imageUtils.client";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import { toast } from "sonner";

interface SessionFormProps {
  session?: {
    id: number;
    title: string;
    date: string;
    text?: string | null;
    adventureId?: number | null;
    images?: unknown;
    wikiEntities?: WikiEntity[];
  };
  campaignId?: number;
  adventures: Array<{
    id: number;
    title: string;
    status?: string | null;
  }>;
  mode: "create" | "edit";
  defaultAdventureId?: number;
  showButtons?: boolean;
}

interface FormState {
  title: string;
  date: string;
  text: string;
  adventureId: string;
  images: ImageInfo[];
}

export default function SessionForm({
  session,
  campaignId,
  adventures,
  mode,
  defaultAdventureId,
  showButtons = true,
}: SessionFormProps) {
  const router = useRouter();

  const createOrUpdateSession = async (
    prevState: { success: boolean; error?: string } | undefined,
    formData: FormData,
  ) => {
    try {
      let result;
      if (mode === "edit" && session) {
        result = await updateSession(formData);
      } else {
        result = await createSession(formData);
      }

      if (result?.success) {
        toast.success(
          `Session ${mode === "edit" ? "updated" : "created"} successfully!`,
        );
        router.push(
          campaignId ? `/campaigns/${campaignId}/sessions` : "/sessions",
        );
        return { success: true };
      } else {
        toast.error("Failed to save session. Please try again.");
        return { success: false, error: "Unknown error" };
      }
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("Failed to save session. Please try again.");
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const [, formAction, isPending] = useActionState(createOrUpdateSession, {
    success: false,
  });

  // Wiki entities state
  const [wikiEntities, setWikiEntities] = useState<WikiEntity[]>(
    session?.wikiEntities || [],
  );
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  // Initialize form data
  const [formData, setFormData] = useState<FormState>(() => {
    if (mode === "edit" && session) {
      return {
        title: session.title,
        date: session.date,
        text: session.text || "",
        adventureId: session.adventureId?.toString() || "",
        images: parseImagesJson(session.images),
      };
    }
    return {
      title: "",
      date: new Date().toISOString().split("T")[0], // Today's date
      text: "",
      adventureId: defaultAdventureId?.toString() || "",
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
  };

  const handleImagesChange = (images: ImageInfo[]) => {
    setFormData((prev) => ({
      ...prev,
      images,
    }));
  };

  const removeWikiItem = async (wikiArticleId: number, contentType: string) => {
    const itemKey = `${contentType}-${wikiArticleId}`;

    // Prevent multiple simultaneous removals of the same item
    if (removingItems.has(itemKey)) {
      return;
    }

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
            entityType: "session",
            entityId: session?.id,
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
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden inputs for server action */}
      <input type="hidden" name="campaignId" value={campaignId || ""} />
      <input type="hidden" name="images" value={JSON.stringify(formData.images)} />
      {mode === "edit" && session && (
        <input type="hidden" name="id" value={session.id} />
      )}
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter session title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="adventureId">Adventure</Label>
              <Select
                name="adventureId"
                value={formData.adventureId}
                onValueChange={(value) =>
                  handleInputChange("adventureId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an adventure (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific adventure</SelectItem>
                  {adventures.map((adventure) => (
                    <SelectItem
                      key={adventure.id}
                      value={adventure.id.toString()}
                    >
                      {adventure.title}
                      {adventure.status && adventure.status !== "active" && (
                        <span className="ml-2 text-base-content/70">
                          ({adventure.status})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-base-content/70">
                Link this session to a specific adventure
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="text">Session Summary</Label>
            <Textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={(e) => handleInputChange("text", e.target.value)}
              placeholder="What happened in this session? Record key events, character interactions, plot developments, combat encounters, and any memorable moments..."
              rows={12}
            />
            <p className="text-sm text-base-content/70">
              Describe what happened during this session. This will help you
              track campaign progress and recall important details.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageManager
            entityType="sessions"
            entityId={session?.id || 0}
            currentImages={formData.images}
            onImagesChange={handleImagesChange}
          />
        </CardContent>
      </Card>

      {/* Wiki Items */}
      {mode === "edit" && wikiEntities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Wiki Items</CardTitle>
          </CardHeader>
          <CardContent>
            <WikiEntitiesDisplay
              wikiEntities={wikiEntities}
              entityType="session"
              entityId={session?.id || 0}
              showImportMessage={true}
              isEditable={true}
              onRemoveEntity={removeWikiItem}
              removingItems={removingItems}
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {showButtons && (
        <Card>
          <CardFooter>
            <div className="flex gap-4 justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            variant="primary"
          >
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
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() =>
              router.push(
                campaignId ? `/campaigns/${campaignId}/sessions` : "/sessions",
              )
            }
          >
            <EyeOff className="w-4 h-4" />
            Cancel
          </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </form>
  );
}
