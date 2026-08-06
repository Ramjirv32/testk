'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Certificate from '@/components/Certificate';
import Link from 'next/link';

function CertificateContent() {
    const searchParams = useSearchParams();

    const testType = searchParams.get('type') as 'MVTI' | 'Cognitive' | 'Psychometric';
    const userName = searchParams.get('name') || '';
    const score = parseInt(searchParams.get('score') || '0');
    const maxScore = parseInt(searchParams.get('maxScore') || '0');
    const date = searchParams.get('date') || new Date().toISOString();
    const id = searchParams.get('id') || '';
    const mbtiType = searchParams.get('mbtiType') || undefined;

    if (!testType || !userName || !score || !maxScore) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf4ec' }}>
                <div className="text-center">
                    <p style={{ color: '#6b7280', fontSize: '18px', marginBottom: '20px' }}>
                        Invalid certificate parameters
                    </p>
                    <Link
                        href="/user-dashboard"
                        style={{
                            display: 'inline-block',
                            padding: '12px 32px',
                            backgroundColor: '#9a3197',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '600'
                        }}
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#faf4ec', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
                        marginBottom: '30px',
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
                    display: 'flex',
                    justifyContent: 'center',
                    transform: 'scale(0.7)',
                    transformOrigin: 'top center'
                }}>
                    <Certificate
                        userName={userName}
                        testType={testType}
                        score={score}
                        maxScore={maxScore}
                        completedDate={date}
                        certificateId={id}
                        mbtiType={mbtiType}
                    />
                </div>
            </div>
        </div>
    );
}

export default function CertificatePage() {
    return (
        <Suspense fallback={
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
                    <div style={{ color: '#9a3197', fontSize: '18px', fontWeight: '600' }}>Loading Certificate...</div>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        }>
            <CertificateContent />
        </Suspense>
    );
}
