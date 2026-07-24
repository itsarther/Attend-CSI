import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  QrCode, 
  UserPlus, 
  MapPin, 
  Clock, 
  Calendar, 
  Building, 
  Users, 
  ShieldCheck, 
  RefreshCw,
  Radio,
  Trash2,
  StopCircle
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import QRCodeModal from '../components/QRCodeModal';
import ManualAttendanceModal from '../components/ManualAttendanceModal';
import AttendanceTable from '../components/AttendanceTable';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [records, setRecords] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showQRModal, setShowQRModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const [evRes, recRes, sessRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/attendance/event/${eventId}`),
        api.get(`/sessions/active-by-event/${eventId}`)
      ]);
      setEvent(evRes.data);
      setRecords(recRes.data);
      if (sessRes.data.has_active_session) {
        setActiveSession(sessRes.data.session);
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();

    // Live refresh polling every 4s
    const interval = setInterval(async () => {
      try {
        const [recRes, sessRes] = await Promise.all([
          api.get(`/attendance/event/${eventId}`),
          api.get(`/sessions/active-by-event/${eventId}`)
        ]);
        setRecords(recRes.data);
        if (sessRes.data.has_active_session) {
          setActiveSession(sessRes.data.session);
        } else {
          setActiveSession(null);
        }
      } catch (e) {
        // silent fail
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [eventId]);

  const handleStartAttendance = async () => {
    if (activeSession) {
      setShowQRModal(true);
      return;
    }
    try {
      const res = await api.post('/sessions/start', {
        event_id: parseInt(eventId, 10),
        duration_minutes: event?.attendance_duration || 15
      });
      setActiveSession(res.data);
      setShowQRModal(true);
      toast.success('Attendance session active & QR Code generated!');
      loadEventData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start attendance session');
    }
  };

  const handleCloseAttendance = async () => {
    if (window.confirm(`Are you sure you want to close attendance for '${event?.name}'?`)) {
      try {
        await api.post(`/sessions/stop-by-event/${eventId}`);
        toast.success('Attendance session closed');
        setActiveSession(null);
        loadEventData();
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to close attendance session');
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm(`Are you sure you want to delete event '${event?.name}' and all its attendance records?`)) {
      try {
        await api.delete(`/events/${eventId}`);
        toast.success(`Deleted event '${event?.name}'`);
        navigate('/events');
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to delete event');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/events"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white">{event?.name || 'Loading Event...'}</h1>
            <p className="text-xs text-slate-400">Department Event Control Center</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <Link
            to="/live-monitor"
            className="py-2 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-semibold text-xs flex items-center space-x-2"
          >
            <Radio className="w-4 h-4 animate-ping" />
            <span>Venue Stream Ticker</span>
          </Link>

          <button
            onClick={handleDeleteEvent}
            className="py-2 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs flex items-center space-x-1.5 transition-colors"
            title="Delete Event"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Event</span>
          </button>
        </div>
      </div>

      {/* Main Details Panel & Control Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Event Meta Details Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {event?.type}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              event?.status === 'ATTENDANCE_ACTIVE' || event?.status === 'LIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {event?.status}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-white">{event?.name}</h2>
            <p className="text-xs text-slate-400 mt-1">{event?.description || 'Organized by CSI-CATT Committee'}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs border-t border-slate-800">
            <div>
              <span className="text-slate-400 font-medium">Department</span>
              <p className="font-semibold text-slate-200 mt-0.5">{event?.department}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Venue</span>
              <p className="font-semibold text-slate-200 mt-0.5">{event?.venue}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Date & Time</span>
              <p className="font-semibold text-slate-200 mt-0.5">{event?.date} ({event?.start_time})</p>
            </div>
          </div>
        </div>

        {/* Live Attendance Counter & Quick Trigger Box */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Live Attendance</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-5xl font-black text-white font-mono">{records.length}</div>
            <p className="text-xs text-slate-400">Verified students logged at venue</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleStartAttendance}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-csi-cyan hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-glow-blue transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>{activeSession ? 'View Dynamic QR Presenter' : 'Start Attendance Session (QR)'}</span>
            </button>

            {event?.status !== 'CLOSED' && (
              <button
                onClick={handleCloseAttendance}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs flex items-center justify-center space-x-2 border border-amber-500/20 transition-colors"
              >
                <StopCircle className="w-4 h-4" />
                <span>Close Attendance Session</span>
              </button>
            )}

            <button
              onClick={() => setShowManualModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Manual Entry Override</span>
            </button>
          </div>
        </div>

      </div>

      {/* Attendance Table */}
      <AttendanceTable
        records={records}
        eventId={parseInt(eventId, 10)}
        onRefresh={loadEventData}
        onOpenManualModal={() => setShowManualModal(true)}
      />

      {/* QRCode Modal */}
      {showQRModal && activeSession && (
        <QRCodeModal
          session={activeSession}
          event={event}
          onClose={() => setShowQRModal(false)}
          onRefreshSession={loadEventData}
        />
      )}

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <ManualAttendanceModal
          eventId={parseInt(eventId, 10)}
          onClose={() => setShowManualModal(false)}
          onSuccess={loadEventData}
        />
      )}

    </div>
  );
}
