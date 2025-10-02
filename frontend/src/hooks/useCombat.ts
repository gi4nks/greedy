import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CombatEncounter, CombatParticipant, CombatCondition } from '@greedy/shared';

const API_BASE = '/api';

// Combat Encounters hooks
export const useCombatEncounters = (sessionId?: number) => {
  return useQuery({
    queryKey: ['combat-encounters', sessionId],
    queryFn: async () => {
      const params = sessionId ? `?sessionId=${sessionId}` : '';
      const response = await fetch(`${API_BASE}/combat${params}`);
      if (!response.ok) throw new Error('Failed to fetch combat encounters');
      return response.json();
    },
  });
};

export const useCombatEncounter = (id: number) => {
  return useQuery({
    queryKey: ['combat-encounter', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/combat/${id}`);
      if (!response.ok) throw new Error('Failed to fetch combat encounter');
      return response.json();
    },
    enabled: !!id,
  });
};

export const useCombatParticipants = (encounterId: number) => {
  return useQuery({
    queryKey: ['combat-participants', encounterId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/combat/${encounterId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch combat participants');
      return response.json();
    },
    enabled: !!encounterId,
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useCreateCombatEncounter = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async (encounter: Omit<CombatEncounter, 'id' | 'createdAt'>) => {
      const response = await fetch(`${API_BASE}/combat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: encounter.name, sessionId: encounter.sessionId, round: 1, status: 'active' }),
      });
      if (!response.ok) throw new Error('Failed to create combat encounter');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combat-encounters'] });
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useUpdateCombatEncounter = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async ({ id, encounter }: { id: number; encounter: Partial<CombatEncounter> }) => {
      const response = await fetch(`${API_BASE}/combat/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encounter),
      });
      if (!response.ok) throw new Error('Failed to update combat encounter');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combat-encounters'] });
      queryClient.invalidateQueries({ queryKey: ['combat-encounter'] });
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useDeleteCombatEncounter = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE}/combat/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete combat encounter');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combat-encounters'] });
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useCreateCombatParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async (participant: Omit<CombatParticipant, 'id'>) => {
      const response = await fetch(`${API_BASE}/combat/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participant),
      });
      if (!response.ok) throw new Error('Failed to create combat participant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combat-participants'] });
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useUpdateCombatParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async ({ id, participant }: { id: number; participant: Partial<CombatParticipant> }) => {
      const response = await fetch(`${API_BASE}/combat/participants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participant),
      });
      if (!response.ok) throw new Error('Failed to update combat participant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combat-participants'] });
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useDeleteCombatParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE}/combat/participants/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete combat participant');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combat-participants'] });
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useCreateCombatCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async (condition: Omit<CombatCondition, 'id' | 'createdAt'>) => {
      const response = await fetch(`${API_BASE}/combat/conditions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(condition),
      });
      if (!response.ok) throw new Error('Failed to create combat condition');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combat-conditions'] });
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useUpdateCombatCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async ({ id, condition }: { id: string; condition: Partial<CombatCondition> }) => {
      const response = await fetch(`${API_BASE}/combat/conditions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(condition),
      });
      if (!response.ok) throw new Error('Failed to update combat condition');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combat-conditions'] });
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useDeleteCombatCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/combat/conditions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete combat condition');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combat-conditions'] });
    },
  });
};