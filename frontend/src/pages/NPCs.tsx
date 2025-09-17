import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2 mb-2">
      {label}
      <button onClick={onRemove} className="ml-2 text-red-500">×</button>
    </span>
  );
}

type NPC = { id?: number; name: string; role: string; description: string; tags?: string[] };

export default function NPCs(): JSX.Element {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [formData, setFormData] = useState<NPC>({ name: '', role: '', description: '', tags: [] });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const adv = useAdventures();

  useEffect(() => {
    fetchNpcs();
  }, []);

  const fetchNpcs = () => {
    axios.get('/api/npcs').then(res => setNpcs(res.data));
  };

  const handleAddTag = () => {
    const v = (tagInputRef.current?.value || '').trim();
    if (!v) return;
    if (!formData.tags?.includes(v)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), v] });
    }
    if (tagInputRef.current) tagInputRef.current.value = '';
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: (formData.tags || []).filter(t => t !== tag) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData };
    if (editingId) {
      axios.put(`/api/npcs/${editingId}`, data).then(() => {
        fetchNpcs();
        setFormData({ name: '', role: '', description: '', tags: [] });
        setEditingId(null);
        setShowCreateForm(false);
      });
    } else {
      axios.post('/api/npcs', data).then(() => {
        fetchNpcs();
        setFormData({ name: '', role: '', description: '', tags: [] });
        setShowCreateForm(false);
      });
    }
  };

  const handleEdit = (npc: NPC & { id: number }) => {
    setFormData({ name: npc.name, role: npc.role, description: npc.description, tags: npc.tags || [] });
    setEditingId(npc.id);
    setShowCreateForm(true);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this NPC?')) {
      axios.delete(`/api/npcs/${id}`).then(() => {
        fetchNpcs();
      });
    }
  };

  const doSearch = async (term: string) => {
    const params = new URLSearchParams();
    params.set('q', term);
    if (adv.selectedId) params.set('adventure', String(adv.selectedId));
    const res = await axios.get(`/api/search?${params.toString()}`);
    setNpcs(res.data.npcs || []);
  };

  return (
    <Page title="NPCs" toolbar={<button onClick={() => setShowCreateForm(true)} className="bg-orange-600 text-white px-3 py-1 rounded">+</button>}>
      <div className="mb-4">
        <form onSubmit={(e) => { e.preventDefault(); doSearch(searchTerm); }}>
          <input
            type="text"
            placeholder="Search NPCs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </form>
      </div>

      {(showCreateForm || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">{editingId ? 'Edit NPC' : 'Add New NPC'}</h3>
        <div className="mb-2">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-2">
          <input
            type="text"
            placeholder="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-2 grid grid-cols-2 gap-4">
          <textarea
            placeholder="Description (Markdown supported)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border rounded h-32"
            required
          />
          <div>
            <h4 className="font-semibold mb-2">Preview</h4>
            <div className="p-2 border rounded h-32 overflow-auto bg-white prose text-gray-900">
              <ReactMarkdown>{formData.description}</ReactMarkdown>
            </div>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex items-center">
            <input ref={tagInputRef} type="text" placeholder="Add tag" className="p-2 border rounded mr-2" />
            <button type="button" onClick={handleAddTag} className="bg-gray-700 text-white px-3 py-1 rounded">Add Tag</button>
          </div>
          <div className="mt-2">
            {(formData.tags || []).map(tag => (
              <Chip key={tag} label={tag} onRemove={() => handleRemoveTag(tag)} />
            ))}
          </div>
        </div>

        <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded">
          {editingId ? 'Update' : 'Add'} NPC
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setFormData({ name: '', role: '', description: '', tags: [] });
              setEditingId(null);
              setShowCreateForm(false);
            }}
            className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
        {!editingId && (
          <button
            type="button"
            onClick={() => {
              setFormData({ name: '', role: '', description: '', tags: [] });
              setShowCreateForm(false);
            }}
            className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
      </form>
      )}

      <div className="space-y-4">
        {npcs.map(npc => (
          <div key={npc.id} className="p-4 bg-white rounded shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{npc.name}</h3>
              <div>
                <button
                  onClick={() => handleEdit(npc as NPC & { id: number })}
                  className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(npc.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-2">{npc.role}</p>
            <div className="prose mb-2">
              <ReactMarkdown>{npc.description}</ReactMarkdown>
            </div>
            <div>
              {(npc.tags || []).map(t => (
                <Chip key={t} label={t} onRemove={() => {}} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
