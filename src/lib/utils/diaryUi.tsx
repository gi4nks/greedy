import type { ReactElement } from "react";
import type { DiaryEntry, DiaryLinkedEntity } from "@/lib/types/diary";

export function highlightSearchTerms(
  text: string,
  searchQuery: string,
): (string | ReactElement)[] {
  if (!searchQuery.trim()) return [text];

  const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={`${part}-${index}`} className="bg-yellow-200 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function getLinkedEntityRoute(
  entity: DiaryLinkedEntity,
  campaignId: number,
): string | null {
  const routes: Record<string, string> = {
    character: `/campaigns/${campaignId}/characters/${entity.id}`,
    location: `/campaigns/${campaignId}/locations/${entity.id}`,
    session: `/campaigns/${campaignId}/sessions/${entity.id}`,
    quest: `/campaigns/${campaignId}/quests/${entity.id}`,
    "magic-item": `/campaigns/${campaignId}/magic-items/${entity.id}`,
    adventure: `/campaigns/${campaignId}/adventures/${entity.id}`,
  };

  return routes[entity.type] ?? null;
}

export function filterDiaryEntries(
  entries: DiaryEntry[],
  searchQuery: string,
  entityFilter: string[],
): DiaryEntry[] {
  return entries.filter((entry) => {
    const contentMatches =
      !searchQuery.trim() ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.linkedEntities?.some((entity) =>
        entity.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const entityMatches =
      entityFilter.length === 0 ||
      entry.linkedEntities?.some((entity) => entityFilter.includes(entity.type));

    return contentMatches && entityMatches;
  });
}

export function sortDiaryEntries(entries: DiaryEntry[]): DiaryEntry[] {
  const parseDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getTime();
  };

  return [...entries].sort((a, b) => {
    try {
      return parseDate(b.date) - parseDate(a.date);
    } catch {
      return b.date.localeCompare(a.date);
    }
  });
}
