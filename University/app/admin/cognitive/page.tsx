'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { API_URL } from '@/lib/config';

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

export default function CognitiveAdminPage() {
    const router = useRouter();
    const { user, token, isLoading } = useAuth();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [results, setResults] = useState<Result[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'results'>('pending');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0
    });
    const [rejectReason, setRejectReason] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && token) {
            fetchData();
        }
    }, [user, token, isLoading, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab !== 'results') {
                const response = await fetch(`${API_URL}/api/admin/cognitive/registrations?status=${activeTab}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setRegistrations(data.registrations || []);
                }
            } else {
                const response = await fetch(`${API_URL}/api/admin/test-results?test_type=cognitive`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setResults(data.results || []);
                }
            }

            await fetchStats();
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const [pendingRes, approvedRes, rejectedRes, resultsRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/cognitive/registrations?status=pending`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`${API_URL}/api/admin/cognitive/registrations?status=approved`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`${API_URL}/api/admin/cognitive/registrations?status=rejected`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`${API_URL}/api/admin/test-results?test_type=cognitive`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })
            ]);

            const [pending, approved, rejected, completed] = await Promise.all([
                pendingRes.json(),
                approvedRes.json(),
                rejectedRes.json(),
                resultsRes.json()
            ]);

            setStats({
                pending: pending.count || 0,
                approved: approved.count || 0,
                rejected: rejected.count || 0,
                completed: completed.count || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Are you sure you want to approve this registration?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/cognitive/approve/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                fetchData();
                alert('Registration approved successfully');
                window.location.reload();
            } else {
                alert('Failed to approve registration');
            }
        } catch (error) {
            console.error('Error approving registration:', error);
            alert('An error occurred');
        }
    };

    const handleReject = async (id: string) => {
        if (!rejectReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/cognitive/reject/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: rejectReason }),
            });

            if (response.ok) {
                setRejectReason('');
                setSelectedId(null);
                fetchData();
                alert('Registration rejected successfully');
                window.location.reload();
            } else {
                alert('Failed to reject registration');
            }
        } catch (error) {
            console.error('Error rejecting registration:', error);
            alert('An error occurred');
        }
    };

    return (
        <AdminLayout>
            <div className="card border-0 shadow-sm mb-4" style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                color: 'white',
                borderRadius: '8px'
            }}>
                <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1" style={{ fontSize: '20px', fontWeight: '600' }}>Cognitive Test Approvals</h4>
                            <p className="mb-0 opacity-75" style={{ fontSize: '13px' }}>Manage user registrations for Cognitive ability test</p>
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
                                {stats.pending}
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
                                {stats.approved}
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
                                {stats.rejected}
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
                                {stats.completed}
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
                                className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
                                onClick={() => setActiveTab('pending')}
                                style={{
                                    color: activeTab === 'pending' ? '#2563eb' : '#666',
                                    borderBottom: activeTab === 'pending' ? '3px solid #2563eb' : 'none',
                                    fontWeight: activeTab === 'pending' ? '600' : 'normal'
                                }}
                            >
                                Pending ({stats.pending})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'approved' ? 'active' : ''}`}
                                onClick={() => setActiveTab('approved')}
                                style={{
                                    color: activeTab === 'approved' ? '#10b981' : '#666',
                                    borderBottom: activeTab === 'approved' ? '3px solid #10b981' : 'none',
                                    fontWeight: activeTab === 'approved' ? '600' : 'normal'
                                }}
                            >
                                Approved ({stats.approved})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'rejected' ? 'active' : ''}`}
                                onClick={() => setActiveTab('rejected')}
                                style={{
                                    color: activeTab === 'rejected' ? '#ef4444' : '#666',
                                    borderBottom: activeTab === 'rejected' ? '3px solid #ef4444' : 'none',
                                    fontWeight: activeTab === 'rejected' ? '600' : 'normal'
                                }}
                            >
                                Rejected ({stats.rejected})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'results' ? 'active' : ''}`}
                                onClick={() => setActiveTab('results')}
                                style={{
                                    color: activeTab === 'results' ? '#8b5cf6' : '#666',
                                    borderBottom: activeTab === 'results' ? '3px solid #8b5cf6' : 'none',
                                    fontWeight: activeTab === 'results' ? '600' : 'normal'
                                }}
                            >
                                Results ({stats.completed})
                            </button>
                        </li>
                    </ul>

                    {}
                    <div className="p-4">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {activeTab !== 'results' ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead style={{ backgroundColor: '#f8f9fa' }}>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Age</th>
                                                    <th>Student Type</th>
                                                    <th>Registered</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {registrations.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="text-center py-4 text-muted">
                                                            No registrations found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    registrations.map((reg) => (
                                                        <tr key={reg.id}>
                                                            <td className="fw-500">{reg.name}</td>
                                                            <td>{reg.email}</td>
                                                            <td>{reg.age}</td>
                                                            <td>
                                                                <span className="badge" style={{
                                                                    backgroundColor: '#e5e7eb',
                                                                    color: '#374151'
                                                                }}>
                                                                    {reg.student_type}
                                                                </span>
                                                            </td>
                                                            <td>{new Date(reg.created_at).toLocaleDateString()}</td>
                                                            <td>
                                                                {activeTab === 'pending' && (
                                                                    <div className="d-flex gap-2">
                                                                        <button
                                                                            className="btn btn-sm"
                                                                            style={{
                                                                                backgroundColor: '#10b981',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                padding: '5px 10px',
                                                                                fontSize: '12px'
                                                                            }}
                                                                            onClick={() => handleApprove(reg.id)}
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sm"
                                                                            style={{
                                                                                backgroundColor: '#ef4444',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                padding: '5px 10px',
                                                                                fontSize: '12px'
                                                                            }}
                                                                            onClick={() => {
                                                                                setSelectedId(reg.id);
                                                                                setRejectReason('');
                                                                            }}
                                                                            data-bs-toggle="modal"
                                                                            data-bs-target="#rejectModal"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {activeTab !== 'pending' && (
                                                                    <span className="text-muted small">
                                                                        {reg.status === 'approved' ? ' Approved' : ' Rejected'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead style={{ backgroundColor: '#f8f9fa' }}>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Age</th>
                                                    <th>Score</th>
                                                    <th>Percentage</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="text-center py-4 text-muted">
                                                            No results found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    results.map((result) => (
                                                        <tr key={result.id}>
                                                            <td className="fw-500">{result.name}</td>
                                                            <td>{result.email}</td>
                                                            <td>{result.age}</td>
                                                            <td>{result.total_score ? `${result.total_score}/${result.max_score}` : 'N/A'}</td>
                                                            <td>
                                                                <span className="badge" style={{
                                                                    backgroundColor: result.percentage && result.percentage >= 70 ? '#d1fae5' : '#fee2e2',
                                                                    color: result.percentage && result.percentage >= 70 ? '#065f46' : '#7f1d1d'
                                                                }}>
                                                                    {result.percentage ? `${result.percentage.toFixed(2)}%` : 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td>{new Date(result.completed_at).toLocaleDateString()}</td>
                                                            <td>
                                                                <Link
                                                                    href={`/admin/cognitive/result/${result.id}`}
                                                                    className="btn btn-sm"
                                                                    style={{
                                                                        backgroundColor: '#8b5cf6',
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
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {}
            <div className="modal fade" id="rejectModal" tabIndex={-1}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Reject Registration</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <label className="form-label">Rejection Reason:</label>
                            <textarea
                                className="form-control"
                                rows={4}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                            />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button
                                type="button"
                                className="btn"
                                style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}
                                onClick={() => {
                                    if (selectedId) {
                                        handleReject(selectedId);
                                        const modal = new (window as any).bootstrap.Modal(
                                            document.getElementById('rejectModal')
                                        );
                                        modal.hide();
                                    }
                                }}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
