'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GRE_API_URL } from '@/lib/config';
import StudentLayout from '@/components/student/StudentLayout';

interface TestResult {
  id: string;
  test_title: string;
  test_type: string;
  status: string;
  score_percent: number;
  total_questions: number;
  correct_answers: number;
  completed_at?: string;
  created_at: string;
}

/** 12-hour AM/PM format matching original formatDate12H */
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

export default function GRETestsPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limit = 20;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [testTypeFilter, setTestTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [scoreMin, setScoreMin] = useState<string>('');
  const [scoreMax, setScoreMax] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchResults = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${GRE_API_URL}/api/allocations/my-allocations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const allocs = data.data || data.allocations || [];

        // Show ALL test allocations regardless of status
        const allTests: TestResult[] = allocs.map((a: any) => {
            const qIds = Array.isArray(a.question_ids) ? a.question_ids : [];
            const totalQ = qIds.length || a.question_count || 0;
            const scorePct = typeof a.score_percent === 'number' ? a.score_percent : (a.score ? (a.score / 340) * 100 : 0);
            return {
              id: a.id,
              test_title: a.test_title || (a.test_type === 'FULL_LENGTH' ? 'Full Length GRE' : a.test_type === 'SECTIONAL' ? 'Sectional Test' : 'Topic-Wise Test'),
              test_type: a.test_type || 'PRACTICE',
              status: a.status,
              score_percent: scorePct,
              total_questions: totalQ,
              correct_answers: Math.round((scorePct / 100) * totalQ),
              completed_at: a.submitted_at || a.updated_at,
              created_at: a.created_at,
            };
          });

        setResults(allTests);
      }
    } catch (err) {
      console.error('Failed to fetch test results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchResults();
    }
  }, [token]);

  // Filtered results based on all active filters
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (r.test_title || '').toLowerCase().includes(q);
        const matchesType = (r.test_type || '').toLowerCase().includes(q);
        const matchesId = (r.id || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesType && !matchesId) return false;
      }

      // 2. Test Type Filter
      if (testTypeFilter && r.test_type !== testTypeFilter) return false;

      // 3. Status Filter
      if (statusFilter && r.status !== statusFilter) return false;

      // 4. Date From Filter
      if (dateFrom) {
        const testDate = new Date(r.completed_at || r.created_at);
        const fromDate = new Date(dateFrom);
        if (testDate < fromDate) return false;
      }

      // 5. Date To Filter
      if (dateTo) {
        const testDate = new Date(r.completed_at || r.created_at);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (testDate > toDate) return false;
      }

      // 6. Score Min Filter
      if (scoreMin !== '') {
        const minVal = parseFloat(scoreMin);
        if (!isNaN(minVal) && (r.score_percent || 0) < minVal) return false;
      }

      // 7. Score Max Filter
      if (scoreMax !== '') {
        const maxVal = parseFloat(scoreMax);
        if (!isNaN(maxVal) && (r.score_percent || 0) > maxVal) return false;
      }

      return true;
    });
  }, [results, searchQuery, testTypeFilter, statusFilter, dateFrom, dateTo, scoreMin, scoreMax]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, testTypeFilter, statusFilter, dateFrom, dateTo, scoreMin, scoreMax]);

  const clearFilters = () => {
    setSearchQuery('');
    setTestTypeFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setScoreMin('');
    setScoreMax('');
  };

  // Analytics metrics
  const totalCount = results.length;
  const avgScore = results.length > 0
    ? (results.reduce((acc, curr) => acc + (curr.score_percent || 0), 0) / results.length).toFixed(1)
    : '0';
  const maxScore = results.length > 0
    ? Math.max(...results.map(r => r.score_percent || 0)).toFixed(1)
    : '0';
  const totalQuestions = results.reduce((acc, curr) => acc + curr.total_questions, 0);

  const totalPages = Math.ceil(filteredResults.length / limit) || 1;
  const paginatedResults = filteredResults.slice((currentPage - 1) * limit, currentPage * limit);

  const hasActiveFilters = testTypeFilter || statusFilter || dateFrom || dateTo || scoreMin || scoreMax;

  if (isLoading) {
    return (
      <StudentLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #e61a8d', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* HEADER BANNER - Beautiful Pink Accent matching University theme */}
        <div style={{
          backgroundColor: '#e61a8d', color: 'white', borderRadius: '16px',
          padding: '20px 24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(230,26,141,0.2)',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'white' }}>
              My Test Scorecards &amp; Performance History
            </h1>
            <p style={{ fontSize: '12px', color: '#fce7f3', fontWeight: '500', margin: '4px 0 0' }}>
              Review complete question-by-question scorecard analysis, accuracy stats, and solution audits.
            </p>
          </div>

          <button
            onClick={fetchResults}
            disabled={loading}
            style={{
              backgroundColor: 'white', color: '#e61a8d', border: 'none',
              borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Results'}
          </button>
        </div>

        {/* OVERVIEW STAT CARDS */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px', marginBottom: '24px',
        }}>
          <div style={{ backgroundColor: 'white', borderLeft: '4px solid #e61a8d', border: '1px solid #ede9e4', borderLeftWidth: '4px', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <span style={{ color: '#5a5a5a', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Total Tests Completed</span>
            <span style={{ fontSize: '26px', fontWeight: '800', color: '#2d2d2d', display: 'block', marginTop: '6px' }}>{totalCount}</span>
          </div>
          <div style={{ backgroundColor: 'white', borderLeft: '4px solid #10b981', border: '1px solid #ede9e4', borderLeftWidth: '4px', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <span style={{ color: '#5a5a5a', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Average Accuracy</span>
            <span style={{ fontSize: '26px', fontWeight: '800', color: '#10b981', display: 'block', marginTop: '6px' }}>{avgScore}%</span>
          </div>
          <div style={{ backgroundColor: 'white', borderLeft: '4px solid #3b82f6', border: '1px solid #ede9e4', borderLeftWidth: '4px', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <span style={{ color: '#5a5a5a', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Highest Score</span>
            <span style={{ fontSize: '26px', fontWeight: '800', color: '#3b82f6', display: 'block', marginTop: '6px' }}>{maxScore}%</span>
          </div>
          <div style={{ backgroundColor: 'white', borderLeft: '4px solid #06b6d4', border: '1px solid #ede9e4', borderLeftWidth: '4px', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <span style={{ color: '#5a5a5a', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Questions Solved</span>
            <span style={{ fontSize: '26px', fontWeight: '800', color: '#e61a8d', display: 'block', marginTop: '6px' }}>{totalQuestions}</span>
          </div>
        </div>

        {/* SEARCH & FILTERS CONTROL BAR */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '18px', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"
                style={{ position: 'absolute', left: '12px', top: '11px' }}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search by test title, test type, or allocation ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '9px 32px 9px 34px', backgroundColor: '#fafafa',
                  border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '12px',
                  fontWeight: '600', color: '#2d2d2d', outline: 'none', fontFamily: 'inherit',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '8px', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                >✕</button>
              )}
            </div>

            {/* Sub-Filters button & Clear */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '9px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px',
                  border: '1px solid ' + (showFilters || hasActiveFilters ? '#e61a8d' : '#ede9e4'),
                  backgroundColor: showFilters || hasActiveFilters ? '#fde8f5' : 'white',
                  color: showFilters || hasActiveFilters ? '#e61a8d' : '#5a5a5a',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Sub-Filters
                {hasActiveFilters && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e61a8d' }} />
                )}
              </button>

              {(searchQuery || hasActiveFilters) && (
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '9px 14px', backgroundColor: '#f5f0eb', border: 'none',
                    borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                    color: '#5a5a5a', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* EXPANDABLE SUB-FILTERS PANEL */}
          {showFilters && (
            <div style={{
              marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #ede9e4',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px',
              backgroundColor: '#fafafa', padding: '14px', borderRadius: '8px', border: '1px solid #ede9e4',
            }}>
              {/* Test Format */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#5a5a5a', marginBottom: '4px' }}>Test Format</label>
                <select
                  value={testTypeFilter}
                  onChange={(e) => setTestTypeFilter(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', backgroundColor: 'white', border: '1px solid #ede9e4', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#2d2d2d', outline: 'none', fontFamily: 'inherit' }}
                >
                  <option value="">All Formats</option>
                  <option value="FULL_LENGTH">Full-Length GRE</option>
                  <option value="SECTIONAL">Sectional Test</option>
                  <option value="TOPIC_WISE">Topic-Wise Test</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#5a5a5a', marginBottom: '4px' }}>Result Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', backgroundColor: 'white', border: '1px solid #ede9e4', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#2d2d2d', outline: 'none', fontFamily: 'inherit' }}
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="TERMINATED">Terminated</option>
                  <option value="MALPRACTICE">Malpractice</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ASSIGNED">Assigned</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#5a5a5a', marginBottom: '4px' }}>Completed From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', backgroundColor: 'white', border: '1px solid #ede9e4', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#2d2d2d', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {/* Date To */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#5a5a5a', marginBottom: '4px' }}>Completed To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', backgroundColor: 'white', border: '1px solid #ede9e4', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#2d2d2d', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {/* Score Min */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#5a5a5a', marginBottom: '4px' }}>Score Min (%)</label>
                <input
                  type="number"
                  placeholder="0"
                  min="0" max="100"
                  value={scoreMin}
                  onChange={(e) => setScoreMin(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', backgroundColor: 'white', border: '1px solid #ede9e4', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#2d2d2d', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {/* Score Max */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#5a5a5a', marginBottom: '4px' }}>Score Max (%)</label>
                <input
                  type="number"
                  placeholder="100"
                  min="0" max="100"
                  value={scoreMax}
                  onChange={(e) => setScoreMax(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', backgroundColor: 'white', border: '1px solid #ede9e4', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#2d2d2d', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* TEST RESULTS DATA TABLE */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ede9e4', backgroundColor: '#fafafa' }}>
                  {['S.No', 'Test Title', 'Test Format', 'Questions', 'Completed Date', 'Accuracy Score', 'Status', 'Scorecard Action'].map((h, i) => (
                    <th key={h} style={{
                      padding: '14px 16px',
                      textAlign: i === 7 ? 'center' : 'left',
                      fontWeight: '700', color: '#5a5a5a',
                      fontSize: '11px', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#999', fontWeight: '600' }}>
                      Loading test results...
                    </td>
                  </tr>
                ) : filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#5a5a5a', fontWeight: '600' }}>
                      No test results found matching your search or filters.
                    </td>
                  </tr>
                ) : (
                  paginatedResults.map((result, idx) => {
                    const serialNum = (currentPage - 1) * limit + idx + 1;
                    const scorePct = result.score_percent || 0;
                    const statusUpper = (result.status || '').toUpperCase();
                    const statusInfo: Record<string, { bg: string; color: string; label: string }> = {
                      COMPLETED: { bg: '#d1fae5', color: '#065f46', label: '✓ Completed' },
                      SUBMITTED: { bg: '#d1fae5', color: '#065f46', label: '✓ Submitted' },
                      TERMINATED: { bg: '#fee2e2', color: '#991b1b', label: '✕ Terminated' },
                      MALPRACTICE: { bg: '#fee2e2', color: '#991b1b', label: '✕ Malpractice' },
                      EXPIRED: { bg: '#fef3c7', color: '#92400e', label: '⏰ Expired' },
                      IN_PROGRESS: { bg: '#dbeafe', color: '#1e40af', label: '● In Progress' },
                      ASSIGNED: { bg: '#e0f7fa', color: '#0e7490', label: '○ Assigned' },
                    };
                    const si = statusInfo[statusUpper] || { bg: '#f3f4f6', color: '#5a5a5a', label: result.status || 'Unknown' };

                    return (
                      <tr
                        key={result.id}
                        style={{ borderBottom: '1px solid #f5f5f5', transition: 'background 0.12s' }}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: '600', color: '#2d2d2d' }}>{serialNum}</td>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#e61a8d' }}>{result.test_title}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                            backgroundColor: result.test_type === 'FULL_LENGTH' ? '#f3e8ff' : result.test_type === 'SECTIONAL' ? '#dbeafe' : '#e0f7fa',
                            color: result.test_type === 'FULL_LENGTH' ? '#7c3aed' : result.test_type === 'SECTIONAL' ? '#2563eb' : '#0891b2',
                          }}>
                            {result.test_type === 'FULL_LENGTH' ? 'Full-Length GRE' : result.test_type === 'SECTIONAL' ? 'Sectional Test' : 'Topic-Wise Practice'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#2d2d2d' }}>
                          {result.total_questions} Questions
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: '#5a5a5a' }}>
                          {formatDate12H(result.completed_at || result.created_at)}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '800', fontSize: '13px' }}>
                          <span style={{
                            color: scorePct >= 70 ? '#059669' : scorePct >= 40 ? '#d97706' : '#e11d48',
                          }}>
                            {scorePct ? `${scorePct.toFixed(1)}%` : '0.0%'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-block', padding: '4px 10px', borderRadius: '12px',
                            fontSize: '11px', fontWeight: '700',
                            backgroundColor: si.bg,
                            color: si.color,
                          }}>
                            {si.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <Link
                            href={`/user-dashboard/gre-result?allocation_id=${result.id}`}
                            style={{
                              padding: '8px 14px', backgroundColor: '#e61a8d', color: 'white',
                              textDecoration: 'none', borderRadius: '8px', fontSize: '12px',
                              fontWeight: '700', display: 'inline-flex', alignItems: 'center',
                              gap: '6px', boxShadow: '0 2px 6px rgba(230,26,141,0.2)',
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                            View Scorecard ({result.total_questions} Qs)
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* NUMBERED PAGINATION CONTROL BAR */}
          {filteredResults.length > 0 && (
            <div style={{
              padding: '16px 20px', borderTop: '1px solid #ede9e4', backgroundColor: '#fafafa',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
              gap: '12px', fontSize: '12px',
            }}>
              <span style={{ color: '#5a5a5a', fontWeight: '500' }}>
                Page <strong style={{ color: '#2d2d2d' }}>{currentPage}</strong> of <strong style={{ color: '#2d2d2d' }}>{totalPages}</strong> ({filteredResults.length} total test results)
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  style={{
                    padding: '6px 12px', border: '1px solid #ede9e4', borderRadius: '6px',
                    backgroundColor: 'white', color: '#5a5a5a', fontWeight: '600',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', opacity: currentPage <= 1 ? 0.4 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '6px', fontWeight: '700',
                      cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
                      backgroundColor: currentPage === pageNum ? '#e61a8d' : 'white',
                      color: currentPage === pageNum ? 'white' : '#5a5a5a',
                      border: '1px solid ' + (currentPage === pageNum ? '#e61a8d' : '#ede9e4'),
                    }}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  style={{
                    padding: '6px 12px', border: '1px solid #ede9e4', borderRadius: '6px',
                    backgroundColor: 'white', color: '#5a5a5a', fontWeight: '600',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.4 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </StudentLayout>
  );
}
