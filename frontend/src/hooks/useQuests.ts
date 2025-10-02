import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Quest, QuestWithObjectives, QuestObjective } from '@greedy/shared';

export function useQuests(adventureId?: number) {
  return useQuery({
    queryKey: ['quests', adventureId],
    queryFn: async () => {
      const params = adventureId ? `?adventure=${adventureId}` : '';
      const response = await fetch(`/api/quests${params}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Quest[]>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useQuest(id: number) {
  return useQuery({
    queryKey: ['quest', id],
    queryFn: async () => {
      const response = await fetch(`/api/quests/${id}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<QuestWithObjectives>;
    },
    enabled: !!id,
  });
}

export function useCreateQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quest: Omit<Quest, 'id'>) => {
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quest),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Quest>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quests'] });
      void queryClient.invalidateQueries({ queryKey: ['adventure-counts'] });
    },
  });
}

export function useUpdateQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Quest> }) => {
      const response = await fetch(`/api/quests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Quest>;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['quests'] });
      void queryClient.invalidateQueries({ queryKey: ['quest', data.id] });
      void queryClient.invalidateQueries({ queryKey: ['adventure-counts'] });
    },
  });
}

export function useDeleteQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/quests/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quests'] });
      void queryClient.invalidateQueries({ queryKey: ['adventure-counts'] });
    },
  });
}

export function useAddQuestObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questId, description }: { questId: number; description: string }) => {
      const response = await fetch(`/api/quests/${questId}/objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<QuestObjective>;
    },
    onSuccess: (_, { questId }) => {
      void queryClient.invalidateQueries({ queryKey: ['quest', questId] });
      void queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
}

export function useUpdateQuestObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questId,
      objectiveId,
      description,
      completed
    }: {
      questId: number;
      objectiveId: number;
      description: string;
      completed: boolean;
    }) => {
      const response = await fetch(`/api/quests/${questId}/objectives/${objectiveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          completed
        }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<QuestObjective>;
    },
    onSuccess: (_, { questId }) => {
      void queryClient.invalidateQueries({ queryKey: ['quest', questId] });
      void queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
}

export function useDeleteQuestObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questId, objectiveId }: { questId: number; objectiveId: number }) => {
      const response = await fetch(`/api/quests/${questId}/objectives/${objectiveId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return { questId, objectiveId };
    },
    onSuccess: (_, { questId }) => {
      void queryClient.invalidateQueries({ queryKey: ['quest', questId] });
      void queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
}