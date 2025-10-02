import { useCRUD } from './useCRUD';
import { useQuests, useQuest, useCreateQuest, useUpdateQuest, useDeleteQuest } from './useQuests';
import { Quest, QuestForm } from '@greedy/shared';

// Quest-specific CRUD hook
export function useQuestCRUD(adventureId?: number) {
  const listQuery = useQuests(adventureId);
  const itemQuery = (id: number) => useQuest(id);
  const createMutation = useCreateQuest();
  const updateMutation = useUpdateQuest();
  const deleteMutation = useDeleteQuest();

  // Default form data for quests
  const initialFormData: QuestForm = {
    title: '',
    description: '',
    status: 'active',
    priority: 'medium',
    type: 'main',
    adventure_id: adventureId,
    assigned_to: '',
    due_date: '',
    tags: [],
    images: []
  };

  return {
    ...useCRUD<Quest>('quest', {
      createMutation,
      updateMutation,
      deleteMutation,
      listQuery,
      itemQuery,
      initialFormData,
    }),
    // Override the list query with proper typing
    queries: {
      list: listQuery as any,
      item: itemQuery,
    },
  };
}