'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { AllocateTestModal } from '@/components/admin/AllocateTestModal';
import { RejectTicketModal } from '@/components/admin/RejectTicketModal';
import { GRE_API_URL } from '@/lib/config';
import { Search, Check, X, Clock, FileText, RefreshCw, Filter } from 'lucide-react';

interface Ticket {
  id: string;
  student_id: string;
  student_email?: string;
  student_name?: string;
  test_type: string;
  subject?: string;
  category?: string;
  level?: string;
  status: string;
  created_at: string;
  notes?: string;
  admin_notes?: string;
}

function formatDate12H(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function AdminTicketsPage() {
  const { token, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [typeFilter, setTypeFilter] = useState('');

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTicketId, setRejectTicketId] = useState<string | null>(null);
  const [rejectStudentName, setRejectStudentName] = useState('');

  useEffect(() => {
    if (token && isAdmin()) {
      fetchTickets();
    }
  }, [token, isAdmin, statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${GRE_API_URL}/api/admin/tickets${statusFilter ? `?status=${statusFilter}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.data?.tickets || data.tickets || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
  };

  const handleRejectClick = (ticket: Ticket) => {
    setRejectTicketId(ticket.id);
    setRejectStudentName(ticket.student_name || ticket.student_email || '');
    setRejectModalOpen(true);
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (t.student_name || '').toLowerCase().includes(q) ||
        (t.student_email || '').toLowerCase().includes(q) ||
        (t.test_type || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        (t.level || '').toLowerCase().includes(q) ||
        (t.status || '').toLowerCase().includes(q) ||
        (t.id || '').toLowerCase().includes(q) ||
        formatDate12H(t.created_at).toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === 'PENDING') matchStatus = t.status?.toUpperCase() === 'PENDING';
      else if (statusFilter === 'APPROVED') matchStatus = ['APPROVED', 'OPEN', 'ALLOCATED'].includes(t.status?.toUpperCase());
      else if (statusFilter === 'REJECTED') matchStatus = t.status?.toUpperCase() === 'REJECTED';
      else if (statusFilter === 'CLOSED') matchStatus = t.status?.toUpperCase() === 'CLOSED';

      const matchType = !typeFilter || t.test_type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [tickets, search, statusFilter, typeFilter]);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[11px] font-bold whitespace-nowrap">⏳ Pending Approval</span>;
      case 'APPROVED':
      case 'OPEN':
      case 'ALLOCATED':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[11px] font-bold whitespace-nowrap">✅ Approved & Allocated</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[11px] font-bold whitespace-nowrap">❌ Rejected</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-full text-[11px] font-bold whitespace-nowrap">🔒 Closed</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-full text-[11px] font-bold whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 font-sans text-slate-800">

        {/* Header Bar */}
        <div className="bg-[#162432] text-white rounded-xl p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border-b-4 border-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-inner shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Test Request Tickets Approval</h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Review pending student test requests, approve and allocate full-length, sectional, or topic-wise GRE tests.
              </p>
            </div>
          </div>
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} /> Refresh Requests
          </button>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs text-center space-y-1">
            <span className="text-slate-400 font-bold text-[10px] uppercase block">Pending Test Requests</span>
            <span className="text-2xl font-black text-amber-600 block">{tickets.filter(t => t.status?.toUpperCase() === 'PENDING').length}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs text-center space-y-1">
            <span className="text-slate-400 font-bold text-[10px] uppercase block">Approved & Allocated</span>
            <span className="text-2xl font-black text-emerald-600 block">{tickets.filter(t => ['APPROVED', 'OPEN', 'ALLOCATED'].includes(t.status?.toUpperCase())).length}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs text-center space-y-1">
            <span className="text-slate-400 font-bold text-[10px] uppercase block">Total Requests</span>
            <span className="text-2xl font-black text-slate-900 block">{tickets.length}</span>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student name, email, test type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-2 text-slate-400 font-bold">✕</button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-600">Status:</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending Approval Only</option>
                <option value="APPROVED">Approved / Active</option>
                <option value="CLOSED">Closed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-600">Format:</label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"
              >
                <option value="">All Formats</option>
                <option value="FULL_LENGTH">Full-Length GRE</option>
                <option value="SECTIONAL">Sectional Test</option>
                <option value="TOPIC_WISE">Topic-Wise Test</option>
              </select>
            </div>

            {(search || statusFilter || typeFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Test Requests Approval Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead className="bg-[#162432] text-white font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">Ticket ID</th>
                  <th className="p-3.5 whitespace-nowrap">Student Name & Email</th>
                  <th className="p-3.5 whitespace-nowrap">Requested Format</th>
                  <th className="p-3.5 whitespace-nowrap">Requested Topic</th>
                  <th className="p-3.5 whitespace-nowrap">Date Raised</th>
                  <th className="p-3.5 whitespace-nowrap">Status</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">Loading test requests...</td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">No test request tickets found matching your filter criteria.</td>
                  </tr>
                ) : (
                  filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#0073b7] whitespace-nowrap">{ticket.id.slice(0, 8)}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <p className="font-bold text-slate-900">{ticket.student_name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-500">{ticket.student_email}</p>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">{ticket.test_type}</td>
                      <td className="p-3.5 text-slate-600 font-semibold whitespace-nowrap">
                        {ticket.category || 'All Topics'}{ticket.level ? ` (${ticket.level})` : ''}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-[10px] whitespace-nowrap">{formatDate12H(ticket.created_at)}</td>
                      <td className="p-3.5 whitespace-nowrap">{getStatusBadge(ticket.status)}</td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {ticket.status?.toUpperCase() === 'PENDING' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApproveClick(ticket)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve & Allocate Test
                            </button>
                            <button
                              onClick={() => handleRejectClick(ticket)}
                              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded-lg font-bold text-[11px] transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Reject Request
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Allocate Test Modal */}
        {selectedTicket && token && (
          <AllocateTestModal
            token={token}
            isOpen={modalOpen}
            onClose={() => { setModalOpen(false); setSelectedTicket(null); }}
            onSuccess={() => {
              fetchTickets();
              setModalOpen(false);
              setSelectedTicket(null);
            }}
            ticketId={selectedTicket.id}
            studentId={selectedTicket.student_id}
            studentName={selectedTicket.student_name || selectedTicket.student_email}
            initialTicketType={selectedTicket.test_type}
            initialCategory={selectedTicket.category}
            initialLevel={selectedTicket.level}
          />
        )}

        {/* Reject Ticket Modal */}
        {rejectTicketId && token && (
          <RejectTicketModal
            token={token}
            ticketId={rejectTicketId}
            studentName={rejectStudentName}
            isOpen={rejectModalOpen}
            onClose={() => { setRejectModalOpen(false); setRejectTicketId(null); }}
            onSuccess={() => {
              fetchTickets();
              setRejectModalOpen(false);
              setRejectTicketId(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
