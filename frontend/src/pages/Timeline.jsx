import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function Timeline() {
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    axios.get('/api/sessions').then(res => {
      const sorted = res.data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setSessions(sorted);
    });
  }, []);

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Timeline</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search timeline..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="space-y-4">
        {filteredSessions.map(session => (
          <div key={session.id} className="p-4 bg-white rounded shadow">
            <h3 className="text-xl font-semibold mb-2">{session.title} - {session.date}</h3>
            <div className="prose">
              <ReactMarkdown>{session.text}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Timeline;