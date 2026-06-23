import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, ShieldAlert, UploadCloud } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col border-r border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] transition-colors duration-300">
      <div className="p-6 flex items-center gap-3 border-b border-[var(--border)]">
        <Zap className="text-violet-500 animate-pulse" size={28} />
        <h2 className="text-xl font-bold tracking-tight">ShiftAnalytics</h2>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
              isActive 
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' 
                : 'hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`
          }
        >
          <LayoutDashboard size={20} className="shrink-0" />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/streaks" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
              isActive 
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' 
                : 'hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`
          }
        >
          <Zap size={20} className="shrink-0" />
          <span>Breakdown Streaks</span>
        </NavLink>
        
        <NavLink 
          to="/quality" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
              isActive 
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' 
                : 'hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`
          }
        >
          <ShieldAlert size={20} className="shrink-0" />
          <span>Data Quality</span>
        </NavLink>
        
        <NavLink 
          to="/upload" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
              isActive 
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' 
                : 'hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`
          }
        >
          <UploadCloud size={20} className="shrink-0" />
          <span>Upload Dataset</span>
        </NavLink>
      </nav>
      
      <div className="p-6 border-t border-[var(--border)]">
        <p className="text-xs font-semibold tracking-wider uppercase text-[var(--muted-foreground)]">Plant Operations</p>
        <p className="text-sm font-medium mt-1 text-[var(--foreground)]">v1.0.0</p>
      </div>
    </aside>
  );
};
