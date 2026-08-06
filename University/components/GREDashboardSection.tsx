'use client';

import Link from 'next/link';

const BookOpenIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

interface GREDashboardSectionProps {
  stats?: {
    testsScheduled: number;
    testsCompleted: number;
    averageScore: number;
  };
}

export default function GREDashboardSection({ stats }: GREDashboardSectionProps) {
  return (
    <div style={{ marginTop: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <BookOpenIcon />
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#2d2d2d', margin: 0 }}>
          GRE Tests
        </h2>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            backgroundColor: '#fff3f8',
            border: '1px solid #fde8f5',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{ color: '#5a5a5a', fontSize: '12px', marginBottom: '6px' }}>Scheduled</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#e61a8d' }}>
              {stats.testsScheduled}
            </div>
          </div>

          <div style={{
            backgroundColor: '#e8f5f9',
            border: '1px solid #b3e5fc',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{ color: '#5a5a5a', fontSize: '12px', marginBottom: '6px' }}>Completed</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#0288d1' }}>
              {stats.testsCompleted}
            </div>
          </div>

          <div style={{
            backgroundColor: '#e8f5e9',
            border: '1px solid #c8e6c9',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{ color: '#5a5a5a', fontSize: '12px', marginBottom: '6px' }}>Avg Score</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
              {stats.averageScore}
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        <Link
          href="/user-dashboard/gre-tests"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            backgroundColor: 'white',
            border: '1px solid #ede9e4',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#2d2d2d',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = '#faf4ec';
            (e.target as HTMLElement).style.borderColor = '#e61a8d';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'white';
            (e.target as HTMLElement).style.borderColor = '#ede9e4';
          }}
        >
          <TrophyIcon />
          <span>My Tests</span>
        </Link>

        <Link
          href="/user-dashboard/gre-schedule"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            backgroundColor: 'white',
            border: '1px solid #ede9e4',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#2d2d2d',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = '#faf4ec';
            (e.target as HTMLElement).style.borderColor = '#e61a8d';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'white';
            (e.target as HTMLElement).style.borderColor = '#ede9e4';
          }}
        >
          <CalendarIcon />
          <span>Schedule Test</span>
        </Link>
      </div>
    </div>
  );
}
