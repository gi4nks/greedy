import { useCRUD } from './useCRUD';
import { useNPCs, useNPC, useCreateNPC, useUpdateNPC, useDeleteNPC } from './useNPCs';
import { NPC } from '@greedy/shared';

// Thin adapter: wire domain-specific queries/mutations into the generic useCRUD
export function useNPCCrud(adventureId?: number) {
  const listQuery = useNPCs(adventureId);
  // Item query must be a hook (name starts with `use`) so eslint's rules-of-hooks
  // allow calling other hooks inside it. We expose it as `item` in the CRUD API.
  const useItemQuery = (id: number) => useNPC(id);
  const createMutation = useCreateNPC();
  const updateMutation = useUpdateNPC();
  const deleteMutation = useDeleteNPC();

  const initialFormData: Partial<NPC> = {
    name: '',
    role: '',
    description: '',
    tags: [],
    adventure_id: adventureId,
  };

  // Delegate to the generic hook and expose the same shape as before.
  return useCRUD<NPC>('NPC', {
    createMutation,
    updateMutation,
    deleteMutation,
    listQuery,
    itemQuery: useItemQuery,
    initialFormData,
  });
}