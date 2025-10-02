import { useCRUD } from './useCRUD';
import { useMagicItems, useCreateMagicItem, useUpdateMagicItem, useDeleteMagicItem } from './useMagicItems';
import { MagicItem } from '@greedy/shared';

// Magic Item-specific CRUD hook
export function useMagicItemCRUD() {
  const listQuery = useMagicItems();
  const itemQuery = (id: number) => ({ data: null, isLoading: false, error: null, isError: false, isPending: false, isLoadingError: false, isRefetchError: false, isSuccess: false, isFetched: false, isFetchedAfterMount: false, isFetching: false, isRefetching: false, isStale: false, refetch: () => Promise.resolve({ data: null } as any), dataUpdatedAt: 0, errorUpdatedAt: 0, failureCount: 0, failureReason: null, errorUpdateCount: 0, isPaused: false, fetchStatus: 'idle' as const, isPlaceholderData: false, status: 'pending' as const, isInitialLoading: false, isEnabled: true, promise: Promise.resolve() } as any); // Not implemented yet
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

  return {
    ...useCRUD<MagicItem>('magic item', {
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