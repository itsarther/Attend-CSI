import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Maximize2, 
  PauseCircle, 
  StopCircle, 
  PlayCircle,
  Laptop
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function QRCodeModal({ session, event, onClose, onRefreshSession }) {
  const [copied, setCopied] = useState(false);
  const [currentToken, setCurrentToken] = useState(session?.current_token || '------');
  const [secondsRemaining, setSecondsRemaining] = useState(session?.remaining_seconds || 20);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const qrUrl = session?.qr_url || `${window.location.origin}/attendance/session/${session?.session_uuid}`;

  // Poll for live session & rotating token update every second
  useEffect(() => {
    if (!session?.session_uuid) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/sessions/public/session/${session.session_uuid}`);
        if (res.data.is_active) {
          setCurrentToken(res.data.current_token);
          setSecondsRemaining(res.data.remaining_seconds);
        }
      } catch (err) {
        console.error("Failed to sync session token:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.session_uuid]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    toast.success('Attendance link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePause = async () => {
    try {
      await api.post(`/sessions/pause/${session.id}`);
      toast.success('Attendance session paused');
      if (onRefreshSession) onRefreshSession();
    } catch (err) {
      toast.error('Failed to pause session');
    }
  };

  const handleResume = async () => {
    try {
      await api.post(`/sessions/resume/${session.id}`);
      toast.success('Attendance session resumed');
      if (onRefreshSession) onRefreshSession();
    } catch (err) {
      toast.error('Failed to resume session');
    }
  };

  const handleStop = async () => {
    if (window.confirm('Are you sure you want to stop and close attendance for this event?')) {
      try {
        if (event?.id) {
          await api.post(`/sessions/stop-by-event/${event.id}`);
        } else if (session?.id) {
          await api.post(`/sessions/stop/${session.id}`);
        }
        toast.success('Attendance session closed');
        if (onRefreshSession) onRefreshSession();
        onClose();
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to close session');
      }
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all ${isFullscreen ? 'p-0' : ''}`}>
      
      <div className={`glass-panel border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl transition-all ${isFullscreen ? 'h-screen max-w-none rounded-none flex flex-col justify-between p-8' : 'p-6'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{event?.name || 'Live Attendance QR'}</h3>
              <p className="text-xs text-slate-400">Venue: {event?.venue} &nbsp;•&nbsp; {event?.department}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Toggle Venue Fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-center gap-8">
          
          {/* QR Code Container */}
          <div className="flex flex-col items-center">
            <div className="p-5 bg-white rounded-3xl shadow-glow-blue border-4 border-brand-500/40 relative group">
              <QRCodeSVG
                value={qrUrl}
                size={isFullscreen ? 320 : 220}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-xs text-slate-400 mt-3 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Scan with Smartphone Camera
            </p>
          </div>

          {/* Token & Presence Info Panel */}
          <div className="flex-1 space-y-5 w-full max-w-sm">
            
            {/* Live Presence Token Display */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-brand-500/30 text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">
                Venue Presence Token
              </span>
              <div className="text-4xl font-black font-mono tracking-widest text-white bg-gradient-to-r from-brand-300 via-csi-glow to-brand-400 bg-clip-text text-transparent">
                {currentToken}
              </div>

              {/* Rotation Timer Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-brand-500 to-csi-cyan h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(secondsRemaining / 20) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Rotating Security Token</span>
                  <span>Auto-refreshes in {secondsRemaining}s</span>
                </div>
              </div>
            </div>

            {/* Companion Service Indicator */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center space-x-3 text-xs text-slate-300">
              <Laptop className="w-5 h-5 text-brand-400 shrink-0" />
              <div>
                <p className="font-semibold text-slate-200">Local Venue Companion Active</p>
                <p className="text-[11px] text-slate-400">Prevents QR sharing outside venue</p>
              </div>
            </div>

            {/* Copyable Session URL */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={qrUrl}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {session?.status === 'ACTIVE' ? (
              <button
                onClick={handlePause}
                className="py-2 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-medium text-xs flex items-center space-x-1.5"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Pause Session</span>
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="py-2 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-medium text-xs flex items-center space-x-1.5"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Resume Session</span>
              </button>
            )}

            <button
              onClick={handleStop}
              className="py-2 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium text-xs flex items-center space-x-1.5"
            >
              <StopCircle className="w-4 h-4" />
              <span>Close Attendance</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
