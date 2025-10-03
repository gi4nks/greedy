import { useCRUD } from './useCRUD';
import { useSessions, useSession, useCreateSession, useUpdateSession, useDeleteSession } from './useSessions';
import { Session, SessionForm } from '@greedy/shared';

// Session-specific CRUD hook
export function useSessionCRUD(adventureId?: number) {
  const listQuery = useSessions(adventureId);
  // Item query must be a hook so rules-of-hooks allow calling other hooks inside it
  const useItemQuery = (id: number) => useSession(id);
  const createMutation = useCreateSession();
  const updateMutation = useUpdateSession();
  const deleteMutation = useDeleteSession();

  // Default form data for sessions
  const initialFormData: SessionForm = {
    title: '',
    date: '',
    text: '',
    adventure_id: adventureId,
    images: []
  };

  return useCRUD<Session>('session', {
    createMutation,
    updateMutation,
    deleteMutation,
    listQuery,
    itemQuery: useItemQuery,
    initialFormData,
  });
}