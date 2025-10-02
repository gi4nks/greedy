import { useCRUD } from './useCRUD';
import { useLocations, useLocation, useCreateLocation, useUpdateLocation, useDeleteLocation } from './useLocations';
import { Location, LocationForm } from '@greedy/shared';

// Location-specific CRUD hook
export function useLocationCRUD(adventureId?: number) {
  const listQuery = useLocations(adventureId);
  const itemQuery = (id: number) => useLocation(id);
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  // Default form data for locations
  const initialFormData: LocationForm = {
    name: '',
    description: '',
    notes: '',
    tags: [],
    adventure_id: adventureId,
  };

  return {
    ...useCRUD<Location>('location', {
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