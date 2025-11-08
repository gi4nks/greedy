import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { formatSqlTimestamp, parseJsonField, parseNumberField } from "@/lib/utils/form-data";
import { CreateCharacterSchema } from "@/lib/validation/schemas";
import { eq } from "drizzle-orm";
import { z } from "zod";

type CharacterInsert = typeof characters.$inferInsert;
export type CharacterFormInput = z.infer<typeof CreateCharacterSchema>;

type ClassEntry = {
  name: string;
  level: number;
};

type ImageEntry = {
  filename?: string;
  url: string;
  uploadedAt?: string;
};

export function parseCharacterFormData(formData: FormData) {
  const payload: Record<string, unknown> = {
    campaignId: parseNumberField(formData.get("campaignId")),
    adventureId: parseNumberField(formData.get("adventureId")),
    characterType: formData.get("characterType") ?? undefined,
    name: formData.get("name") ?? "",
    race: formData.get("race") ?? undefined,
    background: formData.get("background") ?? undefined,
    alignment: formData.get("alignment") ?? undefined,
    strength: parseNumberField(formData.get("strength")) ?? 10,
    dexterity: parseNumberField(formData.get("dexterity")) ?? 10,
    constitution: parseNumberField(formData.get("constitution")) ?? 10,
    intelligence: parseNumberField(formData.get("intelligence")) ?? 10,
    wisdom: parseNumberField(formData.get("wisdom")) ?? 10,
    charisma: parseNumberField(formData.get("charisma")) ?? 10,
    hitPoints: parseNumberField(formData.get("hitPoints")) ?? 0,
    maxHitPoints: parseNumberField(formData.get("maxHitPoints")) ?? 0,
    armorClass: parseNumberField(formData.get("armorClass")) ?? 10,
    classes: parseJsonField<ClassEntry[]>(formData.get("classes"), []),
    description: formData.get("description") ?? undefined,
    images: parseJsonField<ImageEntry[]>(formData.get("images"), []),
    tags: parseJsonField<string[]>(formData.get("tags"), []),
  };

  return CreateCharacterSchema.safeParse(payload);
}

function serializeCharacterPayload(
  data: CharacterFormInput,
): Omit<CharacterInsert, "createdAt" | "updatedAt"> {
  return {
    campaignId: data.campaignId,
    adventureId: data.adventureId ?? null,
    characterType: data.characterType ?? "pc",
    name: data.name,
    race: data.race ?? null,
    background: data.background ?? null,
    alignment: data.alignment ?? null,
    strength: data.strength ?? 10,
    dexterity: data.dexterity ?? 10,
    constitution: data.constitution ?? 10,
    intelligence: data.intelligence ?? 10,
    wisdom: data.wisdom ?? 10,
    charisma: data.charisma ?? 10,
    hitPoints: data.hitPoints ?? 0,
    maxHitPoints: data.maxHitPoints ?? 0,
    armorClass: data.armorClass ?? 10,
    classes: JSON.stringify(data.classes ?? []),
    description: data.description ?? null,
    images: JSON.stringify(data.images ?? []),
    tags: data.tags && data.tags.length ? JSON.stringify(data.tags) : null,
  };
}

export async function insertCharacterRecord(data: CharacterFormInput) {
  const now = formatSqlTimestamp();
  const payload: CharacterInsert = {
    ...serializeCharacterPayload(data),
    createdAt: now,
    updatedAt: now,
  };

  const [record] = await db.insert(characters).values(payload).returning();
  return record;
}

export async function updateCharacterRecord(id: number, data: CharacterFormInput) {
  const now = formatSqlTimestamp();
  const payload = {
    ...serializeCharacterPayload(data),
    updatedAt: now,
  };

  const [record] = await db
    .update(characters)
    .set(payload)
    .where(eq(characters.id, id))
    .returning();

  return record;
}
