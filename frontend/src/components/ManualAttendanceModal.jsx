import React from 'react';
import { useForm } from 'react-hook-form';
import { X, UserPlus, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ManualAttendanceModal({ eventId, onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      event_id: eventId,
      department: 'Computer Engineering',
      year: 'SE',
      semester: 4,
      class_name: 'Computer Engineering - SE',
      division: 'A'
    }
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        event_id: parseInt(eventId, 10),
        semester: parseInt(data.semester, 10)
      };
      await api.post('/attendance/manual', payload);
      toast.success(`Manual attendance recorded for ${data.student_name}`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to record manual attendance');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Manual Attendance Override</h3>
              <p className="text-xs text-slate-400">Register student directly as committee admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Manual entries bypass venue physical presence verification and are logged in the audit trail.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="py-4 space-y-3.5 text-xs">
          
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Student Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Aarav Sharma"
              {...register('student_name', { required: 'Name is required' })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            {errors.student_name && <p className="text-rose-400 text-[11px] mt-1">{errors.student_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">GR Number *</label>
              <input
                type="text"
                placeholder="2023COMP001"
                {...register('gr_number', { required: 'GR number is required' })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              {errors.gr_number && <p className="text-rose-400 text-[11px] mt-1">{errors.gr_number.message}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Roll Number *</label>
              <input
                type="text"
                placeholder="15"
                {...register('roll_number', { required: 'Roll number is required' })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              {errors.roll_number && <p className="text-rose-400 text-[11px] mt-1">{errors.roll_number.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Department</label>
              <select
                {...register('department')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="AI & Data Science">AI & Data Science</option>
                <option value="EXTC">EXTC</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Year</label>
              <select
                {...register('year')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="FE">FE (First Year)</option>
                <option value="SE">SE (Second Year)</option>
                <option value="TE">TE (Third Year)</option>
                <option value="BE">BE (Final Year)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Semester</label>
              <input
                type="number"
                min="1"
                max="8"
                {...register('semester', { valueAsNumber: true })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Class</label>
              <input
                type="text"
                placeholder="SE-Comp"
                {...register('class_name')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Division</label>
              <input
                type="text"
                placeholder="A"
                {...register('division')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Submit Manual Entry'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
