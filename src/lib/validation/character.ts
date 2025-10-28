import { z } from "zod";

// Character validation schema
export const characterSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),

  race: z.string()
    .max(50, "Race must be less than 50 characters")
    .optional()
    .or(z.literal("")),

  background: z.string()
    .max(1000, "Background must be less than 1000 characters")
    .optional()
    .or(z.literal("")),

  alignment: z.enum([
    "Lawful Good",
    "Neutral Good",
    "Chaotic Good",
    "Lawful Neutral",
    "True Neutral",
    "Chaotic Neutral",
    "Lawful Evil",
    "Neutral Evil",
    "Chaotic Evil"
  ]),

  description: z.string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .or(z.literal("")),

  characterType: z.enum(["player", "npc", "monster"]),

  campaignId: z.number().int().positive("Campaign ID is required"),

  adventureId: z.number().int().positive().optional().nullable(),

  // Ability scores
  strength: z.number().int().min(1).max(30),
  dexterity: z.number().int().min(1).max(30),
  constitution: z.number().int().min(1).max(30),
  intelligence: z.number().int().min(1).max(30),
  wisdom: z.number().int().min(1).max(30),
  charisma: z.number().int().min(1).max(30),

  // Combat stats
  hitPoints: z.number().int().min(0),
  maxHitPoints: z.number().int().min(0),
  armorClass: z.number().int().min(0).max(50),

  // Classes as JSON string or array
  classes: z.union([
    z.string(), // JSON string
    z.array(z.object({
      name: z.string().min(1, "Class name is required").max(50, "Class name too long"),
      level: z.number().int().min(1).max(20)
    }))
  ]).transform((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }),

  // Images as JSON string
  images: z.union([
    z.string(),
    z.array(z.object({
      id: z.string(),
      filename: z.string(),
      url: z.string(),
      alt: z.string().optional()
    }))
  ]).transform((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }).optional(),

  // Tags as JSON string or array
  tags: z.union([
    z.string(),
    z.array(z.string())
  ]).transform((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }).optional()
});

// Type inference
export type CharacterFormData = z.infer<typeof characterSchema>;

// Diary entry validation schema
export const diaryEntrySchema = z.object({
  description: z.string()
    .min(1, "Description is required")
    .max(5000, "Description must be less than 5000 characters"),

  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),

  linkedEntities: z.array(z.object({
    id: z.string(),
    type: z.string(),
    name: z.string()
  })).default([]),

  isImportant: z.boolean().default(false)
});

export type DiaryEntryFormData = z.infer<typeof diaryEntrySchema>;