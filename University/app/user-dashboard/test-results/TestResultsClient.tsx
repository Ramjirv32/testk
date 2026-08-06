'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import { getMBTIDescription } from '@/lib/mbtiDescriptions';

interface UserAnswer {
    question_id: number;
    question: string;
    selected_option: number;
    correct_option: number;
    is_correct: boolean;
}

interface TestResult {
    id: string;
    test_type: string;
    total_score: number;
    max_score: number;
    percentage: number;
    completed_at: string;
    answers: UserAnswer[];
    bookmarked_count: number;
    reviewed_count: number;
    hints_used_count: number;
}

const CheckCircleIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XCircleIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default function TestResultsClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, token, isLoading } = useAuth();
    const [result, setResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(true);

    const resultId = searchParams.get('id');
    const testType = searchParams.get('type');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && token && resultId && testType) {
            fetchTestResult();
        }
    }, [user, token, isLoading, resultId, testType]);

    const fetchTestResult = async () => {
        try {
            const response = await fetch(`${API_URL}/api/test/user-results`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const foundResult = data.results?.find((r: TestResult) => r.id === resultId);
                if (foundResult) {
                    setResult(foundResult);
                }
            }
        } catch (error) {
            console.error('Error fetching test result:', error);
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
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf4ec' }}>
                <div className="text-center">
                    <p style={{ color: '#6b7280', fontSize: '18px' }}>Test result not found</p>
                    <Link href="/user-dashboard" style={{
                        display: 'inline-block',
                        marginTop: '20px',
                        padding: '10px 24px',
                        backgroundColor: '#9a3197',
                        color: 'white',
                        borderRadius: '50px',
                        textDecoration: 'none',
                        fontWeight: '600'
                    }}>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const optionLabels = ['A', 'B', 'C', 'D', 'E'];

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#faf4ec', padding: '24px 20px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px' }}>
                {}
                <Link
                    href="/user-dashboard"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#9a3197',
                        color: 'white',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '14px',
                        marginBottom: '20px',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7c2878'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9a3197'}
                >
                    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                </Link>

                {}
                <div style={{
                    backgroundColor: '#9a3197',
                    borderRadius: '12px',
                    padding: '32px',
                    marginBottom: '24px',
                    color: 'white',
                    textAlign: 'center'
                }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>
                        {result.test_type === 'mvti' ? 'MBTI Test Results' : 'Cognitive Test Results'}
                    </h1>
                    {result.test_type === 'mvti' && (result as any).mbti_type ? (
                        <>
                            <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '12px' }}>
                                Your Personality Type
                            </div>
                            <div style={{ fontSize: '64px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '6px' }}>
                                {(result as any).mbti_type}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '12px' }}>
                                {result.total_score} out of {result.max_score} questions answered
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
                                {result.percentage.toFixed(1)}%
                            </div>
                            <div style={{ fontSize: '18px', opacity: 0.9 }}>
                                {result.total_score} out of {result.max_score} correct
                            </div>
                        </>
                    )}
                    <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '12px' }}>
                        Completed on {new Date(result.completed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>

                {}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                }}>
                    {[
                        { label: 'Bookmarked', value: result.bookmarked_count, color: '#dd6236' },
                        { label: 'Reviewed', value: result.reviewed_count, color: '#f59e0b' },
                        { label: 'Hints Used', value: result.hints_used_count, color: '#9a3197' }
                    ].map((stat, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '16px',
                                textAlign: 'center',
                                border: `2px solid ${stat.color}`
                            }}
                        >
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {}
                {result.test_type === 'mvti' && (result as any).mbti_type && (
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px', textAlign: 'center' }}>
                            Your Personality Profile
                        </h2>

                        <div style={{
                            background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                            borderRadius: '16px',
                            padding: '32px',
                            textAlign: 'center',
                            marginBottom: '24px',
                            border: '3px solid #9a3197'
                        }}>
                            <div style={{ fontSize: '80px', marginBottom: '16px' }}>
                                {getMBTIDescription((result as any).mbti_type).icon}
                            </div>
                            <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '12px' }}>
                                Your MBTI Personality Type
                            </div>
                            <div style={{ fontSize: '80px', fontWeight: 'bold', color: '#9a3197', letterSpacing: '8px', marginBottom: '8px' }}>
                                {(result as any).mbti_type}
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '600', color: '#581c87', marginBottom: '16px' }}>
                                {getMBTIDescription((result as any).mbti_type).title}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                Based on your responses to 70 questions
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                            marginBottom: '24px'
                        }}>
                            {[
                                { letter: (result as any).mbti_type[0], pair: 'E/I', meaning: (result as any).mbti_type[0] === 'E' ? 'Extraversion' : 'Introversion' },
                                { letter: (result as any).mbti_type[1], pair: 'S/N', meaning: (result as any).mbti_type[1] === 'S' ? 'Sensing' : 'Intuition' },
                                { letter: (result as any).mbti_type[2], pair: 'T/F', meaning: (result as any).mbti_type[2] === 'T' ? 'Thinking' : 'Feeling' },
                                { letter: (result as any).mbti_type[3], pair: 'J/P', meaning: (result as any).mbti_type[3] === 'J' ? 'Judging' : 'Perceiving' }
                            ].map((dimension, index) => (
                                <div
                                    key={index}
                                    style={{
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        border: '2px solid #9a3197',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#9a3197', marginBottom: '8px' }}>
                                        {dimension.letter}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                        {dimension.pair}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                        {dimension.meaning}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            backgroundColor: '#ede4d3',
                            borderRadius: '12px',
                            padding: '24px',
                            border: '2px solid #dd6236',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#92400e', marginBottom: '16px' }}>
                                {getMBTIDescription((result as any).mbti_type).title}
                            </h3>
                            <p style={{ fontSize: '15px', color: '#92400e', lineHeight: '1.8', marginBottom: '20px' }}>
                                {getMBTIDescription((result as any).mbti_type).description}
                            </p>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <svg style={{ width: '20px', height: '20px', color: '#92400e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#92400e', margin: 0 }}>
                                        Your Strengths
                                    </h4>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {getMBTIDescription((result as any).mbti_type).strengths.map((strength: string, idx: number) => (
                                        <span key={idx} style={{
                                            backgroundColor: '#9a3197',
                                            color: 'white',
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                        }}>
                                            {strength}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <svg style={{ width: '20px', height: '20px', color: '#92400e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#92400e', margin: 0 }}>
                                        Suggested Careers
                                    </h4>
                                </div>
                                <ul style={{ paddingLeft: '20px', color: '#92400e', fontSize: '14px', lineHeight: '2', margin: 0 }}>
                                    {getMBTIDescription((result as any).mbti_type).careers.map((career: string, idx: number) => (
                                        <li key={idx}>{career}</li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <svg style={{ width: '20px', height: '20px', color: '#92400e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#92400e', margin: 0 }}>
                                        Famous People with Your Type
                                    </h4>
                                </div>
                                <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
                                    {getMBTIDescription((result as any).mbti_type).famous.join(' • ')}
                                </p>
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: '#f3e8ff',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '2px solid #9a3197'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <svg style={{ width: '24px', height: '24px', color: '#581c87', flexShrink: 0, marginTop: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <div style={{ fontSize: '14px', color: '#581c87', lineHeight: '1.6' }}>
                                    <strong>About Your Results:</strong><br />
                                    Your MBTI personality type is determined by your preferences across four dimensions.
                                    This assessment helps you understand how you perceive the world and make decisions.
                                    Your responses have been securely stored and are available for review by authorized administrators only.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {}
                <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {}
                    <Link
                        href={`/user-dashboard/certificate?type=${result.test_type === 'mvti' ? 'MVTI' : 'Cognitive'}&name=${encodeURIComponent(user?.name || 'Student')}&score=${result.total_score}&maxScore=${result.max_score}&date=${result.completed_at}&id=${result.id}${result.test_type === 'mvti' && (result as any).mbti_type ? `&mbtiType=${(result as any).mbti_type}` : ''}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 32px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            borderRadius: '50px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '15px',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                        }}
                    >
                        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Download Certificate
                    </Link>

                    <Link
                        href="/user-dashboard"
                        style={{
                            display: 'inline-block',
                            padding: '12px 32px',
                            backgroundColor: '#9a3197',
                            color: 'white',
                            borderRadius: '50px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '15px',
                            boxShadow: '0 4px 12px rgba(154, 49, 151, 0.3)',
                            transition: 'all 0.3s ease'
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
