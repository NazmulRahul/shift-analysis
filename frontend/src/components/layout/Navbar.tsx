import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Database } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Operations Dashboard';
      case '/streaks':
        return 'Downtime & Breakdown Streaks';
      case '/quality':
        return 'Data Integrity & Quality Report';
      case '/upload':
        return 'Dataset Ingestion';
      default:
        return 'Shift Analytics';
    }
  };

  return (
    <header className="sticky-navbar h-[70px] border-b border-[var(--border)] text-[var(--foreground)] px-8 flex items-center justify-between transition-colors duration-300">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--secondary)] text-sm font-medium">
          <Database size={16} className="text-emerald-500 animate-pulse" />
          <span>Active Dataset</span>
        </div>
        
        <button 
          onClick={toggleTheme} 
          className="p-2.5 rounded-xl hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] transition-all duration-200" 
          aria-label="Toggle Theme"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
};
