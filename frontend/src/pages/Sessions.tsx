import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAdventures } from '../contexts/AdventureContext';
import Page from '../components/Page';

type Session = { id?: number; title: string; date: string; text: string };

export default function Sessions(): JSX.Element {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [formData, setFormData] = useState<Session & { adventure_id?: number | null }>({ title: '', date: '', text: '', adventure_id: null });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const adv = useAdventures();

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
  return (
    <Page title="Sessions" toolbar={<button onClick={() => setShowCreateForm(true)} className="bg-red-600 text-white px-3 py-1 rounded">+</button>}>
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
              <ReactMarkdown>{formData.text}</ReactMarkdown>
            </div>
          </div>

          <div>
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded">
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

      <div className="space-y-4">
        {sessions.map(session => (
          <div key={session.id} className="p-4 bg-white rounded shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{session.title}</h3>
              <div>
                <button
                  onClick={() => handleEdit(session as Session & { id: number })}
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
            <p className="text-gray-600 mb-2">{session.date}</p>
            <div className="prose">
              <ReactMarkdown>{session.text}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
