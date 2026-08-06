'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { GRE_API_URL } from '@/lib/config';

interface TestResultRow {
  id: string;
  ticket_id: string | null;
  student_id: string;
  student_name: string;
  email: string;
  allocated_by: string;
  test_type: string;
  test_title: string;
  status: string;
  score_percent: number | null;
  scheduled_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export default function GreTestResultsPage() {
  const { token } = useAuth();
  const [results, setResults] = useState<TestResultRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 30, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [testTypeFilter, setTestTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchResults = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '30');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (testTypeFilter) params.append('test_type', testTypeFilter);
      const res = await fetch(`${GRE_API_URL}/api/admin/test-results?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setPagination({ page: data.page, limit: data.limit, total: data.total, total_pages: data.total_pages });
      }
    } catch (err) {
      console.error('Failed to fetch test results:', err);
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, testTypeFilter]);

  useEffect(() => {
    if (token) fetchResults(1);
  }, [token, fetchResults]);

  const formatDate = (d: string | null) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED') return '#10b981';
    if (s === 'TERMINATED' || s === 'MALPRACTICE') return '#dc2626';
    if (s === 'EXPIRED') return '#f59e0b';
    if (s === 'IN_PROGRESS') return '#3b82f6';
    return '#6c757d';
  };

  return (
    <AdminLayout>
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#2d2d2d', margin: 0 }}>GRE Test Results</h1>
        <p style={{ color: '#6c757d', fontSize: '14px', margin: '4px 0 0' }}>View all student test allocations and their results</p>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #ede9e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search name, email, title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchResults(1); }}
              style={{ padding: '8px 16px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '13px', width: '260px', outline: 'none' }}
            />
            <button onClick={() => fetchResults(1)} style={{ padding: '8px 16px', backgroundColor: '#e61a8d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Search</button>
            <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #ede9e4', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#2d2d2d' }}>Filters</button>
          </div>
          <span style={{ fontSize: '13px', color: '#6c757d' }}>{pagination.total} total results</span>
        </div>

        {showFilters && (
          <div style={{ padding: '12px 24px', borderBottom: '1px solid #ede9e4', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); }} style={{ padding: '6px 12px', border: '1px solid #ede9e4', borderRadius: '6px', fontSize: '12px' }}>
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="TERMINATED">Terminated</option>
              <option value="EXPIRED">Expired</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ASSIGNED">Assigned</option>
            </select>
            <select value={testTypeFilter} onChange={e => { setTestTypeFilter(e.target.value); }} style={{ padding: '6px 12px', border: '1px solid #ede9e4', borderRadius: '6px', fontSize: '12px' }}>
              <option value="">All Types</option>
              <option value="FULL_LENGTH">Full Length</option>
              <option value="SECTIONAL">Sectional</option>
              <option value="TOPIC_WISE">Topic Wise</option>
            </select>
            <button onClick={() => { setStatusFilter(''); setTestTypeFilter(''); setSearch(''); fetchResults(1); }} style={{ padding: '6px 12px', border: '1px solid #ede9e4', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', background: 'white' }}>Clear</button>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading...</div>
        ) : results.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No test results found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#faf4ec' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>S.No.</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Student</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Test Title</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Score</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2d2d2d' }}>{(pagination.page - 1) * pagination.limit + i + 1}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    <div style={{ fontWeight: 600, color: '#2d2d2d' }}>{r.student_name || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{r.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2d2d2d' }}>{r.test_title || 'N/A'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#5a5a5a' }}>{r.test_type || 'N/A'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: `${getStatusColor(r.status)}20`, color: getStatusColor(r.status) }}>
                      {r.status || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: r.score_percent != null ? '#e61a8d' : '#999' }}>
                    {r.score_percent != null ? `${r.score_percent}%` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#5a5a5a' }}>{formatDate(r.created_at)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {r.status === 'COMPLETED' || r.score_percent != null ? (
                      <Link
                        href={`/user-dashboard/gre-result?allocation_id=${r.id}`}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#e61a8d',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-block'
                        }}
                      >
                        View Scorecard
                      </Link>
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination.total_pages > 1 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #ede9e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#6c757d' }}>Page {pagination.page} of {pagination.total_pages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => fetchResults(pagination.page - 1)} disabled={pagination.page <= 1} style={{ padding: '6px 16px', border: '1px solid #ede9e4', borderRadius: '6px', background: 'white', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, color: '#2d2d2d', opacity: pagination.page <= 1 ? 0.5 : 1 }}>Previous</button>
              <button onClick={() => fetchResults(pagination.page + 1)} disabled={pagination.page >= pagination.total_pages} style={{ padding: '6px 16px', border: '1px solid #ede9e4', borderRadius: '6px', background: 'white', cursor: pagination.page >= pagination.total_pages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, color: '#2d2d2d', opacity: pagination.page >= pagination.total_pages ? 0.5 : 1 }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}
