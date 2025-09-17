import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';

export default function Timeline(): JSX.Element {
  const [sessions, setSessions] = useState<{ id?: number; title: string; date: string; text: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<{ title: string; date: string; text: string; adventure_id?: number | null }>({ title: '', date: '', text: '', adventure_id: null });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Collapsed state for each session
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const adv = useAdventures();

  // Toggle collapse for a session
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const doSearch = async (term: string) => {
    const params = new URLSearchParams();
    params.set('q', term);
    if (adv.selectedId) params.set('adventure', String(adv.selectedId));
    const res = await axios.get(`/api/search?${params.toString()}`);
    setSessions((res.data.sessions || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, adventure_id: formData.adventure_id ?? adv.selectedId };
    if (editingId) {
      axios.put(`/api/sessions/${editingId}`, payload).then(() => {
        fetchSessions();
        setFormData({ title: '', date: '', text: '', adventure_id: null });
        setEditingId(null);
        setShowCreateForm(false);
      });
    } else {
      axios.post('/api/sessions', payload).then(() => {
        fetchSessions();
        setFormData({ title: '', date: '', text: '', adventure_id: null });
        setShowCreateForm(false);
      });
    }
  };

  const handleEdit = (session: { id: number; title: string; date: string; text: string }) => {
    setFormData({ title: session.title, date: session.date, text: session.text });
    setEditingId(session.id);
    setShowCreateForm(true);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this session?')) {
      axios.delete(`/api/sessions/${id}`).then(() => {
        fetchSessions();
      });
    }
  };

  const fetchSessions = () => {
    axios.get('/api/sessions').then(res => {
      const sorted = res.data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setSessions(sorted);
    });
  };

  return (
    <Page title="Timeline" toolbar={<button onClick={() => setShowCreateForm(true)} className="bg-green-600 text-white px-3 py-1 rounded">+</button>}>
      <div className="mb-4">
        <form onSubmit={(e) => { e.preventDefault(); doSearch(searchTerm); }}>
          <input
            type="text"
            placeholder="Search timeline..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </form>
      </div>

      {(showCreateForm || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white rounded shadow">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adventure</label>
            <select
              value={formData.adventure_id ?? (adv.selectedId ?? '')}
              onChange={(e) => setFormData({ ...formData, adventure_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full p-2 border rounded"
            >
              <option value="">Global</option>
              {adv.adventures.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-2">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-2">
            <textarea
              placeholder="Session notes (Markdown supported)"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="w-full p-2 border rounded h-40"
              required
            />
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Preview</h4>
            <div className="p-2 border rounded h-40 overflow-auto bg-white prose text-gray-900">
              <ReactMarkdown children={formData.text} />
            </div>
          </div>

          <div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
              {editingId ? 'Update' : 'Add'} Session
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setFormData({ title: '', date: '', text: '', adventure_id: null });
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
                  setFormData({ title: '', date: '', text: '', adventure_id: null });
                  setShowCreateForm(false);
                }}
                className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-4">
        {sessions.map(session => {
          const isCollapsed = session.id ? collapsed[session.id] ?? true : false;
          return (
            <div key={session.id} className="p-4 bg-white rounded shadow">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCollapse(session.id)}
                    className="w-7 h-7 flex items-center justify-center border rounded-full bg-gray-100 hover:bg-gray-200 mr-2"
                    aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    <span className="text-lg">{isCollapsed ? '+' : '-'}</span>
                  </button>
                  <h3 className="text-xl font-semibold">{session.title} - {session.date}</h3>
                </div>
                <div>
                  <button
                    onClick={() => handleEdit(session as { id: number; title: string; date: string; text: string })}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {!isCollapsed && (
                <div className="prose">
                  <ReactMarkdown children={session.text} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Page>
  );
}
