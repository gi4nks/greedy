import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types for Location
export interface Location {
  id: number;
  name: string;
  description?: string;
  notes?: string;
  adventure_id?: number;
  tags?: string[];
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/locations');
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      return response.json() as Promise<Location[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLocation(id: number) {
  return useQuery({
    queryKey: ['location', id],
    queryFn: async () => {
      const response = await fetch(`/api/locations/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }
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
      if (!response.ok) {
        throw new Error('Failed to create location');
      }
      return response.json() as Promise<Location>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Location> }) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update location');
      }
      return response.json() as Promise<Location>;
    },
    onSuccess: (data: Location) => {
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
      void queryClient.invalidateQueries({ queryKey: ['location', data.id] });
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
      if (!response.ok) {
        throw new Error('Failed to delete location');
      }
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}