import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Compass, 
  Search, 
  Clock, 
  FolderOpen, 
  MessageSquare,
  BarChart,
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  User
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Search History', icon: Search },
    { to: '/timeline', label: 'Timeline', icon: Clock },
    { to: '/collections', label: 'Collections', icon: FolderOpen },
    { to: '/chat', label: 'Chat Memory', icon: MessageSquare },
    { to: '/analytics', label: 'Analytics', icon: BarChart },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0">
      <div className="flex flex-col gap-8 p-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Compass className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-md tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
            Internet Memory
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                      : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile */}
      <div className="p-6 border-t border-slate-200/60 dark:border-zinc-900/60 flex flex-col gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300 font-bold text-sm">
              {user.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                {user.name || 'User'}
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center p-2 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-xs font-medium gap-1.5"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg border border-red-200/50 dark:border-red-950 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-950/40 transition-all flex items-center justify-center"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
