import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCharacterCRUD } from './useCharacterCRUD';

// Mock the character hooks
vi.mock('./useCharacters', () => ({
  useCharacters: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useCharacter: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  useCreateCharacter: vi.fn(() => ({
    mutateAsync: vi.fn(),
    mutate: vi.fn(),
    isPending: false,
  })),
  useUpdateCharacter: vi.fn(() => ({
    mutateAsync: vi.fn(),
    mutate: vi.fn(),
    isPending: false,
  })),
  useDeleteCharacter: vi.fn(() => ({
    mutateAsync: vi.fn(),
    mutate: vi.fn(),
    isPending: false,
  })),
}));

describe('useCharacterCRUD', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCharacterCRUD(), { wrapper });

    expect(result.current.state.formData).toBeDefined();
    expect(result.current.state.editingId).toBeNull();
    expect(result.current.state.showCreateForm).toBe(false);
    expect(result.current.state.searchTerm).toBe('');
    expect(result.current.state.collapsed).toEqual({});
  });

  it('should have proper initial form data structure', () => {
    const { result } = renderHook(() => useCharacterCRUD(), { wrapper });

    const formData = result.current.state.formData;
    expect(formData.name).toBe('');
    expect(formData.race).toBe('');
    expect(formData.level).toBe(1);
    expect(formData.strength).toBe(10);
    expect(formData.classes).toEqual([]);
    expect(formData.equipment).toEqual([]);
  });

  it('should handle setting adventure ID in initial form data', () => {
    const adventureId = 123;
    const { result } = renderHook(() => useCharacterCRUD(adventureId), { wrapper });

    expect(result.current.state.formData.adventure_id).toBe(adventureId);
  });
});