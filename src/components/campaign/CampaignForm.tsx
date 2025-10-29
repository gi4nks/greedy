"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { updateCampaign, deleteCampaign } from "@/lib/actions/campaigns";
import { Campaign } from "@/lib/db/schema";
import { FormGrid, FormActions } from "@/lib/forms";
import { FormField } from "@/components/ui/form-components";
import { CampaignFormSchema, type CampaignFormData } from "@/lib/forms";
import { validateFormData } from "@/lib/forms/validation";
import { ErrorHandler } from "@/lib/error-handler";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GameEdition {
  id: number;
  code: string;
  name: string;
  version: string;
  publisher: string;
}

interface CampaignFormProps {
  campaign: Campaign;
}

export default function CampaignForm({ campaign }: CampaignFormProps) {
  const router = useRouter();
  const [gameEditions, setGameEditions] = useState<GameEdition[]>([]);

  // Form state
  const [formData, setFormData] = useState<CampaignFormData>(() => ({
    title: campaign.title,
    description: campaign.description || "",
    status: (campaign.status as "active" | "planning" | "completed" | "hiatus" | undefined) || "active",
    startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split("T")[0] : "",
    endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split("T")[0] : "",
    gameEditionId: campaign.gameEditionId || 1,
  }));

  // Fetch available game editions
  useEffect(() => {
    const fetchGameEditions = async () => {
      try {
        const response = await fetch("/api/game-editions");
        if (response.ok) {
          const editions = await response.json();
          setGameEditions(editions);
        }
      } catch (error) {
        console.error("Failed to fetch game editions:", error);
      }
    };

    fetchGameEditions();
  }, []);

  // Server action setup
  const updateCampaignAction = async (prevState: { success: boolean; error?: string }, formData: FormData) => {
    try {
      // Validate form data
      const rawData = Object.fromEntries(formData.entries());
      const validation = validateFormData(CampaignFormSchema, {
        ...rawData,
        gameEditionId: rawData.gameEditionId ? parseInt(rawData.gameEditionId as string) : 1,
        status: rawData.status as "active" | "planning" | "completed" | "hiatus",
      });

      if (!validation.success) {
        return { success: false, error: Object.values(validation.errors)[0] };
      }

      return await updateCampaign(campaign.id, formData);
    } catch (error) {
      console.error("Form submission error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const [state, formAction, isPending] = useActionState(updateCampaignAction, { success: false });

  useEffect(() => {
    if (state?.success) {
      ErrorHandler.showSuccess("Campaign updated successfully!");
      router.push(`/campaigns/${campaign.id}`);
    } else if (state?.error) {
      ErrorHandler.handleSubmissionError(state.error, "update campaign");
    }
  }, [state, campaign.id, router]);

  // Helper functions
  const updateFormData = <K extends keyof CampaignFormData>(key: K, value: CampaignFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={campaign.id.toString()} />
      <FormGrid columns={2}>
        <FormField label="Title" required>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={(e) => updateFormData("title", e.target.value)}
            className="input input-bordered w-full"
            placeholder="Campaign title"
            required
          />
        </FormField>

        <FormField label="Game Edition">
          <Select
            value={formData.gameEditionId.toString()}
            onValueChange={(value) => updateFormData("gameEditionId", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select game edition..." />
            </SelectTrigger>
            <SelectContent>
              {gameEditions.map((edition) => (
                <SelectItem key={edition.id} value={edition.id.toString()}>
                  {edition.name} ({edition.version})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-base-content/70 mt-1">
            Choose the D&D edition for this campaign
          </p>
        </FormField>

        <FormField label="Status">
          <Select
            value={formData.status}
            onValueChange={(value) => updateFormData("status", value as "active" | "planning" | "completed" | "hiatus")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="hiatus">Hiatus</SelectItem>
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
              rows={4}
              className="textarea textarea-bordered w-full"
              placeholder="Campaign description"
            />
          </FormField>
        </div>
      </FormGrid>

      <FormActions
        mode="edit"
        isPending={isPending}
        onCancel={() => router.back()}
        onDelete={async () => {
          const confirmed = confirm("Are you sure you want to delete this campaign? This cannot be undone.");
          if (confirmed) {
            try {
              const result = await deleteCampaign(campaign.id);
              if (result.success) {
                ErrorHandler.showSuccess("Campaign deleted successfully!");
                router.push("/campaigns");
              } else {
                const message = result.message || "Failed to delete campaign";
                ErrorHandler.handleSubmissionError(message, "delete campaign");
              }
            } catch (error) {
              ErrorHandler.handleSubmissionError(
                error instanceof Error ? error.message : "An unexpected error occurred",
                "delete campaign"
              );
            }
          }
        }}
      />
    </form>
  );
}
