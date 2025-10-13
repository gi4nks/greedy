"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Save, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Relationship {
  id: number;
  npcId: number;
  characterId: number;
  relationshipType: string;
  strength: number;
  trust: number;
  fear: number;
  respect: number;
  notes: string;
  isMutual: boolean;
  discoveredByPlayers: boolean;
}

interface RelationshipFormProps {
  npcs: Array<{
    id: number;
    name: string;
    race: string | null;
    classes: unknown;
    level: number | null;
  }>;
  playerCharacters: Array<{
    id: number;
    name: string;
    race: string | null;
    classes: unknown;
    level: number | null;
  }>;
  mode: "create" | "edit";
  relationship?: Relationship;
}

interface FormData {
  npcId: string;
  characterId: string;
  relationshipType: string;
  strength: number;
  trust: number;
  fear: number;
  respect: number;
  description: string;
  isMutual: boolean;
  discoveredByPlayers: boolean;
}

export default function RelationshipForm({
  npcs,
  playerCharacters,
  mode,
  relationship,
}: RelationshipFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>(() => {
    if (mode === "edit" && relationship) {
      return {
        npcId: relationship.npcId?.toString() || "",
        characterId: relationship.characterId?.toString() || "",
        relationshipType: relationship.relationshipType || "neutral",
        strength: relationship.strength || 50,
        trust: relationship.trust || 50,
        fear: relationship.fear || 0,
        respect: relationship.respect || 50,
        description: relationship.notes || "",
        isMutual: relationship.isMutual ?? true,
        discoveredByPlayers: relationship.discoveredByPlayers ?? false,
      };
    }

    return {
      npcId: "",
      characterId: "",
      relationshipType: "neutral",
      strength: 50,
      trust: 50,
      fear: 0,
      respect: 50,
      description: "",
      isMutual: true,
      discoveredByPlayers: false,
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        target_id: parseInt(formData.characterId),
        target_type: "character",
        relationship_type: formData.relationshipType,
        strength: formData.strength,
        trust: formData.trust,
        fear: formData.fear,
        respect: formData.respect,
        description: formData.description,
        is_mutual: formData.isMutual,
        discovered_by_players: formData.discoveredByPlayers,
      };

      const url =
        mode === "create"
          ? `/api/relationships/npcs/${formData.npcId}/relationships`
          : `/api/relationships/${relationship?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save relationship");
      }

      toast.success(
        `Relationship ${mode === "create" ? "created" : "updated"} successfully!`,
      );
      router.push("/relationships");
    } catch (error) {
      console.error("Error saving relationship:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save relationship. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (
    field: keyof FormData,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const relationshipTypes = [
    { value: "ally", label: "Ally" },
    { value: "enemy", label: "Enemy" },
    { value: "neutral", label: "Neutral" },
    { value: "romantic", label: "Romantic" },
    { value: "family", label: "Family" },
    { value: "friend", label: "Friend" },
    { value: "rival", label: "Rival" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relationship Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="npcId">NPC *</Label>
              <Select
                name="npcId"
                value={formData.npcId}
                onValueChange={(value) => updateFormData("npcId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select NPC" />
                </SelectTrigger>
                <SelectContent>
                  {npcs.map((npc) => (
                    <SelectItem key={npc.id} value={npc.id.toString()}>
                      {npc.name}
                      {npc.race && ` (${npc.race})`}
                      {Array.isArray(npc.classes) &&
                        npc.classes.length > 0 &&
                        ` - ${npc.classes.join(", ")}`}
                      {npc.level && ` Lvl ${npc.level}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="characterId">Player Character *</Label>
              <Select
                name="characterId"
                value={formData.characterId}
                onValueChange={(value) => updateFormData("characterId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Character" />
                </SelectTrigger>
                <SelectContent>
                  {playerCharacters.map((pc) => (
                    <SelectItem key={pc.id} value={pc.id.toString()}>
                      {pc.name}
                      {Array.isArray(pc.classes) &&
                        pc.classes.length > 0 &&
                        ` (${pc.classes.join(", ")})`}
                      {pc.level && ` Lvl ${pc.level}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="relationshipType">Relationship Type</Label>
            <Select
              name="relationshipType"
              value={formData.relationshipType}
              onValueChange={(value) =>
                updateFormData("relationshipType", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateFormData("description", e.target.value)
              }
              rows={3}
              placeholder="Describe the nature of this relationship..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relationship Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Overall Strength</Label>
              <span className="text-sm font-mono">{formData.strength}</span>
            </div>
            <Slider
              value={[formData.strength]}
              onValueChange={(value: number[]) =>
                updateFormData("strength", value[0])
              }
              max={100}
              min={-100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-base-content/70 mt-1">
              <span>Hatred (-100)</span>
              <span>Neutral (0)</span>
              <span>Devotion (100)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Trust</Label>
              <span className="text-sm font-mono">{formData.trust}%</span>
            </div>
            <Slider
              value={[formData.trust]}
              onValueChange={(value: number[]) =>
                updateFormData("trust", value[0])
              }
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Fear</Label>
              <span className="text-sm font-mono">{formData.fear}%</span>
            </div>
            <Slider
              value={[formData.fear]}
              onValueChange={(value: number[]) =>
                updateFormData("fear", value[0])
              }
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Respect</Label>
              <span className="text-sm font-mono">{formData.respect}%</span>
            </div>
            <Slider
              value={[formData.respect]}
              onValueChange={(value: number[]) =>
                updateFormData("respect", value[0])
              }
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isMutual"
              checked={formData.isMutual}
              onChange={(e) => updateFormData("isMutual", e.target.checked)}
              className="checkbox"
            />
            <Label htmlFor="isMutual">
              Mutual relationship (both characters feel the same way)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="discoveredByPlayers"
              checked={formData.discoveredByPlayers}
              onChange={(e) =>
                updateFormData("discoveredByPlayers", e.target.checked)
              }
              className="checkbox"
            />
            <Label htmlFor="discoveredByPlayers">
              Discovered by players (visible in character sheets)
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <EyeOff className="w-4 h-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Update"}
        </Button>
      </div>
    </form>
  );
}
