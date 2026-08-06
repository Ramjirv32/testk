'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GRE_API_URL } from '@/lib/config';

interface StudentLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    path: '/user-dashboard/gre-dashboard',
    label: 'Dashboard Overview',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    path: '/user-dashboard/gre-tickets',
    label: 'Raise Ticket & Support Chat',
    badgeKey: 'tickets',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    path: '/user-dashboard/gre-tests',
    label: 'My Tests & Results',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    path: '/user-dashboard/gre-schedule',
    label: 'Schedule New Test',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    path: '/user-dashboard/gre-analytics',
    label: 'Performance Analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    path: '/user-dashboard/gre-profile',
    label: 'My Profile & Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!token) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${GRE_API_URL}/api/tickets/unread-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.total_unread || data.data?.total_unread || 0);
        }
      } catch (err) {
        // Silent catch
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf4ec', display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Top Header Bar */}
      <header className="no-print" style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #ede9e4',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/user-dashboard/gre-dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e61a8d', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>
              🎓
            </div>
            <div>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#2d2d2d', letterSpacing: '-0.3px' }}>
                Top Ranking University
              </span>
              <span style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#e61a8d' }}>
                GRE Student Testing Portal
              </span>
            </div>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 14px', backgroundColor: '#fdf2f8', borderRadius: '20px', border: '1px solid #fbcfe8' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e61a8d', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
              {(user?.name || 'S').charAt(0)}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#2d2d2d' }}>{user?.name || 'Student'}</p>
              <p style={{ margin: 0, fontSize: '10px', color: '#6b7280' }}>{user?.email || 'student@gre.com'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #f3d4e6',
              backgroundColor: 'white',
              color: '#e61a8d',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Body Area */}
      <div style={{ display: 'flex', width: '100%', maxWidth: '1440px', margin: '0 auto', gap: '24px', padding: '24px', flex: 1 }}>
        {/* Left Sidebar */}
        <aside className="no-print" style={{
          width: '260px', backgroundColor: 'white', borderRadius: '16px',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)', maxHeight: 'fit-content', overflowY: 'auto'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #ede9e4' }}>
            <Link href="/user-dashboard/gre-profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fde8f5', color: '#e61a8d',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px'
              }}>
                {(user?.name || 'S').charAt(0)}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#2d2d2d' }}>{user?.name || 'Student'}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#e61a8d' }}>My Profile & Settings →</p>
              </div>
            </Link>
          </div>

          <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            {menuItems.map((item) => {
              const active = pathname === item.path || pathname.startsWith(item.path + '/');
              const showBadge = item.badgeKey === 'tickets' && unreadCount > 0;

              return (
                <Link
                  key={item.path + item.label}
                  href={item.path}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: '8px',
                    textDecoration: 'none', fontSize: '13px', fontWeight: '600',
                    color: active ? 'white' : '#5a5a5a',
                    backgroundColor: active ? '#e61a8d' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: active ? 'white' : '#e61a8d' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {showBadge && (
                    <span style={{
                      backgroundColor: '#e11d48', color: 'white', fontSize: '10px',
                      fontWeight: '800', padding: '2px 8px', borderRadius: '10px',
                      boxShadow: '0 2px 4px rgba(225,29,72,0.3)',
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div style={{ padding: '16px', borderTop: '1px solid #ede9e4', fontSize: '11px', color: '#999' }}>
            <p style={{ margin: 0, fontWeight: '700', color: '#5a5a5a' }}>GRE Testing Platform</p>
            <p style={{ margin: '4px 0 0 0' }}>Student Portal</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: 0, padding: '0' }}>
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media print {
          aside, nav, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
