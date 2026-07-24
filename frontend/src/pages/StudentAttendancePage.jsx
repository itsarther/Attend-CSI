import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  AlertOctagon, 
  Radio, 
  Lock, 
  Send, 
  RefreshCw,
  Sparkles,
  Building
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function StudentAttendancePage() {
  const { sessionId } = useParams();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const [venueToken, setVenueToken] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  const [verificationError, setVerificationError] = useState(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      department: 'Computer Engineering',
      year: 'SE',
      semester: 4,
      class_name: 'Computer Engineering - SE',
      division: 'A'
    }
  });

  // Simple Device Fingerprint Generator
  const generateFingerprint = () => {
    try {
      const nav = window.navigator;
      const str = `${nav.userAgent}-${nav.language}-${window.screen.width}x${window.screen.height}`;
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return `fp_${Math.abs(hash)}`;
    } catch (e) {
      return 'fp_unknown';
    }
  };

  // Fetch Public Session Info & Venue Rotating Token
  const loadSession = async () => {
    try {
      setLoadingSession(true);
      setSessionError(null);
      const res = await api.get(`/sessions/public/session/${sessionId}`);
      if (!res.data.is_active) {
        setSessionError(res.data.message || 'Attendance session is not active');
      } else {
        setSessionInfo(res.data);
        // Pre-fill active venue token fetched via session
        setVenueToken(res.data.current_token);
      }
    } catch (err) {
      setSessionError(err.response?.data?.detail || 'Invalid QR Code or Attendance Session expired');
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    loadSession();

    // Refresh active token every 5s
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/sessions/public/session/${sessionId}`);
        if (res.data.is_active) {
          setSessionInfo(res.data);
          setVenueToken(res.data.current_token);
        }
      } catch (e) {
        // silent
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const onSubmit = async (formData) => {
    setVerificationError(null);
    try {
      const payload = {
        session_uuid: sessionId,
        student_name: formData.student_name,
        gr_number: formData.gr_number,
        roll_number: formData.roll_number,
        department: formData.department,
        year: formData.year,
        semester: parseInt(formData.semester, 10),
        class_name: formData.class_name,
        division: formData.division,
        mobile: formData.mobile || null,
        presence_token: venueToken || formData.presence_token,
        device_fingerprint: generateFingerprint()
      };

      const res = await api.post('/attendance/public/submit', payload);
      setSubmittedData(res.data);
      toast.success('Attendance submitted successfully!');
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to submit attendance';
      setVerificationError(errMsg);
      toast.error(errMsg);
    }
  };

  // Loading Screen
  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400 font-medium">Validating event venue session...</p>
        </div>
      </div>
    );
  }

  // Session Error / Inactive Screen
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-rose-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <AlertOctagon className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Attendance Not Active</h2>
            <p className="text-xs text-rose-300 mt-2 font-medium">{sessionError}</p>
          </div>
          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Please ask a CSI-CATT committee member at the venue to start or resume the attendance session.
          </p>
        </div>
      </div>
    );
  }

  // Submission Success Screen
  if (submittedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-emerald-500/30 text-center space-y-5 shadow-glow-blue animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
              PHYSICAL PRESENCE VERIFIED
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1">Attendance Recorded!</h2>
            <p className="text-xs text-slate-300 mt-1">
              Thank you, <strong className="text-white">{submittedData.student_name}</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left text-xs space-y-2 font-medium">
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">Event</span>
              <span className="text-slate-200 font-semibold">{submittedData.event_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">GR Number</span>
              <span className="text-brand-300 font-mono font-bold">{submittedData.gr_number}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">Department / Year</span>
              <span className="text-slate-200">{submittedData.department} ({submittedData.year})</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-slate-400">Submission Method</span>
              <span className="text-emerald-400 font-bold">Dynamic QR Scan</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Recorded at {new Date(submittedData.submission_time).toLocaleTimeString()} • CSI-CATT Security Verified
          </p>
        </div>
      </div>
    );
  }

  // Attendance Form
  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 flex items-center justify-center relative">
      
      <div className="w-full max-w-xl glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        
        {/* Event Header Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-900/40 via-slate-900 to-csi-dark border border-brand-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300">
              {sessionInfo?.event_type || 'Department Event'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Venue Live
            </span>
          </div>

          <h1 className="text-xl font-extrabold text-white">{sessionInfo?.event_name}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <span className="flex items-center space-x-1 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-brand-400" />
              <span>{sessionInfo?.venue}</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-400">
              <Building className="w-3.5 h-3.5 text-brand-400" />
              <span>{sessionInfo?.department}</span>
            </span>
          </div>
        </div>

        {/* Location / Token Error Banner if failed */}
        {verificationError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1 animate-fadeIn">
            <p className="font-bold flex items-center gap-1.5 text-rose-400">
              <AlertOctagon className="w-4 h-4" />
              <span>Venue Verification Warning</span>
            </p>
            <p className="leading-relaxed">{verificationError}</p>
          </div>
        )}

        {/* Student Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name (As per College ID) *</label>
            <input
              type="text"
              placeholder="e.g. Aarav Sharma"
              {...register('student_name', { required: 'Full name is required' })}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            {errors.student_name && <p className="text-rose-400 text-[11px] mt-1">{errors.student_name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">GR Number *</label>
              <input
                type="text"
                placeholder="e.g. 2023COMP001"
                {...register('gr_number', { required: 'GR number is required' })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 uppercase font-mono"
              />
              {errors.gr_number && <p className="text-rose-400 text-[11px] mt-1">{errors.gr_number.message}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Roll Number *</label>
              <input
                type="text"
                placeholder="e.g. 15"
                {...register('roll_number', { required: 'Roll number is required' })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 uppercase font-mono"
              />
              {errors.roll_number && <p className="text-rose-400 text-[11px] mt-1">{errors.roll_number.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Department *</label>
              <select
                {...register('department')}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="AI & Data Science">AI & Data Science</option>
                <option value="EXTC">EXTC Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Year *</label>
              <select
                {...register('year')}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="FE">First Year (FE)</option>
                <option value="SE">Second Year (SE)</option>
                <option value="TE">Third Year (TE)</option>
                <option value="BE">Final Year (BE)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Semester *</label>
              <input
                type="number"
                min="1"
                max="8"
                {...register('semester', { valueAsNumber: true })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Class *</label>
              <input
                type="text"
                placeholder="SE-Comp"
                {...register('class_name')}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Division *</label>
              <input
                type="text"
                placeholder="A"
                {...register('division')}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Mobile Number (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 9876543210"
              {...register('mobile')}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          {/* Venue Presence Token Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-300">Venue Presence Token *</label>
              <span className="text-[10px] text-brand-400 font-medium">Rotates every 20s on screen</span>
            </div>
            <input
              type="text"
              placeholder="e.g. X9B4K2"
              value={venueToken}
              onChange={(e) => setVenueToken(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border border-brand-500/40 rounded-xl px-3.5 py-2.5 text-xs text-brand-300 font-mono font-bold tracking-widest placeholder-slate-600 focus:outline-none focus:border-brand-400 uppercase"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-csi-cyan hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-glow-blue transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Verifying & Submitting...' : 'Submit Attendance'}</span>
          </button>

        </form>

        <p className="text-[10px] text-center text-slate-400">
          Protected by CSI-CATT Venue Physical Presence Verification System
        </p>

      </div>
    </div>
  );
}
