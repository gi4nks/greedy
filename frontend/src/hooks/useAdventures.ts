import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Adventure {
  id?: number;
  slug?: string;
  title: string;
  description?: string;
}

export function useAdventures() {
  return useQuery({
    queryKey: ['adventures'],
    queryFn: async () => {
      const response = await fetch('/api/adventures');
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Adventure[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAdventure(id: number) {
  return useQuery({
    queryKey: ['adventure', id],
    queryFn: async () => {
      const response = await fetch(`/api/adventures/${id}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Adventure>;
    },
    enabled: !!id,
  });
}

export function useCreateAdventure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adventure: Omit<Adventure, 'id'>) => {
      const response = await fetch('/api/adventures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adventure),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Adventure>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adventures'] });
    },
  });
}

export function useUpdateAdventure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, adventure }: { id: number; adventure: Partial<Adventure> }) => {
      const response = await fetch(`/api/adventures/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adventure),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Adventure>;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['adventures'] });
      void queryClient.invalidateQueries({ queryKey: ['adventure', data.id] });
    },
  });
}

export function useDeleteAdventure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/adventures/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adventures'] });
    },
  });
}