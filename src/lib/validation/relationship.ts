import { z } from "zod";

const entityIdSchema = z.number().int().positive();
const metricField = (min: number, max: number, defaultValue: number) =>
  z
    .number()
    .int()
    .min(min)
    .max(max)
    .default(defaultValue);

// Relationship form schema
export const relationshipSchema = z.object({
  npcId: entityIdSchema,
  characterId: entityIdSchema,
  relationshipType: z.enum(["ally", "enemy", "neutral", "romantic", "family", "friend", "rival"]),
  strength: metricField(-100, 100, 50),
  trust: metricField(0, 100, 50),
  fear: metricField(0, 100, 0),
  respect: metricField(0, 100, 50),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional().default(""),
  isMutual: z.boolean().default(true),
  discoveredByPlayers: z.boolean().default(false),
});

// Form data type
export type RelationshipFormData = z.infer<typeof relationshipSchema>;
