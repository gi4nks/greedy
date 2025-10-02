import React, { useState } from 'react';
import Page from '../components/Page';
import { useToast } from '../components/Toast';
import { logError } from '../utils/logger';
import { Character, MagicItem } from '../../../shared/types';
import { useMagicItemCRUD } from '../hooks/useMagicItemCRUD';
import { useAssignMagicItem, useUnassignMagicItem } from '../hooks/useMagicItems';
import { useCharacters } from '../hooks/useCharacters';
import { useQueryClient } from '@tanstack/react-query';
import {
  MagicItemForm,
  MagicItemCard,
  CharacterAssignmentModal,
} from '../components/magicItem';
import { EntityList } from '../components/common/EntityComponents';

export default function MagicItems(): JSX.Element {
  const [assignModalItem, setAssignModalItem] = useState<number | null>(null);
  const [selectedCharIds, setSelectedCharIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);
  const toast = useToast();

  // Use the new generic CRUD hook
  const crud = useMagicItemCRUD();

  // Additional hooks for character assignments (magic item-specific functionality)
  const { data: characters = [] } = useCharacters();
  const assignMutation = useAssignMagicItem();
  const unassignMutation = useUnassignMagicItem();



  // Custom form submit handler that works with CRUD and includes toast notifications
  const handleFormSubmit = async (data: Partial<MagicItem>) => {
    try {
      if (crud.state.editingId) {
        await crud.actions.handleUpdate(crud.state.editingId, data);
        toast.push('Magic item updated');
      } else {
        await crud.actions.handleCreate(data);
        toast.push('Magic item created');
      }
    } catch (error) {
      logError(error, crud.state.editingId ? 'update-magic-item' : 'create-magic-item');
      toast.push(`Failed to ${crud.state.editingId ? 'update' : 'create'} magic item`, { type: 'error' });
    }
  };

  // Custom edit handler
  const handleEdit = (item: MagicItem & { id: number }) => {
    crud.actions.handleEdit(item);
  };

  // Custom delete handler with toast
  const handleDelete = async (id: number) => {
    try {
      await crud.actions.handleDelete(id);
      toast.push('Magic item deleted');
    } catch (error) {
      logError(error, 'delete-magic-item');
      toast.push('Failed to delete magic item', { type: 'error' });
    }
  };



  const handleOpenAssignModal = (itemId: number) => {
    setAssignModalItem(itemId);
    // Get the current items from the CRUD query
    const items = crud.queries.list.data || [];
    const item = items.find((i: any) => i.id === itemId);
    setSelectedCharIds((item?.owners || []).map((o: Character) => o.id).filter((id: any): id is number => id !== undefined));
  };

  const handleSaveAssignments = (characterIds: number[]) => {
    if (assignModalItem == null) return;
    setAssigning(true);

    const items = crud.queries.list.data || [];
    const item = items.find((i: any) => i.id === assignModalItem);
    const current = (item?.owners || []).map((o: Character) => o.id).filter((id: any): id is number => id !== undefined);
    const toAdd = characterIds.filter((id: number) => !current.includes(id));
    const toRemove = current.filter((id: number) => !characterIds.includes(id));

    if (toAdd.length > 0) {
      assignMutation.mutate(
        { itemId: assignModalItem, characterIds: toAdd },
        {
          onSuccess: () => {
            toast.push('Assignments updated');
            setAssignModalItem(null);
          },
          onError: (err) => {
            logError(err, 'assign-items');
            toast.push('Failed to update assignments', { type: 'error' });
          },
          onSettled: () => {
            setAssigning(false);
          },
        }
      );
    } else if (toRemove.length > 0) {
      Promise.all(
        toRemove.map((charId: number) =>
          new Promise<void>((resolve, reject) => {
            unassignMutation.mutate(
              { itemId: assignModalItem, characterId: charId },
              {
                onSuccess: resolve,
                onError: reject,
              }
            );
          })
        )
      )
        .then(() => {
          toast.push('Assignments updated');
          setAssignModalItem(null);
        })
        .catch((err) => {
          logError(err, 'unassign-items');
          toast.push('Failed to update assignments', { type: 'error' });
        })
        .finally(() => {
          setAssigning(false);
        });
    } else {
      setAssigning(false);
      setAssignModalItem(null);
    }
  };

  return (
    <Page title="Magic Items" toolbar={<button type="button" onClick={() => crud.actions.setShowCreateForm(true)} className="btn btn-primary btn-sm">Create</button>}>
      <EntityList
        query={crud.queries.list}
        renderItem={(item: MagicItem & { id: number }) => (
          <div key={item.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="card-title text-xl">{item.name}</h3>
                  <div className="text-sm text-base-content/70">{item.type} • {item.rarity}</div>
                </div>
                <div className="card-actions">
                  <button onClick={() => handleEdit(item)} className="btn btn-secondary btn-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="btn btn-neutral btn-sm">
                    Delete
                  </button>
                  <button onClick={() => handleOpenAssignModal(item.id)} className="btn btn-primary btn-sm">
                    Assign
                  </button>
                </div>
              </div>
              
              {/* Magic Item Images Display Only */}
              {(item as any).images && Array.isArray((item as any).images) && (item as any).images.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="text-lg">🖼️</span>
                    Images ({(item as any).images.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {(item as any).images.map((image: any, index: number) => (
                      <div key={image.id || index} className="aspect-square rounded-lg overflow-hidden bg-base-200">
                        <img 
                          src={`/api/images/magic_items/${image.image_path?.split('/').pop() || 'placeholder.jpg'}`} 
                          alt={`Magic item image ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {item.description && (
                <div className="mt-4">
                  <p className="text-base-content/80">{item.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
        searchTerm={crud.state.searchTerm}
        onSearchChange={crud.actions.setSearchTerm}
        emptyMessage="No magic items found"
        loadingMessage="Loading magic items..."
        errorMessage="Error loading magic items"
      />

      {(crud.state.showCreateForm || crud.state.editingId) && (
        <MagicItemForm
          initialData={crud.state.formData}
          onSubmit={handleFormSubmit}
          onCancel={crud.actions.handleCancel}
          isEditing={!!crud.state.editingId}
        />
      )}

      <CharacterAssignmentModal
        isOpen={assignModalItem !== null}
        onClose={() => setAssignModalItem(null)}
        onSave={handleSaveAssignments}
        characters={characters}
        initiallySelectedIds={selectedCharIds}
        isSaving={assigning}
      />
    </Page>
  );
}
