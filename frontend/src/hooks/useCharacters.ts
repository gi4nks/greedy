import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Character } from '@greedy/shared';

export function useCharacters(adventureId?: number) {
  return useQuery({
    queryKey: ['characters', adventureId],
    queryFn: async () => {
      const params = adventureId ? `?adventure=${adventureId}` : '';
      const response = await fetch(`/api/characters${params}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Character[]>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCharacter(id: number) {
  return useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      const response = await fetch(`/api/characters/${id}`);
      if (!response.ok) throw new Error('Network response was not ok');
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
      if (!response.ok) throw new Error('Network response was not ok');
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
    mutationFn: async ({ id, character }: { id: number; character: Partial<Character> }) => {
      const response = await fetch(`/api/characters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(character),
      });
      if (!response.ok) throw new Error('Network response was not ok');
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
      if (!response.ok) throw new Error('Network response was not ok');
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}