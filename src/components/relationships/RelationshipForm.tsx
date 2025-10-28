"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  createRelationship,
  updateRelationship,
} from "@/lib/actions/relationships";
import { StandardEntityForm } from "@/components/ui/entity-form";
import { FormField, FormSection } from "@/components/ui/form-components";

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
  }>;
  playerCharacters: Array<{
    id: number;
    name: string;
    race: string | null;
    classes: unknown;
  }>;
  mode: "create" | "edit";
  relationship?: Relationship;
}

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
  }>;
  playerCharacters: Array<{
    id: number;
    name: string;
    race: string | null;
    classes: unknown;
  }>;
  mode: "create" | "edit";
  relationship?: Relationship;
}

export default function RelationshipForm({
  npcs,
  playerCharacters,
  mode,
  relationship,
}: RelationshipFormProps) {
  // Server action setup
  const createOrUpdateRelationship = async (prevState: { success: boolean; error?: string }, formData: FormData) => {
    if (mode === "edit" && relationship?.id) {
      return await updateRelationship(relationship.id, prevState, formData);
    } else {
      return await createRelationship(prevState, formData);
    }
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
    <StandardEntityForm
      mode={mode}
      entity={relationship}
      action={createOrUpdateRelationship}
      title="Relationship"
      redirectPath="/relationships"
    >
      <FormSection title="Relationship Details">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="NPC *">
            <Select name="npcId" defaultValue={relationship?.npcId?.toString()}>
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
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Player Character *">
            <Select name="characterId" defaultValue={relationship?.characterId?.toString()}>
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
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField label="Relationship Type">
          <Select name="relationshipType" defaultValue={relationship?.relationshipType || "neutral"}>
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
        </FormField>

        <FormField label="Description">
          <Textarea
            name="description"
            defaultValue={relationship?.notes || ""}
            rows={3}
            placeholder="Describe the nature of this relationship..."
          />
        </FormField>
      </FormSection>

      <FormSection title="Relationship Metrics">
        <div className="space-y-6">
          <FormField label="Overall Strength">
            <div className="space-y-2">
              <Slider
                name="strength"
                defaultValue={[relationship?.strength || 50]}
                max={100}
                min={-100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-base-content/70">
                <span>Hatred (-100)</span>
                <span>Neutral (0)</span>
                <span>Devotion (100)</span>
              </div>
            </div>
          </FormField>

          <FormField label="Trust">
            <Slider
              name="trust"
              defaultValue={[relationship?.trust || 50]}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </FormField>

          <FormField label="Fear">
            <Slider
              name="fear"
              defaultValue={[relationship?.fear || 0]}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </FormField>

          <FormField label="Respect">
            <Slider
              name="respect"
              defaultValue={[relationship?.respect || 50]}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Additional Settings">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              name="isMutual"
              defaultChecked={relationship?.isMutual ?? true}
            />
            <Label htmlFor="isMutual">
              Mutual relationship (both characters feel the same way)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              name="discoveredByPlayers"
              defaultChecked={relationship?.discoveredByPlayers ?? false}
            />
            <Label htmlFor="discoveredByPlayers">
              Discovered by players (visible in character sheets)
            </Label>
          </div>
        </div>
      </FormSection>
    </StandardEntityForm>
  );
}
