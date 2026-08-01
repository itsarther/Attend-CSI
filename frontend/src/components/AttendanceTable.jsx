import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  FileText, 
  File
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function AttendanceTable({ records = [], eventId, onRefresh, onOpenManualModal }) {
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Filtered records logic
  const filtered = records.filter((r) => {
    const s = search.toLowerCase();
    const matchesSearch =
      r.student_name.toLowerCase().includes(s) ||
      r.gr_number.toLowerCase().includes(s) ||
      r.roll_number.toLowerCase().includes(s);

    const matchesDept = !departmentFilter || r.department === departmentFilter;
    const matchesYear = !yearFilter || r.year === yearFilter;
    const matchesMethod = !methodFilter || r.submission_method === methodFilter;
    const matchesStatus = !statusFilter || r.verification_status === statusFilter;

    return matchesSearch && matchesDept && matchesYear && matchesMethod && matchesStatus;
  });

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete attendance record for ${name}?`)) {
      try {
        await api.delete(`/attendance/${id}`);
        toast.success('Attendance record deleted');
        if (onRefresh) onRefresh();
      } catch (err) {
        toast.error('Failed to delete attendance record');
      }
    }
  };

  const handleExport = async (format) => {
    if (!eventId) return;
    const toastId = toast.loading(`Generating ${format.toUpperCase()} attendance roster...`);
    try {
      const response = await api.get(`/attendance/export/${eventId}?format=${format}`, {
        responseType: 'blob'
      });

      const mimeTypes = {
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        csv: 'text/csv',
        pdf: 'application/pdf'
      };

      const extensions = {
        excel: 'xlsx',
        csv: 'csv',
        pdf: 'pdf'
      };

      const blob = new Blob([response.data], { type: mimeTypes[format] || 'application/octet-stream' });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `attendance_event_${eventId}.${extensions[format] || format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`Downloaded ${format.toUpperCase()} attendance roster!`, { id: toastId });
    } catch (err) {
      console.error("Export error:", err);
      const errMsg = err.response?.data?.detail || 'Failed to export attendance file';
      toast.error(errMsg, { id: toastId });
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4 border border-slate-800">
        
        {/* Search Bar */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Name, GR, or Roll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Departments</option>
            <option value="Computer Engineering">Computer Engineering</option>
            <option value="Information Technology">Information Technology</option>
            <option value="AI & Data Science">AI & Data Science</option>
            <option value="EXTC">EXTC</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Years</option>
            <option value="FE">First Year (FE)</option>
            <option value="SE">Second Year (SE)</option>
            <option value="TE">Third Year (TE)</option>
            <option value="BE">Final Year (BE)</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Methods</option>
            <option value="QR_DYNAMIC">Dynamic QR</option>
            <option value="MANUAL_ADMIN">Manual Override</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {onOpenManualModal && (
            <button
              onClick={onOpenManualModal}
              className="py-2 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-all shadow-glow-blue"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Manual</span>
            </button>
          )}

          {/* Export Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => handleExport('excel')}
              className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center space-x-1 transition-colors"
              title="Export to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs flex items-center space-x-1 transition-colors"
              title="Export to CSV"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs flex items-center space-x-1 transition-colors"
              title="Export to PDF"
            >
              <File className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

      </div>

      {/* Attendance Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Sr No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">GR Number</th>
                <th className="py-3 px-4">Roll</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Year / Sem</th>
                <th className="py-3 px-4">Class / Div</th>
                <th className="py-3 px-4">Submission Time</th>
                <th className="py-3 px-4">Method & Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400 font-medium">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{r.student_name}</td>
                    <td className="py-3.5 px-4 font-mono text-brand-300">{r.gr_number}</td>
                    <td className="py-3.5 px-4 font-mono">{r.roll_number}</td>
                    <td className="py-3.5 px-4">{r.department}</td>
                    <td className="py-3.5 px-4">{r.year} (Sem {r.semester})</td>
                    <td className="py-3.5 px-4">{r.class_name} - {r.division}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {r.submission_time ? new Date(r.submission_time).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${
                          r.submission_method === 'QR_DYNAMIC'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {r.submission_method === 'QR_DYNAMIC' ? 'Dynamic QR' : 'Manual Override'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id, r.student_name)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                        title="Delete Attendance Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Showing {filtered.length} of {records.length} Total Registered Students</span>
          <span>Verified by CSI-CATT Venue Security</span>
        </div>
      </div>

    </div>
  );
}
