import { useQuery } from '@tanstack/react-query';
import { SearchResult } from '@greedy/shared';

export function useSearch(query: string, adventureId?: number) {
  return useQuery({
    queryKey: ['search', query, adventureId],
    queryFn: async () => {
      if (!query.trim()) {
        return { sessions: [], npcs: [], locations: [], characters: [], 
          quests: [], magicItems: [] } as SearchResult;
      }

      const params = new URLSearchParams({ q: query });
      if (adventureId) {
        params.set('adventure', adventureId.toString());
      }

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to search');
      }
      return response.json() as Promise<SearchResult>;
    },
    enabled: query.length > 0,
    staleTime: 30 * 1000, // 30 seconds for search results
  });
}