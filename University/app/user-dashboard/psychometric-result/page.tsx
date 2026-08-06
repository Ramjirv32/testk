'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import Certificate from '@/components/Certificate';

const TrophyIcon = () => (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);

interface Result {
    id: string;
    name: string;
    age: number;
    student_type: string;
    total_score: number;
    max_score: number;
    percentage: number;
    interpretation: string;
    certificate_url: string;
    total_time_spent: number;
    completed_at: string;
    answers: Array<{
        question_id: number;
        question: string;
        selected_option: number;
        score: number;
    }>;
}

export default function PsychometricResultPage() {
    const router = useRouter();
    const { user, token, isLoading } = useAuth();
    const [result, setResult] = useState<Result | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCertificate, setShowCertificate] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && token) {
            fetchResult();
        }
    }, [user, token, isLoading]);

    const fetchResult = async () => {
        try {
            const response = await fetch(`${API_URL}/api/psychometric/result`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data.result);
            } else {
                router.push('/user-dashboard/psychometric');
            }
        } catch (error) {
            console.error('Error fetching result:', error);
            router.push('/user-dashboard/psychometric');
        } finally {
            setLoading(false);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf4ec' }}>
                <div className="text-center">
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid #e5e7eb',
                        borderTop: '4px solid #9a3197',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <div style={{ color: '#9a3197', fontSize: '18px', fontWeight: '600' }}>Loading Results...</div>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!result) {
        return null;
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#faf4ec', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#9a3197' }}>
                        <TrophyIcon />
                    </div>
                    <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#9a3197', marginBottom: '12px' }}>
                        Psychometric Test Complete!
                    </h1>
                    <p style={{ fontSize: '16px', color: '#6b7280' }}>
                        Your Psychometric Assessment Results
                    </p>
                </div>

                {}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    marginBottom: '32px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '72px',
                        fontWeight: 'bold',
                        color: '#9a3197',
                        marginBottom: '8px'
                    }}>
                        {result.total_score}
                    </div>
                    <div style={{ fontSize: '20px', color: '#6b7280', marginBottom: '16px' }}>
                        out of {result.max_score} points ({result.percentage.toFixed(1)}%)
                    </div>

                    {}
                    <div style={{
                        display: 'inline-block',
                        padding: '8px 24px',
                        borderRadius: '20px',
                        backgroundColor: result.total_score >= 60 ? '#dcfce7' :
                            result.total_score >= 45 ? '#dbeafe' :
                                result.total_score >= 30 ? '#fef9c3' : '#fee2e2',
                        color: result.total_score >= 60 ? '#166534' :
                            result.total_score >= 45 ? '#1e40af' :
                                result.total_score >= 30 ? '#854d0e' : '#991b1b',
                        fontWeight: 'bold',
                        fontSize: '14px'
                    }}>
                        {result.total_score >= 60 ? 'Highly Developed' :
                            result.total_score >= 45 ? 'Moderately Developed' :
                                result.total_score >= 30 ? 'Average Range' : 'Needs Improvement'}
                    </div>
                </div>

                {}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    marginBottom: '32px'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px', textAlign: 'center' }}>
                         Assessment Analysis
                    </h2>
                    <div style={{
                        backgroundColor: '#f9fafb',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '2px solid #e5e7eb'
                    }}>
                        <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#374151', marginBottom: 0 }}>
                            {result.interpretation}
                        </p>
                    </div>
                </div>

                {}
                {showCertificate && result ? (
                    <div style={{ marginTop: '0' }}>
                        <Certificate
                            userName={result.name}
                            testType="Psychometric"
                            score={result.total_score}
                            maxScore={result.max_score}
                            completedDate={result.completed_at}
                            certificateId={result.id}
                        />
                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                            <button
                                onClick={() => setShowCertificate(false)}
                                style={{
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    padding: '12px 32px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                Hide Certificate
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        marginBottom: '32px',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
                             Your Certificate
                        </h2>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                            View and download your psychometric test completion certificate
                        </p>
                        <button
                            onClick={() => setShowCertificate(true)}
                            style={{
                                display: 'inline-block',
                                padding: '12px 32px',
                                backgroundColor: '#9a3197',
                                color: 'white',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '16px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            View & Download Certificate
                        </button>
                    </div>
                )}

                {}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    marginBottom: '32px'
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
                        Test Details
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Questions Answered</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>15</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Time Spent</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                                {Math.floor(result.total_time_spent / 60)}m {result.total_time_spent % 60}s
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Completed On</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                                {new Date(result.completed_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <Link
                        href="/user-dashboard"
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#9a3197',
                            color: 'white',
                            padding: '16px 48px',
                            borderRadius: '50px',
                            textDecoration: 'none',
                            fontSize: '18px',
                            fontWeight: '600',
                            boxShadow: '0 4px 12px rgba(154, 49, 151, 0.3)',
                            transition: 'transform 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
