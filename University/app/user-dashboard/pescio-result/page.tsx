'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import Certificate from '@/components/Certificate';

interface PESCIOResult {
    id: string;
    user_id: string;
    email: string;
    name: string;
    age: number;
    student_type: string;
    total_score: number;
    max_score: number;
    interpretation: string;
    practical_score: number;
    enterprising_score: number;
    social_score: number;
    creative_score: number;
    investigative_score: number;
    organisational_score: number;
    total_time_spent: number;
    is_completed: boolean;
    completed_at: string;
}

export default function PESCIOResultPage() {
    const router = useRouter();
    const { user, token, isLoading } = useAuth();
    const [result, setResult] = useState<PESCIOResult | null>(null);
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
            const response = await fetch(`${API_URL}/api/pescio/result`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data.result);
            } else {
                alert('No result found');
                router.push('/user-dashboard');
            }
        } catch (error) {
            console.error('Error fetching result:', error);
            router.push('/user-dashboard');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getTopCategories = () => {
        if (!result) return [];

        const categories = [
            { name: 'Practical', score: result.practical_score, key: 'P', color: '#9a3197' },
            { name: 'Enterprising', score: result.enterprising_score, key: 'E', color: '#7c3aed' },
            { name: 'Social', score: result.social_score, key: 'S', color: '#a855f7' },
            { name: 'Creative', score: result.creative_score, key: 'C', color: '#c026d3' },
            { name: 'Investigative', score: result.investigative_score, key: 'I', color: '#d946ef' },
            { name: 'Organisational', score: result.organisational_score, key: 'O', color: '#e879f9' }
        ];

        return categories.sort((a, b) => b.score - a.score);
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf4ec' }}>
                <div style={{ color: '#9a3197', fontSize: '20px', fontWeight: '600' }}>Loading results...</div>
            </div>
        );
    }

    if (!result) {
        return null;
    }

    const percentage = ((result.total_score / result.max_score) * 100).toFixed(1);
    const topCategories = getTopCategories();

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#faf4ec', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#f3e8ff',
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg style={{ width: '48px', height: '48px', color: '#9a3197' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                        PESCIO Test Completed!
                    </h1>
                    <p style={{ fontSize: '16px', color: '#6b7280' }}>
                        Your interest profile has been generated
                    </p>
                </div>

                {}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px', textAlign: 'center' }}>
                        Your Top Interests
                    </h2>

                    {}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {topCategories.slice(0, 3).map((cat, index) => (
                            <div key={cat.key} style={{
                                backgroundColor: cat.color + '15',
                                border: `3px solid ${cat.color}`,
                                borderRadius: '12px',
                                padding: '24px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                                    {index === 0 ? '' : index === 1 ? '' : ''}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                                    {cat.key} - {cat.name}
                                </div>
                                <div style={{ fontSize: '40px', fontWeight: 'bold', color: cat.color }}>
                                    {cat.score}
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: cat.color, marginTop: '8px' }}>
                                    Top {index + 1} Interest
                                </div>
                            </div>
                        ))}
                    </div>

                    {}
                    <div style={{ marginTop: '32px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
                            All Categories
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                            {topCategories.map((cat, index) => (
                                <div key={cat.key} style={{
                                    backgroundColor: index < 3 ? cat.color + '10' : '#f9fafb',
                                    border: index < 3 ? `2px solid ${cat.color}` : '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
                                        {cat.key} - {cat.name}
                                    </div>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: cat.color }}>
                                        {cat.score}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
                        Your Interest Profile
                    </h2>
                    <div style={{
                        backgroundColor: '#f9fafb',
                        borderLeft: '4px solid #9a3197',
                        padding: '16px',
                        borderRadius: '8px'
                    }}>
                        <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.6' }}>
                            {result.interpretation}
                        </p>
                    </div>
                </div>

                {}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
                        Test Details
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Questions Answered</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>36</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Time Spent</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{formatTime(result.total_time_spent)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Completed On</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                                {new Date(result.completed_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {}
            {showCertificate && result ? (
                <div style={{ marginTop: '0' }}>
                    <Certificate
                        userName={result.name}
                        testType="PESCIO"
                        score={result.total_score}
                        maxScore={result.max_score}
                        completedDate={result.completed_at}
                        certificateId={result.id}
                        topCategories={topCategories}
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
                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                    <button
                        onClick={() => setShowCertificate(true)}
                        style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '16px 48px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            transition: 'transform 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                         View & Download Certificate
                    </button>
                </div>
            )}

            {}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                    href="/user-dashboard"
                    style={{
                        display: 'inline-block',
                        backgroundColor: '#9a3197',
                        color: 'white',
                        padding: '16px 32px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(154, 49, 151, 0.3)',
                        transition: 'transform 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    ← Back to Dashboard
                </Link>
            </div>
        </div>

    );
}
