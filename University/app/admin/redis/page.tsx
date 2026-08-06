'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { API_URL } from '@/lib/config';

interface RedisStats {
    total_colleges: number;
    cache_ttl: string;
    timestamp: string;
}

interface Toast {
    message: string;
    type: 'success' | 'error' | 'info';
}

export default function RedisManagementPage() {
    const { user, token, isAdmin, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<RedisStats | null>(null);
    const [cachedColleges, setCachedColleges] = useState<string[]>([]);
    const [filteredColleges, setFilteredColleges] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState<Toast | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || !isAdmin())) {
            router.push('/login');
        }
    }, [user, authLoading, isAdmin, router]);

    useEffect(() => {
        if (token && isAdmin()) {
            fetchRedisStats();
            fetchCachedColleges();
        }
    }, [token]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        if (searchQuery) {
            setFilteredColleges(cachedColleges.filter(college =>
                college.toLowerCase().includes(searchQuery.toLowerCase())
            ));
        } else {
            setFilteredColleges(cachedColleges);
        }
    }, [searchQuery, cachedColleges]);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    };

    const fetchRedisStats = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/redis/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch Redis stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCachedColleges = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/redis/colleges`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCachedColleges(data.colleges || []);
                setFilteredColleges(data.colleges || []);
            }
        } catch (error) {
            console.error('Failed to fetch cached colleges:', error);
        }
    };

    const handlePopulateRedis = async () => {
        if (!confirm('This will populate Redis with all approved colleges. Continue?')) {
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/redis/populate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                showToast(`Successfully populated Redis with ${data.count} colleges!`, 'success');
                fetchRedisStats();
                fetchCachedColleges();
                window.location.reload();
            } else {
                const data = await response.json();
                showToast(`Failed: ${data.error}`, 'error');
            }
        } catch (error) {
            showToast('Failed to populate Redis', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClearRedis = async () => {
        if (!confirm(' This will clear ALL college data from Redis cache. Are you sure?')) {
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/redis/clear`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                showToast('Redis cache cleared successfully!', 'success');
                fetchRedisStats();
                fetchCachedColleges();
                window.location.reload();
            } else {
                const data = await response.json();
                showToast(`Failed: ${data.error}`, 'error');
            }
        } catch (error) {
            showToast('Failed to clear Redis', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCached = async (collegeName: string) => {
        if (!confirm(`Delete "${collegeName}" from Redis cache?`)) {
            return;
        }

        setDeleteLoading(collegeName);
        try {
            const response = await fetch(`${API_URL}/api/admin/redis/delete/${encodeURIComponent(collegeName)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                showToast(`${collegeName} deleted from cache!`, 'success');
                fetchRedisStats();
                fetchCachedColleges();
                window.location.reload();
            } else {
                const data = await response.json();
                showToast(`Failed: ${data.error}`, 'error');
            }
        } catch (error) {
            showToast('Failed to delete from cache', 'error');
        } finally {
            setDeleteLoading(null);
        }
    };

    if (authLoading || loading) {
        return (
            <AdminLayout>
                <div className="text-center py-5">
                    <div className="spinner-border" style={{ color: '#070642' }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted" style={{ fontSize: '13px' }}>Loading Redis data...</p>
                </div>
            </AdminLayout>
        );
    }

    if (!user || !isAdmin()) {
        return null;
    }

    return (
        <AdminLayout>
            {}
            <div className="mb-4">
                <h3 className="mb-1" style={{ color: '#070642', fontWeight: '700', fontSize: '24px' }}>
                    <i className="fas fa-database me-2"></i>
                    Redis Management
                </h3>
                <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                    Manage Redis cache for college data
                </p>
            </div>

            {}
            <div className="row g-3 mb-4">
                {}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 font-weight-bold" style={{ fontSize: '15px' }}>
                                <i className="fas fa-chart-bar me-2" style={{ color: '#3b82f6' }}></i>
                                Cache Statistics
                            </h6>
                        </div>
                        <div className="card-body p-3">
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-muted" style={{ fontSize: '13px' }}>Total Cached Colleges</span>
                                    <span className="h4 mb-0 font-weight-bold" style={{ color: '#3b82f6' }}>
                                        {stats?.total_colleges || 0}
                                    </span>
                                </div>
                                <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
                                    <div
                                        className="progress-bar"
                                        role="progressbar"
                                        style={{ width: '100%', backgroundColor: '#3b82f6' }}
                                    ></div>
                                </div>
                            </div>

                            <div className="mb-3 pb-3 border-bottom">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted" style={{ fontSize: '13px' }}>Cache TTL</span>
                                    <span className="badge" style={{
                                        backgroundColor: '#dbeafe',
                                        color: '#3b82f6',
                                        fontSize: '11px',
                                        padding: '4px 10px'
                                    }}>
                                        {stats?.cache_ttl || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-0">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted" style={{ fontSize: '13px' }}>Last Updated</span>
                                    <span className="text-muted" style={{ fontSize: '12px' }}>
                                        {stats?.timestamp ? new Date(stats.timestamp).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 font-weight-bold" style={{ fontSize: '15px' }}>
                                <i className="fas fa-cogs me-2" style={{ color: '#070642' }}></i>
                                Cache Actions
                            </h6>
                        </div>
                        <div className="card-body p-3">
                            <div className="d-grid gap-2">
                                <button
                                    onClick={handlePopulateRedis}
                                    className="btn"
                                    disabled={actionLoading}
                                    style={{
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        padding: '10px'
                                    }}
                                >
                                    {actionLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-download me-2"></i>
                                            Populate Redis from DB
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleClearRedis}
                                    className="btn"
                                    disabled={actionLoading}
                                    style={{
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        padding: '10px'
                                    }}
                                >
                                    <i className="fas fa-trash me-2"></i>
                                    Clear Redis Cache
                                </button>

                                <button
                                    onClick={() => { fetchRedisStats(); fetchCachedColleges(); }}
                                    className="btn"
                                    disabled={actionLoading}
                                    style={{
                                        backgroundColor: '#dbeafe',
                                        color: '#3b82f6',
                                        border: 'none',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        padding: '10px'
                                    }}
                                >
                                    <i className="fas fa-sync-alt me-2"></i>
                                    Refresh Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="card border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                <div className="card-header bg-white border-bottom py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 font-weight-bold" style={{ fontSize: '15px' }}>
                            <i className="fas fa-list me-2" style={{ color: '#070642' }}></i>
                            Cached Colleges
                        </h6>
                        <span className="text-muted" style={{ fontSize: '13px' }}>
                            {filteredColleges.length} of {cachedColleges.length} colleges
                        </span>
                    </div>
                </div>
                <div className="card-body p-3">
                    {}
                    <div className="mb-3">
                        <div className="position-relative">
                            <i className="fas fa-search position-absolute" style={{
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af',
                                fontSize: '14px'
                            }}></i>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search cached colleges..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    paddingLeft: '38px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    height: '38px'
                                }}
                            />
                        </div>
                    </div>

                    {}
                    {filteredColleges.length === 0 ? (
                        <div className="text-center py-4">
                            <i className="fas fa-inbox fa-2x mb-2" style={{ color: '#d1d5db' }}></i>
                            <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                                {searchQuery ? 'No colleges found' : 'No colleges cached'}
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
                                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                    <tr>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>College Name</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredColleges.map((college, index) => (
                                        <tr key={college} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '14px 16px', color: '#6b7280', verticalAlign: 'middle' }}>
                                                {index + 1}
                                            </td>
                                            <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                                                <div style={{ fontWeight: '500', color: '#111827' }}>
                                                    {college}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleDeleteCached(college)}
                                                    disabled={deleteLoading === college}
                                                    className="btn btn-sm"
                                                    style={{
                                                        backgroundColor: '#ef4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '5px 14px',
                                                        borderRadius: '5px',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}
                                                    title="Delete from cache"
                                                >
                                                    {deleteLoading === college ? (
                                                        <span className="spinner-border spinner-border-sm"></span>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-trash me-1"></i>
                                                            Delete
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {}
            {toast && (
                <div
                    style={{
                        position: 'fixed',
                        top: '90px',
                        right: '20px',
                        zIndex: 9999,
                        minWidth: '320px',
                        animation: 'slideInRight 0.3s ease-out'
                    }}
                >
                    <div
                        className="alert shadow-lg mb-0"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: toast.type === 'success' ? '#d1fae5' : toast.type === 'error' ? '#fee2e2' : '#dbeafe',
                            color: toast.type === 'success' ? '#065f46' : toast.type === 'error' ? '#991b1b' : '#1e40af'
                        }}
                    >
                        <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : toast.type === 'error' ? 'exclamation-circle' : 'info-circle'}`} style={{ fontSize: '18px' }}></i>
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: '500' }}>{toast.message}</span>
                        <button
                            onClick={() => setToast(null)}
                            className="btn-close btn-close-sm"
                            aria-label="Close"
                            style={{ fontSize: '10px' }}
                        ></button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .table-hover tbody tr:hover {
                    background-color: #f9fafb;
                }
            `}</style>
        </AdminLayout>
    );
}
