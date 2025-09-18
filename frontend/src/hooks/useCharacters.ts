import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Character } from '@greedy/shared';

export function useCharacters(adventureId?: number) {
  return useQuery({
    queryKey: ['characters', adventureId],
    queryFn: async () => {
      const params = adventureId ? { adventure: adventureId } : {};
      const response = await axios.get('/api/characters', { params });
      return response.data as Character[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCharacter(id: number) {
  return useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      const response = await axios.get(`/api/characters/${id}`);
      return response.data as Character;
    },
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (character: Omit<Character, 'id'>) => {
      const response = await axios.post('/api/characters', character);
      return response.data as Character;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, character }: { id: number; character: Partial<Character> }) => {
      const response = await axios.put(`/api/characters/${id}`, character);
      return response.data as Character;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['character', data.id] });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/characters/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}