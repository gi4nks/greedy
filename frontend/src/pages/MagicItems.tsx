import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { logError } from '../utils/logger';
import { useAdventures } from '../contexts/AdventureContext';

type MagicItem = {
  id?: number;
  name: string;
  rarity?: string;
  type?: string;
  description?: string;
  properties?: any;
  attunement_required?: number;
  owners?: any[];
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
  const adv = useAdventures();
  const toast = useToast();

  // Toggle collapse for a magic item
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => { fetchCharacters(); }, []);
  const fetchItems = async () => {
    const res = await axios.get('/api/magic-items');
    setItems(res.data);
  };

  const fetchCharacters = async () => {
    try {
      const res = await axios.get('/api/characters');
      setCharacters((res.data || []).map((c: any) => ({ id: c.id, name: c.name })));
    } catch (err) {
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
    fetchItems();
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
      fetchItems();
    }
  };

  const [assigningItem, setAssigningItem] = useState<number | null>(null);

  const assignToCharacter = async (itemId: number, charId: number) => {
    // optimistic update
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, owners: [...(it.owners || []), { id: charId, name: characters.find(c => c.id === charId)?.name || 'Unknown' }] } : it));
    setAssigning(true);
    try {
      await axios.post(`/api/magic-items/${itemId}/assign`, { characterId: Number(charId) });
      toast.push(`Assigned to ${characters.find(c => c.id === charId)?.name || 'character'}`);
      await fetchItems();
    } catch (err) {
      logError(err, 'assign-item');
      toast.push('Failed to assign item', { type: 'error' });
      await fetchItems();
    } finally {
      setAssigning(false);
      setAssigningItem(null);
    }
  };

  const unassignFromCharacter = async (itemId: number, charId: number) => {
    if (!confirm('Unassign this item from character?')) return;
    // optimistic remove
    setUnassigning(charId);
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, owners: (it.owners || []).filter((o:any) => o.id !== charId) } : it));
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
    setSelectedCharIds((it?.owners || []).map((o:any) => o.id));
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
      const current = (it?.owners || []).map((o:any) => o.id);
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
    <Page title="Magic Items" toolbar={<button type="button" onPointerDown={(e) => { e.preventDefault(); setShowForm(true); }} onClick={() => setShowForm(true)} className="bg-orange-600 text-white px-3 py-1 rounded">+</button>}>
      {(showForm || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-lg shadow-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">{editingId ? 'Edit Magic Item' : 'Create Magic Item'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rarity</label>
              <input value={form.rarity || ''} onChange={(e) => setForm({ ...form, rarity: e.target.value })} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <input value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full p-2 border rounded" />
            </div>
            {/* adventure field removed: magic items are no longer tied to adventures */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description / Properties (Markdown)</label>
              <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-2 border rounded h-32" />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => { setForm({ name: '', description: '' }); setEditingId(null); setShowForm(false); }} className="bg-gray-500 text-white px-6 py-2 rounded">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {items.map(item => {
          const isCollapsed = item.id ? collapsed[item.id] ?? true : false;
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCollapse(item.id)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-purple-200 rounded-full bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-colors duration-200"
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      <span className="text-lg font-bold text-purple-600">{isCollapsed ? '+' : '−'}</span>
                    </button>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        {item.rarity && <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                          {item.rarity}
                        </span>}
                        {item.type && <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          {item.type}
                        </span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item as MagicItem & { id: number })}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <span>✏️</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <span>🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-6 space-y-4">
                  <div className="prose prose-sm max-w-none text-gray-900"><ReactMarkdown children={item.description || ''} /></div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="text-purple-600">👥</span>
                      Owners ({(item.owners || []).length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(item.owners || []).map(o => (
                        <div key={o.id} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          <span>{o.name}</span>
                          <button
                            onClick={() => unassignFromCharacter(item.id!, o.id)}
                            className="text-red-600 hover:text-red-800"
                            disabled={unassigning === o.id}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => openAssignModal(item.id!)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                      >
                        <span>+</span>
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {assignModalItem !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-2xl p-6 rounded shadow-lg border">
            <h3 className="text-lg font-semibold mb-3">Assign Characters</h3>
            <div className="mb-3 flex gap-2">
              <input className="flex-1 p-2 border rounded" placeholder="Search characters..." value={charSearch} onChange={(e) => setCharSearch(e.target.value)} />
              <button onClick={() => { setSelectedCharIds(characters.map(c => c.id)); }} className="bg-gray-200 px-3 rounded">Select All</button>
              <button onClick={() => { setSelectedCharIds([]); }} className="bg-gray-200 px-3 rounded">Clear</button>
            </div>
            <div className="max-h-64 overflow-auto border rounded p-2 mb-4">
              {filteredCharacters.map(c => (
                <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <input type="checkbox" checked={selectedCharIds.includes(c.id)} onChange={(e) => {
                    if (e.target.checked) setSelectedCharIds(prev => [...prev, c.id]);
                    else setSelectedCharIds(prev => prev.filter(id => id !== c.id));
                  }} />
                  <span>{c.name}</span>
                </label>
              ))}
              {filteredCharacters.length === 0 && <div className="text-sm text-gray-500 p-2">No characters found</div>}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAssignModalItem(null)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
              <button onClick={saveAssignments} disabled={assigning} className="bg-orange-600 text-white px-4 py-2 rounded">{assigning ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
