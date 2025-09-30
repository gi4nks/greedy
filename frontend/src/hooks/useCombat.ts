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

export const useCreateCombatEncounter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (encounter: Omit<CombatEncounter, 'id' | 'createdAt'>) => {
      const response = await fetch(`${API_BASE}/combat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encounter),
      });
      if (!response.ok) throw new Error('Failed to create combat encounter');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combat-encounters'] });
    },
  });
};

export const useUpdateCombatEncounter = () => {
  const queryClient = useQueryClient();
  return useMutation({
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

export const useDeleteCombatEncounter = () => {
  const queryClient = useQueryClient();
  return useMutation({
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

// Combat Participants hooks
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

export const useCreateCombatParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
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

export const useUpdateCombatParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
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

export const useDeleteCombatParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
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

// Combat Conditions hooks
export const useCombatConditions = (participantId: number) => {
  return useQuery({
    queryKey: ['combat-conditions', participantId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/combat/participants/${participantId}/conditions`);
      if (!response.ok) throw new Error('Failed to fetch combat conditions');
      return response.json();
    },
    enabled: !!participantId,
  });
};

export const useCreateCombatCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
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

export const useUpdateCombatCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
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

export const useDeleteCombatCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
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