'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function AllTestsAdminPage() {
    const router = useRouter();
    const { user, token, isLoading } = useAuth();
    const [testType, setTestType] = useState<'pescio' | 'psychometric' | 'cognitive' | 'mbti'>('pescio');
    const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pescio: { pending: 0, approved: 0, rejected: 0 },
        psychometric: { pending: 0, approved: 0, rejected: 0 },
        cognitive: { pending: 0, approved: 0, rejected: 0 },
        mbti: { pending: 0, approved: 0, rejected: 0 }
    });

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && token) {
            fetchData();
            fetchStats();
        }
    }, [user, token, isLoading, testType, statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoint = testType === 'pescio' ? 'psychometric' : testType;
            const response = await fetch(`${API_URL}/api/admin/${endpoint}/registrations?status=${statusFilter}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRegistrations(data.registrations || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const tests = ['psychometric', 'cognitive', 'mbti'];
            const statuses = ['pending', 'approved', 'rejected'];

            const promises = tests.flatMap(test =>
                statuses.map(status =>
                    fetch(`${API_URL}/api/admin/${test}/registrations?status=${status}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }).then(res => res.json()).then(data => ({ test, status, count: data.count || 0 }))
                )
            );

            const results = await Promise.all(promises);

            const newStats = {
                pescio: { pending: 0, approved: 0, rejected: 0 },
                psychometric: { pending: 0, approved: 0, rejected: 0 },
                cognitive: { pending: 0, approved: 0, rejected: 0 },
                mbti: { pending: 0, approved: 0, rejected: 0 }
            };

            results.forEach(({ test, status, count }) => {
                const key = test === 'psychometric' ? 'pescio' : test;
                newStats[key as keyof typeof newStats][status as keyof typeof newStats.pescio] = count;
            });

            setStats(newStats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Are you sure you want to approve this registration?')) {
            return;
        }

        try {
            const endpoint = testType === 'pescio' ? 'psychometric' : testType;
            const response = await fetch(`${API_URL}/api/admin/${endpoint}/approve/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                fetchData();
                fetchStats();
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
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) {
            return;
        }

        try {
            const endpoint = testType === 'pescio' ? 'psychometric' : testType;
            const response = await fetch(`${API_URL}/api/admin/${endpoint}/reject/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason }),
            });

            if (response.ok) {
                fetchData();
                fetchStats();
                window.location.reload();
            } else {
                alert('Failed to reject registration');
            }
        } catch (error) {
            console.error('Error rejecting registration:', error);
            alert('An error occurred');
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const testTabs = [
        { id: 'pescio', label: 'PESCIO Test', icon: 'fa-compass', color: '#9a3197', desc: 'Interest Inventory (All Ages)' },
        { id: 'psychometric', label: 'Psychometric Test', icon: 'fa-brain', color: '#3b82f6', desc: 'Behavioral Assessment (≤15)' },
        { id: 'cognitive', label: 'Cognitive Test', icon: 'fa-lightbulb', color: '#f59e0b', desc: 'Ability Test (<18)' },
        { id: 'mbti', label: 'MBTI Test', icon: 'fa-users', color: '#10b981', desc: 'Personality Type (≥18)' },
    ];

    const statusTabs = [
        { id: 'pending', label: 'Pending', color: '#f59e0b', icon: 'fa-clock' },
        { id: 'approved', label: 'Approved', color: '#10b981', icon: 'fa-check-circle' },
        { id: 'rejected', label: 'Rejected', color: '#ef4444', icon: 'fa-times-circle' },
    ];

    const currentTest = testTabs.find(t => t.id === testType)!;
    const currentStats = stats[testType];

    return (
        <AdminLayout>
            {}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1" style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                                <i className="fas fa-clipboard-check me-2" style={{ color: '#9a3197' }}></i>
                                Test Registration Management
                            </h4>
                            <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
                                Review and approve student test registrations across all assessments
                            </p>
                        </div>
                        <button
                            onClick={() => { fetchData(); fetchStats(); }}
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ fontSize: '14px', padding: '8px 20px' }}
                        >
                            <i className="fas fa-sync-alt me-2"></i>
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {}
            <div className="row g-3 mb-4">
                {testTabs.map((tab) => (
                    <div key={tab.id} className="col-md-3">
                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{
                                borderLeft: `4px solid ${tab.color}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                backgroundColor: testType === tab.id ? `${tab.color}15` : 'white',
                                transform: testType === tab.id ? 'scale(1.02)' : 'scale(1)'
                            }}
                            onClick={() => setTestType(tab.id as any)}
                        >
                            <div className="card-body p-3">
                                <div className="d-flex align-items-center mb-2">
                                    <div className="p-2 rounded-circle me-2" style={{ backgroundColor: `${tab.color}20` }}>
                                        <i className={`fas ${tab.icon}`} style={{ color: tab.color, fontSize: '18px' }}></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-0" style={{ fontSize: '14px', fontWeight: '600' }}>{tab.label}</h6>
                                        <small className="text-muted" style={{ fontSize: '11px' }}>{tab.desc}</small>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-between mt-3" style={{ fontSize: '12px' }}>
                                    <span className="text-warning"> {stats[tab.id as keyof typeof stats].pending}</span>
                                    <span className="text-success"> {stats[tab.id as keyof typeof stats].approved}</span>
                                    <span className="text-danger"> {stats[tab.id as keyof typeof stats].rejected}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {}
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3">
                    <div className="btn-group w-100" role="group">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`btn ${statusFilter === tab.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setStatusFilter(tab.id as any)}
                                style={{ fontSize: '13px', fontWeight: '600' }}
                            >
                                <i className={`fas ${tab.icon} me-2`}></i>
                                {tab.label}
                                <span className="badge bg-light text-dark ms-2">
                                    {currentStats[tab.id as keyof typeof currentStats]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {}
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-header bg-white border-bottom py-3">
                    <h6 className="mb-0 font-weight-bold" style={{ fontSize: '16px', color: currentTest.color }}>
                        <i className={`fas ${currentTest.icon} me-2`}></i>
                        {currentTest.label} - {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Registrations
                    </h6>
                </div>
                <div className="card-body p-3">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : registrations.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <p className="text-muted">No {statusFilter} registrations found for {currentTest.label}</p>
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
                                        {statusFilter === 'pending' && <th>Actions</th>}
                                        {statusFilter === 'rejected' && <th>Reason</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map((reg) => (
                                        <tr key={reg.id} style={{ fontSize: '13px' }}>
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
                                            {statusFilter === 'pending' && (
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
                                            {statusFilter === 'rejected' && (
                                                <td className="text-danger" style={{ fontSize: '12px' }}>
                                                    {reg.reason || 'Not specified'}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
