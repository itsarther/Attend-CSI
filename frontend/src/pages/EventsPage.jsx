import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  Users, 
  PlayCircle, 
  Copy, 
  Trash2, 
  Edit, 
  Radio, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function EventsPage({ onOpenCreateEvent, onEditEvent }) {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      toast.error('Failed to load events list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDuplicate = async (id, name) => {
    try {
      await api.post(`/events/${id}/duplicate`);
      toast.success(`Duplicated event '${name}'`);
      loadEvents();
    } catch (err) {
      toast.error('Failed to duplicate event');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete event '${name}' and all its attendance history?`)) {
      try {
        await api.delete(`/events/${id}`);
        toast.success(`Deleted event '${name}'`);
        loadEvents();
      } catch (err) {
        toast.error('Failed to delete event');
      }
    }
  };

  const handleCloseAttendance = async (id, name) => {
    if (window.confirm(`Are you sure you want to close attendance for '${name}'?`)) {
      try {
        await api.post(`/sessions/stop-by-event/${id}`);
        toast.success(`Closed attendance for '${name}'`);
        loadEvents();
      } catch (err) {
        toast.error('Failed to close attendance');
      }
    }
  };

  const filteredEvents = events.filter((ev) => {
    const s = search.toLowerCase();
    const matchesSearch = ev.name.toLowerCase().includes(s) || ev.venue.toLowerCase().includes(s);
    if (statusTab === 'ALL') return matchesSearch;
    if (statusTab === 'ACTIVE') return matchesSearch && (ev.status === 'ATTENDANCE_ACTIVE' || ev.status === 'LIVE');
    return matchesSearch && ev.status === statusTab;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Event Management Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize workshops, seminars, hackathons & trigger dynamic QR attendance sessions
          </p>
        </div>
        <button
          onClick={onOpenCreateEvent}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs flex items-center space-x-2 shadow-glow-blue transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
        
        {/* Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          {['ALL', 'ACTIVE', 'UPCOMING', 'CLOSED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusTab === tab
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'ACTIVE' ? 'Live / Active' : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search events by title or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvents.map((ev) => (
          <div key={ev.id} className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {ev.type}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  ev.status === 'ATTENDANCE_ACTIVE' || ev.status === 'LIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                    : ev.status === 'UPCOMING'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {ev.status === 'ATTENDANCE_ACTIVE' ? 'Attendance Active' : ev.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-white leading-snug">{ev.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ev.description || 'No description provided.'}</p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex items-center space-x-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span>{ev.venue} &nbsp;•&nbsp; {ev.department}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span>{ev.date} ({ev.start_time} - {ev.end_time})</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span><strong className="text-white font-mono">{ev.attendance_count}</strong> Registered Students</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onEditEvent(ev)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Edit Event"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicate(ev.id, ev.name)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Duplicate Event"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {(ev.status === 'ATTENDANCE_ACTIVE' || ev.status === 'LIVE') && (
                  <button
                    onClick={() => handleCloseAttendance(ev.id, ev.name)}
                    className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors"
                    title="Close Attendance"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(ev.id, ev.name)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <Link
                to={`/events/${ev.id}`}
                className="py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-glow-blue"
              >
                <span>Manage & QR</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
