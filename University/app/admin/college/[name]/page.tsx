'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { API_URL, SERPER_API_URL } from '@/lib/config';

interface StatItem {
    category: string;
    value: number | string;
}

interface CollegeData {
    college_name: string;
    country: string;
    about: string;
    location: string;
    approval_status: string;
    student_statistics: StatItem[];
    additional_details?: StatItem[];
    summary?: string;
}

export default function AdminCollegeEditPage() {
    const { user, token, isAdmin, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const collegeName = decodeURIComponent(params.name as string);

    const [collegeData, setCollegeData] = useState<CollegeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (!authLoading && (!user || !isAdmin())) {
            router.push('/admin/login');
        }
    }, [user, authLoading, isAdmin, router]);

    useEffect(() => {
        if (token && isAdmin()) {
            fetchCollegeDetails();
        }
    }, [token, collegeName]);

    const fetchCollegeDetails = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(
                `${SERPER_API_URL}/api/college-statistics?college_name=${encodeURIComponent(collegeName)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setCollegeData(data);
            }
        } catch (err) {
            setError('Failed to fetch college data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!collegeData) return;

        try {
            setSaving(true);
            setError('');
            setSuccessMessage('');

            const response = await fetch(`${API_URL}/api/admin/update-college`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(collegeData),
            });

            const result = await response.json();

            if (response.ok) {
                setSuccessMessage(' College updated successfully! Refreshing page...');
                setIsEditMode(false);
                

                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                setError(result.error || 'Failed to update college');

                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            setError('Failed to save changes');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const updateStatValue = (index: number, newValue: string) => {
        if (!collegeData) return;

        const updatedStats = [...collegeData.student_statistics];
        const numValue = parseFloat(newValue);
        updatedStats[index] = {
            ...updatedStats[index],
            value: isNaN(numValue) ? newValue : numValue
        };

        setCollegeData({
            ...collegeData,
            student_statistics: updatedStats
        });
    };

    const updateAdditionalDetail = (index: number, newValue: string) => {
        if (!collegeData || !collegeData.additional_details) return;

        const updatedDetails = [...collegeData.additional_details];
        const numValue = parseFloat(newValue);
        updatedDetails[index] = {
            ...updatedDetails[index],
            value: isNaN(numValue) ? newValue : numValue
        };

        setCollegeData({
            ...collegeData,
            additional_details: updatedDetails
        });
    };

    if (authLoading || loading) {
        return (
            <AdminLayout>
                <div className="text-center py-5">
                    <div className="spinner-border" style={{ color: '#070642' }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted" style={{ fontSize: '13px' }}>Loading college details...</p>
                </div>
            </AdminLayout>
        );
    }

    if (!user || !isAdmin()) {
        return null;
    }

    if (error && !collegeData) {
        return (
            <AdminLayout>
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
                <button
                    onClick={() => router.back()}
                    className="btn btn-secondary"
                >
                    ← Go Back
                </button>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="mb-1" style={{ color: '#070642', fontWeight: '700', fontSize: '24px' }}>
                        {isEditMode ? 'Edit College' : 'View College Details'}
                    </h3>
                    <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                        {collegeData?.college_name}
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        onClick={() => router.back()}
                        className="btn btn-sm"
                        style={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                    >
                        ← Back
                    </button>
                    {!isEditMode ? (
                        <>
                            <button
                                onClick={() => {
                                    setSuccessMessage('');
                                    setError('');
                                    fetchCollegeDetails();
                                }}
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
                                onClick={() => setIsEditMode(true)}
                                className="btn btn-sm"
                                style={{
                                    backgroundColor: '#070642',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 20px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500'
                                }}
                            >
                                <i className="fas fa-edit me-2"></i>
                                Edit
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                                        setIsEditMode(false);
                                        setError('');
                                        setSuccessMessage('');

                                        fetchCollegeDetails();
                                    }
                                }}
                                className="btn btn-sm"
                                disabled={saving}
                                style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 20px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500'
                                }}
                            >
                                <i className="fas fa-times me-2"></i>
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
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
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save me-2"></i>
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {}
            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    <i className="fas fa-check-circle me-2"></i>
                    {successMessage}
                    <div className="mt-2" style={{ fontSize: '12px', opacity: 0.9 }}>
                        <i className="fas fa-info-circle me-1"></i>
                        Cache has been invalidated and RabbitMQ will update it with fresh data from the database.
                    </div>
                    <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                </div>
            )}

            {}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            {collegeData && (
                <>
                    {}
                    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '8px' }}>
                        <div className="card-body p-4">
                            <h5 className="mb-3" style={{ color: '#070642', fontWeight: '600' }}>Basic Information</h5>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '500' }}>College Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={collegeData.college_name}
                                        disabled
                                        style={{ fontSize: '13px', backgroundColor: '#f9fafb' }}
                                    />
                                    <small className="text-muted" style={{ fontSize: '11px' }}>College name cannot be changed</small>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '500' }}>Country</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={collegeData.country}
                                        onChange={(e) => setCollegeData({ ...collegeData, country: e.target.value })}
                                        disabled={!isEditMode}
                                        style={{ fontSize: '13px' }}
                                    />
                                </div>
                                <div className="col-md-12">
                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '500' }}>Location</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={collegeData.location}
                                        onChange={(e) => setCollegeData({ ...collegeData, location: e.target.value })}
                                        disabled={!isEditMode}
                                        style={{ fontSize: '13px' }}
                                    />
                                </div>
                                <div className="col-md-12">
                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '500' }}>About</label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        value={collegeData.about || ''}
                                        onChange={(e) => setCollegeData({ ...collegeData, about: e.target.value })}
                                        disabled={!isEditMode}
                                        style={{ fontSize: '13px' }}
                                        placeholder="Enter detailed information about the college..."
                                    />
                                </div>
                                <div className="col-md-12">
                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '500' }}>Summary</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={collegeData.summary || ''}
                                        onChange={(e) => setCollegeData({ ...collegeData, summary: e.target.value })}
                                        disabled={!isEditMode}
                                        style={{ fontSize: '13px' }}
                                        placeholder="Enter a brief summary..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '8px' }}>
                        <div className="card-body p-4">
                            <h5 className="mb-3" style={{ color: '#070642', fontWeight: '600' }}>Student Statistics</h5>
                            <div className="table-responsive">
                                <table className="table table-hover" style={{ fontSize: '13px' }}>
                                    <thead style={{ backgroundColor: '#f9fafb' }}>
                                        <tr>
                                            <th style={{ padding: '12px', fontWeight: '600' }}>Category</th>
                                            <th style={{ padding: '12px', fontWeight: '600' }}>Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {collegeData.student_statistics?.map((stat, index) => (
                                            <tr key={index}>
                                                <td style={{ padding: '12px', verticalAlign: 'middle' }}>{stat.category}</td>
                                                <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                                                    {isEditMode ? (
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            value={stat.value}
                                                            onChange={(e) => updateStatValue(index, e.target.value)}
                                                            style={{ fontSize: '13px', maxWidth: '200px' }}
                                                        />
                                                    ) : (
                                                        <span>{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {}
                    {collegeData.additional_details && collegeData.additional_details.length > 0 && (
                        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '8px' }}>
                            <div className="card-body p-4">
                                <h5 className="mb-3" style={{ color: '#070642', fontWeight: '600' }}>Additional Details</h5>
                                <div className="table-responsive">
                                    <table className="table table-hover" style={{ fontSize: '13px' }}>
                                        <thead style={{ backgroundColor: '#f9fafb' }}>
                                            <tr>
                                                <th style={{ padding: '12px', fontWeight: '600' }}>Category</th>
                                                <th style={{ padding: '12px', fontWeight: '600' }}>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {collegeData.additional_details.map((detail, index) => (
                                                <tr key={index}>
                                                    <td style={{ padding: '12px', verticalAlign: 'middle' }}>{detail.category}</td>
                                                    <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                                                        {isEditMode ? (
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={detail.value}
                                                                onChange={(e) => updateAdditionalDetail(index, e.target.value)}
                                                                style={{ fontSize: '13px', maxWidth: '200px' }}
                                                            />
                                                        ) : (
                                                            <span>{typeof detail.value === 'number' ? detail.value.toLocaleString() : detail.value}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </AdminLayout>
    );
}
