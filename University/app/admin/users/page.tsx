'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminWebSocket } from '@/hooks/useAdminWebSocket';
import { API_URL } from '@/lib/config';

interface User {
    _id: string;
    email: string;
    role: string;
    is_verified: boolean;
    created_at: string;
    last_login?: string;
}

interface Toast {
    message: string;
    type: 'success' | 'error' | 'info';
}

export default function UsersPage() {
    const { user, token, isAdmin, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [filterVerified, setFilterVerified] = useState('All');
    const [toast, setToast] = useState<Toast | null>(null);

    useAdminWebSocket({
        onUserCreated: (data) => {
            showToast(`New user registered: ${data.email}`, 'info');
            fetchUsers();
        },
        onUserDeleted: (data) => {
            showToast(`User ${data.email} was deleted`, 'info');
            fetchUsers();
        },
    });

    useEffect(() => {
        if (!authLoading && (!user || !isAdmin())) {
            router.push('/login');
        }
    }, [user, authLoading, isAdmin, router]);

    useEffect(() => {
        if (token && isAdmin()) {
            fetchUsers();
        }
    }, [token]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        let filtered = users;

        if (searchQuery) {
            filtered = filtered.filter(u =>
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterRole !== 'All') {
            filtered = filtered.filter(u => u.role === filterRole);
        }

        if (filterVerified !== 'All') {
            const isVerified = filterVerified === 'Verified';
            filtered = filtered.filter(u => u.is_verified === isVerified);
        }

        setFilteredUsers(filtered);
    }, [searchQuery, filterRole, filterVerified, users]);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
                setFilteredUsers(data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (email: string) => {
        if (email === user?.email) {
            showToast('Cannot delete your own account!', 'error');
            return;
        }

        if (!confirm(`Delete user "${email}"? This action cannot be undone.`)) {
            return;
        }

        setDeleteLoading(email);
        try {
            const response = await fetch(`${API_URL}/api/admin/users/${encodeURIComponent(email)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                showToast(`User ${email} deleted successfully!`, 'success');
                fetchUsers();
                window.location.reload();
            } else {
                const data = await response.json();
                showToast(`Failed: ${data.error}`, 'error');
            }
        } catch (error) {
            showToast('Failed to delete user', 'error');
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
                    <p className="mt-3 text-muted" style={{ fontSize: '13px' }}>Loading users...</p>
                </div>
            </AdminLayout>
        );
    }

    if (!user || !isAdmin()) {
        return null;
    }

    const uniqueRoles = ['All', ...Array.from(new Set(users.map(u => u.role)))];

    return (
        <AdminLayout>
            {}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h3 className="mb-1" style={{ color: '#070642', fontWeight: '700', fontSize: '24px' }}>
                            <i className="fas fa-users me-2"></i>
                            User Management
                        </h3>
                        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                            Manage all registered users
                        </p>
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="btn btn-sm"
                        disabled={loading}
                        style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                    >
                        <i className="fas fa-sync-alt me-2"></i>
                        Refresh
                    </button>
                </div>

                {}
                <div className="card border-0 shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '8px' }}>
                    <div className="card-body p-3">
                        <div className="row g-3 align-items-center">
                            <div className="col-md-5">
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
                                        placeholder="Search by email..."
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
                            <div className="col-md-2">
                                <select
                                    className="form-select"
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        height: '38px'
                                    }}
                                >
                                    {uniqueRoles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <select
                                    className="form-select"
                                    value={filterVerified}
                                    onChange={(e) => setFilterVerified(e.target.value)}
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        height: '38px'
                                    }}
                                >
                                    <option value="All">All Status</option>
                                    <option value="Verified">Verified</option>
                                    <option value="Unverified">Unverified</option>
                                </select>
                            </div>
                            <div className="col-md-3 text-end">
                                <span className="text-muted" style={{ fontSize: '13px' }}>
                                    {filteredUsers.length} of {users.length} users
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {}
            {filteredUsers.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5">
                        <i className="fas fa-inbox fa-3x mb-3" style={{ color: '#d1d5db' }}></i>
                        <h5 style={{ color: '#6b7280' }}>No Users Found</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                            {searchQuery || filterRole !== 'All' || filterVerified !== 'All' ? 'Try adjusting your filters' : 'No users registered yet'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="card border-0 shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <div className="table-responsive">
                        <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
                            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registered</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Login</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => (
                                    <tr key={u.email} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                                            <div style={{ fontWeight: '500', color: '#111827' }}>
                                                {u.email}
                                                {u.email === user?.email && (
                                                    <span className="badge ms-2" style={{
                                                        backgroundColor: '#dbeafe',
                                                        color: '#3b82f6',
                                                        fontSize: '10px',
                                                        padding: '2px 6px'
                                                    }}>You</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                                            <span className="badge" style={{
                                                backgroundColor: u.role === 'admin' ? '#fef3c7' : '#e0e7ff',
                                                color: u.role === 'admin' ? '#f59e0b' : '#6366f1',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                textTransform: 'uppercase'
                                            }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                                            <span style={{
                                                backgroundColor: u.is_verified ? '#d1fae5' : '#fee2e2',
                                                color: u.is_verified ? '#10b981' : '#ef4444',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.3px'
                                            }}>
                                                <i className={`fas fa-${u.is_verified ? 'check-circle' : 'times-circle'} me-1`} style={{ fontSize: '10px' }}></i>
                                                {u.is_verified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#6b7280', verticalAlign: 'middle' }}>
                                            {new Date(u.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#6b7280', verticalAlign: 'middle' }}>
                                            {u.last_login ? new Date(u.last_login).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            }) : 'Never'}
                                        </td>
                                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDeleteUser(u.email)}
                                                disabled={deleteLoading === u.email || u.email === user?.email}
                                                className="btn btn-sm"
                                                style={{
                                                    backgroundColor: u.email === user?.email ? '#e5e7eb' : '#ef4444',
                                                    color: u.email === user?.email ? '#9ca3af' : 'white',
                                                    border: 'none',
                                                    padding: '5px 14px',
                                                    borderRadius: '5px',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    cursor: u.email === user?.email ? 'not-allowed' : 'pointer'
                                                }}
                                                title={u.email === user?.email ? 'Cannot delete yourself' : 'Delete user'}
                                            >
                                                {deleteLoading === u.email ? (
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
                </div>
            )}

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
