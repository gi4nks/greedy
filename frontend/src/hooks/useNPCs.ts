import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NPC } from '@greedy/shared';

export function useNPCs(adventureId?: number) {
  return useQuery({
    queryKey: ['npcs', adventureId],
    queryFn: async () => {
      const params = adventureId ? `?adventure=${adventureId}` : '';
      const response = await fetch(`/api/npcs${params}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<NPC[]>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useNPC(id: number) {
  return useQuery({
    queryKey: ['npc', id],
    queryFn: async () => {
      const response = await fetch(`/api/npcs/${id}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<NPC>;
    },
    enabled: !!id,
  });
}

export function useCreateNPC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (npc: Omit<NPC, 'id'>) => {
      const response = await fetch('/api/npcs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(npc),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<NPC>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['npcs'] });
    },
  });
}

export function useUpdateNPC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, npc }: { id: number; npc: Partial<NPC> }) => {
      const response = await fetch(`/api/npcs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(npc),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<NPC>;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['npcs'] });
      void queryClient.invalidateQueries({ queryKey: ['npc', data.id] });
    },
  });
}

export function useDeleteNPC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/npcs/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['npcs'] });
    },
  });
}