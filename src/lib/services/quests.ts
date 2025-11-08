import { db } from "@/lib/db";
import { quests } from "@/lib/db/schema";
import { formatSqlTimestamp, parseJsonField, parseNumberField } from "@/lib/utils/form-data";
import { CreateQuestSchema } from "@/lib/validation/schemas";
import { eq } from "drizzle-orm";
import { z } from "zod";

type QuestInsert = typeof quests.$inferInsert;
export type QuestFormInput = z.infer<typeof CreateQuestSchema>;

export function parseQuestFormData(formData: FormData) {
  const payload: Record<string, unknown> = {
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? undefined,
    adventureId: parseNumberField(formData.get("adventureId")),
    status: formData.get("status") ?? undefined,
    priority: formData.get("priority") ?? undefined,
    type: formData.get("type") ?? undefined,
    dueDate: formData.get("dueDate") ?? undefined,
    assignedTo: formData.get("assignedTo") ?? undefined,
    campaignId: parseNumberField(formData.get("campaignId")),
    tags: parseJsonField<string[]>(formData.get("tags"), []),
    images: parseJsonField<Record<string, unknown>[]>(formData.get("images"), []),
  };

  return CreateQuestSchema.safeParse(payload);
}

function serializeQuestPayload(
  data: QuestFormInput,
): Omit<QuestInsert, "id" | "createdAt" | "updatedAt"> {
  return {
    adventureId: data.adventureId!,
    title: data.title,
    description: data.description ?? null,
    status: data.status ?? "active",
    priority: data.priority ?? "medium",
    type: data.type ?? "main",
    dueDate: data.dueDate ?? null,
    assignedTo: data.assignedTo ?? null,
    tags: data.tags && data.tags.length ? JSON.stringify(data.tags) : null,
    images:
      data.images && data.images.length ? JSON.stringify(data.images) : null,
  };
}

export async function insertQuestRecord(data: QuestFormInput) {
  const now = formatSqlTimestamp();
  const payload: QuestInsert = {
    ...serializeQuestPayload(data),
    createdAt: now,
    updatedAt: now,
  };

  const [record] = await db.insert(quests).values(payload).returning();
  return record;
}

export async function updateQuestRecord(id: number, data: QuestFormInput) {
  const now = formatSqlTimestamp();
  const payload = {
    ...serializeQuestPayload(data),
    updatedAt: now,
  };

  const [record] = await db
    .update(quests)
    .set(payload)
    .where(eq(quests.id, id))
    .returning();

  return record;
}
