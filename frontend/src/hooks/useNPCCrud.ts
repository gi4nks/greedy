import { useCRUD } from './useCRUD';
import { useNPCs, useNPC, useCreateNPC, useUpdateNPC, useDeleteNPC } from './useNPCs';
import { NPC } from '@greedy/shared';

// NPC-specific CRUD hook
export function useNPCCrud(adventureId?: number) {
  const listQuery = useNPCs(adventureId);
  const itemQuery = (id: number) => useNPC(id);
  const createMutation = useCreateNPC();
  const updateMutation = useUpdateNPC();
  const deleteMutation = useDeleteNPC();

  // Default form data for NPCs
  const initialFormData: Partial<NPC> = {
    name: '',
    role: '',
    description: '',
    tags: [],
    adventure_id: adventureId,
  };

  return {
    ...useCRUD<NPC>('NPC', {
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