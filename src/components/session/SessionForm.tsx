"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { createSession, updateSession } from "@/lib/actions/sessions";
import { type SessionFormData } from "@/lib/forms";
import { ImageManager } from "@/components/ui/image-manager";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import { useImageManagement } from "@/lib/utils/imageFormUtils";
import { useWikiItemManagement } from "@/lib/utils/wikiUtils";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import { FormSection, FormGrid, FormActions } from "@/lib/forms";
import { FormField } from "@/components/ui/form-components";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorHandler } from "@/lib/error-handler";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SessionFormProps {
  session?: {
    id: number;
    title: string;
    date: string;
    text?: string | null;
    narrative?: string | null;
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
}

export default function SessionForm({
  session,
  campaignId,
  adventures,
  mode,
  defaultAdventureId,
}: SessionFormProps) {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<SessionFormData>(() => ({
    title: session?.title || "",
    date: session?.date || new Date().toISOString().split("T")[0],
    adventureId: session?.adventureId || defaultAdventureId,
    text: session?.text || "",
    narrative: session?.narrative || "",
    campaignId,
    images: parseImagesJson(session?.images),
  }));

  // Tab state for Notes/Narrative
  const [activeTab, setActiveTab] = useState<"notes" | "narrative">("notes");

  // Use shared hooks for state management
  const imageManagement = useImageManagement(parseImagesJson(session?.images));
  const wikiManagement = useWikiItemManagement(session?.wikiEntities || []);

  // Server action setup
  const createOrUpdateSession = async (prevState: { success: boolean; error?: string }, formData: FormData) => {
    try {
      // Don't validate on client - let server action handle validation
      // Just ensure required fields have values
      const title = formData.get("title") as string;
      const date = formData.get("date") as string;

      if (!title || !date) {
        return { success: false, error: "Title and date are required" };
      }

      if (mode === "edit" && session) {
        return await updateSession(formData);
      } else {
        return await createSession(formData);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const [state, formAction, isPending] = useActionState(createOrUpdateSession, { success: false });

  // Handle form submission results in useEffect
  const redirectPath = campaignId ? `/campaigns/${campaignId}/sessions` : "/sessions";
  
  useEffect(() => {
    if (state?.success) {
      ErrorHandler.showSuccess(`Session ${mode === "create" ? "created" : "updated"} successfully!`);
      router.push(redirectPath);
    } else if (state?.error) {
      ErrorHandler.handleSubmissionError(state.error, `${mode} session`);
    }
  }, [state, mode, redirectPath, router]);

  // Helper functions
  const updateFormData = <K extends keyof SessionFormData>(key: K, value: SessionFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="campaignId" value={campaignId?.toString() || ""} />
      <input type="hidden" name="adventureId" value={formData.adventureId?.toString() || "none"} />
      <input type="hidden" name="images" value={JSON.stringify(imageManagement.images)} />
      <input type="hidden" name="text" value={formData.text || ""} />
      <input type="hidden" name="narrative" value={formData.narrative || ""} />
      {mode === "edit" && session?.id && <input type="hidden" name="id" value={session.id.toString()} />}

      <div className="space-y-6">
        <FormGrid columns={2}>
          <FormField label="Session Title" required>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={(e) => updateFormData("title", e.target.value)}
              placeholder="Enter session title"
              required
            />
          </FormField>

          <FormField label="Date" required>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={(e) => updateFormData("date", e.target.value)}
              required
            />
          </FormField>

          <div className="col-span-2">
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
            </FormField>
          </div>

          <div className="col-span-2">
            <FormField label="Session Content">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "notes" | "narrative")} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="notes" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Session Notes
                  </TabsTrigger>
                  <TabsTrigger value="narrative" className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Chronicle
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="notes">
                  <div className="space-y-2">
                    <p className="text-sm text-base-content/70">
                      Raw session notes — events, mechanics, dice rolls, decisions, and key moments.
                    </p>
                    <Textarea
                      value={formData.text}
                      onChange={(e) => updateFormData("text", e.target.value)}
                      rows={12}
                      placeholder="What happened in this session? Record key events, character interactions, plot developments, combat encounters, and any memorable moments..."
                    />
                  </div>
                </TabsContent>
                <TabsContent value="narrative">
                  <div className="space-y-2">
                    <p className="text-sm text-base-content/70">
                      The polished story version — like a chapter from a book. Paste your romanced narrative here.
                    </p>
                    <Textarea
                      value={formData.narrative}
                      onChange={(e) => updateFormData("narrative", e.target.value)}
                      rows={12}
                      placeholder="The chronicle of this session... Write or paste the narrative version of the session, describing events as they unfolded in story form."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </FormField>
          </div>
        </FormGrid>

        <FormSection title="Images">
          <ImageManager
            entityType="sessions"
            entityId={session?.id ?? 0}
            currentImages={imageManagement.images}
            onImagesChange={imageManagement.setImages}
          />
          {mode === "create" && !session?.id && (
            <p className="mt-2 text-sm text-base-content/70">
              Save the session to start uploading images.
            </p>
          )}
        </FormSection>

        {/* Wiki Items */}
        {mode === "edit" && wikiManagement.wikiEntities.length > 0 && (
          <FormSection title="Wiki Entities">
            <WikiEntitiesDisplay
              wikiEntities={wikiManagement.wikiEntities}
              entityType="session"
              entityId={session?.id ?? 0}
              showImportMessage
              isEditable
              onRemoveEntity={(wikiArticleId, contentType) =>
                wikiManagement.removeWikiItem(wikiArticleId, contentType, "session", session?.id)
              }
              removingItems={wikiManagement.removingItems}
            />
          </FormSection>
        )}

        <FormActions
          isPending={isPending}
          mode={mode}
          onCancel={() => router.back()}
        />
      </div>
    </form>
  );
}
