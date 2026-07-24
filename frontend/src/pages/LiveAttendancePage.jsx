import React, { useState, useEffect } from 'react';
import { Radio, Users, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function LiveAttendancePage() {
  const [liveData, setLiveData] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data);
        const live = res.data.find(e => e.status === 'ATTENDANCE_ACTIVE' || e.status === 'LIVE') || res.data[0];
        if (live) setSelectedEventId(live.id);
      } catch (e) {
        console.error(e);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;

    const pollLive = async () => {
      try {
        const res = await api.get(`/attendance/live/${selectedEventId}`);
        setLiveData(res.data);
      } catch (e) {
        console.error(e);
      }
    };

    pollLive();
    const interval = setInterval(pollLive, 2500);
    return () => clearInterval(interval);
  }, [selectedEventId]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-emerald-400 animate-ping" />
            <span>Venue Live Attendance Ticker</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time projection stream for venue screens & committee monitors
          </p>
        </div>

        {/* Select Active Event */}
        <select
          value={selectedEventId || ''}
          onChange={(e) => setSelectedEventId(parseInt(e.target.value, 10))}
          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} ({ev.status})
            </option>
          ))}
        </select>
      </div>

      {/* Main Counter Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950/40 to-slate-950 border border-brand-500/40 text-center space-y-3 shadow-2xl relative overflow-hidden">
        <span className="text-xs font-extrabold uppercase tracking-widest text-brand-400 flex items-center justify-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          VERIFIED VENUE SUBMISSIONS
        </span>
        <div className="text-7xl font-black font-mono text-white tracking-tight bg-gradient-to-r from-white via-brand-300 to-csi-glow bg-clip-text text-transparent">
          {liveData?.total_attendance || 0}
        </div>
        <p className="text-xs text-slate-400">
          Event: <strong className="text-slate-200">{liveData?.event_name}</strong>
        </p>
      </div>

      {/* Real-Time Entry Feed Stream */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-400" />
          <span>Real-Time Stream Feed (Latest Submissions)</span>
        </h3>

        <div className="space-y-2.5">
          {liveData?.recent_entries?.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">Waiting for live student scans...</p>
          ) : (
            liveData?.recent_entries?.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between hover:border-brand-500/40 transition-all animate-fadeIn"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{item.student_name}</h4>
                    <p className="text-xs text-slate-400">
                      GR: <span className="font-mono text-brand-300">{item.gr_number}</span> &nbsp;•&nbsp; {item.department} ({item.year})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">{item.time}</span>
                  <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Verified Present
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
