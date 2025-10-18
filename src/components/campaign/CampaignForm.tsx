"use client";

import { useState, useEffect, useActionState } from "react";
import { updateCampaign } from "@/lib/actions/campaigns";
import { Campaign } from "@/lib/db/schema";
import { ActionResult } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { EyeOff, Save } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameEditions, setGameEditions] = useState<GameEdition[]>([]);

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

  const updateCampaignWithId = async (
    prevState: ActionResult | undefined,
    formData: FormData,
  ): Promise<ActionResult> => {
    const result = await updateCampaign(campaign.id, formData);
    if (result.success) {
      // Success - redirect will happen via revalidatePath
      window.location.href = `/campaigns/${campaign.id}`;
    }
    return result;
  };

  const [state, formAction] = useActionState(updateCampaignWithId, undefined);

  const handleSubmit = (formData: FormData) => {
    setIsSubmitting(true);
    formAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={campaign.title}
                placeholder="Campaign title"
                required
              />
              {state && !state.success && state.errors?.title && (
                <p className="text-sm text-red-600">{state.errors.title[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={campaign.description || ""}
                placeholder="Campaign description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameEdition">Game Edition</Label>
              <Select defaultValue={campaign.gameEditionId?.toString() || "1"} name="gameEditionId">
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
              <p className="text-sm text-base-content/70">
                Choose the D&D edition for this campaign
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={campaign.status || "active"} name="status">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={
                    campaign.startDate
                      ? new Date(campaign.startDate).toISOString().split("T")[0]
                      : ""
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={
                    campaign.endDate
                      ? new Date(campaign.endDate).toISOString().split("T")[0]
                      : ""
                  }
                />
              </div>
            </div>

            {state && !state.success && state.message && (
              <div className="p-4 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{state.message}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4 justify-end">
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
              <Link href={`/campaigns/${campaign.id}`}>
                <Button type="button" variant="outline" className="gap-2" size="sm">
                  <EyeOff className="w-4 h-4" />
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
  );
}
