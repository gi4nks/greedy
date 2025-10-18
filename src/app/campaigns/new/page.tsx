"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { BookOpen, EyeOff, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import DynamicBreadcrumb from "../../../components/ui/dynamic-breadcrumb";
import { createCampaign } from "../../../lib/actions/campaigns";
import { useActionState } from "react";
import { toast } from "sonner";

interface GameEdition {
  id: number;
  code: string;
  name: string;
  version: string;
  publisher: string;
}

import { ActionResult } from "../../../lib/types/api";

export default function NewCampaignPage() {
  const router = useRouter();
  const [gameEditions, setGameEditions] = useState<GameEdition[]>([]);
  const [state, formAction, isPending] = useActionState(
    createCampaign,
    undefined as ActionResult<{ id: number }> | undefined,
  );

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

  // Handle form submission success/error
  useEffect(() => {
    console.log("🔍 State changed:", state);
    if (state?.success === false && state?.message) {
      console.error("❌ Error:", state.message);
      toast.error(state.message);
    } else if (state?.success === false && state?.errors) {
      console.error("❌ Validation errors:", state.errors);
      toast.error("Please check the form for errors");
    } else if (state?.success === true) {
      console.log("✅ Success! Redirecting...");
      toast.success("Campaign created successfully!");
      router.push("/campaigns");
    }
  }, [state, router]);

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        items={[
          { label: "Campaigns", href: "/" },
          { label: "Create Campaign" },
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Create New Campaign</h1>
            <p className="text-base-content/70">Start a new D&D adventure</p>
          </div>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter campaign title..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameEdition">Game Edition *</Label>
              <Select name="gameEditionId" defaultValue="1">
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your campaign setting, themes, and goals..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue="active">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" name="endDate" type="date" />
              </div>
            </div>

            <div className="flex gap-3 pt-6 justify-end">
              <Button type="submit" className="flex-1" size="sm" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isPending ? "Creating..." : "Create"}
              </Button>

              <Link href="/campaigns">
                <Button type="button" variant="outline" className="gap-2" size="sm">
                  <EyeOff className="w-4 h-4" />
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
