'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

interface College {
    college_name: string;
    country: string;
    about: string;
    location: string;
    approval_status: string;
    approved_at: string;
    approved_by: string;
}

export default function ApprovedCollegesPage() {
    const { user, token, isAdmin, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [colleges, setColleges] = useState<College[]>([]);
    const [filteredColleges, setFilteredColleges] = useState<College[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCountry, setFilterCountry] = useState('All');
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!authLoading && (!user || !isAdmin())) {
            router.push('/login');
        }
    }, [user, authLoading, isAdmin, router]);

    useEffect(() => {
        if (token && isAdmin()) {
            fetchApprovedColleges();
        }
    }, [token]);

    useEffect(() => {
        let filtered = colleges;

        if (searchQuery) {
            filtered = filtered.filter(college =>
                college.college_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                college.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                college.approved_by.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterCountry !== 'All') {
            filtered = filtered.filter(college => college.country === filterCountry);
        }

        setFilteredColleges(filtered);
        setCurrentPage(1);
    }, [searchQuery, filterCountry, colleges]);

    const fetchApprovedColleges = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/approved-colleges`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setColleges(data.colleges || []);
                setFilteredColleges(data.colleges || []);
            }
        } catch (error) {
            console.error('Failed to fetch approved colleges:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <AdminLayout>
                <div className="text-center py-5">
                    <div className="spinner-border" style={{ color: '#070642' }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted" style={{ fontSize: '13px' }}>Loading approved colleges...</p>
                </div>
            </AdminLayout>
        );
    }

    if (!user || !isAdmin()) {
        return null;
    }

    const uniqueCountries = ['All', ...Array.from(new Set(colleges.map(c => c.country)))];

    const totalPages = Math.ceil(filteredColleges.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentColleges = filteredColleges.slice(startIndex, endIndex);
    const displayStart = filteredColleges.length > 0 ? startIndex + 1 : 0;
    const displayEnd = Math.min(endIndex, filteredColleges.length);

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    return (
        <AdminLayout>
            {}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h3 className="mb-1" style={{ color: '#070642', fontWeight: '700', fontSize: '24px' }}>
                            Approved Colleges
                        </h3>
                        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                            View all approved and live colleges
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            onClick={fetchApprovedColleges}
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
                        <button
                            onClick={fetchApprovedColleges}
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
                            <i className="fas fa-download me-2"></i>
                            Export to CSV
                        </button>
                    </div>
                </div>

                {}
                <div className="card border-0 shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '8px' }}>
                    <div className="card-body p-3">
                        <div className="row g-3 align-items-center">
                            <div className="col-md-6">
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
                                        placeholder="Search by college, location, or approver..."
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
                            <div className="col-md-3">
                                <select
                                    className="form-select"
                                    value={filterCountry}
                                    onChange={(e) => setFilterCountry(e.target.value)}
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        height: '38px'
                                    }}
                                >
                                    {uniqueCountries.map(country => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <select
                                    className="form-select"
                                    value={itemsPerPage}
                                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        height: '38px'
                                    }}
                                >
                                    <option value={20}>Show 20</option>
                                    <option value={50}>Show 50</option>
                                    <option value={100}>Show 100</option>
                                    <option value={500}>Show 500</option>
                                </select>
                            </div>
                            <div className="col-md-1 text-end">
                                <span className="text-muted" style={{ fontSize: '13px' }}>
                                    {displayStart}-{displayEnd} of {filteredColleges.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {}
            {filteredColleges.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5">
                        <i className="fas fa-inbox fa-3x mb-3" style={{ color: '#d1d5db' }}></i>
                        <h5 style={{ color: '#6b7280' }}>No Approved Colleges</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                            {searchQuery || filterCountry !== 'All' ? 'Try adjusting your filters' : 'No colleges have been approved yet'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="card border-0 shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <div className="table-responsive">
                        <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
                            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>College</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Country</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved Date</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved By</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentColleges.map((college) => (
                                    <tr key={college.college_name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                                            <div style={{ fontWeight: '500', color: '#111827', marginBottom: '2px' }}>
                                                {college.college_name}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#6b7280', verticalAlign: 'middle' }}>
                                            {college.location}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#6b7280', verticalAlign: 'middle' }}>
                                            <i className="fas fa-map-marker-alt me-1" style={{ fontSize: '11px' }}></i>
                                            {college.country}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#6b7280', verticalAlign: 'middle' }}>
                                            {new Date(college.approved_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#6b7280', verticalAlign: 'middle' }}>
                                            <i className="fas fa-user me-1" style={{ fontSize: '11px' }}></i>
                                            {college.approved_by}
                                        </td>
                                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                                            <span style={{
                                                backgroundColor: '#d1fae5',
                                                color: '#10b981',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.3px'
                                            }}>
                                                <i className="fas fa-check-circle me-1" style={{ fontSize: '10px' }}></i>
                                                Approved
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                            <Link
                                                href={`/admin/college/${encodeURIComponent(college.college_name)}`}
                                                className="btn btn-sm"
                                                style={{
                                                    backgroundColor: '#070642',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '5px 14px',
                                                    borderRadius: '5px',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    textDecoration: 'none'
                                                }}
                                                title="View & Edit Details"
                                            >
                                                <i className="fas fa-eye me-1"></i>
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {}
                    {totalPages > 1 && (
                        <div className="card-footer bg-white border-top" style={{ padding: '16px 24px' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                    Showing <strong>{displayStart}-{displayEnd}</strong> of <strong>{filteredColleges.length}</strong> colleges
                                </div>
                                <div className="d-flex gap-2 align-items-center">
                                    <button
                                        onClick={() => goToPage(1)}
                                        disabled={currentPage === 1}
                                        className="btn btn-sm"
                                        style={{
                                            backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                                            color: currentPage === 1 ? '#9ca3af' : '#374151',
                                            border: '1px solid #e5e7eb',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <i className="fas fa-angle-double-left"></i>
                                    </button>
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="btn btn-sm"
                                        style={{
                                            backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                                            color: currentPage === 1 ? '#9ca3af' : '#374151',
                                            border: '1px solid #e5e7eb',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <i className="fas fa-chevron-left me-1"></i>
                                        Previous
                                    </button>
                                    <div style={{
                                        padding: '6px 16px',
                                        backgroundColor: '#070642',
                                        color: 'white',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: '600'
                                    }}>
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="btn btn-sm"
                                        style={{
                                            backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                                            color: currentPage === totalPages ? '#9ca3af' : '#374151',
                                            border: '1px solid #e5e7eb',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Next
                                        <i className="fas fa-chevron-right ms-1"></i>
                                    </button>
                                    <button
                                        onClick={() => goToPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="btn btn-sm"
                                        style={{
                                            backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                                            color: currentPage === totalPages ? '#9ca3af' : '#374151',
                                            border: '1px solid #e5e7eb',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <i className="fas fa-angle-double-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .table-hover tbody tr:hover {
                    background-color: #f9fafb;
                }
            `}</style>
        </AdminLayout>
    );
}
