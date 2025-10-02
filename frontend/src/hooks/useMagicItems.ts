import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MagicItem } from '@greedy/shared';

export function useMagicItems() {
  return useQuery({
    queryKey: ['magic-items'],
    queryFn: async () => {
      const response = await fetch('/api/magic-items');
      if (!response.ok) {
        throw new Error('Failed to fetch magic items');
      }
      return response.json() as Promise<MagicItem[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMagicItem(id: number) {
  return useQuery({
    queryKey: ['magic-item', id],
    queryFn: async () => {
      const response = await fetch(`/api/magic-items/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch magic item');
      }
      return response.json() as Promise<MagicItem>;
    },
    enabled: !!id,
  });
}

export function useCreateMagicItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<MagicItem, 'id'>) => {
      const response = await fetch('/api/magic-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        throw new Error('Failed to create magic item');
      }
      return response.json() as Promise<MagicItem>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['magic-items'] });
    },
  });
}

export function useUpdateMagicItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MagicItem> }) => {
      const response = await fetch(`/api/magic-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update magic item');
      }
      return response.json() as Promise<MagicItem>;
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
      const response = await fetch(`/api/magic-items/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete magic item');
      }
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['magic-items'] });
    },
  });
}

export function useAssignMagicItem() {
  const queryClient = useQueryClient();

  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async ({ itemId, characterIds }: { itemId: number; characterIds: number[] }) => {
      const response = await fetch(`/api/magic-items/${itemId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ characterIds }),
      });
      if (!response.ok) {
        throw new Error('Failed to assign magic item');
      }
      return response.json();
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
      const response = await fetch(`/api/magic-items/${itemId}/assign/${characterId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to unassign magic item');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['magic-items'] });
      void queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}