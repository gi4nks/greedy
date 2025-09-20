import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { MagicItem } from '@greedy/shared';

export function useMagicItems() {
  return useQuery({
    queryKey: ['magic-items'],
    queryFn: async () => {
      const response = await axios.get('/api/magic-items');
      return response.data as MagicItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMagicItem(id: number) {
  return useQuery({
    queryKey: ['magic-item', id],
    queryFn: async () => {
      const response = await axios.get(`/api/magic-items/${id}`);
      return response.data as MagicItem;
    },
    enabled: !!id,
  });
}

export function useCreateMagicItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<MagicItem, 'id'>) => {
      const response = await axios.post('/api/magic-items', item);
      return response.data as MagicItem;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['magic-items'] });
    },
  });
}

export function useUpdateMagicItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, item }: { id: number; item: Partial<MagicItem> }) => {
      const response = await axios.put(`/api/magic-items/${id}`, item);
      return response.data as MagicItem;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['magic-items'] });
      void queryClient.invalidateQueries({ queryKey: ['magic-item', data.id] });
    },
  });
}

export function useDeleteMagicItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/magic-items/${id}`);
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['magic-items'] });
    },
  });
}

export function useAssignMagicItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, characterIds }: { itemId: number; characterIds: number[] }) => {
      const response = await axios.post(`/api/magic-items/${itemId}/assign`, { characterIds });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['magic-items'] });
      void queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useUnassignMagicItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, characterId }: { itemId: number; characterId: number }) => {
      await axios.delete(`/api/magic-items/${itemId}/assign/${characterId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['magic-items'] });
      void queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}