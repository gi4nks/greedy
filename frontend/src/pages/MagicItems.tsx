import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';

type MagicItem = {
  id?: number;
  name: string;
  rarity?: string;
  type?: string;
  description?: string;
  properties?: any;
  attunement_required?: number;
  adventure_id?: number;
  owners?: any[];
};

export default function MagicItems(): JSX.Element {
  const [items, setItems] = useState<MagicItem[]>([]);
  const [form, setForm] = useState<MagicItem>({ name: '', description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const adv = useAdventures();

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const res = await axios.get('/api/magic-items');
    setItems(res.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (editingId) {
      await axios.put(`/api/magic-items/${editingId}`, payload);
    } else {
      await axios.post('/api/magic-items', payload);
    }
    setForm({ name: '', description: '' });
    setEditingId(null);
    setShowForm(false);
    fetchItems();
  };

  const handleEdit = (it: MagicItem & { id: number }) => {
    setForm({ name: it.name, description: it.description || '', rarity: it.rarity, type: it.type, adventure_id: it.adventure_id });
    setEditingId(it.id);
    setShowForm(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Delete this magic item?')) return;
    await axios.delete(`/api/magic-items/${id}`);
    fetchItems();
  };

  const assignToCharacter = async (itemId: number) => {
    const charId = prompt('Assign to character id (number):');
    if (!charId) return;
    await axios.post(`/api/magic-items/${itemId}/assign`, { characterId: Number(charId) });
    fetchItems();
  };

  const unassignFromCharacter = async (itemId: number, charId: number) => {
    if (!confirm('Unassign this item from character?')) return;
    await axios.post(`/api/magic-items/${itemId}/unassign`, { characterId: charId });
    fetchItems();
  };

  return (
    <Page title="Magic Items" toolbar={<button onClick={() => setShowForm(true)} className="bg-orange-600 text-white px-3 py-1 rounded">+</button>}>
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
            <div>
              <label className="block text-sm font-medium mb-1">Adventure</label>
              <select value={form.adventure_id ?? ''} onChange={(e) => setForm({ ...form, adventure_id: e.target.value ? Number(e.target.value) : undefined })} className="w-full p-2 border rounded">
                <option value="">No Adventure</option>
                {adv.adventures.map(a => (<option key={a.id} value={a.id}>{a.title}</option>))}
              </select>
            </div>
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
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">{item.name}</h3>
                <div className="text-sm text-gray-600 mt-1">{item.rarity} — {item.type}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(item as MagicItem & { id: number })} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Delete</button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="prose prose-sm max-w-none text-gray-900"><ReactMarkdown children={item.description || ''} /></div>
              <div>
                <h4 className="font-semibold mb-2">Owners</h4>
                <div className="flex flex-wrap gap-2">
                  {(item.owners || []).map(o => (
                    <div key={o.id} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <span>{o.name}</span>
                      <button onClick={() => unassignFromCharacter(item.id!, o.id)} className="text-red-600">×</button>
                    </div>
                  ))}
                  <button onClick={() => assignToCharacter(item.id!)} className="bg-green-600 text-white px-3 py-1 rounded">Assign</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
