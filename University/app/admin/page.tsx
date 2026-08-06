'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { API_URL } from '@/lib/config';

interface DashboardStats {
    pending_count: number;
    approved_count: number;
    redis_stats: {
        total_colleges: number;
        cache_ttl: string;
    };
}

export default function AdminDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchStats();
        }
    }, [token]);

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            {}
            <div className="card border-0 shadow-sm mb-4" style={{
                background: 'linear-gradient(135deg, #070642 0%, #1a0f5c 100%)',
                color: 'white',
                borderRadius: '8px'
            }}>
                <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1" style={{ fontSize: '20px', fontWeight: '600' }}>Welcome to Admin Dashboard</h4>
                            <p className="mb-0 opacity-75" style={{ fontSize: '13px' }}>Manage your university data efficiently</p>
                        </div>
                        <button
                            onClick={fetchStats}
                            className="btn btn-light btn-sm"
                            disabled={loading}
                            style={{ fontSize: '13px', padding: '6px 16px' }}
                        >
                            <i className="fas fa-sync-alt me-1"></i>
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #f59e0b', borderRadius: '8px' }}>
                        <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>
                                        Pending Colleges
                                    </p>
                                    <h2 className="mb-0 font-weight-bold" style={{ color: '#f59e0b', fontSize: '28px' }}>
                                        {loading ? '...' : stats?.pending_count || 0}
                                    </h2>
                                    <small className="text-muted" style={{ fontSize: '12px' }}>Awaiting approval</small>
                                </div>
                                <div className="p-2 rounded-circle" style={{ backgroundColor: '#fef3c7' }}>
                                    <i className="fas fa-clock" style={{ color: '#f59e0b', fontSize: '20px' }}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #10b981', borderRadius: '8px' }}>
                        <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>
                                        Approved Colleges
                                    </p>
                                    <h2 className="mb-0 font-weight-bold" style={{ color: '#10b981', fontSize: '28px' }}>
                                        {loading ? '...' : stats?.approved_count || 0}
                                    </h2>
                                    <small className="text-muted" style={{ fontSize: '12px' }}>Live on platform</small>
                                </div>
                                <div className="p-2 rounded-circle" style={{ backgroundColor: '#d1fae5' }}>
                                    <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '20px' }}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #3b82f6', borderRadius: '8px' }}>
                        <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>
                                        Redis Cache
                                    </p>
                                    <h2 className="mb-0 font-weight-bold" style={{ color: '#3b82f6', fontSize: '28px' }}>
                                        {loading ? '...' : stats?.redis_stats?.total_colleges || 0}
                                    </h2>
                                    <small className="text-muted" style={{ fontSize: '12px' }}>Cached entries</small>
                                </div>
                                <div className="p-2 rounded-circle" style={{ backgroundColor: '#dbeafe' }}>
                                    <i className="fas fa-database" style={{ color: '#3b82f6', fontSize: '20px' }}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="row g-3">
                {}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '8px' }}>
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 font-weight-bold" style={{ fontSize: '15px' }}>
                                <i className="fas fa-university me-2" style={{ color: '#070642' }}></i>
                                College Management
                            </h6>
                        </div>
                        <div className="card-body p-3">
                            <div className="d-grid gap-2">
                                <a
                                    href="/admin/pending"
                                    className="btn text-start d-flex align-items-center justify-content-between"
                                    style={{
                                        backgroundColor: '#fef3c7',
                                        color: '#f59e0b',
                                        border: 'none',
                                        fontWeight: '500',
                                        fontSize: '13px',
                                        padding: '10px 14px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <span>
                                        <i className="fas fa-clock me-2"></i>
                                        Pending Colleges
                                    </span>
                                    <span className="badge" style={{ backgroundColor: '#f59e0b', color: 'white', fontSize: '11px' }}>
                                        {stats?.pending_count || 0}
                                    </span>
                                </a>

                                <a
                                    href="/admin/approved"
                                    className="btn text-start d-flex align-items-center justify-content-between"
                                    style={{
                                        backgroundColor: '#d1fae5',
                                        color: '#10b981',
                                        border: 'none',
                                        fontWeight: '500',
                                        fontSize: '13px',
                                        padding: '10px 14px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <span>
                                        <i className="fas fa-check-circle me-2"></i>
                                        Approved Colleges
                                    </span>
                                    <span className="badge" style={{ backgroundColor: '#10b981', color: 'white', fontSize: '11px' }}>
                                        {stats?.approved_count || 0}
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '8px' }}>
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 font-weight-bold" style={{ fontSize: '15px' }}>
                                <i className="fas fa-database me-2" style={{ color: '#3b82f6' }}></i>
                                Redis Management
                            </h6>
                        </div>
                        <div className="card-body p-3">
                            <div className="d-grid gap-2">
                                <a
                                    href="/admin/redis"
                                    className="btn text-start"
                                    style={{
                                        backgroundColor: '#dbeafe',
                                        color: '#3b82f6',
                                        border: 'none',
                                        fontWeight: '500',
                                        fontSize: '13px',
                                        padding: '10px 14px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <i className="fas fa-cog me-2"></i>
                                    Redis Dashboard
                                </a>

                                <div className="alert mb-0" style={{
                                    backgroundColor: '#dbeafe',
                                    border: 'none',
                                    color: '#1e40af',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>
                                            <strong>Cache TTL:</strong> {stats?.redis_stats?.cache_ttl || 'N/A'}
                                        </span>
                                        <i className="fas fa-info-circle"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="row g-3 mt-3">
                {}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '8px' }}>
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 font-weight-bold" style={{ fontSize: '15px' }}>
                                <i className="fas fa-graduation-cap me-2" style={{ color: '#e61a8d' }}></i>
                                GRE Test Management
                            </h6>
                        </div>
                        <div className="card-body p-3">
                            <div className="d-grid gap-2">
                                <a
                                    href="/admin/gre"
                                    className="btn text-start"
                                    style={{
                                        backgroundColor: '#fce7f3',
                                        color: '#e61a8d',
                                        border: 'none',
                                        fontWeight: '500',
                                        fontSize: '13px',
                                        padding: '10px 14px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <i className="fas fa-book-reader me-2"></i>
                                    Manage GRE Tests
                                </a>

                                <div className="alert mb-0" style={{
                                    backgroundColor: '#fce7f3',
                                    border: 'none',
                                    color: '#be185d',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>
                                            <strong>Graduate Readiness Exam</strong>
                                        </span>
                                        <i className="fas fa-calendar-check"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '8px' }}>
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 font-weight-bold" style={{ fontSize: '15px' }}>
                                <i className="fas fa-clipboard-check me-2" style={{ color: '#8b5cf6' }}></i>
                                Test Results Management
                            </h6>
                        </div>
                        <div className="card-body p-3">
                            <div className="d-grid gap-2">
                                <a
                                    href="/admin/test-results"
                                    className="btn text-start"
                                    style={{
                                        backgroundColor: '#ede9fe',
                                        color: '#8b5cf6',
                                        border: 'none',
                                        fontWeight: '500',
                                        fontSize: '13px',
                                        padding: '10px 14px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <i className="fas fa-chart-bar me-2"></i>
                                    View All Test Results
                                </a>

                                <div className="alert mb-0" style={{
                                    backgroundColor: '#ede9fe',
                                    border: 'none',
                                    color: '#6d28d9',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>
                                            <strong>MVTI & Cognitive Tests</strong>
                                        </span>
                                        <i className="fas fa-graduation-cap"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '8px' }}>
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 font-weight-bold" style={{ fontSize: '15px' }}>
                                <i className="fas fa-users me-2" style={{ color: '#ef4444' }}></i>
                                User Management
                            </h6>
                        </div>
                        <div className="card-body p-3">
                            <div className="d-grid gap-2">
                                <a
                                    href="/admin/users"
                                    className="btn text-start"
                                    style={{
                                        backgroundColor: '#fee2e2',
                                        color: '#ef4444',
                                        border: 'none',
                                        fontWeight: '500',
                                        fontSize: '13px',
                                        padding: '10px 14px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <i className="fas fa-user-cog me-2"></i>
                                    Manage Users
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
