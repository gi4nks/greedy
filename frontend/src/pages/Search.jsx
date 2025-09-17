import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function Search() {
  const [params] = useSearchParams();
  const qParam = params.get('q') || '';
  const [q, setQ] = useState(qParam);
  const [results, setResults] = useState({ sessions: [], npcs: [], locations: [] });

  useEffect(() => {
    if (qParam) doSearch(qParam);
  }, [qParam]);

  const doSearch = async (term) => {
    const res = await axios.get(`/api/search?q=${encodeURIComponent(term)}`);
    setResults(res.data);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    await doSearch(q);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Search</h2>
      <form onSubmit={onSubmit} className="mb-4">
        <input
          className="w-full p-2 border rounded"
          placeholder="Search all notes..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Sessions</h3>
        {results.sessions.map(s => (
          <div key={s.id} className="p-3 bg-white rounded shadow mb-2">
            <h4 className="font-semibold">{s.title} <span className="text-sm text-gray-500">{s.date}</span></h4>
            <div className="prose"><ReactMarkdown>{s.text}</ReactMarkdown></div>
          </div>
        ))}
      </section>

      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-2">NPCs</h3>
        {results.npcs.map(n => (
          <div key={n.id} className="p-3 bg-white rounded shadow mb-2">
            <h4 className="font-semibold">{n.name} <span className="text-sm text-gray-500">{n.role}</span></h4>
            <div className="prose"><ReactMarkdown>{n.description}</ReactMarkdown></div>
            <p className="text-sm text-gray-500">Tags: {(n.tags || []).join(', ')}</p>
          </div>
        ))}
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-2">Locations</h3>
        {results.locations.map(l => (
          <div key={l.id} className="p-3 bg-white rounded shadow mb-2">
            <h4 className="font-semibold">{l.name}</h4>
            <p className="text-gray-600">{l.description}</p>
            <div className="prose"><ReactMarkdown>{l.notes}</ReactMarkdown></div>
            <p className="text-sm text-gray-500">Tags: {(l.tags || []).join(', ')}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
