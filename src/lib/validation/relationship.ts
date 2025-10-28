import { z } from "zod";

// Relationship form schema
export const relationshipSchema = z.object({
  npcId: z.string().min(1, "NPC is required"),
  characterId: z.string().min(1, "Player character is required"),
  relationshipType: z.enum(["ally", "enemy", "neutral", "romantic", "family", "friend", "rival"]).refine((val) => val, {
    message: "Please select a valid relationship type",
  }),
  strength: z.number().min(-100).max(100),
  trust: z.number().min(0).max(100),
  fear: z.number().min(0).max(100),
  respect: z.number().min(0).max(100),
  description: z.string().max(1000, "Description must be less than 1000 characters"),
  isMutual: z.boolean(),
  discoveredByPlayers: z.boolean(),
});

// Form data type
export type RelationshipFormData = z.infer<typeof relationshipSchema>;