'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GRE_API_URL } from '@/lib/config';
import StudentLayout from '@/components/student/StudentLayout';

interface GREDashboardStats {
  tests_assigned: number;
  tests_completed: number;
  average_score: number | null;
  quant_avg: number | null;
  verbal_avg: number | null;
  pending_approvals: number;
}

interface Allocation {
  id: string;
  test_type: string;
  test_title: string;
  status: string;
  score_percent?: number;
  scheduled_at?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  expires_at?: string;
  expiry_date?: string;
  expiry_time?: string;
  created_at: string;
}

/** 12-hour AM/PM format — matches original formatDate12H */
function formatDate12H(val?: string | null): string {
  if (!val) return 'N/A';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch {
    return 'N/A';
  }
}

function resolveScheduledAt(a: Allocation): string | undefined {
  if (a.scheduled_at) return a.scheduled_at;
  if (a.scheduled_date) {
    const time = a.scheduled_time || '09:00';
    return `${a.scheduled_date}T${time}:00`;
  }
  return undefined;
}

function resolveExpiresAt(a: Allocation): string | undefined {
  if (a.expires_at) return a.expires_at;
  if (a.expiry_date) {
    const time = a.expiry_time || '23:59';
    return `${a.expiry_date}T${time}:00`;
  }
  return undefined;
}

export default function GREDashboardPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [stats, setStats] = useState<GREDashboardStats | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');
  const [requestError, setRequestError] = useState('');
  const [ticketType, setTicketType] = useState('FULL_LENGTH');

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  // Live clock for expiry checks — same as original
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = React.useCallback(async () => {
    if (!token) return;
    try {
      const [statsRes, allocRes] = await Promise.all([
        fetch(`${GRE_API_URL}/api/gre/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${GRE_API_URL}/api/allocations/my-allocations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.data || d);
      }
      if (allocRes.ok) {
        const d = await allocRes.json();
        setAllocations(d.data || d.allocations || []);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch + auto-refresh every 10s — same as original
  useEffect(() => {
    if (!token) return;
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData, token]);

  // Filtered allocations with useMemo — multi-filter support
  const filteredAllocations = React.useMemo(() => {
    return allocations.filter(a => {
      const q = search.toLowerCase();
      const scheduledAt = resolveScheduledAt(a);
      const expiresAt = resolveExpiresAt(a);
      const startDateStr = formatDate12H(scheduledAt || a.created_at).toLowerCase();
      const endDateStr = formatDate12H(expiresAt).toLowerCase();
      const scoreStr =
        a.score_percent !== undefined && a.score_percent !== null
          ? `${a.score_percent}%`
          : '';

      const matchSearch =
        !q ||
        (a.test_title || '').toLowerCase().includes(q) ||
        (a.test_type || '').toLowerCase().includes(q) ||
        (a.status || '').toLowerCase().includes(q) ||
        scoreStr.includes(q) ||
        startDateStr.includes(q) ||
        endDateStr.includes(q);

      const matchStatus = statusFilter === 'ALL' || (a.status || '').toUpperCase() === statusFilter;
      const matchType = typeFilter === 'ALL' || (a.test_type || '').toUpperCase() === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [allocations, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredAllocations.length / limit) || 1;
  const paginatedAllocations = filteredAllocations.slice((currentPage - 1) * limit, currentPage * limit);

  const hasCompletedTests = stats && stats.tests_completed > 0;

  const handleRequestTest = async () => {
    setRequestSubmitting(true);
    setRequestError('');
    setRequestMsg('');
    try {
      const res = await fetch(`${GRE_API_URL}/api/tickets/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ticket_type: ticketType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');
      setRequestMsg('Test request submitted! Admin will review and allocate your test.');
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestMsg('');
        fetchData();
      }, 1500);
    } catch (err: any) {
      setRequestError(err.message || 'Failed to submit request');
    } finally {
      setRequestSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <StudentLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px',
            border: '4px solid #f3e8f7', borderTop: '4px solid #e61a8d', borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: '#5a5a5a', fontWeight: '600', margin: 0 }}>Loading dashboard...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </StudentLayout>
    );
  }

  // Stat display values — show '-' when no completed tests (matches original exactly)
  const overallScore = hasCompletedTests && stats?.average_score
    ? `${Math.round(stats.average_score)}`
    : '-';
  const quantScore = hasCompletedTests && stats?.quant_avg
    ? `${Math.round(stats.quant_avg)}`
    : '-';
  const verbalScore = hasCompletedTests && stats?.verbal_avg
    ? `${Math.round(stats.verbal_avg)}`
    : '-';
  const avgPct = hasCompletedTests && stats?.average_score
    ? `${(stats.average_score / 340 * 100).toFixed(0)}%`
    : '0%';

  return (
    <StudentLayout>
      <div style={{ flex: 1, minWidth: 0 }}>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b',
            padding: '14px 18px', borderRadius: '10px', marginBottom: '24px',
            fontSize: '13px', fontWeight: '500',
          }}>
            {error}
          </div>
        )}

        {/* ── STAT CARDS (same logic as original, University theme) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px', marginBottom: '24px',
        }}>

          {/* Overall GRE Score */}
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '20px',
            border: '1px solid #f0e8f5', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            borderLeft: '4px solid #e61a8d',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall GRE Score</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e61a8d" strokeWidth="2">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', margin: '10px 0 0' }}>
              {overallScore} <span style={{ fontSize: '13px', fontWeight: '600', color: '#aaa' }}>/ 340</span>
            </div>
            <span style={{ fontSize: '10px', color: '#888', fontWeight: '500', marginTop: '6px' }}>
              {hasCompletedTests ? `Accuracy: ${avgPct} (ETS Base: 260)` : 'No tests completed yet'}
            </span>
          </div>

          {/* Quant Reasoning */}
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '20px',
            border: '1px solid #f0e8f5', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            borderLeft: '4px solid #3b82f6',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quant Reasoning</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', margin: '10px 0 0' }}>
              {quantScore} <span style={{ fontSize: '13px', fontWeight: '600', color: '#aaa' }}>/ 170</span>
            </div>
            <span style={{ fontSize: '10px', color: '#888', fontWeight: '500', marginTop: '6px' }}>130 - 170 ETS Scale (130 is 0% Base)</span>
          </div>

          {/* Verbal Reasoning */}
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '20px',
            border: '1px solid #f0e8f5', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            borderLeft: '4px solid #06b6d4',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Verbal Reasoning</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', margin: '10px 0 0' }}>
              {verbalScore} <span style={{ fontSize: '13px', fontWeight: '600', color: '#aaa' }}>/ 170</span>
            </div>
            <span style={{ fontSize: '10px', color: '#888', fontWeight: '500', marginTop: '6px' }}>130 - 170 ETS Scale (130 is 0% Base)</span>
          </div>

          {/* Tests Completed */}
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '20px',
            border: '1px solid #f0e8f5', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            borderLeft: '4px solid #10b981',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tests Completed</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', margin: '10px 0 0' }}>
              {stats ? stats.tests_completed : 0}
            </div>
            <span style={{ fontSize: '10px', color: '#888', fontWeight: '500', marginTop: '6px' }}>
              Average: {avgPct}
            </span>
          </div>
        </div>

        {/* ── ALLOCATED TESTS TABLE ── */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px',
          border: '1px solid #f0e8f5', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          {/* Table header bar */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #f0e8f5',
            backgroundColor: '#fafafa',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'space-between', gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e61a8d" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>
                Allocated GRE Tests &amp; Practice Exams
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  padding: '7px 10px', border: '1px solid #e5e7eb',
                  borderRadius: '8px', fontSize: '12px', backgroundColor: 'white',
                  color: '#1a1a1a', outline: 'none', fontWeight: '600'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Format Filter */}
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                style={{
                  padding: '7px 10px', border: '1px solid #e5e7eb',
                  borderRadius: '8px', fontSize: '12px', backgroundColor: 'white',
                  color: '#1a1a1a', outline: 'none', fontWeight: '600'
                }}
              >
                <option value="ALL">All Formats</option>
                <option value="FULL_LENGTH">Full-Length</option>
                <option value="SECTIONAL">Sectional</option>
                <option value="TOPIC_WISE">Topic-Wise</option>
              </select>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2"
                  style={{ position: 'absolute', left: '10px', top: '9px' }}>
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search date, title, type..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    padding: '8px 32px 8px 32px', border: '1px solid #e5e7eb',
                    borderRadius: '8px', fontSize: '12px', width: '220px',
                    outline: 'none', fontFamily: 'inherit', color: '#1a1a1a',
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ position: 'absolute', right: '9px', top: '6px', background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '13px', fontWeight: '700', lineHeight: 1 }}
                  >✕</button>
                )}
              </div>

              {/* Request button */}
              <button
                onClick={() => setShowRequestModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', backgroundColor: '#e61a8d', color: 'white',
                  border: 'none', borderRadius: '8px', fontSize: '12px',
                  fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M12 4v16m8-8H4"/>
                </svg>
                Request New Test
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0e8f5', backgroundColor: 'white' }}>
                  {['S.No.', 'Test Title', 'Type', 'Scheduled Window (12H AM/PM)', 'Status', 'Score %', 'Action'].map(h => (
                    <th key={h} style={{
                      padding: '12px 14px',
                      textAlign: h === 'Action' ? 'center' : 'left',
                      fontWeight: '700', color: '#1a1a1a',
                      fontSize: '11px', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#bbb', fontWeight: '600' }}>
                      Loading allocated tests...
                    </td>
                  </tr>
                ) : filteredAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#bbb', fontWeight: '600' }}>
                      No allocated tests found{search ? ` matching "${search}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  paginatedAllocations.map((a, idx) => {
                    const scheduledAt = resolveScheduledAt(a);
                    const expiresAt = resolveExpiresAt(a);
                    const serialNum = (currentPage - 1) * limit + idx + 1;

                    // Fixed status logic - check date before marking as completed
                    const isMalpractice = a.status === 'MALPRACTICE' || a.status === 'TERMINATED';
                    const isScheduledFuture =
                      !!scheduledAt && new Date(scheduledAt) > currentTime;
                    const isExpired =
                      !isMalpractice && !isScheduledFuture &&
                      ((expiresAt && new Date(expiresAt) < currentTime) || a.status === 'EXPIRED');
                    const isInProgress = a.status === 'IN_PROGRESS';
                    const isCompleted = (a.status === 'COMPLETED' || a.status === 'SUBMITTED') && !isScheduledFuture;

                    return (
                      <tr
                        key={a.id}
                        style={{ borderBottom: '1px solid #faf5fa', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fdf8fd')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* S.No */}
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1a1a1a' }}>{serialNum}</td>

                        {/* Title */}
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1a1a1a' }}>{a.test_title}</td>

                        {/* Type badge */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700',
                            backgroundColor:
                              a.test_type === 'FULL_LENGTH' ? '#f3e8ff' :
                              a.test_type === 'SECTIONAL' ? '#dbeafe' : '#e0f7fa',
                            color:
                              a.test_type === 'FULL_LENGTH' ? '#7c3aed' :
                              a.test_type === 'SECTIONAL' ? '#2563eb' : '#0891b2',
                          }}>
                            {a.test_type?.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Scheduled Window — 12H format */}
                        <td style={{ padding: '12px 14px', fontSize: '11px', color: '#555' }}>
                          <div><strong style={{ color: '#1a1a1a' }}>Start:</strong> {formatDate12H(scheduledAt || a.created_at)}</div>
                          <div><strong style={{ color: '#888' }}>End:</strong> {formatDate12H(expiresAt)}</div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            display: 'inline-block', padding: '4px 10px',
                            borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                            backgroundColor:
                              isCompleted ? '#d1fae5' :
                              isMalpractice ? '#fee2e2' :
                              isExpired ? '#f3f4f6' :
                              isScheduledFuture ? '#fef3c7' :
                              isInProgress ? '#dbeafe' : '#d1fae5',
                            color:
                              isCompleted ? '#065f46' :
                              isMalpractice ? '#991b1b' :
                              isExpired ? '#6b7280' :
                              isScheduledFuture ? '#92400e' :
                              isInProgress ? '#1d4ed8' : '#065f46',
                          }}>
                            {isCompleted ? 'Completed' :
                             isMalpractice ? '🔴 Terminated' :
                             isExpired ? 'Expired' :
                             isScheduledFuture ? 'Scheduled' :
                             isInProgress ? 'In Progress' : 'Active / Ready'}
                          </span>
                        </td>

                        {/* Score % — show 0% percentage based, no N/A */}
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1a1a1a' }}>
                          {typeof a.score_percent === 'number' && !isNaN(a.score_percent)
                            ? `${Math.round(a.score_percent)}%`
                            : '0%'}
                        </td>

                        {/* Action */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {isCompleted || isMalpractice ? (
                            <Link
                              href={`/user-dashboard/gre-result?allocation_id=${a.id}`}
                              style={{
                                padding: '6px 12px', backgroundColor: '#0f83c9', color: 'white',
                                textDecoration: 'none', borderRadius: '6px', fontSize: '11px',
                                fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px',
                              }}
                            >View Report</Link>
                          ) : isScheduledFuture ? (
                            <span
                              title={`Test is scheduled for ${formatDate12H(scheduledAt)}. Not active yet.`}
                              style={{
                                padding: '6px 10px', backgroundColor: '#f3f4f6', color: '#9ca3af',
                                borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                                display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'not-allowed',
                              }}
                            >
                              🔒 Scheduled
                            </span>
                          ) : isExpired ? (
                            <span
                              title={`Test expired on ${formatDate12H(expiresAt)}.`}
                              style={{
                                padding: '6px 10px', backgroundColor: '#fee2e2', color: '#dc2626',
                                borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'not-allowed',
                              }}
                            >Expired</span>
                          ) : (
                            <Link
                              href={`/user-dashboard/gre-exam?allocation_id=${a.id}`}
                              style={{
                                padding: '6px 12px', backgroundColor: '#e61a8d', color: 'white',
                                textDecoration: 'none', borderRadius: '6px', fontSize: '11px',
                                fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px',
                              }}
                            >
                               <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                              Start Test
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* NUMBERED PAGINATION CONTROL BAR */}
          {filteredAllocations.length > 0 && (
            <div style={{
              padding: '16px 20px', borderTop: '1px solid #ede9e4', backgroundColor: '#fafafa',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
              gap: '12px', fontSize: '12px',
            }}>
              <span style={{ color: '#5a5a5a', fontWeight: '500' }}>
                Page <strong style={{ color: '#2d2d2d' }}>{currentPage}</strong> of <strong style={{ color: '#2d2d2d' }}>{totalPages}</strong> ({filteredAllocations.length} total allocated tests)
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  style={{
                    padding: '6px 12px', backgroundColor: 'white', border: '1px solid #ede9e4',
                    borderRadius: '6px', fontWeight: '700', fontSize: '11px', color: '#5a5a5a',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', opacity: currentPage <= 1 ? 0.4 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  ← Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '6px', fontWeight: '800',
                      fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
                      backgroundColor: currentPage === pageNum ? '#e61a8d' : 'white',
                      color: currentPage === pageNum ? 'white' : '#5a5a5a',
                      border: '1px solid ' + (currentPage === pageNum ? '#e61a8d' : '#ede9e4'),
                      transition: 'all 0.15s',
                    }}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  style={{
                    padding: '6px 12px', backgroundColor: 'white', border: '1px solid #ede9e4',
                    borderRadius: '6px', fontWeight: '700', fontSize: '11px', color: '#5a5a5a',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.4 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── REQUEST TEST MODAL ── */}
        {showRequestModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, padding: '16px',
          }}>
            <div style={{
              backgroundColor: 'white', borderRadius: '14px',
              maxWidth: '420px', width: '100%', padding: '24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f0e8f5',
              }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>
                  Request Practice Test
                </h3>
                <button
                  onClick={() => { setShowRequestModal(false); setRequestError(''); setRequestMsg(''); }}
                  style={{ background: 'none', border: 'none', fontSize: '18px', color: '#bbb', cursor: 'pointer', lineHeight: 1 }}
                >✕</button>
              </div>

              {requestMsg && (
                <div style={{ backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
                  {requestMsg}
                </div>
              )}
              {requestError && (
                <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
                  {requestError}
                </div>
              )}

              {!requestMsg && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px' }}>
                      Test Type
                    </label>
                    <select
                      value={ticketType}
                      onChange={e => setTicketType(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px',
                        border: '1px solid #e5e7eb', borderRadius: '8px',
                        fontSize: '13px', color: '#1a1a1a',
                        outline: 'none', fontFamily: 'inherit',
                      }}
                    >
                      <option value="FULL_LENGTH">Full-Length Test (All sections, ~2hrs)</option>
                      <option value="SECTIONAL">Sectional Test (Single section, ~35min)</option>
                      <option value="TOPIC_WISE">Topic-Wise Test (Specific topic, ~20min)</option>
                    </select>
                  </div>

                  <div style={{
                    backgroundColor: '#fde8f5', border: '1px solid #f9c5dc',
                    borderRadius: '8px', padding: '14px', marginBottom: '20px',
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#1a1a1a' }}>
                      Are you sure you want to request a practice test?
                    </p>
                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#555' }}>
                      Your request will be sent to the administrator for approval. Once approved, your allocated test will appear on your dashboard.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => { setShowRequestModal(false); setRequestError(''); }}
                      style={{
                        flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px',
                        fontSize: '13px', fontWeight: '600', color: '#555',
                        background: 'white', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >Cancel</button>
                    <button
                      onClick={handleRequestTest}
                      disabled={requestSubmitting}
                      style={{
                        flex: 1, padding: '10px', backgroundColor: '#e61a8d',
                        color: 'white', border: 'none', borderRadius: '8px',
                        fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        opacity: requestSubmitting ? 0.6 : 1, fontFamily: 'inherit',
                      }}
                    >
                      {requestSubmitting ? 'Submitting...' : 'Confirm & Send'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}
