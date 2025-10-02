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
      void queryClient.invalidateQueries({ queryKey: ['adventure-counts'] });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Omit<Character, 'id'> }) => {
      const response = await fetch(`/api/characters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        // Log the error response for debugging
        const errorText = await response.text();
        console.error('Character update failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          requestData: data
        });
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return response.json() as Promise<Character>;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['characters'] });
      void queryClient.invalidateQueries({ queryKey: ['character', data.id] });
      void queryClient.invalidateQueries({ queryKey: ['adventure-counts'] });
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
      void queryClient.invalidateQueries({ queryKey: ['adventure-counts'] });
    },
  });
}