import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Location {
  id?: number;
  adventure_id?: number;
  name: string;
  description?: string;
  notes?: string;
  tags?: string[];
}

export function useLocations(adventureId?: number) {
  return useQuery({
    queryKey: ['locations', adventureId],
    queryFn: async () => {
      const params = adventureId ? `?adventure=${adventureId}` : '';
      const response = await fetch(`/api/locations${params}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Location[]>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useLocation(id: number) {
  return useQuery({
    queryKey: ['location', id],
    queryFn: async () => {
      const response = await fetch(`/api/locations/${id}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Location>;
    },
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location: Omit<Location, 'id'>) => {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(location),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Location>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
      void queryClient.invalidateQueries({ queryKey: ['adventure-counts'] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, location }: { id: number; location: Partial<Location> }) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(location),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Location>;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
      void queryClient.invalidateQueries({ queryKey: ['location', data.id] });
      void queryClient.invalidateQueries({ queryKey: ['adventure-counts'] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
      void queryClient.invalidateQueries({ queryKey: ['adventure-counts'] });
    },
  });
}