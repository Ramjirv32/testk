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
    user_answer: number;
}

interface ResultDetail {
    id: string;
    user_id: string;
    email: string;
    name: string;
    age: number;
    student_type: string;
    practical_score: number;
    enterprising_score: number;
    social_score: number;
    creative_score: number;
    investigative_score: number;
    organisational_score: number;
    top_category: string;
    completed_at: string;
    answers: Answer[];
}

export default function PESCIOResultDetailPage() {
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
            const response = await fetch(`${API_URL}/api/admin/pescio/result/${params.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data.result);
            } else {
                alert('Failed to fetch result details');
                router.push('/admin/pescio');
            }
        } catch (error) {
            console.error('Error fetching result:', error);
            alert('An error occurred');
            router.push('/admin/pescio');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !result) {
        return (
            <AdminLayout>
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const categories = [
        { key: 'practical_score', label: 'Practical (P)', color: '#ef4444' },
        { key: 'enterprising_score', label: 'Enterprising (E)', color: '#f59e0b' },
        { key: 'social_score', label: 'Social (S)', color: '#10b981' },
        { key: 'creative_score', label: 'Creative (C)', color: '#8b5cf6' },
        { key: 'investigative_score', label: 'Investigative (I)', color: '#06b6d4' },
        { key: 'organisational_score', label: 'Organisational (O)', color: '#ec4899' },
    ];

    return (
        <AdminLayout>
            {}
            <div className="card border-0 shadow-sm mb-4" style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                color: 'white',
                borderRadius: '8px'
            }}>
                <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1" style={{ fontSize: '20px', fontWeight: '600' }}>PESCIO Test Result Details</h4>
                            <p className="mb-0 opacity-75" style={{ fontSize: '13px' }}>{result.name} - {result.email}</p>
                        </div>
                        <Link
                            href="/admin/pescio"
                            className="btn btn-light btn-sm"
                        >
                            ← Back to PESCIO
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
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-3">Category Scores</h5>
                    <div className="row g-3">
                        {categories.map((cat) => {
                            const score = cat.key === 'practical_score' ? result.practical_score :
                                cat.key === 'enterprising_score' ? result.enterprising_score :
                                    cat.key === 'social_score' ? result.social_score :
                                        cat.key === 'creative_score' ? result.creative_score :
                                            cat.key === 'investigative_score' ? result.investigative_score :
                                                result.organisational_score;

                            return (
                                <div key={cat.key} className="col-md-2">
                                    <div className="card border-0" style={{ backgroundColor: cat.color + '20', borderLeft: `4px solid ${cat.color}` }}>
                                        <div className="card-body p-3 text-center">
                                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>{cat.label}</div>
                                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: cat.color }}>
                                                {score || 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-3 text-center">
                        <span className="badge" style={{ backgroundColor: '#06b6d4', color: 'white', fontSize: '16px', padding: '10px 20px' }}>
                            Top Category: {result.top_category}
                        </span>
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
                                    <th style={{ width: '80px' }}>Q#</th>
                                    <th>Question</th>
                                    <th style={{ width: '150px' }}>Student's Answer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.answers && result.answers.length > 0 ? (
                                    result.answers.map((answer) => (
                                        <tr key={answer.question_id}>
                                            <td className="fw-bold">{answer.question_id}</td>
                                            <td>{answer.question}</td>
                                            <td>
                                                <span className="badge" style={{ backgroundColor: '#06b6d4', color: 'white' }}>
                                                    {answer.user_answer}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center text-muted py-4">
                                            No answer details available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
