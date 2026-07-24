import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Radio, 
  Users, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  PlayCircle, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import StatCard from '../components/StatCard';
import api from '../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

export default function DashboardPage({ onOpenCreateEvent }) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, anaRes, evRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/analytics'),
        api.get('/events')
      ]);
      setSummary(sumRes.data);
      setAnalytics(anaRes.data);
      setRecentEvents(evRes.data.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      toast.error('Failed to update dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Executive Control Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time department event attendance telemetry & physical presence insights
          </p>
        </div>
        <button
          onClick={onOpenCreateEvent}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs flex items-center space-x-2 shadow-glow-blue transition-all"
        >
          <Calendar className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Live Session Banner if Active */}
      {summary?.live_session && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-brand-900/60 via-slate-900 to-csi-dark border border-brand-500/40 shadow-glow-blue flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 animate-pulse-glow">
              <Radio className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
                  ATTENDANCE SESSION ACTIVE NOW
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                {summary.live_session.event_name}
              </h2>
              <p className="text-xs text-slate-400">
                Total Live Submissions: <strong className="text-brand-300 font-mono text-sm">{summary.live_session.attendance_count}</strong> Students
              </p>
            </div>
          </div>

          <Link
            to={`/events/${summary.live_session.event_id}`}
            className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-semibold text-xs flex items-center space-x-2 shadow-sm shrink-0"
          >
            <span>Open Session Control</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={summary?.total_events || 0}
          subtitle="Department-level organized"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Active Live Events"
          value={summary?.active_events || 0}
          subtitle="Attendance active"
          icon={Radio}
          color="emerald"
        />
        <StatCard
          title="Attendance Today"
          value={summary?.total_attendance_today || 0}
          subtitle="Physical venue checked"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="All-Time Attendance"
          value={summary?.total_attendance_all_time || 0}
          subtitle="Total verified records"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Breakdown Bar Chart */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">Attendance by Department</h3>
              <p className="text-xs text-slate-400">Student count distribution across engineering branches</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {analytics?.by_department?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.by_department}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#38BDF8', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No departmental telemetry data available
              </div>
            )}
          </div>
        </div>

        {/* Academic Year Donut Chart */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <div>
            <h3 className="font-bold text-slate-200 text-sm">Attendance by Year</h3>
            <p className="text-xs text-slate-400">FE, SE, TE, and BE participation</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {analytics?.by_year?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.by_year}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.by_year.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No year distribution data</div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Events Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-200 text-sm">Recent Department Events</h3>
            <p className="text-xs text-slate-400">Overview of recent & active CSI-CATT events</p>
          </div>
          <Link
            to="/events"
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center space-x-1"
          >
            <span>View All Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Event Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {recentEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{ev.name}</td>
                  <td className="py-3.5 px-4">{ev.type}</td>
                  <td className="py-3.5 px-4">{ev.venue}</td>
                  <td className="py-3.5 px-4 text-slate-400">{ev.date}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-400">
                    {ev.attendance_count} Students
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ev.status === 'ATTENDANCE_ACTIVE' || ev.status === 'LIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : ev.status === 'UPCOMING'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/events/${ev.id}`}
                      className="py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
