import { useCRUD } from './useCRUD';
import { useMagicItems, useMagicItem, useCreateMagicItem, useUpdateMagicItem, useDeleteMagicItem } from './useMagicItems';
import { MagicItem } from '@greedy/shared';

// Magic Item-specific CRUD hook
export function useMagicItemCRUD() {
  const listQuery = useMagicItems();
  // Item query must be a hook so rules-of-hooks allow calling other hooks inside it
  const useItemQuery = (id: number) => useMagicItem(id);
  const createMutation = useCreateMagicItem();
  const updateMutation = useUpdateMagicItem();
  const deleteMutation = useDeleteMagicItem();

  // Default form data for magic items
  const initialFormData: Partial<MagicItem> = {
    name: '',
    description: '',
    rarity: 'common',
    type: 'Wondrous item',
    attunement_required: false,
  };

  return useCRUD<MagicItem>('magic item', {
    createMutation,
    updateMutation,
    deleteMutation,
    listQuery,
    itemQuery: useItemQuery,
    initialFormData,
  });
}