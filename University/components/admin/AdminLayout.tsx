'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/config';
import { get } from '@/lib/fetch-wrapper';
import Link from 'next/link';
import Image from 'next/image';

interface AdminLayoutProps {
    children: React.ReactNode;
}

interface PendingCounts {
    mbti: number;
    cognitive: number;
    psychometric: number;
    pescio: number;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { user, isAdmin, logout, isLoading, token } = useAuth();
    const router = useRouter();
    
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [greDropdownOpen, setGreDropdownOpen] = useState(false);
    const [pendingCounts, setPendingCounts] = useState<PendingCounts>({
        mbti: 0,
        cognitive: 0,
        psychometric: 0,
        pescio: 0
    });
    const [grePendingTickets, setGrePendingTickets] = useState(0);

    // Keep GRE dropdown open when on any GRE-related page
    useEffect(() => {
        const isGrePath = pathname.startsWith('/admin/gre');
        setGreDropdownOpen(isGrePath);
    }, [pathname]);

    useEffect(() => {
        if (!isLoading && (!user || !isAdmin())) {
            router.push('/login');
        }
    }, [user, isLoading, isAdmin, router]);

    useEffect(() => {
        if (token && user && isAdmin()) {
            fetchPendingCounts();
            fetchGreTickets();
        }
    }, [token, user]);

    const fetchGreTickets = async () => {
        try {
            const result = await get(`${API_URL}/api/admin/tickets?status=PENDING`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (result.ok && result.data) {
                const count = result.data.tickets?.length ?? result.data.data?.tickets?.length ?? 0;
                setGrePendingTickets(count);
            } else {
                console.warn('Failed to fetch GRE tickets:', result.error);
            }
        } catch (error) {
            console.error('Failed to fetch GRE pending tickets:', error);
        }
    };

    const fetchPendingCounts = async () => {
        try {
            const testTypes = ['mbti', 'cognitive', 'psychometric', 'pescio'];
            const counts: PendingCounts = {
                mbti: 0,
                cognitive: 0,
                psychometric: 0,
                pescio: 0
            };

            for (const testType of testTypes) {
                try {
                    const response = await fetch(`${API_URL}/api/admin/${testType}/registrations`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const pending = data.registrations?.filter((reg: any) => reg.status === 'pending')?.length || 0;
                        counts[testType as keyof PendingCounts] = pending;
                    }
                } catch (error) {
                    console.error(`Failed to fetch ${testType} pending count:`, error);
                }
            }

            setPendingCounts(counts);
        } catch (error) {
            console.error('Failed to fetch pending counts:', error);
        }
    };

    if (isLoading || !user || !isAdmin()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading...</p>
                </div>
            </div>
        );
    }

    const menuItems = [
        {
            name: 'Dashboard',
            icon: 'fas fa-home',
            path: '/admin',
            color: '#070642'
        },

        {
            name: 'Pending Colleges',
            icon: 'fas fa-clock',
            path: '/admin/pending',
            color: '#f59e0b'
        },

        {
            name: 'Approved Colleges',
            icon: 'fas fa-check-circle',
            path: '/admin/approved',
            color: '#10b981'
        },

        {
            name: 'MBTI Test Approvals',
            icon: 'fas fa-person-circle',
            path: '/admin/mbti',
            color: '#dc2626',
            badgeType: 'mbti'
        },

        {
            name: 'Cognitive Test Approvals',
            icon: 'fas fa-brain',
            path: '/admin/cognitive',
            color: '#2563eb',
            badgeType: 'cognitive'
        },

        {
            name: 'Psychometric Test Approvals',
            icon: 'fas fa-chart-pie',
            path: '/admin/psychometric',
            color: '#9a3197',
            badgeType: 'psychometric'
        },

        {
            name: 'PESCIO Test Approvals',
            icon: 'fas fa-compass',
            path: '/admin/pescio',
            color: '#06b6d4',
            badgeType: 'pescio'
        },
        {
            name: 'GRE Management',
            icon: 'fas fa-graduation-cap',
            path: '/admin/gre',
            color: '#e61a8d',
            isDropdown: true,
            submenu: [
                {
                    name: 'Dashboard',
                    icon: 'fas fa-chart-line',
                    path: '/admin/gre',
                    color: '#e61a8d'
                },
                {
                    name: 'Test Tickets',
                    icon: 'fas fa-ticket-alt',
                    path: '/admin/gre-tickets',
                    color: '#e61a8d',
                    badge: grePendingTickets
                },
                {
                    name: 'Test Allocations',
                    icon: 'fas fa-clipboard-list',
                    path: '/admin/gre-allocations',
                    color: '#e61a8d'
                },
                {
                    name: 'Test Results',
                    icon: 'fas fa-poll',
                    path: '/admin/gre-test-results',
                    color: '#e61a8d'
                },
                {
                    name: 'Students',
                    icon: 'fas fa-user-graduate',
                    path: '/admin/gre-students',
                    color: '#e61a8d'
                },
                {
                    name: 'Audit Trail',
                    icon: 'fas fa-history',
                    path: '/admin/gre-audit',
                    color: '#e61a8d'
                },
                {
                    name: 'Question Bank',
                    icon: 'fas fa-book',
                    path: '/admin/gre-question-bank',
                    color: '#e61a8d'
                }
            ]
        },
        {
            name: 'Redis Management',
            icon: 'fas fa-database',
            path: '/admin/redis',
            color: '#3b82f6'
        },

        {
            name: 'Users',
            icon: 'fas fa-users',
            path: '/admin/users',
            color: '#ef4444'
        }
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
            {}
            <nav className="fixed top-0 left-0 right-0 z-50" style={{
                backgroundColor: '#070642',
                height: '70px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <div className="h-full px-4 d-flex align-items-center justify-content-between">
                    {}
                    <div className="d-flex align-items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="btn btn-link text-white p-0"
                            style={{ fontSize: '24px' }}
                        >
                            <i className="fas fa-bars"></i>
                        </button>
                        <Link href="/" className="d-flex align-items-center gap-2 text-decoration-none">
                            <Image
                                src="/images/tru-icon.png"
                                alt="TRU"
                                width={40}
                                height={40}
                            />
                            <span className="text-white font-weight-bold" style={{ fontSize: '20px' }}>
                                TRU Admin
                            </span>
                        </Link>
                    </div>

                    {}
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-white d-none d-md-block">
                            <small className="d-block opacity-75">Welcome,</small>
                            <strong>{user.email}</strong>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <Link href="/" className="btn btn-outline-light btn-sm">
                                <i className="fas fa-home me-1"></i>
                                Home
                            </Link>
                            <button
                                onClick={logout}
                                className="btn btn-danger btn-sm"
                            >
                                <i className="fas fa-sign-out-alt me-1"></i>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {}
            <aside
                className="fixed top-0 left-0 h-full transition-all duration-300 z-40"
                style={{
                    width: sidebarOpen ? '240px' : '0',
                    backgroundColor: '#ffffff',
                    marginTop: '70px',
                    boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}
            >
                <div className="p-3">
                    <h6 className="text-muted text-uppercase mb-3" style={{ fontSize: '11px', letterSpacing: '0.8px', fontWeight: '600' }}>
                        Admin Panel
                    </h6>
                    <nav>
                        {menuItems.map((item: any) => {
                            const isActive = pathname === item.path;
                            const isGrePath = item.isDropdown && (pathname.startsWith('/admin/gre'));
                            
                            return (
                                <div key={item.path}>
                                    {item.isDropdown ? (
                                        <>
                                            <button
                                                onClick={() => setGreDropdownOpen(!greDropdownOpen)}
                                                className="d-flex align-items-center gap-2 text-decoration-none w-100 p-2 rounded transition-all border-0"
                                                style={{
                                                    backgroundColor: greDropdownOpen || isGrePath ? `${item.color}15` : 'transparent',
                                                    color: greDropdownOpen || isGrePath ? item.color : '#6c757d',
                                                    borderLeft: greDropdownOpen || isGrePath ? `3px solid ${item.color}` : '3px solid transparent',
                                                    fontWeight: greDropdownOpen || isGrePath ? '600' : '400',
                                                    fontSize: '13px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <i className={item.icon} style={{ width: '16px', color: item.color, fontSize: '13px' }}></i>
                                                <span className="flex-grow-1" style={{ textAlign: 'left' }}>{item.name}</span>
                                                <i 
                                                    className="fas fa-chevron-down" 
                                                    style={{ 
                                                        fontSize: '11px', 
                                                        transform: greDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s'
                                                    }}
                                                ></i>
                                            </button>
                                            {greDropdownOpen && item.submenu && (
                                                <div style={{ paddingLeft: '12px', marginTop: '4px' }}>
                                                    {item.submenu.map((subitem: any) => {
                                                        const isSubActive = pathname === subitem.path;
                                                        return (
                                                            <Link
                                                                key={subitem.path}
                                                                href={subitem.path}
                                                                className="d-flex align-items-center gap-2 text-decoration-none mb-1 p-2 rounded transition-all"
                                                                style={{
                                                                    backgroundColor: isSubActive ? `${subitem.color}15` : 'transparent',
                                                                    color: isSubActive ? subitem.color : '#6c757d',
                                                                    borderLeft: isSubActive ? `3px solid ${subitem.color}` : '3px solid transparent',
                                                                    fontWeight: isSubActive ? '600' : '400',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                <i className={subitem.icon} style={{ width: '14px', color: subitem.color, fontSize: '12px' }}></i>
                                                                <span className="flex-grow-1">{subitem.name}</span>
                                                                {subitem.badge !== undefined && subitem.badge > 0 && (
                                                                    <span 
                                                                        className="badge text-white" 
                                                                        style={{ 
                                                                            fontSize: '9px', 
                                                                            padding: '2px 4px',
                                                                            backgroundColor: '#f59e0b'
                                                                        }}
                                                                    >
                                                                        {subitem.badge}
                                                                    </span>
                                                                )}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            href={item.path}
                                            className="d-flex align-items-center gap-2 text-decoration-none mb-1 p-2 rounded transition-all"
                                            style={{
                                                backgroundColor: isActive ? `${item.color}15` : 'transparent',
                                                color: isActive ? item.color : '#6c757d',
                                                borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                                                fontWeight: isActive ? '600' : '400',
                                                fontSize: '13px'
                                            }}
                                        >
                                            <i className={item.icon} style={{ width: '16px', color: item.color, fontSize: '13px' }}></i>
                                            <span className="flex-grow-1">{item.name}</span>
                                            {item.badgeType && (
                                                <span 
                                                    className="badge text-white" 
                                                    style={{ 
                                                        fontSize: '10px', 
                                                        padding: '2px 6px',
                                                        backgroundColor: pendingCounts[item.badgeType as keyof PendingCounts] > 0 ? '#f59e0b' : '#d1d5db'
                                                    }}
                                                >
                                                    P-{pendingCounts[item.badgeType as keyof PendingCounts]}
                                                </span>
                                            )}
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {}
            <main
                className="transition-all duration-300"
                style={{
                    marginLeft: sidebarOpen ? '240px' : '0',
                    marginTop: '70px',
                    minHeight: 'calc(100vh - 70px)',
                    padding: '24px'
                }}
            >
                {children}
            </main>

            {}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 d-lg-none"
                    style={{ marginTop: '70px' }}
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <style jsx>{`
        .transition-all {
          transition: all 0.3s ease;
        }
        aside::-webkit-scrollbar {
          width: 6px;
        }
        aside::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        aside::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        aside::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
        </div>
    );
}
