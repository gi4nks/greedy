import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAdventures } from '../contexts/AdventureContext';
import Page from '../components/Page';

type Session = { id?: number; title: string; date: string; text: string };

export default function Sessions(): JSX.Element {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [formData, setFormData] = useState<Session & { adventure_id?: number | null }>({ title: '', date: '', text: '', adventure_id: null });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Collapsed state for each session
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const adv = useAdventures();

  // Toggle collapse for a session
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  useEffect(() => {
    // initial load: fetch sessions optionally filtered by selected adventure
    fetchSessions();
  }, []);

  const fetchSessions = () => {
    axios.get('/api/sessions').then(res => setSessions(res.data));
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

  const handleEdit = (session: Session & { id: number }) => {
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

  const doSearch = async (term: string) => {
    const params = new URLSearchParams();
    params.set('q', term);
    if (adv.selectedId) params.set('adventure', String(adv.selectedId));
    const res = await axios.get(`/api/search?${params.toString()}`);
    // server returns sessions, npcs, locations — we use sessions
    setSessions(res.data.sessions || []);
  };
  // Sort sessions by date descending (newest first)
  const sortedSessions = [...sessions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <Page title="Sessions" toolbar={<button type="button" onMouseDown={(e) => { e.preventDefault(); console.log('Sessions + button clicked'); setShowCreateForm(true); }} onClick={() => { console.log('Sessions + onClick fired'); setShowCreateForm(true); }} className="bg-orange-600 text-white px-3 py-1 rounded">+</button>}>
      {(showCreateForm || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-lg shadow-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">{editingId ? 'Edit Session' : 'Add Session'}</h3>
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

            <div className="flex justify-end space-x-2 mt-4">
              <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded font-semibold">
                {editingId ? 'Update Session' : 'Add Session'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ title: '', date: '', text: '', adventure_id: null });
                  setEditingId(null);
                  setShowCreateForm(false);
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

      <div className="mb-4">
        <form onSubmit={(e) => { e.preventDefault(); doSearch(searchTerm); }}>
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </form>
      </div>

      <h2 className="text-lg font-bold mb-2">Session List</h2>
      <div className="space-y-6">
        {sortedSessions.map(session => {
          const isCollapsed = session.id ? collapsed[session.id] ?? true : false;
          return (
            <div key={session.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCollapse(session.id)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-orange-200 rounded-full bg-orange-50 hover:bg-orange-100 hover:border-orange-300 transition-colors duration-200"
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      <span className="text-lg font-bold text-orange-600">{isCollapsed ? '+' : '−'}</span>
                    </button>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{session.title}</h3>
                      <div className="text-sm text-gray-600 mt-1">{session.date}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(session as Session & { id: number })}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <span>✏️</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
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
                  <div className="prose prose-sm max-w-none text-gray-900">
                    <ReactMarkdown children={session.text} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Page>
  );
}
