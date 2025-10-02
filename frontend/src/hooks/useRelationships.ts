import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NPCRelationship, RelationshipEvent } from '@greedy/shared';

const API_BASE = '/api';

// Relationships hooks
export const useRelationships = (npcId?: number, characterId?: number) => {
  return useQuery({
    queryKey: ['relationships', npcId, characterId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (npcId) params.append('npcId', npcId.toString());
      if (characterId) params.append('characterId', characterId.toString());
      const queryString = params.toString();
      const response = await fetch(`${API_BASE}/relationships${queryString ? `?${queryString}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch relationships');
      return response.json();
    },
  });
};

export const useRelationship = (id: number) => {
  return useQuery({
    queryKey: ['relationship', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/relationships/${id}`);
      if (!response.ok) throw new Error('Failed to fetch relationship');
      return response.json();
    },
    enabled: !!id,
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useCreateRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async (relationship: {
      npcId: number;
      characterId: number;
      relationshipType: string;
      strength: number;
      trust: number;
      fear: number;
      respect: number;
      notes?: string;
    }) => {
      const payload = {
        target_id: relationship.characterId,
        target_type: 'character',
        relationship_type: relationship.relationshipType,
        strength: relationship.strength,
        trust: relationship.trust,
        fear: relationship.fear,
        respect: relationship.respect,
        description: relationship.notes,
        is_mutual: 1,
        discovered_by_players: 0
      };
      const response = await fetch(`${API_BASE}/relationships/npcs/${relationship.npcId}/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create relationship');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useUpdateRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async ({ id, relationship }: { id: number; relationship: Partial<NPCRelationship> }) => {
      const { relationshipType, strength, trust, fear, respect, notes } = relationship;
      const relationshipData = {
        relationship_type: relationshipType,
        strength,
        trust,
        fear,
        respect,
        description: notes,
        is_mutual: 1,
        discovered_by_players: 0
      };
      const response = await fetch(`${API_BASE}/relationships/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relationshipData),
      });
      if (!response.ok) throw new Error('Failed to update relationship');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      queryClient.invalidateQueries({ queryKey: ['relationship'] });
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useDeleteRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE}/relationships/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete relationship');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
    },
  });
};

// Relationship Events hooks
export const useRelationshipEvents = (relationshipId: number) => {
  return useQuery({
    queryKey: ['relationship-events', relationshipId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/relationships/${relationshipId}/events`);
      if (!response.ok) throw new Error('Failed to fetch relationship events');
      return response.json();
    },
    enabled: !!relationshipId,
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useCreateRelationshipEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async (event: Omit<RelationshipEvent, 'id' | 'createdAt'>) => {
      // frontend event uses impactValue, trustChange, fearChange, respectChange, and relationshipId
      const { relationshipId, description, impactValue, trustChange, fearChange, respectChange, date, sessionId } = event as any;
      const payload = {
        event_type: 'changed',
        description,
        strength_change: impactValue || 0,
        trust_change: trustChange || 0,
        fear_change: fearChange || 0,
        respect_change: respectChange || 0,
        session_id: sessionId || null,
        event_date: date || new Date().toISOString()
      };

      const response = await fetch(`${API_BASE}/relationships/${relationshipId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create relationship event');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-events'] });
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useUpdateRelationshipEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async ({ id, event }: { id: number; event: Partial<RelationshipEvent> }) => {
      const response = await fetch(`${API_BASE}/relationships/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (!response.ok) throw new Error('Failed to update relationship event');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-events'] });
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
export const useDeleteRelationshipEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({ // eslint-disable-line @typescript-eslint/no-floating-promises
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE}/relationships/events/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete relationship event');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-events'] });
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
    },
  });
};
