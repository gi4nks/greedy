import { useQuery } from '@tanstack/react-query';

type ExportPayload = {
  adventures: { id?: number; slug?: string; title: string; description?: string }[];
  sessions: { id?: number; adventure_id?: number }[];
  characters: { id?: number; adventure_id?: number }[];
  locations: { id?: number; adventure_id?: number }[];
  quests: { id?: number; adventure_id?: number }[];
};

type AdventureCounts = Record<number, { sessions: number; characters: number; locations: number; quests: number } | undefined>;

export function useAdventureCounts(): { data: AdventureCounts | undefined; isLoading: boolean } {
  return useQuery({
    queryKey: ['adventure-counts'],
    queryFn: async () => {
      const response = await fetch('/api/export');
      if (!response.ok) throw new Error('Network response was not ok');
      const payload: ExportPayload = await response.json();

      const byId: AdventureCounts = {};
      (payload.adventures || []).forEach((a) => {
        if (a && a.id) byId[a.id] = { sessions: 0, characters: 0, locations: 0, quests: 0 };
      });
      (payload.sessions || []).forEach((s) => {
        if (s && s.adventure_id && byId[s.adventure_id]) byId[s.adventure_id]!.sessions += 1;
      });
      (payload.characters || []).forEach((c) => {
        if (c && c.adventure_id && byId[c.adventure_id]) byId[c.adventure_id]!.characters += 1;
      });
      (payload.locations || []).forEach((l) => {
        if (l && l.adventure_id && byId[l.adventure_id]) byId[l.adventure_id]!.locations += 1;
      });
      (payload.quests || []).forEach((q) => {
        if (q && q.adventure_id && byId[q.adventure_id]) byId[q.adventure_id]!.quests += 1;
      });

      return byId;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}