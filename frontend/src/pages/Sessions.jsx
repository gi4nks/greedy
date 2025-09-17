import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [formData, setFormData] = useState({ title: '', date: '', text: '' });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = () => {
    axios.get('/api/sessions').then(res => setSessions(res.data));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      axios.put(`/api/sessions/${editingId}`, formData).then(() => {
        fetchSessions();
        setFormData({ title: '', date: '', text: '' });
        setEditingId(null);
      });
    } else {
      axios.post('/api/sessions', formData).then(() => {
        fetchSessions();
        setFormData({ title: '', date: '', text: '' });
      });
    }
  };

  const handleEdit = (session) => {
    setFormData({ title: session.title, date: session.date, text: session.text });
    setEditingId(session.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      axios.delete(`/api/sessions/${id}`).then(() => {
        fetchSessions();
      });
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Sessions</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">{editingId ? 'Edit Session' : 'Add New Session'}</h3>
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
        <div className="mb-2 grid grid-cols-2 gap-4">
          <textarea
            placeholder="Session notes (Markdown supported)"
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            className="w-full p-2 border rounded h-32"
            required
          />
          <div>
            <h4 className="font-semibold mb-2">Preview</h4>
            <div className="p-2 border rounded h-32 overflow-auto bg-white prose text-gray-900">
              <ReactMarkdown>{formData.text}</ReactMarkdown>
            </div>
          </div>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {editingId ? 'Update' : 'Add'} Session
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setFormData({ title: '', date: '', text: '' });
              setEditingId(null);
            }}
            className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
      </form>

      <div className="space-y-4">
        {filteredSessions.map(session => (
          <div key={session.id} className="p-4 bg-white rounded shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{session.title}</h3>
              <div>
                <button
                  onClick={() => handleEdit(session)}
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
    </div>
  );
}

export default Sessions;