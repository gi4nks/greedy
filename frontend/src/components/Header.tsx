import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAdventures } from '../contexts/AdventureContext';

export default function Header(): JSX.Element {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(null);
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleDropdown = (dropdown: string) => {
    setDropdownOpen(dropdownOpen === dropdown ? null : dropdown);
  };

  return (
    <header className="text-white relative" style={{ background: 'var(--header-gradient)' }}>
      <div className="app-container flex items-center justify-between py-3">
        <div className="flex items-center space-x-6">
          <button className="md:hidden p-2 rounded bg-white/10 hover:bg-white/20 transition-colors" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>

          <h1 className="text-xl font-bold"><Link to="/" className="hover:text-white/80 transition-colors">⚔️ AD&D Campaign Manager</Link></h1>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" ref={dropdownRef}>
            {/* Campaign Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('campaign')}
                className={`flex items-center space-x-1 px-3 py-2 rounded transition-colors ${
                  dropdownOpen === 'campaign' 
                    ? 'bg-white/20 text-white' 
                    : 'hover:bg-white/10 text-white/90'
                }`}
                aria-expanded={dropdownOpen === 'campaign'}
                aria-haspopup="true"
              >
                <span>📚 Campaign</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    dropdownOpen === 'campaign' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen === 'campaign' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link to="/adventures" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setDropdownOpen(null)}>🏰 Adventures</Link>
                  <Link to="/sessions" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setDropdownOpen(null)}>📖 Sessions</Link>
                  <Link to="/quests" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setDropdownOpen(null)}>🎯 Quests</Link>
                  <Link to="/timeline" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setDropdownOpen(null)}>⏰ Timeline</Link>
                </div>
              )}
            </div>

            {/* Entities Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('entities')}
                className={`flex items-center space-x-1 px-3 py-2 rounded transition-colors ${
                  dropdownOpen === 'entities' 
                    ? 'bg-white/20 text-white' 
                    : 'hover:bg-white/10 text-white/90'
                }`}
                aria-expanded={dropdownOpen === 'entities'}
                aria-haspopup="true"
              >
                <span>👥 Entities</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    dropdownOpen === 'entities' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen === 'entities' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link to="/characters" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setDropdownOpen(null)}>🧙 Characters</Link>
                  <Link to="/npcs" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setDropdownOpen(null)}>👤 NPCs</Link>
                  <Link to="/magic-items" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setDropdownOpen(null)}>💍 Magic Items</Link>
                  <Link to="/locations" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setDropdownOpen(null)}>🗺️ Locations</Link>
                </div>
              )}
            </div>

            {/* Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('tools')}
                className={`flex items-center space-x-1 px-3 py-2 rounded transition-colors ${
                  dropdownOpen === 'tools' 
                    ? 'bg-white/20 text-white' 
                    : 'hover:bg-white/10 text-white/90'
                }`}
                aria-expanded={dropdownOpen === 'tools'}
                aria-haspopup="true"
              >
                <span>🛠️ Tools</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    dropdownOpen === 'tools' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen === 'tools' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link to="/dice-roller" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setDropdownOpen(null)}>🎲 Dice Roller</Link>
                  <Link to="/combat-tracker" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setDropdownOpen(null)}>⚔️ Combat Tracker</Link>
                  <Link to="/wiki-import" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setDropdownOpen(null)}>📚 Wiki Import</Link>
                  <Link to="/search" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setDropdownOpen(null)}>🔍 Search</Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Secondary Bar */}
      <div className="app-container flex items-center justify-between py-2 border-t border-white/20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-white/80">Adventure:</span>
            <select
              value={adventureCtx.selectedId ?? ''}
              onChange={(e) => adventureCtx.selectAdventure(e.target.value ? Number(e.target.value) : null)}
              className="rounded px-3 py-1 text-black text-sm bg-white"
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
              <div className="flex space-x-2 text-xs">
                <span className="bg-white/20 px-2 py-1 rounded flex items-center space-x-1">
                  <span>📖</span>
                  <span>{counts.sessions}</span>
                </span>
                <span className="bg-white/20 px-2 py-1 rounded flex items-center space-x-1">
                  <span>👥</span>
                  <span>{counts.characters}</span>
                </span>
                <span className="bg-white/20 px-2 py-1 rounded flex items-center space-x-1">
                  <span>🗺️</span>
                  <span>{counts.locations}</span>
                </span>
              </div>
            ) : null;
          })()}
        </div>

        <div className="flex items-center space-x-3">
          <form onSubmit={handleSearch} className="flex">
            <input
              className="px-3 py-1 rounded-l text-black w-48 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="Search campaign..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="bg-white text-[var(--brand-500)] px-3 py-1 rounded-r hover:bg-gray-100 transition-colors">🔍</button>
          </form>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[var(--brand-600)] px-4 py-4 border-t border-white/20">
          {/* Mobile Navigation Groups */}
          <div className="space-y-4">
            {/* Campaign Section */}
            <div>
              <h3 className="text-white/80 text-sm font-semibold mb-2 uppercase tracking-wide">📚 Campaign</h3>
              <nav className="flex flex-col space-y-1 pl-4">
                <Link to="/adventures" className="text-white hover:text-white/80 py-1">🏰 Adventures</Link>
                <Link to="/sessions" className="text-white hover:text-white/80 py-1">📖 Sessions</Link>
                <Link to="/quests" className="text-white hover:text-white/80 py-1">🎯 Quests</Link>
                <Link to="/timeline" className="text-white hover:text-white/80 py-1">⏰ Timeline</Link>
              </nav>
            </div>

            {/* Entities Section */}
            <div>
              <h3 className="text-white/80 text-sm font-semibold mb-2 uppercase tracking-wide">👥 Entities</h3>
              <nav className="flex flex-col space-y-1 pl-4">
                <Link to="/characters" className="text-white hover:text-white/80 py-1">🧙 Characters</Link>
                <Link to="/npcs" className="text-white hover:text-white/80 py-1">👤 NPCs</Link>
                <Link to="/magic-items" className="text-white hover:text-white/80 py-1">💍 Magic Items</Link>
                <Link to="/locations" className="text-white hover:text-white/80 py-1">🗺️ Locations</Link>
              </nav>
            </div>

            {/* Tools Section */}
            <div>
              <h3 className="text-white/80 text-sm font-semibold mb-2 uppercase tracking-wide">🛠️ Tools</h3>
              <nav className="flex flex-col space-y-1 pl-4">
                <Link to="/dice-roller" className="text-white hover:text-white/80 py-1">🎲 Dice Roller</Link>
                <Link to="/combat-tracker" className="text-white hover:text-white/80 py-1">⚔️ Combat Tracker</Link>
                <Link to="/wiki-import" className="text-white hover:text-white/80 py-1">📚 Wiki Import</Link>
                <Link to="/search" className="text-white hover:text-white/80 py-1">🔍 Search</Link>
              </nav>
            </div>
          </div>

          {/* Mobile Secondary Controls */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-sm text-white/80">Adventure:</span>
              <select
                value={adventureCtx.selectedId ?? ''}
                onChange={(e) => adventureCtx.selectAdventure(e.target.value ? Number(e.target.value) : null)}
                className="rounded px-2 py-1 text-black text-sm flex-1"
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
                <div className="flex space-x-2 text-xs mb-3">
                  <span className="bg-white/20 px-2 py-1 rounded flex items-center space-x-1">
                    <span>📖</span>
                    <span>{counts.sessions}</span>
                  </span>
                  <span className="bg-white/20 px-2 py-1 rounded flex items-center space-x-1">
                    <span>👥</span>
                    <span>{counts.characters}</span>
                  </span>
                  <span className="bg-white/20 px-2 py-1 rounded flex items-center space-x-1">
                    <span>🗺️</span>
                    <span>{counts.locations}</span>
                  </span>
                </div>
              ) : null;
            })()}

            <form onSubmit={handleSearch} className="flex mb-3">
              <input
                className="px-2 py-1 rounded-l text-black flex-1"
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="bg-white text-[var(--brand-500)] px-2 py-1 rounded-r text-sm">🔍</button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}