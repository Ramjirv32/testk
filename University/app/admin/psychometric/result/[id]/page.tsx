'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { API_URL } from '@/lib/config';
import Link from 'next/link';
import { useEffect, useReducer, useCallback, useRef } from 'react';

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

interface State {
    result: ResultDetail | null;
    loading: boolean;
}

type Action =
    | { type: 'SET_RESULT'; payload: ResultDetail }
    | { type: 'SET_LOADING'; payload: boolean };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_RESULT':
            return { ...state, result: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        default:
            return state;
    }
}

export default function PsychometricResultDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user, token, isLoading } = useAuth();

    const hasFetchedRef = useRef(false);

    const [state, dispatch] = useReducer(reducer, {
        result: null,
        loading: true
    });

    const fetchResultDetail = useCallback(async () => {
        if (!token || !params.id) return;

        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await fetch(`${API_URL}/api/admin/psychometric/result/${params.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                dispatch({ type: 'SET_RESULT', payload: data.result });
            } else {
                alert('Failed to fetch result details');
                router.push('/admin/psychometric');
            }
        } catch (error) {
            console.error('Error fetching result:', error);
            alert('An error occurred');
            router.push('/admin/psychometric');
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [token, params.id, router]);

    useEffect(() => {
        if (hasFetchedRef.current) return;

        if (isLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (token && params.id) {
            hasFetchedRef.current = true;
            fetchResultDetail();
        }
    }, [user, token, isLoading, params.id, fetchResultDetail, router]);

    const getScoreLabel = useCallback((score: number): string => {
        switch (score) {
            case 5: return 'Strongly Agree';
            case 4: return 'Agree';
            case 3: return 'Neutral';
            case 2: return 'Disagree';
            case 1: return 'Strongly Disagree';
            default: return 'N/A';
        }
    }, []);

    const getScoreColor = useCallback((score: number): string => {
        if (score >= 4) return '#10b981';
        if (score === 3) return '#f59e0b';
        return '#ef4444';
    }, []);

    const getPercentageColor = useCallback((percentage: number): string => {
        if (percentage >= 80) return '#10b981';
        if (percentage >= 60) return '#f59e0b';
        if (percentage >= 40) return '#3b82f6';
        return '#ef4444';
    }, []);

    const getPerformanceLabel = useCallback((percentage: number): string => {
        if (percentage >= 80) return 'Excellent';
        if (percentage >= 60) return 'Good';
        if (percentage >= 40) return 'Average';
        return 'Below Average';
    }, []);

    return (
        <AdminLayout>
            {state.loading || !state.result ? (
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <>
                    {}
                    <div className="card border-0 shadow-sm mb-4" style={{
                        background: 'linear-gradient(135deg, #9a3197 0%, #7c2a79 100%)',
                        color: 'white',
                        borderRadius: '8px'
                    }}>
                        <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="mb-1" style={{ fontSize: '20px', fontWeight: '600' }}>Psychometric Test Result Details</h4>
                                    <p className="mb-0 opacity-75" style={{ fontSize: '13px' }}>{state.result.name} - {state.result.email}</p>
                                </div>
                                <Link
                                    href="/admin/psychometric"
                                    className="btn btn-light btn-sm"
                                >
                                    ← Back to Psychometric
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
                                    <strong>Name:</strong> {state.result.name}
                                </div>
                                <div className="col-md-3">
                                    <strong>Email:</strong> {state.result.email}
                                </div>
                                <div className="col-md-2">
                                    <strong>Age:</strong> {state.result.age}
                                </div>
                                <div className="col-md-2">
                                    <strong>Type:</strong> {state.result.student_type}
                                </div>
                                <div className="col-md-2">
                                    <strong>Completed:</strong> {new Date(state.result.completed_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm" style={{
                                borderLeft: `4px solid ${getPercentageColor(state.result.percentage)}`,
                                borderRadius: '8px'
                            }}>
                                <div className="card-body p-3 text-center">
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600' }}>
                                        Total Score
                                    </p>
                                    <h3 className="mb-0" style={{ color: getPercentageColor(state.result.percentage), fontSize: '28px' }}>
                                        {state.result.total_score}/{state.result.max_score}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm" style={{
                                borderLeft: `4px solid ${getPercentageColor(state.result.percentage)}`,
                                borderRadius: '8px'
                            }}>
                                <div className="card-body p-3 text-center">
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600' }}>
                                        Percentage
                                    </p>
                                    <h3 className="mb-0" style={{ color: getPercentageColor(state.result.percentage), fontSize: '28px' }}>
                                        {state.result.percentage?.toFixed(1)}%
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm" style={{
                                borderLeft: `4px solid ${getPercentageColor(state.result.percentage)}`,
                                borderRadius: '8px'
                            }}>
                                <div className="card-body p-3 text-center">
                                    <p className="text-muted mb-1 text-uppercase" style={{ fontSize: '11px', fontWeight: '600' }}>
                                        Performance
                                    </p>
                                    <h3 className="mb-0" style={{ color: getPercentageColor(state.result.percentage), fontSize: '22px' }}>
                                        {getPerformanceLabel(state.result.percentage)}
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
                                        {state.result.total_time_spent ? `${Math.floor(state.result.total_time_spent / 60)}m ${state.result.total_time_spent % 60}s` : 'N/A'}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    {state.result.interpretation && (
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-body">
                                <h5 className="card-title mb-3">
                                    <i className="fas fa-chart-line me-2" style={{ color: '#9a3197' }}></i>
                                    Interpretation
                                </h5>
                                <div className="p-3 rounded" style={{
                                    backgroundColor: getPercentageColor(state.result.percentage) + '15',
                                    borderLeft: `4px solid ${getPercentageColor(state.result.percentage)}`
                                }}>
                                    <p className="mb-0" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                                        {state.result.interpretation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Score Distribution</h5>
                            <div className="table-responsive">
                                <table className="table table-bordered mb-0">
                                    <thead style={{ backgroundColor: '#9a3197', color: 'white' }}>
                                        <tr>
                                            <th>Response Type</th>
                                            <th className="text-center">Count</th>
                                            <th className="text-center">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[5, 4, 3, 2, 1].map(score => {
                                            const count = state.result?.answers?.filter(a => a.score === score).length || 0;
                                            const percentage = state.result?.answers?.length ? (count / state.result.answers.length * 100).toFixed(1) : 0;
                                            return (
                                                <tr key={`score-${score}`}>
                                                    <td>
                                                        <span className="badge me-2" style={{
                                                            backgroundColor: getScoreColor(score),
                                                            minWidth: '25px'
                                                        }}>
                                                            {score}
                                                        </span>
                                                        {getScoreLabel(score)}
                                                    </td>
                                                    <td className="text-center fw-bold">{count}</td>
                                                    <td className="text-center">
                                                        <div className="progress" style={{ height: '20px' }}>
                                                            <div
                                                                className="progress-bar"
                                                                style={{
                                                                    width: `${percentage}%`,
                                                                    backgroundColor: getScoreColor(score)
                                                                }}
                                                            >
                                                                {percentage}%
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

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
                                            <th style={{ width: '150px' }}>Response</th>
                                            <th style={{ width: '80px' }} className="text-center">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {state.result.answers && state.result.answers.length > 0 ? (
                                            state.result.answers.map((answer, index) => (
                                                <tr key={`answer-${answer.question_id}`}>
                                                    <td className="fw-bold">{index + 1}</td>
                                                    <td>{answer.question}</td>
                                                    <td>
                                                        <span className="badge" style={{
                                                            backgroundColor: getScoreColor(answer.score) + '20',
                                                            color: getScoreColor(answer.score),
                                                            fontSize: '11px'
                                                        }}>
                                                            {getScoreLabel(answer.score)}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge" style={{
                                                            backgroundColor: getScoreColor(answer.score),
                                                            color: 'white',
                                                            fontSize: '12px',
                                                            minWidth: '30px'
                                                        }}>
                                                            {answer.score}/5
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
