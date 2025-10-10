import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types for Character
export interface Character {
  id: number;
  name: string;
  race?: string;
  level: number;
  role?: string;
  description?: string;
  tags?: string[];
  adventure_id?: number;
  experience?: number;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  hitPoints?: number;
  maxHitPoints?: number;
  armorClass?: number;
  initiative?: number;
  speed?: number;
  proficiencyBonus?: number;
  spells?: Array<{
    level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    name: string;
    prepared: boolean;
  }>;
  wiki_url?: string;
}

export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const response = await fetch('/api/characters');
      if (!response.ok) {
        throw new Error('Failed to fetch characters');
      }
      return response.json() as Promise<Character[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCharacter(id: number) {
  return useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      const response = await fetch(`/api/characters/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch character');
      }
      return response.json() as Promise<Character>;
    },
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (character: Omit<Character, 'id'>) => {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(character),
      });
      if (!response.ok) {
        throw new Error('Failed to create character');
      }
      return response.json() as Promise<Character>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Character> }) => {
      const response = await fetch(`/api/characters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update character');
      }
      return response.json() as Promise<Character>;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['characters'] });
      void queryClient.invalidateQueries({ queryKey: ['character', data.id] });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/characters/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete character');
      }
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}