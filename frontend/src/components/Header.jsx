import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { useToast } from './Toast';

export default function Header() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleExport = async () => {
    const res = await axios.get('/api/export');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'campaign-data.json');
    dlAnchor.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await axios.post('/api/import', json);
      toast.push('Import successful — refresh pages to see changes.');
    } catch (err) {
      toast.push('Invalid JSON import', { type: 'error' });
    }
  };

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold"><Link to="/">AD&D Campaign Manager</Link></h1>
          <nav className="space-x-3 hidden md:flex">
            <Link to="/sessions" className="hover:underline">Sessions</Link>
            <Link to="/npcs" className="hover:underline">NPCs</Link>
            <Link to="/locations" className="hover:underline">Locations</Link>
            <Link to="/timeline" className="hover:underline">Timeline</Link>
            <Link to="/search" className="hover:underline">Search</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <form onSubmit={handleSearch} className="hidden sm:flex">
            <input
              className="px-2 py-1 rounded text-black"
              placeholder="Search..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="ml-2 bg-white text-blue-600 px-3 py-1 rounded">Go</button>
          </form>

          <button onClick={handleExport} className="bg-white text-blue-600 px-3 py-1 rounded">Export</button>
          <label className="bg-white text-blue-600 px-3 py-1 rounded cursor-pointer">
            Import
            <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>
    </header>
  );
}
