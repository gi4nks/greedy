import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Session } from '@greedy/shared';

export function useSessions(adventureId?: number, searchTerm?: string) {
  return useQuery({
    queryKey: ['sessions', adventureId, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (adventureId) params.set('adventure', adventureId.toString());
      if (searchTerm?.trim()) params.set('search', searchTerm.trim());
      const response = await fetch(`/api/sessions${params.toString() ? `?${params.toString()}` : ''}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Session[]>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useSession(id: number) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${id}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Session>;
    },
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: Omit<Session, 'id'>) => {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Session>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['adventure-counts'] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, session }: { id: number; session: Partial<Session> }) => {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Session>;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['session', data.id] });
      void queryClient.invalidateQueries({ queryKey: ['adventure-counts'] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['adventure-counts'] });
    },
  });
}