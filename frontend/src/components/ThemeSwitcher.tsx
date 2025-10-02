import React, { useState, useEffect } from 'react';
import { THEME, getCurrentTheme, setTheme } from '../config/theme';

interface ThemeSwitcherProps {
  className?: string;
}

const AVAILABLE_THEMES = THEME.availableThemes;
type ThemeName = typeof AVAILABLE_THEMES[number];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = '' }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('emerald');

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = getCurrentTheme() as ThemeName;
    if (AVAILABLE_THEMES.includes(savedTheme)) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const switchTheme = (themeName: ThemeName) => {
    setTheme(themeName);
    setCurrentTheme(themeName);
  };

  const getThemeIcon = (themeName: ThemeName) => {
    switch (themeName) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'cmyk': return '🎨';
      case 'emerald': return '💚';
      case 'corporate': return '🏢';
      default: return '🎯';
    }
  };

  const getThemeLabel = (themeName: ThemeName) => {
    switch (themeName) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'cmyk': return 'CMYK';
      case 'emerald': return 'Emerald';
      case 'corporate': return 'Corporate';
      default: return themeName;
    }
  };

  return (
    <div className={`dropdown dropdown-end ${className}`}>
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        {getThemeIcon(currentTheme)}
      </div>
      <ul tabIndex={0} className="dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box w-52">
        {AVAILABLE_THEMES.map((themeName) => (
          <li key={themeName}>
            <button
              onClick={() => switchTheme(themeName)}
              className={`flex items-center gap-2 p-2 rounded-box w-full text-left ${
                currentTheme === themeName ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
              }`}
            >
              <span>{getThemeIcon(themeName)}</span>
              <span>{getThemeLabel(themeName)}</span>
              {currentTheme === themeName && <span className="ml-auto">✓</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ThemeSwitcher;