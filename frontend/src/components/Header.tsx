import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { useToast } from './Toast';
import { useAdventures } from '../contexts/AdventureContext';

export default function Header(): JSX.Element {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    // include selected adventure id as a query param when present
    const params = new URLSearchParams();
    params.set('q', q);
    if (adventureCtx.selectedId) params.set('a', String(adventureCtx.selectedId));
    navigate(`/search?${params.toString()}`);
  };

  const adventureCtx = useAdventures();

  const handleExport = async () => {
    const res = await axios.get('/api/export');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'campaign-data.json');
    dlAnchor.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    <header className="text-white" style={{ background: 'var(--header-gradient)' }}>
      <div className="app-container flex items-center justify-between py-3">
        <div className="flex items-center space-x-4">
          <button className="md:hidden p-2 rounded bg-white/10" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>

          <h1 className="text-lg font-bold"><Link to="/">AD&D Campaign Manager</Link></h1>
          <nav className="hidden md:flex space-x-6">
            <Link to="/adventures" className="hover:underline">Adventures</Link>
            <Link to="/characters" className="hover:underline">Characters</Link>
            <Link to="/magic-items" className="hover:underline">Magic Items</Link>
            <Link to="/sessions" className="hover:underline">Sessions</Link>
            <Link to="/locations" className="hover:underline">Locations</Link>
            <Link to="/timeline" className="hover:underline">Timeline</Link>
            <Link to="/search" className="hover:underline">Search</Link>
          </nav>
        </div>
      </div>

      <div className="app-container flex items-center justify-between py-3 border-t border-white/20">
        <div className="flex items-center space-x-4">
          <select
            value={adventureCtx.selectedId ?? ''}
            onChange={(e) => adventureCtx.selectAdventure(e.target.value ? Number(e.target.value) : null)}
            className="rounded px-3 py-1 text-black text-sm"
          >
            <option value="">Global</option>
            {adventureCtx.adventures.map(a => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
          {adventureCtx.selectedId && (() => {
            const ad = adventureCtx.adventures.find(x => x.id === adventureCtx.selectedId);
            const counts = ad && ad.id ? (adventureCtx.counts[ad.id] || { sessions: 0, characters: 0, locations: 0 }) : null;
            return counts ? (
              <div className="flex space-x-2 text-xs">
                <span className="bg-white/20 px-2 py-1 rounded">S:{counts.sessions}</span>
                <span className="bg-white/20 px-2 py-1 rounded">C:{counts.characters}</span>
                <span className="bg-white/20 px-2 py-1 rounded">L:{counts.locations}</span>
              </div>
            ) : null;
          })()}
        </div>

        <div className="flex items-center space-x-3">
          <form onSubmit={handleSearch} className="flex">
            <input
              className="px-3 py-1 rounded-l text-black w-48"
              placeholder="Search..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="bg-white text-[var(--brand-500)] px-3 py-1 rounded-r">Go</button>
          </form>

          <button onClick={handleExport} className="bg-white text-[var(--brand-500)] px-3 py-1 rounded text-sm">Export</button>
          <label className="bg-white text-[var(--brand-500)] px-3 py-1 rounded text-sm cursor-pointer">
            Import
            <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[var(--brand-600)] px-4 py-3">
          <nav className="flex flex-col space-y-2">
            <Link to="/adventures" className="text-white">Adventures</Link>
            <Link to="/characters" className="text-white">Characters</Link>
            <Link to="/sessions" className="text-white">Sessions</Link>
            <Link to="/locations" className="text-white">Locations</Link>
            <Link to="/timeline" className="text-white">Timeline</Link>
            <Link to="/search" className="text-white">Search</Link>
          </nav>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <select
                value={adventureCtx.selectedId ?? ''}
                onChange={(e) => adventureCtx.selectAdventure(e.target.value ? Number(e.target.value) : null)}
                className="rounded px-2 py-1 text-black text-sm flex-1"
              >
                <option value="">Global</option>
                {adventureCtx.adventures.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
            {adventureCtx.selectedId && (() => {
              const ad = adventureCtx.adventures.find(x => x.id === adventureCtx.selectedId);
              const counts = ad && ad.id ? (adventureCtx.counts[ad.id] || { sessions: 0, characters: 0, locations: 0 }) : null;
              return counts ? (
                <div className="flex space-x-2 text-xs mb-2">
                  <span className="bg-white/20 px-2 py-1 rounded">S:{counts.sessions}</span>
                  <span className="bg-white/20 px-2 py-1 rounded">C:{counts.characters}</span>
                  <span className="bg-white/20 px-2 py-1 rounded">L:{counts.locations}</span>
                </div>
              ) : null;
            })()}
            <form onSubmit={handleSearch} className="flex mb-2">
              <input
                className="px-2 py-1 rounded-l text-black flex-1"
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="bg-white text-[var(--brand-500)] px-2 py-1 rounded-r text-sm">Go</button>
            </form>
            <div className="flex space-x-2">
              <button onClick={handleExport} className="bg-white text-[var(--brand-500)] px-2 py-1 rounded text-sm flex-1">Export</button>
              <label className="bg-white text-[var(--brand-500)] px-2 py-1 rounded text-sm cursor-pointer flex-1 text-center">
                Import
                <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

