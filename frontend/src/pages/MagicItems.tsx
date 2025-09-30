import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useToast } from '../components/Toast';
import { logError } from '../utils/logger';
import { Character, MagicItem } from '../../../shared/types';
import {
  useMagicItems,
  useCreateMagicItem,
  useUpdateMagicItem,
  useDeleteMagicItem,
  useAssignMagicItem,
  useUnassignMagicItem,
} from '../hooks/useMagicItems';
import { useCharacters } from '../hooks/useCharacters';
import { useSearch } from '../hooks/useSearch';

export default function MagicItems(): JSX.Element {
  const [form, setForm] = useState<Partial<MagicItem>>({ name: '', description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [assignModalItem, setAssignModalItem] = useState<number | null>(null);
  const [selectedCharIds, setSelectedCharIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState<number | null>(null);
  const [charSearch, setCharSearch] = useState('');
  const [charTypeFilter, setCharTypeFilter] = useState<'all' | 'pc' | 'npc'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  // Collapsed state for each magic item
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const toast = useToast();

  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useMagicItems();
  const { data: characters = [], isLoading: charactersLoading, error: charactersError } = useCharacters();
  const { data: searchResults } = useSearch(searchTerm);

  const createMutation = useCreateMagicItem();
  const updateMutation = useUpdateMagicItem();
  const deleteMutation = useDeleteMagicItem();
  const assignMutation = useAssignMagicItem();
  const unassignMutation = useUnassignMagicItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, item: payload as Partial<MagicItem> },
        {
          onSuccess: () => {
            toast.push('Magic item updated');
            setForm({ name: '', description: '' });
            setEditingId(null);
            setShowForm(false);
          },
          onError: (err) => {
            logError(err, 'update-magic-item');
            toast.push('Failed to update magic item', { type: 'error' });
          },
        }
      );
    } else {
      createMutation.mutate(payload as Omit<MagicItem, 'id'>, {
        onSuccess: () => {
          toast.push('Magic item created');
          setForm({ name: '', description: '' });
          setEditingId(null);
          setShowForm(false);
        },
        onError: (err) => {
          logError(err, 'create-magic-item');
          toast.push('Failed to create magic item', { type: 'error' });
        },
      });
    }
  };

  // Toggle collapse for a magic item
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const handleEdit = (it: MagicItem & { id: number }) => {
    setForm({ name: it.name, description: it.description || '', rarity: it.rarity, type: it.type });
    setEditingId(it.id);
    setShowForm(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Delete this magic item?')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.push('Magic item deleted');
      },
      onError: (err) => {
        logError(err, 'delete-magic-item');
        toast.push('Failed to delete magic item', { type: 'error' });
      },
    });
  };

  const unassignFromCharacter = async (itemId: number, charId: number) => {
    if (!confirm('Unassign this item from character?')) return;
    setUnassigning(charId);
    unassignMutation.mutate(
      { itemId, characterId: charId },
      {
        onSuccess: () => {
          toast.push('Unassigned', {
            actions: [
              {
                label: 'Undo',
                onClick: () => {
                  assignMutation.mutate(
                    { itemId, characterIds: [charId] },
                    {
                      onSuccess: () => toast.push('Reassigned'),
                      onError: (err) => {
                        logError(err, 'undo-unassign');
                        toast.push('Undo failed', { type: 'error' });
                      },
                    }
                  );
                },
              },
            ],
          });
        },
        onError: (err) => {
          logError(err, 'unassign-item');
          toast.push('Failed to unassign', { type: 'error' });
        },
        onSettled: () => {
          setUnassigning(null);
        },
      }
    );
  };

  const openAssignModal = (itemId: number) => {
    setAssignModalItem(itemId);
    const it = items.find(i => i.id === itemId);
    setSelectedCharIds((it?.owners || []).map((o: Character) => o.id).filter((id): id is number => id !== undefined));
    setCharSearch('');
  };

  const filteredCharacters = useMemo(() => {
    const q = charSearch.trim().toLowerCase();
    const validCharacters = characters.filter(c => c.id !== undefined);
    let list = validCharacters;
    if (charTypeFilter !== 'all') list = list.filter(c => c.character_type === charTypeFilter);
    if (!q) return list;
    return list.filter(c => c.name.toLowerCase().includes(q));
  }, [characters, charSearch]);

  const saveAssignments = async () => {
    if (assignModalItem == null) return;
    setAssigning(true);
    // send assignment requests: compute to-add and to-remove
    const it = items.find(i => i.id === assignModalItem);
    const current = (it?.owners || []).map((o: Character) => o.id).filter((id): id is number => id !== undefined);
    const toAdd = selectedCharIds.filter(id => !current.includes(id));
    const toRemove = current.filter(id => !selectedCharIds.includes(id));

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
      // For unassignment, we need to call unassign for each character
      Promise.all(
        toRemove.map(charId =>
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
    <Page title="Magic Items" toolbar={<button type="button" onPointerDown={(e) => { e.preventDefault(); setShowForm(true); }} onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">Create</button>}>
      <div className="mb-6">
        <form onSubmit={(e) => { e.preventDefault(); }}>
          <input
            type="text"
            placeholder="Search Magic Items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered input-primary w-full h-9"
          />
        </form>
      </div>

      {(showForm || editingId) && (
        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title text-xl justify-center">{editingId ? 'Edit Magic Item' : 'Create Magic Item'}</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="magic-item-name" className="block text-sm font-medium text-base-content mb-2">Name</label>
                  <input id="magic-item-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input input-bordered w-full" required />
                </div>
                <div>
                  <label htmlFor="magic-item-rarity" className="block text-sm font-medium text-base-content mb-2">Rarity</label>
                  <input id="magic-item-rarity" value={form.rarity || ''} onChange={(e) => setForm({ ...form, rarity: e.target.value })} className="input input-bordered w-full" />
                </div>
                <div>
                  <label htmlFor="magic-item-type" className="block text-sm font-medium text-base-content mb-2">Type</label>
                  <input id="magic-item-type" value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input input-bordered w-full" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="magic-item-description" className="block text-sm font-medium text-base-content mb-2">Description / Properties (Markdown)</label>
                  <textarea id="magic-item-description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="textarea textarea-bordered w-full h-32" />
                </div>
              </div>
            </div>

            <div className="card-actions justify-end">
              <button type="submit" className="btn btn-primary btn-sm">{editingId ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => { setForm({ name: '', description: '' }); setEditingId(null); setShowForm(false); }} className="btn btn-ghost btn-sm">Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {(searchTerm ? searchResults?.magicItems || [] : items).map(item => {
          const isCollapsed = item.id ? collapsed[item.id] ?? true : false;
          return (
            <div key={item.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCollapse(item.id)}
                      className="btn btn-outline btn-primary btn-sm"
                      aria-label={isCollapsed ? '+' : '-'}
                    >
                      {isCollapsed ? '+' : '−'}
                    </button>
                    <div>
                      <h3 className="card-title text-2xl">{item.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-base-content/70">
                        {item.rarity && <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          {item.rarity}
                        </span>}
                        {item.type && <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-info rounded-full"></div>
                          {item.type}
                        </span>}
                      </div>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      onClick={() => { void handleEdit(item as MagicItem & { id: number }); }}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { void handleDelete(item.id); }}
                      className="btn btn-neutral btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="space-y-4 mt-6">
                    <div className="prose prose-sm max-w-none"><ReactMarkdown>{item.description || ''}</ReactMarkdown></div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="text-secondary">👥</span>
                        Owners ({(item.owners || []).length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                          {(item.owners || []).map(o => (
                            <div key={o.id} className="badge badge-secondary gap-2 flex items-center">
                              <span className="font-medium">{o.name}</span>
                              <button
                                onClick={() => { void unassignFromCharacter(item.id!, o.id!); }}
                                className="btn btn-circle btn-xs btn-error ml-2"
                                disabled={unassigning === o.id}
                              >
                                x
                              </button>
                            </div>
                          ))}
                        <button
                          onClick={() => openAssignModal(item.id!)}
                          className="btn btn-success btn-sm"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {assignModalItem !== null && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Assign Characters</h3>
            <div className="py-4">
              <div className="mb-3 flex gap-2">
                <input className="input input-bordered flex-1" placeholder="Search characters..." value={charSearch} onChange={(e) => setCharSearch(e.target.value)} />
                <select className="select select-bordered" value={charTypeFilter} onChange={(e) => setCharTypeFilter(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="pc">Players</option>
                  <option value="npc">NPCs</option>
                </select>
                <button onClick={() => { setSelectedCharIds(filteredCharacters.map(c => c.id!)); }} className="btn btn-secondary btn-sm">Select All</button>
                <button onClick={() => { setSelectedCharIds([]); }} className="btn btn-ghost btn-sm">Clear</button>
              </div>
              <div className="max-h-64 overflow-auto border border-base-300 rounded-box p-2 mb-4">
                {filteredCharacters.map(c => (
                  <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-box cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-primary" checked={selectedCharIds.includes(c.id!)} onChange={(e) => {
                      if (e.target.checked) setSelectedCharIds(prev => [...prev, c.id!]);
                      else setSelectedCharIds(prev => prev.filter(id => id !== c.id));
                    }} />
                    <span className="flex-1">{c.name}</span>
                    <span className="text-xs px-2 py-1 rounded bg-base-200">{c.character_type || 'pc'}</span>
                  </label>
                ))}
                {filteredCharacters.length === 0 && <div className="text-sm text-base-content/60 p-2">No characters found</div>}
              </div>
            </div>
            <div className="modal-action">
              <button onClick={() => setAssignModalItem(null)} className="btn btn-ghost btn-sm">Cancel</button>
              <button onClick={saveAssignments} disabled={assigning} className="btn btn-primary btn-sm">{assigning ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
