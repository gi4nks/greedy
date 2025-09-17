import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

type Character = { id?: number; name: string; role: string; description: string; tags?: string[] };

export default function Characters(): JSX.Element {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [formData, setFormData] = useState<Character>({ name: '', role: '', description: '', tags: [] });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Collapsed state for each NPC
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const adv = useAdventures();

  // Toggle collapse for an NPC
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = () => {
    axios.get('/api/characters').then(res => setCharacters(res.data));
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
      axios.put(`/api/characters/${editingId}`, data).then(() => {
        fetchCharacters();
        setFormData({ name: '', role: '', description: '', tags: [] });
        setEditingId(null);
        setShowCreateForm(false);
      });
    } else {
      axios.post('/api/characters', data).then(() => {
        fetchCharacters();
        setFormData({ name: '', role: '', description: '', tags: [] });
        setShowCreateForm(false);
      });
    }
  };

  const handleEdit = (character: Character & { id: number }) => {
    setFormData({ name: character.name, role: character.role, description: character.description, tags: character.tags || [] });
    setEditingId(character.id);
    setShowCreateForm(true);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this character?')) {
      axios.delete(`/api/characters/${id}`).then(() => {
        fetchCharacters();
      });
    }
  };

  const doSearch = async (term: string) => {
    const params = new URLSearchParams();
    params.set('q', term);
    if (adv.selectedId) params.set('adventure', String(adv.selectedId));
    const res = await axios.get(`/api/search?${params.toString()}`);
    setCharacters(res.data.characters || []);
  };

  return (
    <Page title="Characters" toolbar={<button onClick={() => setShowCreateForm(true)} className="bg-orange-600 text-white px-3 py-1 rounded">+</button>}>
      <div className="mb-4">
        <form onSubmit={(e) => { e.preventDefault(); doSearch(searchTerm); }}>
          <input
            type="text"
            placeholder="Search Characters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </form>
      </div>

      {(showCreateForm || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">{editingId ? 'Edit Character' : 'Add New Character'}</h3>
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
        <div className="mb-2">
          <textarea
            placeholder="Description (Markdown supported)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border rounded h-40"
            required
          />
        </div>

        <div className="mb-4">
          <h4 className="font-semibold mb-2">Preview</h4>
          <div className="p-2 border rounded h-32 overflow-auto bg-white prose text-gray-900">
            <ReactMarkdown children={formData.description} />
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
          {editingId ? 'Update' : 'Add'} Character
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
        {characters.map(character => {
          const isCollapsed = character.id ? collapsed[character.id] ?? true : false;
          return (
            <div key={character.id} className="p-4 bg-white rounded shadow">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCollapse(character.id)}
                    className="w-7 h-7 flex items-center justify-center border rounded-full bg-gray-100 hover:bg-gray-200 mr-2"
                    aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    <span className="text-lg">{isCollapsed ? '+' : '-'}</span>
                  </button>
                  <h3 className="text-xl font-semibold">{character.name}</h3>
                </div>
                <div>
                  <button
                    onClick={() => handleEdit(character as Character & { id: number })}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(character.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {!isCollapsed && (
                <>
                  <p className="text-gray-600 mb-2">{character.role}</p>
                  <div className="prose mb-2">
                    <ReactMarkdown children={character.description} />
                  </div>
                  <div>
                    {(character.tags || []).map(t => (
                      <Chip key={t} label={t} onRemove={() => {}} />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Page>
  );
}
