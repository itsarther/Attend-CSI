import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorStyles = {
    blue: 'from-blue-600/20 to-cyan-500/10 text-blue-400 border-blue-500/30',
    emerald: 'from-emerald-600/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
    purple: 'from-purple-600/20 to-indigo-500/10 text-purple-400 border-purple-500/30',
    amber: 'from-amber-600/20 to-orange-500/10 text-amber-400 border-amber-500/30',
    rose: 'from-rose-600/20 to-pink-500/10 text-rose-400 border-rose-500/30'
  };

  const currentStyle = colorStyles[color] || colorStyles.blue;

  return (
    <div className="glass-card p-5 rounded-2xl border transition-all hover:border-slate-700/80 hover:translate-y-[-2px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-3xl font-extrabold text-white mt-1.5 font-sans">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`p-3.5 rounded-2xl bg-gradient-to-br border ${currentStyle}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
