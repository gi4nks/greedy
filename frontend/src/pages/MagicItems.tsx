import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useToast } from '../components/Toast';
import { logError } from '../utils/logger';
import { Character } from '../../../shared/types';

type MagicItem = {
  id?: number;
  name: string;
  rarity?: string;
  type?: string;
  description?: string;
  properties?: Record<string, unknown>;
  attunement_required?: number;
  owners?: Character[];
};

export default function MagicItems(): JSX.Element {
  const [items, setItems] = useState<MagicItem[]>([]);
  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([]);
  const [form, setForm] = useState<MagicItem>({ name: '', description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [assignModalItem, setAssignModalItem] = useState<number | null>(null);
  const [selectedCharIds, setSelectedCharIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState<number | null>(null);
  const [charSearch, setCharSearch] = useState('');
  // Collapsed state for each magic item
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const toast = useToast();

  // Toggle collapse for a magic item
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  useEffect(() => { void fetchItems(); }, []);

  useEffect(() => { void fetchCharacters(); }, []);
  const fetchItems = async () => {
    const res = await axios.get<MagicItem[]>('/api/magic-items');
    setItems(res.data);
  };

  const fetchCharacters = async () => {
    try {
      const res = await axios.get<Character[]>('/api/characters');
      setCharacters((res.data || []).filter(c => c.id !== undefined).map((c: Character) => ({ id: c.id!, name: c.name })));
    } catch {
      setCharacters([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (editingId) {
      try {
        await axios.put(`/api/magic-items/${editingId}`, payload);
        toast.push('Magic item updated');
      } catch (err) {
        logError(err, 'update-magic-item');
        toast.push('Failed to update magic item', { type: 'error' });
        return;
      }
    } else {
      try {
        await axios.post('/api/magic-items', payload);
        toast.push('Magic item created');
      } catch (err) {
        logError(err, 'create-magic-item');
        toast.push('Failed to create magic item', { type: 'error' });
        return;
      }
    }
    setForm({ name: '', description: '' });
    setEditingId(null);
    setShowForm(false);
    void fetchItems();
  };

  const handleEdit = (it: MagicItem & { id: number }) => {
    setForm({ name: it.name, description: it.description || '', rarity: it.rarity, type: it.type });
    setEditingId(it.id);
    setShowForm(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Delete this magic item?')) return;
    try {
      await axios.delete(`/api/magic-items/${id}`);
      toast.push('Magic item deleted');
    } catch (err) {
      logError(err, 'delete-magic-item');
      toast.push('Failed to delete magic item', { type: 'error' });
    } finally {
      void fetchItems();
    }
  };

  const unassignFromCharacter = async (itemId: number, charId: number) => {
    if (!confirm('Unassign this item from character?')) return;
    // optimistic remove
    setUnassigning(charId);
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, owners: (it.owners || []).filter((o: Character) => o.id !== charId) } : it));
    try {
      await axios.post(`/api/magic-items/${itemId}/unassign`, { characterId: charId });
      // Add Undo action to toast: reassign if clicked
      toast.push('Unassigned', {
        actions: [
          {
            label: 'Undo',
            onClick: async () => {
              try {
                await axios.post(`/api/magic-items/${itemId}/assign`, { characterId: charId });
                fetchItems();
              } catch (e) {
                logError(e, 'undo-unassign');
                toast.push('Undo failed', { type: 'error' });
              }
            }
          }
        ]
      });
      await fetchItems();
    } catch (err) {
      logError(err, 'unassign-item');
      toast.push('Failed to unassign', { type: 'error' });
      await fetchItems();
    } finally {
      setUnassigning(null);
    }
  };

  const openAssignModal = (itemId: number) => {
    setAssignModalItem(itemId);
    const it = items.find(i => i.id === itemId);
    setSelectedCharIds((it?.owners || []).map((o: Character) => o.id!).filter(Boolean));
    setCharSearch('');
  };

  const filteredCharacters = useMemo(() => {
    const q = charSearch.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter(c => c.name.toLowerCase().includes(q));
  }, [characters, charSearch]);

  const saveAssignments = async () => {
    if (assignModalItem == null) return;
    setAssigning(true);
    try {
      // send assignment requests: compute to-add and to-remove
      const it = items.find(i => i.id === assignModalItem);
      const current = (it?.owners || []).map((o: Character) => o.id!).filter((id): id is number => id !== undefined);
      const toAdd = selectedCharIds.filter(id => !current.includes(id));
      const toRemove = current.filter(id => !selectedCharIds.includes(id));
      await Promise.all([
        ...toAdd.map(id => axios.post(`/api/magic-items/${assignModalItem}/assign`, { characterId: id })),
        ...toRemove.map(id => axios.post(`/api/magic-items/${assignModalItem}/unassign`, { characterId: id }))
      ]);
      await fetchItems();
      toast.push('Assignments updated');
      setAssignModalItem(null);
    } catch (err) {
      toast.push('Failed to update assignments', { type: 'error' });
      await fetchItems();
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Page title="Magic Items" toolbar={<button type="button" onPointerDown={(e) => { e.preventDefault(); setShowForm(true); }} onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">Create</button>}>
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
        {items.map(item => {
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
                          <div key={o.id} className="badge badge-secondary gap-2">
                            <span>{o.name}</span>
                            <button
                              onClick={() => { void unassignFromCharacter(item.id!, o.id!); }}
                              className="btn btn-circle btn-xs btn-error"
                              disabled={unassigning === o.id}
                            >
                              Remove
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
                <button onClick={() => { setSelectedCharIds(characters.map(c => c.id)); }} className="btn btn-secondary btn-sm">Select All</button>
                <button onClick={() => { setSelectedCharIds([]); }} className="btn btn-ghost btn-sm">Clear</button>
              </div>
              <div className="max-h-64 overflow-auto border border-base-300 rounded-box p-2 mb-4">
                {filteredCharacters.map(c => (
                  <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-box cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-primary" checked={selectedCharIds.includes(c.id)} onChange={(e) => {
                      if (e.target.checked) setSelectedCharIds(prev => [...prev, c.id]);
                      else setSelectedCharIds(prev => prev.filter(id => id !== c.id));
                    }} />
                    <span>{c.name}</span>
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
