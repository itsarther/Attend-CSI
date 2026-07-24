import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Radio, 
  History, 
  ShieldAlert, 
  PlusCircle 
} from 'lucide-react';

export default function Sidebar({ onOpenCreateEvent }) {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Events Management', path: '/events', icon: CalendarDays },
    { label: 'Live Monitor', path: '/live-monitor', icon: Radio },
    { label: 'Audit Trail', path: '/audit-logs', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 flex flex-col justify-between p-4 hidden md:flex min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        
        {/* Quick Action Button */}
        {onOpenCreateEvent && (
          <button
            onClick={onOpenCreateEvent}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold flex items-center justify-center space-x-2 shadow-glow-blue transition-all transform active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create New Event</span>
          </button>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1">
        <p className="font-semibold text-slate-300">CSI-CATT Attendance System</p>
        <p className="text-slate-400 text-[11px]">Department Event Management</p>
        <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800">
          <span>Version 1.0.0</span>
          <span className="text-emerald-400 font-medium">Production Ready</span>
        </div>
      </div>
    </aside>
  );
}
