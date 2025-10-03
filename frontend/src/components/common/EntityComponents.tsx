import React from 'react';
import { UseQueryResult } from '@tanstack/react-query';

export interface EntityListProps<T extends { id?: number }> {
  query: UseQueryResult<T[], Error>;
  renderItem: (item: T) => React.ReactNode;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  className?: string;
}

export function EntityList<T extends { id?: number }>({
  query,
  renderItem,
  searchTerm = '',
  onSearchChange,
  emptyMessage = 'No items found',
  loadingMessage = 'Loading...',
  errorMessage = 'Error loading items',
  className = '',
}: EntityListProps<T>) {
  const { data: items = [], isLoading, error } = query;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">{loadingMessage}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{errorMessage}: {error.message}</span>
      </div>
    );
  }

  // Filter items based on search term
  const filteredItems = searchTerm
    ? items.filter(item =>
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : items;

  return (
    <div className={`space-y-4 ${className}`}>
      {onSearchChange && (
        <div className="form-control">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input input-bordered"
          />
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-base-content/60">
          {searchTerm ? `No items found matching "${searchTerm}"` : emptyMessage}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <div key={item.id}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface EntityCardProps<T extends { id?: number }> {
  item: T;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: () => void;
  onDelete: () => void;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function EntityCard<T extends { id?: number }>({
  item,
  isCollapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
  title,
  subtitle,
  children,
  className = '',
}: EntityCardProps<T>) {
  return (
    <div className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow ${className}`}>
      <div className="card-body">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleCollapse}
              className="btn btn-outline btn-primary btn-sm"
              aria-label={isCollapsed ? '+' : '-'}
            >
              {isCollapsed ? '+' : '−'}
            </button>
            <div>
              <h3 className="card-title text-xl">{title}</h3>
              {subtitle && <div className="text-sm text-base-content/70">{subtitle}</div>}
            </div>
          </div>
          <div className="card-actions">
            <button onClick={onEdit} className="btn btn-secondary btn-sm">
              Edit
            </button>
            <button onClick={onDelete} className="btn btn-neutral btn-sm">
              Delete
            </button>
          </div>
        </div>

        {!isCollapsed && children && (
          <div className="space-y-4 mt-6">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export interface EntityFormProps<T extends Record<string, any>> {
  item?: T & { id?: number };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<T>) => void;
  title: string;
  children: React.ReactNode;
  isSubmitting?: boolean;
  className?: string;
}

export function EntityForm<T extends Record<string, any>>({
  item,
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  isSubmitting = false,
  className = '',
}: EntityFormProps<T>) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-base-100 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ${className}`}>
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-6">{title}</h3>

          <form onSubmit={(e) => {
            e.preventDefault();
            // This should be handled by the parent component with proper form state
            // For now, we'll pass an empty object and let the parent handle it
            onSubmit({} as Partial<T>);
          }}>
            {children}

            <div className="card-actions justify-end mt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting && <span className="loading loading-spinner loading-sm"></span>}
                {item ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}