import { useState, useCallback } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

export interface CRUDState<T> {
  formData: Partial<T>;
  editingId: number | null;
  showCreateForm: boolean;
  searchTerm: string;
  collapsed: { [id: number]: boolean };
}

export interface CRUDActions<T> {
  setFormData: (data: Partial<T>) => void;
  setEditingId: (id: number | null) => void;
  setShowCreateForm: (show: boolean) => void;
  setSearchTerm: (term: string) => void;
  setCollapsed: (collapsed: { [id: number]: boolean }) => void;
  toggleCollapsed: (id: number) => void;

  handleCreate: (data: Partial<T>) => Promise<T | undefined>;
  handleUpdate: (id: number, data: Partial<T>) => Promise<void>;
  handleDelete: (id: number) => Promise<void>;
  handleEdit: (item: T & { id: number }) => void;
  handleCancel: () => void;
}

export interface CRUDHooks<T> {
  state: CRUDState<T>;
  actions: CRUDActions<T>;
  queries: {
    // Accept query results where `id` may be optional (shared types commonly define `id?: number`).
    list: UseQueryResult<(T & { id?: number })[], Error>;
    item: (id: number) => UseQueryResult<T & { id?: number }, Error>;
  };
  mutations: {
    create: any;
    update: any;
    delete: any;
  };
}

export function useCRUD<T extends { id?: number }>(
  entityType: string,
  {
    createMutation,
    updateMutation,
    deleteMutation,
    listQuery,
    itemQuery,
    initialFormData = {},
    onSuccess,
    onError,
  }: {
    createMutation: any;
    updateMutation: any;
    deleteMutation: any;
  // Accept query shapes where `id` may be optional to align with shared types
  listQuery: UseQueryResult<(T & { id?: number })[], Error>;
  itemQuery: (id: number) => UseQueryResult<T & { id?: number }, Error>;
    initialFormData?: Partial<T>;
    onSuccess?: (action: 'create' | 'update' | 'delete', data?: any) => void;
    onError?: (action: 'create' | 'update' | 'delete', error: Error) => void;
  }
): CRUDHooks<T> {


  // State management
  const [formData, setFormData] = useState<Partial<T>>(initialFormData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});

  // Actions
  const toggleCollapsed = useCallback((id: number) => {
    setCollapsed(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }, []);

  const handleCreate = useCallback(async (data: Partial<T>) => {
    try {
      const created = await createMutation.mutateAsync(data);
      setShowCreateForm(false);
      setFormData(initialFormData);
      onSuccess?.('create', created);
      return created as T | undefined;
    } catch (error) {
      onError?.('create', error as Error);
      return undefined;
    }
  }, [createMutation, initialFormData, onSuccess, onError]);

  const handleUpdate = useCallback(async (id: number, data: Partial<T>) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      setEditingId(null);
      setShowCreateForm(false); // Close the form after successful update
      setFormData(initialFormData);
      onSuccess?.('update', data);
    } catch (error) {
      onError?.('update', error as Error);
    }
  }, [updateMutation, initialFormData, onSuccess, onError]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm(`Are you sure you want to delete this ${entityType}?`)) return;

    try {
      await deleteMutation.mutateAsync(id);
      onSuccess?.('delete', { id });
    } catch (error) {
      onError?.('delete', error as Error);
    }
  }, [deleteMutation, entityType, onSuccess, onError]);

  const handleEdit = useCallback((item: T & { id: number }) => {
    setEditingId(item.id);
    setFormData(item);
    setShowCreateForm(true);
  }, []);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setShowCreateForm(false);
    setFormData(initialFormData);
  }, [initialFormData]);

  return {
    state: {
      formData,
      editingId,
      showCreateForm,
      searchTerm,
      collapsed,
    },
    actions: {
      setFormData,
      setEditingId,
      setShowCreateForm,
      setSearchTerm,
      setCollapsed,
      toggleCollapsed,
      handleCreate,
      handleUpdate,
      handleDelete,
      handleEdit,
      handleCancel,
    },
    queries: {
      list: listQuery,
      item: itemQuery,
    },
    mutations: {
      create: createMutation,
      update: updateMutation,
      delete: deleteMutation,
    },
  };
}