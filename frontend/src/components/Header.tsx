import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAdventures } from '../contexts/AdventureContext';

export default function Header(): JSX.Element {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="navbar bg-primary text-primary-content shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-sm lg:hidden" onClick={() => setOpen(!open)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </div>
          {open && (
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 text-base-content">
              <li className="menu-title">📚 Campaign</li>
              <li><Link to="/adventures" onClick={() => setOpen(false)}>🏰 Adventures</Link></li>
              <li><Link to="/sessions" onClick={() => setOpen(false)}>📖 Sessions</Link></li>
              <li><Link to="/quests" onClick={() => setOpen(false)}>🎯 Quests</Link></li>
              <li><Link to="/timeline" onClick={() => setOpen(false)}>⏰ Timeline</Link></li>
              <li className="menu-title">👥 Entities</li>
              <li><Link to="/characters" onClick={() => setOpen(false)}>🧙 Characters</Link></li>
              <li><Link to="/npcs" onClick={() => setOpen(false)}>👤 NPCs</Link></li>
              <li><Link to="/magic-items" onClick={() => setOpen(false)}>💍 Magic Items</Link></li>
              <li><Link to="/locations" onClick={() => setOpen(false)}>🗺️ Locations</Link></li>
              <li className="menu-title">🛠️ Tools</li>
              <li><Link to="/dice-roller" onClick={() => setOpen(false)}>🎲 Dice Roller</Link></li>
              <li><Link to="/combat-tracker" onClick={() => setOpen(false)}>⚔️ Combat Tracker</Link></li>
              <li><Link to="/wiki-import" onClick={() => setOpen(false)}>📚 Wiki Import</Link></li>
              <li><Link to="/parking-lot" onClick={() => setOpen(false)}>🅿️ Parking Lot</Link></li>
              <li><Link to="/search" onClick={() => setOpen(false)}>🔍 Search</Link></li>
            </ul>
          )}
        </div>
        <Link to="/" className="btn btn-ghost btn-sm normal-case text-xl font-bold">⚔️ AD&D Campaign Manager</Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex ml-6">
          {/* Campaign Dropdown */}
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
              📚 Campaign
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 text-base-content z-[1]">
              <li><Link to="/adventures">🏰 Adventures</Link></li>
              <li><Link to="/sessions">📖 Sessions</Link></li>
              <li><Link to="/quests">🎯 Quests</Link></li>
              <li><Link to="/timeline">⏰ Timeline</Link></li>
            </ul>
          </div>

          {/* Entities Dropdown */}
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
              👥 Entities
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 text-base-content z-[1]">
              <li><Link to="/characters">🧙 Characters</Link></li>
              <li><Link to="/npcs">👤 NPCs</Link></li>
              <li><Link to="/magic-items">💍 Magic Items</Link></li>
              <li><Link to="/locations">🗺️ Locations</Link></li>
            </ul>
          </div>

          {/* Tools Dropdown */}
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
              🛠️ Tools
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 text-base-content z-[1]">
              <li><Link to="/dice-roller">🎲 Dice Roller</Link></li>
              <li><Link to="/combat-tracker">⚔️ Combat Tracker</Link></li>
              <li><Link to="/wiki-import">📚 Wiki Import</Link></li>
              <li><Link to="/parking-lot">🅿️ Parking Lot</Link></li>
              <li><Link to="/search">🔍 Search</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="navbar-end">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Adventure:</span>
            <select
              value={adventureCtx.selectedId ?? ''}
              onChange={(e) => adventureCtx.selectAdventure(e.target.value ? Number(e.target.value) : null)}
              className="select select-bordered select-sm bg-base-100 text-base-content"
            >
              <option value="">🌍 Global</option>
              {adventureCtx.adventures.map(a => (
                <option key={a.id} value={a.id}>📖 {a.title}</option>
              ))}
            </select>
          </div>

          {adventureCtx.selectedId && (() => {
            const ad = adventureCtx.adventures.find(x => x.id === adventureCtx.selectedId);
            const counts = ad && ad.id ? (adventureCtx.counts[ad.id] || { sessions: 0, characters: 0, locations: 0 }) : null;
            return counts ? (
              <div className="flex gap-2 text-xs">
                <div className="badge badge-primary gap-1">
                  <span>📖</span>
                  <span>{counts.sessions}</span>
                </div>
                <div className="badge badge-primary gap-1">
                  <span>👥</span>
                  <span>{counts.characters}</span>
                </div>
                <div className="badge badge-primary gap-1">
                  <span>🗺️</span>
                  <span>{counts.locations}</span>
                </div>
              </div>
            ) : null;
          })()}

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              className="input input-bordered input-sm bg-base-100 text-base-content w-48"
              placeholder="Search campaign..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn btn-primary btn-sm">🔍</button>
          </form>
        </div>
      </div>
    </div>
  );
}