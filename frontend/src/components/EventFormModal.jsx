import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, MapPin, Clock, Users, Building, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function EventFormModal({ event, onClose, onSuccess }) {
  const isEditing = !!event;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: event ? {
      name: event.name,
      type: event.type,
      organized_by: event.organized_by || 'CSI-CATT',
      academic_year: event.academic_year || '2025-2026',
      department: event.department || 'Computer Engineering',
      allowed_semesters: event.allowed_semesters || '1,2,3,4,5,6,7,8',
      venue: event.venue || 'Auditorium',
      date: event.date || new Date().toISOString().split('T')[0],
      start_time: event.start_time || '10:00 AM',
      end_time: event.end_time || '04:00 PM',
      attendance_duration: event.attendance_duration || 15,
      max_capacity: event.max_capacity || 100,
      description: event.description || ''
    } : {
      type: 'Workshop',
      organized_by: 'CSI-CATT',
      academic_year: '2025-2026',
      department: 'Computer Engineering',
      allowed_semesters: '1,2,3,4,5,6,7,8',
      venue: 'Auditorium',
      date: new Date().toISOString().split('T')[0],
      start_time: '10:00 AM',
      end_time: '04:00 PM',
      attendance_duration: 15,
      max_capacity: 100,
      description: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await api.put(`/events/${event.id}`, data);
        toast.success('Event updated successfully!');
      } else {
        await api.post('/events', data);
        toast.success('Event created successfully!');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save event');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {isEditing ? 'Edit Event Details' : 'Create Department Event'}
              </h3>
              <p className="text-xs text-slate-400">CSI-CATT Committee Event Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="py-5 space-y-4 text-xs">
          
          {/* Event Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Event Name *</label>
            <input
              type="text"
              placeholder="e.g. Next.js & Full-Stack Development Workshop"
              {...register('name', { required: 'Event name is required' })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            {errors.name && <p className="text-rose-400 text-[11px] mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Event Type */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Event Category *</label>
              <select
                {...register('type')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Guest Lecture">Guest Lecture</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Competition">Competition</option>
                <option value="Technical Event">Technical Event</option>
                <option value="Cultural Event">Cultural Event</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Department *</label>
              <select
                {...register('department')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="AI & Data Science">AI & Data Science</option>
                <option value="EXTC">EXTC Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="All Departments">All Departments</option>
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Date */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                {...register('date', { required: 'Date is required' })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Start Time</label>
              <input
                type="text"
                placeholder="10:00 AM"
                {...register('start_time')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">End Time</label>
              <input
                type="text"
                placeholder="04:00 PM"
                {...register('end_time')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Venue */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Venue *</label>
              <input
                type="text"
                placeholder="Auditorium / Lab 4"
                {...register('venue', { required: 'Venue is required' })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Attendance Duration */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Attendance Duration (Mins)</label>
              <input
                type="number"
                min="1"
                max="180"
                {...register('attendance_duration', { valueAsNumber: true })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Max Capacity */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Max Capacity</label>
              <input
                type="number"
                min="10"
                {...register('max_capacity', { valueAsNumber: true })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Event Description</label>
            <textarea
              rows="3"
              placeholder="Provide event schedule, topics covered, or instructions for students..."
              {...register('description')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
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
              className="py-2 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold shadow-glow-blue disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
