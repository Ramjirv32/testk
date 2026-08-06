'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { API_URL } from '@/lib/config';
import { useCallback, useEffect, useReducer, useRef } from 'react';

interface Registration {
    id: string;
    user_id: string;
    email: string;
    name: string;
    age: number;
    student_type: string;
    status: string;
    created_at: string;
    reason?: string;
}

interface Result {
    id: string;
    email: string;
    name: string;
    age: number;
    student_type: string;
    total_score?: number;
    max_score?: number;
    percentage?: number;
    completed_at: string;
}

type TabType = 'pending' | 'approved' | 'rejected' | 'results';

interface State {
    registrations: Registration[];
    results: Result[];
    activeTab: TabType;
    loading: boolean;
    stats: {
        pending: number;
        approved: number;
        rejected: number;
        completed: number;
    };
}

type Action =
    | { type: 'SET_TAB'; payload: TabType }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_REGISTRATIONS'; payload: Registration[] }
    | { type: 'SET_RESULTS'; payload: Result[] }
    | { type: 'SET_STATS'; payload: State['stats'] };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_TAB':
            return { ...state, activeTab: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_REGISTRATIONS':
            return { ...state, registrations: action.payload };
        case 'SET_RESULTS':
            return { ...state, results: action.payload };
        case 'SET_STATS':
            return { ...state, stats: action.payload };
        default:
            return state;
    }
}

export default function PsychometricAdminPage() {
    const router = useRouter();
    const { user, token, isLoading } = useAuth();

    const hasFetchedRef = useRef(false);
    const hasStatsRef = useRef(false);

    const [state, dispatch] = useReducer(reducer, {
        registrations: [],
        results: [],
        activeTab: 'pending',
        loading: true,
        stats: { pending: 0, approved: 0, rejected: 0, completed: 0 }
    });

    const fetchStats = useCallback(async () => {
        if (!token) return;

        try {
            const [pendingRes, approvedRes, rejectedRes, resultsRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/psychometric/registrations?status=pending`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`${API_URL}/api/admin/psychometric/registrations?status=approved`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`${API_URL}/api/admin/psychometric/registrations?status=rejected`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`${API_URL}/api/admin/psychometric/results`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })
            ]);

            const [pending, approved, rejected, completed] = await Promise.all([
                pendingRes.json(),
                approvedRes.json(),
                rejectedRes.json(),
                resultsRes.json()
            ]);

            dispatch({
                type: 'SET_STATS',
                payload: {
                    pending: pending.count || 0,
                    approved: approved.count || 0,
                    rejected: rejected.count || 0,
                    completed: completed.count || 0
                }
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, [token]);

    const fetchData = useCallback(async (tab: TabType) => {
        if (!token) return;

        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            if (tab !== 'results') {
                const response = await fetch(`${API_URL}/api/admin/psychometric/registrations?status=${tab}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    dispatch({ type: 'SET_REGISTRATIONS', payload: data.registrations || [] });
                }
            } else {
                const response = await fetch(`${API_URL}/api/admin/psychometric/results`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    dispatch({ type: 'SET_RESULTS', payload: data.results || [] });
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [token]);

    useEffect(() => {
        if (hasStatsRef.current) return;

        if (!isLoading && user && token) {
            hasStatsRef.current = true;
            fetchStats();
        }
    }, [user, token, isLoading, fetchStats]);

    useEffect(() => {
        if (hasFetchedRef.current) return;

        if (isLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (token) {
            hasFetchedRef.current = true;
            fetchData(state.activeTab);
        }
    }, [user, token, isLoading, fetchData, router]);

    const handleTabChange = useCallback((tab: TabType) => {

        if (tab !== 'results') {
            dispatch({ type: 'SET_REGISTRATIONS', payload: [] });
        } else {
            dispatch({ type: 'SET_RESULTS', payload: [] });
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        dispatch({ type: 'SET_TAB', payload: tab });

        setTimeout(() => {
            fetchData(tab);
        }, 0);
    }, [fetchData]);

    const handleApprove = useCallback(async (id: string) => {
        if (!confirm('Are you sure you want to approve this registration?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/psychometric/approve/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                fetchData(state.activeTab);
                window.location.reload();
            } else {
                alert('Failed to approve registration');
            }
        } catch (error) {
            console.error('Error approving registration:', error);
            alert('An error occurred');
        }
    }, [token, state.activeTab, fetchData]);

    const handleReject = useCallback(async (id: string) => {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/psychometric/reject/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason }),
            });

            if (response.ok) {
                fetchData(state.activeTab);
                window.location.reload();
            } else {
                alert('Failed to reject registration');
            }
        } catch (error) {
            console.error('Error rejecting registration:', error);
            alert('An error occurred');
        }
    }, [token, state.activeTab, fetchData]);

    return (
        <AdminLayout>
            {isLoading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="card border-0 shadow-sm mb-4" style={{
                        background: 'linear-gradient(135deg, #9a3197 0%, #7c2a79 100%)',
                        color: 'white',
                        borderRadius: '8px'
                    }}>
                        <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="mb-1" style={{ fontSize: '20px', fontWeight: '600' }}>Psychometric Test Approvals</h4>
                                    <p className="mb-0 opacity-75" style={{ fontSize: '13px' }}>Manage user registrations for psychometric assessments</p>
                                </div>
                                <div style={{ fontSize: '40px', opacity: 0.3 }}>
                                    <i className="fas fa-brain"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #f59e0b', borderRadius: '8px' }}>
                                <div className="card-body p-3">
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600' }}>
                                        Pending
                                    </p>
                                    <h3 className="mb-0" style={{ color: '#f59e0b', fontSize: '28px' }}>
                                        {state.stats.pending}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #10b981', borderRadius: '8px' }}>
                                <div className="card-body p-3">
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600' }}>
                                        Approved
                                    </p>
                                    <h3 className="mb-0" style={{ color: '#10b981', fontSize: '28px' }}>
                                        {state.stats.approved}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #ef4444', borderRadius: '8px' }}>
                                <div className="card-body p-3">
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600' }}>
                                        Rejected
                                    </p>
                                    <h3 className="mb-0" style={{ color: '#ef4444', fontSize: '28px' }}>
                                        {state.stats.rejected}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #8b5cf6', borderRadius: '8px' }}>
                                <div className="card-body p-3">
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600' }}>
                                        Completed
                                    </p>
                                    <h3 className="mb-0" style={{ color: '#8b5cf6', fontSize: '28px' }}>
                                        {state.stats.completed}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-0">
                            <ul className="nav nav-tabs border-bottom" style={{ padding: '0 20px' }}>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${state.activeTab === 'pending' ? 'active' : ''}`}
                                        onClick={() => handleTabChange('pending')}
                                        style={{
                                            color: state.activeTab === 'pending' ? '#9a3197' : '#666',
                                            borderBottom: state.activeTab === 'pending' ? '3px solid #9a3197' : 'none',
                                            fontWeight: state.activeTab === 'pending' ? '600' : 'normal'
                                        }}
                                    >
                                        Pending ({state.stats.pending})
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${state.activeTab === 'approved' ? 'active' : ''}`}
                                        onClick={() => handleTabChange('approved')}
                                        style={{
                                            color: state.activeTab === 'approved' ? '#10b981' : '#666',
                                            borderBottom: state.activeTab === 'approved' ? '3px solid #10b981' : 'none',
                                            fontWeight: state.activeTab === 'approved' ? '600' : 'normal'
                                        }}
                                    >
                                        Approved ({state.stats.approved})
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${state.activeTab === 'rejected' ? 'active' : ''}`}
                                        onClick={() => handleTabChange('rejected')}
                                        style={{
                                            color: state.activeTab === 'rejected' ? '#ef4444' : '#666',
                                            borderBottom: state.activeTab === 'rejected' ? '3px solid #ef4444' : 'none',
                                            fontWeight: state.activeTab === 'rejected' ? '600' : 'normal'
                                        }}
                                    >
                                        Rejected ({state.stats.rejected})
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${state.activeTab === 'results' ? 'active' : ''}`}
                                        onClick={() => handleTabChange('results')}
                                        style={{
                                            color: state.activeTab === 'results' ? '#8b5cf6' : '#666',
                                            borderBottom: state.activeTab === 'results' ? '3px solid #8b5cf6' : 'none',
                                            fontWeight: state.activeTab === 'results' ? '600' : 'normal'
                                        }}
                                    >
                                        Results ({state.stats.completed})
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="card-body p-3" key={`tab-content-${state.activeTab}`}>
                            {state.loading ? (
                                <div className="text-center py-5" key="loading-spinner">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : state.activeTab !== 'results' ? (
                                state.registrations.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">No {state.activeTab} registrations found</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Age</th>
                                                    <th>Type</th>
                                                    <th>Registered</th>
                                                    <th>Status</th>
                                                    {state.activeTab === 'pending' && <th>Actions</th>}
                                                    {state.activeTab === 'rejected' && <th>Reason</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.registrations.map((reg) => (
                                                    <tr key={`${reg.id}-${state.activeTab}`} style={{ fontSize: '13px' }}>
                                                        <td className="fw-semibold">{reg.name}</td>
                                                        <td className="text-muted">{reg.email}</td>
                                                        <td>{reg.age} years</td>
                                                        <td>
                                                            <span className="badge bg-secondary" style={{ fontSize: '11px' }}>
                                                                {reg.student_type}
                                                            </span>
                                                        </td>
                                                        <td className="text-muted">
                                                            {new Date(reg.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td>
                                                            <span
                                                                className="badge"
                                                                style={{
                                                                    backgroundColor:
                                                                        reg.status === 'pending' ? '#fef3c7' :
                                                                            reg.status === 'approved' ? '#d1fae5' : '#fee2e2',
                                                                    color:
                                                                        reg.status === 'pending' ? '#92400e' :
                                                                            reg.status === 'approved' ? '#065f46' : '#991b1b',
                                                                    fontSize: '11px'
                                                                }}
                                                            >
                                                                {reg.status}
                                                            </span>
                                                        </td>
                                                        {state.activeTab === 'pending' && (
                                                            <td>
                                                                <div className="btn-group btn-group-sm">
                                                                    <button
                                                                        onClick={() => handleApprove(reg.id)}
                                                                        className="btn btn-success"
                                                                        style={{ fontSize: '11px' }}
                                                                    >
                                                                        <i className="fas fa-check me-1"></i>
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReject(reg.id)}
                                                                        className="btn btn-danger"
                                                                        style={{ fontSize: '11px' }}
                                                                    >
                                                                        <i className="fas fa-times me-1"></i>
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {state.activeTab === 'rejected' && (
                                                            <td className="text-danger" style={{ fontSize: '12px' }}>
                                                                {reg.reason || 'Not specified'}
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            ) : (
                                state.results.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">No test results found</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Age</th>
                                                    <th>Type</th>
                                                    <th>Score</th>
                                                    <th>Percentage</th>
                                                    <th>Completed</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.results.map((result) => {
                                                    const percentage = result.percentage || (result.total_score && result.max_score ? (result.total_score / result.max_score) * 100 : 0);
                                                    return (
                                                        <tr key={`result-${result.id}`} style={{ fontSize: '13px' }}>
                                                            <td className="fw-semibold">{result.name}</td>
                                                            <td className="text-muted">{result.email}</td>
                                                            <td>{result.age} years</td>
                                                            <td>
                                                                <span className="badge bg-secondary" style={{ fontSize: '11px' }}>
                                                                    {result.student_type}
                                                                </span>
                                                            </td>
                                                            <td className="fw-bold" style={{
                                                                color: percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444'
                                                            }}>
                                                                {result.total_score && result.max_score ? `${result.total_score}/${result.max_score}` : 'N/A'}
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className="badge"
                                                                    style={{
                                                                        backgroundColor: percentage >= 80 ? '#d1fae5' : percentage >= 60 ? '#fef3c7' : '#fee2e2',
                                                                        color: percentage >= 80 ? '#065f46' : percentage >= 60 ? '#92400e' : '#991b1b',
                                                                        fontSize: '11px'
                                                                    }}
                                                                >
                                                                    {percentage > 0 ? `${percentage.toFixed(1)}%` : 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="text-muted">
                                                                {new Date(result.completed_at).toLocaleDateString()}
                                                            </td>
                                                            <td>
                                                                <Link
                                                                    href={`/admin/psychometric/result/${result.id}`}
                                                                    className="btn btn-sm"
                                                                    style={{
                                                                        backgroundColor: '#9a3197',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        padding: '5px 15px',
                                                                        fontSize: '12px'
                                                                    }}
                                                                >
                                                                    View
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
