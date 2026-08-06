'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { AllocateTestModal } from '@/components/admin/AllocateTestModal';
import { GRE_API_URL } from '@/lib/config';
import {
  Search, RefreshCw, Eye, RotateCcw, Ban, Plus, X, Check,
  FileText, Clock, BookOpen, ShieldCheck, AlertTriangle, ChevronLeft, ChevronRight,
} from 'lucide-react';

interface Allocation {
  id: string;
  student_id: string;
  student_email?: string;
  student_name?: string;
  test_type: string;
  test_title?: string;
  subject?: string;
  category?: string;
  level?: string;
  status: string;
  scheduled_at?: string;
  expires_at?: string;
  duration_minutes?: number;
  question_count?: number;
  score_percent?: number | null;
  allocated_by?: string;
  created_at: string;
}

interface Response {
  id: string;
  question_id: string;
  student_answer?: string | null;
  is_correct?: boolean | null;
  time_spent_seconds?: number;
  question_text?: string;
  correct_answer?: string;
  explanation?: string;
  subject?: string;
  category?: string;
  level?: string;
}

interface Violation {
  id: string;
  violation_type: string;
  details?: string;
  logged_at: string;
}

function formatDate12H(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
}

const ITEMS_PER_PAGE = 20;

const STATUS_TABS = [
  { key: '', label: 'Total' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminAllocationsPage() {
  const { token, isAdmin } = useAuth();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [allocatedByFilter, setAllocatedByFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Inspect modal
  const [inspectAlloc, setInspectAlloc] = useState<any>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectData, setInspectData] = useState<{ responses: Response[]; violations: Violation[] } | null>(null);

  // Reschedule modal
  const [rescheduleAlloc, setRescheduleAlloc] = useState<Allocation | null>(null);
  const [rescheduleStartISO, setRescheduleStartISO] = useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  // Revoke modal
  const [revokeAlloc, setRevokeAlloc] = useState<Allocation | null>(null);
  const [revokeSubmitting, setRevokeSubmitting] = useState(false);
  const [revokeError, setRevokeError] = useState('');

  // Direct allocate modal
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);

  useEffect(() => {
    if (token && isAdmin()) {
      fetchAllocations();
    }
  }, [token, isAdmin, statusFilter]);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '500');
      const res = await fetch(`${GRE_API_URL}/api/admin/allocations${params.toString() ? `?${params}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllocations(data.data?.allocations || data.allocations || []);
      }
    } catch (err) {
      console.error('Failed to fetch allocations', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAllocations = useMemo(() => {
    return allocations.filter(a => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (a.student_email || '').toLowerCase().includes(q) ||
        (a.student_name || '').toLowerCase().includes(q) ||
        (a.test_title || '').toLowerCase().includes(q) ||
        (a.test_type || '').toLowerCase().includes(q) ||
        (a.allocated_by || '').toLowerCase().includes(q) ||
        (a.status || '').toLowerCase().includes(q) ||
        (a.id || '').toLowerCase().includes(q) ||
        formatDate12H(a.created_at).toLowerCase().includes(q) ||
        (a.score_percent != null && String(a.score_percent).includes(q));

      const matchType = !typeFilter || a.test_type === typeFilter;
      const matchAllocatedBy = !allocatedByFilter || (a.allocated_by || '').includes(allocatedByFilter);
      return matchSearch && matchType && matchAllocatedBy;
    });
  }, [allocations, search, typeFilter, allocatedByFilter]);

  // Status tab counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { '': allocations.length };
    STATUS_TABS.forEach(tab => {
      if (tab.key) counts[tab.key] = allocations.filter(a => a.status?.toUpperCase() === tab.key).length;
    });
    return counts;
  }, [allocations]);

  // Pagination
  const totalPages = Math.ceil(filteredAllocations.length / ITEMS_PER_PAGE);
  const paginatedAllocations = filteredAllocations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, typeFilter, allocatedByFilter]);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ASSIGNED': return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-[10px] font-bold whitespace-nowrap">📋 Assigned</span>;
      case 'IN_PROGRESS': return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-bold whitespace-nowrap">⏳ In Progress</span>;
      case 'COMPLETED': case 'SUBMITTED': return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold whitespace-nowrap">✅ Completed</span>;
      case 'EXPIRED': return <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded-full text-[10px] font-bold whitespace-nowrap">⌛ Expired</span>;
      case 'CANCELLED': return <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-full text-[10px] font-bold whitespace-nowrap">🚫 Cancelled</span>;
      default: return <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-full text-[10px] font-bold whitespace-nowrap">{status}</span>;
    }
  };

  const handleInspect = async (alloc: Allocation) => {
    setInspectAlloc(alloc);
    setInspectLoading(true);
    setInspectData(null);
    try {
      const res = await fetch(`${GRE_API_URL}/api/admin/allocations/${alloc.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInspectData({
          responses: data.data?.responses || [],
          violations: data.data?.violations || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch allocation detail', err);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleOpenReschedule = (alloc: Allocation) => {
    setRescheduleAlloc(alloc);
    setRescheduleError('');
    if (alloc.scheduled_at) {
      const d = new Date(alloc.scheduled_at);
      setRescheduleStartISO(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    } else {
      const now = new Date();
      setRescheduleStartISO(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleAlloc) return;
    setRescheduleSubmitting(true);
    setRescheduleError('');
    try {
      const iso = new Date(rescheduleStartISO).toISOString();
      const res = await fetch(`${GRE_API_URL}/api/admin/allocations/${rescheduleAlloc.id}/reschedule`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: iso }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || errData.error || 'Failed to reschedule');
      }
      fetchAllocations();
      setRescheduleAlloc(null);
    } catch (err: any) {
      setRescheduleError(err.message);
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeAlloc) return;
    setRevokeSubmitting(true);
    setRevokeError('');
    try {
      const res = await fetch(`${GRE_API_URL}/api/admin/allocations/${revokeAlloc.id}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellation_reason: 'Revoked by admin' }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || errData.error || 'Failed to revoke');
      }
      fetchAllocations();
      setRevokeAlloc(null);
    } catch (err: any) {
      setRevokeError(err.message);
    } finally {
      setRevokeSubmitting(false);
    }
  };

  const canReschedule = (status: string) => !['COMPLETED', 'SUBMITTED', 'IN_PROGRESS', 'CANCELLED', 'EXPIRED'].includes(status?.toUpperCase());
  const canRevoke = (status: string) => !['COMPLETED', 'SUBMITTED', 'IN_PROGRESS', 'CANCELLED'].includes(status?.toUpperCase());

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 font-sans text-slate-800">

        {/* Header Bar */}
        <div className="bg-[#162432] text-white rounded-xl p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border-b-4 border-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-inner shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Test Allocations & Anti-Cheat Audit</h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                View, inspect, reschedule, or revoke allocated tests with full scorecard and proctoring audit.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAllocations}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={() => setAllocateModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Direct Allocate Test
            </button>
          </div>
        </div>

        {/* Status Tab Counters */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusFilter === tab.key ? 'bg-white/20' : 'bg-slate-200'}`}>
                {statusCounts[tab.key] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Sub-filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student, test title, type, allocated by, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-500"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-2 text-slate-400 font-bold">✕</button>}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold">
              <option value="">All Test Types</option>
              <option value="FULL_LENGTH">Full-Length</option>
              <option value="SECTIONAL">Sectional</option>
              <option value="TOPIC_WISE">Topic-Wise</option>
            </select>

            <select value={allocatedByFilter} onChange={e => setAllocatedByFilter(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold">
              <option value="">All Allocated By</option>
              <option value="ADMIN_AUTO">Admin Auto</option>
              <option value="ADMIN_DIRECT">Admin Direct</option>
              <option value="ADMIN_MANUAL">Admin Manual</option>
              <option value="STUDENT">Student</option>
            </select>

            {(search || typeFilter || allocatedByFilter) && (
              <button onClick={() => { setSearch(''); setTypeFilter(''); setAllocatedByFilter(''); }} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Allocations Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
              <thead className="bg-[#162432] text-white font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3 whitespace-nowrap">S.No</th>
                  <th className="p-3 whitespace-nowrap">Student</th>
                  <th className="p-3 whitespace-nowrap">Test Title</th>
                  <th className="p-3 whitespace-nowrap">Allocated By</th>
                  <th className="p-3 whitespace-nowrap">Status</th>
                  <th className="p-3 whitespace-nowrap">Score %</th>
                  <th className="p-3 whitespace-nowrap">Scheduled</th>
                  <th className="p-3 text-center whitespace-nowrap">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-bold">Loading allocations...</td></tr>
                ) : paginatedAllocations.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500 font-bold">No allocations found matching your filter criteria.</td></tr>
                ) : (
                  paginatedAllocations.map((alloc, idx) => (
                    <tr key={alloc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-500 font-bold">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                      <td className="p-3 whitespace-nowrap">
                        <p className="font-bold text-slate-900">{alloc.student_name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-500">{alloc.student_email}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-800">{alloc.test_title || alloc.test_type}</p>
                        <p className="text-[10px] text-slate-500">{alloc.test_type} {alloc.question_count ? `• ${alloc.question_count} Qs` : ''} {alloc.duration_minutes ? `• ${alloc.duration_minutes} min` : ''}</p>
                      </td>
                      <td className="p-3 text-slate-600 font-semibold whitespace-nowrap text-[11px]">{alloc.allocated_by || '-'}</td>
                      <td className="p-3 whitespace-nowrap">{getStatusBadge(alloc.status)}</td>
                      <td className="p-3 whitespace-nowrap">
                        {alloc.score_percent != null ? (
                          <span className={`font-black ${alloc.score_percent >= 70 ? 'text-emerald-600' : alloc.score_percent >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {alloc.score_percent}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[10px] whitespace-nowrap">{formatDate12H(alloc.scheduled_at || alloc.created_at)}</td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleInspect(alloc)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Inspect / Scorecard"
                          >
                            <Eye className="w-3 h-3" /> Inspect
                          </button>
                          {canReschedule(alloc.status) && (
                            <button
                              onClick={() => handleOpenReschedule(alloc)}
                              className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Reschedule"
                            >
                              <RotateCcw className="w-3 h-3" /> Reschedule
                            </button>
                          )}
                          {canRevoke(alloc.status) && (
                            <button
                              onClick={() => { setRevokeAlloc(alloc); setRevokeError(''); }}
                              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Revoke / Cancel"
                            >
                              <Ban className="w-3 h-3" /> Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold">
                Page {currentPage} of {totalPages} ({filteredAllocations.length} allocations)
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, currentPage - 2);
                  const page = start + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg font-bold ${currentPage === page ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Inspect / Scorecard Modal */}
        {inspectAlloc && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="font-bold text-sm">Allocation Scorecard Audit</h3>
                    <p className="text-[11px] text-slate-400">{inspectAlloc.test_title} — {inspectAlloc.student_name || inspectAlloc.student_email}</p>
                  </div>
                </div>
                <button onClick={() => { setInspectAlloc(null); setInspectData(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
                {inspectLoading ? (
                  <div className="text-center py-8 text-slate-400 font-bold">Loading allocation details...</div>
                ) : (
                  <>
                    {/* ETS Score Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                        <span className="text-slate-500 font-bold text-[10px] uppercase block">Score %</span>
                        <span className="text-xl font-black text-slate-900 block">{inspectAlloc.score_percent != null ? `${inspectAlloc.score_percent}%` : '—'}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                        <span className="text-slate-500 font-bold text-[10px] uppercase block">Questions</span>
                        <span className="text-xl font-black text-slate-900 block">{inspectAlloc.question_count || '—'}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                        <span className="text-slate-500 font-bold text-[10px] uppercase block">Duration</span>
                        <span className="text-xl font-black text-slate-900 block">{inspectAlloc.duration_minutes || '—'} min</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                        <span className="text-slate-500 font-bold text-[10px] uppercase block">Status</span>
                        <span className="text-xl font-black text-slate-900 block">{inspectAlloc.status}</span>
                      </div>
                    </div>

                    {/* Proctoring Security Violations */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Proctoring Security Violations
                      </div>
                      <div className="p-4">
                        {inspectData?.violations && inspectData.violations.length > 0 ? (
                          <div className="space-y-2">
                            {inspectData.violations.map(v => (
                              <div key={v.id} className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold text-amber-900">{v.violation_type}</p>
                                  {v.details && <p className="text-amber-700 text-[11px]">{v.details}</p>}
                                  <p className="text-amber-500 text-[10px] font-mono mt-0.5">{formatDate12H(v.logged_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-emerald-700 font-bold flex items-center gap-1.5">
                            <Check className="w-4 h-4" /> Clean attempt! No proctoring violations detected.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Question Responses */}
                    {inspectData?.responses && inspectData.responses.length > 0 && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-blue-600" /> Question Responses ({inspectData.responses.length})
                        </div>
                        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                          {inspectData.responses.map((r, i) => (
                            <div key={r.id || i} className={`p-3 rounded-lg border ${r.is_correct ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.is_correct ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                                  {r.is_correct ? '✓ Correct' : '✗ Incorrect'}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">Q{i + 1} • {r.question_id?.slice(0, 8)}</span>
                                {r.time_spent_seconds != null && (
                                  <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" /> {r.time_spent_seconds}s
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-800 font-semibold mb-1.5">{r.question_text?.slice(0, 120)}...</p>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <span className="text-slate-500 font-bold block">Student Answer:</span>
                                  <span className={`font-bold ${r.is_correct ? 'text-emerald-700' : 'text-red-700'}`}>{r.student_answer || 'Skipped / Unanswered'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold block">Correct Answer:</span>
                                  <span className="font-bold text-emerald-800">{r.correct_answer || 'N/A'}</span>
                                </div>
                              </div>
                              {r.explanation && (
                                <div className="pt-2 text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-200 mt-1.5">
                                  <strong className="text-slate-800 block mb-0.5">Solution:</strong>
                                  {r.explanation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {rescheduleAlloc && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-sm text-slate-900">Reschedule / Re-allocate Test</h3>
                </div>
                <button onClick={() => setRescheduleAlloc(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {rescheduleError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-bold">{rescheduleError}</div>
              )}

              <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed font-medium">
                  Rescheduling <strong className="text-slate-900">{rescheduleAlloc.test_title}</strong> for student <strong className="text-slate-900">{rescheduleAlloc.student_name}</strong>.
                </p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Scheduled Start Time</label>
                  <input
                    type="datetime-local"
                    value={rescheduleStartISO}
                    onChange={e => setRescheduleStartISO(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 bg-slate-50 focus:outline-none focus:border-purple-600"
                    required
                  />
                  {rescheduleStartISO && (
                    <span className="text-[10px] text-purple-700 font-bold block mt-1">
                      New Start: {formatDate12H(rescheduleStartISO)}
                    </span>
                  )}
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-[11px] text-purple-900 font-semibold">
                  End Time will automatically recalculate ({rescheduleAlloc.test_type === 'FULL_LENGTH' ? '+118 Mins' : rescheduleAlloc.test_type === 'SECTIONAL' ? '+35 Mins' : '+20 Mins'}) and status will set back to ASSIGNED.
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setRescheduleAlloc(null)} className="w-1/2 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
                  <button type="submit" disabled={rescheduleSubmitting} className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" /> {rescheduleSubmitting ? 'Updating...' : 'Confirm Reschedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Revoke Modal */}
        {revokeAlloc && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-sm text-slate-900">Revoke / Cancel Test Allocation</h3>
                </div>
                <button onClick={() => setRevokeAlloc(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {revokeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-bold">{revokeError}</div>
              )}

              <p className="text-slate-600 text-xs font-medium">
                You are about to revoke <strong className="text-slate-900">{revokeAlloc.test_title}</strong> for <strong className="text-slate-900">{revokeAlloc.student_name}</strong>.
                This will cancel the allocation, free the time slot, and delete the student's question history for this test.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={() => setRevokeAlloc(null)} className="w-1/2 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button onClick={handleConfirmRevoke} disabled={revokeSubmitting} className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <Ban className="w-4 h-4" /> {revokeSubmitting ? 'Revoking...' : 'Confirm Revoke'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Direct Allocate Modal */}
        {token && (
          <AllocateTestModal
            token={token}
            isOpen={allocateModalOpen}
            onClose={() => setAllocateModalOpen(false)}
            onSuccess={() => { fetchAllocations(); setAllocateModalOpen(false); }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
