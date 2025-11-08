import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { formatSqlTimestamp, parseNumberField, parseStringArrayField, parseStringField } from "@/lib/utils/form-data";
import { CampaignFormSchema } from "@/lib/forms";
import type { CampaignFormData } from "@/lib/forms";
import { eq } from "drizzle-orm";

export function parseCampaignFormData(formData: FormData) {
  const payload = {
    title: parseStringField(formData.get("title"), { emptyAsUndefined: false }),
    description: parseStringField(formData.get("description"), {
      emptyAsUndefined: false,
    }),
    status: parseStringField(formData.get("status")),
    startDate: parseStringField(formData.get("startDate")),
    endDate: parseStringField(formData.get("endDate")),
    gameEditionId: parseNumberField(formData.get("gameEditionId")),
    tags: parseStringArrayField(formData.get("tags")),
  };

  return CampaignFormSchema.safeParse(payload);
}

export async function insertCampaignRecord(data: CampaignFormData) {
  const now = formatSqlTimestamp();
  const [campaign] = await db
    .insert(campaigns)
    .values({
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? "active",
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      gameEditionId: data.gameEditionId ?? 1,
      tags: JSON.stringify(data.tags ?? []),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return campaign;
}

export async function updateCampaignRecord(id: number, data: CampaignFormData) {
  const now = formatSqlTimestamp();
  await db
    .update(campaigns)
    .set({
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? "active",
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      gameEditionId: data.gameEditionId ?? 1,
      tags: JSON.stringify(data.tags ?? []),
      updatedAt: now,
    })
    .where(eq(campaigns.id, id));
}
