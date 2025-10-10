// Timeline actions - commented out until timeline_events table is created
"use server";

import { db } from "../db";
import { timelineEvents, sessions, adventures } from "../db/schema";
import { eq, desc, gte, lte, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTimelineEvents(campaignId: number, filters?: {
  eventTypes?: string[];
  minImportance?: number;
  startDate?: string;
  endDate?: string;
}) {
  const conditions = [eq(timelineEvents.campaignId, campaignId)];

  // Apply filters
  if (filters?.eventTypes && filters.eventTypes.length > 0) {
    conditions.push(inArray(timelineEvents.eventType, filters.eventTypes));
  }

  if (filters?.minImportance) {
    conditions.push(gte(timelineEvents.importanceLevel, filters.minImportance));
  }

  if (filters?.startDate && filters?.endDate) {
    conditions.push(gte(timelineEvents.realDate, filters.startDate));
    conditions.push(lte(timelineEvents.realDate, filters.endDate));
  }

  const events = await db
    .select()
    .from(timelineEvents)
    .where(and(...conditions))
    .orderBy(desc(timelineEvents.realDate));

  return events;
}

export async function createTimelineEvent(formData: FormData) {
  const campaignId = Number(formData.get("campaignId"));
  const eventType = formData.get("eventType") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const gameDate = formData.get("gameDate") as string;
  const realDate = formData.get("realDate") as string;
  const importanceLevel = Number(formData.get("importanceLevel")) || 3;
  const tags = formData.get("tags") as string;
  const sessionId = formData.get("sessionId") ? Number(formData.get("sessionId")) : null;
  const characterId = formData.get("characterId") ? Number(formData.get("characterId")) : null;
  const locationId = formData.get("locationId") ? Number(formData.get("locationId")) : null;
  const questId = formData.get("questId") ? Number(formData.get("questId")) : null;

  if (!title?.trim() || !realDate?.trim()) {
    throw new Error("Title and real date are required");
  }

  await db.insert(timelineEvents).values({
    campaignId,
    eventType,
    title: title.trim(),
    description: description?.trim() || null,
    gameDate: gameDate?.trim() || null,
    realDate: realDate.trim(),
    importanceLevel,
    tags: tags ? JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t)) : null,
    sessionId,
    relatedEntities: JSON.stringify({
      characterId: characterId || null,
      locationId: locationId || null,
      questId: questId || null,
    }),
  });

  revalidatePath(`/campaigns/${campaignId}/timeline`);
}

export async function updateTimelineEvent(id: number, formData: FormData) {
  const eventType = formData.get("eventType") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const gameDate = formData.get("gameDate") as string;
  const realDate = formData.get("realDate") as string;
  const importanceLevel = Number(formData.get("importanceLevel"));
  const tags = formData.get("tags") as string;

  if (!title?.trim() || !realDate?.trim()) {
    throw new Error("Title and real date are required");
  }

  await db
    .update(timelineEvents)
    .set({
      eventType,
      title: title.trim(),
      description: description?.trim() || null,
      gameDate: gameDate?.trim() || null,
      realDate: realDate.trim(),
      importanceLevel,
      tags: tags ? JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t)) : null,
    })
    .where(eq(timelineEvents.id, id));

  revalidatePath(`/campaigns/${id}/timeline`);
}

export async function deleteTimelineEvent(id: number) {
  const event = await db
    .select({ campaignId: timelineEvents.campaignId })
    .from(timelineEvents)
    .where(eq(timelineEvents.id, id))
    .limit(1);

  if (event.length > 0) {
    await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
    revalidatePath(`/campaigns/${event[0].campaignId}/timeline`);
  }
}

// Auto-create timeline events from session logs
export async function createTimelineEventFromSessionLog(sessionId: number, entryType: string, content: string) {
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (session.length === 0 || !session[0].adventureId) return;

  // Find the campaign for this session (through adventure)
  const adventure = await db
    .select()
    .from(adventures)
    .where(eq(adventures.id, session[0].adventureId))
    .limit(1);

  if (adventure.length === 0 || !adventure[0].campaignId) return;

  const campaignId = adventure[0].campaignId;
  const eventTitle = entryType === 'combat' ? 'Combat Encounter' : 'Session Milestone';
  const importanceLevel = entryType === 'combat' ? 4 : 3;

  await db.insert(timelineEvents).values({
    campaignId,
    eventType: entryType === 'combat' ? 'combat' : 'session',
    title: eventTitle,
    description: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
    realDate: session[0].date,
    sessionId,
    importanceLevel,
  });

  revalidatePath(`/campaigns/${campaignId}/timeline`);
}