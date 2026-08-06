'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { GRE_API_URL } from '@/lib/config';
import StudentLayout from '@/components/student/StudentLayout';

interface ScoreTrendPoint {
  dateLabel: string;
  score: number;
  label: string;
  isActual: boolean;
  test_type?: string;
}

interface QuestionTypeTiming {
  type: string;
  avgTime: number;
  idealTime: number;
}

interface TimingCorrectVsIncorrect {
  category: string;
  avgTimeSpent: number;
  benchmarkTime: number;
}

interface AreaItem {
  name: string;
  progressPct: number;
  linkText: string;
}

interface AnalyticsData {
  total_tests: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  average_score_percent: number;
  estimated_verbal_score: number;
  estimated_quant_score: number;
  overall_gre_score: number;
  scoreTrendData: ScoreTrendPoint[];
  timingByQuestionType: QuestionTypeTiming[];
  timingCorrectVsIncorrect: TimingCorrectVsIncorrect[];
  topStrengthAreas: AreaItem[];
  topWeaknessAreas: AreaItem[];
  scoreRecommendations: string[];
  topic_performance?: Array<{ topic: string; correct: number; total: number; percentage: number }>;
}

const TEST_TYPE_OPTIONS = [
  { value: '', label: 'All Test Types' },
  { value: 'FULL_LENGTH', label: 'Full-Length GRE' },
  { value: 'SECTIONAL', label: 'Sectional Tests' },
  { value: 'TOPIC_WISE', label: 'Topic-Wise Tests' },
  { value: 'PRACTICE', label: 'Practice Tests' },
];

export default function GREAnalyticsPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState<(ScoreTrendPoint & { x: number; y: number }) | null>(null);

  // Filter states
  const [selectedTestType, setSelectedTestType] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showActualOnly, setShowActualOnly] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${GRE_API_URL}/api/analytics/my-analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.analytics || data.data || data);
        } else {
          setError('Failed to load analytics data');
        }
      } catch (err) {
        setError('Error loading analytics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) loadAnalytics();
  }, [token]);

  const trendData = useMemo(() => {
    if (!analytics?.scoreTrendData) return [];
    let filtered = analytics.scoreTrendData;
    if (selectedTestType) filtered = filtered.filter((item) => item.test_type === selectedTestType);
    if (dateFrom) filtered = filtered.filter((item) => { const d = new Date(item.dateLabel); return !isNaN(d.getTime()) && d >= new Date(dateFrom); });
    if (dateTo) filtered = filtered.filter((item) => { const d = new Date(item.dateLabel); return !isNaN(d.getTime()) && d <= new Date(dateTo); });
    if (showActualOnly) filtered = filtered.filter((item) => item.isActual);
    return filtered.length > 0 ? filtered : analytics.scoreTrendData;
  }, [analytics?.scoreTrendData, selectedTestType, dateFrom, dateTo, showActualOnly]);

  const timingByQuestionType = useMemo(() => {
    if (!analytics?.timingByQuestionType) return [];
    if (selectedSubject === 'ALL') return analytics.timingByQuestionType;
    if (selectedSubject === 'VERBAL') return analytics.timingByQuestionType.filter(t => ['Reading Comprehension', 'Text Completion', 'Sentence Equivalence', 'Verbal'].includes(t.type));
    if (selectedSubject === 'QUANT') return analytics.timingByQuestionType.filter(t => ['Algebra', 'Geometry', 'Data Analysis', 'Arithmetic', 'Quant'].includes(t.type));
    return analytics.timingByQuestionType.filter(t => t.type === 'AWA');
  }, [analytics?.timingByQuestionType, selectedSubject]);

  const timingCorrectVsIncorrect = analytics?.timingCorrectVsIncorrect || [];
  const topStrengthAreas = analytics?.topStrengthAreas || [];
  const topWeaknessAreas = analytics?.topWeaknessAreas || [];
  const scoreRecommendations = analytics?.scoreRecommendations || [];

  const clearFilters = () => {
    setSelectedTestType('');
    setSelectedSubject('ALL');
    setDateFrom('');
    setDateTo('');
    setShowActualOnly(false);
  };

  const hasActiveFilters = !!(selectedTestType || selectedSubject !== 'ALL' || dateFrom || dateTo || showActualOnly);

  const totalCompleted = analytics?.total_tests || 0;
  const estQuant = totalCompleted > 0 ? (analytics?.estimated_quant_score || 130) : 0;
  const estVerbal = totalCompleted > 0 ? (analytics?.estimated_verbal_score || 130) : 0;
  const estTotal = totalCompleted > 0 ? (analytics?.overall_gre_score || (estQuant + estVerbal)) : 0;
  const avgAccuracy = totalCompleted > 0 ? (analytics?.average_score_percent || 0) : 0;

  if (isLoading || loading) {
    return (
      <StudentLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #e61a8d', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div style={{ flex: 1, minWidth: 0 }}>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 18px', borderRadius: '10px', marginBottom: '24px', fontSize: '13px', fontWeight: '500' }}>
            {error}
          </div>
        )}

        {/* ── HEADER BANNER (Pink like all other pages) ── */}
        <div style={{
          backgroundColor: '#e61a8d', borderRadius: '16px', padding: '20px 24px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          boxShadow: '0 4px 12px rgba(230,26,141,0.2)', marginBottom: '24px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ backgroundColor: 'white', color: '#e61a8d', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ETS Analytics Platform
              </span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0 }}>
              Detailed Test Performance &amp; Behavioral Analytics
            </h1>
            <p style={{ color: '#fce7f3', fontSize: '12px', margin: '4px 0 0', fontWeight: '500' }}>
              Real-time aggregated performance metrics for <strong style={{ color: 'white' }}>{user?.name || 'Student'}</strong>
            </p>
          </div>

          {/* KPI Score Chips */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center', minWidth: '100px' }}>
              <span style={{ fontSize: '10px', color: '#fce7f3', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Est. Overall</span>
              <span style={{ fontSize: '22px', fontWeight: '800', color: 'white' }}>{totalCompleted > 0 ? estTotal : '0 / 340'}</span>
              <span style={{ fontSize: '9px', color: '#fce7f3', display: 'block' }}>({avgAccuracy}% Acc)</span>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: '10px', padding: '10px 14px', textAlign: 'center', minWidth: '80px' }}>
              <span style={{ fontSize: '10px', color: '#fce7f3', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Quant</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>{totalCompleted > 0 ? `${estQuant} / 170` : '0 / 170'}</span>
              <span style={{ fontSize: '9px', color: '#fce7f3', display: 'block' }}>/ 170</span>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: '10px', padding: '10px 14px', textAlign: 'center', minWidth: '80px' }}>
              <span style={{ fontSize: '10px', color: '#fce7f3', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Verbal</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>{totalCompleted > 0 ? `${estVerbal} / 170` : '0 / 170'}</span>
              <span style={{ fontSize: '9px', color: '#fce7f3', display: 'block' }}>/ 170</span>
            </div>
          </div>
        </div>

        {!analytics ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4', padding: '48px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p style={{ color: '#5a5a5a', fontSize: '15px', fontWeight: '600' }}>No test data available yet.</p>
            <p style={{ color: '#999', fontSize: '13px', marginTop: '8px' }}>Complete some tests to see analytics here!</p>
            <Link href="/user-dashboard/gre-schedule" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 24px', backgroundColor: '#e61a8d', color: 'white', textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
              Schedule a Test
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>

            {/* ── LEFT FILTER SIDEBAR ── */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>

              {/* Filter Panel */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ede9e4', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e61a8d" strokeWidth="2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                    </svg>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#2d2d2d' }}>Analytics Filters</span>
                  </div>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} style={{ fontSize: '11px', fontWeight: '700', color: '#e61a8d', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Reset
                    </button>
                  )}
                </div>

                {/* Test Format */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#5a5a5a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Test Format</label>
                  <select
                    value={selectedTestType}
                    onChange={(e) => setSelectedTestType(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#2d2d2d', outline: 'none', fontFamily: 'inherit' }}
                  >
                    {TEST_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                {/* Subject Filter */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#5a5a5a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Subject Area</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    {[{ id: 'ALL', label: 'All' }, { id: 'VERBAL', label: 'Verbal' }, { id: 'QUANT', label: 'Quant' }, { id: 'AWA', label: 'AWA' }].map(subj => (
                      <button
                        key={subj.id}
                        onClick={() => setSelectedSubject(subj.id)}
                        style={{
                          padding: '7px 6px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                          backgroundColor: selectedSubject === subj.id ? '#e61a8d' : '#fafafa',
                          color: selectedSubject === subj.id ? 'white' : '#5a5a5a',
                          border: `1px solid ${selectedSubject === subj.id ? '#e61a8d' : '#ede9e4'}`,
                          transition: 'all 0.15s',
                        }}
                      >
                        {subj.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div style={{ marginBottom: '16px', borderTop: '1px solid #ede9e4', paddingTop: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#5a5a5a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>Time Window</label>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '4px' }}>From Date</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '12px', color: '#2d2d2d', outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '4px' }}>To Date</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '12px', color: '#2d2d2d', outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                </div>

                {/* Actual Only Checkbox */}
                <div style={{ borderTop: '1px solid #ede9e4', paddingTop: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#5a5a5a', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showActualOnly} onChange={(e) => setShowActualOnly(e.target.checked)} style={{ accentColor: '#e61a8d', width: '14px', height: '14px' }} />
                    <span>Actual Completed Only</span>
                  </label>
                </div>
              </div>

              {/* Summary Metrics Card */}
              <div style={{ backgroundColor: '#e61a8d', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(230,26,141,0.2)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#fce7f3', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px', marginBottom: '14px', letterSpacing: '0.04em' }}>
                  Summary Metrics
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  {[
                    { label: 'Completed Tests', value: totalCompleted, color: 'white' },
                    { label: 'Avg Accuracy', value: totalCompleted > 0 ? `${avgAccuracy}%` : '0%', color: 'white' },
                    { label: 'Est. Quant', value: totalCompleted > 0 ? `${estQuant} / 170` : '0 / 170', color: 'white' },
                    { label: 'Est. Verbal', value: totalCompleted > 0 ? `${estVerbal} / 170` : '0 / 170', color: 'white' },
                    { label: 'Highest Score', value: totalCompleted > 0 ? (analytics?.highest_score || 0) : '0', color: 'white' },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < arr.length - 1 ? '8px' : '0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>
                      <span style={{ color: '#fce7f3' }}>{row.label}</span>
                      <span style={{ fontWeight: '800', color: row.color, fontSize: '13px' }}>{String(row.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </aside>

            {/* ── RIGHT ANALYTICS CONTENT ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* 1. Score Trend Line Chart */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ede9e4', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#2d2d2d', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e61a8d" strokeWidth="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
                      Score Trend Over Time
                    </h2>
                    <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0', fontWeight: '500' }}>Calculated from your submitted GRE test attempts</p>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#5a5a5a', backgroundColor: '#fafafa', padding: '4px 12px', borderRadius: '12px', border: '1px solid #ede9e4' }}>
                    {trendData.length} Test Point{trendData.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Interactive SVG Line Chart */}
                <div style={{ position: 'relative', height: '240px', width: '100%', border: '1px solid #ede9e4', borderRadius: '10px', backgroundColor: '#fafafa', padding: '14px' }}>
                  {/* Y-Axis labels */}
                  <div style={{ position: 'absolute', left: '14px', right: '14px', top: '20px', bottom: '20px', display: 'grid', gridTemplateRows: 'repeat(5, 1fr)', pointerEvents: 'none' }}>
                    {[340, 320, 300, 280, 260].map((scoreVal) => (
                      <div key={scoreVal} style={{ borderBottom: '1px dashed #ede9e4', display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '9px', color: '#bbb', marginTop: '-6px', fontWeight: '600' }}>{scoreVal}</span>
                      </div>
                    ))}
                  </div>

                  {trendData.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999', fontWeight: '600' }}>
                      No test data available for selected filters
                    </div>
                  ) : (
                    <svg style={{ position: 'relative', width: '100%', height: '100%' }} viewBox="0 0 800 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e61a8d" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#e61a8d" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const count = trendData.length;
                        const xStep = count > 1 ? 760 / (count - 1) : 380;
                        const points = trendData.map((pt, idx) => {
                          const x = 20 + (count > 1 ? idx * xStep : 380);
                          const sPct = Math.min(1, Math.max(0, (pt.score - 260) / 80));
                          const y = 175 - (sPct * 145);
                          return { x, y, ...pt };
                        });
                        const pathStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                        const areaStr = `${pathStr} L ${points[points.length - 1].x} 190 L ${points[0].x} 190 Z`;
                        return (
                          <>
                            <path d={areaStr} fill="url(#analyticsGrad)" />
                            <path d={pathStr} fill="none" stroke="#e61a8d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {points.map((pt, idx) => (
                              <g key={idx}>
                                <circle cx={pt.x} cy={pt.y} r="6" fill="#e61a8d" stroke="white" strokeWidth="2.5" />
                                <circle
                                  cx={pt.x} cy={pt.y} r="14" fill="transparent"
                                  style={{ cursor: 'pointer' }}
                                  onMouseEnter={() => setHoveredPoint(pt)}
                                  onMouseLeave={() => setHoveredPoint(null)}
                                />
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  )}

                  {/* Hover Tooltip */}
                  {hoveredPoint && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#2d2d2d', color: 'white', padding: '10px 14px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', fontSize: '12px', zIndex: 20, pointerEvents: 'none', minWidth: '160px' }}>
                      <div style={{ fontWeight: '800', color: '#e61a8d', marginBottom: '4px' }}>{hoveredPoint.label}</div>
                      <div style={{ color: '#eee', fontWeight: '600' }}>Score: <strong>{hoveredPoint.score}</strong></div>
                      <div style={{ color: '#aaa', fontSize: '11px' }}>Format: {hoveredPoint.test_type || 'GRE Test'}</div>
                      <div style={{ color: '#888', fontSize: '10px', marginTop: '2px' }}>{hoveredPoint.dateLabel}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Timing Analysis: Two Charts Side-by-Side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Chart A: Avg Time per Question Type */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#2d2d2d', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e61a8d" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    Avg Time per Question Type (sec)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {timingByQuestionType.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: '#bbb', fontWeight: '600' }}>No timing data found</div>
                    ) : (
                      timingByQuestionType.map((item, idx) => {
                        const maxVal = Math.max(...timingByQuestionType.map(t => Math.max(t.avgTime, t.idealTime)), 120);
                        const avgPct = Math.min(100, Math.round((item.avgTime / maxVal) * 100));
                        const over = item.avgTime > item.idealTime;
                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#5a5a5a', marginBottom: '5px' }}>
                              <span>{item.type}</span>
                              <span style={{ color: over ? '#e11d48' : '#059669' }}>{item.avgTime}s <span style={{ fontSize: '10px', fontWeight: '400', color: '#999' }}>(ideal: {item.idealTime}s)</span></span>
                            </div>
                            <div style={{ width: '100%', backgroundColor: '#f5f0eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                              <div style={{ backgroundColor: over ? '#e11d48' : '#e61a8d', height: '8px', borderRadius: '4px', width: `${avgPct}%`, transition: 'width 0.5s ease' }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Chart B: Pacing Correct vs Incorrect */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#2d2d2d', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                    Pacing: Correct vs Incorrect
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {timingCorrectVsIncorrect.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: '#bbb', fontWeight: '600' }}>No pacing data available</div>
                    ) : (
                      timingCorrectVsIncorrect.map((item, idx) => {
                        const isCorrect = item.category.toLowerCase().includes('correct') && !item.category.toLowerCase().includes('inc');
                        const color = isCorrect ? '#10b981' : '#ef4444';
                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#5a5a5a', marginBottom: '5px' }}>
                              <span>{item.category} Questions</span>
                              <span style={{ color }}>{item.avgTimeSpent}s / question</span>
                            </div>
                            <div style={{ width: '100%', backgroundColor: '#f5f0eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                              <div style={{ backgroundColor: color, height: '8px', borderRadius: '4px', width: `${Math.min(100, Math.max(10, item.avgTimeSpent))}%`, transition: 'width 0.5s ease' }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Strength & Weakness Side-by-Side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Strengths */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#065f46', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Top Strength Areas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {topStrengthAreas.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#bbb', fontWeight: '600' }}>Complete more tests to generate strength metrics</div>
                    ) : (
                      topStrengthAreas.map((area, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#2d2d2d', marginBottom: '4px' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{area.name}</span>
                            <span style={{ color: '#059669', fontWeight: '800', flexShrink: 0 }}>{area.progressPct}%</span>
                          </div>
                          <div style={{ width: '100%', backgroundColor: '#f5f0eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: '#10b981', height: '8px', borderRadius: '4px', width: `${area.progressPct}%`, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Weaknesses */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#991b1b', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Top Weakness &amp; Priority Areas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {topWeaknessAreas.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#bbb', fontWeight: '600' }}>No critical weakness areas detected yet</div>
                    ) : (
                      topWeaknessAreas.map((area, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#2d2d2d', marginBottom: '4px' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{area.name}</span>
                            <span style={{ color: '#991b1b', fontWeight: '800', flexShrink: 0 }}>{area.progressPct}%</span>
                          </div>
                          <div style={{ width: '100%', backgroundColor: '#f5f0eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: '#ef4444', height: '8px', borderRadius: '4px', width: `${area.progressPct}%`, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Personalized Recommendations */}
              <div style={{ backgroundColor: '#fdf2f8', borderRadius: '12px', border: '1px solid #fbcfe8', padding: '20px', boxShadow: '0 2px 8px rgba(230,26,141,0.06)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#be185d', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e61a8d" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Personalized Score Improvement Recommendations
                </h3>
                <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(scoreRecommendations.length > 0 ? scoreRecommendations : [
                    'Review weak geometry and coordinate geometry question types.',
                    'Increase speed on Text Completion 3-Blank questions.',
                    'Practice timing strategies for multi-select reading passages.',
                  ]).map((rec, idx) => (
                    <li key={idx} style={{ fontSize: '13px', fontWeight: '500', color: '#9a3197', lineHeight: '1.6' }}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* 5. Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', paddingBottom: '8px' }}>
                <Link
                  href="/user-dashboard/gre-schedule"
                  style={{ padding: '12px 24px', backgroundColor: '#e61a8d', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', boxShadow: '0 2px 8px rgba(230,26,141,0.2)' }}
                >
                  Schedule Another Test
                </Link>
                <Link
                  href="/user-dashboard/gre-dashboard"
                  style={{ padding: '12px 24px', backgroundColor: 'white', color: '#5a5a5a', textDecoration: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', border: '1px solid #ede9e4' }}
                >
                  Back to Dashboard
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}
