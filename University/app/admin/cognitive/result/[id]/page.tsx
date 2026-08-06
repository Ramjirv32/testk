'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { API_URL } from '@/lib/config';
import Link from 'next/link';

interface Answer {
    question_id: number;
    question: string;
    selected_option: number;
    score: number;
}

interface ResultDetail {
    id: string;
    user_id: string;
    email: string;
    name: string;
    age: number;
    student_type: string;
    answers: Answer[];
    total_score: number;
    max_score: number;
    percentage: number;
    interpretation: string;
    total_time_spent: number;
    completed_at: string;
}

export default function CognitiveResultDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user, token, isLoading } = useAuth();
    const [result, setResult] = useState<ResultDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && token && params.id) {
            fetchResultDetail();
        }
    }, [user, token, isLoading, params.id]);

    const fetchResultDetail = async () => {
        setLoading(true);
        try {

            const response = await fetch(`${API_URL}/api/admin/cognitive/result/${params.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data.result);
            } else {
                alert('Failed to fetch result details');
                router.push('/admin/cognitive');
            }
        } catch (error) {
            console.error('Error fetching result:', error);
            alert('An error occurred');
            router.push('/admin/cognitive');
        } finally {
            setLoading(false);
        }
    };

    const getPercentageColor = (percentage: number): string => {
        if (percentage >= 80) return '#10b981';
        if (percentage >= 60) return '#f59e0b';
        if (percentage >= 40) return '#3b82f6';
        return '#ef4444';
    };

    const getPerformanceLabel = (percentage: number): string => {
        if (percentage >= 80) return 'Excellent';
        if (percentage >= 60) return 'Good';
        if (percentage >= 40) return 'Average';
        return 'Below Average';
    };

    return (
        <AdminLayout>
            {loading || !result ? (
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <>
                    {}
                    <div className="card border-0 shadow-sm mb-4" style={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                        color: 'white',
                        borderRadius: '8px'
                    }}>
                        <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="mb-1" style={{ fontSize: '20px', fontWeight: '600' }}>Cognitive Test Result Details</h4>
                                    <p className="mb-0 opacity-75" style={{ fontSize: '13px' }}>{result.name} - {result.email}</p>
                                </div>
                                <Link
                                    href="/admin/cognitive"
                                    className="btn btn-light btn-sm"
                                >
                                    ← Back to Cognitive
                                </Link>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Student Information</h5>
                            <div className="row">
                                <div className="col-md-3">
                                    <strong>Name:</strong> {result.name}
                                </div>
                                <div className="col-md-3">
                                    <strong>Email:</strong> {result.email}
                                </div>
                                <div className="col-md-2">
                                    <strong>Age:</strong> {result.age}
                                </div>
                                <div className="col-md-2">
                                    <strong>Type:</strong> {result.student_type}
                                </div>
                                <div className="col-md-2">
                                    <strong>Completed:</strong> {new Date(result.completed_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm" style={{
                                borderLeft: `4px solid ${getPercentageColor(result.percentage)}`,
                                borderRadius: '8px'
                            }}>
                                <div className="card-body p-3 text-center">
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600' }}>
                                        Total Score
                                    </p>
                                    <h3 className="mb-0" style={{ color: getPercentageColor(result.percentage), fontSize: '28px' }}>
                                        {result.total_score}/{result.max_score}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm" style={{
                                borderLeft: `4px solid ${getPercentageColor(result.percentage)}`,
                                borderRadius: '8px'
                            }}>
                                <div className="card-body p-3 text-center">
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600' }}>
                                        Percentage
                                    </p>
                                    <h3 className="mb-0" style={{ color: getPercentageColor(result.percentage), fontSize: '28px' }}>
                                        {result.percentage?.toFixed(1)}%
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm" style={{
                                borderLeft: `4px solid ${getPercentageColor(result.percentage)}`,
                                borderRadius: '8px'
                            }}>
                                <div className="card-body p-3 text-center">
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600' }}>
                                        Performance
                                    </p>
                                    <h3 className="mb-0" style={{ color: getPercentageColor(result.percentage), fontSize: '22px' }}>
                                        {getPerformanceLabel(result.percentage)}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm" style={{
                                borderLeft: '4px solid #6b7280',
                                borderRadius: '8px'
                            }}>
                                <div className="card-body p-3 text-center">
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600' }}>
                                        Time Spent
                                    </p>
                                    <h3 className="mb-0" style={{ color: '#6b7280', fontSize: '22px' }}>
                                        {result.total_time_spent ? `${Math.floor(result.total_time_spent / 60)}m ${result.total_time_spent % 60}s` : 'N/A'}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    {result.interpretation && (
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-body">
                                <h5 className="card-title mb-3">
                                    <i className="fas fa-chart-line me-2" style={{ color: '#2563eb' }}></i>
                                    Interpretation
                                </h5>
                                <div className="p-3 rounded" style={{
                                    backgroundColor: getPercentageColor(result.percentage) + '15',
                                    borderLeft: `4px solid ${getPercentageColor(result.percentage)}`
                                }}>
                                    <p className="mb-0" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                                        {result.interpretation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Question-wise Answers</h5>
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                                        <tr>
                                            <th style={{ width: '60px' }}>Q#</th>
                                            <th>Question</th>
                                            <th style={{ width: '150px' }}>Response Status</th>
                                            <th style={{ width: '80px' }} className="text-center">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.answers && result.answers.length > 0 ? (
                                            result.answers.map((answer, index) => (
                                                <tr key={answer.question_id || index}>
                                                    <td className="fw-bold">{index + 1}</td>
                                                    <td>{answer.question || `Question ${answer.question_id}`}</td>
                                                    <td>
                                                        <span className={`badge ${answer.score > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`} style={{ fontSize: '11px' }}>
                                                            {answer.score > 0 ? 'Correct' : 'Incorrect'}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`badge ${answer.score > 0 ? 'bg-success' : 'bg-danger'}`} style={{
                                                            color: 'white',
                                                            fontSize: '12px',
                                                            minWidth: '30px'
                                                        }}>
                                                            {answer.score}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center text-muted py-4">
                                                    No answer details available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
