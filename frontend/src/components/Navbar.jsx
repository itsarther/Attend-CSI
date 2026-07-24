import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, Moon, Sun, LogOut, User as UserIcon, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-csi-cyan flex items-center justify-center text-white shadow-glow-blue group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                Attend <span className="text-brand-400 font-light">| CSI</span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest font-semibold text-slate-400">
                CSI-CATT Committee
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>System Active</span>
          </div>
        </div>

        {/* Right Section Actions */}
        <div className="flex items-center space-x-4">
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors border border-slate-700/50"
            title="Toggle Dark/Light Mode"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          </button>

          {/* User Profile */}
          {user && (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-slate-200 leading-none">{user.full_name}</p>
                <p className="text-xs text-brand-400 font-medium mt-0.5 uppercase tracking-wider">{user.role}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-brand-500/30 flex items-center justify-center text-brand-300 font-bold">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
