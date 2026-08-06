'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminWebSocket } from '@/hooks/useAdminWebSocket';
import { API_URL } from '@/lib/config';

interface College {
    college_name: string;
    country: string;
    about: string;
    location: string;
    summary: string;
    ug_programs: string[];
    pg_programs: string[];
    phd_programs: string[];
    fees: {
        ug_yearly_min: number;
        ug_yearly_max: number;
        pg_yearly_min: number;
        pg_yearly_max: number;
        phd_yearly_min: number;
        phd_yearly_max: number;
    };
    scholarships: string[];
    student_gender_ratio: {
        male_percentage: number;
        female_percentage: number;
    };
    faculty_staff: number;
    international_students: number;
    global_ranking: string;
    departments: string[];
    student_statistics: Array<{ category: string; value: any }>;
    additional_details: Array<{ category: string; value: any }>;
    sources: string[];
    approval_status: string;
    created_at: string;
}

interface Toast {
    message: string;
    type: 'success' | 'error' | 'info';
}

export default function PendingCollegesPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [colleges, setColleges] = useState<College[]>([]);
    const [filteredColleges, setFilteredColleges] = useState<College[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<Toast | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCountry, setFilterCountry] = useState('All');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [editingCollege, setEditingCollege] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<College | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [viewingFullDetails, setViewingFullDetails] = useState<College | null>(null);
    const [fullDetailsLoading, setFullDetailsLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useAdminWebSocket({
        onCollegeApproved: (data) => {
            showToast(`${data.college_name} was approved by ${data.approved_by}`, 'info');

            if (expandedRow === data.college_name) {
                setExpandedRow(null);
                setEditingCollege(null);
                setEditFormData(null);
            }
            setTimeout(() => fetchPendingColleges(), 100);
        },
        onCollegeRejected: (data) => {
            showToast(`${data.college_name} was rejected`, 'info');

            if (expandedRow === data.college_name) {
                setExpandedRow(null);
                setEditingCollege(null);
                setEditFormData(null);
            }
            setTimeout(() => fetchPendingColleges(), 100);
        },
    });

    useEffect(() => {
        if (token) {
            fetchPendingColleges();
        }
    }, [token]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        let filtered = colleges;

        if (searchQuery) {
            filtered = filtered.filter(college =>
                college.college_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                college.location.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterCountry !== 'All') {
            filtered = filtered.filter(college => college.country === filterCountry);
        }

        setFilteredColleges(filtered);
    }, [searchQuery, filterCountry, colleges]);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    };

    const fetchPendingColleges = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/pending-colleges`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log(' Raw data from backend:', data);
                console.log(' Total colleges received:', data.colleges?.length || 0);

                const pendingOnly = (data.colleges || []).filter(
                    (college: College) => college.approval_status === 'pending'
                );

                console.log(' Pending colleges after filter:', pendingOnly.length);
                console.log(' Pending colleges:', pendingOnly.map((c: College) => ({
                    name: c.college_name,
                    status: c.approval_status
                })));

                setColleges(pendingOnly);
                setFilteredColleges(pendingOnly);
            }
        } catch (error) {
            console.error('Failed to fetch pending colleges:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (collegeName: string) => {
        setActionLoading(collegeName);

        try {
            const response = await fetch(`${API_URL}/api/admin/approve/${encodeURIComponent(collegeName)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                showToast(` ${collegeName} approved successfully!`, 'success');
                

                setExpandedRow(null);
                setEditingCollege(null);
                setEditFormData(null);
                

                setTimeout(() => fetchPendingColleges(), 500);
                window.location.reload();
            } else {
                const data = await response.json();
                showToast(`Failed: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to approve college', 'error');
        } 
    };

    const handleReject = async (collegeName: string) => {
        if (!confirm(`Reject ${collegeName}? This action cannot be undone.`)) return;

        setActionLoading(collegeName);

        try {
            const response = await fetch(`${API_URL}/api/admin/reject/${encodeURIComponent(collegeName)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                showToast(`${collegeName} rejected successfully!`, 'success');
                

                setExpandedRow(null);
                setEditingCollege(null);
                setEditFormData(null);
                

                setTimeout(() => fetchPendingColleges(), 500);
                window.location.reload();
            } else {
                const data = await response.json();
                showToast(`Failed: ${data.error}`, 'error');
            }
        } catch (error) {
            showToast('Failed to reject college', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const toggleExpand = (collegeName: string) => {
        if (expandedRow === collegeName) {
            setExpandedRow(null);
            setEditingCollege(null);
            setEditFormData(null);
        } else {
            setExpandedRow(collegeName);
            setEditingCollege(null);
        }
    };

    const handleEdit = (college: College) => {
        setEditingCollege(college.college_name);
        setEditFormData({ ...college });
    };

    const handleCancelEdit = () => {
        setEditingCollege(null);
        setEditFormData(null);
    };

    const handleSaveEdit = async () => {
        if (!editFormData) return;

        setSaveLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/update-college`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editFormData),
            });

            if (response.ok) {
                showToast('College updated successfully!', 'success');

                setColleges(prev => prev.map(college =>
                    college.college_name === editFormData.college_name
                        ? { ...college, ...editFormData }
                        : college
                ));
                setFilteredColleges(prev => prev.map(college =>
                    college.college_name === editFormData.college_name
                        ? { ...college, ...editFormData }
                        : college
                ));

                setEditingCollege(null);
                setEditFormData(null);
                setSaveLoading(false);

                setTimeout(() => {
                    fetchPendingColleges();
                    window.location.reload();
                }, 1000);
            } else {
                const data = await response.json();
                showToast(`Failed: ${data.error}`, 'error');
                setSaveLoading(false);
            }
        } catch (error) {
            showToast('Failed to update college', 'error');
            setSaveLoading(false);
        }
    };

    const updateFormField = (field: string, value: any) => {
        if (!editFormData) return;
        setEditFormData({ ...editFormData, [field]: value });
    };

    const updateNestedField = (parent: string, child: string, value: any) => {
        if (!editFormData) return;
        setEditFormData({
            ...editFormData,

            [parent]: {

                ...((editFormData as any)[parent] || {}),
                [child]: value
            }
        });
    };

    const updateArrayItem = (field: keyof College, index: number, value: any) => {
        if (!editFormData) return;
        const arr = editFormData[field] as any[];
        if (!Array.isArray(arr)) return;
        const newArray = [...arr];
        newArray[index] = value;
        setEditFormData({ ...editFormData, [field]: newArray });
    };

    const addArrayItem = (field: keyof College, defaultValue: any) => {
        if (!editFormData) return;
        const arr = editFormData[field] as any[] || [];
        const newArray = [...arr, defaultValue];
        setEditFormData({ ...editFormData, [field]: newArray });
    };

    const removeArrayItem = (field: keyof College, index: number) => {
        if (!editFormData) return;
        const arr = editFormData[field] as any[];
        if (!Array.isArray(arr)) return;
        const newArray = [...arr];
        newArray.splice(index, 1);
        setEditFormData({ ...editFormData, [field]: newArray });
    };

    const handleViewFullDetails = async (collegeName: string) => {
        setFullDetailsLoading(true);
        try {

            const college = colleges.find(c => c.college_name === collegeName);
            if (college) {
                setViewingFullDetails(college);
            }
        } catch (error) {
            console.error('Failed to load full details:', error);
            showToast('Failed to load full details', 'error');
        } finally {
            setFullDetailsLoading(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['College Name', 'Country', 'Location', 'Submitted', 'Status'];
        const rows = filteredColleges.map(college => [
            college.college_name,
            college.country,
            college.location,
            new Date(college.created_at).toLocaleDateString(),
            college.approval_status
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pending-colleges-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const uniqueCountries = ['All', ...Array.from(new Set(colleges.map(c => c.country)))];

    if (loading) {
        return (
            <AdminLayout>
                <div className="text-center py-5">
                    <div className="spinner-border" style={{ color: '#070642' }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted" style={{ fontSize: '13px' }}>Loading pending colleges...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h3 className="mb-1" style={{ color: '#070642', fontWeight: '700', fontSize: '24px' }}>
                            <i className="fas fa-clock me-2"></i>
                            Pending Colleges
                        </h3>
                        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                            Showing only colleges awaiting approval (not approved)
                        </p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="btn btn-sm"
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
                                        placeholder="Search by college, location..."
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
                            <div className="col-md-3 text-end">
                                <span className="text-muted" style={{ fontSize: '13px' }}>
                                    {filteredColleges.length} of {colleges.length} colleges
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
                        <h5 style={{ color: '#6b7280' }}>No Pending Colleges</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                            {searchQuery || filterCountry !== 'All' ? 'Try adjusting your filters' : 'All colleges have been reviewed'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="card border-0 shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <div className="table-responsive">
                        <table className="table mb-0" style={{ fontSize: '13px' }}>
                            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '40px' }}></th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>College</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Country</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredColleges.map((college, index) => (
                                    <React.Fragment key={college.college_name}>
                                        <tr style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                                            <td style={{ padding: '14px 16px', verticalAlign: 'middle' }} onClick={() => toggleExpand(college.college_name)}>
                                                <i className={`fas fa-chevron-${expandedRow === college.college_name ? 'down' : 'right'}`} style={{ color: '#9ca3af', fontSize: '12px' }}></i>
                                            </td>
                                            <td style={{ padding: '14px 16px', verticalAlign: 'middle' }} onClick={() => toggleExpand(college.college_name)}>
                                                <div style={{ fontWeight: '500', color: '#111827' }}>{college.college_name}</div>
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#6b7280', verticalAlign: 'middle' }} onClick={() => toggleExpand(college.college_name)}>
                                                {college.location}
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#6b7280', verticalAlign: 'middle' }} onClick={() => toggleExpand(college.college_name)}>
                                                {college.country}
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#6b7280', verticalAlign: 'middle' }} onClick={() => toggleExpand(college.college_name)}>
                                                {new Date(college.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '14px 16px', verticalAlign: 'middle' }} onClick={() => toggleExpand(college.college_name)}>
                                                <span style={{
                                                    backgroundColor: '#fef3c7',
                                                    color: '#f59e0b',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.3px'
                                                }}>
                                                    {college.approval_status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                <div className="d-flex gap-2 justify-content-center">
                                                    <button
                                                        onClick={() => handleViewFullDetails(college.college_name)}
                                                        className="btn btn-sm"
                                                        style={{
                                                            backgroundColor: '#3b82f6',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '5px 14px',
                                                            borderRadius: '5px',
                                                            fontSize: '12px',
                                                            fontWeight: '500'
                                                        }}
                                                        title="View Full Details"
                                                    >
                                                        <i className="fas fa-info-circle me-1"></i>
                                                        Full Details
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(college.college_name)}
                                                        disabled={actionLoading === college.college_name}
                                                        className="btn btn-sm"
                                                        style={{
                                                            backgroundColor: '#10b981',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '5px 14px',
                                                            borderRadius: '5px',
                                                            fontSize: '12px',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        {actionLoading === college.college_name ? (
                                                            <span className="spinner-border spinner-border-sm"></span>
                                                        ) : (
                                                            <>
                                                                <i className="fas fa-check me-1"></i>
                                                                Approve
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(college.college_name)}
                                                        disabled={actionLoading === college.college_name}
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
                                                    >
                                                        <i className="fas fa-times me-1"></i>
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {}
                                        {mounted && expandedRow === college.college_name && (
                                            <tr>
                                                <td colSpan={7} style={{ padding: '0', backgroundColor: '#f9fafb' }}>
                                                    <div style={{ padding: '24px', borderTop: '2px solid #e5e7eb' }}>
                                                        {editingCollege === college.college_name && editFormData ? (

                                                            <div>
                                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                                    <h5 style={{ color: '#070642', fontWeight: '600', fontSize: '16px', margin: 0 }}>
                                                                        <i className="fas fa-edit me-2"></i>
                                                                        Edit College Details
                                                                    </h5>
                                                                    <div className="d-flex gap-2">
                                                                        <button
                                                                            onClick={handleSaveEdit}
                                                                            disabled={saveLoading}
                                                                            className="btn btn-sm"
                                                                            style={{
                                                                                backgroundColor: '#10b981',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                padding: '6px 16px',
                                                                                borderRadius: '5px',
                                                                                fontSize: '12px',
                                                                                fontWeight: '500'
                                                                            }}
                                                                        >
                                                                            {saveLoading ? (
                                                                                <>
                                                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                                                    Saving...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <i className="fas fa-save me-2"></i>
                                                                                    Save Changes
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            onClick={handleCancelEdit}
                                                                            className="btn btn-sm"
                                                                            style={{
                                                                                backgroundColor: '#6b7280',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                padding: '6px 16px',
                                                                                borderRadius: '5px',
                                                                                fontSize: '12px',
                                                                                fontWeight: '500'
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-times me-2"></i>
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="row g-4">
                                                                    {}
                                                                    <div className="col-md-6">
                                                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>College Name</label>
                                                                        <input type="text" className="form-control" value={editFormData.college_name} disabled style={{ fontSize: '13px', backgroundColor: '#f3f4f6' }} />
                                                                    </div>
                                                                    <div className="col-md-3">
                                                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Country</label>
                                                                        <input type="text" className="form-control" value={editFormData.country} onChange={(e) => updateFormField('country', e.target.value)} style={{ fontSize: '13px' }} />
                                                                    </div>
                                                                    <div className="col-md-3">
                                                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Location</label>
                                                                        <input type="text" className="form-control" value={editFormData.location} onChange={(e) => updateFormField('location', e.target.value)} style={{ fontSize: '13px' }} />
                                                                    </div>

                                                                    <div className="col-12">
                                                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>About</label>
                                                                        <textarea className="form-control" rows={3} value={editFormData.about} onChange={(e) => updateFormField('about', e.target.value)} style={{ fontSize: '13px' }} />
                                                                    </div>

                                                                    <div className="col-12">
                                                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Summary</label>
                                                                        <textarea className="form-control" rows={2} value={editFormData.summary} onChange={(e) => updateFormField('summary', e.target.value)} style={{ fontSize: '13px' }} />
                                                                    </div>

                                                                    {}
                                                                    <div className="col-md-3">
                                                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Faculty Staff</label>
                                                                        <input type="number" className="form-control" value={editFormData.faculty_staff} onChange={(e) => updateFormField('faculty_staff', parseInt(e.target.value))} style={{ fontSize: '13px' }} />
                                                                    </div>
                                                                    <div className="col-md-3">
                                                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>International Students</label>
                                                                        <input type="number" className="form-control" value={editFormData.international_students} onChange={(e) => updateFormField('international_students', parseInt(e.target.value))} style={{ fontSize: '13px' }} />
                                                                    </div>
                                                                    <div className="col-md-3">
                                                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Global Ranking</label>
                                                                        <input type="text" className="form-control" value={editFormData.global_ranking} onChange={(e) => updateFormField('global_ranking', e.target.value)} style={{ fontSize: '13px' }} />
                                                                    </div>
                                                                    <div className="col-md-3">
                                                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Gender Ratio (M/F %)</label>
                                                                        <div className="d-flex gap-2">
                                                                            <input type="number" className="form-control" placeholder="Male %" value={editFormData.student_gender_ratio?.male_percentage} onChange={(e) => updateNestedField('student_gender_ratio', 'male_percentage', parseInt(e.target.value))} style={{ fontSize: '13px' }} />
                                                                            <input type="number" className="form-control" placeholder="Female %" value={editFormData.student_gender_ratio?.female_percentage} onChange={(e) => updateNestedField('student_gender_ratio', 'female_percentage', parseInt(e.target.value))} style={{ fontSize: '13px' }} />
                                                                        </div>
                                                                    </div>

                                                                    {}
                                                                    <div className="col-12 mt-4">
                                                                        <h6 style={{ fontSize: '13px', fontWeight: '700', color: '#070642', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>Fee Structure (Yearly)</h6>
                                                                        <div className="row g-3">
                                                                            <div className="col-md-4">
                                                                                <label style={{ fontSize: '11px', color: '#6b7280' }}>UG Min - Max</label>
                                                                                <div className="d-flex gap-2">
                                                                                    <input type="number" className="form-control form-control-sm" value={editFormData.fees?.ug_yearly_min} onChange={(e) => updateNestedField('fees', 'ug_yearly_min', parseInt(e.target.value))} style={{ fontSize: '12px' }} />
                                                                                    <input type="number" className="form-control form-control-sm" value={editFormData.fees?.ug_yearly_max} onChange={(e) => updateNestedField('fees', 'ug_yearly_max', parseInt(e.target.value))} style={{ fontSize: '12px' }} />
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-md-4">
                                                                                <label style={{ fontSize: '11px', color: '#6b7280' }}>PG Min - Max</label>
                                                                                <div className="d-flex gap-2">
                                                                                    <input type="number" className="form-control form-control-sm" value={editFormData.fees?.pg_yearly_min} onChange={(e) => updateNestedField('fees', 'pg_yearly_min', parseInt(e.target.value))} style={{ fontSize: '12px' }} />
                                                                                    <input type="number" className="form-control form-control-sm" value={editFormData.fees?.pg_yearly_max} onChange={(e) => updateNestedField('fees', 'pg_yearly_max', parseInt(e.target.value))} style={{ fontSize: '12px' }} />
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-md-4">
                                                                                <label style={{ fontSize: '11px', color: '#6b7280' }}>PhD Min - Max</label>
                                                                                <div className="d-flex gap-2">
                                                                                    <input type="number" className="form-control form-control-sm" value={editFormData.fees?.phd_yearly_min} onChange={(e) => updateNestedField('fees', 'phd_yearly_min', parseInt(e.target.value))} style={{ fontSize: '12px' }} />
                                                                                    <input type="number" className="form-control form-control-sm" value={editFormData.fees?.phd_yearly_max} onChange={(e) => updateNestedField('fees', 'phd_yearly_max', parseInt(e.target.value))} style={{ fontSize: '12px' }} />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {}
                                                                    <div className="col-md-4 mt-4">
                                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                                            <h6 style={{ fontSize: '12px', fontWeight: '700', color: '#070642', margin: 0 }}>UG Programs</h6>
                                                                            <button type="button" onClick={() => addArrayItem('ug_programs', '')} className="btn btn-sm btn-outline-primary" style={{ padding: '2px 8px', fontSize: '10px' }}>+ Add</button>
                                                                        </div>
                                                                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px' }}>
                                                                            {editFormData.ug_programs?.map((program, idx) => (
                                                                                <div key={idx} className="d-flex gap-1 mb-1">
                                                                                    <input type="text" className="form-control form-control-sm" value={program} onChange={(e) => updateArrayItem('ug_programs', idx, e.target.value)} style={{ fontSize: '12px' }} />
                                                                                    <button type="button" onClick={() => removeArrayItem('ug_programs', idx)} className="btn btn-sm btn-outline-danger" style={{ padding: '0 6px' }}>&times;</button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4 mt-4">
                                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                                            <h6 style={{ fontSize: '12px', fontWeight: '700', color: '#070642', margin: 0 }}>PG Programs</h6>
                                                                            <button type="button" onClick={() => addArrayItem('pg_programs', '')} className="btn btn-sm btn-outline-primary" style={{ padding: '2px 8px', fontSize: '10px' }}>+ Add</button>
                                                                        </div>
                                                                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px' }}>
                                                                            {editFormData.pg_programs?.map((program, idx) => (
                                                                                <div key={idx} className="d-flex gap-1 mb-1">
                                                                                    <input type="text" className="form-control form-control-sm" value={program} onChange={(e) => updateArrayItem('pg_programs', idx, e.target.value)} style={{ fontSize: '12px' }} />
                                                                                    <button type="button" onClick={() => removeArrayItem('pg_programs', idx)} className="btn btn-sm btn-outline-danger" style={{ padding: '0 6px' }}>&times;</button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4 mt-4">
                                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                                            <h6 style={{ fontSize: '12px', fontWeight: '700', color: '#070642', margin: 0 }}>PhD Programs</h6>
                                                                            <button type="button" onClick={() => addArrayItem('phd_programs', '')} className="btn btn-sm btn-outline-primary" style={{ padding: '2px 8px', fontSize: '10px' }}>+ Add</button>
                                                                        </div>
                                                                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px' }}>
                                                                            {editFormData.phd_programs?.map((program, idx) => (
                                                                                <div key={idx} className="d-flex gap-1 mb-1">
                                                                                    <input type="text" className="form-control form-control-sm" value={program} onChange={(e) => updateArrayItem('phd_programs', idx, e.target.value)} style={{ fontSize: '12px' }} />
                                                                                    <button type="button" onClick={() => removeArrayItem('phd_programs', idx)} className="btn btn-sm btn-outline-danger" style={{ padding: '0 6px' }}>&times;</button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {}
                                                                    <div className="col-md-6 mt-4">
                                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                                            <h6 style={{ fontSize: '12px', fontWeight: '700', color: '#070642', margin: 0 }}>Scholarships</h6>
                                                                            <button type="button" onClick={() => addArrayItem('scholarships', '')} className="btn btn-sm btn-outline-primary" style={{ padding: '2px 8px', fontSize: '10px' }}>+ Add</button>
                                                                        </div>
                                                                        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px' }}>
                                                                            {editFormData.scholarships?.map((item, idx) => (
                                                                                <div key={idx} className="d-flex gap-1 mb-1">
                                                                                    <input type="text" className="form-control form-control-sm" value={item} onChange={(e) => updateArrayItem('scholarships', idx, e.target.value)} style={{ fontSize: '12px' }} />
                                                                                    <button type="button" onClick={() => removeArrayItem('scholarships', idx)} className="btn btn-sm btn-outline-danger" style={{ padding: '0 6px' }}>&times;</button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-6 mt-4">
                                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                                            <h6 style={{ fontSize: '12px', fontWeight: '700', color: '#070642', margin: 0 }}>Departments</h6>
                                                                            <button type="button" onClick={() => addArrayItem('departments', '')} className="btn btn-sm btn-outline-primary" style={{ padding: '2px 8px', fontSize: '10px' }}>+ Add</button>
                                                                        </div>
                                                                        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px' }}>
                                                                            {editFormData.departments?.map((item, idx) => (
                                                                                <div key={idx} className="d-flex gap-1 mb-1">
                                                                                    <input type="text" className="form-control form-control-sm" value={item} onChange={(e) => updateArrayItem('departments', idx, e.target.value)} style={{ fontSize: '12px' }} />
                                                                                    <button type="button" onClick={() => removeArrayItem('departments', idx)} className="btn btn-sm btn-outline-danger" style={{ padding: '0 6px' }}>&times;</button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {}
                                                                    <div className="col-12 mt-4">
                                                                        <div className="row">
                                                                            <div className="col-md-6">
                                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                                    <h6 style={{ fontSize: '12px', fontWeight: '700', color: '#070642', margin: 0 }}>Student Statistics</h6>
                                                                                    <button type="button" onClick={() => addArrayItem('student_statistics', { category: '', value: '' })} className="btn btn-sm btn-outline-primary" style={{ padding: '2px 8px', fontSize: '10px' }}>+ Add</button>
                                                                                </div>
                                                                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px' }}>
                                                                                    {editFormData.student_statistics?.map((stat, idx) => (
                                                                                        <div key={idx} className="d-flex gap-1 mb-2">
                                                                                            <input type="text" className="form-control form-control-sm" placeholder="Category" value={stat.category} onChange={(e) => {
                                                                                                const newStats = [...editFormData.student_statistics];
                                                                                                newStats[idx].category = e.target.value;
                                                                                                updateFormField('student_statistics', newStats);
                                                                                            }} style={{ fontSize: '12px' }} />
                                                                                            <input type="text" className="form-control form-control-sm" placeholder="Value" value={stat.value} onChange={(e) => {
                                                                                                const newStats = [...editFormData.student_statistics];
                                                                                                newStats[idx].value = e.target.value;
                                                                                                updateFormField('student_statistics', newStats);
                                                                                            }} style={{ fontSize: '12px' }} />
                                                                                            <button type="button" onClick={() => removeArrayItem('student_statistics', idx)} className="btn btn-sm btn-outline-danger" style={{ padding: '0 6px' }}>&times;</button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-md-6">
                                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                                    <h6 style={{ fontSize: '12px', fontWeight: '700', color: '#070642', margin: 0 }}>Additional Details</h6>
                                                                                    <button type="button" onClick={() => addArrayItem('additional_details', { category: '', value: '' })} className="btn btn-sm btn-outline-primary" style={{ padding: '2px 8px', fontSize: '10px' }}>+ Add</button>
                                                                                </div>
                                                                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px' }}>
                                                                                    {editFormData.additional_details?.map((detail, idx) => (
                                                                                        <div key={idx} className="d-flex gap-1 mb-2">
                                                                                            <input type="text" className="form-control form-control-sm" placeholder="Category" value={detail.category} onChange={(e) => {
                                                                                                const newDetails = [...editFormData.additional_details];
                                                                                                newDetails[idx].category = e.target.value;
                                                                                                updateFormField('additional_details', newDetails);
                                                                                            }} style={{ fontSize: '12px' }} />
                                                                                            <input type="text" className="form-control form-control-sm" placeholder="Value" value={detail.value} onChange={(e) => {
                                                                                                const newDetails = [...editFormData.additional_details];
                                                                                                newDetails[idx].value = e.target.value;
                                                                                                updateFormField('additional_details', newDetails);
                                                                                            }} style={{ fontSize: '12px' }} />
                                                                                            <button type="button" onClick={() => removeArrayItem('additional_details', idx)} className="btn btn-sm btn-outline-danger" style={{ padding: '0 6px' }}>&times;</button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {}
                                                                    <div className="col-12 mt-4">
                                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                                            <h6 style={{ fontSize: '12px', fontWeight: '700', color: '#070642', margin: 0 }}>Sources (URLs)</h6>
                                                                            <button type="button" onClick={() => addArrayItem('sources', '')} className="btn btn-sm btn-outline-primary" style={{ padding: '2px 8px', fontSize: '10px' }}>+ Add Source</button>
                                                                        </div>
                                                                        <div>
                                                                            {editFormData.sources?.map((source, idx) => (
                                                                                <div key={idx} className="d-flex gap-1 mb-1">
                                                                                    <input type="text" className="form-control form-control-sm" value={source} onChange={(e) => updateArrayItem('sources', idx, e.target.value)} style={{ fontSize: '12px' }} />
                                                                                    <button type="button" onClick={() => removeArrayItem('sources', idx)} className="btn btn-sm btn-outline-danger" style={{ padding: '0 6px' }}>&times;</button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (

                                                            <div>
                                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                                    <h5 style={{ color: '#070642', fontWeight: '600', fontSize: '16px', margin: 0 }}>
                                                                        <i className="fas fa-info-circle me-2"></i>
                                                                        College Details
                                                                    </h5>
                                                                    <button
                                                                        onClick={() => handleEdit(college)}
                                                                        className="btn btn-sm"
                                                                        style={{
                                                                            backgroundColor: '#3b82f6',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            padding: '6px 16px',
                                                                            borderRadius: '5px',
                                                                            fontSize: '12px',
                                                                            fontWeight: '500'
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-edit me-2"></i>
                                                                        Edit Details
                                                                    </button>
                                                                </div>

                                                                <div className="row g-3">
                                                                    <div className="col-md-12">
                                                                        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                                            <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#070642', marginBottom: '8px' }}>About</h6>
                                                                            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{college.about}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-12">
                                                                        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                                            <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#070642', marginBottom: '8px' }}>Summary</h6>
                                                                            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{college.summary}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                                            <h6 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Faculty Staff</h6>
                                                                            <p style={{ fontSize: '18px', fontWeight: '700', color: '#070642', margin: 0 }}>{college.faculty_staff?.toLocaleString() || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                                            <h6 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>International Students</h6>
                                                                            <p style={{ fontSize: '18px', fontWeight: '700', color: '#070642', margin: 0 }}>{college.international_students?.toLocaleString() || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                                            <h6 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Global Ranking</h6>
                                                                            <p style={{ fontSize: '18px', fontWeight: '700', color: '#070642', margin: 0 }}>{college.global_ranking || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                    {college.departments && college.departments.length > 0 && (
                                                                        <div className="col-md-12">
                                                                            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                                                <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#070642', marginBottom: '8px' }}>Departments</h6>
                                                                                <div className="d-flex flex-wrap gap-2">
                                                                                    {college.departments.map((dept, idx) => (
                                                                                        <span key={idx} style={{
                                                                                            backgroundColor: '#dbeafe',
                                                                                            color: '#3b82f6',
                                                                                            padding: '4px 12px',
                                                                                            borderRadius: '12px',
                                                                                            fontSize: '11px',
                                                                                            fontWeight: '500'
                                                                                        }}>
                                                                                            {dept}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {}
            {viewingFullDetails && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 9998,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                    onClick={() => setViewingFullDetails(null)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            maxWidth: '1200px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {}
                        <div style={{
                            padding: '24px',
                            borderBottom: '2px solid #e5e7eb',
                            position: 'sticky',
                            top: 0,
                            backgroundColor: 'white',
                            zIndex: 10
                        }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 style={{ color: '#070642', fontWeight: '700', margin: 0 }}>
                                        {viewingFullDetails.college_name}
                                    </h4>
                                    <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>
                                        <i className="fas fa-map-marker-alt me-2"></i>
                                        {viewingFullDetails.location}, {viewingFullDetails.country}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setViewingFullDetails(null)}
                                    className="btn btn-sm"
                                    style={{
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <i className="fas fa-times me-2"></i>
                                    Close
                                </button>
                            </div>
                        </div>

                        {}
                        <div style={{ padding: '24px' }}>
                            <div className="row g-4">
                                {}
                                <div className="col-12">
                                    <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                                        <h6 style={{ color: '#070642', fontWeight: '600', marginBottom: '12px' }}>
                                            <i className="fas fa-info-circle me-2"></i>About
                                        </h6>
                                        <p style={{ color: '#374151', fontSize: '14px', margin: 0 }}>
                                            {viewingFullDetails.about}
                                        </p>
                                    </div>
                                </div>

                                {}
                                <div className="col-12">
                                    <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                                        <h6 style={{ color: '#070642', fontWeight: '600', marginBottom: '12px' }}>
                                            <i className="fas fa-file-alt me-2"></i>Summary
                                        </h6>
                                        <p style={{ color: '#374151', fontSize: '14px', margin: 0 }}>
                                            {viewingFullDetails.summary}
                                        </p>
                                    </div>
                                </div>

                                {}
                                <div className="col-md-4">
                                    <div style={{ backgroundColor: '#dbeafe', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                                        <i className="fas fa-users" style={{ fontSize: '24px', color: '#3b82f6', marginBottom: '8px' }}></i>
                                        <h3 style={{ color: '#070642', fontWeight: '700', margin: '8px 0 4px 0' }}>
                                            {viewingFullDetails.faculty_staff?.toLocaleString() || 'N/A'}
                                        </h3>
                                        <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Faculty Staff</p>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div style={{ backgroundColor: '#d1fae5', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                                        <i className="fas fa-globe" style={{ fontSize: '24px', color: '#10b981', marginBottom: '8px' }}></i>
                                        <h3 style={{ color: '#070642', fontWeight: '700', margin: '8px 0 4px 0' }}>
                                            {viewingFullDetails.international_students?.toLocaleString() || 'N/A'}
                                        </h3>
                                        <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>International Students</p>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                                        <i className="fas fa-trophy" style={{ fontSize: '24px', color: '#f59e0b', marginBottom: '8px' }}></i>
                                        <h3 style={{ color: '#070642', fontWeight: '700', margin: '8px 0 4px 0' }}>
                                            {viewingFullDetails.global_ranking || 'N/A'}
                                        </h3>
                                        <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Global Ranking</p>
                                    </div>
                                </div>

                                {}
                                {viewingFullDetails.ug_programs && viewingFullDetails.ug_programs.length > 0 && (
                                    <div className="col-md-4">
                                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                                            <h6 style={{ color: '#070642', fontWeight: '600', marginBottom: '12px' }}>
                                                <i className="fas fa-graduation-cap me-2"></i>UG Programs
                                            </h6>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                                                {viewingFullDetails.ug_programs.map((program, idx) => (
                                                    <li key={idx}>{program}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                                {viewingFullDetails.pg_programs && viewingFullDetails.pg_programs.length > 0 && (
                                    <div className="col-md-4">
                                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                                            <h6 style={{ color: '#070642', fontWeight: '600', marginBottom: '12px' }}>
                                                <i className="fas fa-user-graduate me-2"></i>PG Programs
                                            </h6>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                                                {viewingFullDetails.pg_programs.map((program, idx) => (
                                                    <li key={idx}>{program}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                                {viewingFullDetails.phd_programs && viewingFullDetails.phd_programs.length > 0 && (
                                    <div className="col-md-4">
                                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                                            <h6 style={{ color: '#070642', fontWeight: '600', marginBottom: '12px' }}>
                                                <i className="fas fa-book me-2"></i>PhD Programs
                                            </h6>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                                                {viewingFullDetails.phd_programs.map((program, idx) => (
                                                    <li key={idx}>{program}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {}
                                {viewingFullDetails.fees && (
                                    <div className="col-12">
                                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                                            <h6 style={{ color: '#070642', fontWeight: '600', marginBottom: '12px' }}>
                                                <i className="fas fa-dollar-sign me-2"></i>Fee Structure
                                            </h6>
                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>UG Yearly</p>
                                                    <p style={{ fontSize: '14px', color: '#070642', fontWeight: '600', margin: 0 }}>
                                                        ${viewingFullDetails.fees.ug_yearly_min?.toLocaleString()} - ${viewingFullDetails.fees.ug_yearly_max?.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="col-md-4">
                                                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>PG Yearly</p>
                                                    <p style={{ fontSize: '14px', color: '#070642', fontWeight: '600', margin: 0 }}>
                                                        ${viewingFullDetails.fees.pg_yearly_min?.toLocaleString()} - ${viewingFullDetails.fees.pg_yearly_max?.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="col-md-4">
                                                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>PhD Yearly</p>
                                                    <p style={{ fontSize: '14px', color: '#070642', fontWeight: '600', margin: 0 }}>
                                                        ${viewingFullDetails.fees.phd_yearly_min?.toLocaleString()} - ${viewingFullDetails.fees.phd_yearly_max?.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {}
                                {viewingFullDetails.scholarships && viewingFullDetails.scholarships.length > 0 && (
                                    <div className="col-md-6">
                                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                                            <h6 style={{ color: '#070642', fontWeight: '600', marginBottom: '12px' }}>
                                                <i className="fas fa-award me-2"></i>Scholarships
                                            </h6>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                                                {viewingFullDetails.scholarships.map((scholarship, idx) => (
                                                    <li key={idx}>{scholarship}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {}
                                {viewingFullDetails.departments && viewingFullDetails.departments.length > 0 && (
                                    <div className="col-md-6">
                                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                                            <h6 style={{ color: '#070642', fontWeight: '600', marginBottom: '12px' }}>
                                                <i className="fas fa-building me-2"></i>Departments
                                            </h6>
                                            <div className="d-flex flex-wrap gap-2">
                                                {viewingFullDetails.departments.map((dept, idx) => (
                                                    <span key={idx} style={{
                                                        backgroundColor: '#dbeafe',
                                                        color: '#3b82f6',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}>
                                                        {dept}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {}
                                {viewingFullDetails.student_statistics && viewingFullDetails.student_statistics.length > 0 && (
                                    <div className="col-12">
                                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                                            <h6 style={{ color: '#070642', fontWeight: '600', marginBottom: '12px' }}>
                                                <i className="fas fa-chart-bar me-2"></i>Student Statistics
                                            </h6>
                                            <div className="row g-3">
                                                {viewingFullDetails.student_statistics.map((stat, idx) => (
                                                    <div key={idx} className="col-md-3">
                                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>{stat.category}</p>
                                                        <p style={{ fontSize: '16px', color: '#070642', fontWeight: '600', margin: 0 }}>
                                                            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {}
                                {viewingFullDetails.additional_details && viewingFullDetails.additional_details.length > 0 && (
                                    <div className="col-12">
                                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                                            <h6 style={{ color: '#070642', fontWeight: '600', marginBottom: '12px' }}>
                                                <i className="fas fa-list me-2"></i>Additional Details
                                            </h6>
                                            <div className="row g-3">
                                                {viewingFullDetails.additional_details.map((detail, idx) => (
                                                    <div key={idx} className="col-md-4">
                                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>{detail.category}</p>
                                                        <p style={{ fontSize: '14px', color: '#070642', fontWeight: '600', margin: 0 }}>
                                                            {typeof detail.value === 'number' ? detail.value.toLocaleString() : detail.value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {}
                                {viewingFullDetails.sources && viewingFullDetails.sources.length > 0 && (
                                    <div className="col-12">
                                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                                            <h6 style={{ color: '#070642', fontWeight: '600', marginBottom: '12px' }}>
                                                <i className="fas fa-link me-2"></i>Sources
                                            </h6>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                                                {viewingFullDetails.sources.map((source, idx) => (
                                                    <li key={idx}>
                                                        <a href={source} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                                                            {source}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {}
            {toast && (
                <div
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 9999,
                        animation: 'slideInRight 0.3s ease-out'
                    }}
                >
                    <div
                        style={{
                            backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
                            color: 'white',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            minWidth: '300px',
                            maxWidth: '500px'
                        }}
                    >
                        <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: '500' }}>{toast.message}</span>
                        <button
                            onClick={() => setToast(null)}
                            className="btn-close btn-close-white btn-close-sm"
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
                .table tbody tr:hover {
                    background-color: #f9fafb;
                }
            `}</style>
        </AdminLayout>
    );
}
