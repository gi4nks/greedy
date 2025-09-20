import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ParkingLotItem {
  id?: number;
  name: string;
  description: string;
  content_type: string;
  wiki_url?: string;
  tags?: string[];
  created_at?: string;
}

export function useParkingLot() {
  return useQuery({
    queryKey: ['parking-lot'],
    queryFn: async () => {
      const response = await fetch('/api/parking-lot');
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<ParkingLotItem[]>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateParkingLotItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<ParkingLotItem, 'id' | 'created_at'>) => {
      const response = await fetch('/api/parking-lot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<{ id: number; message: string }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['parking-lot'] });
    },
  });
}

export function useDeleteParkingLotItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/parking-lot/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['parking-lot'] });
    },
  });
}

export function useMoveParkingLotItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, targetSection }: { id: number; targetSection: string }) => {
      const response = await fetch(`/api/parking-lot/${id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetSection }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<{ message: string }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['parking-lot'] });
      // Invalidate related queries that might have been affected
      void queryClient.invalidateQueries({ queryKey: ['characters'] });
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
      void queryClient.invalidateQueries({ queryKey: ['magic-items'] });
      void queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
}